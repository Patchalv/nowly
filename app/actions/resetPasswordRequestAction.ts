'use server';

import { getDeploymentUrl } from '@/src/config/env';
import {
  resetPasswordRequestSchema,
  type ResetPasswordRequestFormData,
} from '@/src/domain/validation/auth.schema';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';

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
 * @param data - ResetPasswordRequestFormData containing email
 * @returns ResetPasswordRequestActionResult with success status
 */
export async function resetPasswordRequestAction(
  data: ResetPasswordRequestFormData
): Promise<ResetPasswordRequestActionResult> {
  try {
    logger.info('Reset password request received');
    // Validate form data
    const result = resetPasswordRequestSchema.safeParse(data);
    // Return validation errors
    if (!result.success) {
      logger.error('Reset password request validation errors', {
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
      logger.error('Password reset email error', { error: error });
    }

    // ALWAYS return success to prevent email enumeration attacks
    // This prevents attackers from determining which emails are registered
    return { success: true };
  } catch (error) {
    logger.error('Password reset request action failed', { error: error });

    // Still return success to prevent email enumeration
    return { success: true };
  }
}
