import { Category } from '@/src/domain/model/Category';
import { handleError } from '@/src/shared/errors';
import { logger } from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CategoryRow, Database } from '../../supabase/types';
import { timestampFromDatabase } from '../../supabase/utils/dates';
import type { ICategoryRepository } from './ICategoryRepository';

export class SupabaseCategoryRepository implements ICategoryRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Transform database row (snake_case, ISO strings) to domain entity (camelCase, Date objects)
   * - DATE fields (scheduled_date, due_date) use dateFromDatabase
   * - TIMESTAMPTZ fields (created_at, updated_at, completed_at) use timestampFromDatabase
   */
  private toDomain(row: CategoryRow): Category {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      emoji: row.emoji,
      position: row.position,
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
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ): Database['public']['Tables']['categories']['Insert'] {
    return {
      user_id: category.userId,
      name: category.name,
      color: category.color,
      emoji: category.emoji,
      position: category.position,
    };
  }

  /**
   * Transform domain entity to database row for updates (partial fields)
   * - DATE fields use dateToDatabase
   * - TIMESTAMPTZ fields use timestampToDatabase
   */
  private toDatabase(
    category: Partial<Category>
  ): Database['public']['Tables']['categories']['Update'] {
    const result: Database['public']['Tables']['categories']['Update'] = {};

    if (category.name !== undefined) result.name = category.name;
    if (category.color !== undefined) result.color = category.color;
    if (category.emoji !== undefined) result.emoji = category.emoji;
    if (category.position !== undefined) result.position = category.position;

    return result;
  }

  /**
   * Find all categories for a user
   */
  async findByUserId(userId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      handleError.throw(error);
    }

    return data ? data.map((row) => this.toDomain(row)) : [];
  }

  /**
   * Create a new category
   */
  async create(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Category> {
    const row = this.toInsert(category);

    const { data, error } = await this.client
      .from('categories')
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
}
