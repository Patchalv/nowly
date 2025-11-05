'use server';

import { createClient } from '@/src/infrastructure/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server action to log out the current user
 * Clears the Supabase session and redirects to login page
 */
export async function logoutAction() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  } catch (error) {
    console.error('Logout action failed:', error);
    throw error;
  }

  redirect('/login');
}
