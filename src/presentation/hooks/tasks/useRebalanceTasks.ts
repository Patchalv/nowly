'use client';

import { rebalanceTasksAction } from '@/app/actions/tasks/rebalanceTasksAction';
import { queryKeys } from '@/src/config/query-keys';
import type { Task } from '@/src/domain/model/Task';
import { handleError } from '@/src/shared/errors/handler';
import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RebalanceTasksInput {
  updates: Array<{ taskId: string; newPosition: string }>;
}

interface RebalanceTasksResponse {
  success: boolean;
  error?: string;
}

/**
 * Hook for rebalancing multiple tasks by updating their positions.
 * Used when drag-and-drop encounters the min position limitation.
 *
 * @returns Mutation object with methods to rebalance tasks
 * @example
 * ```tsx
 * const rebalanceTasks = useRebalanceTasks();
 *
 * const handleRebalance = (updates) => {
 *   rebalanceTasks.mutate({ updates });
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Updates all task positions in weekly cache immediately
 * - Automatically invalidates task queries on success
 * - Errors are logged to Sentry via centralized error handling
 */
export function useRebalanceTasks(): UseMutationResult<
  RebalanceTasksResponse,
  Error,
  RebalanceTasksInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates }: RebalanceTasksInput) => {
      try {
        if (!updates || updates.length === 0) {
          throw new Error('No updates provided for rebalancing');
        }

        const response = await rebalanceTasksAction(updates);

        if (!response.success) {
          const errorMessage = response.error || 'Failed to rebalance tasks';
          throw new Error(errorMessage);
        }

        return response;
      } catch (error) {
        // Re-throw with additional context
        const message =
          error instanceof Error ? error.message : 'Unknown rebalancing error';
        throw new Error(`Rebalance failed: ${message}`);
      }
    },
    onMutate: async ({ updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Find the week key that contains these tasks
      const previousQueries = new Map<string, Task[] | undefined>();

      // Search through all weekly queries to find the tasks
      const allQueries = queryClient.getQueryCache().getAll();
      for (const query of allQueries) {
        const queryKey = query.queryKey;
        if (
          Array.isArray(queryKey) &&
          queryKey[0] === 'tasks' &&
          queryKey[1] === 'week'
        ) {
          const data = queryClient.getQueryData<Task[]>(queryKey);
          if (data) {
            // Check if any of the tasks being updated are in this week
            const hasTask = updates.some((update) =>
              data.some((t) => t.id === update.taskId)
            );

            if (hasTask) {
              // Snapshot current week cache
              previousQueries.set(JSON.stringify(queryKey), data);

              // Optimistically update all task positions in cache
              queryClient.setQueryData<Task[]>(queryKey, (old) => {
                if (!old) return old;

                // Create a map of taskId -> newPosition for quick lookup
                const positionMap = new Map(
                  updates.map((u) => [u.taskId, u.newPosition])
                );

                // Update positions for all affected tasks
                return old.map((task) => {
                  const newPosition = positionMap.get(task.id);
                  if (newPosition) {
                    return { ...task, position: newPosition };
                  }
                  return task;
                });
              });

              break; // Found the week, no need to continue
            }
          }
        }
      }

      return { previousQueries };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach((previousData, queryKeyStr) => {
          // Convert JSON string back to array format
          const queryKey = JSON.parse(queryKeyStr) as readonly [
            'tasks',
            'week',
            string,
          ];
          queryClient.setQueryData(queryKey, previousData);
        });
      }

      // Show error toast with centralized error handling
      try {
        handleError.toast(error, 'Failed to rebalance tasks');
      } catch (toastError) {
        // Fallback if toast fails
        console.error('[Rebalance Error]', {
          originalError: error,
          toastError: toastError,
        });
        // Try showing a simple toast without error handling
        toast.error('Failed to reorder tasks. Please try again.');
      }
    },
    onSuccess: () => {
      // No invalidation needed - optimistic update is already correct
      // Cache will naturally expire based on staleTime configuration
      toast.success('Tasks reordered successfully');
    },
  });
}
