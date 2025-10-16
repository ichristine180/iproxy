# iProxy Database Setup Guide

Complete guide for setting up and managing the iProxy Supabase database.

## Quick Start

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Initialize Local Development
```bash
# Run the setup script
./scripts/db-setup.sh

# Or manually:
supabase start
```

### 3. Apply Migrations
```bash
# For local development
supabase db reset

# For production
supabase link --project-ref your-project-ref
supabase db push
```

## Database Schema Overview

### Core Tables

1. **profiles** - User profiles (auto-created on signup)
   - Links to `auth.users`
   - Stores user preferences and role

2. **plans** - Subscription plans
   - Mobile, Residential, Datacenter channels
   - Pricing and features

3. **proxies** - User proxy configurations
   - Credentials and connection details
   - IP rotation settings

4. **orders** - User subscriptions
   - Links users to plans
   - Tracks subscription periods

5. **payments** - Payment transactions
   - Cryptomus integration
   - Payment status tracking

6. **rotations** - IP rotation history
   - Tracks rotation attempts
   - Performance metrics

7. **api_keys** - API access tokens
   - Hashed keys for security
   - Scope-based permissions

8. **webhook_events** - Incoming webhooks
   - Payment provider callbacks
   - Processing status

9. **audit_logs** - Activity tracking
   - Security audit trail
   - User actions log

## Row Level Security (RLS)

All tables have RLS enabled with three access levels:

### User Access
```sql
-- Users can only see their own data
WHERE user_id = auth.uid()
```

### Admin Access
```sql
-- Admins can see all data
EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

### Service Role Access
```sql
-- Backend has full access
WHERE auth.jwt()->>'role' = 'service_role'
```

## Automatic Triggers

The database includes several automatic triggers:

1. **Profile Creation** - Auto-creates profile when user signs up
2. **Order Activation** - Activates order when payment succeeds
3. **Proxy Updates** - Updates proxy status on rotation
4. **Audit Logging** - Logs important actions automatically
5. **Timestamp Management** - Updates `updated_at` fields

## Seed Data

The migrations include test data:

- **3 Sample Plans** (Mobile, Residential, Datacenter)
- **1 Test User** (test@iproxy.com)
- **1 Test Proxy** (Sample configuration)
- **Sample Rotations** (Historical data)

### Creating Test User

After running migrations:

1. Go to Supabase Dashboard → Authentication → Users
2. Add User:
   - Email: test@iproxy.com
   - Password: Test123!@#
   - User ID: 10000000-0000-0000-0000-000000000001

Or use the signup API:
```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@iproxy.com",
    "password": "Test123!@#"
  }'
```

## Environment Setup

Required environment variables in `.env`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Other services
NEXT_PUBLIC_CRYPTOMUS_API_BASE=https://api.cryptomus.com
CRYPTOMUS_MERCHANT_UUID=your-merchant-uuid
CRYPTOMUS_API_KEY=your-api-key
RESEND_API_KEY=your-resend-key
TELEGRAM_BOT_TOKEN=your-telegram-token

# App URLs
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_RENT_BASE_URL=http://localhost:3001
```

## Database Functions

### Logging Audit Events
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();

const { data } = await supabase.rpc('log_audit_event', {
  p_user_id: userId,
  p_action: 'proxy.created',
  p_target_type: 'proxies',
  p_target_id: proxyId,
  p_meta: { key: 'value' }
});
```

### Validating API Keys
```typescript
const { data } = await supabase.rpc('validate_api_key', {
  key_hash_input: hashedKey
});

if (data[0]?.is_valid) {
  // API key is valid
  const userId = data[0].user_id;
  const scopes = data[0].scopes;
}
```

### Revoking API Keys
```typescript
await supabase.rpc('revoke_api_key', {
  api_key_id: keyId,
  reason: 'User requested revocation'
});
```

### Checking Expired Orders
```typescript
// Run periodically (e.g., cron job)
await supabase.rpc('check_expired_orders');
```

## TypeScript Integration

Generate types from your database:

```bash
supabase gen types typescript --local > types/supabase.ts
```

Use in your code:

```typescript
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Proxy = Database['public']['Tables']['proxies']['Row'];
```

## Common Operations

### Creating a Proxy
```typescript
const { data, error } = await supabase
  .from('proxies')
  .insert({
    user_id: userId,
    label: 'My Proxy',
    host: 'proxy.example.com',
    port_http: 8080,
    port_socks5: 1080,
    username: 'user',
    password_hash: hashedPassword,
    country: 'US'
  })
  .select()
  .single();
