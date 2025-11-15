import type { ITaskRepository } from '@/src/infrastructure/repositories/ITaskRepository';
import { logger } from '@sentry/nextjs';
import { MutateTaskResponse } from './types';

export async function deleteTask(
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

    // Delete the task
    await repository.delete(taskId);

    return { success: true };
  } catch (error) {
    logger.error('Delete task error', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    };
  }
}
