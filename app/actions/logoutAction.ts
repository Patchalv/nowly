'use server';

import { ROUTES } from '@/src/config/constants';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { redirect } from 'next/navigation';

/**
 * Server action result type for logout
 */
type LogoutActionResult = { success: true } | { success: false; error: string };

/**
 * Server action to log out the current user
 * Clears the Supabase session and redirects to login page on success
 *
 * @returns LogoutActionResult with success status or error details
 */
export async function logoutAction(): Promise<LogoutActionResult> {
  try {
    logger.info('Creating Supabase server client');
    const supabase = await createClient();
    logger.info('Signing out user');
    const { error } = await supabase.auth.signOut();
    logger.info('Logout result', { error: error });

    if (error) {
      logger.error('Logout error', { error: error });
      return {
        success: false,
        error: 'Failed to log out. Please try again.',
      };
    }

    // Success - redirect to login page
    // Note: redirect() throws, so code after this won't execute
  } catch (error) {
    logger.error('Logout action failed', { error: error });
    return {
      success: false,
      error: 'An unexpected error occurred during logout.',
    };
  }

  // Redirect on successful logout
  redirect(ROUTES.LOGIN);
}
