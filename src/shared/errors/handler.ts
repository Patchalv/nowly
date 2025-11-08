import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';
import type { AppError } from './app-errors';
import { parseSupabaseError } from './parser';

/**
 * Log error to Sentry (will be implemented with Sentry setup)
 */
function logToSentry(error: AppError) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', { error: error });
  }
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

/**
 * Handle errors with different strategies
 */
export const handleError = {
  /**
   * Show toast notification and log to Sentry
   */
  toast: (error: Error | any, customMessage?: string) => {
    const appError = parseSupabaseError(error);
    logToSentry(appError);

    toast.error(customMessage || appError.message);

    return appError;
  },

  /**
   * Log to Sentry and return the error
   */
  return: (error: Error | any): AppError => {
    const appError = parseSupabaseError(error);
    logToSentry(appError);

    return appError;
  },

  /**
   * Log to Sentry and throw the error
   */
  throw: (error: Error | any): never => {
    const appError = parseSupabaseError(error);
    logToSentry(appError);

    throw appError;
  },

  /**
   * Silent logging (no toast, no throw)
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
