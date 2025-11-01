import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's wallet transactions
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

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // e.g., 'deposit', 'withdrawal', etc.

    console.log('Fetching wallet transactions for user:', user.id);
    console.log('Filter type:', type || 'all');

    // Build query with RLS - only user's own transactions will be returned
    let query = supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply type filter if provided
    if (type) {
      query = query.eq('type', type);
      console.log('Filtering by type:', type);
    }

    // Execute query with ordering and pagination
    const { data: transactions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('Transactions query result:', {
      count: transactions?.length || 0,
      total: count,
      error: error?.message,
    });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in wallet transactions GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
