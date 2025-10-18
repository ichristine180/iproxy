-- Fix webhook_events provider constraint to ensure nowpayments is allowed
-- Drop the old constraint if it exists
ALTER TABLE public.webhook_events DROP CONSTRAINT IF EXISTS webhook_events_provider_check;

-- Recreate the constraint with the correct values
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_provider_check
  CHECK (provider IN ('nowpayments', 'cryptomus', 'stripe', 'paypal', 'custom'));
