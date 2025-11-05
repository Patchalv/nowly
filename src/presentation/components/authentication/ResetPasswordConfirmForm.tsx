'use client';

import { resetPasswordConfirmAction } from '@/app/actions/resetPasswordConfirmAction';
import { ROUTES } from '@/src/config/constants';
import {
  ResetPasswordConfirmFormData,
  resetPasswordConfirmSchema,
} from '@/src/domain/validation/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../ui/field';
import { Input } from '../ui/input';

export function ResetPasswordConfirmForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ResetPasswordConfirmFormData>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordConfirmFormData) => {
    startTransition(async () => {
      // Convert form data to FormData for server action
      const formData = new FormData();
      formData.append('password', data.password);
      formData.append('confirmPassword', data.confirmPassword);

      // Call server action
      const result = await resetPasswordConfirmAction(formData);

      // Handle errors (success case redirects automatically)
      if (!result.success) {
        toast.error('Password reset failed', {
          description: result.error,
        });

        // Set field-specific errors if provided
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof ResetPasswordConfirmFormData, {
                type: 'manual',
                message: errors[0],
              });
            }
          });
        }
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <form
          id="reset-password-confirm-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="********"
                    required
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel htmlFor={field.name}>
                    Confirm New Password
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="********"
                    required
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Field>
          <Button
            type="submit"
            form="reset-password-confirm-form"
            disabled={isPending}
          >
            {isPending ? 'Resetting password...' : 'Reset password'}
          </Button>
          <FieldDescription className="text-center">
            Remember your password?{' '}
            <Link href={ROUTES.LOGIN} className="text-primary">
              Back to login
            </Link>
          </FieldDescription>
        </Field>
      </CardFooter>
    </Card>
  );
}
