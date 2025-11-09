'use server';

import { ROUTES } from '@/src/config/constants';
import { getDeploymentUrl, isProduction } from '@/src/config/env';
import {
  signupSchema,
  type SignupFormData,
} from '@/src/domain/validation/auth.schema';
import { trackSignup } from '@/src/infrastructure/services/sentry/auth';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { redirect } from 'next/navigation';

/**
 * Server action result type for signup
 */
type SignupActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server action to register a new user with email and password
 * Validates credentials, creates user via Supabase, sends confirmation email
 *
 * The user must confirm their email before they can log in.
 * After successful signup, they are redirected to a success page.
 *
 * @param data - SignupFormData containing email, password, confirmPassword, firstName, lastName
 * @returns SignupActionResult with success status or error details
 */
export async function signupAction(
  data: SignupFormData
): Promise<SignupActionResult> {
  try {
    logger.info('Signup attempt initiated');
    const result = signupSchema.safeParse(data);
    // Return validation errors
    if (!result.success) {
      logger.error('Signup validation errors', {
        errorFields: Object.keys(result.error.flatten().fieldErrors),
      });
      return {
        success: false,
        error: 'Please check your input and try again',
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    // Create Supabase server client
    const supabase = await createClient();

    // Check if email already exists
    const { data: existingUsers, error: queryError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', result.data.email)
      .maybeSingle();

    if (!isProduction && queryError) {
      logger.error('Error checking existing email', { error: queryError });
      // Continue with signup attempt - don't block on query errors
    }

    if (existingUsers) {
      logger.error('Email already exists');
      return {
        success: false,
        error:
          'An account with this email already exists. Please log in instead.',
      };
    }

    // Attempt to sign up
    logger.info('Attempting to sign up');
    const { data: authData, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          first_name: result.data.firstName,
          last_name: result.data.lastName,
        },
        // Redirect through auth confirmation handler for secure token exchange
        emailRedirectTo: `${getDeploymentUrl()}/auth/confirm?next=/daily`,
      },
    });

    if (authData.user) {
      trackSignup({
        id: authData.user.id,
        email: authData.user.email,
      });
    }

    if (error) {
      logger.error('Signup error', { error: error });

      // Handle specific signup errors
      if (error.message.includes('already registered')) {
        logger.error('Email already exists', { email: result.data.email });
        return {
          success: false,
          error: 'An account with this email already exists. Please log in.',
        };
      }

      if (error.message.includes('Password should be')) {
        logger.error('Password does not meet requirements', {
          email: result.data.email,
          error: error,
        });
        return {
          success: false,
          error: 'Password does not meet requirements. Please try again.',
        };
      }

      if (error.status === 422) {
        logger.error('Invalid email format', {
          email: result.data.email,
          error: error,
        });
        return {
          success: false,
          error: 'Invalid email format. Please check and try again.',
        };
      }

      // Generic error message for other cases
      logger.error('Failed to create account', {
        email: result.data.email,
        error: error,
      });
      return {
        success: false,
        error: 'Failed to create account. Please try again later.',
      };
    }

    // Verify user was created
    if (!authData.user) {
      logger.error('User not created', { email: result.data.email });
      return {
        success: false,
        error: 'Account creation failed. Please try again.',
      };
    }

    // Success - redirect to signup success page
    // Note: redirect() throws, so code after this won't execute
  } catch (error) {
    logger.error('Signup action failed', { error: error });
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }

  // Redirect on successful signup to a confirmation page
  logger.info('Redirecting to signup success page');
  redirect(ROUTES.SIGNUP_SUCCESS);
}
