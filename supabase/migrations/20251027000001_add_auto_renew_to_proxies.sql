-- Add auto_renew column to proxies table
-- This column determines whether a proxy should be automatically renewed before expiration

ALTER TABLE proxies
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE;

-- Add a comment to document the column
COMMENT ON COLUMN proxies.auto_renew IS 'Whether this proxy should be automatically renewed before expiration';

-- Create an index for efficient queries on auto_renew status
CREATE INDEX IF NOT EXISTS idx_proxies_auto_renew_expires ON proxies(auto_renew, expires_at)
WHERE auto_renew = TRUE AND status = 'active';
