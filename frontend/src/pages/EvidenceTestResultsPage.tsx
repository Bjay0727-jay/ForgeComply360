import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';

interface TestResult {
  id: string;
  run_at: string;
  status: 'passed' | 'failed';
  duration_ms: number;
  raw_result: string;
  extracted_value: string;
  pass_criteria: string;
  error_message?: string;
  evidence_id?: string;
  poam_id?: string;
}

interface TestDetails {
  id: string;
  name: string;
  system_name: string;
  system_id: string;
  control_id: string;
  control_name: string;
  description: string;
  last_run: string;
  total_runs: number;
  pass_rate: number;
  avg_duration_ms: number;
}

export function EvidenceTestResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { canEdit } = useAuth();
  const { t } = useExperience();
  const { addToast } = useToast();

  const [test, setTest] = useState<TestDetails | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [testData, resultsData] = await Promise.all([
        api(`/api/v1/evidence/tests/${id}`),
        api(`/api/v1/evidence/tests/${id}/results`),
      ]);
      setTest(testData.test || testData);
      setResults(resultsData.results || []);
    } catch {
      addToast({ type: 'error', title: 'Failed to load test results' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await api(`/api/v1/evidence/tests/${id}/run`, { method: 'POST', body: JSON.stringify({}) });
      addToast({ type: 'success', title: 'Test executed successfully' });
      load();
    } catch {
      addToast({ type: 'error', title: 'Test execution failed' });
    } finally {
      setRunning(false);
    }
  };

  const getLast30DaysChart = () => {
    const days: { date: string; passed: number; failed: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().split('T')[0], passed: 0, failed: 0 });
    }
    results.forEach((r) => {
      const date = r.run_at.split('T')[0];
      const day = days.find((d) => d.date === date);
      if (day) {
        if (r.status === 'passed') day.passed++;
        else day.failed++;
      }
    });
    return days;
  };

  const chartData = getLast30DaysChart();
  const maxRuns = Math.max(...chartData.map((d) => d.passed + d.failed), 1);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  if (!test) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Test not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={test.name}
        subtitle={`${test.system_name} - ${test.control_name}`}
      >
        <Link to="/evidence" className="px-3 py-2 text-sm text-white/80 hover:text-white border border-white/30 rounded-lg">
          Back to Evidence
        </Link>
        {canEdit && (
          <button
            onClick={handleRunNow}
            disabled={running}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50"
          >
            {running ? 'Running...' : 'Run Now'}
          </button>
        )}
      </PageHeader>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Runs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{test.total_runs}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pass Rate</p>
          <p className={`text-2xl font-bold mt-1 ${test.pass_rate >= 80 ? 'text-green-600' : test.pass_rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {test.pass_rate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Run</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {test.last_run ? new Date(test.last_run).toLocaleString() : 'Never'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Duration</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{test.avg_duration_ms}ms</p>
        </div>
      </div>

      {/* Chart - Last 30 Days */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Last 30 Days</h3>
        <div className="flex items-end gap-1 h-24">
          {chartData.map((day, idx) => {
            const total = day.passed + day.failed;
            const height = total > 0 ? (total / maxRuns) * 100 : 0;
            const passHeight = total > 0 ? (day.passed / total) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col justify-end h-full" title={`${day.date}: ${day.passed} passed, ${day.failed} failed`}>
                {total > 0 ? (
                  <div className="w-full rounded-t" style={{ height: `${height}%` }}>
                    <div className="bg-green-500 rounded-t" style={{ height: `${passHeight}%` }} />
                    <div className="bg-red-500 rounded-b" style={{ height: `${100 - passHeight}%` }} />
                  </div>
                ) : (
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded" />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Passed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> Failed</span>
        </div>
      </div>

      {/* Results Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Results History</h3>
        </div>
        {results.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No test results yet. Run the test to see results.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {results.map((r) => (
              <div key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${r.status === 'passed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {r.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{new Date(r.run_at).toLocaleString()}</span>
                    <span className="text-xs text-gray-400">{r.duration_ms}ms</span>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === r.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedId === r.id && (
                  <div className="px-4 pb-4 space-y-3 text-sm">
                    {r.error_message && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="font-medium text-red-700 dark:text-red-400">Error</p>
                        <p className="text-red-600 dark:text-red-300 mt-1">{r.error_message}</p>
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Extracted Value</p>
                        <p className="text-gray-900 dark:text-white font-mono">{r.extracted_value || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pass Criteria</p>
                        <p className="text-gray-900 dark:text-white font-mono">{r.pass_criteria || '-'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Raw Result</p>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono">
                        {r.raw_result ? JSON.stringify(JSON.parse(r.raw_result), null, 2) : '-'}
                      </pre>
                    </div>
                    <div className="flex gap-4">
                      {r.evidence_id && (
                        <Link to={`/evidence?id=${r.evidence_id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                          View Generated Evidence
                        </Link>
                      )}
                      {r.poam_id && (
                        <Link to={`/poams?id=${r.poam_id}`} className="text-amber-600 dark:text-amber-400 hover:underline text-sm">
                          View Created POA&M
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
