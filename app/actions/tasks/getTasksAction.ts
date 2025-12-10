'use server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

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
import { isValidDate } from '@/src/shared/utils/date';

/**
 * Validation schemas for server action inputs
 * These handle serialization from client (Date objects become strings)
 */

// Date schema - handles serialized Date strings from client
const dateInputSchema = z
  .union([z.string(), z.date()])
  .transform((val) => {
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    if (isNaN(parsed.getTime())) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: [],
          message: 'Invalid date format',
        },
      ]);
    }
    return parsed;
  })
  .pipe(
    z.date().refine((date) => isValidDate(date), {
      message: 'Invalid date',
    })
  );

// TaskFilters schema
const taskFiltersSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  showCompleted: z.enum(['IsCompleted', 'IsNotCompleted', 'All']),
  showScheduled: z.enum(['IsScheduled', 'IsNotScheduled', 'All']),
  search: z.string().optional(),
});

// Page schema
const pageSchema = z.number().int().min(1).default(1);

export async function getTasksAction(date: Date | string) {
  const { logger } = Sentry;
  const supabase = await createClient();

  // Validate input
  const dateResult = dateInputSchema.safeParse(date);
  if (!dateResult.success) {
    logger.error('Get tasks validation error', { error: dateResult.error });
    return {
      success: false,
      error: 'Invalid date format',
      tasks: [],
      errors: dateResult.error.flatten().fieldErrors,
    };
  }

  const validatedDate = dateResult.data;

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
  const response = await listTasksByDate(user.id, validatedDate, repository);

  if (!response.success) {
    logger.error('Get tasks error', { error: response.error });
    return { success: false, error: response.error, tasks: [] };
  }

  return response;
}

export async function getTasksByWeekAction(date: Date | string) {
  const { logger } = Sentry;
  const supabase = await createClient();

  // Validate input
  const dateResult = dateInputSchema.safeParse(date);
  if (!dateResult.success) {
    logger.error('Get tasks by week validation error', {
      error: dateResult.error,
    });
    return {
      success: false,
      error: 'Invalid date format',
      tasks: [],
      errors: dateResult.error.flatten().fieldErrors,
    };
  }

  const validatedDate = dateResult.data;

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
        span.setAttribute('week.date', validatedDate.toISOString());
      } else {
        // Log error but don't block task fetching
        handleError.silent(response.error);
      }
      return response;
    }
  );

  // Fetch tasks for the week (will include newly generated tasks)
  const response = await listTasksByWeek(
    user.id,
    validatedDate,
    taskRepository
  );

  if (!response.success) {
    const error = handleError.silent(response.error);
    return { success: false, error, tasks: [] };
  }

  return { ...response, generationResponse };
}

export async function listTasksAction(filters: TaskFilters, page: number) {
  const { logger } = Sentry;
  const supabase = await createClient();

  // Validate inputs
  const filtersResult = taskFiltersSchema.safeParse(filters);
  const pageResult = pageSchema.safeParse(page);

  if (!filtersResult.success) {
    logger.error('List tasks filters validation error', {
      error: filtersResult.error,
    });
    return {
      success: false,
      error: 'Invalid filters format',
      tasks: [],
      errors: filtersResult.error.flatten().fieldErrors,
    };
  }

  if (!pageResult.success) {
    logger.error('List tasks page validation error', {
      error: pageResult.error,
    });
    return {
      success: false,
      error: 'Invalid page number',
      tasks: [],
      errors: pageResult.error.flatten().fieldErrors,
    };
  }

  const validatedFilters = filtersResult.data;
  const validatedPage = pageResult.data;

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
    validatedFilters,
    validatedPage,
    repository
  );

  if (!response.success) {
    const error = handleError.silent(response.error);
    return { success: false, error, tasks: [] };
  }

  return response;
}
