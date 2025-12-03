'use server';

import { updateRecurringTaskItem } from '@/src/application/recurring/updateRecurringTaskItem.usecase';
import { updateRecurringTaskItemSchema } from '@/src/domain/validation/recurring/recurringTaskItem.schema';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function updateRecurringTaskItemAction(
  recurringItemId: string,
  updates: {
    title?: string;
    description?: string | null;
    categoryId?: string | null;
    priority?: 'high' | 'medium' | 'low';
    dailySection?: 'morning' | 'afternoon' | 'evening' | null;
    bonusSection?: 'essential' | 'bonus' | null;
    endDate?: Date | null;
    isActive?: boolean;
  }
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

  // Validate input
  const result = updateRecurringTaskItemSchema.safeParse(updates);
  if (!result.success) {
    logger.error('Update recurring task item validation errors', {
      error: result.error,
    });
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // Execute use case
  const recurringRepository = new SupabaseRecurringTaskItemRepository(supabase);
  const taskRepository = new SupabaseTaskRepository(supabase);
  const response = await updateRecurringTaskItem(
    recurringItemId,
    user.id,
    result.data,
    recurringRepository,
    taskRepository
  );

  if (!response.success) {
    logger.error('Update recurring task item error', { error: response.error });
    return { success: false, error: response.error };
  }

  // Revalidate affected paths
  revalidatePath('/recurring');
  revalidatePath('/daily');
  revalidatePath('/all-tasks');

  return response;
}
