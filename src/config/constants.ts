/**
 * Application Constants
 *
 * Centralized location for all application-wide constants.
 * These are static values that don't change based on environment.
 *
 * @module config/constants
 *
 * Usage:
 * ```typescript
 * import { APP_NAME, TASK_LIMITS } from '@/src/config/constants';
 * ```
 */

// ------------------------------------------------------------------------------
// Application Metadata
// ------------------------------------------------------------------------------
export const APP_NAME = 'Nowly' as const;
export const APP_DESCRIPTION =
  'Today-first task management for focused productivity' as const;
export const APP_VERSION = '1.0.0' as const;

// ------------------------------------------------------------------------------
// Task Configuration
// ------------------------------------------------------------------------------
export const TASK_LIMITS = {
  /** Maximum length for task title */
  TITLE_MAX_LENGTH: 255,
  /** Minimum length for task title */
  TITLE_MIN_LENGTH: 1,
  /** Maximum length for task description */
  DESCRIPTION_MAX_LENGTH: 5000,
  /** Maximum number of tasks per user (soft limit) */
  MAX_TASKS_PER_USER: 10000,
  /** Maximum number of tasks to fetch at once */
  MAX_TASKS_PER_FETCH: 1000,
} as const;

// ------------------------------------------------------------------------------
// Category Configuration
// ------------------------------------------------------------------------------
export const CATEGORY_LIMITS = {
  /** Maximum length for category name */
  NAME_MAX_LENGTH: 50,
  /** Minimum length for category name */
  NAME_MIN_LENGTH: 1,
  /** Maximum number of categories per user */
  MAX_CATEGORIES_PER_USER: 50,
  /** Number of default categories created on user signup */
  DEFAULT_CATEGORIES_COUNT: 3,
} as const;

// ------------------------------------------------------------------------------
// Default Categories (created on user signup)
// ------------------------------------------------------------------------------
export const DEFAULT_CATEGORIES = [
  {
    name: 'Work',
    color: '#3B82F6', // blue-500
    emoji: '💼',
  },
  {
    name: 'Personal',
    color: '#10B981', // green-500
    emoji: '🏠',
  },
  {
    name: 'Health',
    color: '#EF4444', // red-500
    emoji: '❤️',
  },
] as const;

// ------------------------------------------------------------------------------
// Recurring Task Configuration
// ------------------------------------------------------------------------------
export const RECURRING_TASK_LIMITS = {
  /** Maximum number of tasks to generate ahead of time */
  MAX_TASKS_TO_GENERATE_AHEAD: 30,
  /** Default number of tasks to generate ahead */
  DEFAULT_TASKS_TO_GENERATE_AHEAD: 7,
  /** Maximum due date offset in days */
  MAX_DUE_OFFSET_DAYS: 365,
  /** Maximum recurrence duration in years */
  MAX_RECURRENCE_YEARS: 5,
} as const;

// ------------------------------------------------------------------------------
// Date & Time Configuration
// ------------------------------------------------------------------------------
export const DATE_FORMATS = {
  /** Display format for dates (e.g., "Jan 15, 2025") */
  DISPLAY: 'MMM dd, yyyy',
  /** Display format for dates with day of week (e.g., "Mon, Jan 15") */
  DISPLAY_WITH_DAY: 'EEE, MMM dd',
  /** ISO format for API/database */
  ISO: 'yyyy-MM-dd',
  /** Display format for timestamps (e.g., "Jan 15, 2025 at 3:30 PM") */
  DISPLAY_WITH_TIME: "MMM dd, yyyy 'at' h:mm a",
} as const;

// ------------------------------------------------------------------------------
// UI Configuration
// ------------------------------------------------------------------------------
export const UI = {
  /** Default theme */
  DEFAULT_THEME: 'system' as const,
  /** Available themes */
  THEMES: ['light', 'dark', 'system'] as const,
  /** Debounce delay for search input (ms) */
  SEARCH_DEBOUNCE_MS: 300,
  /** Toast notification duration (ms) */
  TOAST_DURATION_MS: 3000,
  /** Animation duration for transitions (ms) */
  ANIMATION_DURATION_MS: 200,
} as const;

// ------------------------------------------------------------------------------
// Pagination & Infinite Scroll
// ------------------------------------------------------------------------------
export const PAGINATION = {
  /** Default page size for task lists */
  DEFAULT_PAGE_SIZE: 50,
  /** Page size options for user selection */
  PAGE_SIZE_OPTIONS: [25, 50, 100, 200] as const,
  /** Number of items to fetch per infinite scroll batch */
  INFINITE_SCROLL_BATCH_SIZE: 50,
} as const;

