import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { provisionProxyAccess } from "@/lib/provision-proxy";
import { getAvailableConnection } from "@/lib/get-available-connection";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id: orderId } = await context.params;

    // Check admin auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        plan:plans(*)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "processing") {
      return NextResponse.json(
        { success: false, error: "Order is not in processing status" },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    const userEmail = userProfile?.email || "";

    // Get available connection
    const connectionResult = await getAvailableConnection(supabaseAdmin);

    if (!connectionResult.success || !connectionResult.connection) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get available connection: ${connectionResult.error}`,
        },
        { status: 503 }
      );
    }

    const selectedConnection = connectionResult.connection;

    // Provision proxy
    const expiresAt = new Date(order.expires_at);
    const ipChangeEnabled = order.metadata?.ip_change_enabled || false;
    const ipChangeIntervalMinutes =
      order.metadata?.ip_change_interval_minutes || 0;

    const provisionResult = await provisionProxyAccess({
      supabase: supabaseAdmin,
      orderId: order.id,
      userId: order.user_id,
      userEmail,
      connectionId: selectedConnection.id,
      expiresAt: expiresAt.toISOString(),
      planName: order.plan.name || "Plan",
      ipChangeEnabled,
      ipChangeIntervalMinutes,
    });

    if (!provisionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to provision proxy: ${provisionResult.error}`,
        },
        { status: 500 }
      );
    }

    // Update order status to active
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update order status",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order activated successfully",
      order_id: orderId,
      proxy_id: provisionResult.proxy_id,
    });
  } catch (error: any) {
    console.error("Error activating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
