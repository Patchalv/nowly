import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import * as Sentry from '@sentry/nextjs';
import { ListTasksResponse } from './types';

export async function findOverdueTasks(
  userId: string,
  beforeDate: Date,
  repository: ITaskRepository
): Promise<ListTasksResponse> {
  const { logger } = Sentry;
  try {
    logger.info('Finding overdue tasks', { userId, beforeDate });
    const tasks = await repository.findOverdueTasks(userId, beforeDate);

    return { success: true, tasks };
  } catch (error) {
    logger.error('Find overdue tasks error', { error });
    return {
      success: false,
      tasks: [],
      error:
        error instanceof Error ? error.message : 'Failed to find overdue tasks',
    };
  }
}
