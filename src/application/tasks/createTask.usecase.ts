// src/application/tasks/createTask.usecase.ts
import type { Task } from '@/src/domain/model/Task';
import type { CreateTaskInput } from '@/src/domain/validation/task/task.schema';
import type { ITaskRepository } from '@/src/infrastructure/repositories/ITaskRepository';
import { logger } from '@sentry/nextjs';

export interface CreateTaskResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export async function createTask(
  input: CreateTaskInput,
  userId: string,
  repository: ITaskRepository
): Promise<CreateTaskResponse> {
  try {
    // Business logic: Set default values for fields not in Phase 1
    const task = await repository.create({
      title: input.title,
      userId,
      scheduledDate: input.scheduledDate ?? null,
      description: null,
      dueDate: null,
      completed: false,
      completedAt: null,
      categoryId: null,
      priority: null,
      dailySection: null,
      bonusSection: null,
      position: 'a0', // Default lexorank position
      recurringItemId: null,
    });

    return { success: true, task };
  } catch (error) {
    logger.error('Create task error', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    };
  }
}
