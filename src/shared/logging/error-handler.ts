import * as Sentry from '@sentry/nextjs';
import type { AppError } from '../errors/app-errors';
import { parseError } from './error-parser';
import { logger } from './logger';

/**
 * Log error to Sentry with AppError structure
 * Includes error code, message, and context for better observability
 *
 * @param error - Parsed AppError to log
 * @param level - Sentry severity level (default: 'error')
 */
function logErrorToSentry(
  error: AppError,
  level: 'error' | 'warning' = 'error'
) {
  Sentry.captureException(error.originalError || new Error(error.message), {
    level,
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
 * Unified error handling strategies for different layers
 *
 * This module provides consistent error handling across the application
 * with layer-appropriate methods:
 *
 * - `handleError.log()` - For server actions (log and return)
 * - `handleError.throw()` - For repositories (log and throw)
 * - `handleError.silent()` - For non-critical errors (log at warn level)
 * - `handleError.validation()` - For validation errors (log at info level)
 *
 * Note: UI feedback (toasts) are handled separately in the presentation layer
 * via showError() utility to maintain clean architecture boundaries.
 *
 * @example
 * ```typescript
 * // In server actions
 * if (authError) {
 *   const error = handleError.log(authError);
 *   return { success: false, error: error.message };
 * }
 *
 * // In repositories
 * if (dbError) {
 *   handleError.throw(dbError);
 * }
 * ```
 */
export const handleError = {
  /**
   * Log error to Sentry and return AppError
   *
   * Use in: Server Actions
   * Purpose: Return error to client for handling
   *
   * This method:
   * - Parses error into AppError format
   * - Logs to Sentry with full context
   * - Logs to logger at error level
   * - Returns AppError for client handling
   *
   * Does NOT show toast (UI layer responsibility)
   *
   * @param error - Any error type
   * @returns Parsed AppError with code, message, and context
   *
   * @example
   * ```typescript
   * export async function createTaskAction(formData: FormData) {
   *   const { data: { user }, error: authError } = await supabase.auth.getUser();
   *
   *   if (authError || !user) {
   *     const error = handleError.log(authError);
   *     return { success: false, error: error.message };
   *   }
   * }
   * ```
   */
  log: (error: unknown): AppError => {
    const appError = parseError(error);
    logErrorToSentry(appError);
    logger.error(appError.message, {
      code: appError.code,
      context: appError.context,
    });

    return appError;
  },

  /**
   * Log error to Sentry and throw AppError
   *
   * Use in: Repositories, Infrastructure Layer
   * Purpose: Propagate errors to use case layer
   *
   * This method:
   * - Parses error into AppError format
   * - Logs to Sentry with full context
   * - Logs to logger at error level
   * - Throws AppError to be caught by caller
   *
   * @param error - Any error type
   * @throws AppError - Always throws after logging
   *
   * @example
   * ```typescript
   * export class SupabaseTaskRepository implements ITaskRepository {
   *   async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
   *     const { data, error } = await this.client.from('tasks').insert(...);
   *
   *     if (error) {
   *       handleError.throw(error);
   *     }
   *
   *     if (!data) {
   *       handleError.throw(new Error('No data returned after insert'));
   *     }
   *
   *     return this.toDomain(data);
   *   }
   * }
   * ```
   */
  throw: (error: unknown): never => {
    const appError = parseError(error);
    logErrorToSentry(appError);
    logger.error(appError.message, {
      code: appError.code,
      context: appError.context,
    });

    throw appError;
  },

  /**
   * Silently log error to Sentry (no throw, warning level)
   *
   * Use in: Non-critical operations, optional features
   * Purpose: Track errors without blocking execution
   *
   * This method:
   * - Parses error into AppError format
   * - Logs to Sentry at warning level
   * - Logs to logger at warn level
   * - Returns AppError without throwing
   *
   * Use cases:
   * - Background task failures
   * - Optional feature failures
   * - Recoverable errors
   * - Degraded functionality scenarios
   *
   * @param error - Any error type
   * @returns Parsed AppError with code, message, and context
   *
   * @example
   * ```typescript
   * // Non-critical background operation
   * const generationResult = await ensureTasksGenerated(...);
   * if (!generationResult.success) {
   *   handleError.silent(generationResult.error);
   *   // Continue anyway, tasks will generate later
   * }
   * ```
   */
  silent: (error: unknown): AppError => {
    const appError = parseError(error);
    logErrorToSentry(appError, 'warning');
    logger.warn(appError.message, {
      code: appError.code,
      context: appError.context,
    });

    return appError;
  },

  /**
   * Log validation errors at info level
   *
   * Use in: Server Actions, Form validation
   * Purpose: Track validation failures without noise
   *
   * This method:
   * - Logs to logger at info level (not error)
   * - Does NOT log to Sentry as exception
   * - Reduces Sentry noise from expected user errors
   * - Still tracked for pattern analysis
   *
   * Validation errors are expected user behavior (bad input),
   * not system failures, so they don't warrant error-level logging.
   *
   * @param message - Validation error description
   * @param details - Optional validation error details (Zod errors, etc.)
   *
   * @example
   * ```typescript
   * export async function createTaskAction(formData: FormData) {
   *   const result = createTaskSchema.safeParse(data);
   *
   *   if (!result.success) {
   *     handleError.validation('Create task validation failed', result.error);
   *     return {
   *       success: false,
   *       errors: result.error.flatten().fieldErrors
   *     };
   *   }
   * }
   * ```
   */
  validation: (message: string, details?: unknown): void => {
    logger.info(message, { validation_error: details });
  },
};
