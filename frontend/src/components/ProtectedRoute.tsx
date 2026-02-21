import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

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
  featureKey?: string;
}

export function ProtectedRoute({ children, minRole, featureKey }: ProtectedRouteProps) {
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();

  // Feature flag check
  if (featureKey && !isFeatureEnabled(featureKey)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Feature Disabled</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This feature has been disabled by your organization administrator.
            Contact your admin to enable it in Settings.
          </p>
          <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Role check
  if (minRole) {
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
  }

  return <>{children}</>;
}
