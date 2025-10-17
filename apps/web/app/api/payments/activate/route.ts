import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// POST - Manually activate a payment (for testing/development ONLY)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.ALLOW_MANUAL_ACTIVATION === 'true';

    if (!isDevelopment) {
      return NextResponse.json(
        { success: false, error: 'Manual activation is only available in development mode' },
        { status: 403 }
      );
    }

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
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'order_id is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the order belongs to the user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, plan:plans(*)')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if already active
    if (order.status === 'active') {
      return NextResponse.json(
        { success: true, message: 'Order is already active', order }
      );
    }

    // If activating a paid plan, deactivate all free trial orders
    if (order.total_amount > 0) {
      const { error: deactivateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'cancelled',
          expires_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('total_amount', 0)
        .eq('status', 'active');

      if (deactivateError) {
        console.log('Warning: Could not deactivate free trial:', deactivateError);
      } else {
        console.log('Free trial orders deactivated for user:', user.id);
      }
    }

    // Calculate expiry date (30 days from now, or 7 days for free trial)
    const expiryDate = new Date();
    const daysToAdd = order.total_amount === 0 ? 7 : 30;
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);

    // Update order status to active
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'active',
        start_at: new Date().toISOString(),
        expires_at: expiryDate.toISOString(),
      })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to activate order' },
        { status: 500 }
      );
    }

    // Update payment status if it exists
    const { error: paymentUpdateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        is_final: true,
      })
      .eq('order_id', order_id);

    if (paymentUpdateError) {
      console.log('Warning: Could not update payment status:', paymentUpdateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Order activated successfully',
      order: updatedOrder,
      expires_at: expiryDate.toISOString(),
    });
  } catch (error) {
    console.error('Error activating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
