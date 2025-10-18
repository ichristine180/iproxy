-- Add iproxy_connection_id to proxies table for Console API
-- This stores the connection ID needed for IP rotation via command-push

ALTER TABLE public.proxies
ADD COLUMN IF NOT EXISTS iproxy_connection_id TEXT;

-- Add index for connection lookups
CREATE INDEX IF NOT EXISTS idx_proxies_connection_id ON public.proxies(iproxy_connection_id);

-- Add comment
COMMENT ON COLUMN public.proxies.iproxy_connection_id IS 'iProxy.online connection ID for command-push API (Console API)';
