import type { AppError } from './app-errors';
import { ERROR_MESSAGES, ErrorCode } from './app-errors';

/**
 * Parse Supabase errors into AppError format
 */
export function parseSupabaseError(error: any): AppError {
  // Handle Supabase auth errors
  if (error?.message) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials')) {
      return {
        code: ErrorCode.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES[ErrorCode.INVALID_CREDENTIALS],
        originalError: error,
      };
    }

    if (message.includes('email not confirmed')) {
      return {
        code: ErrorCode.EMAIL_NOT_CONFIRMED,
        message: ERROR_MESSAGES[ErrorCode.EMAIL_NOT_CONFIRMED],
        originalError: error,
      };
    }

    if (message.includes('user not found')) {
      return {
        code: ErrorCode.USER_NOT_FOUND,
        message: ERROR_MESSAGES[ErrorCode.USER_NOT_FOUND],
        originalError: error,
      };
    }

    if (message.includes('password') && message.includes('weak')) {
      return {
        code: ErrorCode.WEAK_PASSWORD,
        message: ERROR_MESSAGES[ErrorCode.WEAK_PASSWORD],
        originalError: error,
      };
    }

    if (
      message.includes('already registered') ||
      message.includes('already exists')
    ) {
      return {
        code: ErrorCode.EMAIL_ALREADY_EXISTS,
        message: ERROR_MESSAGES[ErrorCode.EMAIL_ALREADY_EXISTS],
        originalError: error,
      };
    }
  }

  // Handle Supabase database errors
  if (error?.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return {
          code: ErrorCode.DUPLICATE_KEY,
          message: ERROR_MESSAGES[ErrorCode.DUPLICATE_KEY],
          originalError: error,
        };

      case '42501': // Insufficient privilege
        return {
          code: ErrorCode.PERMISSION_DENIED,
          message: ERROR_MESSAGES[ErrorCode.PERMISSION_DENIED],
          originalError: error,
        };

      case 'PGRST116': // Not found
        return {
          code: ErrorCode.NOT_FOUND,
          message: ERROR_MESSAGES[ErrorCode.NOT_FOUND],
          originalError: error,
        };
    }
  }

  // Handle network errors
  if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
      originalError: error,
    };
  }

  // Default unknown error
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: error?.message || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
    originalError: error,
  };
}
