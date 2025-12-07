'use client';

import { createTaskAction } from '@/app/actions/tasks/createTaskAction';
import { deleteTaskAction } from '@/app/actions/tasks/deleteTaskAction';
import {
  getTasksByWeekAction,
  listTasksAction,
} from '@/app/actions/tasks/getTasksAction';
import { reorderTaskAction } from '@/app/actions/tasks/reorderTaskAction';
import { toggleTaskCompletedAction } from '@/app/actions/tasks/toggleTaskCompletedAction';
import { updateTaskAction } from '@/app/actions/tasks/updateTaskAction';
import { CACHE, PAGINATION } from '@/src/config/constants';
import { queryKeys } from '@/src/config/query-keys';
import type { Task } from '@/src/domain/model/Task';
import { handleError } from '@/src/shared/errors/handler';
import type { UseMutationResult } from '@tanstack/react-query';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { addWeeks, isSameDay, isSameWeek, startOfWeek } from 'date-fns';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  CreateTaskActionResponse,
  CreateTaskMutationInput,
  DeleteTaskActionResponse,
  DeleteTaskMutationInput,
  ReorderTaskActionResponse,
  ReorderTaskMutationInput,
  TaskFilters,
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
      const previousQueries = context?.previousQueries;
      if (previousQueries && previousQueries.size > 0) {
        previousQueries.forEach((_previousData, queryKeyStr) => {
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
      const previousQueries = context?.previousQueries;
      if (previousQueries && previousQueries.size > 0) {
        previousQueries.forEach((_previousData, queryKeyStr) => {
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
 * Hook for toggling a task's completion status
 *
 * @returns Mutation object with methods to update a task completion status
 * @example
 * ```tsx
 * const toggleTaskCompleted = useToggleTaskCompleted();
 *
 * const handleToggle = (taskId: string) => {
 *   toggleTaskCompleted.mutate(taskId);
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Automatically invalidates task queries on success
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
          return old.map((t) => {
            if (t.id !== taskId) return t;
            const isCompleted = !t.completed;
            return {
              ...t,
              completed: isCompleted,
              // Adjust this rule if the server uses a different strategy
              completedAt: isCompleted ? new Date() : null,
            };
          });
        });
      }

      return { previousQueries, currentTask };
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
      const previousQueries = context?.previousQueries;
      const hasRecurringItem = context?.currentTask?.recurringItemId;

      // If the task has a recurring item, invalidate all tasks
      // to pick up newly generated tasks from the recurring item
      if (hasRecurringItem) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      } else if (previousQueries && previousQueries.size > 0) {
        previousQueries.forEach((_previousData, queryKeyStr) => {
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
 * Hook for reordering a task by updating its position
 *
 * @returns Mutation object with methods to reorder a task
 * @example
 * ```tsx
 * const reorderTask = useReorderTask();
 *
 * const handleDragEnd = (taskId: string, newPosition: string) => {
 *   reorderTask.mutate({ taskId, newPosition });
 * };
 * ```
 *
 * @remarks
 * - Uses optimistic updates for instant UI feedback
 * - Updates task position in weekly cache immediately
 * - Automatically invalidates task queries on success
 * - Errors are logged to Sentry via centralized error handling
 */
export function useReorderTask(): UseMutationResult<
  ReorderTaskActionResponse,
  ServerActionError,
  ReorderTaskMutationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, newPosition }: ReorderTaskMutationInput) => {
      const response = await reorderTaskAction(taskId, newPosition);
      return handleActionResponse<ReorderTaskActionResponse>(response);
    },
    onMutate: async ({ taskId, newPosition }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Find the task in weekly cache
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

        // Optimistically update task position in cache
        queryClient.setQueryData<Task[]>(currentWeekKey, (old) => {
          if (!old) return old;
          return old.map((t) =>
            t.id === taskId ? { ...t, position: newPosition } : t
          );
        });
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
      handleError.toast(error, 'Failed to reorder task');
    },
    onSuccess: () => {
      // No invalidation needed - optimistic update is already correct
      // Cache will naturally expire based on staleTime configuration
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
    staleTime: CACHE.TASKS_STALE_TIME_MS,
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
        return response.tasks || [];
      },
      staleTime: CACHE.TASKS_STALE_TIME_MS,
    });

    // Prefetch next week
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.byWeek(nextWeek),
      queryFn: async () => {
        const response = await getTasksByWeekAction(nextWeek);
        return response.tasks || [];
      },
      staleTime: CACHE.TASKS_STALE_TIME_MS,
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

export function useTasks(filters: TaskFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: async ({ pageParam }) => {
      // Convert 0-based page param to 1-based for repository
      const repositoryPage = (pageParam as number) + 1;
      const response = await listTasksAction(filters, repositoryPage);
      if (!response.success) {
        const errorMessage =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || 'Failed to fetch tasks';
        throw new Error(errorMessage);
      }
      // TypeScript narrows to success response after the check above
      const successResponse = response as {
        success: true;
        tasks?: Task[];
        total?: number;
      };
      return {
        tasks: successResponse.tasks || [],
        total: successResponse.total || 0,
      };
    },
    getNextPageParam: (lastPage, pages) => {
      // Calculate total items fetched so far
      const totalFetched = pages.length * PAGINATION.DEFAULT_PAGE_SIZE;
      // If we've fetched all items or the last page has fewer items, we're done
      if (
        totalFetched >= lastPage.total ||
        lastPage.tasks.length < PAGINATION.DEFAULT_PAGE_SIZE
      ) {
        return undefined;
      }
      // Return next 0-based page number
      return pages.length;
    },
    initialPageParam: 0,
  });
}
