'use server';

import { deleteRecurringTaskItem } from '@/src/application/recurring/deleteRecurringTaskItem.usecase';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const deleteRecurringItemSchema = z.object({
  recurringItemId: z.string().uuid(),
});

export async function deleteRecurringTaskItemAction(recurringItemId: string) {
  // Validate input
  const result = deleteRecurringItemSchema.safeParse({ recurringItemId });
  if (!result.success) {
    logger.error('Delete recurring task item validation errors', {
      error: result.error,
    });
    return { success: false, error: 'Invalid recurring item ID' };
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

  // Execute use case
  const recurringRepository = new SupabaseRecurringTaskItemRepository(supabase);
  const taskRepository = new SupabaseTaskRepository(supabase);
  const response = await deleteRecurringTaskItem(
    result.data.recurringItemId,
    user.id,
    recurringRepository,
    taskRepository
  );

  if (!response.success) {
    logger.error('Delete recurring task item error', { error: response.error });
    return { success: false, error: response.error };
  }

  // Revalidate affected paths
  revalidatePath('/recurring');
  revalidatePath('/daily');
  revalidatePath('/all-tasks');

  return response;
}
