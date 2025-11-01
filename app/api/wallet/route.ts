import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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

    // Use service role client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try to get existing wallet
    let { data: wallet, error } = await serviceClient
      .from('user_wallet')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If wallet doesn't exist, create it
    if (error?.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await serviceClient
        .from('user_wallet')
        .insert({
          user_id: user.id,
          balance: '0.00',
          currency: 'USD',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create wallet' },
          { status: 500 }
        );
      }

      wallet = newWallet;
    } else if (error) {
      console.error('Error fetching wallet:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch wallet' },
        { status: 500 }
      );
    }

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
