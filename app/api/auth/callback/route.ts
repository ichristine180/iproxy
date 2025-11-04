import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const type = searchParams.get('type'); // Check if this is a recovery (password reset) flow
    const next = searchParams.get('next') || '/dashboard'; // Redirect to pricing after email verification

    // Handle OAuth/email verification errors
    if (error) {
      console.error('Auth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_BASE_URL}?error=${encodeURIComponent(error)}`
      );
    }

    // Exchange code for session
    if (code) {
      const supabase = await createClient();

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_BASE_URL}?error=${encodeURIComponent('auth_failed')}`
        );
      }

      // Check if this is a password reset flow
      // Supabase sets the user's session with recovery mode for password resets
      if (type === 'recovery' || data.user?.recovery_sent_at) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_BASE_URL}/reset-password`
        );
      }

      // Redirect to next URL or dashboard after successful authentication
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_BASE_URL}${next}`
      );
    }

    // No code or error, redirect to login
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_BASE_URL || '/');
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}?error=${encodeURIComponent('callback_failed')}`
    );
  }
}
