import type { CreateTaskInput } from '@/src/domain/validation/task/task.schema';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { generatePositionForNewTask } from '@/src/infrastructure/utils/position';
import { logger } from '@sentry/nextjs';
import { LexoRank } from 'lexorank';
import { MutateTaskResponse } from './types';

export async function createTask(
  input: CreateTaskInput,
  userId: string,
  repository: ITaskRepository
): Promise<MutateTaskResponse> {
  try {
    // Generate position for the new task, scoped per user+date
    // If scheduledDate is null, we can't query by date, so use min position
    const scheduledDate = input.scheduledDate ?? null;
    const position =
      scheduledDate !== null
        ? await generatePositionForNewTask(userId, scheduledDate, repository)
        : LexoRank.min().toString();

    // Business logic: Set default values for fields not in Phase 1
    const task = await repository.create({
      title: input.title,
      userId,
      scheduledDate,
      description: null,
      dueDate: null,
      completed: false,
      completedAt: null,
      categoryId: input.categoryId ?? null,
      priority: input.priority ?? null,
      dailySection: null,
      bonusSection: null,
      position,
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
