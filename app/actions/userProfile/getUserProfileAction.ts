'use server';
import { getUserProfile } from '@/src/application/userProfile/getUserProfile.usecase';
import { SupabaseUserProfileRepository } from '@/src/infrastructure/repositories/user/SupabaseUserProfileRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { handleError } from '@/src/shared/errors';

export async function getUserProfileAction() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    const error = handleError.return(authError);
    return { success: false, error, userProfile: null };
  }

  // Execute use case
  const repository = new SupabaseUserProfileRepository(supabase);
  const response = await getUserProfile(authUser.id, repository);
  if (!response.success) {
    const error = handleError.silent(response.error);
    return { success: false, error, userProfile: null };
  }

  return response;
}
