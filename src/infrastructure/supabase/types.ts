// This file will be updated later with auto-generated types
// For now, we'll use a basic type definition

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
  priority: 'high' | 'medium' | 'low' | null;
  daily_section: 'morning' | 'afternoon' | 'evening' | null;
  bonus_section: 'essential' | 'bonus' | null;
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
  emoji: string | null;
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
    };
    Views: {
      [key: string]: unknown;
    };
    Functions: {
      [key: string]: unknown;
    };
    Enums: {
      priority_level: 'high' | 'medium' | 'low';
      daily_section_type: 'morning' | 'afternoon' | 'evening';
      bonus_section_type: 'essential' | 'bonus';
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
