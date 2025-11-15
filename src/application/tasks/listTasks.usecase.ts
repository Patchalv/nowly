import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';
import { handleError } from '@/src/shared/errors';
import { logger } from '@sentry/nextjs';
import { endOfWeek, startOfWeek } from 'date-fns';
import { ListTasksInfiniteResponse, ListTasksResponse } from './types';

export async function listTasksByDate(
  userId: string,
  date: Date,
  repository: ITaskRepository
): Promise<ListTasksResponse> {
  try {
    logger.info('Listing tasks', { date });
    const tasks = await repository.findByUserIdAndDate(userId, date);

    return { success: true, tasks };
  } catch (error) {
    logger.error('List tasks error', { error });
    return {
      success: false,
      tasks: [],
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    };
  }
}

export async function listTasksByWeek(
  userId: string,
  date: Date,
  repository: ITaskRepository
): Promise<ListTasksResponse> {
  try {
    logger.info('Listing tasks', { date });
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    const tasks = await repository.findByUserIdAndDateRange(
      userId,
      weekStart,
      weekEnd
    );
    return { success: true, tasks };
  } catch (error) {
    const appError = handleError.silent(error);
    return {
      success: false,
      tasks: [],
      error: appError.message,
    };
  }
}
export async function findByUserIdAndFilters(
  userId: string,
  filters: TaskFilters,
  page: number,
  repository: ITaskRepository
): Promise<ListTasksInfiniteResponse> {
  try {
    logger.info('Finding tasks by user ID and filters', {
      userId,
      filters,
      page,
    });
    const tasks = await repository.findByUserIdAndFilters(
      userId,
      filters,
      page
    );
    return { success: true, tasks: tasks.tasks, total: tasks.total };
  } catch (error) {
    const appError = handleError.silent(error);
    return {
      success: false,
      tasks: [],
      total: 0,
      error: appError.message,
    };
  }
}
