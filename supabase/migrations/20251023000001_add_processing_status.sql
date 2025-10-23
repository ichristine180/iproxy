-- Add 'processing' status to orders table
-- This status is used when an order is waiting for manual provisioning by admin

-- Drop the old constraint
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new constraint with 'processing' included
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'processing', 'active', 'expired', 'failed', 'cancelled'));
