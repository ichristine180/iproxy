# Environment Variables Setup Guide

**Centralized Secrets Registry for iProxy Monorepo**

## Overview

All environment variables are defined **centrally** in the root `.env` file and managed through the `@iproxy/env` package. This ensures:

- ✅ Single source of truth
- ✅ Type-safe configuration
- ✅ Automatic validation
- ✅ No duplication across apps

## Quick Start

### 1. Configure Root .env File

Edit the root `.env` file (the **ONLY** place you should edit env vars):

```bash
nano .env
```

Add your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payment Provider
NEXT_PUBLIC_CRYPTOMUS_API_BASE=https://api.cryptomus.com
CRYPTOMUS_MERCHANT_UUID=your-merchant-uuid
CRYPTOMUS_API_KEY=your-api-key

# Email & Notifications
RESEND_API_KEY=your-resend-api-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# App URLs
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_RENT_BASE_URL=http://localhost:3001
NEXT_PUBLIC_LOGIN_URL=http://localhost:3000
NEXT_PUBLIC_SIGNUP_URL=http://localhost:3000/signup
```

### 2. Start Development

```bash
npm run dev
```

That's it! The `dev` command automatically:
1. Syncs root `.env` to all app `.env.local` files
2. Starts all apps with correct environment variables

**Important**: The app `.env.local` files are auto-generated. DO NOT edit them directly!

## How It Works

The system uses a **sync-on-dev** approach for centralized environment management:

```
┌─────────────────────────────────────────┐
│   Root .env (Single Source of Truth)   │
│   /.env                                 │
│   ✏️  EDIT THIS FILE ONLY                │
└──────────────┬──────────────────────────┘
               │
               │ npm run env:sync
               │ (runs automatically on dev)
               ↓
┌──────────────────────────────────────────┐
│   Sync Script                            │
│   scripts/sync-env.sh                    │
│   • Copies .env to each app              │
│   • Creates .env.local files             │
│   • Adds auto-generated header           │
└──────────┬───────────────────┬───────────┘
           │                   │
           ↓                   ↓
    ┌──────────┐        ┌──────────┐
    │ Web App  │        │ Rent App │
    │.env.local│        │.env.local│
    │(synced)  │        │(synced)  │
    └──────────┘        └──────────┘
```

### Sync Process

1. **Edit**: Update variables in root `.env`
2. **Sync**: Run `npm run env:sync` (or just `npm run dev`)
3. **Deploy**: Apps automatically have correct variables

### Why This Approach?

- ✅ **Next.js Compatible**: Edge runtime needs .env.local files
- ✅ **Centralized**: Still only edit one file (root .env)
- ✅ **Automatic**: Syncs on every dev start
- ✅ **Gitignored**: .env.local files never committed
- ✅ **Team-Friendly**: Clear which file to edit

## Usage in Apps

### Import Configuration

```typescript
import { config } from '@iproxy/env';

// Use anywhere in your app
const supabaseUrl = config.supabase.url;
const appUrl = config.urls.app;
```

### In API Routes (Server-Side)

```typescript
import { config } from '@iproxy/env';

export async function POST(request: Request) {
  // Access server-only secrets safely
  const serviceKey = config.supabase.serviceRoleKey;
  const apiKey = config.cryptomus.apiKey;

  // Your logic here
}
```

### In Client Components

```typescript
'use client';

import { config } from '@iproxy/env';

export default function MyComponent() {
  // Only NEXT_PUBLIC_* variables are available
  const supabaseUrl = config.supabase.url; // ✅ Available
  const anonKey = config.supabase.anonKey; // ✅ Available

  // Server-only variables will be undefined in client
  // const serviceKey = config.supabase.serviceRoleKey; // ❌ Undefined in browser
}
```

## Required Environment Variables

### Supabase (Required)

Get these from: [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### App URLs (Required)

```env
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_RENT_BASE_URL=http://localhost:3001
NEXT_PUBLIC_LOGIN_URL=http://localhost:3000
NEXT_PUBLIC_SIGNUP_URL=http://localhost:3000/signup
```

### Payment Provider (Optional)

```env
NEXT_PUBLIC_CRYPTOMUS_API_BASE=https://api.cryptomus.com
CRYPTOMUS_MERCHANT_UUID=your-merchant-uuid
CRYPTOMUS_API_KEY=your-api-key
```

### Email & Notifications (Optional)

```env
RESEND_API_KEY=your-resend-api-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

## Adding New Variables

### 1. Add to Root .env

```bash
# Add to /.env
MY_NEW_SERVICE_KEY=my-secret-key
NEXT_PUBLIC_MY_NEW_SERVICE_URL=https://api.example.com
```

### 2. Update @iproxy/env Package

Edit `packages/env/index.ts`:

```typescript
export const myNewService = {
  apiKey: requireEnv('MY_NEW_SERVICE_KEY'),
  apiUrl: getEnv('NEXT_PUBLIC_MY_NEW_SERVICE_URL', 'https://default.com'),
} as const;

export const config = {
  supabase,
  cryptomus,
  email,
  telegram,
  urls,
  env,
  myNewService, // Add here
} as const;
```

### 3. Use in Your App

