// Breadcrumb configuration and utilities

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbConfigEntry {
  crumbs: BreadcrumbItem[];
}

type BreadcrumbConfig = Record<string, BreadcrumbConfigEntry>;

/**
 * Configuration map for all nested routes that need breadcrumbs.
 * The last crumb in each array is the current page (non-clickable).
 */
export const BREADCRUMB_CONFIG: BreadcrumbConfig = {
  // Evidence Module
  '/evidence/schedules': {
    crumbs: [
      { label: 'Evidence', path: '/evidence' },
      { label: 'Schedules', path: '' },
    ],
  },
  '/evidence/automation': {
    crumbs: [
      { label: 'Evidence', path: '/evidence' },
      { label: 'Automation', path: '' },
    ],
  },
  '/evidence/tests/:id/results': {
    crumbs: [
      { label: 'Evidence', path: '/evidence' },
      { label: 'Automation', path: '/evidence/automation' },
      { label: 'Test Results', path: '' },
    ],
  },

  // Questionnaires Module
  '/questionnaires/new': {
    crumbs: [
      { label: 'Questionnaires', path: '/questionnaires' },
      { label: 'New Questionnaire', path: '' },
    ],
  },
  '/questionnaires/:id/edit': {
    crumbs: [
      { label: 'Questionnaires', path: '/questionnaires' },
      { label: 'Edit Questionnaire', path: '' },
    ],
  },
  '/questionnaires/:id/responses': {
    crumbs: [
      { label: 'Questionnaires', path: '/questionnaires' },
      { label: 'Responses', path: '' },
    ],
  },

  // Auditor Portals Module
  '/portals/new': {
    crumbs: [
      { label: 'Auditor Portals', path: '/portals' },
      { label: 'New Portal', path: '' },
    ],
  },
  '/portals/:id/edit': {
    crumbs: [
      { label: 'Auditor Portals', path: '/portals' },
      { label: 'Edit Portal', path: '' },
    ],
  },
  '/portals/:id/activity': {
    crumbs: [
      { label: 'Auditor Portals', path: '/portals' },
      { label: 'Activity', path: '' },
    ],
  },

  // SSP Module
  '/ssp/compare': {
    crumbs: [
      { label: 'SSP', path: '/ssp' },
      { label: 'Compare', path: '' },
    ],
  },
};

/**
 * Convert a route pattern with :param placeholders to a regex.
 * e.g., '/evidence/tests/:id/results' -> /^\/evidence\/tests\/[^/]+\/results$/
 */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/:[^/]+/g, '[^/]+'); // Replace :params with wildcard
  return new RegExp(`^${escaped}$`);
}

/**
 * Match a pathname against route patterns in the config.
 * Returns the matching config entry or null if no match.
 */
export function matchRoute(pathname: string): BreadcrumbConfigEntry | null {
  // First try exact match
  if (BREADCRUMB_CONFIG[pathname]) {
    return BREADCRUMB_CONFIG[pathname];
  }

  // Try pattern matching for dynamic routes
  for (const pattern of Object.keys(BREADCRUMB_CONFIG)) {
    if (pattern.includes(':')) {
      const regex = patternToRegex(pattern);
      if (regex.test(pathname)) {
        return BREADCRUMB_CONFIG[pattern];
      }
    }
  }

  return null;
}

/**
 * Resolve a path template with actual param values.
 * e.g., '/questionnaires/:id/edit' with {id: '123'} -> '/questionnaires/123/edit'
 */
export function resolvePath(
  path: string,
  params: Record<string, string | undefined>
): string {
  if (!path) return '';
  let resolved = path;
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      resolved = resolved.replace(`:${key}`, value);
    }
  }
  return resolved;
}
