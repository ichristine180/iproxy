import type { NextConfig } from "next";
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from monorepo root
config({ path: resolve(__dirname, '../../.env') });

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,
    NEXT_PUBLIC_RENT_BASE_URL: process.env.NEXT_PUBLIC_RENT_BASE_URL,
    NEXT_PUBLIC_NOWPAYMENTS_API_KEY: process.env.NEXT_PUBLIC_NOWPAYMENTS_API_KEY,
    NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET,
  },
};

export default nextConfig;
