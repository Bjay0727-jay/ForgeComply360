import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

interface CommandItem {
  id: string;
  label: string;
  category: 'Pages' | 'Quick Actions' | 'Search Results';
  icon: string;
  action: () => void;
  keywords?: string;
  _searchResult?: any;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const go = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  const items: CommandItem[] = [
    // Pages
    { id: 'dashboard', label: 'Dashboard', category: 'Pages', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', action: () => go('/'), keywords: 'home overview' },
    { id: 'systems', label: 'Systems', category: 'Pages', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', action: () => go('/systems'), keywords: 'ato authorization' },
    { id: 'controls', label: 'Controls', category: 'Pages', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', action: () => go('/controls'), keywords: 'implementation nist' },
    { id: 'assessment', label: 'Assessment Wizard', category: 'Pages', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', action: () => go('/assessment'), keywords: 'evaluate status' },
    { id: 'crosswalks', label: 'Crosswalks', category: 'Pages', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', action: () => go('/crosswalks'), keywords: 'mapping framework' },
    { id: 'poams', label: 'POA&Ms', category: 'Pages', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', action: () => go('/poams'), keywords: 'remediation findings weakness' },
    { id: 'evidence', label: 'Evidence', category: 'Pages', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', action: () => go('/evidence'), keywords: 'artifacts upload documents' },
    { id: 'schedules', label: 'Evidence Schedules', category: 'Pages', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', action: () => go('/evidence/schedules'), keywords: 'recurring collection' },
    { id: 'approvals', label: 'Approvals', category: 'Pages', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', action: () => go('/approvals'), keywords: 'requests review' },
    { id: 'ssp', label: 'SSP Builder', category: 'Pages', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => go('/ssp'), keywords: 'system security plan document' },
    { id: 'policies', label: 'Policies', category: 'Pages', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', action: () => go('/policies'), keywords: 'governance procedures' },
    { id: 'audit-prep', label: 'Audit Prep', category: 'Pages', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', action: () => go('/audit-prep'), keywords: 'readiness checklist' },
    { id: 'reports', label: 'Reports', category: 'Pages', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => go('/reports'), keywords: 'export executive summary' },
    { id: 'risks', label: 'Risk Register', category: 'Pages', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', action: () => go('/risks'), keywords: 'threat vulnerability' },
    { id: 'monitoring', label: 'Monitoring', category: 'Pages', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', action: () => go('/monitoring'), keywords: 'continuous checks health' },
    { id: 'vendors', label: 'Vendors', category: 'Pages', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', action: () => go('/vendors'), keywords: 'third party supply chain' },
    { id: 'ai-writer', label: 'Authorization Packages', category: 'Pages', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => go('/ai-writer'), keywords: 'document generator ai writer' },
    { id: 'import', label: 'Compliance Imports', category: 'Pages', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', action: () => go('/import'), keywords: 'bulk upload csv' },
    { id: 'users', label: 'Users', category: 'Pages', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', action: () => go('/users'), keywords: 'team members roles' },
    { id: 'audit-log', label: 'Activity Log', category: 'Pages', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', action: () => go('/audit-log'), keywords: 'history events' },
    { id: 'settings', label: 'Settings', category: 'Pages', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', action: () => go('/settings'), keywords: 'preferences config organization' },
    { id: 'notifications', label: 'Notifications', category: 'Pages', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', action: () => go('/notifications'), keywords: 'alerts inbox' },
    { id: 'calendar', label: 'Calendar', category: 'Pages', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', action: () => go('/calendar'), keywords: 'schedule timeline' },

    // Quick Actions
    { id: 'new-risk', label: 'New Risk', category: 'Quick Actions', icon: 'M12 4v16m8-8H4', action: () => go('/risks'), keywords: 'create add' },
    { id: 'new-poam', label: 'New POA&M', category: 'Quick Actions', icon: 'M12 4v16m8-8H4', action: () => go('/poams'), keywords: 'create add finding' },
    { id: 'upload-evidence', label: 'Upload Evidence', category: 'Quick Actions', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', action: () => go('/evidence'), keywords: 'create add artifact' },
    { id: 'new-system', label: 'New System', category: 'Quick Actions', icon: 'M12 4v16m8-8H4', action: () => go('/systems'), keywords: 'create add' },
    { id: 'new-vendor', label: 'New Vendor', category: 'Quick Actions', icon: 'M12 4v16m8-8H4', action: () => go('/vendors'), keywords: 'create add third party' },
  ];

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      api(`/api/v1/search?q=${encodeURIComponent(query.trim())}`)
        .then(d => setSearchResults(d.results || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [query]);

  const getSearchResultPath = (result: any): string => {
    switch (result.type) {
      case 'system': return `/systems`;
      case 'poam': return `/poams`;
      case 'risk': return `/risks`;
      case 'vendor': return `/vendors`;
      case 'policy': return `/policies`;
      case 'evidence': return `/evidence`;
      default: return '/';
    }
  };

  const getSearchResultIcon = (type: string): string => {
    switch (type) {
      case 'system': return 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2';
      case 'poam': return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
      case 'risk': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'vendor': return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      case 'policy': return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'evidence': return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
      default: return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'system': return 'System';
      case 'poam': return 'POA&M';
      case 'risk': return 'Risk';
      case 'vendor': return 'Vendor';
      case 'policy': return 'Policy';
      case 'evidence': return 'Evidence';
      default: return type;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'system': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'poam': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      case 'risk': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'vendor': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'policy': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
      case 'evidence': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const searchCommandItems: CommandItem[] = searchResults.map((r, i) => ({
    id: `search-${r.type}-${r.id}-${i}`,
    label: r.title,
    category: 'Search Results' as const,
    icon: getSearchResultIcon(r.type),
    action: () => go(getSearchResultPath(r)),
    keywords: r.subtitle || '',
    _searchResult: r,
  }));

  // Filter items by query
  const filtered = query.trim()
    ? items.filter(item => {
        const q = query.toLowerCase();
        return item.label.toLowerCase().includes(q)
          || item.category.toLowerCase().includes(q)
          || (item.keywords && item.keywords.toLowerCase().includes(q));
      })
    : items;

  // Group by category
  const grouped: Record<string, CommandItem[]> = {};
  for (const item of filtered) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  const categories = Object.keys(grouped);

  // Add search results as a category
  if (searchCommandItems.length > 0) {
    grouped['Search Results'] = searchCommandItems;
    if (!categories.includes('Search Results')) categories.unshift('Search Results');
  }

  // Flatten for index tracking
  const flatItems = categories.flatMap(cat => grouped[cat]);

  // Open/close handlers
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setQuery('');
      setSelectedIndex(0);
    };
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Also listen for Ctrl+K directly as a fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
      e.preventDefault();
      flatItems[selectedIndex].action();
      setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, data..."
            className="flex-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {searching && (
            <div className="flex items-center justify-center gap-2 py-3">
              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs text-gray-400">Searching data...</span>
            </div>
          )}
          {flatItems.length === 0 && !searching && (
            <p className="text-sm text-gray-400 text-center py-8">No results found</p>
          )}
          {categories.map(category => (
            <div key={category}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">{category}</p>
              {grouped[category].map(item => {
                const idx = globalIndex++;
                const sr = item._searchResult;
                return (
                  <button
                    key={item.id}
                    data-index={idx}
                    onClick={() => { item.action(); setOpen(false); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                      idx === selectedIndex ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg className={`w-4 h-4 flex-shrink-0 ${idx === selectedIndex ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.label}</span>
                      {sr?.subtitle && (
                        <span className="ml-2 text-xs text-gray-400 truncate">{sr.subtitle}</span>
                      )}
                    </div>
                    {sr && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getTypeColor(sr.type)}`}>
                        {getTypeLabel(sr.type)}
                      </span>
                    )}
                    {idx === selectedIndex && (
                      <span className="ml-auto text-[10px] text-blue-400">↵ Enter</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 rounded border text-[9px]">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 rounded border text-[9px]">↵</kbd> Open</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 rounded border text-[9px]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
