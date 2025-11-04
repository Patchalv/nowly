'use client';

import { signIn } from '@/src/infrastructure/supabase/utils';
import { handleError } from '@/src/shared/errors';
import { useState } from 'react';

export default function TestErrorsPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function testInvalidLogin() {
    setIsLoading(true);
    try {
      // This should trigger an error toast
      await signIn('invalid@email.com', 'wrongpassword');
      // Error already handled by signIn utility
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  function testManualError() {
    // Test manual error handling
    const fakeError = new Error('Test error message');
    handleError.toast(fakeError, 'This is a custom error message');
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Error Handling Test</h1>

      <div className="space-y-2">
        <button
          onClick={testInvalidLogin}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading
            ? 'Testing...'
            : 'Test Invalid Login (will show error toast)'}
        </button>

        <button
          onClick={testManualError}
          className="px-4 py-2 bg-purple-500 text-white rounded block"
        >
          Test Manual Error Toast
        </button>
      </div>

      <p className="text-sm text-gray-600">
        Click the buttons above to test error handling. Error toasts should
        appear in the top-right corner.
      </p>
    </div>
  );
}
