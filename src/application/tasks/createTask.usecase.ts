import { LexoRank } from 'lexorank';

import type { CreateTaskInput } from '@/src/domain/validation/task/task.schema';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { generatePositionForNewTask } from '@/src/infrastructure/utils/position';
import { logger } from '@/src/shared/logging';
import { MutateTaskResponse } from './types';

export async function createTask(
  input: CreateTaskInput,
  userId: string,
  repository: ITaskRepository
): Promise<MutateTaskResponse> {
  try {
    logger.debug('Creating task', {
      userId,
      title: input.title,
      hasScheduledDate: !!input.scheduledDate,
      categoryId: input.categoryId,
      priority: input.priority,
    });

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

    logger.info('Task created', {
      taskId: task.id,
      userId,
      categoryId: task.categoryId,
      hasScheduledDate: !!task.scheduledDate,
    });

    return { success: true, task };
  } catch (error) {
    logger.error('Create task failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      title: input.title,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    };
  }
}
