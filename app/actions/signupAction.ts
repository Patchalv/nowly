'use server';

import { ROUTES } from '@/src/config/constants';
import { getDeploymentUrl, isProduction } from '@/src/config/env';
import {
  signupSchema,
  type SignupFormData,
} from '@/src/domain/validation/auth.schema';
import { createClient } from '@/src/infrastructure/supabase/server';
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
    const result = signupSchema.safeParse(data);
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

    // Check if email already exists
    const { data: existingUsers, error: queryError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', result.data.email)
      .maybeSingle();

    if (!isProduction && queryError) {
      console.error('Error checking existing email:', queryError);
      // Continue with signup attempt - don't block on query errors
    }

    if (existingUsers) {
      return {
        success: false,
        error:
          'An account with this email already exists. Please log in instead.',
      };
    }

    // Attempt to sign up
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

    if (error) {
      console.error('Signup error:', error);

      // Handle specific signup errors
      if (error.message.includes('already registered')) {
        return {
          success: false,
          error: 'An account with this email already exists. Please log in.',
        };
      }

      if (error.message.includes('Password should be')) {
        return {
          success: false,
          error: 'Password does not meet requirements. Please try again.',
        };
      }

      if (error.status === 422) {
        return {
          success: false,
          error: 'Invalid email format. Please check and try again.',
        };
      }

      // Generic error message for other cases
      return {
        success: false,
        error: 'Failed to create account. Please try again later.',
      };
    }

    // Verify user was created
    if (!authData.user) {
      return {
        success: false,
        error: 'Account creation failed. Please try again.',
      };
    }

    // Success - redirect to signup success page
    // Note: redirect() throws, so code after this won't execute
  } catch (error) {
    console.error('Signup action failed:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }

  // Redirect on successful signup to a confirmation page
  redirect(ROUTES.SIGNUP_SUCCESS);
}
