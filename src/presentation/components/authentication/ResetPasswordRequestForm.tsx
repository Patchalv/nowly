'use client';

import { resetPasswordRequestAction } from '@/app/actions/auth/resetPasswordRequestAction';
import { ROUTES } from '@/src/config/constants';
import {
  ResetPasswordRequestFormData,
  resetPasswordRequestSchema,
} from '@/src/domain/validation/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { FieldDescription } from '../ui/field';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

export function ResetPasswordRequestForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ResetPasswordRequestFormData>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordRequestFormData) => {
    startTransition(async () => {
      // Call server action with typed data
      const result = await resetPasswordRequestAction(data);

      // Handle result
      if (!result.success) {
        toast.error('Invalid input', {
          description: result.error,
        });

        // Set field-specific errors if provided
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof ResetPasswordRequestFormData, {
                type: 'manual',
                message: errors[0],
              });
            }
          });
        }
      } else {
        // Success - show message and reset form
        toast.success('Check your email', {
          description:
            'If an account exists with this email, you will receive a password reset link shortly.',
        });
        form.reset();
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <Form {...form}>
          <form
            id="reset-password-request-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="m@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          type="submit"
          form="reset-password-request-form"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Sending...' : 'Send reset link'}
        </Button>
        <FieldDescription className="text-center">
          Remember your password?{' '}
          <Link href={ROUTES.LOGIN} className="text-primary">
            Back to login
          </Link>
        </FieldDescription>
      </CardFooter>
    </Card>
  );
}
