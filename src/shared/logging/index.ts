/**
 * Unified logging and error handling exports
 *
 * This module provides centralized access to all logging and error handling
 * functionality. Import from this single location instead of directly from
 * Sentry or individual modules.
 *
 * Architecture:
 * - Error handlers handle errors (parsing, logging, propagating)
 * - UI components handle user feedback (toasts, inline errors)
 * - Logger handles informational and debug logging
 *
 * @example
 * ```typescript
 * // In server actions, use cases, repositories
 * import { logger, handleError } from '@/src/shared/logging';
 *
 * // In client components (for UI feedback)
 * import { showError, showSuccess } from '@/src/presentation/utils/error-display';
 * ```
 *
 * @module shared/logging
 */

export { handleError } from './error-handler';
export { parseError } from './error-parser';
export { logger } from './logger';
