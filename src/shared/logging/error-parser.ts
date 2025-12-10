import type { AppError } from '../errors/app-errors';
import { parseSupabaseError } from '../errors/parser';

/**
 * Parse any error into AppError format
 * Handles Supabase errors, AppErrors, and generic errors
 *
 * This provides a unified interface for error parsing across the application.
 * All errors are normalized to the AppError format for consistent handling.
 *
 * @param error - Any error type (Error, AppError, unknown)
 * @returns Normalized AppError with code, message, and context
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const appError = parseError(error);
 *   // appError.code, appError.message, appError.context available
 * }
 * ```
 */
export function parseError(error: unknown): AppError {
  // If already an AppError, return as-is
  if (isAppError(error)) {
    return error;
  }

  // If Error object or error-like object, try Supabase parsing
  if (error instanceof Error || (error && typeof error === 'object')) {
    return parseSupabaseError(error);
  }

  // Fallback for unknown types (primitives, null, undefined)
  return parseSupabaseError(new Error(String(error)));
}

/**
 * Type guard to check if error is already an AppError
 */
function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as AppError).code === 'string' &&
    typeof (error as AppError).message === 'string'
  );
}
