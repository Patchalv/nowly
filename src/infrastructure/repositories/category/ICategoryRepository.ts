import { Category } from '@/src/domain/model/Category';

export interface ICategoryRepository {
  /**
   * Find all categories for a user
   */
  findByUserId(userId: string): Promise<Category[]>;

  /**
   * Create a new category
   */
  create(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Category>;
}
