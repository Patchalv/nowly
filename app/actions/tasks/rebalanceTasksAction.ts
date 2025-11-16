'use server';

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
    // Call stored procedure to atomically update all task positions
    // Note: Using type assertion due to Supabase RPC type inference limitations
    // for manually created stored procedures
    type RebalanceResult = Array<{
      task_id: string;
      success: boolean;
      error_message: string | null;
    }>;

    // @ts-expect-error - Supabase RPC types don't recognize manually created stored procedures
    const { data, error } = (await supabase.rpc('rebalance_tasks', {
      p_user_id: user.id,
      p_updates: updates,
    })) as { data: RebalanceResult | null; error: any };

    if (error) {
      logger.error('RPC rebalance_tasks failed', { error, updates });

      // Check for serialization conflict
      if (error.code === '40001') {
        return {
          success: false,
          error: 'Database conflict, please try again',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to rebalance tasks',
      };
    }

    // Check if any individual task failed
    const failedTask = data?.find((row) => !row.success);
    if (failedTask) {
      logger.error('Task rebalance failed', {
        taskId: failedTask.task_id,
        error: failedTask.error_message,
      });
      return {
        success: false,
        error: failedTask.error_message || 'Task not found',
      };
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
