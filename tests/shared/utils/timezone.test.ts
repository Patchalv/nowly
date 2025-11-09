/**
 * Tests for timezone utility functions
 */

import {
  convertToTimezone,
  formatInTimezone,
  getBrowserTimezone,
  getDefaultTimezone,
  getEffectiveTimezone,
  getTimezoneOffset,
  getUserTimezone,
  isValidTimezone,
} from '@/src/shared/utils/timezone';
import { describe, expect, it, vi } from 'vitest';

describe('timezone utilities', () => {
  describe('getBrowserTimezone', () => {
    it('should return a valid timezone string', () => {
      const tz = getBrowserTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });

    it('should fallback to UTC on error', () => {
      // Mock Intl.DateTimeFormat to throw
      const originalIntl = global.Intl;
      // @ts-expect-error - Mocking Intl
      global.Intl = {
        DateTimeFormat: Object.assign(
          vi.fn(() => {
            throw new Error('Mock error');
          }),
          {
            supportedLocalesOf: vi.fn(() => []),
          }
        ),
      };

      const tz = getBrowserTimezone();
      expect(tz).toBe('UTC');

      global.Intl = originalIntl;
    });
  });

  describe('getDefaultTimezone', () => {
    it('should return browser timezone or UTC', () => {
      const tz = getDefaultTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });
  });

  describe('getUserTimezone', () => {
    it('should return null when user preference not set', () => {
      // Currently returns null as placeholder
      expect(getUserTimezone()).toBeNull();
    });
  });

  describe('isValidTimezone', () => {
    it('should return true for valid timezones', () => {
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
    });

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      // @ts-expect-error - Testing invalid input
      expect(isValidTimezone(null)).toBe(false);
      // @ts-expect-error - Testing invalid input
      expect(isValidTimezone(undefined)).toBe(false);
      // @ts-expect-error - Testing invalid input
      expect(isValidTimezone(123)).toBe(false);
    });
  });

  describe('formatInTimezone', () => {
    it('should format date in specified timezone', () => {
      const date = new Date('2024-01-15T12:00:00Z'); // UTC noon
      const result = formatInTimezone(
        date,
        'America/New_York',
        'yyyy-MM-dd HH:mm'
      );
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });

    it('should throw for invalid timezone', () => {
      const date = new Date();
      expect(() => {
        formatInTimezone(date, 'Invalid/Timezone', 'yyyy-MM-dd');
      }).toThrow('Invalid timezone');
    });
  });

  describe('convertToTimezone', () => {
    it('should convert date to timezone', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = convertToTimezone(date, 'America/New_York');
      expect(result).toBeInstanceOf(Date);
    });

    it('should throw for invalid timezone', () => {
      const date = new Date();
      expect(() => {
        convertToTimezone(date, 'Invalid/Timezone');
      }).toThrow('Invalid timezone');
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return offset in minutes', () => {
      const offset = getTimezoneOffset('America/New_York');
      expect(typeof offset).toBe('number');
      // EST is UTC-5, EDT is UTC-4
      expect(offset).toBeGreaterThanOrEqual(-300); // -5 hours
      expect(offset).toBeLessThanOrEqual(-240); // -4 hours
    });

    it('should return 0 for UTC', () => {
      const offset = getTimezoneOffset('UTC');
      expect(offset).toBe(0);
    });

    it('should throw for invalid timezone', () => {
      expect(() => {
        getTimezoneOffset('Invalid/Timezone');
      }).toThrow('Invalid timezone');
    });
  });

  describe('getEffectiveTimezone', () => {
    it('should return browser timezone when user preference not set', () => {
      const tz = getEffectiveTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });
  });
});
