import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { provisionProxyAccess } from "@/lib/provision-proxy";
import { createQuotaManager } from "@/lib/quota-manager";

// POST - Manually activate a processing order (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, plan:plans(*)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order is in processing status
    if (order.status !== "processing") {
      return NextResponse.json(
        { error: `Order status is ${order.status}, not processing` },
        { status: 400 }
      );
    }

    // Get the connection ID from metadata
    const connectionId = order.metadata?.connection_id;
    if (!connectionId) {
      return NextResponse.json(
        { error: "No connection ID found in order metadata" },
        { status: 400 }
      );
    }

    // Get user profile for email
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    const userEmail = userProfile?.email || order.user_id;

    // Extract rotation settings from order metadata
    const ipChangeEnabled = order.metadata?.ip_change_enabled || false;
    const ipChangeIntervalMinutes =
      order.metadata?.ip_change_interval_minutes || 0;

    console.log("Activating processing order:", order_id);
    console.log("Connection ID:", connectionId);
    console.log("User Email:", userEmail);

    // Initialize quota manager
    const quotaManager = createQuotaManager(supabaseAdmin);

    // Check if quota was already deducted (has reservation)
    const existingReservation = await quotaManager.getReservationStatus(order_id);

    if (!existingReservation || existingReservation.status !== "confirmed") {
      // No confirmed reservation exists, need to deduct quota
      console.log("No confirmed reservation found, deducting quota...");

      // Check quota availability
      const quotaCheck = await quotaManager.checkAvailability(order.quantity || 1);
      if (!quotaCheck.success) {
        return NextResponse.json(
          {
            success: false,
            error: quotaCheck.error || "Insufficient quota available",
            available: quotaCheck.available,
          },
          { status: 400 }
        );
      }

      // Deduct quota for this order
      const deductResult = await quotaManager.deductQuota(
        order_id,
        order.user_id,
        order.quantity || 1
      );

      if (!deductResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: deductResult.error || "Failed to deduct quota",
          },
          { status: 500 }
        );
      }

      console.log(
        `Quota deducted: ${deductResult.deducted_connections} connection(s), ${deductResult.remaining_quota} remaining`
      );
    } else {
      console.log("Quota already confirmed via reservation:", existingReservation.id);
    }

    // Provision proxy access using shared function
    const provisionResult = await provisionProxyAccess({
      supabase: supabaseAdmin,
      orderId: order_id,
      userId: order.user_id,
      userEmail,
      connectionId,
      expiresAt: order.expires_at,
      planName: order.plan?.name || "Plan",
      ipChangeEnabled,
      ipChangeIntervalMinutes,
    });

    if (!provisionResult.success) {
      throw new Error(
        `Failed to provision proxy access: ${provisionResult.error || "Unknown error"}`
      );
    }

    console.log("Proxy access provisioned successfully");

    // Update order status to active
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "active",
        metadata: {
          ...order.metadata,
          manual_provisioning_required: false,
          manually_activated_by: user.id,
          manually_activated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    console.log("Order activated successfully:", order_id);

    return NextResponse.json({
      success: true,
      message: "Order activated successfully",
      order_id: order_id,
      connection_id: connectionId,
      proxies: {
        http: provisionResult.http_proxy_id,
        socks5: provisionResult.socks5_proxy_id,
      },
    });
  } catch (error) {
    console.error("Error activating order:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
