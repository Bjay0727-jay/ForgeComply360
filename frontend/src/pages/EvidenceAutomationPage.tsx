import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { validatedApi } from '../utils/validatedApi';
import { AutomationStatsSchema, AutomationStats } from '../types/api/evidence';
import { PageHeader } from '../components/PageHeader';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY } from '../utils/typography';

interface EvidenceTest {
  id: string;
  name: string;
  system_id: string;
  system_name: string;
  control_id: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  last_run: string | null;
  status: 'passed' | 'failed' | 'pending';
  enabled: boolean;
  description?: string;
}

type TabFilter = 'all' | 'passing' | 'failing' | 'disabled';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EvidenceAutomationPage() {
  const { nav } = useExperience();
  const { canEdit } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [tests, setTests] = useState<EvidenceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSchedule, setFilterSchedule] = useState('');
  const [filterSystem, setFilterSystem] = useState('');

  // Bulk run
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ ran: number; total: number } | null>(null);

  const loadData = async () => {
    try {
      const [statsData, testsData] = await Promise.all([
        validatedApi('/api/v1/evidence/automation/stats', AutomationStatsSchema),
        api('/api/v1/evidence/tests'),
      ]);
      setStats(statsData);
      setTests(testsData.tests || []);
    } catch {
      addToast({ type: 'error', title: 'Failed to load automation data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Unique systems for filter dropdown
  const uniqueSystems = useMemo(() => {
    const map = new Map<string, string>();
    tests.forEach((t) => map.set(t.system_id, t.system_name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [tests]);

  // ---------- Actions ----------

  const handleRunTest = async (testId: string) => {
    setRunningTests((prev) => new Set(prev).add(testId));
    try {
      await api(`/api/v1/evidence/tests/${testId}/run`, { method: 'POST' });
      addToast({ type: 'success', title: 'Test started', message: 'The test is now running' });
      loadData();
    } catch {
      addToast({ type: 'error', title: 'Failed to run test' });
    } finally {
      setRunningTests((prev) => { const n = new Set(prev); n.delete(testId); return n; });
    }
  };

  const handleBulkRun = async (filter: 'all' | 'failed') => {
    const enabledCount = tests.filter((t) => t.enabled && (filter === 'all' || t.status === 'failed')).length;
    if (enabledCount === 0) {
      addToast({ type: 'info', title: filter === 'failed' ? 'No failed tests to retry' : 'No enabled tests to run' });
      return;
    }
    setBulkRunning(true);
    setBulkProgress({ ran: 0, total: enabledCount });
    try {
      const data = await api('/api/v1/evidence/tests/bulk-run', {
        method: 'POST',
        body: JSON.stringify({ filter }),
      });
      const passed = (data.results || []).filter((r: { status: string }) => r.status === 'pass').length;
      const failed = (data.results || []).filter((r: { status: string }) => r.status !== 'pass').length;
      setBulkProgress({ ran: data.ran, total: enabledCount });
      addToast({
        type: failed > 0 ? 'warning' : 'success',
        title: `Bulk run complete: ${passed} passed, ${failed} failed`,
      });
      loadData();
    } catch {
      addToast({ type: 'error', title: 'Bulk run failed' });
    } finally {
      setBulkRunning(false);
      setTimeout(() => setBulkProgress(null), 3000);
    }
  };

  const handleToggleEnabled = async (test: EvidenceTest) => {
    try {
      await api(`/api/v1/evidence/tests/${test.id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !test.enabled }),
      });
      addToast({ type: 'success', title: test.enabled ? 'Test disabled' : 'Test enabled' });
      loadData();
    } catch {
      addToast({ type: 'error', title: 'Failed to update test' });
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    try {
      await api(`/api/v1/evidence/tests/${testId}`, { method: 'DELETE' });
      addToast({ type: 'success', title: 'Test deleted' });
      loadData();
    } catch {
      addToast({ type: 'error', title: 'Failed to delete test' });
    }
  };

  // ---------- Filtering ----------

  const filteredTests = useMemo(() => {
    let result = tests;

    // Tab filter
    if (activeTab === 'passing') result = result.filter((t) => t.status === 'passed' && t.enabled);
    else if (activeTab === 'failing') result = result.filter((t) => t.status === 'failed' && t.enabled);
    else if (activeTab === 'disabled') result = result.filter((t) => !t.enabled);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.system_name.toLowerCase().includes(q) ||
        t.control_id.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }

    // Schedule filter
    if (filterSchedule) result = result.filter((t) => t.schedule === filterSchedule);

    // System filter
    if (filterSystem) result = result.filter((t) => t.system_id === filterSystem);

    return result;
  }, [tests, activeTab, searchQuery, filterSchedule, filterSystem]);

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All Tests', count: tests.length },
    { key: 'passing', label: 'Passing', count: tests.filter((t) => t.status === 'passed' && t.enabled).length },
    { key: 'failing', label: 'Failing', count: tests.filter((t) => t.status === 'failed' && t.enabled).length },
    { key: 'disabled', label: 'Disabled', count: tests.filter((t) => !t.enabled).length },
  ];

  const scheduleColors: Record<string, string> = {
    daily: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    weekly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    monthly: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    manual: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  };

  const statusColors: Record<string, string> = {
    passed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  };

  const hasActiveFilters = searchQuery || filterSchedule || filterSystem;
  const failedCount = tests.filter((t) => t.status === 'failed' && t.enabled).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Evidence Automation" subtitle="Automated evidence collection and compliance testing">
        <Link to="/evidence" className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          Evidence Library
        </Link>
        {canEdit && (
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90">
            + Create Test
          </button>
        )}
      </PageHeader>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_tests ?? 0}</p>
            <div className="flex gap-1.5 mt-2">
              <span className="text-xs text-green-600 dark:text-green-400">{tests.filter((t) => t.enabled).length} enabled</span>
              <span className="text-xs text-gray-400">/</span>
              <span className="text-xs text-gray-500">{tests.filter((t) => !t.enabled).length} disabled</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pass Rate (24h)</p>
            <p className={`text-2xl font-bold mt-1 ${
              (stats.pass_rate_24h ?? 0) >= 90 ? 'text-green-600 dark:text-green-400' :
              (stats.pass_rate_24h ?? 0) >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>{(stats.pass_rate_24h ?? 0).toFixed(1)}%</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  (stats.pass_rate_24h ?? 0) >= 90 ? 'bg-green-500' :
                  (stats.pass_rate_24h ?? 0) >= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(stats.pass_rate_24h ?? 0, 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tests Run Today</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.tests_run_today ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Failed Tests</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.failed_tests ?? 0}</p>
            {(stats.failed_tests ?? 0) > 0 && (
              <button
                onClick={() => handleBulkRun('failed')}
                disabled={bulkRunning}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium mt-2 disabled:opacity-50"
              >
                Retry all failed
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Run Progress */}
      {bulkProgress && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center gap-3">
          {bulkRunning && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {bulkRunning ? 'Running tests...' : 'Bulk run complete'}
            </p>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5 mt-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-600 transition-all"
                style={{ width: `${bulkProgress.total ? (bulkProgress.ran / bulkProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {bulkProgress.ran}/{bulkProgress.total}
          </span>
        </div>
      )}

      {/* Toolbar: Tabs + Search + Filters + Bulk Actions */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label} <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={() => handleBulkRun('all')}
              disabled={bulkRunning || tests.filter((t) => t.enabled).length === 0}
              className="text-xs px-3 py-1.5 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Run All
            </button>
            {failedCount > 0 && (
              <button
                onClick={() => handleBulkRun('failed')}
                disabled={bulkRunning}
                className="text-xs px-3 py-1.5 rounded-md font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Retry Failed ({failedCount})
              </button>
            )}
          </div>
        </div>

        {/* Search + Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by name, system, or control..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterSchedule}
            onChange={(e) => setFilterSchedule(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">All Schedules</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="manual">Manual</option>
          </select>
          {uniqueSystems.length > 1 && (
            <select
              value={filterSystem}
              onChange={(e) => setFilterSystem(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="">All Systems</option>
              {uniqueSystems.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchQuery(''); setFilterSchedule(''); setFilterSystem(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {filteredTests.length} of {tests.length} test{tests.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Test List */}
      {filteredTests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            {hasActiveFilters ? 'No tests match your filters' : 'No tests found in this category'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchQuery(''); setFilterSchedule(''); setFilterSystem(''); }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader} dark:text-gray-400`}>Test Name</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader} dark:text-gray-400`}>System</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader} dark:text-gray-400`}>Control</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader} dark:text-gray-400`}>Schedule</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader} dark:text-gray-400`}>Last Run</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader} dark:text-gray-400`}>Status</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader} dark:text-gray-400`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTests.map((test) => (
                <tr key={test.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!test.enabled ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{test.name}</p>
                    {test.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{test.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{test.system_name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{test.control_id}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${scheduleColors[test.schedule]}`}>
                      {test.schedule}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs" title={test.last_run ? new Date(test.last_run).toLocaleString() : undefined}>
                    {timeAgo(test.last_run)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusColors[test.status]}`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunTest(test.id)}
                        disabled={runningTests.has(test.id) || !test.enabled}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50"
                      >
                        {runningTests.has(test.id) ? 'Running...' : 'Run Now'}
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <button className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                        Edit
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <Link
                        to={`/evidence/tests/${test.id}/results`}
                        className="text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      >
                        Results
                      </Link>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <button
                        onClick={() => handleToggleEnabled(test)}
                        className={`text-xs font-medium ${test.enabled ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400' : 'text-green-600 hover:text-green-800 dark:text-green-400'}`}
                      >
                        {test.enabled ? 'Disable' : 'Enable'}
                      </button>
                      {canEdit && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">|</span>
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Test Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Evidence Test</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="font-medium">EvidenceTestBuilder Component</p>
              <p className="text-sm mt-1">This component will be created separately</p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
