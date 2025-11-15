import { Category } from '@/src/domain/model/Category';

export interface ICategoryRepository {
  /**
   * Find all categories for a user
   */
  findByUserId(userId: string): Promise<Category[]>;

  /**
   * Find a category by ID
   */
  findById(id: string): Promise<Category | null>;

  /**
   * Create a new category
   */
  create(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Category>;

  /**
   * Update a category
   */
  update(categoryId: string, updates: Partial<Category>): Promise<Category>;

  /**
   * Delete a category
   */
  delete(categoryId: string): Promise<void>;
}
