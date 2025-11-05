'use client';

import { logoutAction } from '@/app/actions/logoutAction';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';

/**
 * Client component that handles user logout with proper error handling
 */
export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    startTransition(async () => {
      const result = await logoutAction();

      // Handle errors (success case redirects automatically)
      if (!result.success) {
        toast.error('Logout failed', {
          description: result.error,
        });
      }
    });
  };

  return (
    <Button onClick={handleLogout} disabled={isPending}>
      {isPending ? 'Logging out...' : 'Log out'}
    </Button>
  );
}
