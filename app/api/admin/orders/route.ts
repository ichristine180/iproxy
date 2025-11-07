import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// GET - Fetch all orders (admin only)
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const autoRenew = searchParams.get("auto_renew");
    const search = searchParams.get("search"); // Search by user email, order ID
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const planId = searchParams.get("plan_id");

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build base query with joins
    let query = supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        plan:plans(*),
        payment:payments(*),
        profile:profiles(email, role)
      `,
        { count: 'exact' }
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (autoRenew) {
      query = query.eq("auto_renew", autoRenew === "true");
    }

    if (planId) {
      query = query.eq("plan_id", planId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      // Add one day to include the end date
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      query = query.lt("created_at", endDateTime.toISOString());
    }

    // Search filter (user ID or order ID)
    if (search) {
      // If search looks like an email, search by user_id after getting profile
      // Otherwise search by order ID
      if (search.includes('@')) {
        // Get user ID from profile email
        const { data: searchProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .ilike('email', `%${search}%`)
          .limit(100);

        if (searchProfile && searchProfile.length > 0) {
          const userIds = searchProfile.map(p => p.id);
          query = query.in('user_id', userIds);
        } else {
          // No matching users found, return empty result
          return NextResponse.json({
            success: true,
            orders: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          });
        }
      } else {
        // Search by order ID
        query = query.ilike('id', `%${search}%`);
      }
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      success: true,
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in admin orders GET API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
