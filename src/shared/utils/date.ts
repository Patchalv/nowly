/**
 * Date utility functions for ISO week calculations and date manipulation
 */

/**
 * Get the ISO week number for a given date
 * ISO week starts on Monday, week 1 is the first week with a Thursday
 */
export function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  // Get first day of year
  const yearStart = new Date(d.getFullYear(), 0, 1);
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNo;
}

/**
 * Get the year for the ISO week (can differ from calendar year at year boundaries)
 */
export function getISOWeekYear(date: Date): number {
  const d = new Date(date);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  return d.getFullYear();
}

/**
 * Get an array of 7 dates representing Monday through Sunday of the week containing the given date
 */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const day = d.getDay();
  // Calculate offset to Monday (if Sunday, go back 6 days, else go back day-1 days)
  const mondayOffset = day === 0 ? -6 : 1 - day;

  // Set to Monday
  d.setDate(d.getDate() + mondayOffset);

  // Generate array of 7 dates starting from Monday
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(d);
    dayDate.setDate(d.getDate() + i);
    weekDates.push(dayDate);
  }

  return weekDates;
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format a date as YYYY-MM-DD for URL usage
 */
export function formatDateForURL(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string from URL (YYYY-MM-DD format) or return today if null/invalid
 * Parses in local timezone to avoid off-by-one errors for users in negative UTC offsets
 */
export function parseDateFromURL(dateString: string | null): Date {
  if (!dateString) {
    return new Date();
  }

  // Parse as local date to avoid timezone issues
  // new Date("2025-11-06") interprets as UTC midnight, which can shift the day
  // for users in negative UTC offset timezones (e.g., Americas)
  const parts = dateString.split('-');

  // Validate format (should have 3 parts: year, month, day)
  if (parts.length !== 3) {
    return new Date();
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Validate numeric parts
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date();
  }

  // Validate ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return new Date();
  }

  // Create date in local timezone (month is 0-indexed)
  const parsed = new Date(year, month - 1, day);

  // Final validation - check if date is valid
  if (isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}
