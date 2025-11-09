/**
 * Database date transformation utilities
 * Handles conversion between database date types and domain Date objects
 *
 * Key principles:
 * - DATE fields (scheduled_date, due_date) are timezone-agnostic and converted using local date components
 * - TIMESTAMPTZ fields (created_at, updated_at, completed_at) preserve timezone information via ISO strings
 */

import {
  formatISODate,
  formatISOString,
  parseDatabaseDate,
} from '@/src/shared/utils/date-formatting';
import { startOfDay } from 'date-fns';

/**
 * Transform a database DATE field to a domain Date object
 * Database DATE fields come as YYYY-MM-DD strings
 * Converts to Date object using local timezone to avoid day shifts
 *
 * @param dateString - DATE string from database (YYYY-MM-DD format) or null
 * @returns Date object at start of day in local timezone, or null if input is null
 */
export function dateFromDatabase(dateString: string | null): Date | null {
  if (!dateString) return null;

  const parsed = parseDatabaseDate(dateString);
  if (!parsed) return null;

  // Ensure we return start of day to be consistent
  return startOfDay(parsed);
}

/**
 * Transform a domain Date object to a database DATE field
 * Converts to YYYY-MM-DD string using local date components
 * This ensures date-only fields never shift days due to timezone conversions
 *
 * @param date - Date object or null
 * @returns DATE string (YYYY-MM-DD) or null
 */
export function dateToDatabase(date: Date | null): string | null {
  if (!date) return null;

  // Use local date components to avoid timezone shifts
  return formatISODate(startOfDay(date));
}

/**
 * Transform a database TIMESTAMPTZ field to a domain Date object
 * Database TIMESTAMPTZ fields come as ISO strings with timezone information
 *
 * @param timestampString - TIMESTAMPTZ string from database (ISO format) or null
 * @returns Date object or null if input is null/invalid
 */
export function timestampFromDatabase(timestampString: string): Date {
  const parsed = parseDatabaseDate(timestampString);
  if (!parsed) throw new Error('Invalid timestamp string');
  return parsed;
}

/**
 * Transform a domain Date object to a database TIMESTAMPTZ field
 * Converts to ISO string which preserves timezone information
 *
 * @param date - Date object or null
 * @returns ISO string for TIMESTAMPTZ or null
 */
export function timestampToDatabase(date: Date | null): string | null {
  if (!date) return null;

  return formatISOString(date);
}
