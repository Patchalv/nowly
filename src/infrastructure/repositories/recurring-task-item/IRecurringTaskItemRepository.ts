import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import type {
  CreateRecurringTaskItemInput,
  UpdateRecurringTaskItemInput,
} from '@/src/domain/validation/recurring/recurringTaskItem.schema';

export interface IRecurringTaskItemRepository {
  /**
   * Create a new recurring task item
   * Generates RRULE string from frequency configuration
   */
  create(
    userId: string,
    input: CreateRecurringTaskItemInput
  ): Promise<RecurringTaskItem>;

  /**
   * Find a recurring task item by ID
   */
  getById(id: string): Promise<RecurringTaskItem | null>;

  /**
   * Find all recurring task items for a user
   * @param userId - The user's ID
   * @param activeOnly - If true, only return active items (default: false)
   */
  getByUserId(
    userId: string,
    activeOnly?: boolean
  ): Promise<RecurringTaskItem[]>;

  /**
   * Update a recurring task item
   */
  update(
    id: string,
    input: UpdateRecurringTaskItemInput
  ): Promise<RecurringTaskItem>;

  /**
   * Delete a recurring task item
   */
  delete(id: string): Promise<void>;

  /**
   * Update the last generated date for a recurring task item
   * Used after generating tasks to track progress
   * @param date - The date to set, or null to reset generation state
   */
  updateLastGeneratedDate(id: string, date: Date | null): Promise<void>;

  /**
   * Get all active items that need task generation
   * Returns items where:
   * - is_active = true
   * - last_generated_date is null OR last_generated_date < today
   */
  getItemsNeedingGeneration(userId: string): Promise<RecurringTaskItem[]>;
}
