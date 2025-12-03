import type { IRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/IRecurringTaskItemRepository';
import { logger } from '@sentry/nextjs';
import { ListRecurringTaskItemsResponse } from './types';

/**
 * Lists all recurring task items for a user.
 *
 * @param userId - The ID of the user
 * @param activeOnly - If true, only return active items (default: false)
 * @param repository - Repository for recurring task items
 * @returns Response with the list of recurring items
 */
export async function listRecurringTaskItems(
  userId: string,
  activeOnly: boolean,
  repository: IRecurringTaskItemRepository
): Promise<ListRecurringTaskItemsResponse> {
  try {
    const recurringItems = await repository.getByUserId(userId, activeOnly);

    return {
      success: true,
      recurringItems,
    };
  } catch (error) {
    logger.error('List recurring task items error', { error });
    return {
      success: false,
      recurringItems: [],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch recurring task items',
    };
  }
}
