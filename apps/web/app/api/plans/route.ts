import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch all active plans
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const channel = searchParams.get('channel'); // Filter by channel (mobile, residential, datacenter)

    let query = supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_usd_month', { ascending: true });

    // Apply channel filter if provided
    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plans: plans || [],
    });
  } catch (error) {
    console.error('Error in plans API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
