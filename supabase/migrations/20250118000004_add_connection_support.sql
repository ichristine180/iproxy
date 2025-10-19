-- Add connection support to plans and proxies tables
-- This migration adds fields needed for iProxy.online Console API connection management

-- ==============================================
-- 1. Extend plans table with connection parameters
-- ==============================================

-- Add connection preference columns to plans
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS city VARCHAR(50),
ADD COLUMN IF NOT EXISTS socks5_udp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30 CHECK (duration_days > 0);

-- Add comments for documentation
COMMENT ON COLUMN public.plans.country IS 'Preferred 2-letter country code for connection (e.g., us, de, fr)';
COMMENT ON COLUMN public.plans.city IS 'Preferred city code for connection (e.g., nyc, fra, lon)';
COMMENT ON COLUMN public.plans.socks5_udp IS 'Require SOCKS5 UDP support on selected server';
COMMENT ON COLUMN public.plans.duration_days IS 'Plan duration in days (default: 30 days)';

-- Create index for faster location lookups
CREATE INDEX IF NOT EXISTS idx_plans_location ON public.plans(country, city) WHERE country IS NOT NULL;

-- ==============================================
-- 2. Extend proxies table for connection management
-- ==============================================

-- Add order and connection tracking columns
ALTER TABLE public.proxies
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS connection_data JSONB,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Make username and password_hash nullable (they're set later when proxy access is granted)
ALTER TABLE public.proxies
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password_hash DROP NOT NULL;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_proxies_order_id ON public.proxies(order_id);
CREATE INDEX IF NOT EXISTS idx_proxies_expires_at ON public.proxies(expires_at);

-- Add comments for documentation
COMMENT ON COLUMN public.proxies.order_id IS 'Order that created this proxy/connection';
COMMENT ON COLUMN public.proxies.connection_data IS 'Full connection details from iProxy.online Console API';
COMMENT ON COLUMN public.proxies.expires_at IS 'When the proxy/connection expires';

-- ==============================================
-- 3. Insert new plans with different durations
-- ==============================================

-- Clear existing test plans (they will be recreated with new structure)
DELETE FROM public.plans WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);

