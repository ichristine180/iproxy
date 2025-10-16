import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

interface CreateInvoiceRequest {
  plan_id: string;
  quantity?: number;
  price_amount: number;
  price_currency?: string;
  pay_currency?: string;
  order_description?: string;
}

interface NowPaymentsInvoiceResponse {
  id: string;
  invoice_url: string;
  order_id: string;
  order_description: string;
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
  created_at: string;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateInvoiceRequest = await request.json();
    const {
      plan_id,
      quantity = 1,
      price_amount,
      price_currency = 'usd',
      pay_currency,
      order_description,
    } = body;

    // Validate required fields
    if (!plan_id) {
      return NextResponse.json(
        { success: false, error: 'plan_id is required' },
        { status: 400 }
      );
    }

    if (!price_amount || price_amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid price_amount' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    // Get NowPayments API key
    const apiKey = process.env.NEXT_PUBLIC_NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      console.error('NowPayments API key not configured');
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Use service role client for database operations
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey
    );

    // Verify plan exists
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: plan_id,
        status: 'pending',
        quantity: quantity,
        total_amount: price_amount,
        currency: price_currency.toUpperCase(),
        metadata: {
          pay_currency: pay_currency,
          order_description: order_description,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    console.log('Order created:', order.id);

    // Generate unique order ID for NowPayments
    const nowpaymentsOrderId = `payment-${Date.now()}-${user.id}`;

    // Get the origin for callback URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create invoice with NowPayments
    const invoicePayload = {
      price_amount,
      price_currency,
      ...(pay_currency && { pay_currency }),
      order_id: nowpaymentsOrderId,
      order_description: order_description || `${plan.name} - ${quantity}x proxies`,
      ipn_callback_url: `${origin}/api/webhooks/nowpayments`,
      success_url: `${origin}/dashboard?payment=success&order_id=${order.id}`,
      cancel_url: `${origin}/dashboard?payment=cancelled&order_id=${order.id}`,
    };

    console.log('Creating NowPayments invoice:', invoicePayload);

    const nowPaymentsResponse = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!nowPaymentsResponse.ok) {
      const errorText = await nowPaymentsResponse.text();
      console.error('NowPayments API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to create invoice' },
        { status: 500 }
      );
    }

    const invoiceData: NowPaymentsInvoiceResponse = await nowPaymentsResponse.json();
    console.log('NowPayments invoice created:', invoiceData);

    // Create payment record linked to the order
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        order_id: order.id,
        provider: 'nowpayments',
        invoice_uuid: invoiceData.id,
        amount: price_amount,
        currency: price_currency.toUpperCase(),
        payer_currency: pay_currency,
        status: 'pending',
        is_final: false,
        invoice_url: invoiceData.invoice_url,
        metadata: {
          order_id: nowpaymentsOrderId,
          order_description: order_description,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the request, but log the error
    } else {
      console.log('Payment record created:', payment.id);
    }

    // Return success response with invoice_url
    return NextResponse.json({
      success: true,
      invoice_url: invoiceData.invoice_url,
      order_id: order.id,
      nowpayments_order_id: nowpaymentsOrderId,
      payment_id: payment?.id || null,
      invoice_id: invoiceData.id,
      price_amount: invoiceData.price_amount,
      price_currency: invoiceData.price_currency,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
