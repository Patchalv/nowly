'use client';

import { supabase } from '@/src/infrastructure/supabase';
import { useEffect, useState } from 'react';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>(
    'loading'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Try to get session (will be null if not authenticated, but should not error)
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        setStatus('connected');
        console.log('Supabase connection successful!');
        console.log('Session:', data.session);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Supabase connection error:', err);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

      {status === 'loading' && <p>Testing connection...</p>}

      {status === 'connected' && (
        <div className="text-green-600">
          <p className="font-semibold">✓ Connected to Supabase successfully!</p>
          <p className="text-sm mt-2">
            Environment: {process.env.NEXT_PUBLIC_APP_ENV}
          </p>
          <p className="text-sm">
            Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-red-600">
          <p className="font-semibold">✗ Connection failed</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      )}
    </div>
  );
}
