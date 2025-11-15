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
   * - TIMESTAMPTZ fields (created_at, updated_at, completed_at) use timestampFromDatabase
   */
  private toDomain(row: CategoryRow): Category {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      position: row.position,
      createdAt: timestampFromDatabase(row.created_at),
      updatedAt: timestampFromDatabase(row.updated_at),
    };
  }

  private toInsert(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ): Database['public']['Tables']['categories']['Insert'] {
    return {
      user_id: category.userId,
      name: category.name,
      color: category.color,
      icon: category.icon,
      position: category.position,
    };
  }

  private toDatabase(
    category: Partial<Category>
  ): Database['public']['Tables']['categories']['Update'] {
    const result: Database['public']['Tables']['categories']['Update'] = {};

    if (category.name !== undefined) result.name = category.name;
    if (category.color !== undefined) result.color = category.color;
    if (category.icon !== undefined) result.icon = category.icon;
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
   * Find a category by ID
   */
  async findById(id: string): Promise<Category | null> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') return null; // Not found
    if (error) {
      logger.error('Failed to find category', { error });
      throw new Error(`Failed to find category: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
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

  /**
   * Update a category
   */
  async update(
    categoryId: string,
    updates: Partial<Category>
  ): Promise<Category> {
    const row = this.toDatabase(updates);

    const { data, error } = await this.client
      .from('categories')
      .update(row as never)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update category', { error });
      throw new Error(`Failed to update category: ${error.message}`);
    }
    if (!data) {
      logger.error('No data returned after update');
      throw new Error('No data returned after update');
    }

    return this.toDomain(data);
  }

  /**
   * Delete a category
   */
  async delete(categoryId: string): Promise<void> {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      logger.error('Failed to delete category', { error });
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }
}
