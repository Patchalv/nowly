import { isValidTimezone } from '@/src/shared/utils/timezone';
import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  timezone: z
    .string()
    .refine((timezone) => isValidTimezone(timezone), {
      message: 'Invalid timezone',
    })
    .nullable()
    .optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
