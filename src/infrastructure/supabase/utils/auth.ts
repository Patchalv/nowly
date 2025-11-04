import { supabase } from '@/src/infrastructure/supabase/client';
import { handleError } from '@/src/shared/errors';
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

    if (error) {
      // This will parse the error, log it, and show a toast
      const appError = handleError.toast(error);
      return {
        data: null,
        error: new Error(appError.message),
      };
    }

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
    const appError = handleError.toast(error);
    return {
      data: null,
      error: new Error(appError.message),
    };
  }
}

/**
 * Sign in with email and password (with error handling)
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

    if (error) {
      // This will parse the error, log it, and show a toast
      const appError = handleError.toast(error);
      return {
        data: null,
        error: new Error(appError.message),
      };
    }

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
    const appError = handleError.toast(error);
    return {
      data: null,
      error: new Error(appError.message),
    };
  }
}
/**
 * Sign out the current user
 */
export async function signOut(): Promise<SupabaseResponse<null>> {
  const customMessage = 'Sign out failed';

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      // This will parse the error, log it, and show a toast
      const appError = handleError.toast(error, customMessage);
      return {
        data: null,
        error: new Error(appError.message),
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    const appError = handleError.toast(error, customMessage);
    return {
      data: null,
      error: new Error(appError.message),
    };
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<SupabaseResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      // This will parse the error, log it, and show a toast
      const appError = handleError.toast(error, 'Get session failed');
      return {
        data: null,
        error: new Error(appError.message),
      };
    }

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
    const appError = handleError.toast(error, 'Get session failed');
    return {
      data: null,
      error: new Error(appError.message),
    };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<SupabaseResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // This will parse the error, log it, and show a toast
      const appError = handleError.toast(error);
      return {
        data: null,
        error: new Error(appError.message),
      };
    }

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
    const appError = handleError.toast(error, 'Get user failed');
    return {
      data: null,
      error: new Error(appError.message),
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

    if (error) {
      // This will parse the error, log it, and show a toast
      const appError = handleError.toast(error);
      return {
        data: null,
        error: new Error(appError.message),
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    const appError = handleError.toast(error, 'Password reset failed');
    return {
      data: null,
      error: new Error(appError.message),
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

    if (error) {
      // This will parse the error, log it, and show a toast
      const appError = handleError.toast(error);
      return {
        data: null,
        error: new Error(appError.message),
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    const appError = handleError.toast(error, 'Password update failed');
    return {
      data: null,
      error: new Error(appError.message),
    };
  }
}
