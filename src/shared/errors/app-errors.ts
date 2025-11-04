/**
 * Error types and constants
 */

export enum ErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',

  // Database errors
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_KEY = 'DUPLICATE_KEY',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export type AppError = {
  code: ErrorCode;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
};

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Auth errors
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.EMAIL_NOT_CONFIRMED]: 'Please confirm your email address',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.WEAK_PASSWORD]: 'Password is too weak. Use at least 8 characters',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists',

  // Database errors
  [ErrorCode.NOT_FOUND]: 'The requested item was not found',
  [ErrorCode.PERMISSION_DENIED]:
    'You do not have permission to perform this action',
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCode.DUPLICATE_KEY]: 'This item already exists',

  // Network errors
  [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ErrorCode.TIMEOUT]: 'Request timed out. Please try again',

  // Unknown
  [ErrorCode.UNKNOWN_ERROR]: 'Something went wrong. Please try again',
};
