import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  analyst: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  minRole?: string;
}

export function ProtectedRoute({ children, minRole }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!minRole) return <>{children}</>;

  const userLevel = ROLE_HIERARCHY[user?.role || 'viewer'] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 99;

  if (userLevel < requiredLevel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-600 mb-4">
            You need <span className="font-medium capitalize">{minRole}</span> privileges or higher to access this page.
            Contact your administrator for access.
          </p>
          <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
