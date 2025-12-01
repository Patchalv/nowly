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
    //
    // The stored procedure implements all-or-nothing behavior:
    // - If any validation or authorization check fails, an exception is raised
    // - If successful, returns array of updated tasks (all with success=true)
    // - Transaction automatically rolls back on exceptions
    type RebalanceResult = Array<{
      task_id: string;
      success: boolean;
      error_message: string | null;
    }>;

    logger.info('Calling rebalance_tasks RPC', {
      userId: user.id,
      updateCount: updates.length,
      updates: updates.map((u) => ({
        taskId: u.taskId,
        newPosition: u.newPosition,
      })),
    });

    // @ts-expect-error - Supabase RPC types don't recognize manually created stored procedures
    const { data, error } = (await supabase.rpc('rebalance_tasks', {
      p_user_id: user.id,
      p_updates: updates,
    })) as { data: RebalanceResult | null; error: any };

    if (error) {
      logger.error('RPC rebalance_tasks failed', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        updates,
      });

      // Check for serialization conflict
      if (error.code === '40001') {
        return {
          success: false,
          error: 'Database conflict, please try again',
        };
      }

      // Check for invalid format errors
      if (error.message?.includes('Invalid updates format')) {
        return {
          success: false,
          error: 'Invalid task data format',
        };
      }

      return {
        success: false,
        error: error.message || error.details || 'Failed to rebalance tasks',
      };
    }

    // If we reach here, all tasks were successfully updated
    // (stored procedure raises exceptions on any failure, so data only exists on success)
    // All rows in data will have success=true, but we verify data exists as a sanity check
    if (!data || data.length === 0) {
      logger.error('Rebalance returned no data', { updates });
      return {
        success: false,
        error: 'No tasks were updated',
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
