import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET - Fetch user settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user profile with notification settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, notify_email, notify_telegram, telegram_chat_id, payment_confirmations')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        email: profile.email,
        notify_email: profile.notify_email !== false, // Default to true
        notify_telegram: profile.notify_telegram || false,
        telegram_chat_id: profile.telegram_chat_id,
        payment_confirmations: profile.payment_confirmations !== false, // Default to true
        telegram_connected: !!profile.telegram_chat_id,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      notify_email,
      notify_telegram,
      telegram_chat_id,
      payment_confirmations,
    } = body;

    // Use admin client for updates
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (notify_email !== undefined) {
      updates.notify_email = notify_email;
    }

    if (notify_telegram !== undefined) {
      updates.notify_telegram = notify_telegram;
    }

    if (telegram_chat_id !== undefined) {
      updates.telegram_chat_id = telegram_chat_id;
    }

    if (payment_confirmations !== undefined) {
      updates.payment_confirmations = payment_confirmations;
    }

    // Update profile
    const { data: profile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        email: profile.email,
        notify_email: profile.notify_email !== false,
        notify_telegram: profile.notify_telegram || false,
        telegram_chat_id: profile.telegram_chat_id,
        payment_confirmations: profile.payment_confirmations !== false,
        telegram_connected: !!profile.telegram_chat_id,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
