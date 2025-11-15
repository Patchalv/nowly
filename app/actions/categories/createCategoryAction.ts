'use server';

import { createCategory } from '@/src/application/categories/createCategory.usecase';
import { createCategorySchema } from '@/src/domain/validation/category/category.schema';
import { SupabaseCategoryRepository } from '@/src/infrastructure/repositories/category/SupabaseCategoryRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';

export async function createCategoryAction(formData: FormData) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Unauthorized', { error: authError });
    return { success: false, error: 'Unauthorized' };
  }

  // Parse and validate input
  const result = createCategorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
    emoji: formData.get('emoji'),
  });

  if (!result.success) {
    logger.error('Create category validation errors', {
      error: result.error,
    });
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Execute use case
  const repository = new SupabaseCategoryRepository(supabase);
  const response = await createCategory(result.data, user.id, repository);

  if (!response.success) {
    logger.error('Create category error', { error: response.error });
    return {
      success: false,
      error: response.error,
    };
  }

  return response;
}
