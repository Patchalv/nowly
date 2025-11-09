/**
 * Timezone utility functions
 * Handles timezone detection, validation, and conversion
 */

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Get the browser's IANA timezone identifier
 * @returns IANA timezone identifier (e.g., "America/New_York")
 */
export function getBrowserTimezone(): string {
  try {
    // Use Intl.DateTimeFormat to get IANA timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback to UTC if timezone detection fails
    return 'UTC';
  }
}

/**
 * Get the default timezone (browser timezone or UTC fallback)
 * @returns IANA timezone identifier
 */
export function getDefaultTimezone(): string {
  const browserTz = getBrowserTimezone();
  return browserTz || 'UTC';
}

/**
 * Get user timezone from user profile
 * This is a placeholder for future implementation when user profile is available
 * For now, returns null to indicate no user preference
 * @returns IANA timezone identifier or null if not set
 */
export function getUserTimezone(): string | null {
  // TODO: Implement when user profile repository is available
  // This should fetch from user context or user profile
  return null;
}

/**
 * Validate that a string is a valid IANA timezone identifier
 * @param tz - Timezone string to validate
 * @returns true if valid IANA timezone identifier
 */
export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') {
    return false;
  }

  try {
    // Try to create a date formatter with the timezone
    // If it throws, the timezone is invalid
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a date in a specific timezone
 * @param date - Date object to format
 * @param timezone - IANA timezone identifier
 * @param formatString - date-fns format string
 * @returns Formatted date string in the specified timezone
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatString: string
): string {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  return formatInTimeZone(date, timezone, formatString);
}

/**
 * Convert a date to a specific timezone
 * Returns a Date object representing the same moment in time, but adjusted for the timezone
 * @param date - Date object to convert
 * @param timezone - IANA timezone identifier
 * @returns Date object adjusted for the timezone
 */
export function convertToTimezone(date: Date, timezone: string): Date {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  // Convert UTC date to zoned time
  return toZonedTime(date, timezone);
}

/**
 * Get the timezone offset in minutes for a specific timezone at a given date
 * @param timezone - IANA timezone identifier
 * @param date - Date to get offset for (defaults to now)
 * @returns Offset in minutes from UTC
 */
export function getTimezoneOffset(
  timezone: string,
  date: Date = new Date()
): number {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  try {
    // Create a formatter for the timezone
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });

    // Get the offset string (e.g., "GMT+5" or "GMT-8")
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((part) => part.type === 'timeZoneName');

    if (!offsetPart) {
      // Fallback: calculate offset manually
      const utcDate = new Date(
        date.toLocaleString('en-US', { timeZone: 'UTC' })
      );
      const tzDate = new Date(
        date.toLocaleString('en-US', { timeZone: timezone })
      );
      return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
    }

    // Parse offset string (format: "GMT+05:00" or "GMT-08:00")
    const offsetMatch = offsetPart.value.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (offsetMatch) {
      const sign = offsetMatch[1] === '+' ? 1 : -1;
      const hours = parseInt(offsetMatch[2], 10);
      const minutes = parseInt(offsetMatch[3], 10);
      return sign * (hours * 60 + minutes);
    }

    return 0;
  } catch {
    // Fallback calculation
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(
      date.toLocaleString('en-US', { timeZone: timezone })
    );
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  }
}

/**
 * Get the effective timezone to use (user preference or browser default)
 * @returns IANA timezone identifier
 */
export function getEffectiveTimezone(): string {
  const userTz = getUserTimezone();
  if (userTz && isValidTimezone(userTz)) {
    return userTz;
  }
  return getDefaultTimezone();
}
