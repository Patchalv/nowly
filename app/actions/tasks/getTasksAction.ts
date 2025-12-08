'use server';

import { ensureTasksGenerated } from '@/src/application/recurring/ensureTasksGenerated.usecase';
import {
  findByUserIdAndFilters,
  listTasksByDate,
  listTasksByWeek,
} from '@/src/application/tasks/listTasks.usecase';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { TaskFilters } from '@/src/presentation/hooks/tasks/types';
import { handleError } from '@/src/shared/errors';
import { logger } from '@sentry/nextjs';

export async function getTasksAction(date: Date) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Unauthorized', { error: authError });
    return { success: false, error: 'Unauthorized', tasks: [] };
  }

  // Execute use case
  const repository = new SupabaseTaskRepository(supabase);
  const response = await listTasksByDate(user.id, date, repository);

  if (!response.success) {
    logger.error('Get tasks error', { error: response.error });
    return { success: false, error: response.error, tasks: [] };
  }

  return response;
}

export async function getTasksByWeekAction(date: Date) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const error = handleError.return(authError);
    return { success: false, error, tasks: [] };
  }

  // Instantiate repositories
  const taskRepository = new SupabaseTaskRepository(supabase);
  const recurringRepository = new SupabaseRecurringTaskItemRepository(supabase);

  // Ensure recurring tasks are generated before fetching
  // This is the "lazy generation" that happens transparently when viewing dates
  const startTime = Date.now();
  const generationResponse = await ensureTasksGenerated(
    user.id,
    recurringRepository,
    taskRepository
  );
  const generationTime = Date.now() - startTime;

  // Log generation metrics
  if (generationResponse.success) {
    const taskCount = generationResponse.generatedTasks?.length || 0;
    if (taskCount > 0) {
      logger.info('Lazy task generation completed', {
        userId: user.id,
        tasksGenerated: taskCount,
        generationTimeMs: generationTime,
        weekDate: date.toISOString(),
      });
    }
  } else {
    // Log error but don't block task fetching
    handleError.silent(generationResponse.error);
  }

  // Fetch tasks for the week (will include newly generated tasks)
  const response = await listTasksByWeek(user.id, date, taskRepository);

  if (!response.success) {
    const error = handleError.silent(response.error);
    return { success: false, error, tasks: [] };
  }

  return response;
}

export async function listTasksAction(filters: TaskFilters, page: number) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const error = handleError.return(authError);
    return { success: false, error, tasks: [] };
  }

  // Execute use case
  const repository = new SupabaseTaskRepository(supabase);
  const response = await findByUserIdAndFilters(
    user.id,
    filters,
    page,
    repository
  );

  if (!response.success) {
    const error = handleError.silent(response.error);
    return { success: false, error, tasks: [] };
  }

  return response;
}
