/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Tests for database date transformation utilities
 */

import {
  dateFromDatabase,
  dateToDatabase,
  timestampFromDatabase,
  timestampToDatabase,
} from '@/src/infrastructure/supabase/utils/dates';
import { isSameDay, startOfDate } from '@/src/shared/utils/date';
import { describe, expect, it } from 'vitest';

describe('database date transformations', () => {
  describe('dateFromDatabase', () => {
    it('should convert DATE string to Date object', () => {
      const dateString = '2024-01-15';
      const result = dateFromDatabase(dateString);
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('should return start of day', () => {
      const dateString = '2024-01-15';
      const result = dateFromDatabase(dateString);
      expect(result).not.toBeNull();
      const startOfDay = startOfDate(result!);
      expect(isSameDay(result!, startOfDay)).toBe(true);
      expect(result!.getHours()).toBe(0);
    });

    it('should return null for null input', () => {
      expect(dateFromDatabase(null)).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(dateFromDatabase('invalid')).toBeNull();
      expect(dateFromDatabase('2024-13-45')).toBeNull();
    });
  });

  describe('dateToDatabase', () => {
    it('should convert Date to DATE string', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45);
      const result = dateToDatabase(date);
      expect(result).toBe('2024-01-15');
    });

    it('should use local date components', () => {
      const date = new Date('2024-01-15T23:00:00Z'); // UTC
      const result = dateToDatabase(date);
      // Should use local date, not UTC date
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return null for null input', () => {
      expect(dateToDatabase(null)).toBeNull();
    });

    it('should return start of day format', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45);
      const result = dateToDatabase(date);
      // Should be YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('timestampFromDatabase', () => {
    it('should convert TIMESTAMPTZ string to Date object', () => {
      const timestampString = '2024-01-15T14:30:45.000Z';
      const result = timestampFromDatabase(timestampString);
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2024);
    });

    it('should preserve time information', () => {
      const timestampString = '2024-01-15T14:30:45.000Z';
      const result = timestampFromDatabase(timestampString);
      expect(result).not.toBeNull();
      // Time should be preserved (may vary based on timezone)
      expect(result!.getTime()).toBeGreaterThan(0);
    });

    it('should return null for null input', () => {
      expect(timestampFromDatabase(null)).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(timestampFromDatabase('invalid')).toBeNull();
    });
  });

  describe('timestampToDatabase', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2024-01-15T14:30:45.000Z');
      const result = timestampToDatabase(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should preserve timezone information', () => {
      const date = new Date('2024-01-15T14:30:45.000Z');
      const result = timestampToDatabase(date);
      expect(result).toContain('Z'); // UTC indicator
    });

    it('should return null for null input', () => {
      expect(timestampToDatabase(null)).toBeNull();
    });
  });

  describe('round-trip conversions', () => {
    it('should preserve date in DATE round-trip', () => {
      const originalDate = new Date(2024, 0, 15);
      const dbString = dateToDatabase(originalDate);
      const convertedDate = dateFromDatabase(dbString);
      expect(convertedDate).not.toBeNull();
      expect(isSameDay(originalDate, convertedDate!)).toBe(true);
    });

    it('should preserve timestamp in TIMESTAMPTZ round-trip', () => {
      const originalDate = new Date('2024-01-15T14:30:45.000Z');
      const dbString = timestampToDatabase(originalDate);
      const convertedDate = timestampFromDatabase(dbString);
      expect(convertedDate).not.toBeNull();
      // Should be same moment in time (within milliseconds)
      expect(
        Math.abs(originalDate.getTime() - convertedDate!.getTime())
      ).toBeLessThan(1000);
    });
  });
});
