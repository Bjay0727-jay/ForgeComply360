import { useEffect } from 'react';
import { onApiError } from '../utils/api';
import { useToast } from '../components/Toast';

/**
 * Subscribes to global API errors and shows toast notifications.
 * Mount this once at the app level (inside ToastProvider).
 */
export function useApiErrorToast() {
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = onApiError(({ message, status, path }) => {
      // Skip 401s during token refresh (handled silently)
      if (status === 401 && path === '/api/v1/auth/refresh') return;
      // Skip errors on /auth/me — stale tokens are handled silently by AuthProvider
      if (path === '/api/v1/auth/me') return;
      // Skip 401s on login (user sees form error)
      if (status === 401 && path === '/api/v1/auth/login') return;
      // Skip 400 validation errors on login/register (shown inline)
      if (status === 400 && (path.includes('/auth/login') || path.includes('/auth/register'))) return;

      if (status === 401) {
        addToast({
          type: 'warning',
          title: 'Session expired',
          message: 'Please sign in again.',
          duration: 6000,
        });
      } else if (status === 403) {
        addToast({
          type: 'error',
          title: 'Access denied',
          message: 'You don\'t have permission for this action.',
        });
      } else if (status >= 500) {
        addToast({
          type: 'error',
          title: 'Server error',
          message: 'Something went wrong. Please try again.',
          duration: 8000,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Request failed',
          message: message || 'An unexpected error occurred.',
        });
      }
    });

    return unsubscribe;
  }, [addToast]);
}
