// This file will be updated later with auto-generated types
// For now, we'll use a basic type definition

import type { RecurringFrequency } from '@/src/domain/types/recurring';
import type {
  BonusSection,
  DailySection,
  TaskPriority,
} from '@/src/domain/types/tasks';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Database row types (snake_case, matches Supabase schema)
 */

/**
 * Task row from database
 * DATE fields are stored as YYYY-MM-DD strings
 * TIMESTAMPTZ fields are stored as ISO strings
 */
export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  scheduled_date: string | null; // ISO string from DB
  due_date: string | null; // ISO string from DB
  completed: boolean;
  completed_at: string | null; // TIMESTAMPTZ: ISO string
  category_id: string | null;
  priority: TaskPriority | null;
  daily_section: DailySection | null;
  bonus_section: BonusSection | null;
  position: string;
  recurring_item_id: string | null;
  created_at: string; // TIMESTAMPTZ: ISO string
  updated_at: string; // TIMESTAMPTZ: ISO string
}

/**
 * Category row from database
 */
export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  position: string;
  created_at: string; // TIMESTAMPTZ: ISO string
  updated_at: string; // TIMESTAMPTZ: ISO string
}

/**
 * User profile row from database
 */
export interface UserProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  timezone: string | null; // IANA timezone identifier (e.g., "America/New_York")
  created_at: string; // TIMESTAMPTZ: ISO string
  updated_at: string; // TIMESTAMPTZ: ISO string
}

/**
 * Recurring task item row from database
 * DATE fields are stored as YYYY-MM-DD strings
 * TIMESTAMPTZ fields are stored as ISO strings
 */
export interface RecurringTaskItemRow {
  id: string;
  user_id: string;

  // Task template fields
  title: string;
  description: string | null;
  category_id: string | null;
  priority: TaskPriority | null; // Nullable to match database schema (DEFAULT 'medium' but no NOT NULL)
  daily_section: DailySection | null;
  bonus_section: BonusSection | null;

  // Recurrence configuration
  frequency: RecurringFrequency;
  rrule_string: string;

  // Schedule boundaries
  start_date: string; // DATE: YYYY-MM-DD string
  end_date: string | null; // DATE: YYYY-MM-DD string
  due_offset_days: number;

  // Generation tracking
  last_generated_date: string | null; // DATE: YYYY-MM-DD string
  tasks_to_generate_ahead: number;

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string; // TIMESTAMPTZ: ISO string
  updated_at: string; // TIMESTAMPTZ: ISO string
}

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow;
        Insert: Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>>;
      };
      categories: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CategoryRow, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_profiles: {
        Row: UserProfileRow;
        Insert: Omit<UserProfileRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<UserProfileRow, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      recurring_task_items: {
        Row: RecurringTaskItemRow;
        Insert: Omit<RecurringTaskItemRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<RecurringTaskItemRow, 'id' | 'created_at' | 'updated_at'>
        >;
      };
    };
    Views: {
      [key: string]: unknown;
    };
    Functions: {
      rebalance_tasks: {
        Args: {
          p_user_id: string;
          p_updates: Json;
        };
        Returns: Array<{
          task_id: string;
          success: boolean;
          error_message: string | null;
        }>;
      };
    };
    Enums: {
      priority_level: 'high' | 'medium' | 'low';
      daily_section_type: 'morning' | 'afternoon' | 'evening';
      bonus_section_type: 'essential' | 'bonus';
      recurring_frequency:
        | 'daily'
        | 'weekly'
        | 'monthly'
        | 'yearly'
        | 'weekdays'
        | 'weekends';
    };
  };
}

/**
 * Common types for Supabase utilities
 */

export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

export type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type AuthUser = {
  id: string;
  email: string | undefined;
  created_at: string;
};

export type QueryOptions = {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
};
