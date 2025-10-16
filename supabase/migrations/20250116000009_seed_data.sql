-- Seed data for development and testing
-- Note: In production, you'll want to remove or modify this seed data

-- Insert test plans
INSERT INTO public.plans (
  id,
  name,
  channel,
  price_usd_month,
  rotation_api,
  description,
  features,
  is_active
) VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Mobile Proxy Starter',
    'mobile',
    29.99,
    true,
    'Basic mobile proxy plan with API rotation support',
    '[
      "1 Mobile Proxy",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "24/7 Support"
    ]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Residential Proxy Pro',
    'residential',
    49.99,
    true,
    'Professional residential proxy plan',
    '[
      "5 Residential Proxies",
      "Unlimited Bandwidth",
      "Auto Rotation",
      "Multiple Locations",
      "Priority Support"
    ]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'Datacenter Proxy Basic',
    'datacenter',
    19.99,
    false,
    'Affordable datacenter proxy plan',
    '[
      "10 Datacenter Proxies",
      "High Speed",
      "Multiple Locations",
      "Standard Support"
    ]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Note: Test users, proxies, orders, and rotations require auth.users to exist first
-- Create test users via Supabase Auth Dashboard or signup API
-- The profile will be auto-created via trigger when user signs up

-- Note: To create the actual auth user, run this in Supabase dashboard or via API:
-- The password will be: Test123!@#
--
-- curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
--   -H "apikey: YOUR_ANON_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{
--     "email": "test@iproxy.com",
--     "password": "Test123!@#",
--     "options": {
--       "data": {
--         "name": "Test User"
--       }
--     }
--   }'

-- Display summary
DO $$
DECLARE
  plans_count INT;
BEGIN
  SELECT COUNT(*) INTO plans_count FROM public.plans;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Seed data has been inserted!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Plans created: %', plans_count;
  RAISE NOTICE '';
  RAISE NOTICE 'To create test users, proxies, and orders:';
  RAISE NOTICE '1. Create a user via Supabase Auth Dashboard or signup API';
  RAISE NOTICE '2. The profile will be auto-created via trigger';
  RAISE NOTICE '3. Then manually create proxies and orders for that user';
  RAISE NOTICE '===========================================';
END $$;
