/**
 * Hook for accessing user timezone and timezone-aware date formatting
 * Provides timezone context and formatting utilities for components
 */

'use client';

import {
  formatDateWithDay,
  formatDisplayDate,
  formatISODate,
  formatTimestamp,
} from '@/src/shared/utils/date-formatting';
import {
  getBrowserTimezone,
  getEffectiveTimezone,
  isValidTimezone,
} from '@/src/shared/utils/timezone';
import { useMemo } from 'react';

/**
 * Return type for useTimezone hook
 */
export interface UseTimezoneReturn {
  /** Current effective timezone (user preference or browser default) */
  timezone: string;
  /** Browser's timezone */
  browserTimezone: string;
  /** Whether user has set a timezone preference */
  hasUserTimezone: boolean;
  /** Format a date for display (e.g., "Jan 15, 2025") */
  formatDisplay: (date: Date) => string;
  /** Format a date with day of week (e.g., "Mon, Jan 15") */
  formatWithDay: (date: Date) => string;
  /** Format a timestamp with time (e.g., "Jan 15, 2025 at 3:30 PM") */
  formatTimestamp: (date: Date) => string;
  /** Format a date as ISO (YYYY-MM-DD) */
  formatISO: (date: Date) => string;
}

/**
 * Hook to access timezone context and formatting utilities
 *
 * @returns Timezone information and formatting functions
 *
 * @example
 * ```tsx
 * const { timezone, formatDisplay } = useTimezone();
 * const formatted = formatDisplay(new Date());
 * ```
 */
export function useTimezone(userTimezone?: string): UseTimezoneReturn {
  // Get timezone values
  const browserTimezone = getBrowserTimezone();
  const effectiveTimezone = userTimezone || getEffectiveTimezone(userTimezone);
  const hasUserTimezone =
    userTimezone !== undefined && isValidTimezone(userTimezone);

  // Memoize formatting functions to avoid recreating on every render
  const formattingFunctions = useMemo(
    () => ({
      formatDisplay: (date: Date) => formatDisplayDate(date, effectiveTimezone),
      formatWithDay: (date: Date) => formatDateWithDay(date, effectiveTimezone),
      formatTimestamp: (date: Date) => formatTimestamp(date, effectiveTimezone),
      formatISO: (date: Date) => formatISODate(date),
    }),
    [effectiveTimezone]
  );

  return {
    timezone: effectiveTimezone,
    browserTimezone,
    hasUserTimezone,
    ...formattingFunctions,
  };
}
