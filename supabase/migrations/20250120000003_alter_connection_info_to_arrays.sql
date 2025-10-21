-- Alter proxy_id and proxy_access columns to be arrays
-- This allows one connection to support multiple proxy accesses

-- Change proxy_id from TEXT to TEXT[]
ALTER TABLE public.connection_info
ALTER COLUMN proxy_id TYPE TEXT[] USING
  CASE
    WHEN proxy_id IS NULL THEN NULL
    ELSE ARRAY[proxy_id]
  END;

-- Change proxy_access from TEXT to TEXT[]
ALTER TABLE public.connection_info
ALTER COLUMN proxy_access TYPE TEXT[] USING
  CASE
    WHEN proxy_access IS NULL THEN NULL
    ELSE ARRAY[proxy_access]
  END;

-- Update comments to reflect array nature
COMMENT ON COLUMN public.connection_info.proxy_id IS 'Array of proxy access IDs from iProxy API (returned when granting proxy access)';
COMMENT ON COLUMN public.connection_info.proxy_access IS 'Array of proxy access credentials in format IP:PORT:LOGIN:PASSWORD';
