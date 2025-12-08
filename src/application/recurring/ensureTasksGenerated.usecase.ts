import * as Sentry from '@sentry/nextjs';

import type { Task } from '@/src/domain/model/Task';
import type { IRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/IRecurringTaskItemRepository';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import {
  generateTasksFromRecurringItem,
  toDateKey,
} from '@/src/infrastructure/services/taskGenerationService';
import { EnsureTasksGeneratedResponse } from './types';

/**
 * Ensures tasks are generated for all active recurring items that need generation.
 *
 * This is the "lazy generation" logic called when viewing dates. It:
 * 1. Gets all recurring items needing generation for the user
 * 2. For each item, gets existing task dates to avoid duplicates
 * 3. Generates missing tasks using the task generation service
 * 4. Inserts generated tasks in batch
 * 5. Updates lastGeneratedDate for each processed item
 *
 * @param userId - The ID of the user
 * @param recurringRepository - Repository for recurring task items
 * @param taskRepository - Repository for tasks
 * @returns Response with all newly generated tasks
 */
export async function ensureTasksGenerated(
  userId: string,
  recurringRepository: IRecurringTaskItemRepository,
  taskRepository: ITaskRepository
): Promise<EnsureTasksGeneratedResponse> {
  const { logger } = Sentry;
  try {
    // Get all recurring items that need task generation
    const itemsNeedingGeneration =
      await recurringRepository.getItemsNeedingGeneration(userId);

    if (itemsNeedingGeneration.length === 0) {
      return { success: true, generatedTasks: [] };
    }

    const allGeneratedTasks: Task[] = [];

    // Process each recurring item
    for (const recurringItem of itemsNeedingGeneration) {
      // Get existing tasks for this recurring item
      const existingTasks = await taskRepository.getByRecurringItemId(
        recurringItem.id
      );

      // Build set of existing scheduled dates (YYYY-MM-DD format)
      const existingDates = new Set<string>(
        existingTasks
          .filter(
            (task): task is typeof task & { scheduledDate: Date } =>
              task.scheduledDate !== null
          )
          .map((task) => toDateKey(task.scheduledDate))
      );

      // Calculate fromDate: day after lastGeneratedDate, or startDate if null
      let fromDate: Date;
      if (recurringItem.lastGeneratedDate) {
        fromDate = new Date(recurringItem.lastGeneratedDate);
        fromDate.setDate(fromDate.getDate() + 1);
      } else {
        fromDate = recurringItem.startDate;
      }

      // Generate missing tasks
      const tasksToCreate = generateTasksFromRecurringItem(
        recurringItem,
        fromDate,
        existingDates
      );

      if (tasksToCreate.length > 0) {
        // Insert generated tasks in batch
        const createdTasks = await taskRepository.createBatch(tasksToCreate);
        allGeneratedTasks.push(...createdTasks);

        // Find the latest scheduled date from generated tasks
        const latestDate = tasksToCreate.reduce((latest, task) => {
          return task.scheduledDate > latest ? task.scheduledDate : latest;
        }, tasksToCreate[0].scheduledDate);

        // Update lastGeneratedDate on the recurring item
        await recurringRepository.updateLastGeneratedDate(
          recurringItem.id,
          latestDate
        );
      }
    }

    return {
      success: true,
      generatedTasks: allGeneratedTasks,
    };
  } catch (error) {
    logger.error('Ensure tasks generated error', { error });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to ensure tasks generated',
    };
  }
}
