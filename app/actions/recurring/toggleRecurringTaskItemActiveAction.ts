'use server';

import { updateRecurringTaskItem } from '@/src/application/recurring/updateRecurringTaskItem.usecase';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function toggleRecurringTaskItemActiveAction(
  recurringItemId: string,
  isActive: boolean
) {
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
    recurringItemId,
    user.id,
    { isActive },
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
  revalidatePath('/recurring');
  revalidatePath('/daily');
  revalidatePath('/all-tasks');

  return response;
}
