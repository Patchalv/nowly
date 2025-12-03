'use server';

import { listRecurringTaskItems } from '@/src/application/recurring/listRecurringTaskItems.usecase';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { handleError } from '@/src/shared/errors';

export async function getRecurringTaskItemsAction(activeOnly: boolean = false) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const error = handleError.return(authError);
    return { success: false, error, recurringItems: [] };
  }

  // Execute use case
  const repository = new SupabaseRecurringTaskItemRepository(supabase);
  const response = await listRecurringTaskItems(
    user.id,
    activeOnly,
    repository
  );

  if (!response.success) {
    const error = handleError.silent(response.error);
    return { success: false, error, recurringItems: [] };
  }

  return response;
}
