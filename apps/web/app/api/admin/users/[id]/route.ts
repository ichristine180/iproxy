import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// GET - Fetch single user details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = params.id;

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch user's proxies
    const { data: proxies, error: proxiesError } = await supabaseAdmin
      .from("proxies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (proxiesError) {
      console.error("Error fetching proxies:", proxiesError);
    }

    // Fetch user's orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        plan:plans(name, channel),
        payment:payments(status, amount)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
    }

    // Calculate stats
    const activeProxies = (proxies || []).filter((p) => p.status === "active");
    const totalOrders = orders?.length || 0;
    const activeOrders = (orders || []).filter((o) => o.status === "active").length;

    return NextResponse.json({
      success: true,
      user: {
        ...userProfile,
        proxies: proxies || [],
        orders: orders || [],
        stats: {
          totalProxies: proxies?.length || 0,
          activeProxies: activeProxies.length,
          totalOrders,
          activeOrders,
        },
      },
    });
  } catch (error) {
    console.error("Error in admin user detail GET API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
