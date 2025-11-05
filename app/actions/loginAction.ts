'use server';

import { createClient } from '@/src/infrastructure/supabase/server';
import { loginSchema } from '@/src/domain/validation/auth.schema';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/src/config/constants';

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
 * @param formData - FormData containing email and password
 * @returns LoginActionResult with success status or error details
 */
export async function loginAction(
  formData: FormData
): Promise<LoginActionResult> {
  try {
    // Extract and validate form data
    const email = formData.get('email');
    const password = formData.get('password');

    const result = loginSchema.safeParse({
      email,
      password,
    });

    // Return validation errors
    if (!result.success) {
      return {
        success: false,
        error: 'Please check your input and try again',
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    // Create Supabase server client
    const supabase = await createClient();

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      console.error('Login error:', error);

      // Handle specific authentication errors
      if (error.message.includes('Invalid login credentials')) {
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
    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }

    // Success - redirect to daily view
    // Note: redirect() throws, so code after this won't execute
  } catch (error) {
    console.error('Login action failed:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }

  // Redirect on successful authentication
  redirect(ROUTES.DAILY);
}
