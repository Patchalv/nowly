/**
 * Supabase client exports
 *
 * Usage:
 * - Client Components: import { supabase } from '@/src/infrastructure/supabase'
 * - Server Components: import { createClient } from '@/src/infrastructure/supabase/server'
 *
 * Note: Server utilities (createClient from server.ts) must be imported directly
 * to prevent bundling server-only code (next/headers) in client bundles.
 */

export { createClient, supabase } from './client';
export type { Database } from './types';
