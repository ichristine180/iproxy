import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET - Fetch user's orders
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // Filter by status

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        plan:plans(*),
        payment:payments(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Check if user has any active orders
    const hasActiveOrder = orders?.some((order: any) => order.status === 'active');

    return NextResponse.json({
      success: true,
      orders: orders || [],
      hasActiveOrder,
    });
  } catch (error) {
    console.error('Error in orders GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new order and initiate payment
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
    const body = await request.json();
    const {
      plan_id,
      quantity = 1,
      pay_currency,
      promo_code,
      ip_change_enabled = false,
      ip_change_interval_minutes = 0
    } = body;

    // Validate required fields
    if (!plan_id) {
      return NextResponse.json(
        { success: false, error: 'plan_id is required' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'quantity must be greater than 0' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch plan details
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

    // Calculate total amount
    const totalAmount = parseFloat(plan.price_usd_month) * quantity;

    // Create invoice via payments API
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_BASE_URL;

    const invoiceResponse = await fetch(`${origin}/api/payments/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        plan_id,
        quantity,
        price_amount: totalAmount,
        price_currency: 'usd',
        pay_currency: pay_currency || 'btc',
        order_description: `${plan.name} - ${quantity} proxy${quantity > 1 ? 'ies' : ''}`,
        promo_code,
        ip_change_enabled,
        ip_change_interval_minutes,
      }),
    });

    const invoiceData = await invoiceResponse.json();

    if (!invoiceData.success) {
      console.error('Failed to create invoice:', invoiceData.error);
      return NextResponse.json(
        { success: false, error: invoiceData.error || 'Failed to create payment invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: invoiceData.order_id,
        plan: {
          id: plan.id,
          name: plan.name,
          channel: plan.channel,
        },
        quantity,
        total_amount: totalAmount,
        status: 'pending',
      },
      payment: {
        invoice_url: invoiceData.invoice_url,
        payment_id: invoiceData.payment_id,
      },
    });
  } catch (error) {
    console.error('Error in orders POST API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
