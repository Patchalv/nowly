import { z } from 'zod';
import { optionalDateSchema } from '../date/date.schema';

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
  completed: z.boolean().optional(),
  completedAt: optionalDateSchema,
  scheduledDate: optionalDateSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
