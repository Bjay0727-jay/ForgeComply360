import React from 'react';

function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || ''}`} style={style} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5', 'w-full', 'w-2/3'];
  return (
    <div className={`space-y-2.5 ${className || ''}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Pulse key={i} className={`h-3 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-6 ${className || ''}`}>
      <Pulse className="h-4 w-1/3 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b border-blue-100 dark:border-gray-600 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Pulse key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Pulse key={c} className={`h-3 flex-1 ${c === 0 ? 'max-w-[200px]' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonMetricCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-700 rounded-xl p-5 border border-blue-500/60 animate-pulse">
          <Pulse className="h-3 w-2/3 mb-3 bg-gray-600" />
          <Pulse className="h-7 w-1/2 mb-2 bg-gray-600" />
          <Pulse className="h-2.5 w-4/5 bg-gray-600" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonListItem({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-4 flex items-center gap-4 animate-pulse">
          <Pulse className="w-1.5 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Pulse className="h-4 w-2/5" />
            <Pulse className="h-3 w-3/4" />
          </div>
          <Pulse className="h-6 w-20 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonMetricCards count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-6 animate-pulse">
          <Pulse className="h-4 w-1/3 mb-6" />
          <div className="flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-8 border-gray-200 dark:border-gray-700" />
          </div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-6 animate-pulse">
          <Pulse className="h-4 w-1/4 mb-6" />
          <div className="flex items-end gap-2 h-40">
            {Array.from({ length: 8 }).map((_, i) => (
              <Pulse key={i} className="flex-1 rounded-t" style={{ height: `${30 + Math.random() * 70}%` }} />
            ))}
          </div>
        </div>
      </div>
      <SkeletonListItem count={3} />
    </div>
  );
}
