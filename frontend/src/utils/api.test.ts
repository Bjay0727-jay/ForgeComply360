import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { api, setTokens, clearTokens, getAccessToken } from './api';

// Helper to create a mock JWT that expires far in the future (no proactive refresh triggered)
function createMockJWT(payload: Record<string, any> = {}): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + 3600 }; // expires in 1 hour
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.mock-signature`;
}

// Helper to create a mock JWT that is expiring soon (triggers proactive refresh)
function createExpiringJWT(payload: Record<string, any> = {}): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + 60 }; // expires in 1 minute (within 5-min threshold)
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.mock-signature`;
}

describe('Token Management', () => {
  beforeEach(() => {
    clearTokens();
    mockFetch.mockReset();
  });

  it('setTokens stores tokens in localStorage', () => {
    setTokens('access-123', 'refresh-456');
    expect(localStorage.getItem('accessToken')).toBe('access-123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-456');
  });

  it('getAccessToken returns current token', () => {
    setTokens('my-token', 'my-refresh');
    expect(getAccessToken()).toBe('my-token');
  });

  it('clearTokens removes tokens', () => {
    setTokens('access', 'refresh');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

describe('api()', () => {
  beforeEach(() => {
    clearTokens();
    mockFetch.mockReset();
  });

  it('makes GET request and returns JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const result = await api('/api/v1/health');
    expect(result).toEqual({ data: 'test' });
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/health', expect.objectContaining({
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
  });

  it('includes Authorization header when token exists', async () => {
    const validToken = createMockJWT({ sub: 'user-123' });
    setTokens(validToken, 'refresh-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api('/api/v1/auth/me');
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/me', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: `Bearer ${validToken}` }),
    }));
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad request' }),
    });

    await expect(api('/api/v1/bad')).rejects.toThrow('Bad request');
  });

  it('retries on 401 with token refresh', async () => {
    // Use a valid JWT that's not expiring (so proactive refresh doesn't trigger)
    const expiredToken = createMockJWT({ sub: 'user-123' });
    const newToken = createMockJWT({ sub: 'user-123' });
    setTokens(expiredToken, 'valid-refresh');

    // First call returns 401 (simulates server rejecting token)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ access_token: newToken, refresh_token: 'new-refresh' }),
    });

    // Retry with new token succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ user: { id: '1' } }),
    });

    const result = await api('/api/v1/auth/me');
    expect(result).toEqual({ user: { id: '1' } });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('does not set Content-Type for FormData', async () => {
    const formData = new FormData();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await api('/api/v1/evidence', { method: 'POST', body: formData });
    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['Content-Type']).toBeUndefined();
  });

  it('handles JSON parse failure on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(api('/api/v1/broken')).rejects.toThrow('Request failed');
  });
});
