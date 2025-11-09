/**
 * Date validation schemas using Zod
 * Reusable date validation helpers for domain validation
 */

import { isValidDate } from '@/src/shared/utils/date';
import { z } from 'zod';

/**
 * Schema for validating Date objects
 * Ensures the value is a valid Date instance
 */
export const dateSchema = z
  .date({
    error: 'Date is required',
  })
  .refine((date) => isValidDate(date), {
    message: 'Invalid date',
  });

/**
 * Schema for optional Date validation
 * Allows null or undefined, but if provided must be a valid Date
 */
export const optionalDateSchema = z
  .date({
    error: 'Value must be a Date object',
  })
  .refine((date) => isValidDate(date), {
    message: 'Invalid date',
  })
  .nullable()
  .optional();

/**
 * Schema for validating date ranges
 * Ensures start date is before or equal to end date
 */
export const dateRangeSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  });

/**
 * Helper function to create a date range validation
 * @param startField - Field name for start date
 * @param endField - Field name for end date
 * @returns Zod refinement function
 */
export function createDateRangeRefinement(
  startField: string,
  endField: string
) {
  return (data: { [key: string]: Date | null | undefined }) => {
    const start = data[startField];
    const end = data[endField];

    // If either is null/undefined, validation passes (handled by optional schemas)
    if (!start || !end) {
      return true;
    }

    // Both must be valid dates
    if (!isValidDate(start) || !isValidDate(end)) {
      return false;
    }

    return start <= end;
  };
}

/**
 * Schema for validating that a date is not in the past
 */
export const futureDateSchema = dateSchema.refine(
  (date) => date >= new Date(),
  {
    message: 'Date must be in the future',
  }
);

/**
 * Schema for validating that a date is not in the future
 */
export const pastDateSchema = dateSchema.refine((date) => date <= new Date(), {
  message: 'Date must be in the past',
});
