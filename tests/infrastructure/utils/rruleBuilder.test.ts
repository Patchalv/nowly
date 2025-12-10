/**
 * Tests for RRULE builder utilities
 */

import { buildRRuleString } from '@/src/infrastructure/utils/rruleBuilder';
import { describe, expect, it } from 'vitest';

describe('rruleBuilder utilities', () => {
  describe('buildRRuleString', () => {
    describe('daily frequency', () => {
      it('should create daily rrule', () => {
        const result = buildRRuleString({
          frequency: 'daily',
          startDate: new Date('2025-01-01T00:00:00Z'),
        });

        expect(result).toContain('FREQ=DAILY');
        expect(result).toContain('DTSTART');
      });

      it('should include end date when provided', () => {
        const result = buildRRuleString({
          frequency: 'daily',
          startDate: new Date('2025-01-01T00:00:00Z'),
          endDate: new Date('2025-01-31T00:00:00Z'),
        });

        expect(result).toContain('FREQ=DAILY');
        expect(result).toContain('UNTIL');
      });
    });

    describe('weekdays frequency', () => {
      it('should create weekdays rrule (Mon-Fri)', () => {
        const result = buildRRuleString({
          frequency: 'weekdays',
          startDate: new Date('2025-01-01T00:00:00Z'),
        });

        expect(result).toContain('FREQ=WEEKLY');
        expect(result).toContain('BYDAY=');
        expect(result).toContain('MO');
        expect(result).toContain('TU');
        expect(result).toContain('WE');
        expect(result).toContain('TH');
        expect(result).toContain('FR');
        expect(result).not.toContain('SA');
        expect(result).not.toContain('SU');
      });
    });

    describe('weekends frequency', () => {
      it('should create weekends rrule (Sat-Sun)', () => {
        const result = buildRRuleString({
          frequency: 'weekends',
          startDate: new Date('2025-01-01T00:00:00Z'),
        });

        expect(result).toContain('FREQ=WEEKLY');
        expect(result).toContain('BYDAY=');
        expect(result).toContain('SA');
        expect(result).toContain('SU');
        expect(result).not.toMatch(/BYDAY=[^;]*MO/);
        expect(result).not.toMatch(/BYDAY=[^;]*TU/);
        expect(result).not.toMatch(/BYDAY=[^;]*WE/);
        expect(result).not.toMatch(/BYDAY=[^;]*TH/);
        expect(result).not.toMatch(/BYDAY=[^;]*FR/);
      });
    });

    describe('weekly frequency', () => {
      it('should create weekly rrule with specific days', () => {
        const result = buildRRuleString({
          frequency: 'weekly',
          startDate: new Date('2025-01-01T00:00:00Z'),
          weeklyDays: [1, 3, 5], // Mon, Wed, Fri (JavaScript native)
        });

        expect(result).toContain('FREQ=WEEKLY');
        expect(result).toContain('BYDAY=');
        expect(result).toContain('MO');
        expect(result).toContain('WE');
        expect(result).toContain('FR');
      });

      it('should handle single day selection', () => {
        const result = buildRRuleString({
          frequency: 'weekly',
          startDate: new Date('2025-01-01T00:00:00Z'),
          weeklyDays: [1], // Monday only (JavaScript native)
        });

        expect(result).toContain('FREQ=WEEKLY');
        expect(result).toContain('MO');
      });

      it('should handle Sunday (day 0)', () => {
        const result = buildRRuleString({
          frequency: 'weekly',
          startDate: new Date('2025-01-01T00:00:00Z'),
          weeklyDays: [0], // Sunday (JavaScript native)
        });

        expect(result).toContain('FREQ=WEEKLY');
        expect(result).toContain('SU');
      });

      it('should ignore invalid day numbers', () => {
        const result = buildRRuleString({
          frequency: 'weekly',
          startDate: new Date('2025-01-01T00:00:00Z'),
          weeklyDays: [1, 7, -1, 3], // Only 1 and 3 are valid (JavaScript native)
        });

        expect(result).toContain('FREQ=WEEKLY');
        expect(result).toContain('MO');
        expect(result).toContain('WE');
      });
    });

    describe('monthly frequency', () => {
      it('should create monthly rrule with day of month', () => {
        const result = buildRRuleString({
          frequency: 'monthly',
          startDate: new Date('2025-01-15T00:00:00Z'),
          monthlyDay: 15,
        });

        expect(result).toContain('FREQ=MONTHLY');
        expect(result).toContain('BYMONTHDAY=15');
      });

      it('should handle last day of month (31)', () => {
        const result = buildRRuleString({
          frequency: 'monthly',
          startDate: new Date('2025-01-31T00:00:00Z'),
          monthlyDay: 31,
        });

        expect(result).toContain('FREQ=MONTHLY');
        expect(result).toContain('BYMONTHDAY=31');
      });

      it('should handle first day of month (1)', () => {
        const result = buildRRuleString({
          frequency: 'monthly',
          startDate: new Date('2025-01-01T00:00:00Z'),
          monthlyDay: 1,
        });

        expect(result).toContain('FREQ=MONTHLY');
        expect(result).toContain('BYMONTHDAY=1');
      });
    });

    describe('yearly frequency', () => {
      it('should create yearly rrule with month and day', () => {
        const result = buildRRuleString({
          frequency: 'yearly',
          startDate: new Date('2025-07-04T00:00:00Z'),
          yearlyMonth: 7,
          yearlyDay: 4,
        });

        expect(result).toContain('FREQ=YEARLY');
        expect(result).toContain('BYMONTH=7');
        expect(result).toContain('BYMONTHDAY=4');
      });

      it('should handle December 25 (Christmas)', () => {
        const result = buildRRuleString({
          frequency: 'yearly',
          startDate: new Date('2025-12-25T00:00:00Z'),
          yearlyMonth: 12,
          yearlyDay: 25,
        });

        expect(result).toContain('FREQ=YEARLY');
        expect(result).toContain('BYMONTH=12');
        expect(result).toContain('BYMONTHDAY=25');
      });
    });
  });
});
