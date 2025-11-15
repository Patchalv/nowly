'use server';

import { deleteCategory } from '@/src/application/categories/deleteCategory.usecase';
import { SupabaseCategoryRepository } from '@/src/infrastructure/repositories/category/SupabaseCategoryRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function deleteCategoryAction(categoryId: string) {
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

  // Execute use case
  const categoryRepository = new SupabaseCategoryRepository(supabase);
  const taskRepository = new SupabaseTaskRepository(supabase);
  const response = await deleteCategory(
    categoryId,
    user.id,
    categoryRepository,
    taskRepository
  );

  if (!response.success) {
    logger.error('Delete category error', { error: response.error });
    return { success: false, error: response.error };
  }

  revalidatePath('/daily');

  return response;
}
