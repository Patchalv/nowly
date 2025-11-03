/**
 * Environment Configuration Module
 *
 * Centralized, type-safe access to environment variables with validation.
 * ALL environment variable access in the application should go through this module.
 *
 * @module config/env
 *
 * Usage:
 * ```typescript
 * import { env } from '@/src/config/env';
 *
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 * ```
 *
 * Rules:
 * - NEVER access process.env directly in components or hooks
 * - Use this module for all environment variable access
 * - Public variables (NEXT_PUBLIC_*) are safe for client-side use
 * - Private variables are only accessible server-side
 */

/**
 * Validates that a required environment variable exists
 * @throws Error if the variable is missing
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Please ensure it is defined in your .env.local file.\n` +
        `See .env.example for reference.`
    );
  }

  return value;
}

/**
 * Gets an optional environment variable with a fallback value
 */
function getOptionalEnv(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

/**
 * Validates environment configuration on module load
 * This ensures critical variables are present before the app starts
 */
function validateEnvironment(): void {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = requiredVars.filter((key) => {
    const value = process.env[key];
    return !value || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
        missing.map((key) => `  - ${key}`).join('\n') +
        `\n\nPlease check your .env.local file. See .env.example for reference.`
    );
  }
}

// Validate environment on module load (server-side only)
if (typeof window === 'undefined') {
  validateEnvironment();
}

/**
 * Environment configuration object
 * Provides type-safe access to all environment variables
 */
export const env = {
  // ------------------------------------------------------------------------------
  // Next.js Configuration
  // ------------------------------------------------------------------------------
  NODE_ENV: getOptionalEnv('NODE_ENV', 'development') as
    | 'development'
    | 'production'
    | 'test',
  NEXT_PUBLIC_APP_URL: getOptionalEnv(
    'NEXT_PUBLIC_APP_URL',
    'http://localhost:3000'
  ),

  // ------------------------------------------------------------------------------
  // Supabase Configuration (Public - safe for client-side)
  // ------------------------------------------------------------------------------
  NEXT_PUBLIC_SUPABASE_URL: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequiredEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ),

  // ------------------------------------------------------------------------------
  // Supabase Configuration (Private - server-side only)
  // ------------------------------------------------------------------------------
  /**
   * Service role key - ONLY use server-side, NEVER expose to client
   * @server-only
   */
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    if (typeof window !== 'undefined') {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY cannot be accessed on the client-side. ' +
          'This is a security violation.'
      );
    }
    return getOptionalEnv('SUPABASE_SERVICE_ROLE_KEY');
  },

  // ------------------------------------------------------------------------------
  // Authentication Configuration
  // ------------------------------------------------------------------------------
  /**
   * NextAuth secret - server-side only
   * @server-only
   */
  get NEXTAUTH_SECRET(): string {
    if (typeof window !== 'undefined') {
      throw new Error(
        'NEXTAUTH_SECRET cannot be accessed on the client-side. ' +
          'This is a security violation.'
      );
    }
    return getOptionalEnv('NEXTAUTH_SECRET');
  },

  NEXTAUTH_URL: getOptionalEnv('NEXTAUTH_URL', 'http://localhost:3000'),

  // ------------------------------------------------------------------------------
  // Feature Flags (Optional)
  // ------------------------------------------------------------------------------
  NEXT_PUBLIC_ENABLE_ANALYTICS:
    getOptionalEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false') === 'true',
  NEXT_PUBLIC_ENABLE_RECURRING_TASKS:
    getOptionalEnv('NEXT_PUBLIC_ENABLE_RECURRING_TASKS', 'true') === 'true',
  NEXT_PUBLIC_ENABLE_CATEGORIES:
    getOptionalEnv('NEXT_PUBLIC_ENABLE_CATEGORIES', 'true') === 'true',

  // ------------------------------------------------------------------------------
  // Analytics & Monitoring (Optional)
  // ------------------------------------------------------------------------------
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: getOptionalEnv(
    'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID'
  ),
  NEXT_PUBLIC_SENTRY_DSN: getOptionalEnv('NEXT_PUBLIC_SENTRY_DSN'),

  // ------------------------------------------------------------------------------
  // API Configuration (Optional)
  // ------------------------------------------------------------------------------
  API_RATE_LIMIT_MAX_REQUESTS: parseInt(
    getOptionalEnv('API_RATE_LIMIT_MAX_REQUESTS', '100'),
    10
  ),
  API_RATE_LIMIT_WINDOW_MS: parseInt(
    getOptionalEnv('API_RATE_LIMIT_WINDOW_MS', '60000'),
    10
  ),
} as const;

/**
 * Type representing the environment configuration
 */
export type Env = typeof env;

/**
 * Helper to check if we're in a specific environment
 */
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/**
 * Helper to check if we're on the server or client
 */
export const isServer = typeof window === 'undefined';
export const isClient = typeof window !== 'undefined';
