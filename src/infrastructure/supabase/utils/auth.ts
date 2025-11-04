import { supabase } from '@/src/infrastructure/supabase/client';
import type { AuthUser, SupabaseResponse } from '../types';

/**
 * Auth utility functions
 */

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: {
    first_name?: string;
    last_name?: string;
  }
): Promise<SupabaseResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    return {
      data: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
          }
        : null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Sign up failed'),
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<SupabaseResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      data: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
          }
        : null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Sign in failed'),
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<SupabaseResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Sign out failed'),
    };
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<SupabaseResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return {
      data: data.session?.user
        ? {
            id: data.session.user.id,
            email: data.session.user.email,
            created_at: data.session.user.created_at,
          }
        : null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Get session failed'),
    };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<SupabaseResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return {
      data: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
          }
        : null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Get user failed'),
    };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(
  email: string
): Promise<SupabaseResponse<null>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });

    if (error) throw error;

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Password reset failed'),
    };
  }
}

/**
 * Update user password
 */
export async function updatePassword(
  newPassword: string
): Promise<SupabaseResponse<null>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Password update failed'),
    };
  }
}
