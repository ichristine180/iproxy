-- Move auto_renew from proxies to orders table
-- This makes more sense architecturally since renewals happen at the order level

-- Step 1: Add auto_renew column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN orders.auto_renew IS 'Whether this order should be automatically renewed before expiration';

-- Step 2: Migrate existing auto_renew values from proxies to orders
-- If ANY proxy in an order has auto_renew = true, set the order's auto_renew to true
UPDATE orders
SET auto_renew = TRUE
WHERE id IN (
  SELECT DISTINCT order_id
  FROM proxies
  WHERE auto_renew = TRUE
  AND order_id IS NOT NULL
);

-- Step 3: Create an index for efficient queries on auto_renew status
CREATE INDEX IF NOT EXISTS idx_orders_auto_renew_expires ON orders(auto_renew, expires_at)
WHERE auto_renew = TRUE AND status = 'active';

-- Step 4: Remove auto_renew from proxies table (cleanup)
-- Drop the old index first
DROP INDEX IF EXISTS idx_proxies_auto_renew_expires;

-- Remove the column
ALTER TABLE proxies
DROP COLUMN IF EXISTS auto_renew;
