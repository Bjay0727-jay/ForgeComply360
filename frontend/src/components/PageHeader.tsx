import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { BreadcrumbItem } from '../utils/breadcrumbConfig';
import { TYPOGRAPHY } from '../utils/typography';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** Optional: hide breadcrumbs for this page */
  hideBreadcrumbs?: boolean;
  /** Optional: provide custom breadcrumb trail instead of auto-detection */
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({
  title,
  subtitle,
  children,
  hideBreadcrumbs = false,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs render above the header card */}
      {!hideBreadcrumbs && <Breadcrumbs customCrumbs={breadcrumbs} />}

      {/* Existing header card */}
      <div className="bg-forge-navy-900 text-white rounded-xl px-6 py-5 border-l-4 border-forge-green-500">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h1 className={TYPOGRAPHY.pageTitle}>{title}</h1>
            {subtitle && (
              <p className={`${TYPOGRAPHY.pageSubtitle} mt-1`}>{subtitle}</p>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
