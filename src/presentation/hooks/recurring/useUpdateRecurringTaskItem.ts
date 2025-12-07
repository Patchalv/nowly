'use client';

import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { updateRecurringTaskItemAction } from '@/app/actions/recurring/updateRecurringTaskItemAction';
import { queryKeys } from '@/src/config/query-keys';
import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import { handleError } from '@/src/shared/errors';

import { handleActionResponse, ServerActionError } from '../tasks/utils';
import type {
  UpdateRecurringItemActionResponse,
  UpdateRecurringItemMutationInput,
} from './types';

/**
 * Hook for updating a recurring task item
 *
 * @returns Mutation object with methods to update a recurring item
 * @example
 * ```tsx
 * const updateRecurringItem = useUpdateRecurringTaskItem();
 *
 * const handleUpdate = (itemId: string) => {
 *   updateRecurringItem.mutate({
 *     recurringItemId: itemId,
 *     updates: { title: 'New Title' }
 *   });
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Automatically invalidates recurring items and task queries on success
 * - Field errors are accessible via `error.fieldErrors` in the error object
 * - Errors are logged to Sentry via centralized error handling
 */
export function useUpdateRecurringTaskItem(): UseMutationResult<
  UpdateRecurringItemActionResponse,
  ServerActionError,
  UpdateRecurringItemMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recurringItemId,
      updates,
    }: UpdateRecurringItemMutationInput) => {
      const response = await updateRecurringTaskItemAction(
        recurringItemId,
        updates
      );
      return handleActionResponse<UpdateRecurringItemActionResponse>(response);
    },
    onMutate: async ({ recurringItemId, updates }) => {
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

          // Optimistically update the item in cache
          queryClient.setQueryData<RecurringTaskItem[]>(listKey, (old) => {
            if (!old) return old;
            return old.map((item) =>
              item.id === recurringItemId
                ? ({ ...item, ...updates } as RecurringTaskItem)
                : item
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

      handleError.toast(error, 'Failed to update recurring task');
    },
    onSuccess: () => {
      // Invalidate recurring items queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItems.all });
      // Invalidate task queries as tasks may have been updated
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Recurring task updated successfully');
    },
  });
}
