import React, { useState, useEffect } from 'react';
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

  const loadData = async () => {
    try {
      const [statsData, testsData] = await Promise.all([
        // Use validatedApi for stats to ensure pass_rate_24h always has a default value
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

  const filteredTests = tests.filter((t) => {
    if (activeTab === 'passing') return t.status === 'passed' && t.enabled;
    if (activeTab === 'failing') return t.status === 'failed' && t.enabled;
    if (activeTab === 'disabled') return !t.enabled;
    return true;
  });

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
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pass Rate (24h)</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{(stats.pass_rate_24h ?? 0).toFixed(1)}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tests Run Today</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.tests_run_today ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Failed Tests</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.failed_tests ?? 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
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

      {/* Test List */}
      {filteredTests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No tests found in this category</p>
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
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {test.last_run ? new Date(test.last_run).toLocaleString() : 'Never'}
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
                      <button className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                        Results
                      </button>
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
