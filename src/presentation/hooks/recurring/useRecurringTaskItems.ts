'use client';

import { getRecurringTaskItemsAction } from '@/app/actions/recurring/getRecurringTaskItemsAction';
import { CACHE } from '@/src/config/constants';
import { queryKeys } from '@/src/config/query-keys';
import { handleError } from '@/src/shared/errors';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook for fetching recurring task items
 *
 * @param activeOnly - If true, only returns active recurring items
 * @returns Query object with recurring task items data
 * @example
 * ```tsx
 * const { data: recurringItems, isLoading } = useRecurringTaskItems(true);
 * ```
 */
export function useRecurringTaskItems(activeOnly: boolean = false) {
  return useQuery({
    queryKey: queryKeys.recurringItems.list(activeOnly),
    queryFn: async () => {
      const response = await getRecurringTaskItemsAction(activeOnly);
      if (!response.success) {
        handleError.throw(response.error);
      }
      return response.recurringItems;
    },
    staleTime: CACHE.RECURRING_ITEMS_STALE_TIME_MS,
  });
}
