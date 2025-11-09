/**
 * Date formatting utilities using date-fns with timezone support
 * All functions support optional timezone parameter for timezone-aware formatting
 */

import { DATE_FORMATS } from '@/src/config/constants';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Format a date for display (e.g., "Jan 15, 2025")
 * @param date - Date object to format
 * @param timezone - Optional IANA timezone identifier. If not provided, uses local timezone.
 * @returns Formatted date string
 */
export function formatDisplayDate(date: Date, timezone?: string): string {
  if (timezone) {
    return formatInTimeZone(date, timezone, DATE_FORMATS.DISPLAY);
  }
  return format(date, DATE_FORMATS.DISPLAY);
}

/**
 * Format a date with day of week (e.g., "Mon, Jan 15")
 * @param date - Date object to format
 * @param timezone - Optional IANA timezone identifier. If not provided, uses local timezone.
 * @returns Formatted date string with day of week
 */
export function formatDateWithDay(date: Date, timezone?: string): string {
  if (timezone) {
    return formatInTimeZone(date, timezone, DATE_FORMATS.DISPLAY_WITH_DAY);
  }
  return format(date, DATE_FORMATS.DISPLAY_WITH_DAY);
}

/**
 * Format a timestamp with time (e.g., "Jan 15, 2025 at 3:30 PM")
 * @param date - Date object to format
 * @param timezone - Optional IANA timezone identifier. If not provided, uses local timezone.
 * @returns Formatted timestamp string
 */
export function formatTimestamp(date: Date, timezone?: string): string {
  if (timezone) {
    return formatInTimeZone(date, timezone, DATE_FORMATS.DISPLAY_WITH_TIME);
  }
  return format(date, DATE_FORMATS.DISPLAY_WITH_TIME);
}

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 * This is timezone-agnostic and uses the local date components
 * @param date - Date object to format
 * @returns ISO date string (YYYY-MM-DD)
 */
export function formatISODate(date: Date): string {
  return format(date, DATE_FORMATS.ISO);
}

/**
 * Format a date as full ISO string (e.g., "2025-01-15T10:30:00.000Z")
 * @param date - Date object to format
 * @returns ISO string
 */
export function formatISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse an ISO date string from database
 * Handles both DATE (YYYY-MM-DD) and TIMESTAMPTZ (ISO string) formats
 * @param dateString - Date string from database
 * @returns Date object or null if invalid/empty
 */
export function parseDatabaseDate(dateString: string | null): Date | null {
  if (!dateString) return null;

  // If it's a DATE (YYYY-MM-DD), parse as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Validate and create date in local timezone
    if (
      !isNaN(year) &&
      !isNaN(month) &&
      !isNaN(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return null;
  }

  // If it's a TIMESTAMPTZ, parse as ISO
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}
