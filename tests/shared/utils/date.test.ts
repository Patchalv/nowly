/**
 * Tests for date utility functions
 */

import {
  addDays,
  addWeeks,
  daysBetween,
  endOfDate,
  formatDateForURL,
  getISOWeek,
  getISOWeekYear,
  getWeekDates,
  isAfterDay,
  isBeforeDay,
  isOnOrAfterDay,
  isOnOrBeforeDay,
  isSameDay,
  isValidDate,
  parseDateFromURL,
  startOfDate,
  today,
  tomorrow,
  yesterday,
} from '@/src/shared/utils/date';
import { describe, expect, it } from 'vitest';

describe('date utilities', () => {
  describe('getISOWeek', () => {
    it('should return correct ISO week number', () => {
      // January 1, 2024 is a Monday, week 1
      const date = new Date(2024, 0, 1);
      expect(getISOWeek(date)).toBe(1);
    });

    it('should handle year boundaries correctly', () => {
      // December 31, 2023 is in week 52 of 2023
      const date = new Date(2023, 11, 31);
      const week = getISOWeek(date);
      expect(week).toBeGreaterThanOrEqual(52);
      expect(week).toBeLessThanOrEqual(53);
    });
  });

  describe('getISOWeekYear', () => {
    it('should return correct ISO week year', () => {
      const date = new Date(2024, 0, 1);
      expect(getISOWeekYear(date)).toBe(2024);
    });
  });

  describe('getWeekDates', () => {
    it('should return 7 dates starting from Monday', () => {
      const date = new Date(2024, 0, 3); // Wednesday, Jan 3, 2024
      const weekDates = getWeekDates(date);

      expect(weekDates).toHaveLength(7);
      expect(weekDates[0].getDay()).toBe(1); // Monday
      expect(weekDates[6].getDay()).toBe(0); // Sunday
    });

    it('should include the input date in the week', () => {
      const date = new Date(2024, 0, 3);
      const weekDates = getWeekDates(date);
      const dateStrings = weekDates.map((d) => formatDateForURL(d));

      expect(dateStrings).toContain(formatDateForURL(date));
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date(2024, 0, 15, 10, 30);
      const date2 = new Date(2024, 0, 15, 14, 45);
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('formatDateForURL', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15);
      expect(formatDateForURL(date)).toBe('2024-01-15');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2024, 0, 5);
      expect(formatDateForURL(date)).toBe('2024-01-05');
    });
  });

  describe('parseDateFromURL', () => {
    it('should parse valid date string', () => {
      const date = parseDateFromURL('2024-01-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it('should return today for null input', () => {
      const today = new Date();
      const parsed = parseDateFromURL(null);
      expect(isSameDay(parsed, today)).toBe(true);
    });

    it('should return today for invalid format', () => {
      const today = new Date();
      const parsed = parseDateFromURL('invalid');
      expect(isSameDay(parsed, today)).toBe(true);
    });

    it('should handle timezone correctly (local date)', () => {
      // This should parse as local date, not UTC
      const parsed = parseDateFromURL('2024-01-15');
      const localDate = new Date(2024, 0, 15);
      expect(isSameDay(parsed, localDate)).toBe(true);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date(2024, 0, 15);
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('should handle negative days', () => {
      const date = new Date(2024, 0, 15);
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it('should handle month boundaries', () => {
      const date = new Date(2024, 0, 30); // Jan 30
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });

  describe('addWeeks', () => {
    it('should add weeks correctly', () => {
      const date = new Date(2024, 0, 15);
      const result = addWeeks(date, 2);
      expect(result.getDate()).toBe(29);
    });
  });

  describe('isBeforeDay', () => {
    it('should return true if date1 is before date2', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      expect(isBeforeDay(date1, date2)).toBe(true);
    });

    it('should return false if date1 is after date2', () => {
      const date1 = new Date(2024, 0, 16);
      const date2 = new Date(2024, 0, 15);
      expect(isBeforeDay(date1, date2)).toBe(false);
    });

    it('should ignore time component', () => {
      const date1 = new Date(2024, 0, 15, 23, 59);
      const date2 = new Date(2024, 0, 16, 0, 0);
      expect(isBeforeDay(date1, date2)).toBe(true);
    });
  });

  describe('isAfterDay', () => {
    it('should return true if date1 is after date2', () => {
      const date1 = new Date(2024, 0, 16);
      const date2 = new Date(2024, 0, 15);
      expect(isAfterDay(date1, date2)).toBe(true);
    });
  });

  describe('isOnOrBeforeDay', () => {
    it('should return true if date1 is before date2', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      expect(isOnOrBeforeDay(date1, date2)).toBe(true);
    });

    it('should return true if dates are the same day', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 15);
      expect(isOnOrBeforeDay(date1, date2)).toBe(true);
    });
  });

  describe('isOnOrAfterDay', () => {
    it('should return true if date1 is after date2', () => {
      const date1 = new Date(2024, 0, 16);
      const date2 = new Date(2024, 0, 15);
      expect(isOnOrAfterDay(date1, date2)).toBe(true);
    });

    it('should return true if dates are the same day', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 15);
      expect(isOnOrAfterDay(date1, date2)).toBe(true);
    });
  });

  describe('daysBetween', () => {
    it('should return correct number of days', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 20);
      expect(daysBetween(date1, date2)).toBe(5);
    });

    it('should return absolute value', () => {
      const date1 = new Date(2024, 0, 20);
      const date2 = new Date(2024, 0, 15);
      expect(daysBetween(date1, date2)).toBe(5);
    });
  });

  describe('startOfDate', () => {
    it('should return start of day', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45);
      const result = startOfDate(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('endOfDate', () => {
    it('should return end of day', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45);
      const result = endOfDate(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should return false for invalid Date', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should return false for non-Date values', () => {
      expect(isValidDate('2024-01-15')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });
  });

  describe('today', () => {
    it('should return today at start of day', () => {
      const result = today();
      const now = new Date();
      expect(isSameDay(result, now)).toBe(true);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('tomorrow', () => {
    it('should return tomorrow', () => {
      const result = tomorrow();
      const expected = addDays(today(), 1);
      expect(isSameDay(result, expected)).toBe(true);
    });
  });

  describe('yesterday', () => {
    it('should return yesterday', () => {
      const result = yesterday();
      const expected = addDays(today(), -1);
      expect(isSameDay(result, expected)).toBe(true);
    });
  });
});
