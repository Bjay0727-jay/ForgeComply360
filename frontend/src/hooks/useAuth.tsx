import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearTokens } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  onboarding_completed: number;
}

interface Org {
  id: string;
  name: string;
  industry: string;
  experience_type: string;
  subscription_tier: string;
  subscription_status: string;
}

interface AuthContextType {
  user: User | null;
  org: Org | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  canEdit: boolean;
  canManage: boolean;
  isAdmin: boolean;
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

  const refreshUser = useCallback(async () => {
    try {
      const data = await api('/api/v1/auth/me');
      setUser(data.user);
      setOrg(data.org);
    } catch {
      clearTokens();
      setUser(null);
      setOrg(null);
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

  const login = async (email: string, password: string) => {
    const data = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    setOrg(data.org);
  };

  const register = async (regData: RegisterData) => {
    const data = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(regData),
    });
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    setOrg(data.org);
  };

  const logout = () => {
    api('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    clearTokens();
    setUser(null);
    setOrg(null);
  };

  const canEdit = ['analyst', 'manager', 'admin', 'owner'].includes(user?.role || '');
  const canManage = ['manager', 'admin', 'owner'].includes(user?.role || '');
  const isAdmin = ['admin', 'owner'].includes(user?.role || '');

  return (
    <AuthContext.Provider value={{ user, org, loading, login, register, logout, refreshUser, canEdit, canManage, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
