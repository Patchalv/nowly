import { ROUTES } from '@/src/config/constants';
import { createClient } from '@/src/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import type { AuthUser, SupabaseResponse } from '../types';

/**
 * Server-side session utilities
 * Use these functions in Server Components, Server Actions, and Route Handlers
 */

/**
 * Get the current user session on the server
 * Returns null if no session exists
 *
 * @example
 * const session = await getServerSession()
 * if (session) {
 *   console.log('User ID:', session.user.id)
 * }
 */
export async function getServerSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current user on the server
 * Returns null if no user is authenticated
 *
 * @example
 * const user = await getServerUser()
 * if (user) {
 *   console.log('User email:', user.email)
 * }
 */
export async function getServerUser(): Promise<SupabaseResponse<AuthUser>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
      };
    }

    return {
      data: user
        ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          }
        : null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Failed to get server user'),
    };
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use this in Server Components or Server Actions to protect routes
 *
 * @example
 * // In a Server Component
 * export default async function ProtectedPage() {
 *   const user = await requireAuth()
 *   // User is guaranteed to be authenticated here
 * }
 */
export async function requireAuth(): Promise<AuthUser> {
  const { data: user, error } = await getServerUser();

  if (!user || error) {
    if (error) {
      console.error('Auth check failed:', error);
    }
    redirect(ROUTES.LOGIN);
  }

  return user;
}

/**
 * Require guest - redirect to daily view if authenticated
 * Use this on public auth pages (login, signup) to prevent authenticated users from accessing them
 *
 * @example
 * // In a Server Component for login/signup pages
 * export default async function LoginPage() {
 *   await requireGuest()
 *   // User is guaranteed to NOT be authenticated here
 * }
 */
export async function requireGuest(): Promise<void> {
  const { data: user } = await getServerUser();

  if (user) {
    redirect(ROUTES.DAILY);
  }
}

/**
 * Get the current user ID on the server
 * Returns null if no user is authenticated
 * Convenience function for when you only need the user ID
 *
 * @example
 * const userId = await getServerUserId()
 * if (userId) {
 *   const tasks = await fetchTasksForUser(userId)
 * }
 */
export async function getServerUserId(): Promise<string | null> {
  const { data: user } = await getServerUser();
  return user?.id ?? null;
}
