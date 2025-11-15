import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { logger } from '@sentry/nextjs';
import { MutateTaskResponse } from './types';

export async function toggleTaskCompleted(
  taskId: string,
  userId: string,
  repository: ITaskRepository
): Promise<MutateTaskResponse> {
  try {
    // Business logic: Validate task exists
    const existingTask = await repository.findById(taskId);
    if (!existingTask || existingTask.userId !== userId) {
      logger.error('Task not found', { taskId });
      return {
        success: false,
        error: 'Task not found',
      };
    }

    const isCompleted = !existingTask.completed;

    // Update the task
    const task = await repository.update(taskId, {
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : null,
    });

    return { success: true, task };
  } catch (error) {
    logger.error('Update task error', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    };
  }
}
