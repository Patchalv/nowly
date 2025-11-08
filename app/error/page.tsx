'use client';

import { ROUTES } from '@/src/config/constants';
import { FallbackView } from '@/src/presentation/components/loader/FallbackView';
import { Button } from '@/src/presentation/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/src/presentation/components/ui/card';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                {message ||
                  'An unexpected error occurred. Please try again or contact support if the problem persists.'}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={ROUTES.HOME}>Go to Home</Link>
          </Button>
          <div className="text-center text-sm text-muted-foreground space-x-2">
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
              Login
            </Link>
            <span>•</span>
            <Link href={ROUTES.SIGNUP} className="text-primary hover:underline">
              Sign Up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<FallbackView />}>
      <ErrorContent />
    </Suspense>
  );
}
