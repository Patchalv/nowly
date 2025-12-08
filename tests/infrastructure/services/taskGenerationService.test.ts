/**
 * Tests for task generation service
 */

import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import {
  generateTasksFromRecurringItem,
  GENERATION_LIMITS,
  getGenerationLimit,
} from '@/src/infrastructure/services/taskGenerationService';
import { buildRRuleString } from '@/src/infrastructure/utils/rruleBuilder';
import { describe, expect, it } from 'vitest';

/**
 * Creates a mock recurring task item for testing
 */
function createMockRecurringItem(
  overrides: Partial<RecurringTaskItem> = {}
): RecurringTaskItem {
  const startDate = new Date('2025-01-01T00:00:00Z');
  const frequency = overrides.frequency || 'daily';

  return {
    id: 'recurring-item-123',
    userId: 'user-456',
    title: 'Test Recurring Task',
    description: 'Test description',
    categoryId: 'category-789',
    priority: 'medium',
    dailySection: 'morning',
    bonusSection: 'essential',
    frequency,
    rruleString: buildRRuleString({
      frequency,
      startDate,
      endDate: overrides.endDate ?? undefined,
      weeklyDays: overrides.frequency === 'weekly' ? [0, 2, 4] : undefined,
      monthlyDay: overrides.frequency === 'monthly' ? 15 : undefined,
      yearlyMonth: overrides.frequency === 'yearly' ? 7 : undefined,
      yearlyDay: overrides.frequency === 'yearly' ? 4 : undefined,
    }),
    startDate,
    endDate: null,
    dueOffsetDays: 0,
    lastGeneratedDate: null,
    tasksToGenerateAhead: 15,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('taskGenerationService', () => {
  describe('GENERATION_LIMITS', () => {
    it('should have correct limits per frequency', () => {
      expect(GENERATION_LIMITS.daily).toBe(15);
      expect(GENERATION_LIMITS.weekdays).toBe(15);
      expect(GENERATION_LIMITS.weekends).toBe(15);
      expect(GENERATION_LIMITS.weekly).toBe(8);
      expect(GENERATION_LIMITS.monthly).toBe(6);
      expect(GENERATION_LIMITS.yearly).toBe(2);
    });
  });

  describe('getGenerationLimit', () => {
    it('should return correct limit for each frequency', () => {
      expect(getGenerationLimit('daily')).toBe(15);
      expect(getGenerationLimit('weekdays')).toBe(15);
      expect(getGenerationLimit('weekends')).toBe(15);
      expect(getGenerationLimit('weekly')).toBe(8);
      expect(getGenerationLimit('monthly')).toBe(6);
      expect(getGenerationLimit('yearly')).toBe(2);
    });
  });

  describe('generateTasksFromRecurringItem', () => {
    describe('generation limits', () => {
      it('should generate up to 15 tasks for daily frequency', () => {
        const recurringItem = createMockRecurringItem({ frequency: 'daily' });
        const fromDate = new Date('2025-01-01T00:00:00Z');

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeLessThanOrEqual(15);
        expect(tasks.length).toBeGreaterThan(0);
      });

      it('should generate up to 8 tasks for weekly frequency', () => {
        const recurringItem = createMockRecurringItem({ frequency: 'weekly' });
        const fromDate = new Date('2025-01-01T00:00:00Z');

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeLessThanOrEqual(8);
      });

      it('should generate up to 6 tasks for monthly frequency', () => {
        const recurringItem = createMockRecurringItem({ frequency: 'monthly' });
        const fromDate = new Date('2025-01-01T00:00:00Z');

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeLessThanOrEqual(6);
      });

      it('should generate up to 2 tasks for yearly frequency', () => {
        const recurringItem = createMockRecurringItem({ frequency: 'yearly' });
        const fromDate = new Date('2025-01-01T00:00:00Z');

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeLessThanOrEqual(2);
      });
    });

    describe('end date boundary', () => {
      it('should respect endDate boundary', () => {
        const endDate = new Date('2025-01-10T00:00:00Z');
        const recurringItem = createMockRecurringItem({
          frequency: 'daily',
          endDate,
          rruleString: buildRRuleString({
            frequency: 'daily',
            startDate: new Date('2025-01-01T00:00:00Z'),
            endDate,
          }),
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        // All tasks should be on or before end date
        tasks.forEach((task) => {
          expect(task.scheduledDate.getTime()).toBeLessThanOrEqual(
            endDate.getTime()
          );
        });
      });

      it('should not generate tasks past one year from fromDate', () => {
        const recurringItem = createMockRecurringItem({ frequency: 'monthly' });
        const fromDate = new Date('2025-01-01T00:00:00Z');
        const oneYearLater = new Date('2026-01-01T00:00:00Z');

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        tasks.forEach((task) => {
          expect(task.scheduledDate.getTime()).toBeLessThanOrEqual(
            oneYearLater.getTime()
          );
        });
      });
    });

    describe('existing dates handling', () => {
      it('should skip dates in existingDates set', () => {
        const recurringItem = createMockRecurringItem({ frequency: 'daily' });
        const fromDate = new Date('2025-01-01T00:00:00Z');

        // Mark first 3 days as existing
        const existingDates = new Set([
          '2025-01-01',
          '2025-01-02',
          '2025-01-03',
        ]);

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          existingDates
        );

        // Should not include any of the existing dates
        const generatedDateKeys = tasks.map(
          (t) => t.scheduledDate.toISOString().split('T')[0]
        );

        existingDates.forEach((existingDate) => {
          expect(generatedDateKeys).not.toContain(existingDate);
        });
      });

      it('should return empty array when all dates already exist', () => {
        const endDate = new Date('2025-01-05T00:00:00Z');
        const recurringItem = createMockRecurringItem({
          frequency: 'daily',
          endDate,
          rruleString: buildRRuleString({
            frequency: 'daily',
            startDate: new Date('2025-01-01T00:00:00Z'),
            endDate,
          }),
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        // All 5 days marked as existing
        const existingDates = new Set([
          '2025-01-01',
          '2025-01-02',
          '2025-01-03',
          '2025-01-04',
          '2025-01-05',
        ]);

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          existingDates
        );

        expect(tasks).toHaveLength(0);
      });
    });

    describe('due date calculation', () => {
      it('should calculate dueDate as scheduledDate + dueOffsetDays', () => {
        const recurringItem = createMockRecurringItem({
          frequency: 'daily',
          dueOffsetDays: 3,
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(0);

        tasks.forEach((task) => {
          expect(task.dueDate).not.toBeNull();
          if (task.dueDate) {
            const expectedDueTime =
              task.scheduledDate.getTime() + 3 * 24 * 60 * 60 * 1000;
            expect(task.dueDate.getTime()).toBe(expectedDueTime);
          }
        });
      });

      it('should set dueDate to null when dueOffsetDays is 0', () => {
        const recurringItem = createMockRecurringItem({
          frequency: 'daily',
          dueOffsetDays: 0,
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(0);

        tasks.forEach((task) => {
          expect(task.dueDate).toBeNull();
        });
      });
    });

    describe('template field copying', () => {
      it('should copy all template fields from recurring item', () => {
        const recurringItem = createMockRecurringItem({
          title: 'Custom Title',
          description: 'Custom Description',
          categoryId: 'cat-123',
          priority: 'high',
          dailySection: 'afternoon',
          bonusSection: 'bonus',
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(0);

        tasks.forEach((task) => {
          expect(task.userId).toBe(recurringItem.userId);
          expect(task.title).toBe('Custom Title');
          expect(task.description).toBe('Custom Description');
          expect(task.categoryId).toBe('cat-123');
          expect(task.priority).toBe('high');
          expect(task.dailySection).toBe('afternoon');
          expect(task.bonusSection).toBe('bonus');
          expect(task.recurringItemId).toBe(recurringItem.id);
          expect(task.completed).toBe(false);
          expect(task.completedAt).toBeNull();
        });
      });

      it('should handle null description', () => {
        const recurringItem = createMockRecurringItem({
          description: null,
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(0);
        tasks.forEach((task) => {
          expect(task.description).toBeNull();
        });
      });

      it('should handle null categoryId', () => {
        const recurringItem = createMockRecurringItem({
          categoryId: null,
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(0);
        tasks.forEach((task) => {
          expect(task.categoryId).toBeNull();
        });
      });
    });

    describe('position generation', () => {
      it('should generate unique positions for each task', () => {
        const recurringItem = createMockRecurringItem({ frequency: 'daily' });
        const fromDate = new Date('2025-01-01T00:00:00Z');

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(1);

        // Check all positions are unique
        const positions = tasks.map((t) => t.position);
        const uniquePositions = new Set(positions);
        expect(uniquePositions.size).toBe(positions.length);
      });

      it('should generate positions in ascending order', () => {
        const recurringItem = createMockRecurringItem({ frequency: 'daily' });
        const fromDate = new Date('2025-01-01T00:00:00Z');

        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(1);

        // Positions should be in ascending lexicographic order
        for (let i = 1; i < tasks.length; i++) {
          expect(tasks[i].position > tasks[i - 1].position).toBe(true);
        }
      });
    });

    describe('error handling', () => {
      it('should return empty array for invalid rrule string', () => {
        const recurringItem = createMockRecurringItem();
        recurringItem.rruleString = 'invalid-rrule-string';

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks).toHaveLength(0);
      });
    });

    describe('frequency-specific behavior', () => {
      it('should only generate weekday tasks for weekdays frequency', () => {
        const recurringItem = createMockRecurringItem({
          frequency: 'weekdays',
          rruleString: buildRRuleString({
            frequency: 'weekdays',
            startDate: new Date('2025-01-01T00:00:00Z'),
          }),
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(0);
        tasks.forEach((task) => {
          const day = task.scheduledDate.getUTCDay();
          // Should not be Saturday (6) or Sunday (0)
          expect(day).not.toBe(0);
          expect(day).not.toBe(6);
        });
      });

      it('should only generate weekend tasks for weekends frequency', () => {
        const recurringItem = createMockRecurringItem({
          frequency: 'weekends',
          rruleString: buildRRuleString({
            frequency: 'weekends',
            startDate: new Date('2025-01-01T00:00:00Z'),
          }),
        });

        const fromDate = new Date('2025-01-01T00:00:00Z');
        const tasks = generateTasksFromRecurringItem(
          recurringItem,
          fromDate,
          new Set()
        );

        expect(tasks.length).toBeGreaterThan(0);
        tasks.forEach((task) => {
          const day = task.scheduledDate.getUTCDay();
          // Should only be Saturday (6) or Sunday (0)
          expect([0, 6]).toContain(day);
        });
      });
    });
  });
});
