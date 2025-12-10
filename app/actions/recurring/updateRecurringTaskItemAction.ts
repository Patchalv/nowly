'use server';

import { handleError } from '@/src/shared/logging';
import { revalidatePath } from 'next/cache';
import z from 'zod';

import { updateRecurringTaskItem } from '@/src/application/recurring/updateRecurringTaskItem.usecase';
import { ROUTES } from '@/src/config/constants';
import {
  UpdateRecurringTaskItemInput,
  updateRecurringTaskItemSchema,
} from '@/src/domain/validation/recurring/recurringTaskItem.schema';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';

const updateParamsSchema = z.object({
  recurringItemId: z.string().uuid(),
});

export async function updateRecurringTaskItemAction(
  recurringItemId: string,
  updates: UpdateRecurringTaskItemInput
) {
  // Validate recurringItemId
  const paramsResult = updateParamsSchema.safeParse({ recurringItemId });
  if (!paramsResult.success) {
    handleError.log(paramsResult.error);
    return { success: false, error: 'Invalid recurring item ID' };
  }

  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    handleError.log(authError);
    return { success: false, error: 'Unauthorized' };
  }

  // Validate input
  const result = updateRecurringTaskItemSchema.safeParse(updates);
  if (!result.success) {
    handleError.validation(
      'Update recurring task item validation failed',
      result.error
    );
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // Execute use case
  const recurringRepository = new SupabaseRecurringTaskItemRepository(supabase);
  const taskRepository = new SupabaseTaskRepository(supabase);
  const response = await updateRecurringTaskItem(
    paramsResult.data.recurringItemId,
    user.id,
    result.data,
    recurringRepository,
    taskRepository
  );

  if (!response.success) {
    handleError.silent(response.error);
    return { success: false, error: response.error };
  }

  // Revalidate affected paths
  revalidatePath(ROUTES.RECURRING);
  revalidatePath(ROUTES.DAILY);
  revalidatePath(ROUTES.ALL_TASKS);

  return response;
}
