import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL,
  },
};

export default nextConfig;
