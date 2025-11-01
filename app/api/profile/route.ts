import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        role: profile?.role || 'user',
        emailVerified: !!user.email_confirmed_at,
        createdAt: user.created_at,
        telegram_chat_id: profile?.telegram_chat_id || '',
        notify_email: profile?.notify_email ?? true,
        notify_telegram: profile?.notify_telegram ?? false,
        proxy_expiry_alerts: profile?.proxy_expiry_alerts ?? true,
        renewal_reminders: profile?.renewal_reminders ?? true,
        payment_confirmations: profile?.payment_confirmations ?? true,
        system_updates: profile?.system_updates ?? false,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, telegram_chat_id } = body;

    // Update user metadata in Supabase Auth (name and phone)
    const updateData: Record<string, any> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: updateData,
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    // Update telegram_chat_id in profiles table
    if (telegram_chat_id !== undefined) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          telegram_chat_id: telegram_chat_id || null,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile table:', profileError);
        // Continue even if profile update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
