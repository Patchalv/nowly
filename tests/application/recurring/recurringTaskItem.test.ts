/**
 * Tests for recurring task item use cases
 */

import { createRecurringTaskItem } from '@/src/application/recurring/createRecurringTaskItem.usecase';
import { deleteRecurringTaskItem } from '@/src/application/recurring/deleteRecurringTaskItem.usecase';
import { ensureTasksGenerated } from '@/src/application/recurring/ensureTasksGenerated.usecase';
import { listRecurringTaskItems } from '@/src/application/recurring/listRecurringTaskItems.usecase';
import { updateRecurringTaskItem } from '@/src/application/recurring/updateRecurringTaskItem.usecase';
import { Task } from '@/src/domain/model/Task';
import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import type { CreateRecurringTaskItemInput } from '@/src/domain/validation/recurring/recurringTaskItem.schema';
import type { IRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/IRecurringTaskItemRepository';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { buildRRuleString } from '@/src/infrastructure/utils/rruleBuilder';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Sentry logger
vi.mock('@sentry/nextjs', () => ({
  logger: {
    error: vi.fn(),
  },
}));

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
      weeklyDays: frequency === 'weekly' ? [0, 2, 4] : undefined,
      monthlyDay: frequency === 'monthly' ? 15 : undefined,
      yearlyMonth: frequency === 'yearly' ? 7 : undefined,
      yearlyDay: frequency === 'yearly' ? 4 : undefined,
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

/**
 * Creates a mock task for testing
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).substring(7)}`,
    userId: 'user-456',
    title: 'Test Task',
    description: null,
    scheduledDate: new Date('2025-01-01T00:00:00Z'),
    dueDate: null,
    completed: false,
    completedAt: null,
    categoryId: null,
    priority: 'medium',
    dailySection: null,
    bonusSection: null,
    position: '0|aaaaaa:',
    recurringItemId: 'recurring-item-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock recurring repository
 */
function createMockRecurringRepository(): IRecurringTaskItemRepository {
  return {
    create: vi.fn(),
    getById: vi.fn(),
    getByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateLastGeneratedDate: vi.fn(),
    getItemsNeedingGeneration: vi.fn(),
  };
}

/**
 * Creates a mock task repository
 */
function createMockTaskRepository(): ITaskRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByUserIdAndDate: vi.fn(),
    findByUserIdAndDateRange: vi.fn(),
    findByCategoryId: vi.fn(),
    findByUserIdAndFilters: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findOverdueTasks: vi.fn(),
    bulkUpdateScheduledDate: vi.fn(),
    createBatch: vi.fn(),
    getByRecurringItemId: vi.fn(),
    deleteUncompletedByRecurringItemId: vi.fn(),
  };
}

