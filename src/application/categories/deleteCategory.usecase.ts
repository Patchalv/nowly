import { ICategoryRepository } from '@/src/infrastructure/repositories/category/ICategoryRepository';
import { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import { logger } from '@sentry/nextjs';
import { MutateCategoryResponse } from './types';

export async function deleteCategory(
  categoryId: string,
  userId: string,
  categoryRepository: ICategoryRepository,
  taskRepository: ITaskRepository
): Promise<MutateCategoryResponse> {
  try {
    // Business logic: Validate category exists
    const existingCategory = await categoryRepository.findById(categoryId);
    if (!existingCategory || existingCategory.userId !== userId) {
      logger.error('Category not found', { categoryId });
      return { success: false, error: 'Category not found' };
    }

    // Find all tasks with this categoryId
    const tasksWithCategory = await taskRepository.findByCategoryId(
      userId,
      categoryId
    );

    // Update each task to remove the categoryId
    await Promise.all(
      tasksWithCategory.map((task) =>
        taskRepository.update(task.id, { categoryId: null })
      )
    );

    // Delete the category
    await categoryRepository.delete(categoryId);

    return { success: true };
  } catch (error) {
    logger.error('Delete category error', { error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete category',
    };
  }
}
