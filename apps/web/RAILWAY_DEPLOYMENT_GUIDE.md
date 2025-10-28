# Railway Deployment Guide

## Critical: Fix Build Failure First

Your Railway build is currently failing with this error:
```
Error: ENCRYPTION_KEY environment variable is required
```

This must be fixed before deploying any cron jobs.

---

## Step 1: Add All Required Environment Variables

Go to your Railway project → **Settings** → **Variables** and add these:

### Required Variables

1. **ENCRYPTION_KEY** (MISSING - BLOCKING BUILD)
   ```bash
   # Generate with one of these commands:
   openssl rand -base64 32
   # OR
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Copy the output and add as: `ENCRYPTION_KEY=<generated-value>`

2. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://qwbjertanaecqhhyonhn.supabase.co`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Your Supabase service role key (secret)
   - Find in Supabase Dashboard → Settings → API

4. **CRON_SECRET**
   ```bash
   # Generate a secure secret:
   openssl rand -base64 32
   ```

5. **NEXT_PUBLIC_APP_BASE_URL**
   - Your Railway app URL
   - Example: `https://your-app.railway.app`

6. **IPROXY_API_KEY**
   - Your iProxy API key

7. **NEXT_PUBLIC_NOWPAYMENTS_API_KEY**
   - Your NOWPayments public API key

8. **NOWPAYMENTS_IPN_SECRET**
   - Your NOWPayments IPN secret

9. **RESEND_API_KEY**
   - Your Resend API key for emails

---

## Step 2: Deploy and Verify Build

After adding all variables (especially ENCRYPTION_KEY):

1. Railway will automatically redeploy
2. Watch the build logs
3. Build should succeed now
4. Verify your app is running at your Railway URL

---

## Step 3: Setup Auto-Renew Cron Job

### In Railway Dashboard:

1. Go to your **web service**
2. Click **Settings** → **Cron Jobs**
3. Add new cron job:

   **Name**: `Auto-Renew Proxies`

   **Schedule**: `*/5 * * * *` (every 5 minutes)

   **Command**:
   ```bash
   cd apps/web && node scripts/run-cron.js
   ```

4. Save and enable

### What it does:
- Checks for proxies expiring in next 24 hours with auto-renew enabled
- Attempts to renew them automatically
- Sends email notifications on success/failure

---

## Step 4: Setup Cleanup Reservations Cron Job

### In Railway Dashboard:

1. Go to your **web service**
2. Click **Settings** → **Cron Jobs**
3. Add new cron job:

   **Name**: `Cleanup Expired Reservations`

   **Schedule**: `*/15 * * * *` (every 15 minutes)

   **Command**:
   ```bash
   cd apps/web && node scripts/run-cleanup-cron.js
   ```

4. Save and enable

### What it does:
- Finds reserved proxies where reservation expired (>10 minutes old)
- Releases them back to available status
- Keeps your proxy inventory clean

---

## Step 5: Monitor Cron Jobs

### View Cron Logs in Railway:

1. Go to your service
2. Click **Deployments**
3. Select a deployment
4. Filter logs by cron job name

### Test Manually:

You can test the cron jobs locally:

```bash
# Test auto-renew
cd apps/web
export CRON_SECRET="your-secret"
export NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"
npm run dev
# In another terminal:
node scripts/run-cron.js

# Test cleanup
node scripts/run-cleanup-cron.js
```

---

## Troubleshooting

### Build still failing?
- Double-check ENCRYPTION_KEY is set in Railway
- Make sure you didn't include extra spaces or quotes
- Trigger a manual redeploy

### Cron jobs not running?
- Check the logs for errors
- Verify CRON_SECRET matches between Railway variables and cron scripts
- Ensure NEXT_PUBLIC_APP_BASE_URL is your Railway URL

### Environment variable not found?
- Railway variables are only available after redeploy
- Variable names are case-sensitive
- Check for typos in variable names

---

## Quick Checklist

- [ ] Generate and add ENCRYPTION_KEY to Railway
- [ ] Add all other environment variables to Railway
- [ ] Wait for successful build
- [ ] Verify app is accessible
- [ ] Add auto-renew cron job (every 5 minutes)
- [ ] Add cleanup cron job (every 15 minutes)
- [ ] Test both cron jobs
- [ ] Monitor logs for first few runs

---

## Security Notes

- Never commit environment variables to git
- Rotate CRON_SECRET periodically
- Keep ENCRYPTION_KEY secure - losing it means encrypted data is unrecoverable
- Use strong, randomly generated values for all secrets

---

## Need Help?

Check the cron-specific setup guides:
- `RAILWAY_CRON_SETUP.md` - Detailed cron job documentation
- `RAILWAY_CLEANUP_CRON_QUICKSTART.md` - Quick cleanup setup

The main blocker right now is the missing ENCRYPTION_KEY. Once that's added, everything else will work.
