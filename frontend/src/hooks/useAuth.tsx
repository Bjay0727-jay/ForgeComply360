import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearTokens, onAuthFailure } from '../utils/api';
import { setUserContext, clearUserContext } from '../utils/sentry';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  onboarding_completed: number;
  mfa_enabled: number;
}

interface Org {
  id: string;
  name: string;
  industry: string;
  experience_type: string;
  subscription_tier: string;
  subscription_status: string;
}

interface MFAResponse {
  mfa_required?: boolean;
  mfa_token?: string;
  mfa_setup_required?: boolean;
  mfa_setup_token?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  org: Org | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<MFAResponse>;
  verifyMFA: (mfaToken: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  canEdit: boolean;
  canManage: boolean;
  isAdmin: boolean;
  sessionTimeoutMinutes: number;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
  industry?: string;
  size?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api('/api/v1/auth/me');
      setUser(data.user);
      setOrg(data.org);
      if (data.session_timeout_minutes) setSessionTimeoutMinutes(data.session_timeout_minutes);
      // Set Sentry user context on session restore
      setUserContext({ id: data.user.id, email: data.user.email, orgId: data.org.id });
    } catch {
      clearTokens();
      setUser(null);
      setOrg(null);
      clearUserContext();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  // Listen for auth failures (token refresh failed) and redirect to login
  useEffect(() => {
    return onAuthFailure(() => {
      setUser(null);
      setOrg(null);
      clearUserContext();
      // Redirect to login with session expired message
      window.location.href = '/login?expired=1';
    });
  }, []);

  const login = async (email: string, password: string): Promise<MFAResponse> => {
    const data = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.mfa_required) {
      return { mfa_required: true, mfa_token: data.mfa_token };
    }
    if (data.mfa_setup_required) {
      return { mfa_setup_required: true, mfa_setup_token: data.mfa_setup_token, message: data.message };
    }
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    setOrg(data.org);
    // Set Sentry user context for error tracking
    setUserContext({ id: data.user.id, email: data.user.email, orgId: data.org.id });
    return {};
  };

  const verifyMFA = async (mfaToken: string, code: string) => {
    const data = await api('/api/v1/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ mfa_token: mfaToken, code }),
    });
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    setOrg(data.org);
    // Set Sentry user context for error tracking
    setUserContext({ id: data.user.id, email: data.user.email, orgId: data.org.id });
  };

  const register = async (regData: RegisterData) => {
    const data = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(regData),
    });
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    setOrg(data.org);
    // Set Sentry user context for error tracking
    setUserContext({ id: data.user.id, email: data.user.email, orgId: data.org.id });
  };

  const logout = () => {
    api('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    clearTokens();
    setUser(null);
    setOrg(null);
    // Clear Sentry user context
    clearUserContext();
    // Redirect immediately to prevent onAuthFailure from adding ?expired=1
    window.location.href = '/login';
  };

  const canEdit = ['analyst', 'manager', 'admin', 'owner'].includes(user?.role || '');
  const canManage = ['manager', 'admin', 'owner'].includes(user?.role || '');
  const isAdmin = ['admin', 'owner'].includes(user?.role || '');

  return (
    <AuthContext.Provider value={{ user, org, loading, login, verifyMFA, register, logout, refreshUser, canEdit, canManage, isAdmin, sessionTimeoutMinutes }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
