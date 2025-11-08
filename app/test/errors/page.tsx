'use client';

import { Button } from '@/src/presentation/components/ui/button';
import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

// Component that throws during render (will be caught by error boundary)
function ErrorComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error(
      'Test Error: This will be caught by the global error boundary'
    );
  }
  return <div>No error</div>;
}

export default function TestErrorsPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // Event handler errors are NOT caught by error boundaries
  // They need to be handled manually
  const testEventHandlerError = () => {
    try {
      throw new Error(
        'Test Error: Event handler exception (not caught by boundary)'
      );
    } catch (error) {
      // Manually log to Sentry
      Sentry.captureException(error);
      console.error('Event handler error (logged to Sentry):', error);
      alert(
        'Error thrown in event handler. Check console and Sentry. Error boundaries do NOT catch these.'
      );
    }
  };

  // This will trigger the error boundary because it throws during render
  const testRenderError = () => {
    setShouldThrow(true);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Error Handling Test</h1>
      <p className="text-sm text-muted-foreground">
        React error boundaries only catch errors during rendering, not in event
        handlers.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">1. Event Handler Error</h2>
          <p className="text-sm text-muted-foreground">
            This error is thrown in an onClick handler. Error boundaries do NOT
            catch these. It will be logged to Sentry manually.
          </p>
          <Button onClick={testEventHandlerError}>
            Test Event Handler Error
          </Button>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            2. Render Error (Error Boundary)
          </h2>
          <p className="text-sm text-muted-foreground">
            This error is thrown during component render. The global error
            boundary WILL catch this.
          </p>
          <Button onClick={testRenderError}>
            Test Render Error (Triggers Boundary)
          </Button>
        </div>

        {shouldThrow && <ErrorComponent shouldThrow={shouldThrow} />}
      </div>
    </div>
  );
}
