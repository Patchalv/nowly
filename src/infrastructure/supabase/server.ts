import { env, isProduction } from '@/src/config/env';
import { logger } from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './types';

/**
 * Creates a Supabase client for server-side usage
 * This client is used in Server Components, Server Actions, and Route Handlers
 */
export async function createClient() {
  const cookieStore = await cookies();
  if (!isProduction) {
    logger.debug('Creating Supabase server client');
  }

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
