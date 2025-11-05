'use server';

import { getDeploymentUrl } from '@/src/config/env';
import { resetPasswordRequestSchema } from '@/src/domain/validation/auth.schema';
import { createClient } from '@/src/infrastructure/supabase/server';

/**
 * Server action result type for password reset request
 */
type ResetPasswordRequestActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server action to request a password reset email
 * Validates email and sends reset link via Supabase Auth
 *
 * SECURITY: Always returns success to prevent email enumeration attacks
 *
 * @param formData - FormData containing email
 * @returns ResetPasswordRequestActionResult with success status
 */
export async function resetPasswordRequestAction(
  formData: FormData
): Promise<ResetPasswordRequestActionResult> {
  try {
    // Extract and validate form data
    const email = formData.get('email');

    const result = resetPasswordRequestSchema.safeParse({
      email,
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

    // Attempt to send password reset email
    // Redirect goes through /auth/confirm handler to exchange token server-side
    const { error } = await supabase.auth.resetPasswordForEmail(
      result.data.email,
      {
        redirectTo: `${getDeploymentUrl()}/auth/confirm?next=/reset-password/confirm`,
      }
    );

    // Log error internally but don't expose to user (security best practice)
    if (error) {
      console.error('Password reset email error:', error);
    }

    // ALWAYS return success to prevent email enumeration attacks
    // This prevents attackers from determining which emails are registered
    return { success: true };
  } catch (error) {
    console.error('Password reset request action failed:', error);

    // Still return success to prevent email enumeration
    return { success: true };
  }
}
