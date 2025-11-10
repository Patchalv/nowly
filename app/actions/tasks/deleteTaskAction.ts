'use server';

import { deleteTask } from '@/src/application/tasks/deleteTask.usecase';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function deleteTaskAction(taskId: string) {
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
  const repository = new SupabaseTaskRepository(supabase);
  const response = await deleteTask(taskId, user.id, repository);

  if (!response.success) {
    logger.error('Delete task error', { error: response.error });
    return {
      success: false,
      error: response.error,
    };
  }

  revalidatePath('/daily');

  return response;
}
