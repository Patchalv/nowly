'use client';

import { resetPasswordConfirmAction } from '@/app/actions/resetPasswordConfirmAction';
import { ROUTES } from '@/src/config/constants';
import { isProduction } from '@/src/config/env';
import {
  ResetPasswordConfirmFormData,
  resetPasswordConfirmSchema,
} from '@/src/domain/validation/auth.schema';
import { supabase } from '@/src/infrastructure/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { logger } from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { FieldDescription } from '../ui/field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { PasswordInput } from '../ui/password-input';

export function ResetPasswordConfirmForm() {
  const [isPending, startTransition] = useTransition();
  const [isValidating, setIsValidating] = useState(true);
  const [hasValidToken, setHasValidToken] = useState(false);

  const form = useForm<ResetPasswordConfirmFormData>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Validate that user has a valid session (established by auth route handler)
  useEffect(() => {
    const validateSession = async () => {
      try {
        // Check if we have a valid session
        // The auth route handler (/auth/confirm) already exchanged the token
        const { data } = await supabase.auth.getSession();
        logger.info('Session data', { data: data });
        setHasValidToken(!!data.session);
      } catch (error) {
        if (!isProduction) {
          logger.error('Session validation error', { error: error });
        }
        logger.error('Session validation error', { error: error });
        setHasValidToken(false);
      } finally {
        logger.info('Session validation completed');
        setIsValidating(false);
      }
    };

    validateSession();
  }, []);

  const onSubmit = async (data: ResetPasswordConfirmFormData) => {
    startTransition(async () => {
      // Call server action with typed data
      const result = await resetPasswordConfirmAction(data);
      logger.info('Reset password confirm result', { result: result });
      // Handle errors (success case redirects automatically)
      if (!result.success) {
        toast.error('Password reset failed', {
          description: result.error,
        });

        logger.error('Reset password confirm error', { error: result.error });
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

  // Show loading state while validating token
  if (isValidating) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Validating reset link...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if no valid token
  if (!hasValidToken) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Session Required</h2>
              <p className="text-sm text-muted-foreground">
                Your password reset session has expired or is invalid. Please
                request a new password reset link.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={ROUTES.RESET_PASSWORD}>Request new reset link</Link>
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

  // Show password reset form if valid token
  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <Form {...form}>
          <form
            id="reset-password-confirm-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="********"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FieldDescription>
                    Must include: lowercase, uppercase, digit, and symbol
                  </FieldDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="********"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
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
          form="reset-password-confirm-form"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Resetting password...' : 'Reset password'}
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
