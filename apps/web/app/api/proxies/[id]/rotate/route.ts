import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { iproxyService } from '@/lib/iproxy-service';

/**
 * POST /api/proxies/[id]/rotate
 *
 * Rotates IP address for a specific proxy and logs the result
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const proxyId = params.id;

    // Fetch the proxy (RLS ensures user can only access their own)
    const { data: proxy, error: proxyError } = await supabase
      .from('proxies')
      .select('*')
      .eq('id', proxyId)
      .single();

    if (proxyError || !proxy) {
      return NextResponse.json(
        { success: false, error: 'Proxy not found' },
        { status: 404 }
      );
    }

    // Check if proxy has a change URL
    if (!proxy.iproxy_change_url) {
      return NextResponse.json(
        { success: false, error: 'Proxy does not have a rotation URL configured' },
        { status: 400 }
      );
    }

    // Update proxy status to 'rotating'
    await supabase
      .from('proxies')
      .update({ status: 'rotating' })
      .eq('id', proxyId);

    // Call iProxy rotation API
    const rotationResult = await iproxyService.rotateIP(proxy.iproxy_change_url);

    // Prepare log entry
    const logEntry = {
      proxy_id: proxyId,
      user_id: user.id,
      old_ip: rotationResult.old_ip || proxy.last_ip,
      new_ip: rotationResult.new_ip || null,
      rotation_type: 'manual' as const,
      status: rotationResult.success ? 'success' as const : 'failed' as const,
      error_message: rotationResult.error || null,
      response_data: rotationResult,
    };

    // Insert rotation log
    const { error: logError } = await supabase
      .from('rotation_logs')
      .insert(logEntry);

    if (logError) {
      console.error('Failed to log rotation:', logError);
    }

    // Update proxy with new IP and status
    const updateData: any = {
      status: rotationResult.success ? 'active' : 'error',
      last_rotated_at: new Date().toISOString(),
    };

    if (rotationResult.new_ip) {
      updateData.last_ip = rotationResult.new_ip;
    }

    await supabase
      .from('proxies')
      .update(updateData)
      .eq('id', proxyId);

    if (!rotationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: rotationResult.error || 'Failed to rotate IP',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'IP rotated successfully',
      old_ip: rotationResult.old_ip,
      new_ip: rotationResult.new_ip,
    });
  } catch (error) {
    console.error('Error rotating proxy IP:', error);

    // Try to update proxy status back to active
    try {
      const supabase = await createClient();
      await supabase
        .from('proxies')
        .update({ status: 'error' })
        .eq('id', params.id);
    } catch (updateError) {
      console.error('Failed to update proxy status:', updateError);
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
