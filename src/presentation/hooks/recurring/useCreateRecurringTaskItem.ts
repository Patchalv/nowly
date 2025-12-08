'use client';

import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { createRecurringTaskItemAction } from '@/app/actions/recurring/createRecurringTaskItemAction';
import { queryKeys } from '@/src/config/query-keys';
import type { ServerActionError } from '@/src/presentation/hooks/tasks/utils';
import { handleActionResponse } from '@/src/presentation/hooks/tasks/utils';
import { handleError } from '@/src/shared/errors';
import type {
  CreateRecurringItemActionResponse,
  CreateRecurringItemMutationInput,
} from './types';

/**
 * Hook for creating a new recurring task item
 *
 * @returns Mutation object with methods to create a recurring item
 * @example
 * ```tsx
 * const createRecurringItem = useCreateRecurringTaskItem();
 *
 * const handleSubmit = async (formData: FormData) => {
 *   createRecurringItem.mutate(formData);
 * };
 * ```
 *
 * @remarks
 * - Automatically invalidates recurring items and task queries on success
 * - Field errors are accessible via `error.fieldErrors` in the error object
 * - Errors are logged to Sentry via centralized error handling
 */
export function useCreateRecurringTaskItem(): UseMutationResult<
  CreateRecurringItemActionResponse,
  ServerActionError,
  CreateRecurringItemMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await createRecurringTaskItemAction(formData);
      return handleActionResponse<CreateRecurringItemActionResponse>(response);
    },
    onError: (error) => {
      handleError.toast(error, 'Failed to create recurring task');
    },
    onSuccess: () => {
      // Invalidate recurring items queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.recurringItems.all,
        refetchType: 'active',
      });
      // Invalidate task queries as new tasks may have been generated
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all,
        refetchType: 'active',
      });
      // Invalidate overdue count as new tasks may affect overdue status
      queryClient.invalidateQueries({
        queryKey: queryKeys.overdue.count,
        refetchType: 'active',
      });
    },
  });
}
