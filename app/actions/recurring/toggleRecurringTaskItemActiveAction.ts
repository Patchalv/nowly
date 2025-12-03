'use server';

import { updateRecurringTaskItem } from '@/src/application/recurring/updateRecurringTaskItem.usecase';
import { ROUTES } from '@/src/config/constants';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const { logger } = Sentry;

const toggleActiveSchema = z.object({
  recurringItemId: z.string().uuid(),
  isActive: z.boolean(),
});

export async function toggleRecurringTaskItemActiveAction(
  recurringItemId: string,
  isActive: boolean
) {
  // Validate input
  const result = toggleActiveSchema.safeParse({ recurringItemId, isActive });
  if (!result.success) {
    logger.error('Toggle recurring task item validation errors', {
      error: result.error,
    });
    return { success: false, error: 'Invalid input parameters' };
  }

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

  // Execute use case with isActive update
  // This reuses the update use case which handles cleanup when deactivating
  const recurringRepository = new SupabaseRecurringTaskItemRepository(supabase);
  const taskRepository = new SupabaseTaskRepository(supabase);
  const response = await updateRecurringTaskItem(
    result.data.recurringItemId,
    user.id,
    { isActive: result.data.isActive },
    recurringRepository,
    taskRepository
  );

  if (!response.success) {
    logger.error('Toggle recurring task item active error', {
      error: response.error,
    });
    return { success: false, error: response.error };
  }

  // Revalidate affected paths
  revalidatePath(ROUTES.RECURRING);
  revalidatePath(ROUTES.DAILY);
  revalidatePath(ROUTES.ALL_TASKS);

  return response;
}
