import * as Sentry from '@sentry/nextjs';

/**
 * Centralized logger facade that wraps Sentry logger
 * Provides consistent structured logging across the application
 *
 * Usage:
 * - Import from '@/src/shared/logging' (not directly from Sentry)
 * - Always include context objects for structured logging
 * - Use appropriate log levels based on severity
 *
 * @example
 * ```typescript
 * import { logger } from '@/src/shared/logging';
 *
 * logger.info('Task created', { taskId: task.id, userId: user.id });
 * logger.error('Failed to create task', { error, userId });
 * ```
 */

/**
 * Format log message with level prefix in development
 */
function formatMessage(level: string, message: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `[${level.toUpperCase()}] ${message}`;
  }
  return message;
}

export const logger = {
  /**
   * Trace level - Very detailed logs for deep debugging
   *
   * Use cases:
   * - Tracing function entry/exit points
   * - Variable state inspection
   * - Detailed execution flow
   *
   * Note: Rarely used, primarily for development debugging
   * Production sampling: 5%
   *
   * @example
   * ```typescript
   * logger.trace('Entering createTask function', { userId, input });
   * ```
   */
  trace: (message: string, context?: Record<string, unknown>) => {
    const { logger } = Sentry;
    logger.trace(formatMessage('trace', message), context);
  },

  /**
   * Debug level - Detailed information for debugging
   *
   * Use cases:
   * - Development diagnostics
   * - Cache hits/misses
   * - Query details and parameters
   * - Database operation details
   *
   * Production sampling: 10%
   *
   * @example
   * ```typescript
   * logger.debug('Creating task in database', { userId: task.userId, title: task.title });
   * logger.debug('Cache hit for user profile', { userId, cacheKey });
   * ```
   */
  debug: (message: string, context?: Record<string, unknown>) => {
    const { logger } = Sentry;
    logger.debug(formatMessage('debug', message), context);
  },

  /**
   * Info level - General informational messages
   *
   * Use cases:
   * - Significant business events
   * - Successful operations
   * - Validation errors (non-critical)
   * - System state changes
   *
   * Production sampling: 20%
   *
   * @example
   * ```typescript
   * logger.info('Task created successfully', { taskId: task.id });
   * logger.info('User logged in', { userId: user.id });
   * ```
   */
  info: (message: string, context?: Record<string, unknown>) => {
    const { logger } = Sentry;
    logger.info(formatMessage('info', message), context);
  },

  /**
   * Warn level - Warning messages for potentially harmful situations
   *
   * Use cases:
   * - Deprecated features in use
   * - Recoverable errors
   * - Fallback behavior triggered
   * - Non-critical operation failures
   *
   * Production sampling: 100% (always logged)
   *
   * @example
   * ```typescript
   * logger.warn('Using deprecated API endpoint', { endpoint, userId });
   * logger.warn('Task generation failed, continuing anyway', { recurringItemId });
   * ```
   */
  warn: (message: string, context?: Record<string, unknown>) => {
    const { logger } = Sentry;
    logger.warn(formatMessage('warn', message), context);
  },

  /**
   * Error level - Error messages for error conditions
   *
   * Use cases:
   * - Caught exceptions
   * - Failed operations
   * - Validation failures (use handleError.validation instead)
   * - Database errors
   *
   * Note: For structured error handling, prefer handleError.* methods
   * Production sampling: 100% (always logged)
   *
   * @example
   * ```typescript
   * logger.error('Failed to create task', { error, userId, input });
   * logger.error('Database query failed', { query, error });
   * ```
   */
  error: (message: string, context?: Record<string, unknown>) => {
    const { logger } = Sentry;
    logger.error(formatMessage('error', message), context);
  },

  /**
   * Fatal level - Critical errors that require immediate attention
   *
   * Use cases:
   * - System-critical failures
   * - Unrecoverable errors
   * - Service unavailability
   * - Critical data corruption
   *
   * Production sampling: 100% (always logged)
   *
   * @example
   * ```typescript
   * logger.fatal('Database connection pool exhausted', {
   *   activeConnections: 100,
   *   maxConnections: 100
   * });
   * ```
   */
  fatal: (message: string, context?: Record<string, unknown>) => {
    const { logger } = Sentry;
    logger.fatal(formatMessage('fatal', message), context);
  },
};
