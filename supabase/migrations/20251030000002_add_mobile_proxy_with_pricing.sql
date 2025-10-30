-- Migration to clear all plans and add Mobile Proxy plan with multiple pricing tiers

-- Step 1: Delete all existing plans (this will cascade to plan_pricing)
DELETE FROM public.plans;

-- Step 2: Insert Mobile Proxy plan
INSERT INTO public.plans (id, name, channel, rotation_api, description, features, is_active)
VALUES (
  gen_random_uuid(),
  'Mobile Proxy US',
  'mobile',
  true,
  'High-speed mobile proxies with unlimited bandwidth and advanced features',
  jsonb_build_array(
    'Speed limit: 100 Mbit/sec',
    'Logs available for download in the personal account for 12 weeks',
    'Volume discounts up to 30%',
    'Unique IP address feature'
  ),
  true
);

-- Step 3: Get the plan ID and insert pricing tiers
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get the plan ID we just created
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'Mobile Proxy US' LIMIT 1;

  -- Insert daily pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'daily', 100.00);

  -- Insert weekly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'weekly', 101.00);

  -- Insert monthly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'monthly', 102.00);
END $$;
