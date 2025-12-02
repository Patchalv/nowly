'use server';

import { findOverdueTasks } from '@/src/application/tasks/findOverdueTasks.usecase';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import * as Sentry from '@sentry/nextjs';

export async function getOverdueTasksCountAction() {
  const supabase = await createClient();
  const { logger } = Sentry;

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Unauthorized', { error: authError });
    return { success: false, error: 'Unauthorized', count: 0 };
  }

  // Calculate today's date (start of day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Execute use case
  const repository = new SupabaseTaskRepository(supabase);
  const response = await findOverdueTasks(user.id, today, repository);

  if (!response.success) {
    logger.error('Get overdue tasks count error', { error: response.error });
    return { success: false, error: response.error, count: 0 };
  }

  return { success: true, count: response.tasks?.length ?? 0 };
}
