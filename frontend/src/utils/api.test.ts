import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { api, setTokens, clearTokens, getAccessToken } from './api';

describe('Token Management', () => {
  beforeEach(() => {
    clearTokens();
    mockFetch.mockReset();
  });

  it('setTokens stores tokens in sessionStorage', () => {
    setTokens('access-123', 'refresh-456');
    expect(sessionStorage.getItem('accessToken')).toBe('access-123');
    expect(sessionStorage.getItem('refreshToken')).toBe('refresh-456');
  });

  it('getAccessToken returns current token', () => {
    setTokens('my-token', 'my-refresh');
    expect(getAccessToken()).toBe('my-token');
  });

  it('clearTokens removes tokens', () => {
    setTokens('access', 'refresh');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
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
    setTokens('bearer-token', 'refresh-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api('/api/v1/auth/me');
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/me', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer bearer-token' }),
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
    setTokens('expired-token', 'valid-refresh');

    // First call returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ access_token: 'new-access', refresh_token: 'new-refresh' }),
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
