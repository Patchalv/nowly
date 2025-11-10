'use client';

import { createTaskAction } from '@/app/actions/tasks/createTaskAction';
import { deleteTaskAction } from '@/app/actions/tasks/deleteTaskAction';
import { getTasksByWeekAction } from '@/app/actions/tasks/getTasksAction';
import { updateTaskAction } from '@/app/actions/tasks/updateTaskAction';
import { queryKeys } from '@/src/config/query-keys';
import type { Task } from '@/src/domain/model/Task';
import { handleError } from '@/src/shared/errors/handler';
import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWeeks, isSameDay, startOfWeek } from 'date-fns';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  CreateTaskActionResponse,
  CreateTaskMutationInput,
  DeleteTaskActionResponse,
  DeleteTaskMutationInput,
  UpdateTaskActionResponse,
  UpdateTaskMutationInput,
} from './types';
import { ServerActionError, handleActionResponse } from './utils';

/**
 * Hook for creating a new task
 *
 * @returns Mutation object with methods to create a task
 * @example
 * ```tsx
 * const createTask = useCreateTask();
 *
 * const handleSubmit = async (formData: FormData) => {
 *   createTask.mutate(formData);
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Automatically invalidates task queries on success
 * - Field errors are accessible via `error.fieldErrors` in the error object
 * - Errors are logged to Sentry via centralized error handling
 */
export function useCreateTask(): UseMutationResult<
  CreateTaskActionResponse,
  ServerActionError,
  CreateTaskMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await createTaskAction(formData);
      return handleActionResponse<CreateTaskActionResponse>(response);
    },
    onMutate: async (formData) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Extract scheduledDate from FormData for optimistic update
      const scheduledDateStr = formData.get('scheduledDate');
      const scheduledDate = scheduledDateStr
        ? new Date(scheduledDateStr as string)
        : null;

      // Snapshot previous values
      const previousQueries = new Map();

      // If we have a scheduled date, snapshot that query
      if (scheduledDate) {
        const dateKey = queryKeys.tasks.byDate(scheduledDate.toISOString());
        const previousData = queryClient.getQueryData(dateKey);
        previousQueries.set(dateKey, previousData);

        // Optimistically add task to cache
        queryClient.setQueryData<{ success: boolean; tasks?: Task[] }>(
          dateKey,
          (old) => {
            if (!old || !old.success) return old;

            // Create optimistic task (will be replaced by server response)
            const optimisticTask: Task = {
              id: `temp-${Date.now()}`,
              userId: '', // Will be set by server
              title: (formData.get('title') as string) || '',
              description: null,
              scheduledDate,
              dueDate: null,
              completed: false,
              completedAt: null,
              categoryId: null,
              priority: null,
              dailySection: null,
              bonusSection: null,
              position: 'a0',
              recurringItemId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            return {
              ...old,
              tasks: [...(old.tasks || []), optimisticTask],
            };
          }
        );
      }

      return { previousQueries };
    },
    onError: (error, _formData, context) => {
      // Rollback optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach((previousData, queryKey) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }

      // Show error toast with centralized error handling
      handleError.toast(error, 'Failed to create task');
    },
    onSuccess: () => {
      // Invalidate all task queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task created successfully');
    },
  });
}

/**
 * Hook for updating a task (toggle completion, edit title, change date, etc.)
 *
 * @returns Mutation object with methods to update a task
 * @example
 * ```tsx
 * const updateTask = useUpdateTask();
 *
 * const handleToggle = (taskId: string) => {
 *   updateTask.mutate({
 *     taskId,
 *     updates: { completed: true }
 *   });
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Handles scheduledDate changes by moving tasks between date queries
 * - Automatically invalidates task queries on success
 * - Field errors are accessible via `error.fieldErrors` in the error object
 * - Errors are logged to Sentry via centralized error handling
 */
