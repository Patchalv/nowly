import { ICategoryRepository } from '@/src/infrastructure/repositories/category/ICategoryRepository';
import { logger } from '@sentry/nextjs';
import { GetCategoriesResponse } from './types';

export async function getCategories(
  userId: string,
  repository: ICategoryRepository
): Promise<GetCategoriesResponse> {
  try {
    const categories = await repository.findByUserId(userId);
    return { success: true, categories };
  } catch (error) {
    logger.error('Get categories error', { error });
    return {
      success: false,
      categories: [],
      error:
        error instanceof Error ? error.message : 'Failed to fetch categories',
    };
  }
}
