/**
 * Type definitions for date-related components and utilities
 */

/**
 * Day of week abbreviations
 */
export type WeekDay = 'M' | 'T' | 'W' | 'T' | 'F' | 'S' | 'S';

/**
 * Full day names
 */
export type DayName =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

/**
 * Information about a specific day in the week carousel
 */
export interface DayInfo {
  /** The full date object */
  date: Date;
  /** Day of week abbreviation (M, T, W, etc.) */
  dayOfWeek: WeekDay;
  /** Day of month number (1-31) */
  dayOfMonth: number;
  /** Whether this day is currently selected */
  isSelected: boolean;
  /** Whether this day is today */
  isToday: boolean;
}

/**
 * Week information for the carousel
 */
export interface WeekInfo {
  /** ISO week number */
  weekNumber: number;
  /** Year for the ISO week */
  year: number;
  /** Array of 7 days (Monday through Sunday) */
  days: DayInfo[];
}
