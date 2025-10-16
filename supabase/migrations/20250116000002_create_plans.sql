-- Create plans table
-- Plans are public (can be viewed by anyone) but managed by admins only
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'mobile' CHECK (channel IN ('mobile', 'residential', 'datacenter')),
  price_usd_month DECIMAL(10, 2) NOT NULL CHECK (price_usd_month >= 0),
  rotation_api BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plans_channel ON public.plans(channel);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans
-- Everyone can view active plans (even unauthenticated users)
CREATE POLICY "Anyone can view active plans"
  ON public.plans
  FOR SELECT
  USING (is_active = true);

-- Admins can manage plans
CREATE POLICY "Admins can manage plans"
  ON public.plans
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
CREATE POLICY "Service role has full access to plans"
  ON public.plans
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
