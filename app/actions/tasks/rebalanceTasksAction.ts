'use server';

import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

/**
 * Server action to rebalance multiple tasks by updating their positions.
 * Used when drag-and-drop encounters the min position limitation.
 *
 * @param updates - Array of {taskId, newPosition} pairs to update
 * @returns Response with success status or error
 */
export async function rebalanceTasksAction(
  updates: Array<{ taskId: string; newPosition: string }>
) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Unauthorized rebalance attempt', { error: authError });
    return { success: false, error: 'Unauthorized' };
  }

  // Validate inputs
  if (!updates || updates.length === 0) {
    logger.error('Invalid rebalance parameters', { updates });
    return { success: false, error: 'Invalid parameters' };
  }

  try {
    const repository = new SupabaseTaskRepository(supabase);

    // Update all tasks
    for (const { taskId, newPosition } of updates) {
      // Verify task ownership
      const task = await repository.findById(taskId);
      if (!task || task.userId !== user.id) {
        logger.error('Task not found or unauthorized', {
          taskId,
          userId: user.id,
        });
        return { success: false, error: 'Task not found' };
      }

      // Update position
      await repository.update(taskId, { position: newPosition });
    }

    // Revalidate daily page
    revalidatePath('/daily');

    return { success: true };
  } catch (error) {
    logger.error('Rebalance tasks failed', { error, updates });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to rebalance tasks',
    };
  }
}
