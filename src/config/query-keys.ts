/**
 * Centralized query keys for React Query
 * Helps maintain consistency and type safety
 */

import { startOfWeek } from 'date-fns';
import { TaskFilters } from '../presentation/hooks/tasks/types';

export const queryKeys = {
  // Auth keys
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },

  // User profile keys
  profile: {
    all: ['profile'] as const,
    detail: ['profile', 'detail'] as const,
  },

  // Categories keys
  categories: {
    all: ['categories'] as const,
    detail: (categoryId: string) => ['categories', categoryId] as const,
  },

  // Tasks keys (will be used in Phase 1)
  tasks: {
    all: ['tasks'] as const,
    list: (filters: TaskFilters) => ['tasks', 'list', filters] as const,
    byDate: (date: string) => ['tasks', 'date', date] as const,
    byWeek: (date: Date) => {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      return ['tasks', 'week', weekStart.toISOString()] as const;
    },
  },

  // Recurring tasks keys (will be used in Phase 6)
  recurringTasks: {
    all: ['recurring-tasks'] as const,
    detail: (recurringTaskId: string) =>
      ['recurring-tasks', recurringTaskId] as const,
  },
} as const;
