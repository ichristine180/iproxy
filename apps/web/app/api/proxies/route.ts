import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's proxies via RLS
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

    // Fetch proxies using RLS - only user's own proxies will be returned
    const { data: proxies, error } = await supabase
      .from('proxies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching proxies:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch proxies' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proxies: proxies || [],
      total: proxies?.length || 0,
    });
  } catch (error) {
    console.error('Error in proxies GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
