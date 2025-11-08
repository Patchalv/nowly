import * as Sentry from '@sentry/nextjs';
import { setUserContext, clearUserContext, addBreadcrumb } from './context';

/**
 * Track successful login
 */
export function trackLogin(user: { id: string; email?: string }) {
  setUserContext(user);
  addBreadcrumb('User logged in', 'auth', { userId: user.id });

  Sentry.captureMessage('User logged in', {
    level: 'info',
    user: {
      id: user.id,
      email: user.email,
    },
  });
}

/**
 * Track successful signup
 */
export function trackSignup(user: { id: string; email?: string }) {
  setUserContext(user);
  addBreadcrumb('User signed up', 'auth', { userId: user.id });

  Sentry.captureMessage('User signed up', {
    level: 'info',
    user: {
      id: user.id,
      email: user.email,
    },
  });
}

/**
 * Track logout
 */
export function trackLogout() {
  addBreadcrumb('User logged out', 'auth');
  clearUserContext();
}

/**
 * Track failed login attempt
 */
export function trackLoginFailure(email: string, reason: string) {
  addBreadcrumb('Login failed', 'auth', { email, reason });
}
