import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/orders/[id]/auto-renew
 *
 * Update order auto-renew setting
 * - auto_renew: boolean
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { auto_renew } = body;

    // Validate auto_renew
    if (typeof auto_renew !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'auto_renew must be a boolean value' },
        { status: 400 }
      );
    }

    // Update order auto-renew setting (RLS ensures user can only update their own)
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ auto_renew })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }
      console.error('Error updating order auto-renew:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update auto-renew setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-renew setting updated successfully',
      order: {
        id: updatedOrder.id,
        auto_renew: updatedOrder.auto_renew,
      },
    });
  } catch (error) {
    console.error('Error in auto-renew update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
