import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Auth Confirmation Route Handler
 *
 * Handles server-side token exchange for:
 * - Password reset confirmation (type: recovery)
 * - Email signup confirmation (type: email)
 *
 * This route receives token_hash from Supabase email links and exchanges them
 * for a valid session using verifyOtp. Once verified, it redirects the user
 * to the appropriate page.
 *
 * Flow:
 * 1. User clicks link in email: /auth/confirm?token_hash=XXX&type=recovery&next=/reset-password/confirm
 * 2. This handler verifies the token with Supabase
 * 3. On success: redirects to the 'next' parameter (e.g., /reset-password/confirm)
 * 4. On failure: redirects to /error with error message
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  logger.info('Auth confirm route handler');
  logger.info('Request URL', { url: request.url });
  const { searchParams } = new URL(request.url);
  logger.info('Search params', { searchParams: searchParams });
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';
  logger.info('Token hash', { token_hash: token_hash });
  logger.info('Type', { type: type });
  logger.info('Next', { next: next });
  // Prepare redirect URL
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  // Verify token if present
  if (token_hash && type) {
    const supabase = await createClient();
    logger.info('Creating Supabase server client');
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    logger.info('Auth verification result', { error: error });
    if (!error) {
      // Successfully verified - redirect to destination
      return NextResponse.redirect(redirectTo);
    }

    // Log error for debugging (will appear in server logs)
    logger.error('Auth verification error', { error: error });
  }

  // Token verification failed or missing parameters
  // Redirect to error page with helpful message
  redirectTo.pathname = '/error';
  redirectTo.searchParams.set(
    'message',
    'Authentication link is invalid or has expired. Please request a new one.'
  );
  return NextResponse.redirect(redirectTo);
}
