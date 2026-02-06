// ============================================================================
// Sentry Error Monitoring Configuration
// ============================================================================
import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error monitoring.
 * Only runs in production to avoid noise during development.
 *
 * To enable:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a React project
 * 3. Add VITE_SENTRY_DSN to .env.production
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Only initialize if DSN is provided and we're in production
  if (dsn && import.meta.env.PROD) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: 'forgecomply360@5.0.0',

      // Performance monitoring - sample 10% of transactions
      tracesSampleRate: 0.1,

      // Session replay - capture 10% of sessions, 100% on errors
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Filter out noisy errors
      ignoreErrors: [
        // Network errors that are usually transient
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        // User-initiated actions
        'ResizeObserver loop limit exceeded',
      ],

      // Don't send PII in breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Redact sensitive data from form inputs
        if (breadcrumb.category === 'ui.input') {
          breadcrumb.message = '[redacted]';
        }
        return breadcrumb;
      },
    });

    console.log('[Sentry] Initialized for production');
  } else if (!dsn && import.meta.env.PROD) {
    console.warn('[Sentry] DSN not configured - error monitoring disabled');
  }
}

/**
 * Set user context for error tracking.
 * Call this after successful login.
 */
export function setUserContext(user: { id: string; email: string; orgId: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
  Sentry.setTag('org_id', user.orgId);
}

/**
 * Clear user context on logout.
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Capture an exception with optional context.
 */
export function captureException(
  error: Error | string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info';
  }
) {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  Sentry.captureException(errorObj, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
  });
}

/**
 * Capture a message (non-error event).
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

// Re-export Sentry for direct access if needed
export { Sentry };
