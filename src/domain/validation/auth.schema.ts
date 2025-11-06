import { z } from 'zod';

/**
 * Authentication form schemas
 */

/**
 * Password validation requirements (matches Supabase password policy)
 * - At least 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one symbol
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .superRefine((password, ctx) => {
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must include at least one lowercase letter',
      });
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must include at least one uppercase letter',
      });
    }

    // Check for digit
    if (!/\d/.test(password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must include at least one digit',
      });
    }

    // Check for symbol/special character
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must include at least one symbol',
      });
    }
  });

export const signupSchema = z
  .object({
    email: z.email('Please enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const resetPasswordRequestSchema = z.object({
  email: z.email('Please enter a valid email address'),
});

export type ResetPasswordRequestFormData = z.infer<
  typeof resetPasswordRequestSchema
>;

export const resetPasswordConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordConfirmFormData = z.infer<
  typeof resetPasswordConfirmSchema
>;
