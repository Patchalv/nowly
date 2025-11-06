'use client';

import { isProduction } from '@/src/config/env';
import { logEnvironmentInfo } from '@/src/infrastructure/utils/env-check';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type * as React from 'react';
import { useEffect } from 'react';
import { Toaster } from '../components/ui/sonner';
import { getQueryClient } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  // Log environment info in development
  useEffect(() => {
    logEnvironmentInfo();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        {!isProduction && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        )}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
