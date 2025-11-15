'use client';

import { createTaskAction } from '@/app/actions/tasks/createTaskAction';
import { deleteTaskAction } from '@/app/actions/tasks/deleteTaskAction';
import { getTasksByWeekAction } from '@/app/actions/tasks/getTasksAction';
import { toggleTaskCompletedAction } from '@/app/actions/tasks/toggleTaskCompletedAction';
import { updateTaskAction } from '@/app/actions/tasks/updateTaskAction';
import { queryKeys } from '@/src/config/query-keys';
import type { Task } from '@/src/domain/model/Task';
import { handleError } from '@/src/shared/errors/handler';
import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWeeks, isSameDay, isSameWeek, startOfWeek } from 'date-fns';
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

      // Snapshot previous values for rollback
      const previousQueries = new Map<string, Task[] | undefined>();

      // If we have a scheduled date, update the weekly cache
      if (scheduledDate) {
        const weekStart = startOfWeek(scheduledDate, { weekStartsOn: 1 });
        const weekKey = queryKeys.tasks.byWeek(weekStart);

        // Snapshot current week cache
        const previousData = queryClient.getQueryData<Task[]>(weekKey);
        previousQueries.set(JSON.stringify(weekKey), previousData);

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

        // Optimistically add task to weekly cache
        queryClient.setQueryData<Task[]>(weekKey, (old) => {
          return old ? [...old, optimisticTask] : [optimisticTask];
        });
      }

      return { previousQueries };
    },
    onError: (error, _formData, context) => {
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
      handleError.toast(error, 'Failed to create task');
    },
    onSuccess: (_data, _formData, context) => {
      // Invalidate affected week queries to refetch fresh data
      if (context?.previousQueries) {
        context.previousQueries.forEach((_previousData, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr) as readonly [
            'tasks',
            'week',
            string,
          ];
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // Fallback: invalidate all if no context
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
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

      // Find the task in weekly cache to get its current scheduledDate
      let currentTask: Task | null = null;
      let currentWeekKey: readonly ['tasks', 'week', string] | null = null;

      // Search through all weekly queries to find the task
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
            const task = data.find((t) => t.id === taskId);
            if (task) {
              currentTask = task;
              currentWeekKey = queryKey as unknown as readonly [
                'tasks',
                'week',
                string,
              ];
              break;
            }
          }
        }
      }

      // Snapshot previous values for rollback
      const previousQueries = new Map<string, Task[] | undefined>();

      if (currentTask && currentWeekKey) {
        // Snapshot current week cache
        const previousData = queryClient.getQueryData<Task[]>(currentWeekKey);
        previousQueries.set(JSON.stringify(currentWeekKey), previousData);

        // Check if scheduledDate is changing
        const newScheduledDate =
          updates.scheduledDate ?? currentTask.scheduledDate;
        const scheduledDateChanged =
          newScheduledDate?.getTime() !== currentTask.scheduledDate?.getTime();

        if (scheduledDateChanged && newScheduledDate) {
          // Task is moving to a different week - update both old and new week caches
          const oldWeekStart = startOfWeek(
            currentTask.scheduledDate || new Date(),
            { weekStartsOn: 1 }
          );
          const newWeekStart = startOfWeek(newScheduledDate, {
            weekStartsOn: 1,
          });
          const newWeekKey = queryKeys.tasks.byWeek(newWeekStart);

          // Check if moving to a different week
          const isDifferentWeek = !isSameWeek(oldWeekStart, newWeekStart, {
            weekStartsOn: 1,
          });

          if (isDifferentWeek) {
            // Snapshot new week cache
            const newPreviousData =
              queryClient.getQueryData<Task[]>(newWeekKey);
            previousQueries.set(JSON.stringify(newWeekKey), newPreviousData);

            // Remove from old week cache
            queryClient.setQueryData<Task[]>(currentWeekKey, (old) => {
              return old ? old.filter((t) => t.id !== taskId) : [];
            });

            // Add to new week cache
            queryClient.setQueryData<Task[]>(newWeekKey, (old) => {
              if (!currentTask) return old || [];
              const updatedTask = {
                ...currentTask,
                ...updates,
                scheduledDate: newScheduledDate,
              };
              return old ? [...old, updatedTask] : [updatedTask];
            });
          } else {
            // Same week, just update the task
            queryClient.setQueryData<Task[]>(currentWeekKey, (old) => {
              if (!old) return old;
              return old.map((t) =>
                t.id === taskId
                  ? { ...t, ...updates, scheduledDate: newScheduledDate }
                  : t
              );
            });
          }
        } else {
          // Update in place (no date change)
          queryClient.setQueryData<Task[]>(currentWeekKey, (old) => {
            if (!old) return old;
            return old.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
          });
        }
      }

      return { previousQueries, currentTask };
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
      handleError.toast(error, 'Failed to update task');
    },
    onSuccess: (_data, _variables, context) => {
      // Invalidate affected week queries to refetch fresh data
      if (context?.previousQueries) {
        context.previousQueries.forEach((_previousData, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr) as readonly [
            'tasks',
            'week',
            string,
          ];
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // Fallback: invalidate all if no context
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
      toast.success('Task updated successfully');
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
export function useToggleTaskCompleted(): UseMutationResult<
  UpdateTaskActionResponse,
  ServerActionError,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await toggleTaskCompletedAction(taskId);
      return handleActionResponse<UpdateTaskActionResponse>(response);
    },
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Find the task in weekly cache to get its current scheduledDate
      let currentTask: Task | null = null;
      let currentWeekKey: readonly ['tasks', 'week', string] | null = null;

      // Search through all weekly queries to find the task
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
            const task = data.find((t) => t.id === taskId);
            if (task) {
              currentTask = task;
              currentWeekKey = queryKey as unknown as readonly [
                'tasks',
                'week',
                string,
              ];
              break;
            }
          }
        }
      }

      // Snapshot previous values for rollback
      const previousQueries = new Map<string, Task[] | undefined>();

      if (currentTask && currentWeekKey) {
        // Snapshot current week cache
        const previousData = queryClient.getQueryData<Task[]>(currentWeekKey);
        previousQueries.set(JSON.stringify(currentWeekKey), previousData);
      }

      // Optimistically update the task
      if (currentWeekKey) {
        queryClient.setQueryData<Task[]>(currentWeekKey, (old) => {
          if (!old) return old;
          return old.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );
        });
      }

      return { previousQueries };
    },
    onError: (error, _taskId, context) => {
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
      handleError.toast(error, 'Failed to toggle task completion');
    },
    onSuccess: (_data, _taskId, context) => {
      // Invalidate affected week queries to refetch fresh data
      if (context?.previousQueries) {
        context.previousQueries.forEach((_previousData, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr) as readonly [
            'tasks',
            'week',
            string,
          ];
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // Fallback: invalidate all if no context
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
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

      // Find and remove task from all weekly queries
      const previousQueries = new Map<string, Task[] | undefined>();
      const allQueries = queryClient.getQueryCache().getAll();

      for (const query of allQueries) {
        const queryKey = query.queryKey;
        if (
          Array.isArray(queryKey) &&
          queryKey[0] === 'tasks' &&
          queryKey[1] === 'week'
        ) {
          const data = queryClient.getQueryData<Task[]>(queryKey);
          if (data?.some((t) => t.id === taskId)) {
            // Snapshot this query
            previousQueries.set(JSON.stringify(queryKey), data);

            // Optimistically remove task
            queryClient.setQueryData<Task[]>(queryKey, (old) => {
              return old ? old.filter((t) => t.id !== taskId) : [];
            });
          }
        }
      }

      return { previousQueries };
    },
    onError: (error, _taskId, context) => {
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
      handleError.toast(error, 'Failed to delete task');
    },
    onSuccess: (_data, _taskId, context) => {
      // Invalidate affected week queries to refetch fresh data
      if (context?.previousQueries) {
        context.previousQueries.forEach((_previousData, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr) as readonly [
            'tasks',
            'week',
            string,
          ];
          queryClient.invalidateQueries({ queryKey });
        });
      } else {
        // Fallback: invalidate all if no context
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
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
