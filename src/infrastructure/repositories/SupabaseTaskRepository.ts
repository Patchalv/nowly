// src/infrastructure/repositories/SupabaseTaskRepository.ts
import type { Task } from '@/src/domain/model/Task';
import { logger } from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TaskRow } from '../supabase/types';
import {
  dateFromDatabase,
  dateToDatabase,
  timestampFromDatabase,
  timestampToDatabase,
} from '../supabase/utils/dates';
import type { ITaskRepository } from './ITaskRepository';

export class SupabaseTaskRepository implements ITaskRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Transform database row (snake_case, ISO strings) to domain entity (camelCase, Date objects)
   * - DATE fields (scheduled_date, due_date) use dateFromDatabase
   * - TIMESTAMPTZ fields (created_at, updated_at, completed_at) use timestampFromDatabase
   */
  private toDomain(row: TaskRow): Task {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      scheduledDate: dateFromDatabase(row.scheduled_date),
      dueDate: dateFromDatabase(row.due_date),
      completed: row.completed,
      completedAt: row.completed_at
        ? timestampFromDatabase(row.completed_at)
        : null,
      categoryId: row.category_id,
      priority: row.priority,
      dailySection: row.daily_section,
      bonusSection: row.bonus_section,
      position: row.position,
      recurringItemId: row.recurring_item_id,
      createdAt: timestampFromDatabase(row.created_at),
      updatedAt: timestampFromDatabase(row.updated_at),
    };
  }

  /**
   * Transform domain entity to database row for inserts (all required fields)
   * - DATE fields use dateToDatabase
   * - TIMESTAMPTZ fields use timestampToDatabase
   */
  private toInsert(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Database['public']['Tables']['tasks']['Insert'] {
    return {
      user_id: task.userId,
      title: task.title,
      description: task.description ?? null,
      scheduled_date: dateToDatabase(task.scheduledDate),
      due_date: dateToDatabase(task.dueDate),
      completed: task.completed,
      completed_at: timestampToDatabase(task.completedAt),
      category_id: task.categoryId ?? null,
      priority: task.priority ?? null,
      daily_section: task.dailySection ?? null,
      bonus_section: task.bonusSection ?? null,
      position: task.position,
      recurring_item_id: task.recurringItemId ?? null,
    };
  }

  /**
   * Transform domain entity to database row for updates (partial fields)
   * - DATE fields use dateToDatabase
   * - TIMESTAMPTZ fields use timestampToDatabase
   */
  private toDatabase(
    task: Partial<Task>
  ): Database['public']['Tables']['tasks']['Update'] {
    const result: Database['public']['Tables']['tasks']['Update'] = {};

    if (task.userId !== undefined) result.user_id = task.userId;
    if (task.title !== undefined) result.title = task.title;
    if (task.description !== undefined)
      result.description = task.description ?? null;
    if (task.scheduledDate !== undefined) {
      result.scheduled_date = dateToDatabase(task.scheduledDate);
    }
    if (task.dueDate !== undefined) {
      result.due_date = dateToDatabase(task.dueDate);
    }
    if (task.completed !== undefined) result.completed = task.completed;
    if (task.completedAt !== undefined) {
      result.completed_at = timestampToDatabase(task.completedAt);
    }
    if (task.categoryId !== undefined)
      result.category_id = task.categoryId ?? null;
    if (task.priority !== undefined) result.priority = task.priority ?? null;
    if (task.dailySection !== undefined)
      result.daily_section = task.dailySection ?? null;
    if (task.bonusSection !== undefined)
      result.bonus_section = task.bonusSection ?? null;
    if (task.position !== undefined) result.position = task.position;
    if (task.recurringItemId !== undefined)
      result.recurring_item_id = task.recurringItemId ?? null;

    return result;
  }

  async create(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    const row = this.toInsert(task);

    const { data, error } = await this.client
      .from('tasks')
      .insert(row as never)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create task', { error });
      throw new Error(`Failed to create task: ${error.message}`);
    }
    if (!data) {
      logger.error('No data returned after insert', { error });
      throw new Error('No data returned after insert');
    }

    return this.toDomain(data);
  }

  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') return null; // Not found
    if (error) {
      logger.error('Failed to find task', { error });
      throw new Error(`Failed to find task: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  async findByUserIdAndDate(userId: string, date: Date): Promise<Task[]> {
    // Use dateToDatabase to convert Date to YYYY-MM-DD string for DATE field comparison
    const dateStr = dateToDatabase(date);
    if (!dateStr) {
      logger.error('Invalid date provided for query', { date });
      throw new Error('Invalid date provided for query');
    }

    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('scheduled_date', dateStr)
      .order('position', { ascending: true });

    if (error) {
      logger.error('Failed to find tasks', { error });
      throw new Error(`Failed to find tasks: ${error.message}`);
    }

    return data ? data.map((row) => this.toDomain(row)) : [];
  }

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const row = this.toDatabase(updates);

    const { data, error } = await this.client
      .from('tasks')
      .update(row as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update task', { error });
      throw new Error(`Failed to update task: ${error.message}`);
    }
    if (!data) {
      logger.error('No data returned after update', { error });
      throw new Error('No data returned after update');
    }

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('tasks').delete().eq('id', id);

    if (error) {
      logger.error('Failed to delete task', { error });
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }
}
