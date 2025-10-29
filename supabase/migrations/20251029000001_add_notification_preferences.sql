-- Add notification preference fields to profiles table
-- This migration adds the missing notification preference fields

-- Rename tg_chat_id to telegram_chat_id for consistency
ALTER TABLE public.profiles
  RENAME COLUMN tg_chat_id TO telegram_chat_id;

-- Add notification preference columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS proxy_expiry_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_confirmations BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS system_updates BOOLEAN NOT NULL DEFAULT false;

-- Add comment to table for documentation
COMMENT ON COLUMN public.profiles.telegram_chat_id IS 'Telegram chat ID for sending notifications';
COMMENT ON COLUMN public.profiles.notify_email IS 'Enable/disable email notifications';
COMMENT ON COLUMN public.profiles.notify_telegram IS 'Enable/disable Telegram notifications';
COMMENT ON COLUMN public.profiles.proxy_expiry_alerts IS 'Receive alerts when proxies are about to expire';
COMMENT ON COLUMN public.profiles.renewal_reminders IS 'Receive reminders for subscription renewals';
COMMENT ON COLUMN public.profiles.payment_confirmations IS 'Receive notifications for successful payments';
COMMENT ON COLUMN public.profiles.system_updates IS 'Receive notifications about system maintenance and updates';
