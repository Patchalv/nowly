'use client';

import { toggleRecurringTaskItemActiveAction } from '@/app/actions/recurring/toggleRecurringTaskItemActiveAction';
import { queryKeys } from '@/src/config/query-keys';
import { RecurringTaskItem } from '@/src/domain/types/recurring';
import { handleError } from '@/src/shared/errors';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { handleActionResponse, ServerActionError } from '../tasks/utils';
import {
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

      // Update both activeOnly=true and activeOnly=false caches
      const listKeys = [
        queryKeys.recurringItems.list(true),
        queryKeys.recurringItems.list(false),
      ];

      for (const listKey of listKeys) {
        const previousData =
          queryClient.getQueryData<RecurringTaskItem[]>(listKey);
        if (previousData) {
          previousQueries.set(JSON.stringify(listKey), previousData);

          // Optimistically toggle isActive in cache
          queryClient.setQueryData<RecurringTaskItem[]>(listKey, (old) => {
            if (!old) return old;
            return old.map((item) =>
              item.id === recurringItemId ? { ...item, isActive } : item
            );
          });
        }
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
