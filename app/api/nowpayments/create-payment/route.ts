import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const NOWPAYMENTS_API_KEY = process.env.NEXT_PUBLIC_NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";

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
    const { price_amount, price_currency, pay_currency } = body;

    // Validate input
    if (!price_amount || !price_currency || !pay_currency) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (price_amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Minimum deposit amount
    // if (price_amount < 5) {
    //   return NextResponse.json(
    //     { success: false, error: "Minimum deposit amount is $5.00" },
    //     { status: 400 }
    //   );
    // }

    // Check if NowPayments API key is configured
    if (!NOWPAYMENTS_API_KEY) {
      console.error("NOWPAYMENTS_API_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "Payment system not configured" },
        { status: 500 }
      );
    }

    // Create unique order ID for wallet top-up
    const orderId = `topup-${Date.now()}-${user.id}`;

    // Create payment invoice with NowPayments
    const nowPaymentsRequest = {
      price_amount: price_amount,
      price_currency: price_currency.toLowerCase(),
      pay_currency: pay_currency.toLowerCase(),
      order_id: orderId,
      order_description: `Wallet top-up: $${price_amount}`,
      ipn_callback_url: `${
        process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000"
      }/api/webhooks/nowpayments`,
      success_url: `${
        process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000"
      }/dashboard/deposit?payment=success`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000"
      }/dashboard/deposit?payment=cancelled`,
    };

    console.log("Creating NowPayments invoice:", {
      orderId,
      price_amount,
      pay_currency,
    });

    // Call NowPayments API to create invoice
    const nowPaymentsResponse = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": NOWPAYMENTS_API_KEY,
      },
      body: JSON.stringify(nowPaymentsRequest),
    });

    if (!nowPaymentsResponse.ok) {
      const errorData = await nowPaymentsResponse.text();
      console.error("NowPayments API error:", errorData);
      return NextResponse.json(
        { success: false, error: "Failed to create payment invoice" },
        { status: 500 }
      );
    }

    const invoiceData = await nowPaymentsResponse.json();
    console.log("NowPayments invoice created:", invoiceData.id);

    // Return the payment URL
    return NextResponse.json({
      success: true,
      paymentUrl: invoiceData.invoice_url,
      invoiceId: invoiceData.id,
      orderId: orderId,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
