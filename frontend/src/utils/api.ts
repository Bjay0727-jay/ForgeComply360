import { captureException } from './sentry';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Store tokens in localStorage for persistence across page refreshes
// Note: useAuth.tsx also checks localStorage on app startup
let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

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

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
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
  }
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Try refresh on 401
  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    const errorMessage = err.error || `HTTP ${res.status}`;
    emitApiError(errorMessage, res.status, path);
    throw new Error(errorMessage);
  }

  return res.json();
}
