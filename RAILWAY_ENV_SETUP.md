# Railway Environment Variables Setup

## Critical Fix for Cron Job Failures

Your production cron jobs are crashing because `NEXT_PUBLIC_APP_BASE_URL` is pointing to localhost.

## Step-by-Step Fix

### 1. Access Railway Dashboard
1. Go to https://railway.app/dashboard
2. Select your project
3. Click on **Variables** tab

### 2. Required Environment Variables

Set these variables in Railway (copy from your `.env` file and update the URLs):

```bash
# ⚠️ CRITICAL - Update this to your Railway production URL
NEXT_PUBLIC_APP_BASE_URL=https://your-app-name.up.railway.app

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://qwbjertanaecqhhyonhn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Payment Gateway
NEXT_PUBLIC_NOWPAYMENTS_API_KEY=<your-key>
NOWPAYMENTS_IPN_SECRET=<your-secret>

# iProxy API
IPROXY_API_KEY=912cb653ecc30e6c3531e6ef91249bd9a7144b14fedb2274a01564af9719694e

# Encryption
ENCRYPTION_KEY=5b8a25ef7444116cdd12ecc528b60d5ff1089e9e958529eaf1ce024983370d4f

# Cron Job Security (⚠️ Generate a new secure token!)
CRON_SECRET=$(openssl rand -hex 32)

# Email (Resend)
RESEND_API_KEY=re_ZuHGyJdm_3eyYx7cfaK65Y8GvwoeoZ1sx
EMAIL_FROM=ichristine180@gmail.com

# Telegram
TELEGRAM_BOT_TOKEN=<your-bot-token>

# Node Environment
NODE_ENV=production
```

### 3. Generate Secure CRON_SECRET

Run this locally to generate a secure token:
```bash
openssl rand -hex 32
```

Copy the output and set it as `CRON_SECRET` in Railway.

### 4. Find Your Railway Production URL

Your Railway app URL should be in one of these formats:
- `https://your-app-name.up.railway.app` (Railway provided domain)
- `https://your-custom-domain.com` (if you added a custom domain)

To find it:
1. Go to Railway dashboard
2. Click on your service
3. Go to **Settings** tab
4. Look for **Domains** section
5. Copy the URL

### 5. Update NEXT_PUBLIC_APP_BASE_URL

In Railway Variables, set:
```bash
NEXT_PUBLIC_APP_BASE_URL=https://your-actual-railway-url.up.railway.app
```

**⚠️ DO NOT use `http://localhost:3000` in production!**

### 6. Deploy Changes

After updating environment variables:

1. **Commit the improved cron scripts:**
```bash
git add scripts/
git commit -m "Fix cron jobs for production deployment"
git push
```

2. Railway will automatically redeploy with new environment variables

### 7. Verify Cron Jobs

After deployment, check Railway logs:
1. Go to Railway dashboard
2. Select your project
3. Click **Deployments** tab
4. View logs to confirm cron jobs are working

You should see:
```
✅ Cron job completed successfully
```

Instead of:
```
❌ Cron job failed with error: fetch failed
```

## Testing

After fixing, your cron jobs should:
- ✅ Connect to the correct production URL
- ✅ Authenticate with CRON_SECRET
- ✅ Process auto-renewals successfully
- ✅ Clean up expired reservations

## Common Issues

### Issue: Still seeing localhost errors
**Fix:** Make sure to redeploy after updating env vars

### Issue: Authentication failed
**Fix:** Ensure CRON_SECRET matches in both Railway env vars and cron job config

### Issue: Can't find Railway URL
**Fix:** Check Railway dashboard → Settings → Domains

## Security Notes

- ⚠️ Never commit `CRON_SECRET` to git
- ⚠️ Never commit API keys or secrets to git
- ✅ Always use Railway environment variables for secrets
- ✅ Rotate `CRON_SECRET` periodically

## Need Help?

If cron jobs still fail after this fix:
1. Check Railway logs for specific errors
2. Verify all environment variables are set
3. Ensure your production URL is accessible
4. Check Supabase connection is working
