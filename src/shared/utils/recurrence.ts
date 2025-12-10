/**
 * Recurrence utility functions for working with RRULE strings
 * These are pure utility functions that can be used across all layers
 */

import { RRule } from 'rrule';

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
