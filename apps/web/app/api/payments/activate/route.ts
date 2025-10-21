import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { iproxyService } from '@/lib/iproxy-service';
import crypto from 'crypto';
import { encryptPassword } from '@/lib/encryption';

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

    // Calculate expiry date using plan's duration_days (default 30 days, or 7 days for free trial)
    const expiryDate = new Date();
    const daysToAdd = order.total_amount === 0 ? 7 : (order.plan?.duration_days || 30);
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
        status: 'paid',
        is_final: true,
        paid_at: new Date().toISOString(),
      })
      .eq('order_id', order_id);

    if (paymentUpdateError) {
      console.log('Warning: Could not update payment status:', paymentUpdateError);
    }

    // Provision connection for the activated order
    let provisionedConnection = null;
    try {
      console.log('Starting connection provisioning for order:', order_id);

      // Get user profile for email
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const userEmail = profile?.email || user.id;

      // Extract rotation settings from order metadata
      const ipChangeEnabled = order.metadata?.ip_change_enabled || false;
      const ipChangeIntervalMinutes = order.metadata?.ip_change_interval_minutes || 0;

      // Step 1: Get an available connection from connection_info table
      const { data: availableConnection, error: connectionError } = await supabaseAdmin
        .from('connection_info')
        .select('*')
        .eq('is_occupied', false)
        .limit(1)
        .single();

      if (connectionError || !availableConnection) {
        throw new Error('No available connections found. Please contact admin');
      }

      console.log('Found available connection:', availableConnection.connection_id);

      // Step 2: Grant proxy access to the connection
      const proxyAccessRequest = {
        listen_service: 'http' as const,
        auth_type: 'userpass' as const,
        auth: {
          login: `user_${user.id.substring(0, 8)}`,
          password: generateSecurePassword(),
        },
        description: `Proxy for ${userEmail} - Order ${order_id}`,
        expires_at: expiryDate.toISOString(),
      };

      console.log('Granting proxy access to connection:', availableConnection.connection_id);
      const { success: proxySuccess, proxy: proxyAccess, error: proxyError } =
        await iproxyService.grantProxyAccess(availableConnection.connection_id, proxyAccessRequest);

      if (!proxySuccess || !proxyAccess) {
        throw new Error(`Failed to grant proxy access: ${proxyError || 'Unknown error'}`);
      }

      console.log('Proxy access granted:', proxyAccess.id);

      // Step 3: Update connection settings if IP change is enabled
      if (ipChangeEnabled && ipChangeIntervalMinutes > 0) {
        console.log('Updating connection settings for auto IP rotation:', ipChangeIntervalMinutes, 'minutes');
        const settingsResult = await iproxyService.updateConnectionSettings(
          availableConnection.connection_id,
          {
            ip_change_enabled: true,
            ip_change_interval_minutes: ipChangeIntervalMinutes,
          }
        );

        if (!settingsResult.success) {
          console.error('Failed to update connection settings:', settingsResult.error);
          // Non-critical error, continue with provisioning
        } else {
          console.log('Connection settings updated successfully');
        }
      }

      // Step 4: Format proxy access as IP:PORT:LOGIN:PASSWORD
      const proxyAccessString = `${proxyAccess.ip}:${proxyAccess.port}:${proxyAccess.auth.login}:${proxyAccess.auth.password}`;

      // Step 5: Update connection_info with details and mark as occupied
      const { error: updateError } = await supabaseAdmin
        .from('connection_info')
        .update({
          client_email: userEmail,
          user_id: user.id,
          order_id: order_id,
          proxy_access: proxyAccessString,
          is_occupied: true,
          expires_at: expiryDate.toISOString(),
          updated_at: new Date().toISOString(),
          proxy_id:proxyAccess.id
        })
        .eq('id', availableConnection.id);

      if (updateError) {
        throw new Error(`Failed to update connection info: ${updateError.message}`);
      }

      console.log('Connection info updated and marked as occupied:', availableConnection.id);

      // Step 6: Save to proxies table for backward compatibility
      // Encrypt the password before storing
      const encryptedPassword = encryptPassword(proxyAccess.auth.password);

      const { data: savedProxy, error: saveError } = await supabaseAdmin
        .from('proxies')
        .insert({
          user_id: user.id,
          order_id: order_id,
          label: `${order.plan?.name || 'Plan'} - ${userEmail}`,
          host: proxyAccess.hostname,
          port_http: proxyAccess.listen_service === 'http' ? proxyAccess.port : null,
          port_socks5: proxyAccess.listen_service === 'socks5' ? proxyAccess.port : null,
          username: proxyAccess.auth.login,
          password_hash: encryptedPassword,
          status: 'active',
          iproxy_connection_id: availableConnection.connection_id,
          expires_at: expiryDate.toISOString(),
          connection_data: proxyAccess,
          last_ip: proxyAccess.ip,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save to proxies table (non-critical):', saveError.message);
      } else {
        console.log('Proxy saved to proxies table:', savedProxy.id);
      }

      provisionedConnection = {
        connection_info_id: availableConnection.id,
        proxy_id: savedProxy?.id,
        connection_id: availableConnection.connection_id,
        proxy_access: proxyAccessString,
      };
    } catch (connectionError: any) {
      console.error('Error provisioning connection:', connectionError);
      // Don't fail the activation, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Order activated successfully',
      order: updatedOrder,
      connection: provisionedConnection,
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

// Helper function to generate secure password
function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const byte = randomBytes[i];
    if (byte !== undefined) {
      password += charset[byte % charset.length];
    }
  }

  return password;
}
