import React from 'react';

/**
 * Loading spinner component used as Suspense fallback for lazy-loaded pages.
 * Displays a centered spinner while page chunks are being loaded.
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forge-navy-900 dark:border-forge-green-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    </div>
  );
}
