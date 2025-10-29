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

    // Fetch notification preferences from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('notify_email, notify_telegram, proxy_expiry_alerts, renewal_reminders, payment_confirmations, system_updates')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', profileError);
    }

    // Return defaults if no preferences found
    return NextResponse.json({
      success: true,
      preferences: {
        user_id: user.id,
        notify_email: profile?.notify_email ?? true,
        notify_telegram: profile?.notify_telegram ?? false,
        proxy_expiry_alerts: profile?.proxy_expiry_alerts ?? true,
        renewal_reminders: profile?.renewal_reminders ?? true,
        payment_confirmations: profile?.payment_confirmations ?? true,
        system_updates: profile?.system_updates ?? false,
      },
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notification preferences' },
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
    const {
      notify_email,
      notify_telegram,
      proxy_expiry_alerts,
      renewal_reminders,
      payment_confirmations,
      system_updates,
    } = body;

    // Update notification preferences in profiles table
    const updateData: any = {};

    // Only include fields that are provided
    if (notify_email !== undefined) updateData.notify_email = notify_email;
    if (notify_telegram !== undefined) updateData.notify_telegram = notify_telegram;
    if (proxy_expiry_alerts !== undefined) updateData.proxy_expiry_alerts = proxy_expiry_alerts;
    if (renewal_reminders !== undefined) updateData.renewal_reminders = renewal_reminders;
    if (payment_confirmations !== undefined) updateData.payment_confirmations = payment_confirmations;
    if (system_updates !== undefined) updateData.system_updates = system_updates;

    console.log('Updating notification preferences with data:', updateData);

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating notification preferences:', updateError);
      console.error('Update data was:', updateData);
      return NextResponse.json(
        { success: false, error: 'Failed to update notification preferences', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
