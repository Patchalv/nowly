// src/application/tasks/updateTask.usecase.ts
import type { Task } from '@/src/domain/model/Task';
import type { UpdateTaskInput } from '@/src/domain/validation/task/task.schema';
import type { ITaskRepository } from '@/src/infrastructure/repositories/ITaskRepository';
import { logger } from '@sentry/nextjs';

export interface UpdateTaskResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export async function updateTask(
  taskId: string,
  updates: UpdateTaskInput,
  repository: ITaskRepository
): Promise<UpdateTaskResponse> {
  try {
    // Business logic: Validate task exists
    const existingTask = await repository.findById(taskId);
    if (!existingTask) {
      logger.error('Task not found', { taskId });
      return {
        success: false,
        error: 'Task not found',
      };
    }

    // Update the task
    const task = await repository.update(taskId, updates);

    return { success: true, task };
  } catch (error) {
    logger.error('Update task error', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    };
  }
}
