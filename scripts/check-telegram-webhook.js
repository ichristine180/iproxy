#!/usr/bin/env node

/**
 * Script to check Telegram webhook configuration
 * Usage: node scripts/check-telegram-webhook.js
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

async function checkWebhookInfo() {
  try {
    console.log('🔍 Checking Telegram webhook configuration...\n');

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('❌ Failed to get webhook info:', data);
      return;
    }

    const info = data.result;

    console.log('📊 Webhook Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`URL: ${info.url || '(not set)'}`);
    console.log(`Has Custom Certificate: ${info.has_custom_certificate}`);
    console.log(`Pending Update Count: ${info.pending_update_count}`);
    console.log(`Max Connections: ${info.max_connections || 40}`);
    console.log(`IP Address: ${info.ip_address || 'N/A'}`);

    if (info.last_error_date) {
      const lastErrorDate = new Date(info.last_error_date * 1000);
      console.log(`\n⚠️  Last Error Date: ${lastErrorDate.toISOString()}`);
      console.log(`Last Error Message: ${info.last_error_message}`);
    }

    if (info.last_synchronization_error_date) {
      const lastSyncError = new Date(info.last_synchronization_error_date * 1000);
      console.log(`\n⚠️  Last Sync Error: ${lastSyncError.toISOString()}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check if webhook URL is set
    if (!info.url) {
      console.log('⚠️  Webhook URL is not set!');
      console.log('To set it, run:');
      console.log(`curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=YOUR_WEBHOOK_URL"\n`);
    } else if (info.pending_update_count > 0) {
      console.log(`⚠️  There are ${info.pending_update_count} pending updates that haven't been processed`);
    } else if (info.last_error_date) {
      console.log('⚠️  The webhook has encountered errors. Check the details above.');
    } else {
      console.log('✅ Webhook appears to be configured correctly');
    }

  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
  }
}

async function getBotInfo() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
    );

    const data = await response.json();

    if (data.ok) {
      console.log('\n🤖 Bot Information:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Username: @${data.result.username}`);
      console.log(`Name: ${data.result.first_name}`);
      console.log(`ID: ${data.result.id}`);
      console.log(`Can Join Groups: ${data.result.can_join_groups}`);
      console.log(`Can Read All Group Messages: ${data.result.can_read_all_group_messages}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  } catch (error) {
    console.error('❌ Error getting bot info:', error.message);
  }
}

// Run checks
(async () => {
  await getBotInfo();
  await checkWebhookInfo();
})();
