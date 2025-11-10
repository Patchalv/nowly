/**
 * Custom error class for server action errors
 * This allows React Query to properly manage error state
 * and provides access to field-level validation errors
 */
export class ServerActionError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ServerActionError';
  }
}

/**
 * Type guard to check if response has error structure
 */
export function hasErrorStructure(response: unknown): response is {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
} {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof (response as { success: unknown }).success === 'boolean'
  );
}

/**
 * Transforms server action response to throw on failure
 * This ensures React Query's error state management works correctly
 * Field errors are preserved in the thrown error for form integration
 */
export function handleActionResponse<
  T extends {
    success: boolean;
    errors?: Record<string, string[]>;
    error?: string;
  },
>(response: unknown): T {
  if (!hasErrorStructure(response)) {
    throw new ServerActionError('Invalid response format');
  }

  if (!response.success) {
    let errorMessage = 'Operation failed';

    if (response.errors && Object.keys(response.errors).length > 0) {
      const messages = Object.values(response.errors).flat().filter(Boolean);
      errorMessage =
        messages.length > 0 ? messages.join(', ') : 'Validation failed';
    } else if (response.error) {
      errorMessage = response.error;
    }

    throw new ServerActionError(errorMessage, response.errors);
  }

  return response as T;
}

/**
 * Formats error for display
 * Extracts message from ServerActionError or generic Error
 */
export function formatActionError(error: unknown): string {
  if (error instanceof ServerActionError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Operation failed';
}
