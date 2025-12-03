import type { CreateRecurringTaskItemInput } from '@/src/domain/validation/recurring/recurringTaskItem.schema';
import type { IRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/IRecurringTaskItemRepository';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { generateTasksFromRecurringItem } from '@/src/infrastructure/services/taskGenerationService';
import { logger } from '@sentry/nextjs';
import { MutateRecurringTaskItemResponse } from './types';

/**
 * Creates a new recurring task item and generates initial tasks.
 *
 * This use case:
 * 1. Creates the recurring item via repository
 * 2. Generates initial batch of tasks based on frequency limits
 * 3. Inserts generated tasks via taskRepository.createBatch
 * 4. Updates lastGeneratedDate on the recurring item
 *
 * @param input - The input data for creating the recurring task item
 * @param userId - The ID of the user creating the item
 * @param recurringRepository - Repository for recurring task items
 * @param taskRepository - Repository for tasks
 * @returns Response with the created recurring item and generated tasks
 */
export async function createRecurringTaskItem(
  input: CreateRecurringTaskItemInput,
  userId: string,
  recurringRepository: IRecurringTaskItemRepository,
  taskRepository: ITaskRepository
): Promise<MutateRecurringTaskItemResponse> {
  try {
    // Create the recurring item via repository
    const recurringItem = await recurringRepository.create(userId, input);

    // Generate initial tasks starting from startDate
    const fromDate = recurringItem.startDate;
    const existingDates = new Set<string>(); // No existing tasks yet

    const tasksToCreate = generateTasksFromRecurringItem(
      recurringItem,
      fromDate,
      existingDates
    );

    let generatedTasks: MutateRecurringTaskItemResponse['generatedTasks'] = [];

    if (tasksToCreate.length > 0) {
      // Insert generated tasks in batch
      generatedTasks = await taskRepository.createBatch(tasksToCreate);

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

    return {
      success: true,
      recurringItem,
      generatedTasks,
    };
  } catch (error) {
    logger.error('Create recurring task item error', { error });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create recurring task item',
    };
  }
}
