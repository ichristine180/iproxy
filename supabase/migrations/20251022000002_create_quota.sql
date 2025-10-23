-- Create quota table
-- Tracks available connection quotas
CREATE TABLE IF NOT EXISTS public.quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  available_connection_number INTEGER NOT NULL DEFAULT 0 CHECK (available_connection_number >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quota_created_at ON public.quota(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.quota IS 'Tracks available connection quotas';
COMMENT ON COLUMN public.quota.available_connection_number IS 'Number of available connections in the quota pool';

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.quota
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.quota ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quota
-- Admins can do everything
CREATE POLICY "Admins can manage quota"
  ON public.quota
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view quota (read-only)
CREATE POLICY "Users can view quota"
  ON public.quota
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Service role has full access
CREATE POLICY "Service role has full access to quota"
  ON public.quota
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.quota TO authenticated;
GRANT ALL ON public.quota TO service_role;
