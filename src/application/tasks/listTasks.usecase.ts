// src/application/tasks/listTasks.usecase.ts
import type { Task } from '@/src/domain/model/Task';
import type { ITaskRepository } from '@/src/infrastructure/repositories/ITaskRepository';
import { logger } from '@sentry/nextjs';

export interface ListTasksResponse {
  success: boolean;
  tasks?: Task[];
  error?: string;
}

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
