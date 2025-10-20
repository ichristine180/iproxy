-- Create connection_info table
-- Admin-managed connection tracking table
CREATE TABLE IF NOT EXISTS public.connection_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id TEXT NOT NULL UNIQUE,
  client_email TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  proxy_id UUID REFERENCES public.proxies(id) ON DELETE SET NULL,
  proxy_access TEXT,
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_connection_info_connection_id ON public.connection_info(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_info_user_id ON public.connection_info(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_info_order_id ON public.connection_info(order_id);
CREATE INDEX IF NOT EXISTS idx_connection_info_is_occupied ON public.connection_info(is_occupied);
CREATE INDEX IF NOT EXISTS idx_connection_info_expires_at ON public.connection_info(expires_at);

-- Add comments for documentation
COMMENT ON TABLE public.connection_info IS 'Admin-managed connection tracking table for iProxy connections';
COMMENT ON COLUMN public.connection_info.connection_id IS 'Connection ID from iProxy.online Console API (required)';
COMMENT ON COLUMN public.connection_info.client_email IS 'Email of the client who paid for the proxy';
COMMENT ON COLUMN public.connection_info.user_id IS 'Reference to the user profile';
COMMENT ON COLUMN public.connection_info.order_id IS 'Reference to the order that created this connection';
COMMENT ON COLUMN public.connection_info.proxy_id IS 'Reference to the proxy using this connection';
COMMENT ON COLUMN public.connection_info.proxy_access IS 'Proxy access credentials in format IP:PORT:LOGIN:PASSWORD';
COMMENT ON COLUMN public.connection_info.is_occupied IS 'Whether this connection is currently occupied';
COMMENT ON COLUMN public.connection_info.expires_at IS 'When the connection expires';

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.connection_info
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.connection_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connection_info
-- Admins can do everything
CREATE POLICY "Admins can manage all connections"
  ON public.connection_info
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own connections
CREATE POLICY "Users can view their own connections"
  ON public.connection_info
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to connection_info"
  ON public.connection_info
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.connection_info TO authenticated;
GRANT ALL ON public.connection_info TO service_role;
