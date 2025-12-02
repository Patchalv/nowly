'use client';

import { getOverdueTasksCountAction } from '@/app/actions/tasks/getOverdueTasksCountAction';
import { rolloverTasksAction } from '@/app/actions/tasks/rolloverTasksAction';
import { CACHE } from '@/src/config/constants';
import { queryKeys } from '@/src/config/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useOverdueTasks() {
  const queryClient = useQueryClient();

  // Query to fetch overdue tasks count
  const query = useQuery({
    queryKey: queryKeys.overdue.count,
    queryFn: async () => {
      const result = await getOverdueTasksCountAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch overdue tasks count');
      }
      return result.count;
    },
    staleTime: CACHE.TASKS_STALE_TIME_MS,
  });

  // Mutation to rollover tasks
  const rolloverMutation = useMutation({
    mutationFn: async () => {
      const result = await rolloverTasksAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to rollover tasks');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate overdue count query
      queryClient.invalidateQueries({ queryKey: queryKeys.overdue.count });
      // Invalidate all task queries to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Tasks rolled over to today');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to rollover tasks'
      );
    },
  });

  return {
    overdueCount: query.data ?? 0,
    isLoading: query.isLoading,
    rolloverAll: () => rolloverMutation.mutate(),
    isRollingOver: rolloverMutation.isPending,
  };
}
