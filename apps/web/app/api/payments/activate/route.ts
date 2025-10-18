import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { iproxyService } from '@/lib/iproxy-service';
import bcrypt from 'bcryptjs';

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

    // Provision proxy for the activated order
    let provisionedProxy = null;
    try {
      console.log('Starting proxy provisioning for order:', order_id);

      // Step 1: Get connections from Console API
      console.log('Fetching connections from Console API...');
      const { success: connectionsSuccess, connections, error: connectionsError } =
        await iproxyService.getConsoleConnections();

      if (!connectionsSuccess || connections.length === 0) {
        throw new Error(`Failed to get connections: ${connectionsError || 'No connections available'}`);
      }

      // Step 2: Select a random connection
      const selectedConnection = connections[Math.floor(Math.random() * connections.length)];
      if (!selectedConnection) {
        throw new Error('No connection selected');
      }
      console.log(`Selected connection: ${selectedConnection.id} (${selectedConnection.basic_info.name})`);

      // Step 3: Grant proxy access
      const proxyRequest = {
        listen_service: 'http' as const,
        auth_type: 'userpass' as const,
        description: `Proxy for order ${order_id} - ${order.plan?.name || 'Plan'}`,
        expires_at: expiryDate.toISOString(),
      };

      console.log('Granting proxy access...');
      const { success: proxySuccess, proxy, error: proxyError } =
        await iproxyService.grantProxyAccess(selectedConnection.id, proxyRequest);

      if (!proxySuccess || !proxy) {
        throw new Error(`Failed to grant proxy access: ${proxyError || 'Unknown error'}`);
      }

      console.log('Proxy access granted:', proxy.id);

      // Step 4: Save proxy to database
      const passwordHash = await bcrypt.hash(proxy.auth.password, 10);

      const { data: savedProxy, error: saveError } = await supabaseAdmin
        .from('proxies')
        .insert({
          user_id: user.id,
          label: proxy.description || `Proxy for ${order.plan?.name || 'order'}`,
          host: proxy.hostname,
          port_http: proxy.listen_service === 'http' ? proxy.port : null,
          port_socks5: proxy.listen_service === 'socks5' ? proxy.port : null,
          username: proxy.auth.login,
          password_hash: passwordHash,
          status: 'active',
          iproxy_connection_id: proxy.connection_id,
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save proxy to database: ${saveError.message}`);
      }

      console.log('Proxy saved to database:', savedProxy.id);
      provisionedProxy = {
        id: savedProxy.id,
        label: savedProxy.label,
        host: savedProxy.host,
        port_http: savedProxy.port_http,
        port_socks5: savedProxy.port_socks5,
        username: savedProxy.username,
      };
    } catch (proxyError: any) {
      console.error('Error provisioning proxy:', proxyError);
      // Don't fail the activation, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Order activated successfully',
      order: updatedOrder,
      proxy: provisionedProxy,
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
