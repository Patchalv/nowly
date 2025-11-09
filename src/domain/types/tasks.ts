//Task-related types
export type TaskPriority = 'high' | 'medium' | 'low';
export type DailySection = 'morning' | 'afternoon' | 'evening';
export type BonusSection = 'essential' | 'bonus';

// Sorting and filtering types (for future use)
export type TaskSortOption =
  | 'title-asc'
  | 'title-desc'
  | 'category-asc'
  | 'category-desc'
  | 'priority'
  | 'due-date'
  | 'created';

export type TaskGroupOption =
  | 'category'
  | 'bonus-section'
  | 'daily-section'
  | 'priority'
  | 'none';

// Recurrence types (for Phase 6)
export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'weekdays'
  | 'weekends';
