'use client';

import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { deleteRecurringTaskItemAction } from '@/app/actions/recurring/deleteRecurringTaskItemAction';
import { queryKeys } from '@/src/config/query-keys';
import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import { handleError } from '@/src/shared/errors';
import type { ServerActionError } from '../tasks/utils';
import { handleActionResponse } from '../tasks/utils';
import type {
  DeleteRecurringItemActionResponse,
  DeleteRecurringItemMutationInput,
} from './types';

/**
 * Hook for deleting a recurring task item
 *
 * @returns Mutation object with methods to delete a recurring item
 * @example
 * ```tsx
 * const deleteRecurringItem = useDeleteRecurringTaskItem();
 *
 * const handleDelete = (itemId: string) => {
 *   deleteRecurringItem.mutate(itemId);
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Removes item from all list queries optimistically
 * - Automatically invalidates task queries on success (associated tasks deleted)
 * - Errors are logged to Sentry via centralized error handling
 */
export function useDeleteRecurringTaskItem(): UseMutationResult<
  DeleteRecurringItemActionResponse,
  ServerActionError,
  DeleteRecurringItemMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recurringItemId,
    }: DeleteRecurringItemMutationInput) => {
      const response = await deleteRecurringTaskItemAction(recurringItemId);
      return handleActionResponse<DeleteRecurringItemActionResponse>(response);
    },
    onMutate: async ({ recurringItemId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.recurringItems.all,
      });

      // Snapshot previous values for rollback
      const previousQueries = new Map<
        string,
        RecurringTaskItem[] | undefined
      >();

      // Remove from both activeOnly=true and activeOnly=false caches
      const listKeys = [
        queryKeys.recurringItems.list(true),
        queryKeys.recurringItems.list(false),
      ];

      for (const listKey of listKeys) {
        const previousData =
          queryClient.getQueryData<RecurringTaskItem[]>(listKey);
        if (previousData) {
          previousQueries.set(JSON.stringify(listKey), previousData);

          // Optimistically remove the item from cache
          queryClient.setQueryData<RecurringTaskItem[]>(listKey, (old) => {
            if (!old) return old;
            return old.filter((item) => item.id !== recurringItemId);
          });
        }
      }

      return { previousQueries };
    },
    onError: (error, _recurringItemId, context) => {
      // Rollback optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach((previousData, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, previousData);
        });
      }

      handleError.toast(error, 'Failed to delete recurring task');
    },
    onSuccess: () => {
      // Invalidate recurring items queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItems.all });
      // Invalidate task queries as associated tasks were deleted
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Recurring task deleted successfully');
    },
  });
}
