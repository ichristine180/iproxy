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

-- Create a test user (this will also trigger the profile creation)
-- Note: This user won't have a password set in auth.users
-- You'll need to set it via Supabase dashboard or auth API
-- Password: Test123!@# (you'll need to manually create this user in Supabase Auth)

-- For now, we'll create a profile directly for a hypothetical test user
-- In production, profiles are auto-created via the trigger when a user signs up
-- The UUID below should match the auth.users id when you create the test user

DO $$
DECLARE
  test_user_id UUID := '10000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Insert test profile (in production, this would be done via trigger)
  INSERT INTO public.profiles (
    id,
    email,
    role,
    notify_email,
    notify_telegram
  ) VALUES (
    test_user_id,
    'test@iproxy.com',
    'user',
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert test proxy for the test user
  INSERT INTO public.proxies (
    id,
    user_id,
    label,
    host,
    port_http,
    port_socks5,
    username,
    password_hash,
    country,
    status,
    last_ip,
    rotation_mode,
    rotation_interval_min
  ) VALUES (
    '20000000-0000-0000-0000-000000000001'::uuid,
    test_user_id,
    'Test Mobile Proxy US',
    'proxy.iproxy.com',
    8080,
    1080,
    'testuser',
    -- This should be a hashed password in production
    '$2b$10$YourHashedPasswordHere',
    'US',
    'active',
    '192.168.1.100'::inet,
    'api',
    30
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert a test order
  INSERT INTO public.orders (
    id,
    user_id,
    plan_id,
    status,
    start_at,
    end_at,
    quantity,
    total_amount,
    currency
  ) VALUES (
    '30000000-0000-0000-0000-000000000001'::uuid,
    test_user_id,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'active',
    NOW(),
    NOW() + interval '30 days',
    1,
    29.99,
    'USD'
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Insert some sample rotation records
INSERT INTO public.rotations (
  proxy_id,
  user_id,
  source,
  result,
  old_ip,
  new_ip,
  latency_ms,
  created_at
) VALUES
  (
    '20000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    'dashboard',
    'success',
    '192.168.1.100'::inet,
    '192.168.1.101'::inet,
    250,
    NOW() - interval '2 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    'api',
    'success',
    '192.168.1.101'::inet,
    '192.168.1.102'::inet,
    180,
    NOW() - interval '1 hour'
  )
ON CONFLICT DO NOTHING;

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
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Seed data has been inserted!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Plans created: %', (SELECT COUNT(*) FROM public.plans);
  RAISE NOTICE 'Test profiles created: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Test proxies created: %', (SELECT COUNT(*) FROM public.proxies);
  RAISE NOTICE 'Test orders created: %', (SELECT COUNT(*) FROM public.orders);
  RAISE NOTICE '';
  RAISE NOTICE 'Test User Credentials:';
  RAISE NOTICE '  Email: test@iproxy.com';
  RAISE NOTICE '  Password: Test123!@# (needs to be created via auth)';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Create the auth user manually via Supabase Dashboard';
  RAISE NOTICE 'or use the signup API endpoint with the credentials above.';
  RAISE NOTICE 'Use the UUID: 10000000-0000-0000-0000-000000000001';
  RAISE NOTICE '===========================================';
END $$;
