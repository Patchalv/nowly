'use server';

import { ensureTasksGenerated } from '@/src/application/recurring/ensureTasksGenerated.usecase';
import { ROUTES } from '@/src/config/constants';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function ensureTasksGeneratedAction() {
  const { logger } = Sentry;

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Unauthorized', { error: authError });
    return { success: false, error: 'Unauthorized', generatedTasks: [] };
  }

  // Execute use case
  const recurringRepository = new SupabaseRecurringTaskItemRepository(supabase);
  const taskRepository = new SupabaseTaskRepository(supabase);
  const response = await ensureTasksGenerated(
    user.id,
    recurringRepository,
    taskRepository
  );

  if (!response.success) {
    logger.error('Ensure tasks generated error', { error: response.error });
    return {
      success: false,
      error: response.error,
      generatedTasks: [],
    };
  }

  // Revalidate affected paths
  revalidatePath(ROUTES.DAILY);
  revalidatePath(ROUTES.ALL_TASKS);
  revalidatePath(ROUTES.RECURRING);

  return response;
}
