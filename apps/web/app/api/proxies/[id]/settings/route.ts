import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { iproxyService } from '@/lib/iproxy-service';

/**
 * PATCH /api/proxies/[id]/settings
 *
 * Update proxy rotation settings
 * - rotation_mode: 'manual' | 'scheduled' | 'api'
 * - rotation_interval_min: number (required when mode is 'scheduled')
 * - auto_rotation_enabled: boolean (calls iProxy API)
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
    const { rotation_mode, rotation_interval_min, auto_rotation_enabled } = body;

    // Get proxy to check for connection ID
    const { data: proxy, error: proxyError } = await supabase
      .from('proxies')
      .select('iproxy_connection_id')
      .eq('id', id)
      .single();

    if (proxyError || !proxy) {
      return NextResponse.json(
        { success: false, error: 'Proxy not found' },
        { status: 404 }
      );
    }

    // Validate rotation_mode
    const validModes = ['manual', 'scheduled', 'api'];
    if (rotation_mode && !validModes.includes(rotation_mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid rotation mode. Must be: manual, scheduled, or api' },
        { status: 400 }
      );
    }

    // Validate rotation_interval_min
    if (rotation_interval_min !== undefined && rotation_interval_min !== null) {
      if (typeof rotation_interval_min !== 'number' || rotation_interval_min < 1) {
        return NextResponse.json(
          { success: false, error: 'rotation_interval_min must be a positive number' },
          { status: 400 }
        );
      }
    }

    // If mode is scheduled, interval is required
    if (rotation_mode === 'scheduled' && !rotation_interval_min) {
      return NextResponse.json(
        { success: false, error: 'rotation_interval_min is required when rotation_mode is scheduled' },
        { status: 400 }
      );
    }

    // If auto_rotation settings changed, update via iProxy API
    if (auto_rotation_enabled !== undefined && proxy.iproxy_connection_id) {
      const iproxySettings = {
        ip_change_enabled: auto_rotation_enabled,
        ip_change_interval_minutes: auto_rotation_enabled ? (rotation_interval_min || 5) : 0,
      };

      const { success: apiSuccess, error: apiError } = await iproxyService.updateConnectionSettings(
        proxy.iproxy_connection_id,
        iproxySettings
      );

      if (!apiSuccess) {
        console.error('Failed to update iProxy connection settings:', apiError);
        return NextResponse.json(
          { success: false, error: `Failed to update auto-rotation: ${apiError}` },
          { status: 500 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (rotation_mode !== undefined) {
      updateData.rotation_mode = rotation_mode;
    }
    if (rotation_interval_min !== undefined) {
      updateData.rotation_interval_min = rotation_interval_min;
    }

    // If mode is changed from scheduled to manual/api, clear the interval
    if (rotation_mode && rotation_mode !== 'scheduled' && rotation_interval_min === undefined) {
      updateData.rotation_interval_min = null;
    }

    // Update proxy settings (RLS ensures user can only update their own)
    const { data: updatedProxy, error: updateError } = await supabase
      .from('proxies')
      .update(updateData)
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
      console.error('Error updating proxy settings:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update proxy settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Proxy settings updated successfully',
      proxy: {
        id: updatedProxy.id,
        rotation_mode: updatedProxy.rotation_mode,
        rotation_interval_min: updatedProxy.rotation_interval_min,
        auto_rotation_enabled: auto_rotation_enabled !== undefined ? auto_rotation_enabled : null,
      },
    });
  } catch (error) {
    console.error('Error in proxy settings update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
