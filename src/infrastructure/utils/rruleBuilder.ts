// src/infrastructure/utils/rruleBuilder.ts
import { RRule, Weekday } from 'rrule';
import type { RecurringFrequency } from '@/src/domain/types/recurring';

/**
 * Maps JavaScript day numbers (0=Monday, 6=Sunday) to RRule weekday constants
 */
const WEEKDAY_MAP: Record<number, Weekday> = {
  0: RRule.MO,
  1: RRule.TU,
  2: RRule.WE,
  3: RRule.TH,
  4: RRule.FR,
  5: RRule.SA,
  6: RRule.SU,
};

/**
 * Options for building an RRULE string
 */
export interface BuildRRuleOptions {
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  weeklyDays?: number[]; // 0-6, Monday = 0, Sunday = 6
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
