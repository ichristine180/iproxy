import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface WalletRow {
  id: string;
  user_id: string;
  balance: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

// GET - Fetch user's wallet balance
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

    // Get or create wallet using SECURITY DEFINER function
    const { data, error } = await supabase
      .rpc('get_or_create_user_wallet', { p_user_id: user.id })
      .single();

    if (error || !data) {
      console.error('Error getting/creating wallet:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get wallet' },
        { status: 500 }
      );
    }

    const wallet = data as WalletRow;

    return NextResponse.json({
      success: true,
      wallet: {
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in wallet GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
