'use server';

import { toggleTaskCompleted } from '@/src/application/tasks/toggleTaskCompleted.usecase';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function toggleTaskCompletedAction(taskId: string) {
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

  // Execute use case with both repositories
  const taskRepository = new SupabaseTaskRepository(supabase);
  const recurringRepository = new SupabaseRecurringTaskItemRepository(supabase);
  const response = await toggleTaskCompleted(
    taskId,
    user.id,
    taskRepository,
    recurringRepository
  );

  if (!response.success) {
    logger.error('Update task error', { error: response.error });
    return {
      success: false,
      error: response.error,
    };
  }

  // Revalidate multiple paths to refresh all task views
  revalidatePath('/daily');
  revalidatePath('/all-tasks');
  revalidatePath('/recurring');

  return response;
}
