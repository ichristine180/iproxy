-- Add field to track when expiry notification was sent for a proxy
ALTER TABLE proxies ADD COLUMN IF NOT EXISTS expiry_notification_sent_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN proxies.expiry_notification_sent_at IS 'Timestamp when the 3-day expiry notification was last sent to the user';
