/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Tests for position generation utilities
 */

import type { Task } from '@/src/domain/model/Task';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import {
  generateNextPosition,
  generatePositionForNewTask,
} from '@/src/infrastructure/utils/position';
import { LexoRank } from 'lexorank';
import { describe, expect, it, vi } from 'vitest';

describe('position generation utilities', () => {
  describe('generateNextPosition', () => {
    it('should return min position when no existing positions', () => {
      const result = generateNextPosition([]);
      expect(result).toBe(LexoRank.min().toString());
    });

    it('should generate next position from single existing position', () => {
      const existingPosition = LexoRank.min().toString();
      const result = generateNextPosition([existingPosition]);

      // Result should be greater than the existing position
      const existingRank = LexoRank.parse(existingPosition);
      const resultRank = LexoRank.parse(result);
      expect(resultRank.compareTo(existingRank)).toBeGreaterThan(0);
    });

    it('should append to end when multiple positions exist', () => {
      const positions = [
        LexoRank.min().toString(),
        LexoRank.min().genNext().toString(),
        LexoRank.min().genNext().genNext().toString(),
      ];

      const result = generateNextPosition(positions);

      // Result should be greater than the last position
      const lastPosition = positions[positions.length - 1]!;
      const lastRank = LexoRank.parse(lastPosition);
      const resultRank = LexoRank.parse(result);
      expect(resultRank.compareTo(lastRank)).toBeGreaterThan(0);
    });

    it('should handle unsorted positions correctly', () => {
      // Create positions out of order
      const pos1 = LexoRank.min().toString();
      const pos2 = LexoRank.min().genNext().genNext().toString();
      const pos3 = LexoRank.min().genNext().toString();

      const unsortedPositions = [pos1, pos2, pos3];
      const result = generateNextPosition(unsortedPositions);

      // Should generate position after the maximum (pos2)
      const maxRank = LexoRank.parse(pos2);
      const resultRank = LexoRank.parse(result);
      expect(resultRank.compareTo(maxRank)).toBeGreaterThan(0);
    });

    it('should handle invalid position strings gracefully', () => {
      const invalidPositions = ['invalid', 'not-a-lexorank'];
      const result = generateNextPosition(invalidPositions);

      // Should fall back to generating from min
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle mixed valid and invalid positions', () => {
      const validPosition = LexoRank.min().toString();
      const positions = [validPosition, 'invalid', 'also-invalid'];
      const result = generateNextPosition(positions);

      // Should generate next position from valid position
      const validRank = LexoRank.parse(validPosition);
      const resultRank = LexoRank.parse(result);
      expect(resultRank.compareTo(validRank)).toBeGreaterThan(0);
    });

    it('should ignore invalid position that sorts last (e.g., zzzz)', () => {
      // Create valid positions
      const pos1 = LexoRank.min().toString();
      const pos2 = LexoRank.min().genNext().toString();
      const pos3 = LexoRank.min().genNext().genNext().toString();

      // Add invalid position that would sort last lexicographically
      const positions = [pos1, pos2, pos3, 'zzzz'];

      const result = generateNextPosition(positions);

      // Should generate position after the highest VALID position (pos3), not after 'zzzz'
      const maxValidRank = LexoRank.parse(pos3);
      const resultRank = LexoRank.parse(result);

      // Result should be greater than pos3 (the max valid position)
      expect(resultRank.compareTo(maxValidRank)).toBeGreaterThan(0);

      // Result should NOT be less than or equal to pos3 (which would happen if we used min().genNext())
      // This ensures we don't break ordering guarantees
      expect(resultRank.compareTo(maxValidRank)).not.toBeLessThanOrEqual(0);
    });

    it('should generate unique positions for sequential calls', () => {
      const positions: string[] = [];
      const first = generateNextPosition(positions);
      positions.push(first);
      const second = generateNextPosition(positions);
      positions.push(second);
      const third = generateNextPosition(positions);

      // All positions should be unique and in order
      expect(first).not.toBe(second);
      expect(second).not.toBe(third);
      expect(first).not.toBe(third);

      const firstRank = LexoRank.parse(first);
      const secondRank = LexoRank.parse(second);
      const thirdRank = LexoRank.parse(third);

      expect(firstRank.compareTo(secondRank)).toBeLessThan(0);
      expect(secondRank.compareTo(thirdRank)).toBeLessThan(0);
    });
  });

  describe('generatePositionForNewTask', () => {
    const mockUserId = 'user-123';
    const mockDate = new Date(2024, 0, 15); // Jan 15, 2024

    it('should return min position when no existing tasks', async () => {
      const mockRepository: ITaskRepository = {
        create: vi.fn(),
        findById: vi.fn(),
        findByUserIdAndDate: vi.fn().mockResolvedValue([]),
        findByUserIdAndDateRange: vi.fn().mockResolvedValue([]),
        findByCategoryId: vi.fn().mockResolvedValue([]),
        findByUserIdAndFilters: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
        delete: vi.fn(),
      };

      const result = await generatePositionForNewTask(
        mockUserId,
        mockDate,
        mockRepository
      );

      expect(result).toBe(LexoRank.min().toString());
      expect(mockRepository.findByUserIdAndDate).toHaveBeenCalledWith(
        mockUserId,
        mockDate
      );
    });

    it('should generate next position from existing tasks', async () => {
      const existingTasks: Task[] = [
        {
          id: 'task-1',
          userId: mockUserId,
          title: 'Task 1',
          description: null,
          scheduledDate: mockDate,
          dueDate: null,
          completed: false,
          completedAt: null,
          categoryId: null,
          priority: null,
          dailySection: null,
          bonusSection: null,
          position: LexoRank.min().toString(),
          recurringItemId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task-2',
          userId: mockUserId,
          title: 'Task 2',
          description: null,
          scheduledDate: mockDate,
          dueDate: null,
          completed: false,
          completedAt: null,
          categoryId: null,
          priority: null,
          dailySection: null,
          bonusSection: null,
          position: LexoRank.min().genNext().toString(),
          recurringItemId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRepository: ITaskRepository = {
        create: vi.fn(),
        findById: vi.fn(),
        findByUserIdAndDate: vi.fn().mockResolvedValue(existingTasks),
        findByUserIdAndDateRange: vi.fn().mockResolvedValue([]),
        findByCategoryId: vi.fn().mockResolvedValue([]),
        findByUserIdAndFilters: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
        delete: vi.fn(),
      };

      const result = await generatePositionForNewTask(
        mockUserId,
        mockDate,
        mockRepository
      );

      // Should generate position after the last task
      const lastPosition = existingTasks[existingTasks.length - 1]!.position;
      const lastRank = LexoRank.parse(lastPosition);
      const resultRank = LexoRank.parse(result);
      expect(resultRank.compareTo(lastRank)).toBeGreaterThan(0);
    });

    it('should handle repository errors gracefully', async () => {
      const mockRepository: ITaskRepository = {
        create: vi.fn(),
        findById: vi.fn(),
        findByUserIdAndDate: vi
          .fn()
          .mockRejectedValue(new Error('Database error')),
        findByUserIdAndDateRange: vi.fn().mockResolvedValue([]),
        findByCategoryId: vi.fn().mockResolvedValue([]),
        findByUserIdAndFilters: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
        delete: vi.fn(),
      };

      const result = await generatePositionForNewTask(
        mockUserId,
        mockDate,
        mockRepository
      );

      // Should fall back to min position on error
      expect(result).toBe(LexoRank.min().toString());
    });

    it('should scope positions per user and date', async () => {
      const differentDate = new Date(2024, 0, 16); // Different date
      const tasksForDate1: Task[] = [
        {
          id: 'task-1',
          userId: mockUserId,
          title: 'Task 1',
          description: null,
          scheduledDate: mockDate,
          dueDate: null,
          completed: false,
          completedAt: null,
          categoryId: null,
          priority: null,
          dailySection: null,
          bonusSection: null,
          position: LexoRank.min().toString(),
          recurringItemId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const tasksForDate2: Task[] = [
        {
          id: 'task-2',
          userId: mockUserId,
          title: 'Task 2',
          description: null,
          scheduledDate: differentDate,
          dueDate: null,
          completed: false,
          completedAt: null,
          categoryId: null,
          priority: null,
          dailySection: null,
          bonusSection: null,
          position: LexoRank.min().toString(), // Same position as date1
          recurringItemId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRepository: ITaskRepository = {
        create: vi.fn(),
        findById: vi.fn(),
        findByUserIdAndDate: vi
          .fn()
          .mockImplementation((userId: string, date: Date) => {
            if (date.getTime() === mockDate.getTime()) {
              return Promise.resolve(tasksForDate1);
            }
            return Promise.resolve(tasksForDate2);
          }),
        findByUserIdAndDateRange: vi.fn().mockResolvedValue([]),
        findByCategoryId: vi.fn().mockResolvedValue([]),
        findByUserIdAndFilters: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
        delete: vi.fn(),
      };

      // Generate position for date1
      const position1 = await generatePositionForNewTask(
        mockUserId,
        mockDate,
        mockRepository
      );

      // Generate position for date2 (should be independent)
      const position2 = await generatePositionForNewTask(
        mockUserId,
        differentDate,
        mockRepository
      );

      // Both should generate next position from their respective last tasks
      // Since both dates have tasks with min position, both should generate next
      expect(position1).not.toBe(LexoRank.min().toString());
      expect(position2).not.toBe(LexoRank.min().toString());
    });

    it('should handle tasks with same position (collision scenario)', async () => {
      const samePosition = LexoRank.min().toString();
      const existingTasks: Task[] = [
        {
          id: 'task-1',
          userId: mockUserId,
          title: 'Task 1',
          description: null,
          scheduledDate: mockDate,
          dueDate: null,
          completed: false,
          completedAt: null,
          categoryId: null,
          priority: null,
          dailySection: null,
          bonusSection: null,
          position: samePosition,
          recurringItemId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task-2',
          userId: mockUserId,
          title: 'Task 2',
          description: null,
          scheduledDate: mockDate,
          dueDate: null,
          completed: false,
          completedAt: null,
          categoryId: null,
          priority: null,
          dailySection: null,
          bonusSection: null,
          position: samePosition, // Same position (collision)
          recurringItemId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRepository: ITaskRepository = {
        create: vi.fn(),
        findById: vi.fn(),
        findByUserIdAndDate: vi.fn().mockResolvedValue(existingTasks),
        findByUserIdAndDateRange: vi.fn().mockResolvedValue([]),
        findByCategoryId: vi.fn().mockResolvedValue([]),
        findByUserIdAndFilters: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
        delete: vi.fn(),
      };

      const result = await generatePositionForNewTask(
        mockUserId,
        mockDate,
        mockRepository
      );

      // Should still generate a valid position
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // Should be greater than or equal to the same position
      const sameRank = LexoRank.parse(samePosition);
      const resultRank = LexoRank.parse(result);
      expect(resultRank.compareTo(sameRank)).toBeGreaterThanOrEqual(0);
    });
  });
});
