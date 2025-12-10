// src/infrastructure/utils/rruleBuilder.ts
import type { RecurringFrequency } from '@/src/domain/types/recurring';
import { RRule, Weekday } from 'rrule';

/**
 * Maps JavaScript's native day numbers to RRule weekday constants
 * JavaScript: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
 */
const WEEKDAY_MAP: Record<number, Weekday> = {
  0: RRule.SU, // Sunday
  1: RRule.MO, // Monday
  2: RRule.TU, // Tuesday
  3: RRule.WE, // Wednesday
  4: RRule.TH, // Thursday
  5: RRule.FR, // Friday
  6: RRule.SA, // Saturday
};

/**
 * Options for building an RRULE string
 */
export interface BuildRRuleOptions {
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  weeklyDays?: number[]; // JavaScript native: 0=Sunday, 1=Monday, ..., 6=Saturday
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
 * // Weekly on Mon/Wed/Fri (using JavaScript native day numbers)
 * buildRRuleString({
 *   frequency: 'weekly',
 *   startDate: new Date('2025-01-01'),
 *   weeklyDays: [1, 3, 5] // 1=Monday, 3=Wednesday, 5=Friday
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
