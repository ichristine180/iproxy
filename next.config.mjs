// Load environment variables
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Make env vars available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CRYPTOMUS_API_BASE: process.env.NEXT_PUBLIC_CRYPTOMUS_API_BASE,
    NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,

  
  },
};

export default nextConfig;
