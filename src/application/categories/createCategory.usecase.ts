import { CreateCategoryInput } from '@/src/domain/validation/category/category.schema';
import { ICategoryRepository } from '@/src/infrastructure/repositories/category/ICategoryRepository';
import { logger } from '@sentry/nextjs';
import { LexoRank } from 'lexorank';
import { MutateCategoryResponse } from './types';

export async function createCategory(
  input: CreateCategoryInput,
  userId: string,
  repository: ICategoryRepository
): Promise<MutateCategoryResponse> {
  try {
    // Business logic: Set default values for fields not in Phase 1
    const category = await repository.create({
      name: input.name,
      userId,
      color: input.color,
      icon: input.icon,
      position: LexoRank.min().toString(),
    });

    return { success: true, category };
  } catch (error) {
    logger.error('Create category error', { error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create category',
    };
  }
}
