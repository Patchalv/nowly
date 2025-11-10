'use client';

import { createTaskAction } from '@/app/actions/tasks/createTaskAction';
import { deleteTaskAction } from '@/app/actions/tasks/deleteTaskAction';
import { updateTaskAction } from '@/app/actions/tasks/updateTaskAction';
import { queryKeys } from '@/src/config/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Custom error class for server action errors
 * This allows React Query to properly manage error state
 */
class ServerActionError extends Error {
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
function hasErrorStructure(response: unknown): response is {
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
 */
function handleActionResponse<T>(response: unknown): T {
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

function formatActionError(error: unknown): string {
  if (error instanceof ServerActionError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Operation failed';
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await createTaskAction(formData);
      return handleActionResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      const errorMessage = formatActionError(error);
      toast.error(errorMessage);
    },
  });
}

/**
 * Update a task (toggle completion, edit title, etc.)
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: {
        completed?: boolean;
        title?: string;
        scheduledDate?: Date | null;
      };
    }) => {
      const response = await updateTaskAction(taskId, updates);
      return handleActionResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      const errorMessage = formatActionError(error);
      toast.error(errorMessage);
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await deleteTaskAction(taskId);
      return handleActionResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      const errorMessage = formatActionError(error);
      toast.error(errorMessage);
    },
  });
}
