import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// GET - Fetch single order details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const orderId = id;

    // Fetch order with related data
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        plan:plans(*),
        payment:payments(*),
        profile:profiles(id, email, role, created_at)
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Fetch associated proxies
    const { data: proxies, error: proxiesError } = await supabaseAdmin
      .from("proxies")
      .select("*")
      .eq("user_id", order.user_id)
      .order("created_at", { ascending: false });

    if (proxiesError) {
      console.error("Error fetching proxies:", proxiesError);
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        proxies: proxies || [],
      },
    });
  } catch (error) {
    console.error("Error in admin order detail GET API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
