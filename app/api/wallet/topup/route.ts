import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// POST - Initiate wallet top-up
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
    const { amount } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Minimum top-up amount
    if (amount < 1) {
      return NextResponse.json(
        { success: false, error: 'Minimum top-up amount is $1.00' },
        { status: 400 }
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userEmail = profile.email;

    // Use service role for creating orders
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create a wallet top-up order
    const { data: topUpOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: null, // No plan for wallet top-ups
        status: 'pending',
        quantity: 1,
        total_amount: amount,
        currency: 'USD',
        metadata: {
          type: 'wallet_topup',
          amount: amount,
          email: userEmail,
        },
      })
      .select()
      .single();

    if (orderError || !topUpOrder) {
      console.error('Failed to create top-up order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create top-up order' },
        { status: 500 }
      );
    }

    console.log('Created wallet top-up order:', topUpOrder.id);

    // Here you would integrate with your payment provider (e.g., NowPayments)
    // For now, we'll return the order details
    // In production, you'd create a payment link and return it

    // TODO: Integrate with NowPayments or other payment provider
    const paymentUrl = `/api/payments/create?order_id=${topUpOrder.id}&amount=${amount}`;

    return NextResponse.json({
      success: true,
      message: 'Top-up order created successfully',
      order: {
        id: topUpOrder.id,
        amount: amount,
        currency: 'USD',
        status: 'pending',
      },
      paymentUrl: paymentUrl, // This would be the actual payment provider URL
    });
  } catch (error) {
    console.error('Error in wallet top-up API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
