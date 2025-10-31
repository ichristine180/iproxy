import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET - Fetch a specific plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .select(`
        *,
        pricing:plan_pricing(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching plan:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plan' },
        { status: 500 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error('Error in admin plan GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, channel, rotation_api, description, features, is_active, pricing } = body;

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (channel !== undefined) {
      // Validate channel type
      if (!['mobile', 'residential', 'datacenter'].includes(channel)) {
        return NextResponse.json(
          { success: false, error: 'Invalid channel. Must be mobile, residential, or datacenter' },
          { status: 400 }
        );
      }
      updates.channel = channel;
    }
    if (rotation_api !== undefined) updates.rotation_api = rotation_api;
    if (description !== undefined) updates.description = description;
    if (features !== undefined) updates.features = features;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update plan' },
        { status: 500 }
      );
    }

    // Update pricing if provided
    if (pricing && Array.isArray(pricing)) {
      // Delete existing pricing
      await supabaseAdmin
        .from('plan_pricing')
        .delete()
        .eq('plan_id', id);

      // Insert new pricing
      if (pricing.length > 0) {
        const pricingRecords = pricing.map((p: any) => ({
          plan_id: id,
          duration: p.duration,
          price_usd: parseFloat(p.price_usd),
        }));

        const { error: pricingError } = await supabaseAdmin
          .from('plan_pricing')
          .insert(pricingRecords);

        if (pricingError) {
          console.error('Error updating pricing:', pricingError);
        }
      }
    }

    // Fetch the updated plan with pricing
    const { data: updatedPlan, error: fetchError } = await supabaseAdmin
      .from('plans')
      .select(`
        *,
        pricing:plan_pricing(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated plan:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch updated plan' },
        { status: 500 }
      );
    }

    if (!updatedPlan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'Plan updated successfully',
    });
  } catch (error) {
    console.error('Error in admin plan PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a plan (soft delete by setting is_active to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if plan has any active orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('plan_id', id)
      .eq('status', 'active')
      .limit(1);

    if (ordersError) {
      console.error('Error checking orders:', ordersError);
      return NextResponse.json(
        { success: false, error: 'Failed to check plan usage' },
        { status: 500 }
      );
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete plan with active orders. Deactivate it instead.'
        },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting plan:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete plan' },
        { status: 500 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
      message: 'Plan deactivated successfully',
    });
  } catch (error) {
    console.error('Error in admin plan DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
