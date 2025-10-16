// Load centralized environment variables before anything else
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load root .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@iproxy/env'],
  // Make env vars available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CRYPTOMUS_API_BASE: process.env.NEXT_PUBLIC_CRYPTOMUS_API_BASE,
    NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,
    NEXT_PUBLIC_RENT_BASE_URL: process.env.NEXT_PUBLIC_RENT_BASE_URL,
    NEXT_PUBLIC_LOGIN_URL: process.env.NEXT_PUBLIC_LOGIN_URL,
    NEXT_PUBLIC_SIGNUP_URL: process.env.NEXT_PUBLIC_SIGNUP_URL,
  },
};

export default nextConfig;
