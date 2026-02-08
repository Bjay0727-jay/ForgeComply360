import { captureException } from './sentry';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Token refresh threshold - refresh if token expires within this many minutes
const TOKEN_REFRESH_THRESHOLD_MINUTES = 5;

// Store tokens in localStorage for persistence across page refreshes
// Note: useAuth.tsx also checks localStorage on app startup
let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

// Prevent concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null;

// Global API error listener — Toast system subscribes to this
type ApiErrorListener = (error: { message: string; status: number; path: string }) => void;
const errorListeners: ApiErrorListener[] = [];

export function onApiError(listener: ApiErrorListener) {
  errorListeners.push(listener);
  return () => {
    const i = errorListeners.indexOf(listener);
    if (i >= 0) errorListeners.splice(i, 1);
  };
}

// Auth failure listener — redirects to login when token refresh fails
type AuthFailureListener = () => void;
let authFailureListener: AuthFailureListener | null = null;

export function onAuthFailure(listener: AuthFailureListener) {
  authFailureListener = listener;
  return () => {
    authFailureListener = null;
  };
}

function emitApiError(message: string, status: number, path: string) {
  // Send to Sentry - server errors are errors, client errors are warnings
  captureException(message, {
    tags: { status: String(status), endpoint: path },
    level: status >= 500 ? 'error' : 'warning',
  });
  // Emit to listeners (Toast system)
  errorListeners.forEach((fn) => fn({ message, status, path }));
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getAccessToken() {
  return accessToken;
}

/**
 * Parse JWT payload without verification (client-side only)
 * Used for checking expiration time
 */
function parseJwtPayload(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired or will expire within threshold
 */
function isTokenExpiringSoon(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload.exp - now;
  const thresholdSeconds = TOKEN_REFRESH_THRESHOLD_MINUTES * 60;

  return expiresIn <= thresholdSeconds;
}

/**
 * Proactively refresh token if it's expiring soon
 * Returns true if token is valid (either still good or refreshed successfully)
 */
async function ensureValidToken(): Promise<boolean> {
  if (!accessToken) return false;

  // Check if token is expiring soon
  if (!isTokenExpiringSoon(accessToken)) {
    return true; // Token is still valid
  }

  // Token is expiring soon, refresh proactively
  return refreshAccessToken();
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  // Prevent concurrent refresh calls - reuse existing promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Proactively refresh token if expiring soon (before making the request)
  if (accessToken && refreshToken) {
    await ensureValidToken();
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Try refresh on 401 (fallback if proactive refresh didn't happen)
  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      // Refresh failed - session is completely expired
      clearTokens();
      if (authFailureListener) authFailureListener();
      throw new Error('Session expired');
    }
  }

  // Handle 401 when no refresh token exists
  if (res.status === 401 && !refreshToken) {
    clearTokens();
    if (authFailureListener) authFailureListener();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    const errorMessage = err.error || `HTTP ${res.status}`;
    emitApiError(errorMessage, res.status, path);
    throw new Error(errorMessage);
  }

  return res.json();
}
