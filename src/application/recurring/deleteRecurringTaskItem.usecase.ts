import type { IRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/IRecurringTaskItemRepository';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { logger } from '@sentry/nextjs';
import { MutateRecurringTaskItemResponse } from './types';

/**
 * Deletes a recurring task item and its uncompleted tasks.
 *
 * This use case:
 * 1. Verifies the recurring item exists and belongs to the user
 * 2. Deletes all uncompleted tasks linked to the recurring item
 * 3. Deletes the recurring item itself
 *
 * @param recurringItemId - The ID of the recurring item to delete
 * @param userId - The ID of the user performing the deletion
 * @param recurringRepository - Repository for recurring task items
 * @param taskRepository - Repository for tasks
 * @returns Response indicating success or failure
 */
export async function deleteRecurringTaskItem(
  recurringItemId: string,
  userId: string,
  recurringRepository: IRecurringTaskItemRepository,
  taskRepository: ITaskRepository
): Promise<MutateRecurringTaskItemResponse> {
  try {
    // Verify recurring item exists and belongs to user
    const existingItem = await recurringRepository.getById(recurringItemId);

    if (!existingItem) {
      logger.error('Recurring task item not found', { recurringItemId });
      return { success: false, error: 'Recurring task item not found' };
    }

    if (existingItem.userId !== userId) {
      logger.error('Recurring task item does not belong to user', {
        recurringItemId,
        userId,
      });
      return { success: false, error: 'Recurring task item not found' };
    }

    // Delete all uncompleted tasks linked to this recurring item
    await taskRepository.deleteUncompletedByRecurringItemId(recurringItemId);

    // Delete the recurring item itself
    await recurringRepository.delete(recurringItemId);

    return { success: true };
  } catch (error) {
    logger.error('Delete recurring task item error', { error });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete recurring task item',
    };
  }
}
