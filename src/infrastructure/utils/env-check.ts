import { env, isProduction } from '@/src/config/env';
import { logger } from '@sentry/nextjs';

/**
 * Environment Check Utility
 * Displays current environment configuration (for debugging)
 * Remove or restrict to non-production after verification
 */

function getEnvironmentInfo() {
  return {
    environment: env.VERCEL_ENV || 'unknown',
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    hasAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function logEnvironmentInfo() {
  if (!isProduction) {
    const info = getEnvironmentInfo();
    logger.info('Environment Info', { info: info });
  }
}
