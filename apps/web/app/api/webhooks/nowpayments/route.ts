import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// NowPayments official webhook IPs
// Source: https://documenter.getpostman.com/view/7907941/2s93JusNJt
const NOWPAYMENTS_IPS = [
  '52.49.219.70',
  '54.229.170.212',
  '52.208.91.102',
  '54.171.196.196',
  '52.213.104.34',
  '3.248.168.21',
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
        await supabase
          .from('webhook_events')
          .update({
            processing_error: processingError.message,
            retry_count: supabase.sql`retry_count + 1`,
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
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        start_at: supabase.sql`COALESCE(start_at, NOW())`,
        end_at: supabase.sql`COALESCE(end_at, NOW() + interval '30 days')`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id)
      .eq('status', 'pending'); // Only update pending orders

    if (orderError) {
      console.error('Error updating order:', orderError);
      throw orderError;
    }

    console.log('Order activated:', payment.order_id);
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
    return timestampMatch[2]; // Return the user ID part
  }

  return null;
}

function getClientIp(request: NextRequest): string {
  // Try various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
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
