import type { RecurringTaskItem } from '@/src/domain/types/recurring';
import type {
  CreateRecurringTaskItemInput,
  UpdateRecurringTaskItemInput,
} from '@/src/domain/validation/recurring/recurringTaskItem.schema';
import { handleError } from '@/src/shared/errors/handler';
import { logger } from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, RecurringTaskItemRow } from '../../supabase/types';
import {
  dateFromDatabase,
  dateToDatabase,
  timestampFromDatabase,
} from '../../supabase/utils/dates';
import { buildRRuleString } from '../../utils/rruleBuilder';
import type { IRecurringTaskItemRepository } from './IRecurringTaskItemRepository';

export class SupabaseRecurringTaskItemRepository implements IRecurringTaskItemRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Transform database row (snake_case, ISO strings) to domain entity (camelCase, Date objects)
   * - DATE fields (start_date, end_date, last_generated_date) use dateFromDatabase
   * - TIMESTAMPTZ fields (created_at, updated_at) use timestampFromDatabase
   */
  private toDomain(row: RecurringTaskItemRow): RecurringTaskItem {
    const startDate = dateFromDatabase(row.start_date);
    if (!startDate) {
      throw new Error(
        `Invalid start_date for recurring task item ${row.id}: ${row.start_date}`
      );
    }

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      priority: row.priority,
      dailySection: row.daily_section,
      bonusSection: row.bonus_section,
      frequency: row.frequency,
      rruleString: row.rrule_string,
      startDate,
      endDate: dateFromDatabase(row.end_date),
      dueOffsetDays: row.due_offset_days,
      lastGeneratedDate: dateFromDatabase(row.last_generated_date),
      tasksToGenerateAhead: row.tasks_to_generate_ahead,
      isActive: row.is_active,
      createdAt: timestampFromDatabase(row.created_at),
      updatedAt: timestampFromDatabase(row.updated_at),
    };
  }

  /**
   * Transform domain input to database row for insert
   */
  private toInsert(
    userId: string,
    input: CreateRecurringTaskItemInput,
    rruleString: string
  ): Database['public']['Tables']['recurring_task_items']['Insert'] {
    const startDateStr = dateToDatabase(input.startDate);
    if (!startDateStr) {
      throw new Error('Invalid startDate provided for recurring task item');
    }

    return {
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      category_id: input.categoryId ?? null,
      priority: input.priority ?? null,
      daily_section: input.dailySection ?? null,
      bonus_section: input.bonusSection ?? null,
      frequency: input.frequency,
      rrule_string: rruleString,
      start_date: startDateStr,
      end_date: dateToDatabase(input.endDate ?? null),
      due_offset_days: input.dueOffsetDays,
      last_generated_date: null,
      tasks_to_generate_ahead: 15,
      is_active: true,
    };
  }

  /**
   * Transform update input to database row for update
   */
  private toDatabase(
    input: UpdateRecurringTaskItemInput
  ): Database['public']['Tables']['recurring_task_items']['Update'] {
    const result: Database['public']['Tables']['recurring_task_items']['Update'] =
      {};

    if (input.title !== undefined) result.title = input.title;
    if (input.description !== undefined)
      result.description = input.description ?? null;
    if (input.categoryId !== undefined)
      result.category_id = input.categoryId ?? null;
    if (input.priority !== undefined) result.priority = input.priority;
    if (input.dailySection !== undefined)
      result.daily_section = input.dailySection ?? null;
    if (input.bonusSection !== undefined)
      result.bonus_section = input.bonusSection ?? null;
    if (input.endDate !== undefined)
      result.end_date = dateToDatabase(input.endDate ?? null);
    if (input.isActive !== undefined) result.is_active = input.isActive;

    return result;
  }

  /**
   * Create a new recurring task item
   * Generates RRULE string from frequency configuration
   */
  async create(
    userId: string,
    input: CreateRecurringTaskItemInput
  ): Promise<RecurringTaskItem> {
    // Build the RRULE string from the frequency configuration
    const rruleString = buildRRuleString({
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate,
      weeklyDays: input.weeklyDays,
      monthlyDay: input.monthlyDay,
      yearlyMonth: input.yearlyMonth,
      yearlyDay: input.yearlyDay,
    });

    const row = this.toInsert(userId, input, rruleString);

    const { data, error } = await this.client
      .from('recurring_task_items')
      .insert(row as never)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create recurring task item', { error });
      throw new Error(`Failed to create recurring task item: ${error.message}`);
    }
    if (!data) {
      logger.error('No data returned after insert');
      throw new Error('No data returned after insert');
    }

    return this.toDomain(data);
  }

  /**
   * Find a recurring task item by ID
   */
  async getById(id: string): Promise<RecurringTaskItem | null> {
    const { data, error } = await this.client
      .from('recurring_task_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') return null; // Not found
    if (error) {
      logger.error('Failed to find recurring task item', { error });
      throw new Error(`Failed to find recurring task item: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find all recurring task items for a user
   */
  async getByUserId(
    userId: string,
    activeOnly: boolean = false
  ): Promise<RecurringTaskItem[]> {
    let query = this.client
      .from('recurring_task_items')
      .select('*')
      .eq('user_id', userId);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      handleError.throw(error);
    }

    return data ? data.map((row) => this.toDomain(row)) : [];
  }

  /**
   * Update a recurring task item
   */
  async update(
    id: string,
    input: UpdateRecurringTaskItemInput
  ): Promise<RecurringTaskItem> {
    const row = this.toDatabase(input);

    const { data, error } = await this.client
      .from('recurring_task_items')
      .update(row as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update recurring task item', { error });
      throw new Error(`Failed to update recurring task item: ${error.message}`);
    }
    if (!data) {
      logger.error('No data returned after update');
      throw new Error('No data returned after update');
    }

    return this.toDomain(data);
  }

  /**
   * Delete a recurring task item
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('recurring_task_items')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete recurring task item', { error });
      throw new Error(`Failed to delete recurring task item: ${error.message}`);
    }
  }

  /**
   * Update the last generated date for a recurring task item
   */
  async updateLastGeneratedDate(id: string, date: Date): Promise<void> {
    const dateStr = dateToDatabase(date);

    const { error } = await this.client
      .from('recurring_task_items')
      .update({ last_generated_date: dateStr } as never)
      .eq('id', id);

    if (error) {
      logger.error('Failed to update last generated date', { error });
      throw new Error(`Failed to update last generated date: ${error.message}`);
    }
  }

  /**
   * Get all active items that need task generation
   * Returns items where is_active = true AND
   * (last_generated_date IS NULL OR last_generated_date < today)
   */
  async getItemsNeedingGeneration(
    userId: string
  ): Promise<RecurringTaskItem[]> {
    const today = dateToDatabase(new Date());

    // First, get items where last_generated_date is null
    const { data: nullDateItems, error: nullError } = await this.client
      .from('recurring_task_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('last_generated_date', null);

    if (nullError) {
      handleError.throw(nullError);
    }

    // Then, get items where last_generated_date < today
    const { data: oldDateItems, error: oldError } = await this.client
      .from('recurring_task_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lt('last_generated_date', today);

    if (oldError) {
      handleError.throw(oldError);
    }

    // Combine results (no duplicates since conditions are mutually exclusive)
    const allItems = [...(nullDateItems || []), ...(oldDateItems || [])];

    return allItems.map((row) => this.toDomain(row));
  }
}
