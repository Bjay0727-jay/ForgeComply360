import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './useAuth';

// Mock the api module
vi.mock('../utils/api', () => ({
  api: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  onAuthFailure: vi.fn(() => () => {}), // Returns unsubscribe function
}));

import { api, setTokens, clearTokens } from '../utils/api';

const mockApi = vi.mocked(api);

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });

  it('starts in loading state and resolves when no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
  });

  it('fetches user when token exists in localStorage', async () => {
    localStorage.setItem('accessToken', 'existing-token');
    mockApi.mockResolvedValueOnce({
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin', onboarding_completed: 1, mfa_enabled: 0 },
      org: { id: 'org-1', name: 'Test Org', industry: 'tech', experience_type: 'enterprise', subscription_tier: 'pro', subscription_status: 'active' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user?.email).toBe('admin@test.com');
    expect(result.current.org?.name).toBe('Test Org');
  });

  it('login sets user and tokens', async () => {
    mockApi.mockResolvedValueOnce({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin', onboarding_completed: 1, mfa_enabled: 0 },
      org: { id: 'org-1', name: 'Test', industry: 'tech', experience_type: 'enterprise', subscription_tier: 'pro', subscription_status: 'active' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('admin@test.com', 'password');
    });

    expect(setTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    expect(result.current.user?.email).toBe('admin@test.com');
  });

  it('login returns MFA response when required', async () => {
    mockApi.mockResolvedValueOnce({
      mfa_required: true,
      mfa_token: 'mfa-token-123',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let mfaResponse: any;
    await act(async () => {
      mfaResponse = await result.current.login('admin@test.com', 'password');
    });

    expect(mfaResponse.mfa_required).toBe(true);
    expect(mfaResponse.mfa_token).toBe('mfa-token-123');
  });

  it('logout clears user and tokens', async () => {
    mockApi.mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.logout();
    });

    expect(clearTokens).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.org).toBeNull();
  });

  it('computes role permissions correctly for admin', async () => {
    localStorage.setItem('accessToken', 'token');
    mockApi.mockResolvedValueOnce({
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', onboarding_completed: 1, mfa_enabled: 0 },
      org: { id: 'o', name: 'O', industry: 'i', experience_type: 'e', subscription_tier: 't', subscription_status: 's' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.canEdit).toBe(true);
    expect(result.current.canManage).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it('computes role permissions correctly for viewer', async () => {
    localStorage.setItem('accessToken', 'token');
    mockApi.mockResolvedValueOnce({
      user: { id: '1', email: 'v@b.com', name: 'V', role: 'viewer', onboarding_completed: 1, mfa_enabled: 0 },
      org: { id: 'o', name: 'O', industry: 'i', experience_type: 'e', subscription_tier: 't', subscription_status: 's' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.canEdit).toBe(false);
    expect(result.current.canManage).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it('computes role permissions correctly for analyst', async () => {
    localStorage.setItem('accessToken', 'token');
    mockApi.mockResolvedValueOnce({
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'analyst', onboarding_completed: 1, mfa_enabled: 0 },
      org: { id: 'o', name: 'O', industry: 'i', experience_type: 'e', subscription_tier: 't', subscription_status: 's' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.canEdit).toBe(true);
    expect(result.current.canManage).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });
});
