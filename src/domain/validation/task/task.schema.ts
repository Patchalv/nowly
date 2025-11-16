import { z } from 'zod';
import { optionalDateSchema } from '../date/date.schema';

export const taskPrioritySchema = z.enum(['high', 'medium', 'low']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  scheduledDate: optionalDateSchema,
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title too long')
    .optional(),
  description: z.string().optional(),
  scheduledDate: optionalDateSchema,
  dueDate: optionalDateSchema,
  completed: z.boolean().optional(),
  completedAt: optionalDateSchema,
  categoryId: z.uuid().optional(),
  priority: taskPrioritySchema.optional(),
  position: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
