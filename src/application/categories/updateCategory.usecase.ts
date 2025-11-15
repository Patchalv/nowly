import { UpdateCategoryInput } from '@/src/domain/validation/category/category.schema';
import { ICategoryRepository } from '@/src/infrastructure/repositories/category/ICategoryRepository';
import { logger } from '@sentry/nextjs';
import { MutateCategoryResponse } from './types';

export async function updateCategory(
  categoryId: string,
  userId: string,
  updates: UpdateCategoryInput,
  repository: ICategoryRepository
): Promise<MutateCategoryResponse> {
  try {
    // Business logic: Validate category exists
    const existingCategory = await repository.findById(categoryId);
    if (!existingCategory || existingCategory.userId !== userId) {
      logger.error('Category not found', { categoryId });
      return { success: false, error: 'Category not found' };
    }

    const category = await repository.update(categoryId, updates);

    return { success: true, category };
  } catch (error) {
    logger.error('Update category error', { error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update category',
    };
  }
}
