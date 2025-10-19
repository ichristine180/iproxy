-- Add latency_ms column to rotation_logs table
ALTER TABLE public.rotation_logs
ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.rotation_logs.latency_ms IS 'Latency in milliseconds for the rotation request';
