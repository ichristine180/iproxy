import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Telegram Bot Webhook Handler
 * Automatically captures chat_id when users start the bot
 *
 * Setup:
 * 1. Set webhook URL: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/api/webhooks/telegram
 * 2. Users click link: https://t.me/YOUR_BOT?start=verify_<user_id>
 * 3. Bot auto-captures their chat_id and saves to profile
 */

// GET endpoint to verify webhook is accessible
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Telegram webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  console.log('=== TELEGRAM WEBHOOK CALLED ===');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.json();
    console.log('Telegram webhook received:', JSON.stringify(body, null, 2));

    // Extract message data
    const message = body.message;
    if (!message) {
      return NextResponse.json({ ok: true }); // Acknowledge non-message updates
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    const from = message.from;

    console.log(`Telegram message from ${from.username || from.first_name} (${chatId}):`, text);

    // Initialize Supabase admin client
    console.log('Initializing Supabase admin client...');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle /start command with verification token
    if (text.startsWith('/start verify_')) {
      const userId = text.replace('/start verify_', '').trim();

      console.log(`Verification request for user: ${userId}`);
      console.log(`Chat ID: ${chatId}`);

      // Update user profile with chat_id
      const { data: profile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          telegram_chat_id: chatId.toString(),
          notify_telegram: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('email, role')
        .single();

      console.log('Update result:', { profile, updateError });

      if (updateError || !profile) {
        console.error('Failed to update profile:', updateError);

        // Send error message to user
        await sendTelegramMessage(chatId, `
❌ *Verification Failed*

Unable to link your Telegram account. Please try again or contact support.

Error: User not found or invalid verification link.
        `.trim());

        return NextResponse.json({ ok: true });
      }

      console.log(`Successfully linked Telegram for ${profile.email}`);

      // Send success message
      const welcomeMessage = profile.role === 'admin'
        ? `
🎉 *Admin Account Connected!*

Your Telegram account has been successfully linked to your admin account.

You will now receive:
• Order notifications
• Manual provisioning alerts
• Connection configuration alerts
• System updates

You can manage your notification preferences in the admin settings.
        `.trim()
        : `
🎉 *Account Connected!*

Your Telegram account has been successfully linked!

You will now receive:
• Order confirmations
• Proxy activation notifications
• Important account updates

You can manage your notification preferences in your dashboard settings.

[Open Dashboard](${process.env.NEXT_PUBLIC_APP_BASE_URL}/dashboard)
        `.trim();

      await sendTelegramMessage(chatId, welcomeMessage);

      return NextResponse.json({ ok: true, message: 'User verified and linked' });
    }

    // Handle /start without verification token
    if (text === '/start') {
      await sendTelegramMessage(chatId, `
👋 *Welcome to iProxy Bot!*

To connect your account, please click the "Connect Telegram" button in your dashboard settings.

If you don't have an account yet, visit: ${process.env.NEXT_PUBLIC_APP_BASE_URL}
      `.trim());

      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (text === '/help') {
      await sendTelegramMessage(chatId, `
📖 *iProxy Bot Help*

*Available Commands:*
• /start - Start the bot
• /help - Show this help message
• /status - Check connection status

*Features:*
• Instant order notifications
• Proxy activation alerts
• Account updates

To connect your account, use the link from your dashboard settings.
      `.trim());

      return NextResponse.json({ ok: true });
    }

    // Handle /status command
    if (text === '/status') {
      // Check if this chat_id is linked to any account
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, role, notify_telegram')
        .eq('telegram_chat_id', chatId.toString())
        .single();

      if (profile) {
        await sendTelegramMessage(chatId, `
✅ *Account Connected*

• Email: ${profile.email}
• Role: ${profile.role || 'user'}
• Notifications: ${profile.notify_telegram ? 'Enabled ✓' : 'Disabled ✗'}

Your chat ID: \`${chatId}\`
        `.trim());
      } else {
        await sendTelegramMessage(chatId, `
❌ *Not Connected*

Your Telegram account is not linked to any iProxy account.

To connect, please:
1. Log in to your account at ${process.env.NEXT_PUBLIC_APP_BASE_URL}
2. Go to Settings
3. Click "Connect Telegram"
4. Follow the link provided

Your chat ID: \`${chatId}\`
        `.trim());
      }

      return NextResponse.json({ ok: true });
    }

    // Default response for unrecognized messages
    await sendTelegramMessage(chatId, `
I didn't understand that command. Try:
• /help - Show available commands
• /status - Check connection status
    `.trim());

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return ok to prevent Telegram from retrying
  }
}

// Helper function to send Telegram messages
async function sendTelegramMessage(chatId: number | string, message: string): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Failed to send Telegram message:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}
