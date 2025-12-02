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
  priority: TaskPriority;
  dailySection: DailySection | null;
  bonusSection: BonusSection | null;

  // Recurrence configuration
  frequency: RecurringFrequency;
  rruleString: string;

  // Schedule boundaries
  startDate: Date;
  endDate: Date | null;
  dueOffsetDays: number;

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
 * Input for creating a new recurring task item
 */
export interface CreateRecurringTaskItemInput {
  title: string;
  description?: string;
  categoryId?: string;
  priority?: TaskPriority;
  dailySection?: DailySection;
  bonusSection?: BonusSection;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  dueOffsetDays?: number;

  // Frequency-specific configuration
  weeklyDays?: number[]; // 0-6, Sunday = 0 (for weekly frequency)
  monthlyDay?: number; // 1-31 (for monthly frequency)
  yearlyMonth?: number; // 1-12 (for yearly frequency)
  yearlyDay?: number; // 1-31 (for yearly frequency)
}

/**
 * Input for updating an existing recurring task item
 * Note: frequency and rrule cannot be changed after creation
 */
export interface UpdateRecurringTaskItemInput {
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  priority?: TaskPriority;
  dailySection?: DailySection | null;
  bonusSection?: BonusSection | null;
  endDate?: Date | null;
  isActive?: boolean;
}
