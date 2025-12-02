'use server';

import { findOverdueTasks } from '@/src/application/tasks/findOverdueTasks.usecase';
import { rolloverTasks } from '@/src/application/tasks/rolloverTasks.usecase';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function rolloverTasksAction() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Unauthorized', { error: authError });
    return { success: false, error: 'Unauthorized' };
  }

  // Calculate today's date (start of day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get overdue tasks
  const repository = new SupabaseTaskRepository(supabase);
  const overdueResponse = await findOverdueTasks(user.id, today, repository);

  if (!overdueResponse.success) {
    logger.error('Failed to find overdue tasks', {
      error: overdueResponse.error,
    });
    return { success: false, error: overdueResponse.error };
  }

  const overdueTasks = overdueResponse.tasks ?? [];

  if (overdueTasks.length === 0) {
    logger.info('No overdue tasks to rollover', { userId: user.id });
    return { success: true };
  }

  // Extract task IDs
  const taskIds = overdueTasks.map((task) => task.id);

  // Rollover tasks to today
  const rolloverResponse = await rolloverTasks(
    user.id,
    taskIds,
    today,
    repository
  );

  if (!rolloverResponse.success) {
    logger.error('Failed to rollover tasks', { error: rolloverResponse.error });
    return { success: false, error: rolloverResponse.error };
  }

  // Revalidate the daily page
  revalidatePath('/daily');

  return { success: true };
}
