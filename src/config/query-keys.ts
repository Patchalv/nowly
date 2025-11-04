/**
 * Centralized query keys for React Query
 * Helps maintain consistency and type safety
 */

export const queryKeys = {
  // Auth keys
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },

  // User profile keys
  profile: {
    all: ['profile'] as const,
    detail: (userId: string) => ['profile', userId] as const,
  },

  // Categories keys
  categories: {
    all: ['categories'] as const,
    detail: (categoryId: string) => ['categories', categoryId] as const,
  },

  // Tasks keys (will be used in Phase 1)
  tasks: {
    all: ['tasks'] as const,
    byDate: (date: string) => ['tasks', 'date', date] as const,
    byId: (taskId: string) => ['tasks', taskId] as const,
    completed: ['tasks', 'completed'] as const,
    incomplete: ['tasks', 'incomplete'] as const,
  },

  // Recurring tasks keys (will be used in Phase 6)
  recurringTasks: {
    all: ['recurring-tasks'] as const,
    detail: (recurringTaskId: string) =>
      ['recurring-tasks', recurringTaskId] as const,
  },
} as const;
