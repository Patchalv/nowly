'use server';

import {
  listTasksByDate,
  listTasksByWeek,
} from '@/src/application/tasks/listTasks.usecase';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
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
    handleError.return(authError);
    return { success: false, error: 'Unauthorized', tasks: [] };
  }

  // Execute use case
  const repository = new SupabaseTaskRepository(supabase);
  const response = await listTasksByWeek(user.id, date, repository);

  if (!response.success) {
    handleError.silent(response.error);
    return { success: false, error: response.error, tasks: [] };
  }

  return response;
}
