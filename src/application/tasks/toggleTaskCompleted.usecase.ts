import * as Sentry from '@sentry/nextjs';

import type { IRecurringTaskItemRepository } from '@/src/infrastructure/repositories/recurring-task-item/IRecurringTaskItemRepository';
import type { ITaskRepository } from '@/src/infrastructure/repositories/task/ITaskRepository';
import {
  generateTasksFromRecurringItem,
  toDateKey,
} from '@/src/infrastructure/services/taskGenerationService';
import { handleError } from '@/src/shared/errors';
import { MutateTaskResponse } from './types';

export async function toggleTaskCompleted(
  taskId: string,
  userId: string,
  repository: ITaskRepository,
  recurringRepository?: IRecurringTaskItemRepository
): Promise<MutateTaskResponse> {
  const { logger } = Sentry;
  try {
    // Business logic: Validate task exists
    const existingTask = await repository.findById(taskId);
    if (!existingTask || existingTask.userId !== userId) {
      logger.error('Task not found', { taskId });
      return {
        success: false,
        error: 'Task not found',
      };
    }

    const isCompleted = !existingTask.completed;

    // Update the task
    const task = await repository.update(taskId, {
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : null,
    });

    // If completing a recurring task, generate next instance(s)
    if (
      isCompleted &&
      task.recurringItemId &&
      task.scheduledDate &&
      recurringRepository
    ) {
      try {
        // Fetch the recurring item
        const recurringItem = await recurringRepository.getById(
          task.recurringItemId
        );

        // Only generate if item exists and is active
        if (recurringItem && recurringItem.isActive) {
          // Get existing tasks for this recurring item
          const existingTasks = await repository.getByRecurringItemId(
            task.recurringItemId
          );

          // Build set of existing scheduled dates (YYYY-MM-DD format)
          const existingDates = new Set<string>(
            existingTasks
              .filter(
                (t): t is typeof t & { scheduledDate: Date } =>
                  t.scheduledDate !== null
              )
              .map((t) => toDateKey(t.scheduledDate))
          );

          // Calculate fromDate: day after the completed task's scheduledDate
          const fromDate = new Date(task.scheduledDate);
          fromDate.setDate(fromDate.getDate() + 1);

          // Generate missing tasks
          const tasksToCreate = generateTasksFromRecurringItem(
            recurringItem,
            fromDate,
            existingDates
          );

          if (tasksToCreate.length > 0) {
            // Insert generated tasks in batch
            await repository.createBatch(tasksToCreate);

            // Find the latest scheduled date from generated tasks
            const latestDate = tasksToCreate.reduce((latest, newTask) => {
              return newTask.scheduledDate > latest
                ? newTask.scheduledDate
                : latest;
            }, tasksToCreate[0].scheduledDate);

            // Update lastGeneratedDate on the recurring item
            await recurringRepository.updateLastGeneratedDate(
              recurringItem.id,
              latestDate
            );

            logger.info('Generated recurring tasks on completion', {
              taskId,
              recurringItemId: task.recurringItemId,
              generatedCount: tasksToCreate.length,
            });
          }
        }
      } catch (recurringError) {
        // Log the error but don't fail the completion
        handleError.silent(recurringError);
      }
    }

    return { success: true, task };
  } catch (error) {
    logger.error('Update task error', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    };
  }
}