export function useUpdateTask(): UseMutationResult<
  UpdateTaskActionResponse,
  ServerActionError,
  UpdateTaskMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }: UpdateTaskMutationInput) => {
      const response = await updateTaskAction(taskId, updates);
      return handleActionResponse<UpdateTaskActionResponse>(response);
    },
    onMutate: async ({ taskId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Find the task in cache to get its current scheduledDate
      let currentTask: Task | null = null;
      let currentDateKey: string | null = null;

      // Search through all date queries to find the task
      const allQueries = queryClient.getQueryCache().getAll();
      for (const query of allQueries) {
        const queryKey = query.queryKey;
        if (
          Array.isArray(queryKey) &&
          queryKey[0] === 'tasks' &&
          queryKey[1] === 'date'
        ) {
          const data = queryClient.getQueryData<{
            success: boolean;
            tasks?: Task[];
          }>(queryKey);
          if (data?.success && data.tasks) {
            const task = data.tasks.find((t) => t.id === taskId);
            if (task) {
              currentTask = task;
              currentDateKey = queryKey.join('-');
              break;
            }
          }
        }
      }

      // Snapshot previous values
      const previousQueries = new Map();

      if (currentTask && currentDateKey) {
        // Get the date key array
        const dateKeyArray = currentDateKey.split('-');
        const dateKey = [
          dateKeyArray[0],
          dateKeyArray[1],
          dateKeyArray[2],
        ] as const;

        // Snapshot current query
        const previousData = queryClient.getQueryData(dateKey);
        previousQueries.set(dateKey, previousData);

        // Check if scheduledDate is changing
        const newScheduledDate =
          updates.scheduledDate ?? currentTask.scheduledDate;
        const scheduledDateChanged =
          newScheduledDate?.getTime() !== currentTask.scheduledDate?.getTime();

        if (scheduledDateChanged && newScheduledDate) {
          // Task is moving to a different date - remove from old, add to new
          const newDateKey = queryKeys.tasks.byDate(
            newScheduledDate.toISOString()
          );

          // Remove from old date query
          queryClient.setQueryData<{ success: boolean; tasks?: Task[] }>(
            dateKey,
            (old) => {
              if (!old || !old.success) return old;
              return {
                ...old,
                tasks: (old.tasks || []).filter((t) => t.id !== taskId),
              };
            }
          );

          // Snapshot new date query
          const newPreviousData = queryClient.getQueryData(newDateKey);
          previousQueries.set(newDateKey, newPreviousData);

          // Add to new date query
          queryClient.setQueryData<{ success: boolean; tasks?: Task[] }>(
            newDateKey,
            (old) => {
              if (!old || !old.success) {
                if (!currentTask) return old;
                return {
                  success: true,
                  tasks: [
                    {
                      ...currentTask,
                      ...updates,
                      scheduledDate: newScheduledDate,
                    },
                  ],
                };
              }
              if (!currentTask) return old;
              return {
                ...old,
                tasks: [
                  ...(old.tasks || []),
                  {
                    ...currentTask,
                    ...updates,
                    scheduledDate: newScheduledDate,
                  },
                ],
              };
            }
          );
        } else {
          // Update in place
          queryClient.setQueryData<{ success: boolean; tasks?: Task[] }>(
            dateKey,
            (old) => {
              if (!old || !old.success) return old;
              return {
                ...old,
                tasks: (old.tasks || []).map((t) =>
                  t.id === taskId ? { ...t, ...updates } : t
                ),
              };
            }
          );
        }
      }

      return { previousQueries, currentTask };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach((previousData, queryKey) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }

      // Show error toast with centralized error handling
      handleError.toast(error, 'Failed to update task');
    },
    onSuccess: () => {
      // Invalidate all task queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task updated successfully');
    },
  });
}

/**
 * Hook for deleting a task
 *
 * @returns Mutation object with methods to delete a task
 * @example
 * ```tsx
 * const deleteTask = useDeleteTask();
 *
 * const handleDelete = (taskId: string) => {
 *   deleteTask.mutate(taskId);
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Removes task from all date queries optimistically
 * - Automatically invalidates task queries on success
 * - Errors are logged to Sentry via centralized error handling
 */
export function useDeleteTask(): UseMutationResult<
  DeleteTaskActionResponse,
  ServerActionError,
  DeleteTaskMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await deleteTaskAction(taskId);
      return handleActionResponse<DeleteTaskActionResponse>(response);
    },
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Find and remove task from all date queries
      const previousQueries = new Map();
      const allQueries = queryClient.getQueryCache().getAll();

      for (const query of allQueries) {
        const queryKey = query.queryKey;
        if (
          Array.isArray(queryKey) &&
          queryKey[0] === 'tasks' &&
          queryKey[1] === 'date'
        ) {
          const data = queryClient.getQueryData<{
            success: boolean;
            tasks?: Task[];
          }>(queryKey);
          if (data?.success && data.tasks?.some((t) => t.id === taskId)) {
            // Snapshot this query
            previousQueries.set(queryKey, data);

            // Optimistically remove task
            queryClient.setQueryData<{ success: boolean; tasks?: Task[] }>(
              queryKey,
              (old) => {
                if (!old || !old.success) return old;
                return {
                  ...old,
                  tasks: (old.tasks || []).filter((t) => t.id !== taskId),
                };
              }
            );
          }
        }
      }

      return { previousQueries };
    },
    onError: (error, _taskId, context) => {
      // Rollback optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach((previousData, queryKey) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }

      // Show error toast with centralized error handling
      handleError.toast(error, 'Failed to delete task');
    },
    onSuccess: () => {
      // Invalidate all task queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task deleted successfully');
    },
  });
}

/**
 * Fetch tasks for the week containing the given date
 * Also prefetches adjacent weeks in the background
 */
export function useTasksByWeek(date: Date) {
  const queryClient = useQueryClient();

  // Main query: Fetch current week
  const query = useQuery({
    queryKey: queryKeys.tasks.byWeek(date),
    queryFn: async () => {
      const response = await getTasksByWeekAction(date);
      if (!response.success) {
        handleError.throw(response.error || 'Failed to fetch tasks');
      }
      return response.tasks || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Prefetch adjacent weeks
  useEffect(() => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const previousWeek = addWeeks(weekStart, -1);
    const nextWeek = addWeeks(weekStart, 1);

    // Prefetch previous week
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.byWeek(previousWeek),
      queryFn: async () => {
        const response = await getTasksByWeekAction(previousWeek);
        if (!response.success) throw new Error(response.error);
        return response.tasks || [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch next week
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.byWeek(nextWeek),
      queryFn: async () => {
        const response = await getTasksByWeekAction(nextWeek);
        if (!response.success) throw new Error(response.error);
        return response.tasks || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [date, queryClient]);

  return query;
}

/**
 * Filter tasks from weekly data for a specific date
 * This is used for client-side filtering - no additional fetch needed
 */
export function useTasksByDate(date: Date) {
  const { data: weeklyTasks, ...query } = useTasksByWeek(date);

  // Filter tasks for the specific date
  const tasksForDate = useMemo(() => {
    if (!weeklyTasks) return [];

    return weeklyTasks.filter((task) => {
      if (!task.scheduledDate) return false;
      return isSameDay(task.scheduledDate, date);
    });
  }, [weeklyTasks, date]);

  return {
    data: tasksForDate,
    ...query,
  };
}