```

### Recording a Rotation
```typescript
const { data, error } = await supabase
  .from('rotations')
  .insert({
    proxy_id: proxyId,
    user_id: userId,
    source: 'api',
    result: 'success',
    old_ip: '192.168.1.1',
    new_ip: '192.168.1.2',
    latency_ms: 250
  })
  .select()
  .single();
```

### Creating an Order
```typescript
const { data, error } = await supabase
  .from('orders')
  .insert({
    user_id: userId,
    plan_id: planId,
    quantity: 1,
    total_amount: 29.99,
    currency: 'USD'
  })
  .select()
  .single();
```

### Processing a Payment
```typescript
// Create payment record
const { data: payment } = await supabase
  .from('payments')
  .insert({
    user_id: userId,
    order_id: orderId,
    provider: 'cryptomus',
    invoice_uuid: invoiceId,
    amount: 29.99,
    currency: 'USD'
  })
  .select()
  .single();

// Update payment status (webhook handler)
const { error } = await supabase
  .from('payments')
  .update({
    status: 'paid',
    is_final: true,
    paid_at: new Date().toISOString(),
    txid: transactionId
  })
  .eq('id', paymentId);
```

## Maintenance

### Scheduled Tasks

Set up cron jobs for maintenance:

1. **Expire Orders** (Daily)
   ```typescript
   await supabase.rpc('check_expired_orders');
   ```

2. **Clean Webhooks** (Weekly)
   ```sql
   DELETE FROM webhook_events
   WHERE created_at < NOW() - interval '30 days'
     AND processed_at IS NOT NULL;
   ```

3. **Analyze Tables** (Weekly)
   ```sql
   ANALYZE public.proxies;
   ANALYZE public.rotations;
   ```

### Monitoring

Check database health:
```bash
supabase status
```

View logs:
```bash
supabase logs
```

## Security Best Practices

1. **Never expose service role key** to client-side code
2. **Always use RLS** - Never disable it
3. **Hash sensitive data** (passwords, API keys)
4. **Verify webhook signatures** before processing
5. **Use prepared statements** to prevent SQL injection
6. **Rotate API keys** regularly
7. **Monitor audit logs** for suspicious activity
8. **Backup database** regularly

## Troubleshooting

### RLS Access Denied
- Check if user is authenticated: `SELECT auth.uid();`
- Verify RLS policies: Supabase Dashboard → Database → Policies
- Use service role for admin operations

### Trigger Not Firing
- Check trigger exists: `\dft` in SQL Editor
- Verify function permissions
- Check Supabase logs for errors

### Migration Fails
- Check for existing tables
- Verify foreign key constraints
- Run migrations in order

### Performance Issues
- Add indexes for frequently queried columns
- Use `EXPLAIN ANALYZE` to debug slow queries
- Consider table partitioning for large tables

## Resources

- **Migrations**: `/supabase/migrations/`
- **Common Queries**: `/supabase/QUERIES.md`
- **Type Definitions**: `/types/database.types.ts`
- **Setup Script**: `/scripts/db-setup.sh`
- **Supabase Docs**: https://supabase.com/docs

## Production Checklist

Before deploying to production:

- [ ] Remove or modify seed data
- [ ] Update Supabase project settings
- [ ] Configure email templates
- [ ] Set up proper SMTP for auth emails
- [ ] Enable database backups
- [ ] Configure SSL for connections
- [ ] Set up monitoring and alerts
- [ ] Test RLS policies thoroughly
- [ ] Review and optimize indexes
- [ ] Set up cron jobs for maintenance
- [ ] Document custom procedures
- [ ] Train team on schema

## Getting Help

For issues or questions:
- Check migration files for inline comments
- Review RLS policies in Supabase Dashboard
- Consult `/supabase/QUERIES.md` for examples
- Visit Supabase Discord: https://discord.supabase.com
- Read Supabase Docs: https://supabase.com/docs
