import * as Sentry from '@sentry/nextjs';

/**
 * Set user context in Sentry
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  metadata?: Record<string, unknown>;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Don't include sensitive data
    ...user.metadata,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for user action
 */
export function addBreadcrumb(
  message: string,
  category: string = 'user-action',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Set custom context
 */
export function setContext(key: string, context: Record<string, unknown>) {
  Sentry.setContext(key, context);
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}
