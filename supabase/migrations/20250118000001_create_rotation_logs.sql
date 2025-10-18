-- Create rotation_logs table
-- Track all IP rotation events for proxies
CREATE TABLE IF NOT EXISTS public.rotation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proxy_id UUID NOT NULL REFERENCES public.proxies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_ip INET,
  new_ip INET,
  rotation_type TEXT NOT NULL CHECK (rotation_type IN ('manual', 'scheduled', 'api')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  response_data JSONB,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rotation_logs_proxy_id ON public.rotation_logs(proxy_id);
CREATE INDEX IF NOT EXISTS idx_rotation_logs_user_id ON public.rotation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rotation_logs_rotated_at ON public.rotation_logs(rotated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rotation_logs_status ON public.rotation_logs(status);

-- Enable RLS
ALTER TABLE public.rotation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rotation_logs
-- Users can view their own rotation logs
CREATE POLICY "Users can view their own rotation logs"
  ON public.rotation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rotation logs
CREATE POLICY "Users can insert their own rotation logs"
  ON public.rotation_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all rotation logs
CREATE POLICY "Admins can view all rotation logs"
  ON public.rotation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to rotation logs"
  ON public.rotation_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON public.rotation_logs TO authenticated;
GRANT ALL ON public.rotation_logs TO service_role;
