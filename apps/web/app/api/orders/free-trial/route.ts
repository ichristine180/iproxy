import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// POST - Activate free trial (no payment required)
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
    const { plan_id, quantity = 1 } = body;

    // Validate required fields
    if (!plan_id) {
      return NextResponse.json(
        { success: false, error: 'plan_id is required' },
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

    // Verify this is actually a free trial plan
    if (plan.price_usd_month !== 0) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for free trial plans' },
        { status: 400 }
      );
    }

    // Check if user already has an active free trial or paid plan
    const { data: existingOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending']);

    if (existingOrders && existingOrders.length > 0) {
      // Check if they have any paid plans
      const hasPaidPlan = existingOrders.some(order => order.total_amount > 0);
      if (hasPaidPlan) {
        return NextResponse.json(
          { success: false, error: 'You already have an active paid plan. Free trial is not available.' },
          { status: 400 }
        );
      }

      // Check if they already have a free trial
      const hasFreeTrial = existingOrders.some(order => order.total_amount === 0);
      if (hasFreeTrial) {
        return NextResponse.json(
          { success: false, error: 'You already have an active free trial' },
          { status: 400 }
        );
      }
    }

    // Calculate dates for free trial
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Create order directly with 'active' status (no payment needed)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: plan_id,
        quantity: quantity,
        total_amount: 0,
        status: 'active',
        start_at: startDate.toISOString(),
        expires_at: expiryDate.toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating free trial order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create free trial order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        plan: {
          id: plan.id,
          name: plan.name,
          channel: plan.channel,
        },
        quantity,
        total_amount: 0,
        status: 'active',
        start_at: startDate.toISOString(),
        expires_at: expiryDate.toISOString(),
      },
      message: 'Free trial activated successfully!',
    });
  } catch (error) {
    console.error('Error in free-trial POST API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
