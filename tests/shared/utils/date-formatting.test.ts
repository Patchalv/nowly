/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Tests for date formatting utilities
 */

import {
  formatDateWithDay,
  formatDisplayDate,
  formatISODate,
  formatISOString,
  formatTimestamp,
  parseDatabaseDate,
} from '@/src/shared/utils/date-formatting';
import { describe, expect, it } from 'vitest';

describe('date formatting utilities', () => {
  const testDate = new Date(2024, 0, 15, 14, 30, 45); // Jan 15, 2024, 2:30:45 PM

  describe('formatDisplayDate', () => {
    it('should format date without timezone', () => {
      const result = formatDisplayDate(testDate);
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should format date with timezone', () => {
      const result = formatDisplayDate(testDate, 'America/New_York');
      expect(result).toMatch(/Jan 15, 2024/);
    });
  });

  describe('formatDateWithDay', () => {
    it('should format date with day of week', () => {
      const result = formatDateWithDay(testDate);
      expect(result).toMatch(/Mon, Jan 15/);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp with time', () => {
      const result = formatTimestamp(testDate);
      expect(result).toMatch(/Jan 15, 2024/);
      expect(result).toMatch(/2:30 PM/);
    });
  });

  describe('formatISODate', () => {
    it('should format as YYYY-MM-DD', () => {
      const result = formatISODate(testDate);
      expect(result).toBe('2024-01-15');
    });
  });

  describe('formatISOString', () => {
    it('should format as ISO string', () => {
      const result = formatISOString(testDate);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('parseDatabaseDate', () => {
    it('should parse DATE format (YYYY-MM-DD)', () => {
      const result = parseDatabaseDate('2024-01-15');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2024);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getDate()).toBe(15);
    });

    it('should parse TIMESTAMPTZ format (ISO string)', () => {
      const isoString = '2024-01-15T14:30:45.000Z';
      const result = parseDatabaseDate(isoString);
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2024);
    });

    it('should return null for null input', () => {
      expect(parseDatabaseDate(null)).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(parseDatabaseDate('invalid')).toBeNull();
      expect(parseDatabaseDate('2024-13-45')).toBeNull();
    });
  });
});
