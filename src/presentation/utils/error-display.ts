'use client';

import type { AppError } from '@/src/shared/errors/app-errors';
import { handleError } from '@/src/shared/logging';
import { toast } from 'sonner';

/**
 * UI Error Display Utilities
 *
 * This module provides client-side utilities for displaying errors to users.
 * It maintains separation of concerns by keeping UI feedback in the
 * presentation layer while leveraging error handling from the infrastructure layer.
 *
 * **Important:** These utilities are CLIENT-SIDE ONLY
 * - Use 'use client' directive
 * - Do NOT import in server actions or use cases
 * - Do NOT import in repositories
 *
 * For server-side error handling, use handleError.* methods directly.
 *
 * @module presentation/utils/error-display
 */

/**
 * Show error message to user with toast notification
 *
 * Use in: Client Components, React Query hooks
 * Purpose: Display user-facing error messages with toast
 *
 * This function:
 * - Parses and logs error via handleError.log()
 * - Shows toast notification with error message
 * - Returns AppError for additional handling if needed
 *
 * @param error - Any error type (Error, AppError, unknown)
 * @param customMessage - Optional user-friendly message (overrides error.message)
 * @returns Parsed AppError with code, message, and context
 *
 * @example
 * ```typescript
 * // In React Query mutation
 * export function useCreateTask() {
 *   return useMutation({
 *     mutationFn: createTaskAction,
 *     onError: (error) => {
 *       showError(error, 'Failed to create task');
 *     },
 *     onSuccess: () => {
 *       showSuccess('Task created!');
 *     },
 *   });
 * }
 *
 * // In component event handler
 * async function handleSubmit() {
 *   const result = await createTaskAction(formData);
 *
 *   if (!result.success) {
 *     showError(result.error, 'Failed to create task');
 *   } else {
 *     showSuccess('Task created!');
 *   }
 * }
 * ```
 */
export function showError(error: unknown, customMessage?: string): AppError {
  const appError = handleError.log(error);
  toast.error(customMessage || appError.message);
  return appError;
}

/**
 * Show success message to user with toast notification
 *
 * Use in: Client Components, React Query hooks
 * Purpose: Display success feedback to users
 *
 * Provides consistent success messaging across the application.
 *
 * @param message - Success message to display
 *
 * @example
 * ```typescript
 * // After successful operation
 * showSuccess('Task created successfully!');
 * showSuccess('Profile updated!');
 *
 * // In React Query mutation
 * export function useDeleteTask() {
 *   return useMutation({
 *     mutationFn: deleteTaskAction,
 *     onSuccess: () => {
 *       showSuccess('Task deleted');
 *     },
 *   });
 * }
 * ```
 */
export function showSuccess(message: string): void {
  toast.success(message);
}

/**
 * Show info message to user with toast notification
 *
 * Use in: Client Components
 * Purpose: Display informational messages to users
 *
 * @param message - Info message to display
 *
 * @example
 * ```typescript
 * showInfo('Your changes have been saved');
 * showInfo('5 tasks rolled over to today');
 * ```
 */
export function showInfo(message: string): void {
  toast.info(message);
}

/**
 * Show warning message to user with toast notification
 *
 * Use in: Client Components
 * Purpose: Display warning messages to users
 *
 * @param message - Warning message to display
 *
 * @example
 * ```typescript
 * showWarning('Some tasks could not be synced');
 * showWarning('Using cached data due to network issues');
 * ```
 */
export function showWarning(message: string): void {
  toast.warning(message);
}
