# Database Migrations

This directory contains SQL migrations for the iProxy database schema.

## Overview

The database schema includes the following tables:

1. **profiles** - User profiles extending auth.users
2. **plans** - Subscription plans (mobile, residential, datacenter)
3. **proxies** - User-owned proxy configurations
4. **orders** - User subscription orders
5. **payments** - Payment transactions (Cryptomus integration)
6. **rotations** - IP rotation history
7. **api_keys** - API keys for programmatic access
8. **webhook_events** - Incoming webhook events
9. **audit_logs** - System audit trail

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **User-scoped tables**: Users can only access their own data (`user_id = auth.uid()`)
- **Admin access**: Admins can view all records
- **Service role**: Full access for backend operations
- **Public tables**: Plans are viewable by everyone

## Running Migrations

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations to Supabase
supabase db push

# Or reset and apply all migrations
supabase db reset
```

### Manual Application

If you prefer to run migrations manually:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (they're numbered sequentially)

## Seed Data

The last migration (`20250116000009_seed_data.sql`) includes:

- 3 sample plans (Mobile, Residential, Datacenter)
- 1 test user profile
- 1 test proxy configuration
- Sample rotation records

### Creating Test User

After running migrations, create the test user via Supabase Auth:

**Email**: test@iproxy.com
**Password**: Test123!@#
**User ID**: 10000000-0000-0000-0000-000000000001

You can create this user via:

1. Supabase Dashboard → Authentication → Users → Add User
2. Or via API:

```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@iproxy.com",
    "password": "Test123!@#",
    "options": {
      "data": {
        "name": "Test User"
      }
    }
  }'
```

## Key Features

### Automatic Triggers

- **Profile Creation**: Automatically creates profile when user signs up
- **Order Activation**: Automatically activates order when payment is confirmed
- **Proxy Updates**: Updates proxy status and last IP on rotation
- **Audit Logging**: Logs important actions automatically
- **Timestamp Updates**: Auto-updates `updated_at` fields

### Helper Functions

#### `public.log_audit_event()`
Log custom audit events:
```sql
SELECT public.log_audit_event(
  p_user_id := auth.uid(),
  p_action := 'custom.action',
  p_target_type := 'resource_type',
  p_target_id := 'resource-uuid'::uuid,
  p_meta := '{"key": "value"}'::jsonb
);
```

#### `public.revoke_api_key()`
Revoke an API key:
```sql
SELECT public.revoke_api_key(
  'api-key-uuid'::uuid,
  'Compromised key'
);
```

#### `public.validate_api_key()`
Validate API key and get user info:
```sql
SELECT * FROM public.validate_api_key('hashed_key_value');
```

#### `public.check_expired_orders()`
Check and expire old orders:
```sql
SELECT public.check_expired_orders();
```

## Environment Variables Required

Make sure these are set in your `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Schema Diagram

```
auth.users (Supabase Auth)
    ↓
profiles (user data)
    ↓
    ├─→ proxies (proxy configs)
    │     ↓
    │     └─→ rotations (rotation history)
    │
    ├─→ orders (subscriptions)
    │     ↓
    │     └─→ payments (transactions)
    │
    ├─→ api_keys (API access)
    │
    └─→ audit_logs (activity trail)

plans (subscription tiers)
    ↓
orders (links to plans)

webhook_events (payment webhooks)
```

## Security Notes

1. **Password Hashing**: Always hash proxy passwords before storing
2. **API Keys**: Store only hashed versions, show prefix for identification
3. **Service Role**: Use service role key only in secure backend environments
4. **RLS Policies**: Never disable RLS without proper security review
5. **Webhook Signatures**: Always verify webhook signatures before processing

## Troubleshooting

### RLS Access Denied
If you get "permission denied" errors, check:
- User is authenticated (`auth.uid()` returns a value)
- User has correct permissions (check policies)
- Service role key is used for admin operations

### Trigger Not Firing
Check:
- Table has the trigger attached (`\d table_name` in psql)
- Function exists and has correct permissions
- Check Supabase logs for errors

### Migration Conflicts
If migrations fail:
1. Check for existing tables: `\dt` in SQL Editor
2. Drop conflicting tables (careful in production!)
3. Re-run migrations

## Production Deployment

Before deploying to production:

1. **Review Seed Data**: Remove or modify test data
2. **Backup Database**: Always backup before migrations
3. **Test Migrations**: Run on staging environment first
4. **Monitor Logs**: Check Supabase logs after deployment
5. **Verify RLS**: Test permissions with different user roles

## Support

For issues or questions:
- Check Supabase Documentation: https://supabase.com/docs
- Review migration files for inline comments
- Check RLS policies in Supabase Dashboard
