/**
 * Tests for recurrence utility functions
 */

import { buildRRuleString } from '@/src/infrastructure/utils/rruleBuilder';
import {
  getNextOccurrences,
  getOccurrencesBetween,
} from '@/src/shared/utils/recurrence';
import { describe, expect, it } from 'vitest';

describe('recurrence utilities', () => {
  describe('getNextOccurrences', () => {
    it('should return correct number of occurrences', () => {
      const rrule = buildRRuleString({
        frequency: 'daily',
        startDate: new Date('2025-01-01T00:00:00Z'),
      });

      const occurrences = getNextOccurrences(
        rrule,
        new Date('2025-01-01T00:00:00Z'),
        5
      );

      expect(occurrences).toHaveLength(5);
    });

    it('should return dates after the specified date', () => {
      const rrule = buildRRuleString({
        frequency: 'daily',
        startDate: new Date('2025-01-01T00:00:00Z'),
      });

      const afterDate = new Date('2025-01-05T00:00:00Z');
      const occurrences = getNextOccurrences(rrule, afterDate, 3);

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach((date) => {
        expect(date.getTime()).toBeGreaterThan(afterDate.getTime());
      });
    });

    it('should return empty array for count of 0', () => {
      const rrule = buildRRuleString({
        frequency: 'daily',
        startDate: new Date('2025-01-01T00:00:00Z'),
      });

      const occurrences = getNextOccurrences(
        rrule,
        new Date('2025-01-01T00:00:00Z'),
        0
      );

      expect(occurrences).toHaveLength(0);
    });

    it('should return empty array for invalid rrule string', () => {
      const occurrences = getNextOccurrences(
        'invalid-rrule',
        new Date('2025-01-01T00:00:00Z'),
        5
      );

      expect(occurrences).toHaveLength(0);
    });

    it('should respect rrule end date', () => {
      const rrule = buildRRuleString({
        frequency: 'daily',
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-05T00:00:00Z'),
      });

      const occurrences = getNextOccurrences(
        rrule,
        new Date('2025-01-01T00:00:00Z'),
        10
      );

      // Should only return up to end date
      occurrences.forEach((date) => {
        expect(date.getTime()).toBeLessThanOrEqual(
          new Date('2025-01-05T00:00:00Z').getTime()
        );
      });
    });
  });

  describe('getOccurrencesBetween', () => {
    it('should return occurrences within date range', () => {
      const rrule = buildRRuleString({
        frequency: 'daily',
        startDate: new Date('2025-01-01T00:00:00Z'),
      });

      const occurrences = getOccurrencesBetween(
        rrule,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-10T00:00:00Z')
      );

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach((date) => {
        expect(date.getTime()).toBeGreaterThanOrEqual(
          new Date('2025-01-01T00:00:00Z').getTime()
        );
        expect(date.getTime()).toBeLessThanOrEqual(
          new Date('2025-01-10T00:00:00Z').getTime()
        );
      });
    });

    it('should return empty array when end is before start', () => {
      const rrule = buildRRuleString({
        frequency: 'daily',
        startDate: new Date('2025-01-01T00:00:00Z'),
      });

      const occurrences = getOccurrencesBetween(
        rrule,
        new Date('2025-01-10T00:00:00Z'),
        new Date('2025-01-01T00:00:00Z')
      );

      expect(occurrences).toHaveLength(0);
    });

    it('should return empty array for invalid rrule string', () => {
      const occurrences = getOccurrencesBetween(
        'invalid-rrule',
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-10T00:00:00Z')
      );

      expect(occurrences).toHaveLength(0);
    });

    it('should only return weekdays for weekdays frequency', () => {
      const rrule = buildRRuleString({
        frequency: 'weekdays',
        startDate: new Date('2025-01-01T00:00:00Z'),
      });

      const occurrences = getOccurrencesBetween(
        rrule,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T00:00:00Z')
      );

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach((date) => {
        const day = date.getUTCDay();
        // Should not be Saturday (6) or Sunday (0)
        expect(day).not.toBe(0);
        expect(day).not.toBe(6);
      });
    });

    it('should only return weekends for weekends frequency', () => {
      const rrule = buildRRuleString({
        frequency: 'weekends',
        startDate: new Date('2025-01-01T00:00:00Z'),
      });

      const occurrences = getOccurrencesBetween(
        rrule,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T00:00:00Z')
      );

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach((date) => {
        const day = date.getUTCDay();
        // Should only be Saturday (6) or Sunday (0)
        expect([0, 6]).toContain(day);
      });
    });

    it('should respect monthly frequency', () => {
      const rrule = buildRRuleString({
        frequency: 'monthly',
        startDate: new Date('2025-01-15T00:00:00Z'),
        monthlyDay: 15,
      });

      const occurrences = getOccurrencesBetween(
        rrule,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-06-30T00:00:00Z')
      );

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach((date) => {
        // Should be the 15th of each month
        expect(date.getUTCDate()).toBe(15);
      });
    });
  });
});
