# iProxy Scripts

Utility scripts for the iProxy monorepo.

## Environment Variable Sync

### `sync-env.sh`

**Purpose**: Synchronizes environment variables from root `.env` to all app `.env.local` files.

**Why**: Next.js apps (especially with Edge Runtime/Middleware) need `.env.local` files to access environment variables properly. This script maintains centralized configuration while meeting Next.js requirements.

**Usage**:
```bash
# Manual sync
npm run env:sync

# Automatic (runs before dev)
npm run dev
```

**What it does**:
1. Reads root `.env` file
2. Creates/updates `.env.local` in each app directory
3. Adds auto-generated header to prevent manual edits
4. Copies all environment variables

**Apps synced**:
- `apps/web/.env.local`
- `apps/rent/.env.local`
- `apps/docs/.env.local`

**Important**:
- ✅ **DO** edit root `.env`
- ❌ **DON'T** edit app `.env.local` files (they're auto-generated)
- ✅ **DO** run `npm run env:sync` after updating `.env`
- ✅ **DO** commit script changes
- ❌ **DON'T** commit `.env.local` files (they're gitignored)

## Database Setup

### `db-setup.sh`

Interactive database management script for Supabase.

**Usage**:
```bash
npm run db:setup
```

**Features**:
- Initialize Supabase locally
- Start/stop local Supabase
- Reset database
- Push migrations to remote
- Generate TypeScript types
- View database status

See [DATABASE_SETUP.md](../DATABASE_SETUP.md) for full documentation.

## Adding New Scripts

1. Create script in `scripts/` directory
2. Make executable: `chmod +x scripts/your-script.sh`
3. Add npm script in root `package.json`
4. Document in this README

## Script Conventions

- Use bash for shell scripts
- Include error handling (`set -e`)
- Add descriptive echo messages
- Make scripts idempotent (safe to run multiple times)
- Document purpose and usage