```typescript
import { config } from '@iproxy/env';

const apiKey = config.myNewService.apiKey;
```

## Security Best Practices

### ✅ Client-Safe (Use NEXT_PUBLIC_ prefix)

These are exposed to the browser and are safe:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_BASE_URL=...
```

### ❌ Server-Only (NO prefix)

These must remain on the server:

```env
SUPABASE_SERVICE_ROLE_KEY=...
CRYPTOMUS_API_KEY=...
RESEND_API_KEY=...
TELEGRAM_BOT_TOKEN=...
```

## Troubleshooting

### Error: "Missing required environment variable"

This means a required variable is not set in root `.env`:

1. Check `.env` file exists in project root
2. Verify variable name matches exactly
3. No spaces around `=`: `VAR=value` not `VAR = value`

```bash
# Check if .env exists
ls -la .env

# View contents
cat .env
```

### Variables Not Loading

```bash
# 1. Clear build cache
rm -rf apps/web/.next
rm -rf apps/rent/.next

# 2. Reinstall dependencies
npm install

# 3. Restart dev server
npm run dev
```

### "Cannot find module '@iproxy/env'"

```bash
# Install workspace dependencies
npm install

# The @iproxy/env package will be linked automatically
```

## Development vs Production

### Development (Local)

Variables are loaded from root `.env` file automatically.

### Production (Vercel, etc.)

Set environment variables in your deployment platform:

**Vercel:**
1. Go to Project Settings
2. Environment Variables
3. Add each variable
4. Variables will be injected at build/runtime

**Docker:**
```bash
docker run -e NEXT_PUBLIC_SUPABASE_URL=... your-image
```

**Other Platforms:**
Follow platform-specific environment variable configuration.

## File Structure

```
iProxyProjects/
├── .env                          # ← SINGLE SOURCE OF TRUTH
├── .gitignore                    # .env is gitignored
│
├── packages/
│   └── env/
│       ├── index.ts              # Centralized env loader
│       ├── package.json
│       └── README.md
│
├── apps/
│   ├── web/
│   │   ├── next.config.mjs       # Loads @iproxy/env
│   │   └── package.json          # Depends on @iproxy/env
│   │
│   └── rent/
│       ├── next.config.mjs       # Loads @iproxy/env
│       └── package.json          # Depends on @iproxy/env
│
└── turbo.json                    # Declares env vars for cache
```

## Benefits

### Before (Multiple .env files)

```
❌ apps/web/.env.local
❌ apps/rent/.env.local
❌ apps/docs/.env.local
❌ Duplication across apps
❌ Easy to get out of sync
❌ Hard to manage
```

### After (Centralized)

```
✅ .env (root only)
✅ Single source of truth
✅ Type-safe access
✅ Automatic validation
✅ Easy to manage
```

## Common Commands

```bash
# Edit environment variables (ROOT .env only!)
nano .env

# Sync env vars to all apps
npm run env:sync

# Start dev (auto-syncs first)
npm run dev

# View current variables
cat .env

# Check synced app variables
cat apps/web/.env.local
cat apps/rent/.env.local

# Clear cache and restart
rm -rf apps/web/.next apps/rent/.next && npm run dev
```

## Workflow

### Daily Development

1. Run `npm run dev` (syncs and starts)
2. Code and test
3. Stop with Ctrl+C

### Updating Environment Variables

1. Edit root `.env` file: `nano .env`
2. Run `npm run env:sync` to sync changes
3. Restart apps: `npm run dev`

Or simply:
```bash
nano .env
npm run dev  # Auto-syncs and restarts
```

## Examples

### Using in Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';
import { config } from '@iproxy/env';

const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
```

### Using in API Routes

```typescript
import { config } from '@iproxy/env';

export async function POST() {
  // Send email via Resend
  const response = await fetch('https://api.resend.com/emails', {
    headers: {
      Authorization: `Bearer ${config.email.resendApiKey}`,
    },
  });
}
```

### Environment-Specific Logic

```typescript
import { config } from '@iproxy/env';

if (config.env.isDevelopment) {
  console.log('Running in development mode');
}

if (config.env.isProduction) {
  // Production-only logic
}
```

## Getting Help

- Check `packages/env/README.md` for detailed documentation
- Verify `.env` file format (no spaces, correct syntax)
- Check [Next.js Env Vars Docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- Check Supabase keys in [Dashboard](https://supabase.com/dashboard)

## Production Checklist

Before deploying:

- [ ] All required variables set in production environment
- [ ] Service role keys kept secure (not exposed to client)
- [ ] Different keys for dev and production
- [ ] API keys have correct permissions
- [ ] URLs point to production domains
- [ ] Test environment variable loading

## Security Reminders

1. ✅ **Root `.env` is gitignored** - Never commit it
2. ✅ **Use different keys** for dev/prod
3. ✅ **Service role keys** are server-only
4. ✅ **Rotate keys** regularly
5. ✅ **NEXT_PUBLIC_** prefix only for client-safe vars

## Summary

**One File. One Source. Type-Safe. Secure.**

All environment variables are managed centrally in `/.env` and accessed through the `@iproxy/env` package. This ensures consistency, type safety, and security across your entire monorepo.
