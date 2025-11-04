import { env, isDevelopment } from '@/src/config/env';

/**
 * Environment Check Utility
 * Displays current environment configuration (for debugging)
 * Remove or restrict to non-production after verification
 */

function getEnvironmentInfo() {
  return {
    environment: env.NODE_ENV || 'unknown',
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    hasAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: env.NODE_ENV || 'unknown',
  };
}

export function logEnvironmentInfo() {
  if (isDevelopment) {
    const info = getEnvironmentInfo();
    console.log('🌍 Environment Info:', info);
  }
}
