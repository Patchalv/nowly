import { Task } from '@/src/domain/model/Task';
import { RecurringTaskItem } from '@/src/domain/types/recurring';

/**
 * Response type for mutations on recurring task items (create, update, delete)
 */
export interface MutateRecurringTaskItemResponse {
  success: boolean;
  recurringItem?: RecurringTaskItem;
  generatedTasks?: Task[];
  error?: string;
}

/**
 * Response type for listing recurring task items
 */
export interface ListRecurringTaskItemsResponse {
  success: boolean;
  recurringItems?: RecurringTaskItem[];
  error?: string;
}

/**
 * Response type for ensuring tasks are generated
 */
export interface EnsureTasksGeneratedResponse {
  success: boolean;
  generatedTasks?: Task[];
  error?: string;
}
