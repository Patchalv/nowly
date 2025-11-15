// src/application/tasks/updateTask.usecase.ts
import type { Task } from '@/src/domain/model/Task';
import type { ITaskRepository } from '@/src/infrastructure/repositories/ITaskRepository';
import { logger } from '@sentry/nextjs';

export interface UpdateTaskResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export async function toggleTaskCompleted(
  taskId: string,
  userId: string,
  repository: ITaskRepository
): Promise<UpdateTaskResponse> {
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
