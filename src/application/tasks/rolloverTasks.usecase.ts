import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import * as Sentry from '@sentry/nextjs';
import { RolloverTasksResponse } from './types';

export async function rolloverTasks(
  userId: string,
  taskIds: string[],
  newDate: Date,
  repository: ITaskRepository
): Promise<RolloverTasksResponse> {
  const { logger } = Sentry;
  try {
    if (taskIds.length === 0) {
      logger.info('No tasks to rollover', { userId });
      return { success: true };
    }

    logger.info('Rolling over tasks', {
      userId,
      taskCount: taskIds.length,
      newDate,
    });

    // Validate that all tasks belong to the user
    const taskValidationPromises = taskIds.map((taskId) =>
      repository.findById(taskId)
    );
    const tasks = await Promise.all(taskValidationPromises);

    // Check if any task doesn't exist or doesn't belong to user
    const invalidTasks = tasks.filter((task) => {
      if (!task) return true;
      return task.userId !== userId;
    });

    if (invalidTasks.length > 0) {
      logger.error('Attempted to rollover tasks not belonging to user', {
        userId,
        invalidCount: invalidTasks.length,
      });
      return {
        success: false,
        error: 'Unauthorized: Some tasks do not belong to user',
      };
    }

    // Perform bulk update
    await repository.bulkUpdateScheduledDate(taskIds, newDate);

    logger.info('Tasks rolled over successfully', {
      userId,
      taskCount: taskIds.length,
    });

    return { success: true };
  } catch (error) {
    logger.error('Rollover tasks error', { error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to rollover tasks',
    };
  }
}
