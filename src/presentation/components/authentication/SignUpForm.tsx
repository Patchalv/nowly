'use client';

import { signupAction } from '@/app/actions/signupAction';
import { ROUTES } from '@/src/config/constants';
import {
  SignupFormData,
  signupSchema,
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

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    startTransition(async () => {
      // Call server action with typed data
      const result = await signupAction(data);

      // Handle errors (success case redirects automatically)
      if (!result.success) {
        toast.error('Signup failed', {
          description: result.error,
        });

        // Set field-specific errors if provided
        if (result.fieldErrors) {
          const formFields = new Set<string>([
            'email',
            'password',
            'confirmPassword',
            'firstName',
            'lastName',
          ]);
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0 && formFields.has(field)) {
              form.setError(field as keyof SignupFormData, {
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
            id="signup-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="John"
                      autoComplete="given-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Doe"
                      autoComplete="family-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
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
          form="signup-form"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Creating account...' : 'Signup'}
        </Button>
        <FieldDescription className="text-center">
          Already have an account?{' '}
          <Link href={ROUTES.LOGIN} className="text-primary">
            Login
          </Link>
        </FieldDescription>
      </CardFooter>
    </Card>
  );
}
