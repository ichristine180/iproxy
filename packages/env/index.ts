/**
 * Centralized Environment Variables Registry
 *
 * This is the single source of truth for all environment variables.
 * All apps import from this package to ensure consistency.
 */

// Load environment variables from root .env file
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from root .env file (relative to this package)
dotenvConfig({ path: resolve(__dirname, '../../.env') });

/**
 * Validates that a required environment variable is set
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Supabase Configuration
 */
export const supabase = {
  url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
} as const;

/**
 * Payment Provider Configuration (Cryptomus)
 */
export const cryptomus = {
  apiBase: getEnv('NEXT_PUBLIC_CRYPTOMUS_API_BASE', 'https://api.cryptomus.com'),
  merchantUuid: getEnv('CRYPTOMUS_MERCHANT_UUID'),
  apiKey: getEnv('CRYPTOMUS_API_KEY'),
} as const;

/**
 * Email Configuration (Resend)
 */
export const email = {
  resendApiKey: getEnv('RESEND_API_KEY'),
} as const;

/**
 * Telegram Bot Configuration
 */
export const telegram = {
  botToken: getEnv('TELEGRAM_BOT_TOKEN'),
} as const;

/**
 * Application URLs
 */
export const urls = {
  app: getEnv('NEXT_PUBLIC_APP_BASE_URL', 'http://localhost:3000'),
  rent: getEnv('NEXT_PUBLIC_RENT_BASE_URL', 'http://localhost:3001'),
  login: getEnv('NEXT_PUBLIC_LOGIN_URL', 'http://localhost:3000'),
  signup: getEnv('NEXT_PUBLIC_SIGNUP_URL', 'http://localhost:3000/signup'),
} as const;

/**
 * Environment type
 */
export const env = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

/**
 * All environment variables exported as a single object
 */
export const config = {
  supabase,
  cryptomus,
  email,
  telegram,
  urls,
  env,
} as const;

/**
 * Client-safe environment variables (for Next.js public runtime config)
 * Only includes NEXT_PUBLIC_* variables that are safe to expose to the browser
 */
export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: supabase.url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabase.anonKey,
  NEXT_PUBLIC_CRYPTOMUS_API_BASE: cryptomus.apiBase,
  NEXT_PUBLIC_APP_BASE_URL: urls.app,
  NEXT_PUBLIC_RENT_BASE_URL: urls.rent,
} as const;

// Make client env available on process.env for Next.js
// Only run this on the server-side (Node.js environment)
if (typeof process !== 'undefined' && process.env) {
  Object.entries(clientEnv).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

export default config;
