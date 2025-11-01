import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/proxies/[id]/auto-renew
 *
 * Update proxy auto-renew setting
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

    // Update proxy auto-renew setting (RLS ensures user can only update their own)
    const { data: updatedProxy, error: updateError } = await supabase
      .from('proxies')
      .update({ auto_renew })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Proxy not found' },
          { status: 404 }
        );
      }
      console.error('Error updating proxy auto-renew:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update auto-renew setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-renew setting updated successfully',
      proxy: {
        id: updatedProxy.id,
        auto_renew: updatedProxy.auto_renew,
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
