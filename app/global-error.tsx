'use client';

import * as Sentry from '@sentry/nextjs';
import { ROUTES } from '@/src/config/constants';
import { Button } from '@/src/presentation/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/src/presentation/components/ui/card';
import { Geist, Geist_Mono } from 'next/font/google';
import { useEffect } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning className="h-full m-0 p-0">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full m-0 p-0`}
      >
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <Card className="max-w-md w-full">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                  <svg
                    className="w-8 h-8 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Something went wrong</h1>
                  <p className="text-sm text-muted-foreground">
                    We've been notified and are working on a fix.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button onClick={reset} className="w-full">
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = ROUTES.HOME)}
                className="w-full"
              >
                Go to homepage
              </Button>
            </CardFooter>
            {process.env.NODE_ENV === 'development' && (
              <CardContent className="pt-0">
                <div className="p-4 bg-muted rounded-lg text-left">
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs font-mono text-muted-foreground mt-2">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </body>
    </html>
  );
}
