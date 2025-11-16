import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { logger } from '@sentry/nextjs';
import { MutateTaskResponse } from './types';

/**
 * Reorder a task by updating its position.
 * This use case is specifically for drag-and-drop reordering operations.
 *
 * @param taskId - ID of the task to reorder
 * @param newPosition - New lexorank position for the task
 * @param userId - User ID to validate ownership
 * @param repository - Task repository
 * @returns Promise with success/error response and updated task
 */
export async function reorderTask(
  taskId: string,
  newPosition: string,
  userId: string,
  repository: ITaskRepository
): Promise<MutateTaskResponse> {
  try {
    // Validate task exists and belongs to user
    const existingTask = await repository.findById(taskId);
    if (!existingTask || existingTask.userId !== userId) {
      logger.error('Task not found or unauthorized', { taskId, userId });
      return {
        success: false,
        error: 'Task not found',
      };
    }

    // Update task with new position
    const task = await repository.update(taskId, { position: newPosition });

    return { success: true, task };
  } catch (error) {
    logger.error('Reorder task error', { error, taskId, newPosition });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder task',
    };
  }
}
