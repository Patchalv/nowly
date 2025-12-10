import { RRule } from 'rrule';

import type {
  RecurringFrequency,
  RecurringTaskItem,
} from '@/src/domain/types/recurring';
import type {
  BonusSection,
  DailySection,
  TaskPriority,
} from '@/src/domain/types/tasks';
import { generateNextPosition } from '@/src/infrastructure/utils/position';

/**
 * Generation limits per frequency type (from PRD)
 * Controls how many tasks are generated ahead for each recurrence pattern
 */
export const GENERATION_LIMITS: Record<RecurringFrequency, number> = {
  daily: 15,
  weekdays: 15,
  weekends: 15,
  weekly: 8,
  monthly: 6,
  yearly: 2,
};

/**
 * Data structure for a generated task ready for repository insertion.
 * Omits id, createdAt, updatedAt as those are set by the database.
 */
export interface GeneratedTaskData {
  userId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: TaskPriority | null;
  dailySection: DailySection | null;
  bonusSection: BonusSection | null;
  scheduledDate: Date;
  dueDate: Date | null;
  recurringItemId: string;
  position: string;
  completed: boolean;
  completedAt: null;
}

/**
 * Converts a Date to an ISO date string (YYYY-MM-DD) for comparison.
 * Uses UTC to avoid timezone issues with date comparisons.
 */
export const toDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Calculates the due date based on scheduled date and offset days.
 *
 * @param scheduledDate - The scheduled date for the task
 * @param dueOffsetDays - Number of days after scheduled date for due date
 * @returns Due date or null if offset is 0
 */
function calculateDueDate(
  scheduledDate: Date,
  dueOffsetDays: number
): Date | null {
  if (dueOffsetDays <= 0) {
    return null;
  }

  const dueDate = new Date(scheduledDate);
  dueDate.setDate(dueDate.getDate() + dueOffsetDays);
  return dueDate;
}

/**
 * Generates task instances from a recurring task item.
 *
 * This function:
 * 1. Parses the RRULE from the recurring item
 * 2. Calculates occurrences respecting endDate and generation limits
 * 3. Skips dates already in existingDates to prevent duplicates
 * 4. Returns an array of task objects ready for database insertion
 *
 * @param recurringItem - The recurring task item template
 * @param fromDate - The date to start generating from
 * @param existingDates - Set of ISO date strings (YYYY-MM-DD) for dates that already have tasks
 * @returns Array of generated task data objects
 *
 * @example
 * const tasks = generateTasksFromRecurringItem(
 *   recurringItem,
 *   new Date('2025-01-01'),
 *   new Set(['2025-01-02', '2025-01-03'])
 * );
 */
export function generateTasksFromRecurringItem(
  recurringItem: RecurringTaskItem,
  fromDate: Date,
  existingDates: Set<string>
): GeneratedTaskData[] {
  // Get the generation limit for this frequency
  const limit = GENERATION_LIMITS[recurringItem.frequency] || 15;

  // Parse the RRULE string
  let rule: RRule;
  try {
    rule = RRule.fromString(recurringItem.rruleString);
  } catch {
    // If parsing fails, return empty array
    return [];
  }

  // Calculate the maximum boundary date
  // Either the recurring item's end date or 1 year from fromDate
  const oneYearAhead = new Date(fromDate.getTime() + 365 * 24 * 60 * 60 * 1000);
  const maxDate = recurringItem.endDate
    ? new Date(
        Math.min(recurringItem.endDate.getTime(), oneYearAhead.getTime())
      )
    : oneYearAhead;

  // Get all occurrences within the range
  const occurrences = rule.between(fromDate, maxDate, true);

  // Generate tasks, respecting the limit and skipping existing dates
  const generatedTasks: GeneratedTaskData[] = [];
  const positions: string[] = [];

  for (const occurrence of occurrences) {
    // Stop if we've reached the limit
    if (generatedTasks.length >= limit) {
      break;
    }

    // Get the date key for comparison
    const dateKey = toDateKey(occurrence);

    // Skip if this date already has a task
    if (existingDates.has(dateKey)) {
      continue;
    }

    // Calculate due date based on offset
    const dueDate = calculateDueDate(occurrence, recurringItem.dueOffsetDays);

    // Generate position (incremental based on previously generated)
    const position = generateNextPosition(positions);
    positions.push(position);

    // Create the task data
    generatedTasks.push({
      userId: recurringItem.userId,
      title: recurringItem.title,
      description: recurringItem.description,
      categoryId: recurringItem.categoryId,
      priority: recurringItem.priority,
      dailySection: recurringItem.dailySection,
      bonusSection: recurringItem.bonusSection,
      scheduledDate: occurrence,
      dueDate,
      recurringItemId: recurringItem.id,
      position,
      completed: false,
      completedAt: null,
    });
  }

  return generatedTasks;
}

/**
 * Gets the generation limit for a specific frequency.
 *
 * @param frequency - The recurrence frequency
 * @returns The number of tasks to generate ahead
 */
export function getGenerationLimit(frequency: RecurringFrequency): number {
  return GENERATION_LIMITS[frequency] || 15;
}
