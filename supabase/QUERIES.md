# Common Database Queries

This document contains useful SQL queries for managing the iProxy database.

## User Management

### Get user profile
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

### Update user notification preferences
```sql
UPDATE profiles
SET notify_email = true, notify_telegram = false
WHERE id = auth.uid();
```

### Get user with all their proxies
```sql
SELECT
  p.*,
  json_agg(pr.*) as proxies
FROM profiles p
LEFT JOIN proxies pr ON pr.user_id = p.id
WHERE p.id = auth.uid()
GROUP BY p.id;
```

## Proxy Management

### Get user's active proxies
```sql
SELECT * FROM proxies
WHERE user_id = auth.uid()
  AND status = 'active'
ORDER BY created_at DESC;
```

### Get proxy with rotation history
```sql
SELECT
  p.*,
  json_agg(
    json_build_object(
      'id', r.id,
      'old_ip', r.old_ip,
      'new_ip', r.new_ip,
      'created_at', r.created_at
    ) ORDER BY r.created_at DESC
  ) as rotations
FROM proxies p
LEFT JOIN rotations r ON r.proxy_id = p.id
WHERE p.id = 'proxy-uuid'
  AND p.user_id = auth.uid()
GROUP BY p.id;
```

### Get proxies due for scheduled rotation
```sql
SELECT * FROM proxies
WHERE rotation_mode = 'scheduled'
  AND status = 'active'
  AND (
    last_rotated_at IS NULL
    OR last_rotated_at < NOW() - (rotation_interval_min || ' minutes')::interval
  );
```

## Order & Payment Management

### Get user's active orders with plan details
```sql
SELECT
  o.*,
  p.name as plan_name,
  p.channel as plan_channel,
  p.price_usd_month
FROM orders o
JOIN plans p ON p.id = o.plan_id
WHERE o.user_id = auth.uid()
  AND o.status = 'active'
ORDER BY o.created_at DESC;
```

### Get order with payment history
```sql
SELECT
  o.*,
  json_agg(
    json_build_object(
      'id', pay.id,
      'amount', pay.amount,
      'status', pay.status,
      'created_at', pay.created_at
    ) ORDER BY pay.created_at DESC
  ) as payments
FROM orders o
LEFT JOIN payments pay ON pay.order_id = o.id
WHERE o.id = 'order-uuid'
  AND o.user_id = auth.uid()
GROUP BY o.id;
```

### Get pending payments
```sql
SELECT * FROM payments
WHERE user_id = auth.uid()
  AND status = 'pending'
ORDER BY created_at DESC;
```

## Plans & Subscriptions

### Get all active plans
```sql
SELECT * FROM plans
WHERE is_active = true
ORDER BY price_usd_month ASC;
```

### Get plan with subscriber count
```sql
SELECT
  p.*,
  COUNT(o.id) as subscriber_count,
  SUM(CASE WHEN o.status = 'active' THEN 1 ELSE 0 END) as active_subscribers
FROM plans p
LEFT JOIN orders o ON o.plan_id = p.id
GROUP BY p.id
ORDER BY p.price_usd_month ASC;
```

## Rotation History

### Get recent rotations
```sql
SELECT
  r.*,
  p.label as proxy_label
FROM rotations r
JOIN proxies p ON p.id = r.proxy_id
WHERE r.user_id = auth.uid()
ORDER BY r.created_at DESC
LIMIT 50;
```

### Get rotation success rate by proxy
```sql
SELECT
  proxy_id,
  COUNT(*) as total_rotations,
  SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) as successful,
  ROUND(
    100.0 * SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as success_rate,
  AVG(latency_ms) as avg_latency
FROM rotations
WHERE user_id = auth.uid()
GROUP BY proxy_id;
```

### Get failed rotations with errors
```sql
SELECT
  r.*,
  p.label as proxy_label
FROM rotations r
JOIN proxies p ON p.id = r.proxy_id
WHERE r.user_id = auth.uid()
  AND r.result = 'failed'
ORDER BY r.created_at DESC
LIMIT 20;
```

## API Key Management

