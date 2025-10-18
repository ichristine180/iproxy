import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { iproxyService } from '@/lib/iproxy-service';
import bcrypt from 'bcryptjs';

const NOWPAYMENTS_IPS = [
  // Current NOWPayments webhook IPs (2025)
  '51.75.77.69',
  '138.201.172.58',
  '65.21.158.36',
  // Legacy AWS IPs (kept for compatibility)
  '52.49.219.70',
  '54.229.170.212',
  '52.208.91.102',
  '54.171.196.196',
  '52.213.104.34',
  '3.248.168.21',
  // IPv6 mapped versions
  '::ffff:51.75.77.69',
  '::ffff:138.201.172.58',
  '::ffff:65.21.158.36',
  '::ffff:52.49.219.70',
  '::ffff:54.229.170.212',
  '::ffff:52.208.91.102',
  '::ffff:54.171.196.196',
  '::ffff:52.213.104.34',
  '::ffff:3.248.168.21',
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
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  orderStatus: 'pending' | 'active' | 'expired' | 'failed' | 'cancelled';
  isFinal: boolean;
} {
  const statusMap: Record<string, ReturnType<typeof mapPaymentStatus>> = {
    // Pending states
    'waiting': { paymentStatus: 'pending', orderStatus: 'pending', isFinal: false },
    'confirming': { paymentStatus: 'pending', orderStatus: 'pending', isFinal: false },

    // Processing states
    'confirmed': { paymentStatus: 'processing', orderStatus: 'pending', isFinal: false },
    'sending': { paymentStatus: 'processing', orderStatus: 'pending', isFinal: false },

    // Success states (final)
    'finished': { paymentStatus: 'paid', orderStatus: 'active', isFinal: true },
    'partially_paid': { paymentStatus: 'paid', orderStatus: 'active', isFinal: true },

    // Failure states (final)
    'failed': { paymentStatus: 'failed', orderStatus: 'failed', isFinal: true },
    'expired': { paymentStatus: 'failed', orderStatus: 'failed', isFinal: true },

    // Cancelled state (final)
    'cancelled': { paymentStatus: 'cancelled', orderStatus: 'cancelled', isFinal: true },

    // Refund state (final)
    'refunded': { paymentStatus: 'refunded', orderStatus: 'cancelled', isFinal: true },
  };

  return statusMap[nowPaymentsStatus] || {
    paymentStatus: 'pending',
    orderStatus: 'pending',
    isFinal: false,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let webhookEventId: string | null = null;

  try {
    // Extract client IP
    const clientIp = getClientIp(request);
    console.log('Webhook received from IP:', clientIp);

    // Check IP allow-list (disable in development)
    const skipIpCheck = process.env.NODE_ENV === 'development' || process.env.SKIP_IP_CHECK === 'true';
    if (!skipIpCheck && !isIpAllowed(clientIp)) {
      console.error('Unauthorized IP:', clientIp);
      return NextResponse.json(
        { error: 'Unauthorized IP address' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.text();
    const webhook: NowPaymentsWebhook = JSON.parse(body);

    console.log('NowPayments webhook received:', {
      payment_id: webhook.payment_id,
      payment_status: webhook.payment_status,
      order_id: webhook.order_id,
      price_amount: webhook.price_amount,
    });

    // Verify webhook signature
    const signature = request.headers.get('x-nowpayments-sig');
    const signatureOk = verifyWebhookSignature(body, signature);

    if (!signatureOk) {
      console.error('Invalid webhook signature');
    }

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Log webhook event to database (receipts log)
    const { data: webhookEvent, error: webhookLogError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'nowpayments',
        event_type: webhook.payment_status,
        signature_ok: signatureOk,
        payload: webhook,
      })
      .select()
      .single();

    if (webhookLogError) {
      console.error('Error logging webhook event:', webhookLogError);
    } else {
      webhookEventId = webhookEvent?.id;
      console.log('Webhook event logged:', webhookEventId);
    }

    // Process the webhook based on status
    try {
      await processWebhook(supabase, webhook, signatureOk);

      // Mark webhook as processed
      if (webhookEventId) {
        await supabase
          .from('webhook_events')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', webhookEventId);
      }

      console.log('Webhook processed successfully in', Date.now() - startTime, 'ms');
      return NextResponse.json({ status: 'success' });
    } catch (processingError: any) {
      console.error('Error processing webhook:', processingError);

      // Log processing error
      if (webhookEventId) {
        // Fetch current retry count
        const { data: currentEvent } = await supabase
          .from('webhook_events')
          .select('retry_count')
          .eq('id', webhookEventId)
          .single();

        await supabase
          .from('webhook_events')
          .update({
            processing_error: processingError.message,
            retry_count: (currentEvent?.retry_count || 0) + 1,
          })
          .eq('id', webhookEventId);
      }

      // Still return 200 to acknowledge receipt
      return NextResponse.json({ status: 'error', message: processingError.message });
    }
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    throw new Error(`Could not extract user ID from order_id: ${webhook.order_id}`);
  }

  // Map payment status using state machine
  const { paymentStatus, orderStatus, isFinal } = mapPaymentStatus(webhook.payment_status);

  console.log('Status mapping:', {
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
      .from('payments')
      .update({
        status: paymentStatus,
        is_final: isFinal,
        invoice_uuid: webhook.invoice_id || webhook.payment_id,
        txid: webhook.payment_id,
        payer_currency: webhook.pay_currency,
        signature_ok: signatureOk,
        raw_payload: webhook,
        paid_at: isFinal && paymentStatus === 'paid' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      throw updateError;
    }

    console.log('Payment updated:', payment.id);
  } else {
    // Create new payment record
    const { data: newPayment, error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        provider: 'nowpayments',
        invoice_uuid: webhook.invoice_id || webhook.payment_id,
        amount: webhook.price_amount,
        currency: webhook.price_currency?.toUpperCase() || 'USD',
        payer_currency: webhook.pay_currency,
        status: paymentStatus,
        is_final: isFinal,
        txid: webhook.payment_id,
        signature_ok: signatureOk,
        raw_payload: webhook,
        paid_at: isFinal && paymentStatus === 'paid' ? new Date().toISOString() : null,
        metadata: { order_id: webhook.order_id },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating payment:', insertError);
      throw insertError;
    }

    payment = newPayment;
    console.log('Payment created:', payment.id);
  }

  // Update order status if payment is final and successful (paid or paid_over)
  if (isFinal && (paymentStatus === 'paid') && payment.order_id) {
    // Get the order to check if it's a paid plan
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('user_id, total_amount')
      .eq('id', payment.order_id)
      .single();

    // If activating a paid plan, deactivate all free trial orders
    if (currentOrder && currentOrder.total_amount > 0) {
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          expires_at: new Date().toISOString()
        })
        .eq('user_id', currentOrder.user_id)
        .eq('total_amount', 0)
        .eq('status', 'active');

      console.log('Free trial orders deactivated for user:', currentOrder.user_id);
    }

    // Fetch current order to check if dates need to be set
    const { data: currentOrderData } = await supabase
      .from('orders')
      .select('start_at, expires_at')
      .eq('id', payment.order_id)
      .single();

    const now = new Date().toISOString();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        start_at: currentOrderData?.start_at || now,
        expires_at: currentOrderData?.expires_at || thirtyDaysFromNow,
        updated_at: now,
      })
      .eq('id', payment.order_id)
      .eq('status', 'pending'); // Only update pending orders

    if (orderError) {
      console.error('Error updating order:', orderError);
      throw orderError;
    }

    console.log('Order activated:', payment.order_id);

    // Provision proxy for the activated order
    try {
      await provisionProxyForOrder(supabase, payment.order_id, userId, thirtyDaysFromNow);
    } catch (proxyError: any) {
      console.error('Error provisioning proxy:', proxyError);
      // Don't throw - order is already activated, log the error for retry
    }
  }

  // If payment failed or cancelled, update order status
  if (isFinal && (paymentStatus === 'failed' || paymentStatus === 'cancelled') && payment.order_id) {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id)
      .in('status', ['pending']); // Only update pending orders

    if (orderError) {
      console.error('Error updating order:', orderError);
    }
  }
}

