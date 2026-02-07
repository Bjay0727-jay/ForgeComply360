import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { useNotificationCount } from '../hooks/useNotificationCount';
import { useApprovalCount } from '../hooks/useApprovalCount';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTheme } from '../hooks/useTheme';
import { CommandPalette } from './CommandPalette';
import { TYPOGRAPHY } from '../utils/typography';

const ROLE_HIERARCHY: Record<string, number> = { viewer: 0, analyst: 1, manager: 2, admin: 3, owner: 4 };

interface NavItem {
  key: string;
  path: string;
  icon: string;
  label: string;
  minRole?: string;
  badge?: 'notifications' | 'approvals';
}

interface NavGroup {
  key: string;
  label: string;
  icon: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    items: [
      { key: 'dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard' },
      { key: 'calendar', path: '/calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Calendar', minRole: 'analyst' },
      { key: 'notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notifications', badge: 'notifications' },
    ],
  },
  {
    key: 'compliance',
    label: 'Compliance',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    items: [
      { key: 'systems', path: '/systems', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01', label: 'Systems' },
      { key: 'controls', path: '/controls', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Controls' },
      { key: 'assessment', path: '/assessment', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Assessment', minRole: 'analyst' },
      { key: 'questionnaires', path: '/questionnaires', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Questionnaires', minRole: 'manager' },
      { key: 'crosswalks', path: '/crosswalks', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', label: 'Crosswalks' },
      { key: 'systemComparison', path: '/system-comparison', icon: 'M4 6h4v12H4V6zm6 0h4v12h-4V6zm6 0h4v12h-4V6z', label: 'Compare', minRole: 'analyst' },
    ],
  },
  {
    key: 'remediation',
    label: 'Remediation',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    items: [
      { key: 'poams', path: '/poams', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'POA&Ms' },
      { key: 'evidence', path: '/evidence', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', label: 'Evidence' },
      { key: 'evidenceSchedules', path: '/evidence/schedules', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Schedules', minRole: 'analyst' },
      { key: 'evidenceAutomation', path: '/evidence/automation', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: 'Automation', minRole: 'manager' },
      { key: 'approvals', path: '/approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Approvals', minRole: 'analyst', badge: 'approvals' },
    ],
  },
  {
    key: 'documentation',
    label: 'Documentation',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    items: [
      { key: 'ssp', path: '/ssp', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'SSP' },
      { key: 'policies', path: '/policies', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Policies' },
      { key: 'auditPrep', path: '/audit-prep', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Audit Prep', minRole: 'analyst' },
      { key: 'reports', path: '/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Reports', minRole: 'manager' },
    ],
  },
  {
    key: 'riskMonitoring',
    label: 'Risk & Monitoring',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    items: [
      { key: 'risks', path: '/risks', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', label: 'Risks' },
      { key: 'monitoring', path: '/monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Monitoring' },
      { key: 'vendors', path: '/vendors', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label: 'Vendors' },
      { key: 'scans', path: '/scans', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z', label: 'Vuln Scans', minRole: 'analyst' },
      { key: 'assets', path: '/assets', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01', label: 'Assets' },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    items: [
      { key: 'aiWriter', path: '/ai-writer', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Authorization Packages' },
      { key: 'import', path: '/import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', label: 'Compliance Imports', minRole: 'manager' },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    items: [
      { key: 'users', path: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Users', minRole: 'admin' },
      { key: 'connectors', path: '/connectors', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', label: 'Connectors', minRole: 'admin' },
      { key: 'portals', path: '/portals', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', label: 'Auditor Portals', minRole: 'admin' },
      { key: 'auditLog', path: '/audit-log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Activity Log', minRole: 'admin' },
      { key: 'settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Settings' },
    ],
  },
];

const roleBadgeColors: Record<string, string> = {
  owner: 'bg-amber-400/20 text-amber-300',
  admin: 'bg-red-400/20 text-red-300',
  manager: 'bg-blue-400/20 text-blue-300',
  analyst: 'bg-green-400/20 text-green-300',
  viewer: 'bg-gray-400/20 text-gray-300',
};

function getGroupForPath(pathname: string): string | null {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)) {
        return group.key;
      }
    }
  }
  return null;
}

// Find the best (most specific) matching nav item path for current location
function getBestMatchingPath(pathname: string): string | null {
  let bestMatch: string | null = null;
  let bestMatchLength = 0;

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)) {
        if (item.path.length > bestMatchLength) {
          bestMatch = item.path;
          bestMatchLength = item.path.length;
        }
      }
    }
  }
  return bestMatch;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, org, logout } = useAuth();
  const { config, isFederal, isHealthcare } = useExperience();
  const { count: unreadCount } = useNotificationCount();
  const { count: pendingApprovals } = useApprovalCount();
  const { isDark, setTheme, theme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useKeyboardShortcuts();

  // Close sidebar on Escape (mobile)
  useEffect(() => {
    const handleCloseModal = () => setSidebarOpen(false);
    window.addEventListener('close-modal', handleCloseModal);
    return () => window.removeEventListener('close-modal', handleCloseModal);
  }, []);

  // Brand colors - using ForgeComply 360 logo colors (navy + green)
  const brandBg = 'bg-forge-navy-900';
  const brandHover = 'hover:bg-forge-navy-800';
  const brandActive = 'bg-forge-green-600';
  const brandActiveLight = 'bg-forge-navy-800';

  const userRoleLevel = ROLE_HIERARCHY[user?.role || 'viewer'] ?? 0;

  // Auto-expand the group containing the current page
  useEffect(() => {
    const activeGroup = getGroupForPath(location.pathname);
    if (activeGroup) {
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.add(activeGroup);
        return next;
      });
    }
  }, [location.pathname]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Filter groups: only show groups that have at least one visible item
  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.minRole) return true;
      return userRoleLevel >= (ROLE_HIERARCHY[item.minRole] ?? 99);
    }),
  })).filter(group => group.items.length > 0);

  // Count badges per group for collapsed indicator
  const getGroupBadgeCount = (group: NavGroup): number => {
    let count = 0;
    for (const item of group.items) {
      if (item.badge === 'notifications') count += unreadCount;
      if (item.badge === 'approvals') count += pendingApprovals;
    }
    return count;
  };

  const isGroupActive = (group: NavGroup): boolean => {
    return group.items.some(item =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    );
  };

  return (
    <div className="min-h-screen flex dark:bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 ${brandBg} text-white transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10 relative">
            <div className="flex items-center justify-center">
              <div className="p-2 rounded-xl border-2 border-forge-green-500 bg-forge-navy-950/50">
                <img src="/logo.png" alt="ForgeComply 360" className="w-36 h-auto" />
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Search */}
          <div className="px-3 pt-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">⌘K</kbd>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
            {visibleGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.key);
              const groupActive = isGroupActive(group);
              const badgeCount = getGroupBadgeCount(group);

              return (
                <div key={group.key}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={isExpanded}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      groupActive && !isExpanded ? `${brandActiveLight} text-white` : `text-white/60 ${brandHover} hover:text-white/90`
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={group.icon} />
                    </svg>
                    <span className={`${TYPOGRAPHY.navGroup} flex-1 text-left`}>{group.label}</span>
                    {!isExpanded && badgeCount > 0 && (
                      <span className={`bg-red-500 text-white ${TYPOGRAPHY.microBadge} px-1.5 py-0.5 rounded-full min-w-[16px] text-center`}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Group items */}
                  {isExpanded && (
                    <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                      {group.items.map((item) => {
                        // Only highlight the most specific matching path
                        const bestMatch = getBestMatchingPath(location.pathname);
                        const isActive = item.path === bestMatch;
                        return (
                          <Link
                            key={item.key}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive ? `${brandActive} text-white font-semibold` : `text-white/70 ${brandHover} hover:text-white`
                            }`}
                          >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                            </svg>
                            <span className="truncate font-semibold">{item.label}</span>
                            {item.badge === 'notifications' && unreadCount > 0 && (
                              <span className={`ml-auto bg-red-500 text-white ${TYPOGRAPHY.microBadge} px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                            {item.badge === 'approvals' && pendingApprovals > 0 && (
                              <span className={`ml-auto bg-yellow-500 text-white ${TYPOGRAPHY.microBadge} px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>
                                {pendingApprovals > 99 ? '99+' : pendingApprovals}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User / Org */}
          <div className="mt-auto p-3 border-t border-white/10">
            <div className="px-3 py-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white/90 truncate">{user?.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleBadgeColors[user?.role || 'viewer'] || roleBadgeColors.viewer}`}>
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-white/50 truncate">{org?.name}</p>
            </div>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 ${brandHover} hover:text-white mt-1`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-forge-navy-900 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1" aria-label="Open sidebar menu">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/logo.png" alt="ForgeComply 360" className="w-7 h-7 rounded object-cover" />
          <span className="font-semibold text-white">ForgeComply 360</span>
        </div>

        <div className="p-6 lg:p-8 dark:bg-gray-900">
          {children}
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
