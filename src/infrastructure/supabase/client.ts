import { env } from '@/src/config/env';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

/**
 * Creates a Supabase client for browser/client-side usage
 * This client is used in Client Components
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Export a singleton instance for convenience
export const supabase = createClient();
