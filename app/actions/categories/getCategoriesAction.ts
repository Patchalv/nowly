'use server';
import { getCategories } from '@/src/application/categories/getCategories.usecase';
import { SupabaseCategoryRepository } from '@/src/infrastructure/repositories/category/SupabaseCategoryRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { handleError } from '@/src/shared/errors';

export async function getCategoriesAction() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    handleError.return(authError);
    return { success: false, error: authError, categories: [] };
  }

  // Execute use case
  const repository = new SupabaseCategoryRepository(supabase);
  const response = await getCategories(authUser.id, repository);

  if (!response.success) {
    handleError.silent(response.error);
    return { success: false, error: response.error, categories: [] };
  }

  return response;
}
