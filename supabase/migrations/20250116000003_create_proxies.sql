-- Create proxies table
-- User-owned proxy configurations
CREATE TABLE IF NOT EXISTS public.proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  host TEXT NOT NULL,
  port_http INTEGER CHECK (port_http >= 1 AND port_http <= 65535),
  port_socks5 INTEGER CHECK (port_socks5 >= 1 AND port_socks5 <= 65535),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'rotating')),
  last_ip INET,
  iproxy_change_url TEXT,
  iproxy_action_link_id TEXT,
  rotation_mode TEXT DEFAULT 'manual' CHECK (rotation_mode IN ('manual', 'api', 'scheduled')),
  rotation_interval_min INTEGER CHECK (rotation_interval_min IS NULL OR rotation_interval_min > 0),
  last_rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proxies_user_id ON public.proxies(user_id);
CREATE INDEX IF NOT EXISTS idx_proxies_status ON public.proxies(status);
CREATE INDEX IF NOT EXISTS idx_proxies_last_rotated_at ON public.proxies(last_rotated_at);
CREATE INDEX IF NOT EXISTS idx_proxies_rotation_mode ON public.proxies(rotation_mode);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.proxies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.proxies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proxies
-- Users can view their own proxies
CREATE POLICY "Users can view their own proxies"
  ON public.proxies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own proxies
CREATE POLICY "Users can insert their own proxies"
  ON public.proxies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own proxies
CREATE POLICY "Users can update their own proxies"
  ON public.proxies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own proxies
CREATE POLICY "Users can delete their own proxies"
  ON public.proxies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all proxies
CREATE POLICY "Admins can view all proxies"
  ON public.proxies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to proxies"
  ON public.proxies
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proxies TO authenticated;
GRANT ALL ON public.proxies TO service_role;
