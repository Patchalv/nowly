'use server';

import { createTask } from '@/src/application/tasks/createTask.usecase';
import { createTaskSchema } from '@/src/domain/validation/task/task.schema';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function createTaskAction(formData: FormData) {
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

  // Parse and validate input
  const scheduledDateStr = formData.get('scheduledDate');
  const result = createTaskSchema.safeParse({
    title: formData.get('title'),
    scheduledDate: scheduledDateStr
      ? new Date(scheduledDateStr as string)
      : null,
  });

  if (!result.success) {
    logger.error('Create task validation errors', {
      error: result.error,
    });
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Execute use case
  const repository = new SupabaseTaskRepository(supabase);
  const response = await createTask(result.data, user.id, repository);

  if (!response.success) {
    logger.error('Create task error', { error: response.error });
    return {
      success: false,
      error: response.error,
    };
  }

  revalidatePath('/daily');

  return response;
}
