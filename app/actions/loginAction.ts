'use server';

import { ROUTES } from '@/src/config/constants';
import {
  loginSchema,
  type LoginFormData,
} from '@/src/domain/validation/auth.schema';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { redirect } from 'next/navigation';

/**
 * Server action result type for login
 */
type LoginActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server action to authenticate a user with email and password
 * Validates credentials, authenticates with Supabase, and redirects on success
 *
 * @param data - LoginFormData containing email and password
 * @returns LoginActionResult with success status or error details
 */
export async function loginAction(
  data: LoginFormData
): Promise<LoginActionResult> {
  try {
    // Validate form data
    const result = loginSchema.safeParse(data);
    logger.info('Login form data', { email: data.email });

    // Return validation errors
    if (!result.success) {
      return {
        success: false,
        error: 'Please check your input and try again',
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    // Create Supabase server client
    logger.info('Creating Supabase server client');
    const supabase = await createClient();

    // Attempt to sign in
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    logger.info('Login result', { authData: authData });

    if (error) {
      logger.error('Login error', {
        email: result.data.email,
        error: error,
      });

      // Handle specific authentication errors
      if (
        error.status === 400 ||
        error.name === 'AuthApiError' ||
        error.message.includes('Invalid login credentials')
      ) {
        return {
          success: false,
          error: 'Invalid email or password. Please try again.',
        };
      }

      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please verify your email address before logging in.',
        };
      }

      // Generic error message for other cases
      return {
        success: false,
        error: 'Failed to login. Please try again later.',
      };
    }

    // Verify user was authenticated
    if (!authData.user) {
      logger.error('Authentication failed', {
        email: result.data.email,
        authData: authData,
      });
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }

    // Success - redirect to daily view
    // Note: redirect() throws, so code after this won't execute
  } catch (error) {
    logger.error('Login action failed', { error: error });
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }

  // Redirect on successful authentication
  redirect(ROUTES.DAILY);
}