async function provisionProxyForOrder(
  supabase: any,
  orderId: string,
  userId: string,
  expiresAt: string
) {
  console.log('Starting proxy provisioning for order:', orderId);

  // Step 1: Get order details with plan info
  const { data: order, error: orderFetchError } = await supabase
    .from('orders')
    .select('*, plan:plans(*)')
    .eq('id', orderId)
    .single();

  if (orderFetchError || !order) {
    throw new Error(`Failed to fetch order: ${orderFetchError?.message}`);
  }

  // Step 2: Get connections from Console API
  console.log('Fetching connections from Console API...');
  const { success: connectionsSuccess, connections, error: connectionsError } =
    await iproxyService.getConsoleConnections();

  if (!connectionsSuccess || connections.length === 0) {
    throw new Error(`Failed to get connections: ${connectionsError || 'No connections available'}`);
  }

  // Step 3: Select a random connection
  const selectedConnection = connections[Math.floor(Math.random() * connections.length)];
  if (!selectedConnection) {
    throw new Error('No connection selected');
  }
  console.log(`Selected connection: ${selectedConnection.id} (${selectedConnection.basic_info.name})`);

  // Step 4: Grant proxy access
  const proxyRequest = {
    listen_service: 'http' as const,
    auth_type: 'userpass' as const,
    description: `Proxy for order ${orderId} - ${order.plan?.name || 'Plan'}`,
    expires_at: expiresAt,
  };

  console.log('Granting proxy access...');
  const { success: proxySuccess, proxy, error: proxyError } =
    await iproxyService.grantProxyAccess(selectedConnection.id, proxyRequest);

  if (!proxySuccess || !proxy) {
    throw new Error(`Failed to grant proxy access: ${proxyError || 'Unknown error'}`);
  }

  console.log('Proxy access granted:', proxy.id);

  // Step 5: Save proxy to database
  const passwordHash = await bcrypt.hash(proxy.auth.password, 10);

  const { data: savedProxy, error: saveError } = await supabase
    .from('proxies')
    .insert({
      user_id: userId,
      label: proxy.description || `Proxy for ${order.plan?.name || 'order'}`,
      host: proxy.hostname,
      port_http: proxy.listen_service === 'http' ? proxy.port : null,
      port_socks5: proxy.listen_service === 'socks5' ? proxy.port : null,
      username: proxy.auth.login,
      password_hash: passwordHash,
      status: 'active',
      iproxy_connection_id: proxy.connection_id,
    })
    .select()
    .single();

  if (saveError) {
    throw new Error(`Failed to save proxy to database: ${saveError.message}`);
  }

  console.log('Proxy saved to database:', savedProxy.id);
  return savedProxy;
}

