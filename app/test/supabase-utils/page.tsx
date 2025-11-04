'use client';

import { getSession } from '@/src/infrastructure/supabase/utils';
import { useEffect, useState } from 'react';

export default function TestUtilsPage() {
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    async function testUtils() {
      // Test getSession utility
      const { data, error } = await getSession();

      if (error) {
        setResult(`Error: ${error.message}`);
      } else if (data) {
        setResult(`Session found for user: ${data.email}`);
      } else {
        setResult('No active session (this is expected if not logged in)');
      }
    }

    testUtils();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Utils Test</h1>
      <p>{result || 'Testing...'}</p>
    </div>
  );
}
