import { supabase } from '@/src/infrastructure/supabase/client';
import type { QueryOptions, SupabaseResponse } from '../types';

/**
 * Database utility functions
 */

/**
 * Generic select query with options
 */
export async function selectFrom<T>(
  table: string,
  columns: string = '*',
  options?: QueryOptions & {
    filters?: Record<string, any>;
  }
): Promise<SupabaseResponse<T[]>> {
  try {
    let query = supabase.from(table).select(columns);

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? true,
      });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 50) - 1
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    return {
      data: data as T[],
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Select query failed'),
    };
  }
}

/**
 * Generic insert query
 */
export async function insertInto<T>(
  table: string,
  values: Partial<T> | Partial<T>[]
): Promise<SupabaseResponse<T[]>> {
  try {
    const { data, error } = await supabase.from(table).insert(values).select();

    if (error) throw error;

    return {
      data: data as T[],
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Insert query failed'),
    };
  }
}

/**
 * Generic update query
 */
export async function updateTable<T>(
  table: string,
  id: string,
  values: Partial<T>
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(values)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as T,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Update query failed'),
    };
  }
}

/**
 * Generic delete query
 */
export async function deleteFrom(
  table: string,
  id: string
): Promise<SupabaseResponse<null>> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) throw error;

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Delete query failed'),
    };
  }
}

/**
 * Get single record by ID
 */
export async function getById<T>(
  table: string,
  id: string,
  columns: string = '*'
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      data: data as T,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Get by ID failed'),
    };
  }
}
