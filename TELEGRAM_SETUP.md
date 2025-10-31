# Telegram Bot Setup Guide

This guide explains how to set up Telegram notifications for your iProxy application.

## Overview

The Telegram integration allows users to:
- Receive instant order notifications
- Get proxy activation alerts
- Receive important account updates
- Automatically link their Telegram account without manually entering chat IDs

## Prerequisites

1. A Telegram account
2. BotFather access to create a bot
3. Your application deployed with a public URL (for webhook)

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Follow the prompts:
   - Enter a name for your bot (e.g., "iProxy Notifications")
   - Enter a username for your bot (must end in 'bot', e.g., "iproxy_notifications_bot")
4. BotFather will give you a **bot token** - save this!

## Step 2: Configure Environment Variables

Add these environment variables to your `.env` file:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

**Example:**
```bash
TELEGRAM_BOT_TOKEN=7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=iproxy_notifications_bot
```

## Step 3: Set Up Webhook

Once your application is deployed, set the webhook URL for your bot:

### Option A: Using cURL

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/webhooks/telegram"}'
```

### Option B: Using Browser

Navigate to:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/webhooks/telegram
```

### Verify Webhook is Set

Check webhook status:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## Step 4: Test the Integration

### For Regular Users:

1. Log in to your application
2. Go to Settings or Profile page
3. Find the "Telegram Notifications" section
4. Click "Open Telegram Bot"
5. Click START in the Telegram chat
6. Your account will be automatically linked!
7. Click "Send Test" to verify it's working

### For Admins:

Same process as above. The bot will detect your admin role and send appropriate welcome message.

## How It Works

### Auto-Linking Process

1. User clicks "Open Telegram Bot" link
2. Link contains verification token: `https://t.me/YOUR_BOT?start=verify_<user_id>`
3. User clicks START in Telegram
4. Bot receives webhook with user's `chat_id`
5. Bot updates user profile with their `chat_id`
6. User receives confirmation message
7. System can now send notifications!

### Webhook Handler

The webhook at `/api/webhooks/telegram` handles:

- **`/start verify_<user_id>`** - Automatically links user account
- **`/start`** - General welcome message
- **`/help`** - Shows available commands
- **`/status`** - Checks connection status
- **Other messages** - Provides helpful responses

## Notification Types

### User Notifications

- Order confirmations
- Proxy activation alerts
- Payment processing updates

### Admin Notifications

- Manual provisioning alerts
- Connection configuration needed
- Order processing notifications

## Troubleshooting

### "Chat not found" Error

This occurs when:
- User hasn't started the bot yet
- `telegram_chat_id` is invalid
- Bot was blocked by user

**Solution:** System automatically disables Telegram notifications for invalid chat_ids.

### Webhook Not Working

1. Check webhook is set:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```

2. Check your server logs for webhook requests

3. Verify your domain is accessible (not localhost)

4. Check TELEGRAM_BOT_TOKEN is correct

### Bot Not Responding

1. Verify bot token is correct
2. Check environment variables are loaded
3. Check server logs for errors
4. Ensure webhook URL is publicly accessible

## Bot Commands

Users can send these commands to the bot:

- `/start` - Start the bot and link account
- `/help` - Show help message
- `/status` - Check connection status

## Security Considerations

1. **Never expose bot token** - Keep it in environment variables only
2. **Verify user IDs** - Webhook handler verifies user exists before linking
3. **Use HTTPS** - Telegram requires HTTPS for webhooks
4. **Validate webhook data** - Handler checks message structure

## Component Usage

### In Your Settings Page

```tsx
import { TelegramSetup } from "@/components/TelegramSetup";

// Inside your component:
<TelegramSetup
  userId={user.id}
  currentChatId={profile.telegram_chat_id}
  isEnabled={profile.notify_telegram}
  onUpdate={() => refreshProfile()}
/>
```

## API Endpoints

### User Settings

**GET /api/user/settings** - Fetch notification preferences
**PATCH /api/user/settings** - Update settings

### Telegram Webhook

**POST /api/webhooks/telegram** - Receives Telegram updates

### Send Notification

**POST /api/notifications/telegram**
```json
{
  "chat_id": "123456789",
  "message": "Your notification message"
}
```

## Monitoring

### Check Connected Users

Query your database:
```sql
SELECT email, telegram_chat_id, notify_telegram
FROM profiles
WHERE telegram_chat_id IS NOT NULL;
```

### Check Admin Notifications

```sql
SELECT email, telegram_chat_id, notify_telegram
FROM profiles
WHERE role = 'admin' AND telegram_chat_id IS NOT NULL;
```

## Advanced Configuration

### Custom Bot Commands

Edit `/app/api/webhooks/telegram/route.ts` to add custom commands:

```typescript
if (text === '/custom') {
  await sendTelegramMessage(chatId, 'Custom response');
  return NextResponse.json({ ok: true });
}
```

### Notification Formatting

Telegram supports Markdown formatting:
- `*bold*`
- `_italic_`
- `` `code` ``
- `[link](url)`

## Production Checklist

- [ ] Bot created with BotFather
- [ ] Environment variables set
- [ ] Webhook configured
- [ ] Webhook verified with getWebhookInfo
- [ ] Test notification sent successfully
- [ ] User can connect via settings page
- [ ] Admin notifications working
- [ ] Error handling tested
- [ ] Logs monitored

## Support

If you encounter issues:
1. Check server logs
2. Verify webhook configuration
3. Test with Telegram's Bot API directly
4. Check database for `telegram_chat_id` values

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#botfather)
- [Webhook Guide](https://core.telegram.org/bots/webhooks)
