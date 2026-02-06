import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { matchRoute, resolvePath, BreadcrumbItem } from '../utils/breadcrumbConfig';

interface BreadcrumbsProps {
  /** Optional: override automatic detection with custom breadcrumbs */
  customCrumbs?: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation component.
 * Automatically detects the current route and displays appropriate breadcrumbs.
 * Only renders for nested routes that are configured in breadcrumbConfig.ts.
 */
export function Breadcrumbs({ customCrumbs }: BreadcrumbsProps) {
  const location = useLocation();
  const params = useParams();

  // Match current path against config patterns
  const config = matchRoute(location.pathname);

  // Use custom crumbs if provided, otherwise use config
  const crumbs = customCrumbs || config?.crumbs || [];

  // Don't render if no crumbs (not a nested route)
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const resolvedPath = resolvePath(crumb.path, params as Record<string, string>);

          return (
            <li key={index} className="flex items-center">
              {/* Separator (chevron) - not on first item */}
              {index > 0 && (
                <svg
                  className="w-4 h-4 mx-1.5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}

              {/* Current page (last item) - non-clickable */}
              {isLast || !resolvedPath ? (
                <span className="text-forge-navy-700 dark:text-forge-green-400 font-medium truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                /* Parent pages - clickable links */
                <Link
                  to={resolvedPath}
                  className="text-gray-500 dark:text-gray-400 hover:text-forge-green-600 dark:hover:text-forge-green-400 transition-colors truncate max-w-[200px]"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
