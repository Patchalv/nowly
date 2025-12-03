import type { UpdateRecurringTaskItemInput } from '@/src/domain/validation/recurring/recurringTaskItem.schema';
import type { IRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/IRecurringTaskItemRepository';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { logger } from '@sentry/nextjs';
import { MutateRecurringTaskItemResponse } from './types';

/**
 * Updates a recurring task item.
 *
 * This use case:
 * 1. Verifies the recurring item exists and belongs to the user
 * 2. Updates the recurring item via repository
 * 3. If isActive is changed to false, cleans up future uncompleted tasks
 *
 * @param recurringItemId - The ID of the recurring item to update
 * @param userId - The ID of the user performing the update
 * @param updates - The fields to update
 * @param recurringRepository - Repository for recurring task items
 * @param taskRepository - Repository for tasks
 * @returns Response with the updated recurring item
 */
export async function updateRecurringTaskItem(
  recurringItemId: string,
  userId: string,
  updates: UpdateRecurringTaskItemInput,
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

    // Check if isActive is being changed to false
    const isDeactivating =
      updates.isActive === false && existingItem.isActive === true;

    // Update the recurring item
    const updatedItem = await recurringRepository.update(
      recurringItemId,
      updates
    );

    // If deactivating, clean up future uncompleted tasks
    if (isDeactivating) {
      await taskRepository.deleteUncompletedByRecurringItemId(recurringItemId);
    }

    return {
      success: true,
      recurringItem: updatedItem,
    };
  } catch (error) {
    logger.error('Update recurring task item error', { error });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update recurring task item',
    };
  }
}
