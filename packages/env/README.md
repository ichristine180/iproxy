# @iproxy/env

**Centralized Environment Variables Registry**

This package is the single source of truth for all environment variables across the iProxy monorepo.

## Features

- ✅ **Centralized Configuration**: All environment variables defined in one place
- ✅ **Type-Safe**: Full TypeScript support with strict types
- ✅ **Validation**: Automatic validation of required variables
- ✅ **Zero Configuration**: Works out of the box with Next.js apps
- ✅ **Development & Production**: Works across all environments

## Usage

### In Next.js Apps

The package is automatically loaded via `next.config.mjs`. Just import and use:

```typescript
import { config } from '@iproxy/env';

// Supabase
console.log(config.supabase.url);
console.log(config.supabase.anonKey);

// URLs
console.log(config.urls.app);
console.log(config.urls.rent);

// Payment
console.log(config.cryptomus.apiBase);
```

### Individual Imports

```typescript
import { supabase, urls, cryptomus, email, telegram } from '@iproxy/env';

// Use specific configurations
const client = createClient(supabase.url, supabase.anonKey);
```

### In API Routes

```typescript
import { config } from '@iproxy/env';

export async function POST(request: Request) {
  // Server-only variables are safe here
  const serviceKey = config.supabase.serviceRoleKey;

  // Process...
}
```

## Configuration

All environment variables are defined in the root `.env` file:

```env
# /Users/apple/Documents/iProxyProjects/.env

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_RENT_BASE_URL=http://localhost:3001
```

## Available Configuration Objects

### `supabase`
```typescript
{
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}
```

### `cryptomus`
```typescript
{
  apiBase: string;
  merchantUuid: string;
  apiKey: string;
}
```

### `email`
```typescript
{
  resendApiKey: string;
}
```

### `telegram`
```typescript
{
  botToken: string;
}
```

### `urls`
```typescript
{
  app: string;
  rent: string;
  login: string;
  signup: string;
}
```

### `env`
```typescript
{
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  nodeEnv: string;
}
```

## Client-Safe Variables

Only variables with the `NEXT_PUBLIC_` prefix are exposed to the browser:

```typescript
import { clientEnv } from '@iproxy/env';

// Safe to use in client components
console.log(clientEnv.NEXT_PUBLIC_SUPABASE_URL);
```

## Adding New Variables

1. Add to root `.env` file
2. Add to `packages/env/index.ts`
3. Update type definitions
4. Restart dev server

Example:

```typescript
// packages/env/index.ts

export const myNewService = {
  apiKey: requireEnv('MY_SERVICE_API_KEY'),
  endpoint: getEnv('MY_SERVICE_ENDPOINT', 'https://default.com'),
} as const;

export const config = {
  // ... existing
  myNewService,
} as const;
```

## Environment Variable Naming

Follow these conventions:

- **Public/Client-safe**: `NEXT_PUBLIC_*` (exposed to browser)
- **Server-only**: No prefix (server-side only)
- **Snake case**: `NEXT_PUBLIC_SUPABASE_URL`
- **Descriptive**: Use full names, avoid abbreviations

## Security

⚠️ **Important Security Guidelines**:

1. **Never** prefix sensitive keys with `NEXT_PUBLIC_`
2. **Service role keys** should never be exposed to the client
3. **API secrets** must remain server-side only
4. **Production keys** should differ from development keys

### Safe for Client
✅ `NEXT_PUBLIC_SUPABASE_URL`
✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
✅ `NEXT_PUBLIC_APP_BASE_URL`

### Server-Only
❌ `SUPABASE_SERVICE_ROLE_KEY`
❌ `CRYPTOMUS_API_KEY`
❌ `RESEND_API_KEY`
❌ `TELEGRAM_BOT_TOKEN`

## Troubleshooting

### Variables Not Loading

1. Check root `.env` file exists
2. Verify variable names match exactly
3. Restart dev server: `npm run dev`
4. Clear Next.js cache: `rm -rf .next`

### Import Errors

```bash
# Install dependencies
npm install

# In root directory
npm install
```

### Type Errors

```bash
# Rebuild packages
cd packages/env
npm install
```

## Development Workflow

```bash
# 1. Update root .env file
nano .env

# 2. Update packages/env/index.ts if needed
nano packages/env/index.ts

# 3. Restart dev server
npm run dev
```

## Production Deployment

Environment variables are loaded from:
1. **Vercel**: Project settings → Environment variables
2. **Docker**: Mount `/app/.env` or use `-e` flags
3. **Other platforms**: Platform-specific env configuration

The centralized package will automatically load variables from `process.env` in production.

## Benefits

### Before (Without Centralized Env)
```typescript
// apps/web/lib/supabase/client.ts
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; // Might be undefined

// apps/rent/lib/supabase/client.ts
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; // Duplicate code
```

### After (With Centralized Env)
```typescript
// Anywhere in the monorepo
import { config } from '@iproxy/env';
const url = config.supabase.url; // Type-safe, validated
```

## Testing

```typescript
import { config } from '@iproxy/env';

describe('Environment Config', () => {
  it('should load supabase config', () => {
    expect(config.supabase.url).toBeDefined();
    expect(config.supabase.url).toContain('supabase.co');
  });
});
```

## License

Private - iProxy Project
