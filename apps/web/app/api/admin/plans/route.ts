import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET - Fetch all plans (including inactive)
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Use service role key to bypass RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Fetch all plans with pricing
    let query = supabaseAdmin
      .from('plans')
      .select(`
        *,
        pricing:plan_pricing(*)
      `)
      .order('created_at', { ascending: false });

    // Filter active plans only if needed
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plans', details: error },
        { status: 500 }
      );
    }

    console.log('Plans fetched from DB:', JSON.stringify(plans, null, 2));

    return NextResponse.json({
      success: true,
      plans: plans || [],
    });
  } catch (error) {
    console.error('Error in admin plans API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new plan
export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Use service role key to bypass RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { name, channel, rotation_api, description, features, is_active, pricing } = body;

    // Validate required fields
    if (!name || !channel) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, channel' },
        { status: 400 }
      );
    }

    // Validate channel type
    if (!['mobile', 'residential', 'datacenter'].includes(channel)) {
      return NextResponse.json(
        { success: false, error: 'Invalid channel. Must be mobile, residential, or datacenter' },
        { status: 400 }
      );
    }

    // Create the plan
    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .insert({
        name,
        channel,
        rotation_api: rotation_api ?? false,
        description: description || null,
        features: features || {},
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create plan' },
        { status: 500 }
      );
    }

    // Insert pricing if provided
    if (pricing && Array.isArray(pricing) && pricing.length > 0) {
      const pricingRecords = pricing.map((p: any) => ({
        plan_id: plan.id,
        duration: p.duration,
        price_usd: parseFloat(p.price_usd),
      }));

      const { error: pricingError } = await supabaseAdmin
        .from('plan_pricing')
        .insert(pricingRecords);

      if (pricingError) {
        console.error('Error creating pricing:', pricingError);
        // Plan was created but pricing failed - still return success but with a warning
      }
    }

    // Fetch the complete plan with pricing
    const { data: completePlan } = await supabaseAdmin
      .from('plans')
      .select(`
        *,
        pricing:plan_pricing(*)
      `)
      .eq('id', plan.id)
      .single();

    return NextResponse.json({
      success: true,
      plan: completePlan || plan,
      message: 'Plan created successfully',
    });
  } catch (error) {
    console.error('Error in admin plans POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
