// Client-side utilities (safe for Client Components)
export * from './auth';
export * from './database';

// Server-side utilities are NOT exported here
// Import explicitly from './session' to use in Server Components:
// import { requireAuth, getServerSession } from '@/src/infrastructure/supabase/utils/session'