-- Insert Mobile Proxy Plans (US)
INSERT INTO public.plans (
  id,
  name,
  channel,
  price_usd_month,
  rotation_api,
  description,
  features,
  is_active,
  country,
  socks5_udp,
  duration_days
) VALUES
  -- Mobile Proxy - 1 Day (US)
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'Mobile Proxy - 1 Day (US)',
    'mobile',
    3.99,
    true,
    'Daily mobile proxy plan with API rotation',
    '[
      "1 Mobile Proxy Connection",
      "US Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "24/7 Support"
    ]'::jsonb,
    true,
    'us',
    false,
    1
  ),
  -- Mobile Proxy - 1 Week (US)
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    'Mobile Proxy - 1 Week (US)',
    'mobile',
    19.99,
    true,
    'Weekly mobile proxy plan with API rotation',
    '[
      "1 Mobile Proxy Connection",
      "US Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "24/7 Support"
    ]'::jsonb,
    true,
    'us',
    false,
    7
  ),
  -- Mobile Proxy - 1 Month (US)
  (
    '10000000-0000-0000-0000-000000000003'::uuid,
    'Mobile Proxy - 1 Month (US)',
    'mobile',
    49.99,
    true,
    'Monthly mobile proxy plan with API rotation',
    '[
      "1 Mobile Proxy Connection",
      "US Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "Priority Support",
      "Best Value"
    ]'::jsonb,
    true,
    'us',
    false,
    30
  ),

  -- Mobile Proxy - 1 Day (Germany)
  (
    '11000000-0000-0000-0000-000000000001'::uuid,
    'Mobile Proxy - 1 Day (DE)',
    'mobile',
    4.99,
    true,
    'Daily mobile proxy plan in Germany',
    '[
      "1 Mobile Proxy Connection",
      "Germany Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "24/7 Support"
    ]'::jsonb,
    true,
    'de',
    false,
    1
  ),
  -- Mobile Proxy - 1 Week (Germany)
  (
    '11000000-0000-0000-0000-000000000002'::uuid,
    'Mobile Proxy - 1 Week (DE)',
    'mobile',
    24.99,
    true,
    'Weekly mobile proxy plan in Germany',
    '[
      "1 Mobile Proxy Connection",
      "Germany Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "24/7 Support"
    ]'::jsonb,
    true,
    'de',
    false,
    7
  ),
  -- Mobile Proxy - 1 Month (Germany)
  (
    '11000000-0000-0000-0000-000000000003'::uuid,
    'Mobile Proxy - 1 Month (DE)',
    'mobile',
    59.99,
    true,
    'Monthly mobile proxy plan in Germany',
    '[
      "1 Mobile Proxy Connection",
      "Germany Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "Priority Support",
      "Best Value"
    ]'::jsonb,
    true,
    'de',
    false,
    30
  ),

  -- Mobile Proxy - 1 Day (UK)
  (
    '12000000-0000-0000-0000-000000000001'::uuid,
    'Mobile Proxy - 1 Day (UK)',
    'mobile',
    4.99,
    true,
    'Daily mobile proxy plan in United Kingdom',
    '[
      "1 Mobile Proxy Connection",
      "UK Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "24/7 Support"
    ]'::jsonb,
    true,
    'gb',
    false,
    1
  ),
  -- Mobile Proxy - 1 Week (UK)
  (
    '12000000-0000-0000-0000-000000000002'::uuid,
    'Mobile Proxy - 1 Week (UK)',
    'mobile',
    24.99,
    true,
    'Weekly mobile proxy plan in United Kingdom',
    '[
      "1 Mobile Proxy Connection",
      "UK Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "24/7 Support"
    ]'::jsonb,
    true,
    'gb',
    false,
    7
  ),
  -- Mobile Proxy - 1 Month (UK)
  (
    '12000000-0000-0000-0000-000000000003'::uuid,
    'Mobile Proxy - 1 Month (UK)',
    'mobile',
    59.99,
    true,
    'Monthly mobile proxy plan in United Kingdom',
    '[
      "1 Mobile Proxy Connection",
      "UK Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "Priority Support",
      "Best Value"
    ]'::jsonb,
    true,
    'gb',
    false,
    30
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  channel = EXCLUDED.channel,
  price_usd_month = EXCLUDED.price_usd_month,
  rotation_api = EXCLUDED.rotation_api,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  country = EXCLUDED.country,
  socks5_udp = EXCLUDED.socks5_udp,
  duration_days = EXCLUDED.duration_days,
  updated_at = NOW();

-- Display summary
DO $$
DECLARE
  plans_count INT;
  us_plans_count INT;
  de_plans_count INT;
  gb_plans_count INT;
BEGIN
  SELECT COUNT(*) INTO plans_count FROM public.plans WHERE is_active = true;
  SELECT COUNT(*) INTO us_plans_count FROM public.plans WHERE country = 'us' AND is_active = true;
  SELECT COUNT(*) INTO de_plans_count FROM public.plans WHERE country = 'de' AND is_active = true;
  SELECT COUNT(*) INTO gb_plans_count FROM public.plans WHERE country = 'gb' AND is_active = true;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Connection Support Migration Complete!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total active plans: %', plans_count;
  RAISE NOTICE '  - US plans: %', us_plans_count;
  RAISE NOTICE '  - DE plans: %', de_plans_count;
  RAISE NOTICE '  - GB plans: %', gb_plans_count;
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added to plans table:';
  RAISE NOTICE '  - country (2-letter code)';
  RAISE NOTICE '  - city (city code)';
  RAISE NOTICE '  - socks5_udp (boolean)';
  RAISE NOTICE '  - duration_days (integer)';
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added to proxies table:';
  RAISE NOTICE '  - order_id (UUID reference)';
  RAISE NOTICE '  - connection_data (JSONB)';
  RAISE NOTICE '  - expires_at (TIMESTAMPTZ)';
  RAISE NOTICE '===========================================';
END $$;
