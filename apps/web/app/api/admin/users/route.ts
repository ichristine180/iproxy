import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// GET - Fetch all users with pagination and filters (admin only)
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
    const search = searchParams.get("search"); // Search by email
    const role = searchParams.get("role"); // Filter by role
    const activeStatus = searchParams.get("active"); // Filter by active status (true/false)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build base query
    let query = supabaseAdmin
      .from("profiles")
      .select(
        `
        *
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply search filter
    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    // Apply role filter
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    // Execute the query to get profiles
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data: profiles, error: profilesError, count } = await query.range(from, to);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Fetch active proxies for all users
    const userIds = profiles.map((p) => p.id);
    const { data: proxies, error: proxiesError } = await supabaseAdmin
      .from("proxies")
      .select("user_id, status")
      .in("user_id", userIds)
      .eq("status", "active");

    if (proxiesError) {
      console.error("Error fetching proxies:", proxiesError);
    }

    // Create a map of user_id to active proxy count
    const activeProxiesMap = new Map<string, number>();
    (proxies || []).forEach((proxy) => {
      const count = activeProxiesMap.get(proxy.user_id) || 0;
      activeProxiesMap.set(proxy.user_id, count + 1);
    });

    // Enhance profiles with active status
    let users = profiles.map((profile) => ({
      ...profile,
      isActive: activeProxiesMap.has(profile.id),
      activeProxiesCount: activeProxiesMap.get(profile.id) || 0,
    }));

    // Apply active status filter if specified
    if (activeStatus !== null && activeStatus !== "all") {
      const isActiveFilter = activeStatus === "true";
      users = users.filter((u) => u.isActive === isActiveFilter);
    }

    // Recalculate total and pages if we filtered by active status client-side
    const totalUsers = activeStatus !== null && activeStatus !== "all" ? users.length : count || 0;
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in admin users GET API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