### Get user's API keys
```sql
SELECT
  id,
  name,
  key_prefix,
  scopes,
  last_used_at,
  revoked,
  created_at
FROM api_keys
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Revoke an API key
```sql
SELECT revoke_api_key(
  'api-key-uuid'::uuid,
  'Key compromised'
);
```

### Get API key usage statistics
```sql
SELECT
  name,
  key_prefix,
  last_used_at,
  CASE
    WHEN last_used_at IS NULL THEN 'Never used'
    WHEN last_used_at > NOW() - interval '1 day' THEN 'Active'
    WHEN last_used_at > NOW() - interval '7 days' THEN 'Recent'
    ELSE 'Inactive'
  END as usage_status
FROM api_keys
WHERE user_id = auth.uid()
  AND revoked = false
ORDER BY last_used_at DESC NULLS LAST;
```

## Audit Logs

### Get user's recent activity
```sql
SELECT * FROM audit_logs
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 50;
```

### Get all activity for a specific resource
```sql
SELECT
  al.*,
  p.email as user_email
FROM audit_logs al
LEFT JOIN profiles p ON p.id = al.user_id
WHERE al.target_type = 'proxies'
  AND al.target_id = 'proxy-uuid'
ORDER BY al.created_at DESC;
```

## Analytics & Reports

### Get user statistics
```sql
SELECT
  COUNT(DISTINCT pr.id) as total_proxies,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'active' THEN o.id END) as active_orders,
  SUM(pay.amount) as total_spent,
  COUNT(r.id) as total_rotations,
  AVG(r.latency_ms) as avg_rotation_latency
FROM profiles p
LEFT JOIN proxies pr ON pr.user_id = p.id
LEFT JOIN orders o ON o.user_id = p.id
LEFT JOIN payments pay ON pay.user_id = p.id AND pay.status = 'paid'
LEFT JOIN rotations r ON r.user_id = p.id
WHERE p.id = auth.uid()
GROUP BY p.id;
```

### Get revenue report (Admin only)
```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as payment_count,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_transaction
FROM payments
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### Get proxy usage by country (Admin only)
```sql
SELECT
  country,
  COUNT(*) as proxy_count,
  COUNT(DISTINCT user_id) as unique_users
FROM proxies
WHERE country IS NOT NULL
GROUP BY country
ORDER BY proxy_count DESC;
```

## Maintenance Queries

### Expire old orders
```sql
SELECT check_expired_orders();
```

### Clean up old webhook events (older than 30 days)
```sql
DELETE FROM webhook_events
WHERE created_at < NOW() - interval '30 days'
  AND processed_at IS NOT NULL;
```

### Find orphaned records
```sql
-- Payments without orders
SELECT * FROM payments
WHERE order_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM orders WHERE id = payments.order_id
  );

-- Rotations without proxies
SELECT * FROM rotations
WHERE NOT EXISTS (
    SELECT 1 FROM proxies WHERE id = rotations.proxy_id
  );
```

### Get table sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Performance Optimization

### Find slow queries (requires pg_stat_statements extension)
```sql
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Analyze table statistics
```sql
ANALYZE VERBOSE public.proxies;
ANALYZE VERBOSE public.rotations;
ANALYZE VERBOSE public.orders;
```

### Rebuild indexes
```sql
REINDEX TABLE public.proxies;
REINDEX TABLE public.rotations;
```

## Testing Queries

### Create test rotation
```sql
INSERT INTO rotations (
  proxy_id,
  user_id,
  source,
  result,
  old_ip,
  new_ip,
  latency_ms
) VALUES (
  'your-proxy-id'::uuid,
  auth.uid(),
  'api',
  'success',
  '192.168.1.1'::inet,
  '192.168.1.2'::inet,
  200
);
```

### Simulate payment success
```sql
UPDATE payments
SET
  status = 'paid',
  is_final = true,
  paid_at = NOW()
WHERE id = 'payment-uuid'
  AND user_id = auth.uid();
```

## Security Checks

### List users without verified emails
```sql
SELECT
  p.id,
  p.email,
  u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email_confirmed_at IS NULL;
```

### Find suspicious activity (multiple failed payments)
```sql
SELECT
  user_id,
  COUNT(*) as failed_payments,
  MAX(created_at) as last_failed_at
FROM payments
WHERE status = 'failed'
  AND created_at > NOW() - interval '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 3
ORDER BY failed_payments DESC;
```

### Check for unused API keys
```sql
SELECT * FROM api_keys
WHERE revoked = false
  AND (
    last_used_at IS NULL
    OR last_used_at < NOW() - interval '90 days'
  )
ORDER BY created_at ASC;
```
