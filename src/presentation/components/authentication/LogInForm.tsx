'use client';

import { loginAction } from '@/app/actions/loginAction';
import { ROUTES } from '@/src/config/constants';
import {
  LoginFormData,
  loginSchema,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

export function LogInForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    startTransition(async () => {
      // Call server action with typed data
      const result = await loginAction(data);

      // Handle errors (success case redirects automatically)
      if (!result.success) {
        toast.error('Login failed', {
          description: result.error,
        });

        // Set field-specific errors if provided
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof LoginFormData, {
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
        <Form {...form}>
          <form
            id="login-form"
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
                      autoComplete="current-password"
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
          form="login-form"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Logging in...' : 'Login'}
        </Button>
        <FieldDescription className="text-center">
          Don&apos;t have an account?{' '}
          <Link href={ROUTES.SIGNUP} className="text-primary">
            Sign up
          </Link>
        </FieldDescription>
        <FieldDescription className="text-center">
          <Link href={ROUTES.RESET_PASSWORD} className="text-primary text-sm">
            Forgot password?
          </Link>
        </FieldDescription>
      </CardFooter>
    </Card>
  );
}
