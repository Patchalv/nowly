import { z } from 'zod';
import {
  taskPrioritySchema,
  dailySectionSchema,
  bonusSectionSchema,
} from '../task/task.schema';

/**
 * Schema for recurrence frequency enum
 */
export const recurringFrequencySchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'weekdays',
  'weekends',
]);

/**
 * Schema for creating a recurring task item
 * Includes refinements for frequency-specific requirements
 */
export const createRecurringTaskItemSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    priority: taskPrioritySchema.default('medium'),
    dailySection: dailySectionSchema.optional(),
    bonusSection: bonusSectionSchema.optional(),
    frequency: recurringFrequencySchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    dueOffsetDays: z.number().int().min(0).max(365).default(0),

    // Frequency-specific configuration
    weeklyDays: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'Select at least one day')
      .optional(),
    monthlyDay: z.number().int().min(1).max(31).optional(),
    yearlyMonth: z.number().int().min(1).max(12).optional(),
    yearlyDay: z.number().int().min(1).max(31).optional(),
  })
  .refine(
    (data) => {
      // End date must be after or equal to start date
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // Weekly frequency requires at least one day selected
      if (data.frequency === 'weekly') {
        return data.weeklyDays && data.weeklyDays.length > 0;
      }
      return true;
    },
    {
      message: 'Weekly frequency requires at least one day selected',
      path: ['weeklyDays'],
    }
  )
  .refine(
    (data) => {
      // Monthly frequency requires day of month
      if (data.frequency === 'monthly') {
        return data.monthlyDay !== undefined;
      }
      return true;
    },
    {
      message: 'Monthly frequency requires day of month',
      path: ['monthlyDay'],
    }
  )
  .refine(
    (data) => {
      // Yearly frequency requires month and day
      if (data.frequency === 'yearly') {
        return data.yearlyMonth !== undefined && data.yearlyDay !== undefined;
      }
      return true;
    },
    {
      message: 'Yearly frequency requires month and day',
      path: ['yearlyMonth'],
    }
  );

/**
 * Schema for updating a recurring task item
 * Note: frequency cannot be changed after creation
 */
export const updateRecurringTaskItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title too long')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description too long')
    .nullable()
    .optional(),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  priority: taskPrioritySchema.optional(),
  dailySection: dailySectionSchema.nullable().optional(),
  bonusSection: bonusSectionSchema.nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Inferred types from schemas
 * These are the single source of truth for input types.
 * Use these types in use cases and application layer.
 */
export type RecurringFrequencyInput = z.infer<typeof recurringFrequencySchema>;
export type CreateRecurringTaskItemInput = z.infer<
  typeof createRecurringTaskItemSchema
>;
export type UpdateRecurringTaskItemInput = z.infer<
  typeof updateRecurringTaskItemSchema
>;
