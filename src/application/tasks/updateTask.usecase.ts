import type { Task } from '@/src/domain/model/Task';
import type { UpdateTaskInput } from '@/src/domain/validation/task/task.schema';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { logger } from '@sentry/nextjs';
import { MutateTaskResponse } from './types';

export async function updateTask(
  taskId: string,
  userId: string,
  updates: UpdateTaskInput,
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

    function getCompletedAt(existingTask: Task, updates: UpdateTaskInput) {
      if (updates.completed === undefined) return existingTask.completedAt;

      const wasAlreadyCompleted = existingTask.completed;
      const hasNowBeenCompleted =
        updates.completed === true && !wasAlreadyCompleted;
      const hasNowBeenUncompleted =
        updates.completed === false && wasAlreadyCompleted;

      if (hasNowBeenCompleted) return new Date();
      if (hasNowBeenUncompleted) return null;
      return existingTask.completedAt;
    }

    const updatesData = {
      ...updates,
      completedAt: getCompletedAt(existingTask, updates),
    };

    // Update the task
    const task = await repository.update(taskId, updatesData);

    return { success: true, task };
  } catch (error) {
    logger.error('Update task error', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    };
  }
}
