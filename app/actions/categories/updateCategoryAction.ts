'use server';

import { updateCategory } from '@/src/application/categories/updateCategory.usecase';
import { updateCategorySchema } from '@/src/domain/validation/category/category.schema';
import { SupabaseCategoryRepository } from '@/src/infrastructure/repositories/category/SupabaseCategoryRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function updateCategoryAction(
  categoryId: string,
  updates: {
    name?: string;
    color?: string;
    icon?: string | null;
    position?: string | null;
  }
) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    logger.error('Unauthorized', { error: authError });
    return { success: false, error: 'Unauthorized' };
  }

  // Validate input
  const result = updateCategorySchema.safeParse(updates);
  if (!result.success) {
    logger.error('Update category validation errors', {
      error: result.error,
    });
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // Execute use case
  const repository = new SupabaseCategoryRepository(supabase);
  const response = await updateCategory(
    categoryId,
    user.id,
    result.data,
    repository
  );

  if (!response.success) {
    logger.error('Update category error', { error: response.error });
    return { success: false, error: response.error };
  }

  revalidatePath('/daily');

  return response;
}
