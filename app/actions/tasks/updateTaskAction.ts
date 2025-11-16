'use server';

import { updateTask } from '@/src/application/tasks/updateTask.usecase';
import { TaskPriority } from '@/src/domain/types/tasks';
import { updateTaskSchema } from '@/src/domain/validation/task/task.schema';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function updateTaskAction(
  taskId: string,
  updates: {
    title?: string;
    description?: string | null;
    scheduledDate?: Date | null;
    dueDate?: Date | null;
    completed?: boolean;
    categoryId?: string | null;
    priority?: TaskPriority | null;
    position?: string;
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
  const result = updateTaskSchema.safeParse(updates);
  if (!result.success) {
    logger.error('Update task validation errors', {
      error: result.error,
    });
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Execute use case
  const repository = new SupabaseTaskRepository(supabase);
  const response = await updateTask(taskId, user.id, result.data, repository);

  if (!response.success) {
    logger.error('Update task error', { error: response.error });
    return {
      success: false,
      error: response.error,
    };
  }

  revalidatePath('/daily');

  return response;
}
