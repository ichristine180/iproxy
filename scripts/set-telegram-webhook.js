#!/usr/bin/env node

/**
 * Script to set Telegram webhook URL
 * Usage: node scripts/set-telegram-webhook.js <webhook_url>
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

// Get webhook URL from command line argument or construct from APP_BASE_URL
const webhookUrl = process.argv[2] || (APP_BASE_URL ? `${APP_BASE_URL}/api/webhooks/telegram` : null);

if (!webhookUrl) {
  console.error('❌ Please provide a webhook URL or set NEXT_PUBLIC_APP_BASE_URL');
  console.error('Usage: node scripts/set-telegram-webhook.js https://yourdomain.com/api/webhooks/telegram');
  process.exit(1);
}

async function setWebhook() {
  try {
    console.log(`🔧 Setting webhook URL to: ${webhookUrl}\n`);

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: true, // Clear pending updates
        }),
      }
    );

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`URL: ${webhookUrl}`);
      console.log('Pending updates: Cleared');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Verify the webhook was set
      console.log('🔍 Verifying webhook configuration...\n');

      const verifyResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.ok) {
        const info = verifyData.result;
        console.log('📊 Current Webhook Info:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`URL: ${info.url}`);
        console.log(`Pending Update Count: ${info.pending_update_count}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Setup complete! You can now test your bot.');
        console.log(`\n💡 Test it by visiting: https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot'}`);
      }
    } else {
      console.error('❌ Failed to set webhook:', data.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
    process.exit(1);
  }
}

setWebhook();
