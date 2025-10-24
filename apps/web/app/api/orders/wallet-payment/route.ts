import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { provisionProxyAccess } from "@/lib/provision-proxy";
import { getAvailableConnection } from "@/lib/get-available-connection";
import { createQuotaManager } from "@/lib/quota-manager";

// POST - Create order and pay with wallet balance
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      plan_id,
      quantity = 1,
      promo_code,
      ip_change_enabled = false,
      ip_change_interval_minutes = 0,
    } = body;

    // Validate required fields
    if (!plan_id) {
      return NextResponse.json(
        { success: false, error: "plan_id is required" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { success: false, error: "quantity must be greater than 0" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = parseFloat(plan.price_usd_month) * quantity;

    // Initialize quota manager
    const quotaManager = createQuotaManager(supabaseAdmin);

    // Check quota availability before proceeding
    const quotaCheck = await quotaManager.checkAvailability(quantity);
    if (!quotaCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.error || 'Insufficient quota available',
          available: quotaCheck.available
        },
        { status: quotaCheck.available === 0 ? 503 : 400 }
      );
    }

    // Get user's wallet balance and ID
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("user_wallet")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(wallet.balance);
    const walletId = wallet.id;

    // Check if user has enough balance
    if (currentBalance < totalAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient wallet balance. You have $${currentBalance.toFixed(2)} but need $${totalAmount.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Start a transaction-like process
    // 1. Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        plan_id: plan_id,
        status: "pending",
        quantity: quantity,
        total_amount: totalAmount,
        currency: "USD",
        metadata: {
          payment_method: "wallet",
          promo_code: promo_code || null,
          ip_change_enabled,
          ip_change_interval_minutes,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    // 2. Reserve and immediately confirm quota (wallet payment is instant)
    const reservationResult = await quotaManager.reserveQuota(
      order.id,
      user.id,
      quantity,
      15 // Still reserve for consistency, but will confirm immediately
    );

    if (!reservationResult.success) {
      console.error('Failed to reserve quota:', reservationResult.error);
      // Rollback: Delete the order
      await supabaseAdmin.from('orders').delete().eq('id', order.id);

      return NextResponse.json(
        {
          success: false,
          error: reservationResult.error || 'Failed to reserve quota',
          available: reservationResult.available
        },
        { status: 400 }
      );
    }

    console.log('Quota reserved for wallet payment:', reservationResult);

    // 3. Deduct from wallet balance
    const newBalance = currentBalance - totalAmount;
    const { error: updateWalletError } = await supabaseAdmin
      .from("user_wallet")
      .update({
        balance: newBalance.toFixed(2),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateWalletError) {
      console.error("Failed to update wallet:", updateWalletError);
      // Rollback: Delete the order and release quota
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      await quotaManager.releaseReservation(order.id);

      return NextResponse.json(
        { success: false, error: "Failed to process payment" },
        { status: 500 }
      );
    }

    // 4. Create wallet transaction record
    const { error: transactionError } = await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        wallet_id: walletId,
        amount: -totalAmount,
        type: "payment",
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `Payment for ${plan.name} - ${quantity} proxy${quantity > 1 ? "ies" : ""}`,
        reference_type: "order",
        reference_id: order.id,
      });

    if (transactionError) {
      console.error("Failed to create transaction record:", transactionError);
      // Continue anyway, as the payment was successful
    }

    // 5. Confirm quota reservation (payment successful)
    const confirmResult = await quotaManager.confirmReservation(order.id);

    if (!confirmResult.success) {
      console.error('Failed to confirm quota reservation:', confirmResult.error);
      // Continue anyway - payment was successful, we can handle this manually
    } else {
      console.log('Quota reservation confirmed:', confirmResult);
    }

    // 6. Create payment record for consistency
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        provider: "wallet",
        amount: totalAmount,
        currency: "USD",
        status: "paid",
        is_final: true,
        paid_at: new Date().toISOString(),
        order_id: order.id,
        metadata: {
          payment_method: "wallet",
          wallet_id: walletId,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
      // Continue anyway, as the payment was successful
    }

    // 7. If activating a paid plan, deactivate all free trial orders
    if (totalAmount > 0) {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "cancelled",
          expires_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("total_amount", 0)
        .eq("status", "active");

      console.log("Free trial orders deactivated for user:", user.id);
    }

    // 8. Calculate start and expiry dates based on plan duration
    const now = new Date().toISOString();
    const durationDays = plan.duration_days || 30;
    const expiresAt = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // 9. Update order status to active with dates
    const { error: activateOrderError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "active",
        start_at: now,
        expires_at: expiresAt,
        updated_at: now,
      })
      .eq("id", order.id);

    if (activateOrderError) {
      console.error("Failed to activate order:", activateOrderError);
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment successful but failed to activate order. Please contact support.",
        },
        { status: 500 }
      );
    }

    console.log(
      "Order activated:",
      order.id,
      "Duration:",
      durationDays,
      "days"
    );

    // 10. Provision proxy for the activated order
    try {
      await provisionProxyForOrder(
        supabaseAdmin,
        order.id,
        user.id,
        expiresAt,
        plan,
        ip_change_enabled,
        ip_change_interval_minutes
      );
    } catch (proxyError: any) {
      console.error("Error provisioning proxy:", proxyError);
      // Don't fail the order, log the error for retry
    }

    return NextResponse.json({
      success: true,
      message: "Payment successful",
      order: {
        id: order.id,
        plan: {
          id: plan.id,
          name: plan.name,
          channel: plan.channel,
        },
        quantity,
        total_amount: totalAmount,
        status: "active",
      },
      wallet: {
        previous_balance: currentBalance,
        new_balance: newBalance,
        amount_deducted: totalAmount,
      },
    });
  } catch (error) {
    console.error("Error in wallet payment API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function provisionProxyForOrder(
  supabase: any,
  orderId: string,
  userId: string,
  expiresAt: string,
  plan: any,
  ipChangeEnabled: boolean,
  ipChangeIntervalMinutes: number
) {
  console.log("Starting connection provisioning for order:", orderId);

  // Step 1: Get user details to fetch email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  const userEmail = profile?.email || userId;

  // Step 2: Get an available connection using priority-based selection
  const connectionResult = await getAvailableConnection(supabase);

  if (!connectionResult.success || !connectionResult.connection) {
    throw new Error(
      `Failed to get available connection: ${connectionResult.error}`
    );
  }

  const selectedConnection = connectionResult.connection;
  console.log("Selected connection:", selectedConnection.id);

  // Step 3: Check if connection is active before proceeding with proxy access
  if (!selectedConnection.isActive) {
    console.log(
      "⚠️ ADMIN NOTIFICATION: Connection is not active, needs manual provisioning"
    );
    console.log("Connection ID:", selectedConnection.id);
    console.log("Order ID:", orderId);
    console.log("User ID:", userId);
    console.log("User Email:", userEmail);

    // Update order status to indicate it's being processed manually
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "processing",
        metadata: {
          manual_provisioning_required: true,
          connection_id: selectedConnection.id,
          pending_reason: "Connection requires activation",
          ip_change_enabled: ipChangeEnabled,
          ip_change_interval_minutes: ipChangeIntervalMinutes,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
    }

    throw new Error(
      "Connection requires activation - order pending manual provisioning"
    );
  }

  if (selectedConnection.notConfigured) {
    console.log(
      "Notify admin that this connection is sold, it needs to be configured"
    );
  }

  // Step 4: Provision proxy access using shared utility
  const provisionResult = await provisionProxyAccess({
    supabase,
    orderId,
    userId,
    userEmail,
    connectionId: selectedConnection.id,
    expiresAt,
    planName: plan.name || "Plan",
    ipChangeEnabled,
    ipChangeIntervalMinutes,
  });

  if (!provisionResult.success) {
    throw new Error(`Failed to provision proxy: ${provisionResult.error}`);
  }

  console.log("Proxy provisioned successfully for order:", orderId);

  return provisionResult;
}
