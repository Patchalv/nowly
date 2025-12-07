'use client';

import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { toggleRecurringTaskItemActiveAction } from '@/app/actions/recurring/toggleRecurringTaskItemActiveAction';
import { queryKeys } from '@/src/config/query-keys';
import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import type { ServerActionError } from '@/src/presentation/hooks/tasks/utils';
import { handleActionResponse } from '@/src/presentation/hooks/tasks/utils';
import { handleError } from '@/src/shared/errors';
import type {
  ToggleRecurringItemActiveActionResponse,
  ToggleRecurringItemActiveMutationInput,
} from './types';

/**
 * Hook for toggling a recurring task item's active status
 *
 * @returns Mutation object with methods to toggle active status
 * @example
 * ```tsx
 * const toggleActive = useToggleRecurringTaskItemActive();
 *
 * const handleToggle = (itemId: string, currentActive: boolean) => {
 *   toggleActive.mutate({
 *     recurringItemId: itemId,
 *     isActive: !currentActive
 *   });
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Automatically invalidates task queries on success
 * - Errors are logged to Sentry via centralized error handling
 */
export function useToggleRecurringTaskItemActive(): UseMutationResult<
  ToggleRecurringItemActiveActionResponse,
  ServerActionError,
  ToggleRecurringItemActiveMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recurringItemId,
      isActive,
    }: ToggleRecurringItemActiveMutationInput) => {
      const response = await toggleRecurringTaskItemActiveAction(
        recurringItemId,
        isActive
      );
      return handleActionResponse<ToggleRecurringItemActiveActionResponse>(
        response
      );
    },
    onMutate: async ({ recurringItemId, isActive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.recurringItems.all,
      });

      // Snapshot previous values for rollback
      const previousQueries = new Map<
        string,
        RecurringTaskItem[] | undefined
      >();

      // Get the full list cache to find the item details
      const activeOnlyKey = queryKeys.recurringItems.list(true);
      const allItemsKey = queryKeys.recurringItems.list(false);

      const activeOnlyData =
        queryClient.getQueryData<RecurringTaskItem[]>(activeOnlyKey);
      const allItemsData =
        queryClient.getQueryData<RecurringTaskItem[]>(allItemsKey);

      // Snapshot both caches for rollback
      if (activeOnlyData) {
        previousQueries.set(JSON.stringify(activeOnlyKey), activeOnlyData);
      }
      if (allItemsData) {
        previousQueries.set(JSON.stringify(allItemsKey), allItemsData);
      }

      // Find the item in either cache to get its full data
      const existingItem =
        allItemsData?.find((item) => item.id === recurringItemId) ||
        activeOnlyData?.find((item) => item.id === recurringItemId);

      // Update active-only cache (list(true))
      if (activeOnlyData) {
        queryClient.setQueryData<RecurringTaskItem[]>(activeOnlyKey, (old) => {
          if (!old) return old;

          if (isActive) {
            // Adding to active list - update if exists, add if missing
            const exists = old.some((item) => item.id === recurringItemId);
            if (exists) {
              return old.map((item) =>
                item.id === recurringItemId ? { ...item, isActive } : item
              );
            } else if (existingItem) {
              // Add the item to active list
              return [...old, { ...existingItem, isActive }];
            }
            return old;
          } else {
            // Removing from active list
            return old.filter((item) => item.id !== recurringItemId);
          }
        });
      }

      // Update all-items cache (list(false)) - item should always be present
      if (allItemsData) {
        queryClient.setQueryData<RecurringTaskItem[]>(allItemsKey, (old) => {
          if (!old) return old;

          const exists = old.some((item) => item.id === recurringItemId);
          if (exists) {
            return old.map((item) =>
              item.id === recurringItemId ? { ...item, isActive } : item
            );
          } else if (existingItem) {
            // Append if missing (shouldn't happen normally)
            return [...old, { ...existingItem, isActive }];
          }
          return old;
        });
      }

      return { previousQueries };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach((previousData, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, previousData);
        });
      }

      handleError.toast(error, 'Failed to toggle recurring task status');
    },
    onSuccess: () => {
      // Invalidate recurring items queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItems.all });
      // Invalidate task queries as tasks may have been generated or cleaned up
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
