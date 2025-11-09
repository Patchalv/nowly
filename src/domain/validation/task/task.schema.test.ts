import { describe, expect, it } from 'vitest';
import { createTaskSchema } from './task.schema';

describe('task schema', () => {
  it('should validate a valid task', () => {
    const task = {
      title: 'Test Task',
      scheduledDate: new Date(),
    };
    const result = createTaskSchema.safeParse(task);
    expect(result.success).toBe(true);
  });

  it('should reject a task with a title that is too long', () => {
    const task = {
      title: 'Test Task'.repeat(100),
      scheduledDate: new Date(),
    };
    const result = createTaskSchema.safeParse(task);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Title too long');
  });

  it('should reject a task with a scheduled date that is not a date', () => {
    const task = {
      title: 'Test Task',
      scheduledDate: 'not a date',
    };
    const result = createTaskSchema.safeParse(task);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Value must be a Date object');
  });

  it('should reject a task with a scheduled date that is not a date', () => {
    const task = {
      title: 'Test Task',
      scheduledDate: 'not a date',
    };
    const result = createTaskSchema.safeParse(task);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Value must be a Date object');
  });
});
