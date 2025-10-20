-- Alter proxy_id column in connection_info table from UUID to TEXT
-- This is to store the proxy access ID from iProxy API

-- Drop the foreign key constraint
ALTER TABLE public.connection_info
DROP CONSTRAINT IF EXISTS connection_info_proxy_id_fkey;

-- Change column type from UUID to TEXT
ALTER TABLE public.connection_info
ALTER COLUMN proxy_id TYPE TEXT USING proxy_id::TEXT;

-- Update comment to reflect new purpose
COMMENT ON COLUMN public.connection_info.proxy_id IS 'Proxy access ID from iProxy API (returned when granting proxy access)';