async function findPaymentByOrderId(supabase: any, orderId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('metadata->>order_id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error finding payment:', error);
  }

  return data;
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.warn('No signature provided in webhook');
    return false;
  }

  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    console.warn('IPN secret not configured');
    return false;
  }

  try {
    // NowPayments uses HMAC-SHA512 for signature verification
    const expectedSignature = crypto
      .createHmac('sha512', ipnSecret)
      .update(body)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

function extractUserIdFromOrderId(orderId: string): string | null {
  // Order_id format: "payment-{timestamp}-{userId}" where userId is a UUID
  // Example: "payment-1759701483198-c740c555-758b-4b16-8ac9-196cd040d580"

  if (!orderId.startsWith('payment-')) {
    return null;
  }

  // Remove "payment-" prefix and find the timestamp
  const withoutPrefix = orderId.substring(8); // Remove "payment-"
  const timestampMatch = withoutPrefix.match(/^(\d+)-(.+)$/);

  if (timestampMatch) {
    return timestampMatch[2] ?? null; // Return the user ID part
  }

  return null;
}

function getClientIp(request: NextRequest): string {
  // Try various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  return 'unknown';
}

function isIpAllowed(ip: string): boolean {
  if (ip === 'unknown') {
    return false;
  }

  // Check if IP is in allow-list
  return NOWPAYMENTS_IPS.includes(ip);
}
