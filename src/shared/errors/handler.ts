/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @deprecated This module is deprecated. Use the unified logging system instead:
 *
 * ```typescript
 * // ✅ NEW: Use unified logging system
 * import { logger, handleError } from '@/src/shared/logging';
 * import { showError, showSuccess } from '@/src/presentation/utils/error-display';
 * ```
 *
 * See docs/LOGGING_AND_ERROR_HANDLING.md for migration guide.
 * See .cursor/rules/logging.md for usage guidelines.
 */

import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';
import type { AppError } from './app-errors';
import { parseSupabaseError } from './parser';

/**
 * Log error to Sentry
 * @deprecated Use handleError from @/src/shared/logging instead
 */
function logToSentry(error: AppError) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', {
      code: error.code,
      message: error.message,
      originalError: error.originalError,
      context: error.context,
    });
  } else {
    Sentry.captureException(error.originalError || new Error(error.message), {
      level: 'error',
      tags: {
        error_code: error.code,
      },
      contexts: {
        error_details: {
          code: error.code,
          message: error.message,
          ...error.context,
        },
      },
    });
  }
}

/**
 * Handle errors with different strategies
 * @deprecated Use handleError from @/src/shared/logging instead
 */
export const handleError = {
  /**
   * Show toast notification and log to Sentry
   * @deprecated Use showError() from @/src/presentation/utils/error-display in client components
   * or handleError.log() from @/src/shared/logging in server actions
   */
  toast: (error: Error | any, customMessage?: string) => {
    const appError = parseSupabaseError(error);
    logToSentry(appError);

    toast.error(customMessage || appError.message);

    return appError;
  },

  /**
   * Log to Sentry and return the error
   * @deprecated Use handleError.log() from @/src/shared/logging instead
   */
  return: (error: Error | any): AppError => {
    const appError = parseSupabaseError(error);
    logToSentry(appError);

    return appError;
  },

  /**
   * Log to Sentry and throw the error
   * @deprecated Use handleError.throw() from @/src/shared/logging instead
   */
  throw: (error: Error | any): never => {
    const appError = parseSupabaseError(error);
    logToSentry(appError);

    throw appError;
  },

  /**
   * Silent logging (no toast, no throw)
   * @deprecated Use handleError.silent() from @/src/shared/logging instead
   */
  silent: (error: Error | any): AppError => {
    const appError = parseSupabaseError(error);
    logToSentry(appError);

    return appError;
  },
};

/**
 * Wrapper for async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    onError?: (error: AppError) => void;
    showToast?: boolean;
    rethrow?: boolean;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = parseSupabaseError(error);
      logToSentry(appError);

      if (options.showToast) {
        toast.error(appError.message);
      }

      if (options.onError) {
        options.onError(appError);
      }

      if (options.rethrow) {
        throw appError;
      }

      return null;
    }
  }) as T;
}