describe('createRecurringTaskItem', () => {
  let recurringRepository: IRecurringTaskItemRepository;
  let taskRepository: ITaskRepository;

  beforeEach(() => {
    recurringRepository = createMockRecurringRepository();
    taskRepository = createMockTaskRepository();
  });

  it('should create recurring item and generate initial tasks', async () => {
    const input: CreateRecurringTaskItemInput = {
      title: 'Daily Standup',
      frequency: 'daily',
      startDate: new Date('2025-01-01T00:00:00Z'),
      priority: 'medium',
      dueOffsetDays: 0,
    };

    const createdItem = createMockRecurringItem({
      id: 'new-recurring-123',
      title: 'Daily Standup',
    });

    const generatedTasks = [
      createMockTask({ title: 'Daily Standup' }),
      createMockTask({ title: 'Daily Standup' }),
    ];

    vi.mocked(recurringRepository.create).mockResolvedValue(createdItem);
    vi.mocked(taskRepository.createBatch).mockResolvedValue(generatedTasks);
    vi.mocked(recurringRepository.updateLastGeneratedDate).mockResolvedValue(
      undefined
    );

    const result = await createRecurringTaskItem(
      input,
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    expect(result.recurringItem).toBeDefined();
    expect(result.recurringItem?.title).toBe('Daily Standup');
    expect(recurringRepository.create).toHaveBeenCalledWith('user-456', input);
    expect(taskRepository.createBatch).toHaveBeenCalled();
    expect(recurringRepository.updateLastGeneratedDate).toHaveBeenCalled();
  });

  it('should generate correct number of tasks based on frequency limits', async () => {
    const input: CreateRecurringTaskItemInput = {
      title: 'Weekly Review',
      frequency: 'weekly',
      startDate: new Date('2025-01-01T00:00:00Z'),
      priority: 'high',
      dueOffsetDays: 0,
      weeklyDays: [0], // Monday only
    };

    const createdItem = createMockRecurringItem({
      id: 'new-recurring-123',
      title: 'Weekly Review',
      frequency: 'weekly',
      rruleString: buildRRuleString({
        frequency: 'weekly',
        startDate: new Date('2025-01-01T00:00:00Z'),
        weeklyDays: [0],
      }),
    });

    vi.mocked(recurringRepository.create).mockResolvedValue(createdItem);
    vi.mocked(taskRepository.createBatch).mockImplementation(async (tasks) =>
      tasks.map((t, i) =>
        createMockTask({
          id: `task-${i}`,
          title: t.title,
          scheduledDate: t.scheduledDate,
        })
      )
    );
    vi.mocked(recurringRepository.updateLastGeneratedDate).mockResolvedValue(
      undefined
    );

    const result = await createRecurringTaskItem(
      input,
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    // Weekly limit is 8 tasks
    const createBatchCall = vi.mocked(taskRepository.createBatch).mock
      .calls[0][0];
    expect(createBatchCall.length).toBeLessThanOrEqual(8);
  });

  it('should handle repository errors gracefully', async () => {
    const input: CreateRecurringTaskItemInput = {
      title: 'Test Task',
      frequency: 'daily',
      startDate: new Date('2025-01-01T00:00:00Z'),
      priority: 'medium',
      dueOffsetDays: 0,
    };

    vi.mocked(recurringRepository.create).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createRecurringTaskItem(
      input,
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});

describe('deleteRecurringTaskItem', () => {
  let recurringRepository: IRecurringTaskItemRepository;
  let taskRepository: ITaskRepository;

  beforeEach(() => {
    recurringRepository = createMockRecurringRepository();
    taskRepository = createMockTaskRepository();
  });

  it('should delete recurring item and its uncompleted tasks', async () => {
    const existingItem = createMockRecurringItem();

    vi.mocked(recurringRepository.getById).mockResolvedValue(existingItem);
    vi.mocked(
      taskRepository.deleteUncompletedByRecurringItemId
    ).mockResolvedValue(undefined);
    vi.mocked(recurringRepository.delete).mockResolvedValue(undefined);

    const result = await deleteRecurringTaskItem(
      'recurring-item-123',
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    expect(
      taskRepository.deleteUncompletedByRecurringItemId
    ).toHaveBeenCalledWith('recurring-item-123');
    expect(recurringRepository.delete).toHaveBeenCalledWith(
      'recurring-item-123'
    );
  });

  it('should handle non-existent recurring item', async () => {
    vi.mocked(recurringRepository.getById).mockResolvedValue(null);

    const result = await deleteRecurringTaskItem(
      'non-existent-id',
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Recurring task item not found');
    expect(
      taskRepository.deleteUncompletedByRecurringItemId
    ).not.toHaveBeenCalled();
    expect(recurringRepository.delete).not.toHaveBeenCalled();
  });

  it('should handle item belonging to different user', async () => {
    const existingItem = createMockRecurringItem({ userId: 'different-user' });

    vi.mocked(recurringRepository.getById).mockResolvedValue(existingItem);

    const result = await deleteRecurringTaskItem(
      'recurring-item-123',
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Recurring task item not found');
  });
});

describe('updateRecurringTaskItem', () => {
  let recurringRepository: IRecurringTaskItemRepository;
  let taskRepository: ITaskRepository;

  beforeEach(() => {
    recurringRepository = createMockRecurringRepository();
    taskRepository = createMockTaskRepository();
  });

  it('should update recurring item', async () => {
    const existingItem = createMockRecurringItem();
    const updatedItem = createMockRecurringItem({ title: 'Updated Title' });

    vi.mocked(recurringRepository.getById).mockResolvedValue(existingItem);
    vi.mocked(recurringRepository.update).mockResolvedValue(updatedItem);

    const result = await updateRecurringTaskItem(
      'recurring-item-123',
      'user-456',
      { title: 'Updated Title' },
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    expect(result.recurringItem?.title).toBe('Updated Title');
    expect(
      taskRepository.deleteUncompletedByRecurringItemId
    ).not.toHaveBeenCalled();
  });

  it('should clean up tasks when deactivating', async () => {
    const existingItem = createMockRecurringItem({ isActive: true });
    const updatedItem = createMockRecurringItem({ isActive: false });

    vi.mocked(recurringRepository.getById).mockResolvedValue(existingItem);
    vi.mocked(recurringRepository.update).mockResolvedValue(updatedItem);
    vi.mocked(
      taskRepository.deleteUncompletedByRecurringItemId
    ).mockResolvedValue(undefined);

    const result = await updateRecurringTaskItem(
      'recurring-item-123',
      'user-456',
      { isActive: false },
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    expect(
      taskRepository.deleteUncompletedByRecurringItemId
    ).toHaveBeenCalledWith('recurring-item-123');
  });

  it('should not clean up tasks when item was already inactive', async () => {
    const existingItem = createMockRecurringItem({ isActive: false });
    const updatedItem = createMockRecurringItem({ isActive: false });

    vi.mocked(recurringRepository.getById).mockResolvedValue(existingItem);
    vi.mocked(recurringRepository.update).mockResolvedValue(updatedItem);

    const result = await updateRecurringTaskItem(
      'recurring-item-123',
      'user-456',
      { isActive: false },
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    expect(
      taskRepository.deleteUncompletedByRecurringItemId
    ).not.toHaveBeenCalled();
  });

  it('should handle non-existent recurring item', async () => {
    vi.mocked(recurringRepository.getById).mockResolvedValue(null);

    const result = await updateRecurringTaskItem(
      'non-existent-id',
      'user-456',
      { title: 'Updated' },
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Recurring task item not found');
  });
});

describe('ensureTasksGenerated', () => {
  let recurringRepository: IRecurringTaskItemRepository;
  let taskRepository: ITaskRepository;

  beforeEach(() => {
    recurringRepository = createMockRecurringRepository();
    taskRepository = createMockTaskRepository();
  });

  it('should return empty array when no items need generation', async () => {
    vi.mocked(recurringRepository.getItemsNeedingGeneration).mockResolvedValue(
      []
    );

    const result = await ensureTasksGenerated(
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    expect(result.generatedTasks).toEqual([]);
    expect(taskRepository.createBatch).not.toHaveBeenCalled();
  });

  it('should process multiple recurring items', async () => {
    const item1 = createMockRecurringItem({
      id: 'item-1',
      title: 'Daily Task 1',
    });
    const item2 = createMockRecurringItem({
      id: 'item-2',
      title: 'Daily Task 2',
    });

    vi.mocked(recurringRepository.getItemsNeedingGeneration).mockResolvedValue([
      item1,
      item2,
    ]);
    vi.mocked(taskRepository.getByRecurringItemId).mockResolvedValue([]);
    vi.mocked(taskRepository.createBatch).mockImplementation(async (tasks) =>
      tasks.map((t) =>
        createMockTask({
          id: `task-${Math.random()}`,
          title: t.title,
          scheduledDate: t.scheduledDate,
        })
      )
    );
    vi.mocked(recurringRepository.updateLastGeneratedDate).mockResolvedValue(
      undefined
    );

    const result = await ensureTasksGenerated(
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    expect(result.generatedTasks?.length).toBeGreaterThan(0);
    expect(taskRepository.createBatch).toHaveBeenCalledTimes(2);
    expect(recurringRepository.updateLastGeneratedDate).toHaveBeenCalledTimes(
      2
    );
  });

  it('should skip dates that already have tasks', async () => {
    const recurringItem = createMockRecurringItem({
      id: 'item-1',
      startDate: new Date('2025-01-01T00:00:00Z'),
    });

    // Mock existing tasks for first 5 days
    const existingTasks = [
      createMockTask({ scheduledDate: new Date('2025-01-01T00:00:00Z') }),
      createMockTask({ scheduledDate: new Date('2025-01-02T00:00:00Z') }),
      createMockTask({ scheduledDate: new Date('2025-01-03T00:00:00Z') }),
      createMockTask({ scheduledDate: new Date('2025-01-04T00:00:00Z') }),
      createMockTask({ scheduledDate: new Date('2025-01-05T00:00:00Z') }),
    ];

    vi.mocked(recurringRepository.getItemsNeedingGeneration).mockResolvedValue([
      recurringItem,
    ]);
    vi.mocked(taskRepository.getByRecurringItemId).mockResolvedValue(
      existingTasks
    );
    vi.mocked(taskRepository.createBatch).mockImplementation(async (tasks) => {
      // Verify none of the created tasks are for existing dates
      const existingDateKeys = existingTasks
        .filter((t) => t.scheduledDate !== null)
        .map((t) => t.scheduledDate?.toISOString().split('T')[0]);
      tasks.forEach((task) => {
        const taskDateKey = task.scheduledDate?.toISOString().split('T')[0];
        expect(existingDateKeys).not.toContain(taskDateKey);
      });
      return tasks.map((t, idx) =>
        createMockTask({
          id: `task-${idx}`,
          scheduledDate: t.scheduledDate,
        })
      );
    });
    vi.mocked(recurringRepository.updateLastGeneratedDate).mockResolvedValue(
      undefined
    );

    const result = await ensureTasksGenerated(
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
    expect(taskRepository.createBatch).toHaveBeenCalled();
  });

  it('should use lastGeneratedDate + 1 as fromDate when available', async () => {
    const lastGenDate = new Date('2025-01-10T00:00:00Z');
    const recurringItem = createMockRecurringItem({
      id: 'item-1',
      lastGeneratedDate: lastGenDate,
      startDate: new Date('2025-01-01T00:00:00Z'),
    });

    vi.mocked(recurringRepository.getItemsNeedingGeneration).mockResolvedValue([
      recurringItem,
    ]);
    vi.mocked(taskRepository.getByRecurringItemId).mockResolvedValue([]);
    vi.mocked(taskRepository.createBatch).mockImplementation(async (tasks) => {
      // Verify all tasks are after lastGeneratedDate
      tasks.forEach((task) => {
        expect(task.scheduledDate?.getTime()).toBeGreaterThan(
          lastGenDate.getTime()
        );
      });
      return tasks.map((t, idx) =>
        createMockTask({
          id: `task-${idx}`,
          scheduledDate: t.scheduledDate,
        })
      );
    });
    vi.mocked(recurringRepository.updateLastGeneratedDate).mockResolvedValue(
      undefined
    );

    const result = await ensureTasksGenerated(
      'user-456',
      recurringRepository,
      taskRepository
    );

    expect(result.success).toBe(true);
  });
});

describe('listRecurringTaskItems', () => {
  let recurringRepository: IRecurringTaskItemRepository;

  beforeEach(() => {
    recurringRepository = createMockRecurringRepository();
  });

  it('should return all recurring items for user', async () => {
    const items = [
      createMockRecurringItem({ id: 'item-1', title: 'Task 1' }),
      createMockRecurringItem({
        id: 'item-2',
        title: 'Task 2',
        isActive: false,
      }),
    ];

    vi.mocked(recurringRepository.getByUserId).mockResolvedValue(items);

    const result = await listRecurringTaskItems(
      'user-456',
      false,
      recurringRepository
    );

    expect(result.success).toBe(true);
    expect(result.recurringItems).toHaveLength(2);
    expect(recurringRepository.getByUserId).toHaveBeenCalledWith(
      'user-456',
      false
    );
  });

  it('should return only active items when activeOnly is true', async () => {
    const activeItems = [
      createMockRecurringItem({ id: 'item-1', title: 'Active Task' }),
    ];

    vi.mocked(recurringRepository.getByUserId).mockResolvedValue(activeItems);

    const result = await listRecurringTaskItems(
      'user-456',
      true,
      recurringRepository
    );

    expect(result.success).toBe(true);
    expect(result.recurringItems).toHaveLength(1);
    expect(recurringRepository.getByUserId).toHaveBeenCalledWith(
      'user-456',
      true
    );
  });

  it('should handle repository errors gracefully', async () => {
    vi.mocked(recurringRepository.getByUserId).mockRejectedValue(
      new Error('Database error')
    );

    const result = await listRecurringTaskItems(
      'user-456',
      false,
      recurringRepository
    );

    expect(result.success).toBe(false);
    expect(result.recurringItems).toEqual([]);
    expect(result.error).toBe('Database error');
  });
});
