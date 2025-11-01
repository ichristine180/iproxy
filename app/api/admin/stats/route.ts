import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// GET - Fetch admin dashboard stats
export async function GET() {
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

    // Fetch total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      console.error("Error fetching users count:", usersError);
    }

    // Fetch all proxies to count by connection
    const { data: allProxies, error: proxiesError } = await supabaseAdmin
      .from("proxies")
      .select("iproxy_connection_id, status");

    if (proxiesError) {
      console.error("Error fetching proxies:", proxiesError);
    }

    // Count unique connections (group by iproxy_connection_id)
    const uniqueConnections = new Set(
      (allProxies || [])
        .filter((p) => p.iproxy_connection_id)
        .map((p) => p.iproxy_connection_id)
    );
    const totalProxies = uniqueConnections.size;

    // Count active unique connections
    const activeUniqueConnections = new Set(
      (allProxies || [])
        .filter((p) => p.iproxy_connection_id && p.status === "active")
        .map((p) => p.iproxy_connection_id)
    );
    const activeProxies = activeUniqueConnections.size;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalProxies,
        activeProxies,
      },
    });
  } catch (error) {
    console.error("Error in admin stats GET API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
