-- Migration to restructure plans table and add plan_pricing table
-- This migration removes price_usd_month from plans and creates a separate pricing table

-- Step 1: Create the new plan_pricing table
CREATE TABLE IF NOT EXISTS public.plan_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  duration TEXT NOT NULL CHECK (duration IN ('daily', 'weekly', 'monthly', 'yearly')),
  price_usd DECIMAL(10, 2) NOT NULL CHECK (price_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, duration) -- Prevent duplicate durations for same plan
);

-- Create indexes for plan_pricing
CREATE INDEX IF NOT EXISTS idx_plan_pricing_plan_id ON public.plan_pricing(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_pricing_duration ON public.plan_pricing(duration);

-- Step 2: Migrate existing pricing data from plans to plan_pricing
-- Convert existing monthly prices to the new pricing table
INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
SELECT id, 'monthly', price_usd_month
FROM public.plans
WHERE price_usd_month IS NOT NULL;

-- Step 3: Remove price_usd_month column from plans table
ALTER TABLE public.plans DROP COLUMN IF EXISTS price_usd_month;

-- Step 4: Remove duration_days column if it exists (no longer needed with new structure)
ALTER TABLE public.plans DROP COLUMN IF EXISTS duration_days;

-- Step 5: Remove country column if it exists (should be part of plan name)
ALTER TABLE public.plans DROP COLUMN IF EXISTS country;

-- Enable RLS for plan_pricing
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plan_pricing
-- Everyone can view pricing for active plans (even unauthenticated users)
CREATE POLICY "Anyone can view pricing for active plans"
  ON public.plan_pricing
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans
      WHERE plans.id = plan_pricing.plan_id AND plans.is_active = true
    )
  );

-- Admins can manage pricing
CREATE POLICY "Admins can manage pricing"
  ON public.plan_pricing
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to plan_pricing"
  ON public.plan_pricing
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.plan_pricing TO anon, authenticated;
GRANT ALL ON public.plan_pricing TO service_role;

-- Add helpful comment
COMMENT ON TABLE public.plan_pricing IS 'Stores pricing information for plans with different durations (daily, weekly, monthly, yearly)';
COMMENT ON COLUMN public.plan_pricing.duration IS 'Duration type: daily, weekly, monthly, or yearly';
COMMENT ON COLUMN public.plan_pricing.price_usd IS 'Price in USD for the specified duration';
