import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

    // 2. Deduct from wallet balance
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
      // Rollback: Delete the order
      await supabaseAdmin.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        { success: false, error: "Failed to process payment" },
        { status: 500 }
      );
    }

    // 3. Create wallet transaction record
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

    // 4. Update order status to active (payment completed)
    const { error: activateOrderError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
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

    // 5. Provision proxies for the order
    // Call the provision API endpoint
    try {
      const origin =
        request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_BASE_URL;
      const provisionResponse = await fetch(`${origin}/api/proxies/provision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order.id,
          user_id: user.id,
          plan_id: plan_id,
          quantity: quantity,
          channel: plan.channel,
          rotation_enabled: ip_change_enabled,
          rotation_interval_minutes: ip_change_interval_minutes,
        }),
      });

      const provisionData = await provisionResponse.json();

      if (!provisionData.success) {
        console.error("Failed to provision proxies:", provisionData.error);
        // Don't fail the order, but log the error
      }
    } catch (provisionError) {
      console.error("Error calling provision API:", provisionError);
      // Don't fail the order, but log the error
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
