import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { iproxyService } from '@/lib/iproxy-service';

/**
 * POST /api/proxies/[id]/grant-access
 * Grant proxy access to a connection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proxyId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get proxy details
    const { data: proxy, error: proxyError } = await supabase
      .from('proxies')
      .select('*, order:orders(plan:plans(*))')
      .eq('id', proxyId)
      .eq('user_id', user.id)
      .single();

    if (proxyError || !proxy) {
      return NextResponse.json(
        { success: false, error: 'Proxy not found' },
        { status: 404 }
      );
    }

    // Check if already has access (credentials exist)
    if (proxy.username && proxy.password_hash) {
      return NextResponse.json({
        success: true,
        message: 'Proxy access already granted',
        proxy: {
          id: proxy.id,
          host: proxy.host,
          port_http: proxy.port_http,
          port_socks5: proxy.port_socks5,
        },
      });
    }

    // Check if connection exists
    if (!proxy.iproxy_connection_id) {
      return NextResponse.json(
        { success: false, error: 'No connection found for this proxy' },
        { status: 400 }
      );
    }

    // Get connection details to check if it has an active plan
    const { success: connSuccess, connection, error: connError } =
      await iproxyService.getConnection(proxy.iproxy_connection_id);

    if (!connSuccess || !connection) {
      return NextResponse.json(
        { success: false, error: `Failed to get connection details: ${connError}` },
        { status: 500 }
      );
    }

    // Check if connection has plan info
    // TODO: We need to activate/purchase a plan for this connection
    // The iProxy Console API requires connections to have an active tariff/plan
    // before granting proxy access. Currently we only create the connection
    // but don't activate a plan. This needs to be done in the payment/provisioning flow.
    if (!connection.plan_info || !connection.plan_info.active) {
      console.log('Connection plan_info:', connection.plan_info);
      return NextResponse.json(
        {
          success: false,
          error: 'Connection does not have an active plan.',
          details: 'This connection needs to be activated with a tariff/plan on iProxy.online. Please contact support or check your iProxy.online account.',
        },
        { status: 400 }
      );
    }

    // Grant proxy access via iProxy API
    const proxyRequest = {
      listen_service: 'http' as const,
      auth_type: 'userpass' as const,
      description: `Proxy access for ${proxy.label}`,
      expires_at: proxy.expires_at || undefined,
    };

    const { success: grantSuccess, proxy: grantedProxy, error: grantError } =
      await iproxyService.grantProxyAccess(proxy.iproxy_connection_id, proxyRequest);

    if (!grantSuccess || !grantedProxy) {
      return NextResponse.json(
        { success: false, error: grantError || 'Failed to grant proxy access' },
        { status: 500 }
      );
    }

    // Update proxy in database with credentials
    const { data: updatedProxy, error: updateError } = await supabase
      .from('proxies')
      .update({
        port_http: grantedProxy.listen_service === 'http' ? grantedProxy.port : null,
        port_socks5: grantedProxy.listen_service === 'socks5' ? grantedProxy.port : null,
        username: grantedProxy.auth.login,
        password_hash: grantedProxy.auth.password, // Store plaintext for now (should hash in production)
        updated_at: new Date().toISOString(),
      })
      .eq('id', proxyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating proxy:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Proxy access granted successfully',
      proxy: {
        id: updatedProxy.id,
        host: updatedProxy.host,
        port_http: updatedProxy.port_http,
        port_socks5: updatedProxy.port_socks5,
        username: updatedProxy.username,
      },
    });
  } catch (error) {
    console.error('Error granting proxy access:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
