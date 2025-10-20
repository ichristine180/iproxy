import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { iproxyService } from "@/lib/iproxy-service";

const NOWPAYMENTS_IPS = [
  // Current NOWPayments webhook IPs (2025)
  "51.75.77.69",
  "138.201.172.58",
  "65.21.158.36",
  // Legacy AWS IPs (kept for compatibility)
  "52.49.219.70",
  "54.229.170.212",
  "52.208.91.102",
  "54.171.196.196",
  "52.213.104.34",
  "3.248.168.21",
  // IPv6 mapped versions
  "::ffff:51.75.77.69",
  "::ffff:138.201.172.58",
  "::ffff:65.21.158.36",
  "::ffff:52.49.219.70",
  "::ffff:54.229.170.212",
  "::ffff:52.208.91.102",
  "::ffff:54.171.196.196",
  "::ffff:52.213.104.34",
  "::ffff:3.248.168.21",
];

interface NowPaymentsWebhook {
  payment_id: string;
  invoice_id?: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid?: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id?: string;
  outcome_amount?: number;
  outcome_currency?: string;
  payin_extra_id?: string;
  created_at: string;
  updated_at: string;
  burning_percent?: string;
  type?: string;
}

// State machine: Map NowPayments status to internal order status
function mapPaymentStatus(nowPaymentsStatus: string): {
  paymentStatus:
    | "pending"
    | "processing"
    | "paid"
    | "failed"
    | "cancelled"
    | "refunded";
  orderStatus: "pending" | "active" | "expired" | "failed" | "cancelled";
  isFinal: boolean;
} {
  const statusMap: Record<string, ReturnType<typeof mapPaymentStatus>> = {
    // Pending states
    waiting: {
      paymentStatus: "pending",
      orderStatus: "pending",
      isFinal: false,
    },
    confirming: {
      paymentStatus: "pending",
      orderStatus: "pending",
      isFinal: false,
    },

    // Processing states
    confirmed: {
      paymentStatus: "processing",
      orderStatus: "pending",
      isFinal: false,
    },
    sending: {
      paymentStatus: "processing",
      orderStatus: "pending",
      isFinal: false,
    },

    // Success states (final)
    finished: { paymentStatus: "paid", orderStatus: "active", isFinal: true },
    partially_paid: {
      paymentStatus: "paid",
      orderStatus: "active",
      isFinal: true,
    },

    // Failure states (final)
    failed: { paymentStatus: "failed", orderStatus: "failed", isFinal: true },
    expired: { paymentStatus: "failed", orderStatus: "failed", isFinal: true },

    // Cancelled state (final)
    cancelled: {
      paymentStatus: "cancelled",
      orderStatus: "cancelled",
      isFinal: true,
    },

    // Refund state (final)
    refunded: {
      paymentStatus: "refunded",
      orderStatus: "cancelled",
      isFinal: true,
    },
  };

  return (
    statusMap[nowPaymentsStatus] || {
      paymentStatus: "pending",
      orderStatus: "pending",
      isFinal: false,
    }
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let webhookEventId: string | null = null;

  try {
    // Extract client IP
    const clientIp = getClientIp(request);
    console.log("Webhook received from IP:", clientIp);

    // Check IP allow-list (disable in development)
    const skipIpCheck =
      process.env.NODE_ENV === "development" ||
      process.env.SKIP_IP_CHECK === "true";
    if (!skipIpCheck && !isIpAllowed(clientIp)) {
      console.error("Unauthorized IP:", clientIp);
      return NextResponse.json(
        { error: "Unauthorized IP address" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.text();
    const webhook: NowPaymentsWebhook = JSON.parse(body);

    console.log("NowPayments webhook received:", {
      payment_id: webhook.payment_id,
      payment_status: webhook.payment_status,
      order_id: webhook.order_id,
      price_amount: webhook.price_amount,
    });

    // Verify webhook signature
    const signature = request.headers.get("x-nowpayments-sig");
    const signatureOk = verifyWebhookSignature(body, signature);

    if (!signatureOk) {
      console.error("Invalid webhook signature");
    }

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Log webhook event to database (receipts log)
    const { data: webhookEvent, error: webhookLogError } = await supabase
      .from("webhook_events")
      .insert({
        provider: "nowpayments",
        event_type: webhook.payment_status,
        signature_ok: signatureOk,
        payload: webhook,
      })
      .select()
      .single();

    if (webhookLogError) {
      console.error("Error logging webhook event:", webhookLogError);
    } else {
      webhookEventId = webhookEvent?.id;
      console.log("Webhook event logged:", webhookEventId);
    }

    // Process the webhook based on status
    try {
      await processWebhook(supabase, webhook, signatureOk);

      // Mark webhook as processed
      if (webhookEventId) {
        await supabase
          .from("webhook_events")
          .update({ processed_at: new Date().toISOString() })
          .eq("id", webhookEventId);
      }

      console.log(
        "Webhook processed successfully in",
        Date.now() - startTime,
        "ms"
      );
      return NextResponse.json({ status: "success" });
    } catch (processingError: any) {
      console.error("Error processing webhook:", processingError);

      // Log processing error
      if (webhookEventId) {
        // Fetch current retry count
        const { data: currentEvent } = await supabase
          .from("webhook_events")
          .select("retry_count")
          .eq("id", webhookEventId)
          .single();

        await supabase
          .from("webhook_events")
          .update({
            processing_error: processingError.message,
            retry_count: (currentEvent?.retry_count || 0) + 1,
          })
          .eq("id", webhookEventId);
      }

      // Still return 200 to acknowledge receipt
      return NextResponse.json({
        status: "error",
        message: processingError.message,
      });
    }
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processWebhook(
  supabase: any,
  webhook: NowPaymentsWebhook,
  signatureOk: boolean
) {
  // Extract user ID from order_id
  const userId = extractUserIdFromOrderId(webhook.order_id);
  if (!userId) {
    throw new Error(
      `Could not extract user ID from order_id: ${webhook.order_id}`
    );
  }

  // Map payment status using state machine
  const { paymentStatus, orderStatus, isFinal } = mapPaymentStatus(
    webhook.payment_status
  );

  console.log("Status mapping:", {
    nowpayments_status: webhook.payment_status,
    payment_status: paymentStatus,
    order_status: orderStatus,
    is_final: isFinal,
  });

  // Find or create payment record
  let payment = await findPaymentByOrderId(supabase, webhook.order_id);

  if (payment) {
    // Update existing payment
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: paymentStatus,
        is_final: isFinal,
        invoice_uuid: webhook.invoice_id || webhook.payment_id,
        txid: webhook.payment_id,
        payer_currency: webhook.pay_currency,
        signature_ok: signatureOk,
        raw_payload: webhook,
        paid_at:
          isFinal && paymentStatus === "paid"
            ? new Date().toISOString()
            : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw updateError;
    }

    console.log("Payment updated:", payment.id);
  } else {
    // Create new payment record
    const { data: newPayment, error: insertError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        provider: "nowpayments",
        invoice_uuid: webhook.invoice_id || webhook.payment_id,
        amount: webhook.price_amount,
        currency: webhook.price_currency?.toUpperCase() || "USD",
        payer_currency: webhook.pay_currency,
        status: paymentStatus,
        is_final: isFinal,
        txid: webhook.payment_id,
        signature_ok: signatureOk,
        raw_payload: webhook,
        paid_at:
          isFinal && paymentStatus === "paid" ? new Date().toISOString() : null,
        metadata: { order_id: webhook.order_id },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating payment:", insertError);
      throw insertError;
    }

    payment = newPayment;
    console.log("Payment created:", payment.id);
  }

  // Update order status if payment is final and successful (paid or paid_over)
  if (isFinal && paymentStatus === "paid" && payment.order_id) {
    // Get the order to check if it's a paid plan
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("user_id, total_amount")
      .eq("id", payment.order_id)
      .single();

    // If activating a paid plan, deactivate all free trial orders
    if (currentOrder && currentOrder.total_amount > 0) {
      await supabase
        .from("orders")
        .update({
          status: "cancelled",
          expires_at: new Date().toISOString(),
        })
        .eq("user_id", currentOrder.user_id)
        .eq("total_amount", 0)
        .eq("status", "active");

      console.log(
        "Free trial orders deactivated for user:",
        currentOrder.user_id
      );
    }

    // Fetch current order to check if dates need to be set and get plan duration
    const { data: currentOrderData } = await supabase
      .from("orders")
      .select("start_at, expires_at, plan:plans(duration_days)")
      .eq("id", payment.order_id)
      .single();

    const now = new Date().toISOString();
    // Use plan's duration_days or default to 30 days
    const durationDays = currentOrderData?.plan?.duration_days || 30;
    const expiresAt = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        start_at: currentOrderData?.start_at || now,
        expires_at: currentOrderData?.expires_at || expiresAt,
        updated_at: now,
      })
      .eq("id", payment.order_id)
      .eq("status", "pending"); // Only update pending orders

    if (orderError) {
      console.error("Error updating order:", orderError);
      throw orderError;
    }

    console.log(
      "Order activated:",
      payment.order_id,
      "Duration:",
      durationDays,
      "days"
    );

    // Provision proxy for the activated order
    try {
      const finalExpiresAt = currentOrderData?.expires_at || expiresAt;
      await provisionProxyForOrder(
        supabase,
        payment.order_id,
        userId,
        finalExpiresAt
      );
    } catch (proxyError: any) {
      console.error("Error provisioning proxy:", proxyError);
      // Don't throw - order is already activated, log the error for retry
    }
  }

  // If payment failed or cancelled, update order status
  if (
    isFinal &&
    (paymentStatus === "failed" || paymentStatus === "cancelled") &&
    payment.order_id
  ) {
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.order_id)
      .in("status", ["pending"]); // Only update pending orders

    if (orderError) {
      console.error("Error updating order:", orderError);
    }
  }
}

async function provisionProxyForOrder(
  supabase: any,
  orderId: string,
  userId: string,
  expiresAt: string
) {
  console.log("Starting connection provisioning for order:", orderId);

  // Step 1: Get order details with plan info and metadata
  const { data: order, error: orderFetchError } = await supabase
    .from("orders")
    .select("*, plan:plans(*)")
    .eq("id", orderId)
    .single();

  if (orderFetchError || !order) {
    throw new Error(`Failed to fetch order: ${orderFetchError?.message}`);
  }

  // Extract rotation settings from order metadata
  const ipChangeEnabled = order.metadata?.ip_change_enabled || false;
  const ipChangeIntervalMinutes = order.metadata?.ip_change_interval_minutes || 0;

  // Step 2: Get user details to fetch email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  const userEmail = profile?.email || userId;

  // Step 3: Get an available connection from connection_info table
  const { data: availableConnection, error: connectionError } = await supabase
    .from("connection_info")
    .select("*")
    .eq("is_occupied", false)
    .limit(1)
    .single();

  if (connectionError || !availableConnection) {
    throw new Error("No available connections found. Please contact admin");
  }

  console.log("Found available connection:", availableConnection.connection_id);

  // Step 4: Grant proxy access to the connection
  const proxyAccessRequest = {
    listen_service: "http" as const,
    auth_type: "userpass" as const,
    auth: {
      login: `user_${userId.substring(0, 8)}`,
      password: generateSecurePassword(),
    },
    description: `Proxy for ${userEmail} - Order ${orderId}`,
    expires_at: expiresAt,
  };

  console.log(
    "Granting proxy access to connection:",
    availableConnection.connection_id
  );
  const {
    success: proxySuccess,
    proxy: proxyAccess,
    error: proxyError,
  } = await iproxyService.grantProxyAccess(
    availableConnection.connection_id,
    proxyAccessRequest
  );

  if (!proxySuccess || !proxyAccess) {
    throw new Error(
      `Failed to grant proxy access: ${proxyError || "Unknown error"}`
    );
  }

  console.log("Proxy access granted:", proxyAccess.id);

  // Step 5: Update connection settings if IP change is enabled
  if (ipChangeEnabled && ipChangeIntervalMinutes > 0) {
    console.log(
      "Updating connection settings for auto IP rotation:",
      ipChangeIntervalMinutes,
      "minutes"
    );
    const settingsResult = await iproxyService.updateConnectionSettings(
      availableConnection.connection_id,
      {
        ip_change_enabled: true,
        ip_change_interval_minutes: ipChangeIntervalMinutes,
      }
    );

    if (!settingsResult.success) {
      console.error("Failed to update connection settings:", settingsResult.error);
      // Non-critical error, continue with provisioning
    } else {
      console.log("Connection settings updated successfully");
    }
  }

  // Step 6: Format proxy access as IP:PORT:LOGIN:PASSWORD
  const proxyAccessString = `${proxyAccess.ip}:${proxyAccess.port}:${proxyAccess.auth.login}:${proxyAccess.auth.password}`;

  // Step 7: Update connection_info with details and mark as occupied
  const { error: updateError } = await supabase
    .from("connection_info")
    .update({
      client_email: userEmail,
      user_id: userId,
      order_id: orderId,
      proxy_access: proxyAccessString,
      is_occupied: true,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      proxy_id: proxyAccess.id,
    })
    .eq("id", availableConnection.id);

  if (updateError) {
    throw new Error(`Failed to update connection info: ${updateError.message}`);
  }

  console.log(
    "Connection info updated and marked as occupied:",
    availableConnection.id
  );

  // Step 8: Save to proxies table for backward compatibility
  const { data: savedProxy, error: saveError } = await supabase
    .from("proxies")
    .insert({
      user_id: userId,
      order_id: orderId,
      label: `${order.plan?.name || "Plan"} - ${userEmail}`,
      host: proxyAccess.hostname,
      port_http: proxyAccess.listen_service === "http" ? proxyAccess.port : null,
      port_socks5: proxyAccess.listen_service === "socks5" ? proxyAccess.port : null,
      username: proxyAccess.auth.login,
      password_hash: proxyAccess.auth.password,
      status: "active",
      iproxy_connection_id: availableConnection.connection_id,
      expires_at: expiresAt,
      connection_data: proxyAccess,
      last_ip: proxyAccess.ip,
    })
    .select()
    .single();

  if (saveError) {
    console.error(
      "Failed to save to proxies table (non-critical):",
      saveError.message
    );
  } else {
    console.log("Proxy saved to proxies table:", savedProxy.id);
  }

  return {
    connection_info_id: availableConnection.id,
    proxy_id: savedProxy?.id,
    connection_id: availableConnection.connection_id,
    proxy_access: proxyAccessString,
  };
}

// Helper function to generate secure password
function generateSecurePassword(): string {
  const length = 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const byte = randomBytes[i];
    if (byte !== undefined) {
      password += charset[byte % charset.length];
    }
  }

  return password;
}

async function findPaymentByOrderId(supabase: any, orderId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("metadata->>order_id", orderId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error finding payment:", error);
  }

  return data;
}

function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature) {
    console.warn("No signature provided in webhook");
    return false;
  }

  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    console.warn("IPN secret not configured");
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha512", ipnSecret)
      .update(body)
      .digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

function extractUserIdFromOrderId(orderId: string): string | null {
  if (!orderId.startsWith("payment-")) {
    return null;
  }
  const withoutPrefix = orderId.substring(8);
  const timestampMatch = withoutPrefix.match(/^(\d+)-(.+)$/);

  if (timestampMatch) {
    return timestampMatch[2] ?? null;
  }

  return null;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  return "unknown";
}

function isIpAllowed(ip: string): boolean {
  if (ip === "unknown") {
    return false;
  }
  return NOWPAYMENTS_IPS.includes(ip);
}
