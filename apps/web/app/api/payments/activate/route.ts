import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { provisionProxyAccess } from "@/lib/provision-proxy";
import { getAvailableConnection } from "@/lib/get-available-connection";
import { createQuotaManager } from "@/lib/quota-manager";
import {
  sendProvisioningEmails,
  sendConnectionConfigNeededEmail,
} from "@/lib/send-provisioning-emails";

// POST - Manually activate a payment (for testing/development ONLY)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow in development mode
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.ALLOW_MANUAL_ACTIVATION === "true";

    if (!isDevelopment) {
      return NextResponse.json(
        {
          success: false,
          error: "Manual activation is only available in development mode",
        },
        { status: 403 }
      );
    }

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

    // Parse request body
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: "order_id is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the order belongs to the user
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, plan:plans(*)")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if already active
    if (order.status === "active") {
      return NextResponse.json({
        success: true,
        message: "Order is already active",
        order,
      });
    }

    // Initialize quota manager
    const quotaManager = createQuotaManager(supabaseAdmin);

    // Check quota availability
    const quotaCheck = await quotaManager.checkAvailability(
      order.quantity || 1
    );
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
      user.id,
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

    // If activating a paid plan, deactivate all free trial orders
    if (order.total_amount > 0) {
      const { error: deactivateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "cancelled",
          expires_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("total_amount", 0)
        .eq("status", "active");

      if (deactivateError) {
        console.log(
          "Warning: Could not deactivate free trial:",
          deactivateError
        );
      } else {
        console.log("Free trial orders deactivated for user:", user.id);
      }
    }

    // Calculate expiry date using order's metadata.duration_in_days (default 30 days, or 7 days for free trial)
    const expiryDate = new Date();
    const daysToAdd =
      order.total_amount === 0 ? 7 : order.metadata?.duration_in_days || 30;
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);

    // Update payment status if it exists
    const { error: paymentUpdateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        is_final: true,
        paid_at: new Date().toISOString(),
      })
      .eq("order_id", order_id);

    if (paymentUpdateError) {
      console.log(
        "Warning: Could not update payment status:",
        paymentUpdateError
      );
    }

    // Provision connection for the activated order
    let provisionedConnection = null;
    try {
      console.log("Starting connection provisioning for order:", order_id);

      // Get user profile for email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      const userEmail = profile?.email || user.id;

      // Extract rotation settings from order metadata
      const ipChangeEnabled = order.metadata?.ip_change_enabled || false;
      const ipChangeIntervalMinutes =
        order.metadata?.ip_change_interval_minutes || 0;

      // Step 1: Get an available connection using priority-based selection
      const connectionResult = await getAvailableConnection(supabaseAdmin);

      if (!connectionResult.success || !connectionResult.connection) {
        throw new Error(
          `Failed to get available connection: ${connectionResult.error}`
        );
      }

      const selectedConnection = connectionResult.connection;
      console.log("Selected connection:", selectedConnection.id);

      // Get origin for email links
      const origin =
        request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_APP_BASE_URL ||
        "http://localhost:3000";

      // Check if connection is active before proceeding with proxy access
      if (!selectedConnection.isActive) {
        // Update order status to indicate it's being processed manually
        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update({
            status: "processing",
            metadata: {
              ...order.metadata,
              manual_provisioning_required: true,
              connection_id: selectedConnection.id,
              pending_reason: "Connection requires activation",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateError) {
          console.error("Failed to update order status:", updateError);
        }

        // Send email notifications to admins and customer
        await sendProvisioningEmails({
          supabase: supabaseAdmin,
          orderId: order.id,
          userId: user.id,
          userEmail,
          plan: order.plan,
          quantity: order.quantity || 1,
          totalAmount: order.total_amount,
          duration_days: order.metadata?.duration_in_days || 30,
          connectionId: selectedConnection.id,
          origin,
        });

        // Return early with pending status
        return NextResponse.json({
          success: true,
          connection_id: selectedConnection.id,
          status: "pending_manual_provisioning",
          message:
            "Your order is being processed. You will be notified when it's ready.",
        });
      }
      if (selectedConnection.notConfigured) {
        // Notify admin that this connection is sold and needs to be configured
        await sendConnectionConfigNeededEmail({
          supabase: supabaseAdmin,
          orderId: order.id,
          userEmail,
          connectionId: selectedConnection.id,
          origin,
        });
      }
      // Step 2: Provision proxy access using shared function
      const provisionResult = await provisionProxyAccess({
        supabase: supabaseAdmin,
        orderId: order_id,
        userId: user.id,
        userEmail,
        connectionId: selectedConnection.id,
        expiresAt: expiryDate.toISOString(),
        planName: order.plan?.name || "Plan",
        ipChangeEnabled,
        ipChangeIntervalMinutes,
      });

      if (!provisionResult.success) {
        throw new Error(
          `Failed to provision proxy access: ${provisionResult.error || "Unknown error"}`
        );
      }

      provisionedConnection = {
        id: selectedConnection.id,
        http_proxy_access: provisionResult.http_proxy_access,
        socks5_proxy_access: provisionResult.socks5_proxy_access,
      };

      // Step 3: Update order status to active
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "active",
          start_at: new Date().toISOString(),
          expires_at: expiryDate.toISOString(),
          metadata: {
            ...order.metadata,
            connection_id: selectedConnection.id,
          },
        })
        .eq("id", order_id);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw new Error("Failed to update order status");
      }

      console.log("Order activated successfully with proxy access");
    } catch (connectionError: any) {
      console.error("Error provisioning connection:", connectionError);
      return NextResponse.json(
        {
          success: false,
          error:
            connectionError instanceof Error
              ? connectionError.message
              : "Failed to provision connection",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order activated successfully",
      order_id: order_id,
      connection: provisionedConnection,
      expires_at: expiryDate.toISOString(),
    });
  } catch (error) {
    console.error("Error activating payment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
