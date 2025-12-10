'use server';

import { revalidatePath } from 'next/cache';

import { createTask } from '@/src/application/tasks/createTask.usecase';
import { createTaskSchema } from '@/src/domain/validation/task/task.schema';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { handleError, logger } from '@/src/shared/logging';

export async function createTaskAction(formData: FormData) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const error = handleError.log(authError);
    return { success: false, error: error.message };
  }

  // Parse and validate input
  const scheduledDateStr = formData.get('scheduledDate');
  const priorityStr = formData.get('priority');
  const categoryIdStr = formData.get('categoryId');

  // Parse priority: empty string or undefined becomes undefined, valid enum values are passed through
  const priority =
    priorityStr && priorityStr !== '' && typeof priorityStr === 'string'
      ? (priorityStr as 'high' | 'medium' | 'low')
      : undefined;

  // Parse categoryId: empty string becomes null, undefined stays undefined, valid UUID is passed through
  const categoryId =
    categoryIdStr === ''
      ? null
      : categoryIdStr && typeof categoryIdStr === 'string'
        ? categoryIdStr
        : undefined;

  const result = createTaskSchema.safeParse({
    title: formData.get('title'),
    scheduledDate: scheduledDateStr
      ? new Date(scheduledDateStr as string)
      : null,
    priority,
    categoryId,
  });

  if (!result.success) {
    handleError.validation('Create task validation errors', result.error);
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Execute use case
  const repository = new SupabaseTaskRepository(supabase);
  const response = await createTask(result.data, user.id, repository);

  if (!response.success) {
    const error = handleError.silent(response.error);
    return {
      success: false,
      error: error.message,
    };
  }

  // Log successful operation
  if (response.task) {
    logger.info('Task created successfully', {
      taskId: response.task.id,
      userId: user.id,
      categoryId: response.task.categoryId,
      hasScheduledDate: !!response.task.scheduledDate,
    });
  }

  revalidatePath('/daily');

  return response;
}
