'use server';

import { reorderTask } from '@/src/application/tasks/reorderTask.usecase';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

/**
 * Server action to reorder a task by updating its position.
 * Used for drag-and-drop task reordering.
 *
 * @param taskId - ID of the task to reorder
 * @param newPosition - New lexorank position string
 * @returns Response with success status, updated task, or error
 */
export async function reorderTaskAction(taskId: string, newPosition: string) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Unauthorized reorder attempt', { error: authError });
    return { success: false, error: 'Unauthorized' };
  }

  // Validate inputs
  if (!taskId || !newPosition) {
    logger.error('Invalid reorder parameters', { taskId, newPosition });
    return { success: false, error: 'Invalid parameters' };
  }

  // Execute use case
  const repository = new SupabaseTaskRepository(supabase);
  const response = await reorderTask(taskId, newPosition, user.id, repository);

  if (!response.success) {
    logger.error('Reorder task failed', { error: response.error, taskId });
    return {
      success: false,
      error: response.error,
    };
  }

  // Revalidate daily page to update SSR data
  revalidatePath('/daily');

  return response;
}
