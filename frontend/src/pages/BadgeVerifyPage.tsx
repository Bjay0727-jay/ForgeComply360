import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface BadgeData {
  valid: boolean;
  error?: string;
  org_name?: string;
  grade?: string;
  score?: number;
  frameworks?: string[];
  issued_at?: string;
  expires_at?: string;
}

export function BadgeVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [badge, setBadge] = useState<BadgeData | null>(null);

  useEffect(() => {
    if (code) {
      fetch(`https://forge-comply360-api.stanley-riley.workers.dev/api/v1/public/badge/verify/${code}`)
        .then(res => res.json())
        .then(data => {
          setBadge(data);
          setLoading(false);
        })
        .catch(() => {
          setBadge({ valid: false, error: 'Failed to verify badge' });
          setLoading(false);
        });
    }
  }, [code]);

  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#22c55e';
      case 'B': return '#3b82f6';
      case 'C': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">Forge Cyber Defense</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Compliance Badge Verification</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {badge?.valid ? (
            <>
              {/* Valid Badge */}
              <div className="bg-green-50 dark:bg-green-900/20 p-6 text-center border-b border-green-200 dark:border-green-800">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">Verified Badge</h2>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">This compliance badge is authentic</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Organization */}
                <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Organization</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{badge.org_name}</p>
                </div>

                {/* Grade & Score */}
                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="text-center">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                      style={{ backgroundColor: gradeColor(badge.grade || 'F') }}
                    >
                      {badge.grade}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Grade</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">{badge.score}%</div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Score</p>
                  </div>
                </div>

                {/* Frameworks */}
                {badge.frameworks && badge.frameworks.length > 0 && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Frameworks</p>
                    <div className="flex flex-wrap gap-2">
                      {badge.frameworks.map((fw, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                          {fw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Issued</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {badge.issued_at ? new Date(badge.issued_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Expires</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {badge.expires_at ? new Date(badge.expires_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Invalid Badge */}
              <div className="bg-red-50 dark:bg-red-900/20 p-6 text-center border-b border-red-200 dark:border-red-800">
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">Invalid Badge</h2>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {badge?.error || 'This badge could not be verified'}
                </p>
              </div>

              <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-300">
                  The badge you are trying to verify may have been revoked, expired, or does not exist.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          Powered by Forge Cyber Defense • Forge Cyber Defense, LLC
        </p>
      </div>
    </div>
  );
}
