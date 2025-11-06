'use server';

import { ROUTES } from '@/src/config/constants';
import {
  resetPasswordConfirmSchema,
  type ResetPasswordConfirmFormData,
} from '@/src/domain/validation/auth.schema';
import { createClient } from '@/src/infrastructure/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server action result type for password reset confirmation
 */
type ResetPasswordConfirmActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server action to confirm password reset with new password
 * Validates new password and updates via Supabase Auth
 *
 * @param data - ResetPasswordConfirmFormData containing password and confirmPassword
 * @returns ResetPasswordConfirmActionResult with success status or error details
 */
export async function resetPasswordConfirmAction(
  data: ResetPasswordConfirmFormData
): Promise<ResetPasswordConfirmActionResult> {
  try {
    // Validate form data
    const result = resetPasswordConfirmSchema.safeParse(data);

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

    // Attempt to update password
    const { error } = await supabase.auth.updateUser({
      password: result.data.password,
    });

    if (error) {
      console.error('Password update error:', error);

      // Handle specific password reset errors
      if (error.message.includes('session_not_found')) {
        return {
          success: false,
          error:
            'Password reset link has expired or is invalid. Please request a new one.',
        };
      }

      if (error.message.includes('same_password')) {
        return {
          success: false,
          error: 'New password must be different from your current password.',
        };
      }

      // Generic error message for other cases
      return {
        success: false,
        error:
          'Failed to update password. Please try again or request a new reset link.',
      };
    }

    // Success - redirect to login with success indication
    // Note: redirect() throws, so code after this won't execute
  } catch (error) {
    console.error('Password reset confirm action failed:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }

  // Redirect on successful password update
  redirect(ROUTES.LOGIN);
}