// ------------------------------------------------------------------------------
// Caching & Performance
// ------------------------------------------------------------------------------
export const CACHE = {
  /** React Query stale time for tasks (ms) */
  TASKS_STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes
  /** React Query stale time for categories (ms) */
  CATEGORIES_STALE_TIME_MS: 15 * 60 * 1000, // 15 minutes
  /** React Query stale time for user profile (ms) */
  USER_PROFILE_STALE_TIME_MS: 30 * 60 * 1000, // 30 minutes
} as const;

// ------------------------------------------------------------------------------
// Validation Messages
// ------------------------------------------------------------------------------
export const VALIDATION_MESSAGES = {
  TASK: {
    TITLE_REQUIRED: 'Task title is required',
    TITLE_TOO_SHORT: 'Task title must be at least 1 character',
    TITLE_TOO_LONG: `Task title must be at most ${TASK_LIMITS.TITLE_MAX_LENGTH} characters`,
    DESCRIPTION_TOO_LONG: `Task description must be at most ${TASK_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
    DUE_DATE_BEFORE_SCHEDULED:
      'Due date must be on or after the scheduled date',
  },
  CATEGORY: {
    NAME_REQUIRED: 'Category name is required',
    NAME_TOO_SHORT: 'Category name must be at least 1 character',
    NAME_TOO_LONG: `Category name must be at most ${CATEGORY_LIMITS.NAME_MAX_LENGTH} characters`,
    COLOR_REQUIRED: 'Category color is required',
    EMOJI_REQUIRED: 'Category emoji is required',
  },
} as const;

// ------------------------------------------------------------------------------
// Route Paths
// ------------------------------------------------------------------------------
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',

  // Protected routes
  DAILY: '/daily',
  TASKS: '/tasks',
  CATEGORIES: '/categories',
  SETTINGS: '/settings',
  PROFILE: '/profile',

  // API routes
  API: {
    TASKS: '/api/tasks',
    CATEGORIES: '/api/categories',
    RECURRING_TASKS: '/api/recurring-tasks',
  },
} as const;

// ------------------------------------------------------------------------------
// Public Routes (for authentication proxy)
// ------------------------------------------------------------------------------
export const PUBLIC_ROUTES = [
  ROUTES.HOME, // '/'
  ROUTES.LOGIN, // '/login'
  ROUTES.SIGNUP, // '/signup'
] as const;

// ------------------------------------------------------------------------------
// Local Storage Keys
// ------------------------------------------------------------------------------
export const STORAGE_KEYS = {
  /** User's theme preference */
  THEME: 'nowly-theme',
  /** User's selected date in daily view */
  SELECTED_DATE: 'nowly-selected-date',
  /** User's task list preferences (sort, filter, etc.) */
  TASK_PREFERENCES: 'nowly-task-preferences',
  /** User's last viewed route */
  LAST_ROUTE: 'nowly-last-route',
} as const;

// ------------------------------------------------------------------------------
// Priority Configuration
// ------------------------------------------------------------------------------
export const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    color: '#EF4444', // red-500
    icon: '🔴',
  },
  medium: {
    label: 'Medium',
    color: '#F59E0B', // amber-500
    icon: '🟡',
  },
  low: {
    label: 'Low',
    color: '#10B981', // green-500
    icon: '🟢',
  },
} as const;

// ------------------------------------------------------------------------------
// Daily Section Configuration
// ------------------------------------------------------------------------------
export const DAILY_SECTION_CONFIG = {
  morning: {
    label: 'Morning',
    timeRange: '6:00 AM - 12:00 PM',
    icon: '🌅',
  },
  afternoon: {
    label: 'Afternoon',
    timeRange: '12:00 PM - 6:00 PM',
    icon: '☀️',
  },
  evening: {
    label: 'Evening',
    timeRange: '6:00 PM - 12:00 AM',
    icon: '🌙',
  },
} as const;

// ------------------------------------------------------------------------------
// Bonus Section Configuration
// ------------------------------------------------------------------------------
export const BONUS_SECTION_CONFIG = {
  essential: {
    label: 'Essential',
    description: 'Must-do tasks for today',
    icon: '⭐',
  },
  bonus: {
    label: 'Bonus',
    description: 'Nice-to-have tasks if time permits',
    icon: '🎁',
  },
} as const;

// ------------------------------------------------------------------------------
// Recurrence Frequency Configuration
// ------------------------------------------------------------------------------
export const RECURRENCE_FREQUENCY_CONFIG = {
  daily: {
    label: 'Daily',
    description: 'Repeats every day',
  },
  weekly: {
    label: 'Weekly',
    description: 'Repeats every week',
  },
  monthly: {
    label: 'Monthly',
    description: 'Repeats every month',
  },
  yearly: {
    label: 'Yearly',
    description: 'Repeats every year',
  },
  weekdays: {
    label: 'Weekdays',
    description: 'Repeats Monday through Friday',
  },
  weekends: {
    label: 'Weekends',
    description: 'Repeats Saturday and Sunday',
  },
} as const;
