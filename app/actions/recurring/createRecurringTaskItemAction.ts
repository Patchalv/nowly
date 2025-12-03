'use server';

import { createRecurringTaskItem } from '@/src/application/recurring/createRecurringTaskItem.usecase';
import { createRecurringTaskItemSchema } from '@/src/domain/validation/recurring/recurringTaskItem.schema';
import { SupabaseRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/SupabaseRecurringTaskItemRepository';
import { SupabaseTaskRepository } from '@/src/infrastructure/repositories/task/SupabaseTaskRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { logger } from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function createRecurringTaskItemAction(formData: FormData) {
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

  // Parse FormData fields
  const startDateStr = formData.get('startDate');
  const endDateStr = formData.get('endDate');
  const dueOffsetDaysStr = formData.get('dueOffsetDays');
  const weeklyDaysRaw = formData.get('weeklyDays');
  const monthlyDayStr = formData.get('monthlyDay');
  const yearlyMonthStr = formData.get('yearlyMonth');
  const yearlyDayStr = formData.get('yearlyDay');

  // Parse arrays and numbers
  let weeklyDays: number[] | undefined;
  if (weeklyDaysRaw) {
    try {
      weeklyDays = JSON.parse(weeklyDaysRaw as string);
    } catch {
      logger.error('Invalid weeklyDays JSON format', {
        weeklyDays: weeklyDaysRaw,
      });
      return {
        success: false,
        errors: { weeklyDays: ['Invalid format for weekly days'] },
      };
    }
  }
  const dueOffsetDays = dueOffsetDaysStr
    ? parseInt(dueOffsetDaysStr as string, 10)
    : undefined;
  const monthlyDay = monthlyDayStr
    ? parseInt(monthlyDayStr as string, 10)
    : undefined;
  const yearlyMonth = yearlyMonthStr
    ? parseInt(yearlyMonthStr as string, 10)
    : undefined;
  const yearlyDay = yearlyDayStr
    ? parseInt(yearlyDayStr as string, 10)
    : undefined;

  // Validate input
  const result = createRecurringTaskItemSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    categoryId: formData.get('categoryId') || undefined,
    priority: formData.get('priority') || undefined,
    dailySection: formData.get('dailySection') || undefined,
    bonusSection: formData.get('bonusSection') || undefined,
    frequency: formData.get('frequency'),
    startDate: startDateStr ? new Date(startDateStr as string) : undefined,
    endDate: endDateStr ? new Date(endDateStr as string) : undefined,
    dueOffsetDays,
    weeklyDays,
    monthlyDay,
    yearlyMonth,
    yearlyDay,
  });

  if (!result.success) {
    logger.error('Create recurring task item validation errors', {
      error: result.error,
    });
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Execute use case
  const recurringRepository = new SupabaseRecurringTaskItemRepository(supabase);
  const taskRepository = new SupabaseTaskRepository(supabase);
  const response = await createRecurringTaskItem(
    result.data,
    user.id,
    recurringRepository,
    taskRepository
  );

  if (!response.success) {
    logger.error('Create recurring task item error', { error: response.error });
    return {
      success: false,
      error: response.error,
    };
  }

  // Revalidate affected paths
  revalidatePath('/recurring');
  revalidatePath('/daily');
  revalidatePath('/all-tasks');

  return response;
}
