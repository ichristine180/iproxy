-- Create quota_reservations table to track temporary quota holds
CREATE TABLE IF NOT EXISTS quota_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reserved_connections INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'expired', 'released')),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_quota_reservations_order_id ON quota_reservations(order_id);
CREATE INDEX idx_quota_reservations_user_id ON quota_reservations(user_id);
CREATE INDEX idx_quota_reservations_status ON quota_reservations(status);
CREATE INDEX idx_quota_reservations_expires_at ON quota_reservations(expires_at) WHERE status = 'reserved';

-- Function to automatically release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER;
  expired_reservation RECORD;
  current_quota RECORD;
BEGIN
  -- Get current quota
  SELECT * INTO current_quota FROM quota ORDER BY created_at DESC LIMIT 1;

  IF current_quota IS NULL THEN
    RAISE NOTICE 'No quota found';
    RETURN 0;
  END IF;

  released_count := 0;

  -- Find and release expired reservations
  FOR expired_reservation IN
    SELECT * FROM quota_reservations
    WHERE status = 'reserved'
      AND expires_at <= now()
  LOOP
    -- Update reservation status
    UPDATE quota_reservations
    SET
      status = 'expired',
      released_at = now(),
      updated_at = now()
    WHERE id = expired_reservation.id;

    -- Return quota back to available pool
    UPDATE quota
    SET
      available_connection_number = available_connection_number + expired_reservation.reserved_connections,
      updated_at = now()
    WHERE id = current_quota.id;

    -- Update order status to expired if still pending
    UPDATE orders
    SET
      status = 'expired',
      updated_at = now()
    WHERE id = expired_reservation.order_id
      AND status = 'pending';

    released_count := released_count + 1;

    RAISE NOTICE 'Released expired reservation % for order %', expired_reservation.id, expired_reservation.order_id;
  END LOOP;

  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve quota when order is created
CREATE OR REPLACE FUNCTION reserve_quota(
  p_order_id UUID,
  p_user_id UUID,
  p_connections INT DEFAULT 1,
  p_expiry_minutes INT DEFAULT 15
)
RETURNS JSON AS $$
DECLARE
  current_quota RECORD;
  new_reservation RECORD;
  expiry_time TIMESTAMPTZ;
BEGIN
  -- Get current quota
  SELECT * INTO current_quota FROM quota ORDER BY created_at DESC LIMIT 1;

  IF current_quota IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No quota configured'
    );
  END IF;

  -- Check if enough quota is available
  IF current_quota.available_connection_number < p_connections THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient quota available',
      'available', current_quota.available_connection_number,
      'requested', p_connections
    );
  END IF;

  -- Calculate expiry time
  expiry_time := now() + (p_expiry_minutes || ' minutes')::INTERVAL;

  -- Create reservation
  INSERT INTO quota_reservations (
    order_id,
    user_id,
    reserved_connections,
    status,
    reserved_at,
    expires_at
  ) VALUES (
    p_order_id,
    p_user_id,
    p_connections,
    'reserved',
    now(),
    expiry_time
  )
  RETURNING * INTO new_reservation;

  -- Deduct from available quota
  UPDATE quota
  SET
    available_connection_number = available_connection_number - p_connections,
    updated_at = now()
  WHERE id = current_quota.id;

  RETURN json_build_object(
    'success', true,
    'reservation_id', new_reservation.id,
    'expires_at', new_reservation.expires_at,
    'expires_in_seconds', EXTRACT(EPOCH FROM (expiry_time - now()))::INT,
    'reserved_connections', p_connections
  );
END;
$$ LANGUAGE plpgsql;

-- Function to confirm reservation when payment is completed
CREATE OR REPLACE FUNCTION confirm_quota_reservation(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  reservation RECORD;
BEGIN
  -- Find reservation for this order
  SELECT * INTO reservation FROM quota_reservations
  WHERE order_id = p_order_id
    AND status = 'reserved'
  ORDER BY created_at DESC
  LIMIT 1;

  IF reservation IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active reservation found for this order'
    );
  END IF;

  -- Check if reservation has expired
  IF reservation.expires_at <= now() THEN
    -- Release the reservation
    UPDATE quota_reservations
    SET
      status = 'expired',
      released_at = now(),
      updated_at = now()
    WHERE id = reservation.id;

    RETURN json_build_object(
      'success', false,
      'error', 'Reservation has expired',
      'expired_at', reservation.expires_at
    );
  END IF;

  -- Confirm reservation
  UPDATE quota_reservations
  SET
    status = 'confirmed',
    confirmed_at = now(),
    updated_at = now()
  WHERE id = reservation.id;

  RETURN json_build_object(
    'success', true,
    'reservation_id', reservation.id,
    'confirmed_at', now()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to release reservation manually (e.g., cancelled order)
CREATE OR REPLACE FUNCTION release_quota_reservation(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  reservation RECORD;
  current_quota RECORD;
BEGIN
  -- Find reservation for this order
  SELECT * INTO reservation FROM quota_reservations
  WHERE order_id = p_order_id
    AND status = 'reserved'
  ORDER BY created_at DESC
  LIMIT 1;

  IF reservation IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active reservation found for this order'
    );
  END IF;

  -- Get current quota
  SELECT * INTO current_quota FROM quota ORDER BY created_at DESC LIMIT 1;

  -- Update reservation
  UPDATE quota_reservations
  SET
    status = 'released',
    released_at = now(),
    updated_at = now()
  WHERE id = reservation.id;

  -- Return quota to pool
  UPDATE quota
  SET
    available_connection_number = available_connection_number + reservation.reserved_connections,
    updated_at = now()
  WHERE id = current_quota.id;

  RETURN json_build_object(
    'success', true,
    'reservation_id', reservation.id,
    'released_connections', reservation.reserved_connections
  );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to cleanup expired reservations every minute
-- Note: This requires pg_cron extension which should be enabled in Supabase
-- If pg_cron is not available, you can call release_expired_reservations() from your application
