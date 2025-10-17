-- Add Free Trial Plan and Test Payment Plan
-- Run this in your Supabase SQL Editor

-- Free Trial Plan (7 days free trial)
INSERT INTO public.plans (
  name,
  channel,
  price_usd_month,
  rotation_api,
  description,
  features,
  is_active
) VALUES (
  'Free Trial',
  'residential',
  0,
  false,
  '7-day free trial to test our residential proxies',
  '["7 days free access", "Limited bandwidth", "Basic residential proxies", "No credit card required", "Perfect for testing"]'::jsonb,
  true
);




