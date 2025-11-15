import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { handleError } from '@/src/shared/errors';
import { logger } from '@sentry/nextjs';
import { endOfWeek, startOfWeek } from 'date-fns';
import { ListTasksResponse } from './types';

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
    handleError.silent(error);
    return {
      success: false,
      tasks: [],
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    };
  }
}
