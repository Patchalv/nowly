import type { BonusSection, DailySection, TaskPriority } from './tasks';

/**
 * Recurrence frequency options for recurring tasks
 */
export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'weekdays'
  | 'weekends';

/**
 * Domain model for a recurring task item (template for generating tasks)
 */
export interface RecurringTaskItem {
  id: string;
  userId: string;

  // Task template fields (copied to generated tasks)
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: TaskPriority | null;
  dailySection: DailySection | null;
  bonusSection: BonusSection | null;

  // Recurrence configuration
  frequency: RecurringFrequency;
  rruleString: string;

  // Schedule boundaries
  startDate: Date;
  endDate: Date | null;
  dueOffsetDays: number;

  // RRULE configuration parameters (stored for regeneration)
  weeklyDays?: number[]; // JavaScript native: 0=Sunday, 1=Monday, ..., 6=Saturday
  monthlyDay?: number; // 1-31
  yearlyMonth?: number; // 1-12
  yearlyDay?: number; // 1-31

  // Generation tracking
  lastGeneratedDate: Date | null;
  tasksToGenerateAhead: number;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input types for creating and updating recurring task items
 *
 * These types are inferred from Zod schemas to ensure type-schema alignment.
 * Import them from the validation layer:
 *
 * @example
 * import type { CreateRecurringTaskItemInput, UpdateRecurringTaskItemInput } from '@/src/domain/validation/recurring/recurringTaskItem.schema';
 */
