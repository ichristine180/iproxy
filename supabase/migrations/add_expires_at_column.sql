-- Migration: Add expires_at column to orders table
-- This column is needed to track when an order/subscription expires

-- Add expires_at column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add index for better query performance on expiry checks
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON public.orders(expires_at);

-- Add start_at column if it doesn't exist (for tracking when order starts)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for start_at as well
CREATE INDEX IF NOT EXISTS idx_orders_start_at ON public.orders(start_at);

-- Update existing orders to set expires_at to 30 days from creation if null
-- (only for active orders)
UPDATE public.orders
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL
  AND status = 'active';

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN ('expires_at', 'start_at')
ORDER BY column_name;
