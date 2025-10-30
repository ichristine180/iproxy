-- Migration to add BigDaddy and additional plans with multiple pricing tiers

-- Step 1: Insert BigDaddy plan (enhanced version)
INSERT INTO public.plans (id, name, channel, rotation_api, description, features, is_active)
VALUES (
  gen_random_uuid(),
  'BigDaddy Mobile Proxy US',
  'mobile',
  true,
  'Premium mobile proxies with enhanced limits and all advanced features',
  jsonb_build_array(
    'Speed limit: 100 Mbit/sec',
    'Logs available for download in the personal account for 12 weeks',
    'Volume discounts up to 30%',
    'Unique IP address feature',
    'Wi-Fi Split - Proxy Speed Accelerator, Saving on Data Usage',
    'SMS duplication in Telegram bot',
    '.ovpn configurations',
    'Find Phone feature',
    'Pseudo pOf substitution'
  ),
  true
);

-- Step 2: Insert Pro plan (intermediate tier)
INSERT INTO public.plans (id, name, channel, rotation_api, description, features, is_active)
VALUES (
  gen_random_uuid(),
  'Pro Mobile Proxy US',
  'mobile',
  true,
  'Professional mobile proxies with enhanced features for demanding tasks',
  jsonb_build_array(
    'Speed limit: 100 Mbit/sec',
    'Logs available for download in the personal account for 12 weeks',
    'Volume discounts up to 30%',
    'Unique IP address feature',
    'Wi-Fi Split - Proxy Speed Accelerator, Saving on Data Usage',
    'SMS duplication in Telegram bot'
  ),
  true
);

-- Step 3: Add pricing for BigDaddy plan
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get the BigDaddy plan ID
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'BigDaddy Mobile Proxy US' LIMIT 1;

  -- Insert daily pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'daily', 200.00);

  -- Insert weekly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'weekly', 350.00);

  -- Insert monthly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'monthly', 600.00);
END $$;

-- Step 4: Add pricing for Pro plan
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get the Pro plan ID
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'Pro Mobile Proxy US' LIMIT 1;

  -- Insert daily pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'daily', 150.00);

  -- Insert weekly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'weekly', 250.00);

  -- Insert monthly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'monthly', 400.00);
END $$;
