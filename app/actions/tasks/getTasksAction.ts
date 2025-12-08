'use server';
import * as Sentry from '@sentry/nextjs';

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

export async function getTasksAction(date: Date) {
  const { logger } = Sentry;
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
  const generationResponse = await Sentry.startSpan(
    { name: 'ensureTasksGenerated', op: 'task.generation' },
    async (span) => {
      const response = await ensureTasksGenerated(
        user.id,
        recurringRepository,
        taskRepository
      );
      if (response.success) {
        const taskCount = response.generatedTasks?.length || 0;
        span.setAttribute('tasks.generated', taskCount);
        span.setAttribute('week.date', date.toISOString());
      } else {
        // Log error but don't block task fetching
        handleError.silent(response.error);
      }
      return response;
    }
  );

  // Fetch tasks for the week (will include newly generated tasks)
  const response = await listTasksByWeek(user.id, date, taskRepository);

  if (!response.success) {
    const error = handleError.silent(response.error);
    return { success: false, error, tasks: [] };
  }

  return { ...response, generationResponse };
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
