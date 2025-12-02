// src/infrastructure/utils/rruleBuilder.ts
import { RRule, Weekday } from 'rrule';
import type { RecurringFrequency } from '@/src/domain/types/recurring';

/**
 * Maps JavaScript day numbers (0=Sunday, 6=Saturday) to RRule weekday constants
 */
const WEEKDAY_MAP: Record<number, Weekday> = {
  0: RRule.SU,
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
};

/**
 * Options for building an RRULE string
 */
export interface BuildRRuleOptions {
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  weeklyDays?: number[]; // 0-6, Sunday = 0
  monthlyDay?: number; // 1-31
  yearlyMonth?: number; // 1-12
  yearlyDay?: number; // 1-31
}

/**
 * Builds an iCal-compatible RRULE string from frequency configuration.
 *
 * @param options - The recurrence configuration
 * @returns RRULE string (e.g., "DTSTART:20250101T000000Z\nRRULE:FREQ=DAILY")
 *
 * @example
 * // Daily recurrence starting Jan 1, 2025
 * buildRRuleString({ frequency: 'daily', startDate: new Date('2025-01-01') });
 *
 * @example
 * // Weekly on Mon/Wed/Fri
 * buildRRuleString({
 *   frequency: 'weekly',
 *   startDate: new Date('2025-01-01'),
 *   weeklyDays: [1, 3, 5]
 * });
 */
export function buildRRuleString(options: BuildRRuleOptions): string {
  const {
    frequency,
    startDate,
    endDate,
    weeklyDays,
    monthlyDay,
    yearlyMonth,
    yearlyDay,
  } = options;

  // Base options - use UTC to avoid timezone issues
  const rruleOptions: Partial<ConstructorParameters<typeof RRule>[0]> = {
    dtstart: startDate,
    until: endDate || undefined,
  };

  switch (frequency) {
    case 'daily':
      rruleOptions.freq = RRule.DAILY;
      break;

    case 'weekdays':
      rruleOptions.freq = RRule.WEEKLY;
      rruleOptions.byweekday = [
        RRule.MO,
        RRule.TU,
        RRule.WE,
        RRule.TH,
        RRule.FR,
      ];
      break;

    case 'weekends':
      rruleOptions.freq = RRule.WEEKLY;
      rruleOptions.byweekday = [RRule.SA, RRule.SU];
      break;

    case 'weekly':
      rruleOptions.freq = RRule.WEEKLY;
      if (weeklyDays && weeklyDays.length > 0) {
        rruleOptions.byweekday = weeklyDays
          .filter((d) => d >= 0 && d <= 6)
          .map((d) => WEEKDAY_MAP[d])
          .filter((w): w is Weekday => w !== undefined);
      }
      break;

    case 'monthly':
      rruleOptions.freq = RRule.MONTHLY;
      if (monthlyDay !== undefined && monthlyDay >= 1 && monthlyDay <= 31) {
        rruleOptions.bymonthday = monthlyDay;
      }
      break;

    case 'yearly':
      rruleOptions.freq = RRule.YEARLY;
      if (yearlyMonth !== undefined && yearlyMonth >= 1 && yearlyMonth <= 12) {
        rruleOptions.bymonth = yearlyMonth;
      }
      if (yearlyDay !== undefined && yearlyDay >= 1 && yearlyDay <= 31) {
        rruleOptions.bymonthday = yearlyDay;
      }
      break;

    default:
      // Default to daily if unknown frequency
      rruleOptions.freq = RRule.DAILY;
  }

  const rule = new RRule(rruleOptions);
  return rule.toString();
}

/**
 * Gets the next N occurrences after a given date from an RRULE string.
 *
 * @param rruleString - The RRULE string to parse
 * @param afterDate - The date to start searching from (exclusive)
 * @param count - Maximum number of occurrences to return
 * @returns Array of occurrence dates
 *
 * @example
 * const rrule = 'DTSTART:20250101T000000Z\nRRULE:FREQ=DAILY';
 * const next5 = getNextOccurrences(rrule, new Date('2025-01-05'), 5);
 * // Returns dates for Jan 6, 7, 8, 9, 10
 */
export function getNextOccurrences(
  rruleString: string,
  afterDate: Date,
  count: number
): Date[] {
  if (count <= 0) return [];

  try {
    const rule = RRule.fromString(rruleString);

    // Calculate a reasonable end boundary (1 year ahead)
    const maxEndDate = new Date(
      afterDate.getTime() + 365 * 24 * 60 * 60 * 1000
    );

    // Get occurrences between afterDate and maxEndDate
    // The third parameter (true) includes the boundary dates
    const occurrences = rule.between(afterDate, maxEndDate, true);

    // Filter out the afterDate itself if it matches (we want dates AFTER)
    const filteredOccurrences = occurrences.filter(
      (date) => date.getTime() > afterDate.getTime()
    );

    return filteredOccurrences.slice(0, count);
  } catch {
    // Return empty array if parsing fails
    return [];
  }
}

/**
 * Gets all occurrences between two dates from an RRULE string.
 *
 * @param rruleString - The RRULE string to parse
 * @param startDate - The start of the date range (inclusive)
 * @param endDate - The end of the date range (inclusive)
 * @returns Array of occurrence dates within the range
 *
 * @example
 * const rrule = 'DTSTART:20250101T000000Z\nRRULE:FREQ=DAILY';
 * const janDates = getOccurrencesBetween(
 *   rrule,
 *   new Date('2025-01-01'),
 *   new Date('2025-01-31')
 * );
 * // Returns all dates in January 2025
 */
export function getOccurrencesBetween(
  rruleString: string,
  startDate: Date,
  endDate: Date
): Date[] {
  if (endDate < startDate) return [];

  try {
    const rule = RRule.fromString(rruleString);

    // The third parameter (true) includes the boundary dates
    return rule.between(startDate, endDate, true);
  } catch {
    // Return empty array if parsing fails
    return [];
  }
}
