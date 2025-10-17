import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET - Fetch user's proxies from active orders
export async function GET(request: NextRequest) {
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

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch active orders with plan details
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        quantity,
        status,
        created_at,
        start_at,
        expires_at,
        plan:plans(
          id,
          name,
          channel,
          rotation_api
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching proxies:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch proxies' },
        { status: 500 }
      );
    }

    // Generate proxy information based on orders
    const proxies = orders?.flatMap((order) => {
      const baseProxies = [];
      for (let i = 0; i < order.quantity; i++) {
        // Generate proxy credentials (in production, these would come from your proxy infrastructure)
        const proxyNumber = i + 1;
        const proxy = {
          id: `${order.id}-${i}`,
          order_id: order.id,
          host: `${order.plan.channel}.proxy.iproxy.com`,
          port: 8000 + i,
          username: `user_${user.id.substring(0, 8)}_${proxyNumber}`,
          password: `pass_${order.id.substring(0, 8)}_${proxyNumber}`,
          channel: order.plan.channel,
          plan_name: order.plan.name,
          rotation_api: order.plan.rotation_api,
          status: 'active',
          created_at: order.created_at,
          expires_at: order.expires_at,
        };
        baseProxies.push(proxy);
      }
      return baseProxies;
    }) || [];

    return NextResponse.json({
      success: true,
      proxies,
      total: proxies.length,
    });
  } catch (error) {
    console.error('Error in proxies GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
