import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { iproxyService } from '@/lib/iproxy-service';
import { encryptPassword, decryptPassword } from '@/lib/encryption';

/**
 * POST /api/proxies/provision
 *
 * Provisions proxies from iProxy.online for active orders
 *
 * Body:
 * - order_id (optional): Provision for specific order
 * - connection_id (required): iProxy connection ID to use
 */
export async function POST(request: NextRequest) {
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
    const { order_id, connection_id } = body;

    if (!connection_id) {
      return NextResponse.json(
        { success: false, error: 'connection_id is required' },
        { status: 400 }
      );
    }

    // Get the order to provision
    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        quantity,
        plan:plans(
          id,
          name,
          channel,
          rotation_api
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (order_id) {
      query = query.eq('id', order_id);
    }

    const { data: orders, error: orderError } = await query;

    if (orderError || !orders || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active orders found' },
        { status: 404 }
      );
    }

    const order = orders[0];
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'No active orders found' },
        { status: 404 }
      );
    }
    const plan = Array.isArray(order.plan) ? order.plan[0] : order.plan;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Order has no associated plan' },
        { status: 400 }
      );
    }

    // Check if proxies already exist for this order
    const { data: existingProxies } = await supabase
      .from('proxies')
      .select('id')
      .eq('user_id', user.id);

    const existingCount = existingProxies?.length || 0;

    // Create proxies on iProxy.online
    const createdProxies = [];
    const errors = [];

    for (let i = 0; i < order.quantity; i++) {
      const proxyConfig = {
        label: `${plan.name} - Proxy ${existingCount + i + 1}`,
        rotation_enabled: plan.rotation_api,
      };

      const result = await iproxyService.createProxy(connection_id, proxyConfig);

      if (result.success && result.proxy) {
        // Encrypt password before storing
        const encryptedPassword = encryptPassword(result.proxy.password);

        // Store in database
        const { data: newProxy, error: insertError } = await supabase
          .from('proxies')
          .insert({
            user_id: user.id,
            label: proxyConfig.label,
            host: result.proxy.host,
            port_http: result.proxy.port_http,
            port_socks5: result.proxy.port_socks5 || null,
            username: result.proxy.username,
            password_hash: encryptedPassword,
            country: plan.channel, // Use channel as country for now
            status: 'active',
            iproxy_change_url: result.proxy.change_url || null,
            iproxy_action_link_id: result.proxy.id,
            rotation_mode: plan.rotation_api ? 'api' : 'manual',
          })
          .select()
          .single();

        if (insertError) {
          errors.push(`Failed to save proxy ${i + 1}: ${insertError.message}`);
        } else {
          // Decrypt password before returning to client
          const proxyWithDecryptedPassword = {
            ...newProxy,
            password: decryptPassword(newProxy.password_hash),
          };
          createdProxies.push(proxyWithDecryptedPassword);
        }
      } else {
        errors.push(`Failed to create proxy ${i + 1}: ${result.error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Provisioned ${createdProxies.length} of ${order.quantity} proxies`,
      proxies: createdProxies,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error provisioning proxies:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
