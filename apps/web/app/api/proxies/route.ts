import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decryptPassword } from '@/lib/encryption';

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

    // Decrypt passwords before sending to client
    const proxiesWithDecryptedPasswords = (proxies || []).map((proxy) => {
      try {
        const decryptedPassword = proxy.password_hash
          ? decryptPassword(proxy.password_hash)
          : '';

        return {
          ...proxy,
          password: decryptedPassword,
        };
      } catch (decryptError) {
        console.error('Error decrypting password for proxy:', proxy.id, decryptError);
        return {
          ...proxy,
          password: '', // Return empty password if decryption fails
        };
      }
    });

    return NextResponse.json({
      success: true,
      proxies: proxiesWithDecryptedPasswords,
      total: proxiesWithDecryptedPasswords.length,
    });
  } catch (error) {
    console.error('Error in proxies GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
