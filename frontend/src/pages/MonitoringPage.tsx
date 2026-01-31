import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

interface DashboardStats {
  health_score: number;
  total_checks: number;
  pass_count: number;
  fail_count: number;
  warning_count: number;
  not_run_count: number;
}

interface MonitoringCheck {
  id: string;
  check_name: string;
  check_type: string;
  frequency: string;
  check_description: string;
  system_id: string;
  control_id: string;
  framework_id: string;
  last_result: string | null;
  last_run_at: string | null;
  created_at: string;
}

interface CheckResult {
  id: string;
  result: string;
  notes: string;
  created_at: string;
  run_by_name: string;
}

interface SystemOption {
  id: string;
  name: string;
}

interface FrameworkOption {
  id: string;
  name: string;
}

const CHECK_TYPES = ['automated', 'manual', 'hybrid'];
const FREQUENCIES = ['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually'];
const RESULTS = ['pass', 'fail', 'warning', 'error'];

const TYPE_COLOR: Record<string, string> = {
  automated: 'bg-purple-100 text-purple-700',
  manual: 'bg-blue-100 text-blue-700',
  hybrid: 'bg-indigo-100 text-indigo-700',
};

const FREQ_COLOR: Record<string, string> = {
  continuous: 'bg-green-100 text-green-700',
  daily: 'bg-teal-100 text-teal-700',
  weekly: 'bg-blue-100 text-blue-700',
  monthly: 'bg-indigo-100 text-indigo-700',
  quarterly: 'bg-purple-100 text-purple-700',
  annually: 'bg-gray-100 text-gray-600',
};

const RESULT_DOT: Record<string, string> = {
  pass: 'bg-green-500',
  fail: 'bg-red-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-400',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HealthDonut({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        className="transition-all duration-700"
      />
      <text x="70" y="66" textAnchor="middle" className="text-2xl font-bold" fill="#111827" fontSize="28">
        {score}
      </text>
      <text x="70" y="88" textAnchor="middle" fill="#6b7280" fontSize="12">
        Health
      </text>
    </svg>
  );
}

export function MonitoringPage() {
  const { nav } = useExperience();
  const { canEdit, canManage } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [checks, setChecks] = useState<MonitoringCheck[]>([]);
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [frameworks, setFrameworks] = useState<FrameworkOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Create check form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    check_name: '',
    check_type: 'manual',
    frequency: 'monthly',
    check_description: '',
    system_id: '',
    control_id: '',
    framework_id: '',
  });
  const [saving, setSaving] = useState(false);

  // Expanded check + results
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CheckResult[]>>({});
  const [loadingResults, setLoadingResults] = useState<string | null>(null);

  // Run check inline form
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runForm, setRunForm] = useState({ result: 'pass', notes: '' });
  const [submittingRun, setSubmittingRun] = useState(false);

  const loadData = () => {
    Promise.all([
      api('/api/v1/monitoring/dashboard').catch(() => null),
      api('/api/v1/monitoring/checks').catch(() => ({ checks: [] })),
      api('/api/v1/systems').catch(() => ({ systems: [] })),
      api('/api/v1/frameworks/enabled').catch(() => ({ frameworks: [] })),
    ]).then(([dashData, checksData, sysData, fwData]) => {
      if (dashData) setStats(dashData);
      setChecks(checksData.checks || []);
      setSystems(sysData.systems || []);
      setFrameworks(fwData.frameworks || []);
      setLoading(false);
    });
  };

  useEffect(loadData, []);

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/v1/monitoring/checks', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      setShowCreate(false);
      setCreateForm({
        check_name: '',
        check_type: 'manual',
        frequency: 'monthly',
        check_description: '',
        system_id: '',
        control_id: '',
        framework_id: '',
      });
      loadData();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = async (checkId: string) => {
    if (expandedId === checkId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(checkId);
    if (!results[checkId]) {
      setLoadingResults(checkId);
      try {
        const data = await api(`/api/v1/monitoring/checks/${checkId}/results`);
        setResults((prev) => ({ ...prev, [checkId]: data.results || [] }));
      } catch {
        setResults((prev) => ({ ...prev, [checkId]: [] }));
      } finally {
        setLoadingResults(null);
      }
    }
  };

  const handleRunCheck = async (checkId: string) => {
    setSubmittingRun(true);
    try {
      await api(`/api/v1/monitoring/checks/${checkId}/run`, {
        method: 'POST',
        body: JSON.stringify(runForm),
      });
      setRunningId(null);
      setRunForm({ result: 'pass', notes: '' });
      // Refresh results for this check
      const data = await api(`/api/v1/monitoring/checks/${checkId}/results`);
      setResults((prev) => ({ ...prev, [checkId]: data.results || [] }));
      loadData();
    } catch {
    } finally {
      setSubmittingRun(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const healthScore = stats?.health_score ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ControlPulse {nav('monitoring')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Continuous monitoring and automated compliance checks
            </p>
          </div>
          <span
            className={`text-sm px-3 py-1 rounded-full font-semibold ${scoreBadgeClass(healthScore)}`}
          >
            {healthScore}% Health
          </span>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Create Check
          </button>
        )}
      </div>

      {/* Health Score Section */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-8">
            <HealthDonut score={healthScore} />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total_checks}</div>
                <div className="text-xs text-gray-500 mt-1">Total Checks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.pass_count}</div>
                <div className="text-xs text-gray-500 mt-1">Pass</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.fail_count}</div>
                <div className="text-xs text-gray-500 mt-1">Fail</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.warning_count}</div>
                <div className="text-xs text-gray-500 mt-1">Warning</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{stats.not_run_count}</div>
                <div className="text-xs text-gray-500 mt-1">Not Run</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Check Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Monitoring Check</h2>
          <form onSubmit={handleCreateCheck} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Check Name *"
                value={createForm.check_name}
                onChange={(e) => setCreateForm({ ...createForm, check_name: e.target.value })}
                required
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={createForm.check_type}
                onChange={(e) => setCreateForm({ ...createForm, check_type: e.target.value })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg"
              >
                {CHECK_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct.charAt(0).toUpperCase() + ct.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={createForm.frequency}
                onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={createForm.system_id}
                onChange={(e) => setCreateForm({ ...createForm, system_id: e.target.value })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg"
              >
                <option value="">Select System</option>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={createForm.framework_id}
                onChange={(e) => setCreateForm({ ...createForm, framework_id: e.target.value })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg"
              >
                <option value="">Select Framework</option>
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Control ID (e.g. AC-1)"
              value={createForm.control_id}
              onChange={(e) => setCreateForm({ ...createForm, control_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Check Description"
              value={createForm.check_description}
              onChange={(e) =>
                setCreateForm({ ...createForm, check_description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Check'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Checks List */}
      {checks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No monitoring checks yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checks.map((check) => {
            const isExpanded = expandedId === check.id;
            const checkResults = results[check.id] || [];
            const isLoadingResults = loadingResults === check.id;
            const isRunning = runningId === check.id;

            return (
              <div
                key={check.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Check Card Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(check.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Result indicator dot */}
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          check.last_result
                            ? RESULT_DOT[check.last_result] || 'bg-gray-300'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{check.check_name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {check.control_id && (
                            <span className="mr-2">{check.control_id}</span>
                          )}
                          Last run: {formatTimestamp(check.last_run_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          TYPE_COLOR[check.check_type] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {check.check_type}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          FREQ_COLOR[check.frequency] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {check.frequency}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    {check.check_description && (
                      <p className="text-sm text-gray-600 mb-4">{check.check_description}</p>
                    )}

                    {/* Run Check Button / Inline Form */}
                    {canEdit && !isRunning && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRunningId(check.id);
                          setRunForm({ result: 'pass', notes: '' });
                        }}
                        className="mb-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                      >
                        Run Check
                      </button>
                    )}

                    {isRunning && (
                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Record Check Result</h4>
                        <div className="space-y-3">
                          <select
                            value={runForm.result}
                            onChange={(e) => setRunForm({ ...runForm, result: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {RESULTS.map((r) => (
                              <option key={r} value={r}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </option>
                            ))}
                          </select>
                          <textarea
                            placeholder="Notes (optional)"
                            value={runForm.notes}
                            onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRunCheck(check.id)}
                              disabled={submittingRun}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              {submittingRun ? 'Submitting...' : 'Submit Result'}
                            </button>
                            <button
                              onClick={() => setRunningId(null)}
                              className="px-3 py-1.5 text-gray-600 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Result History */}
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Result History</h4>
                    {isLoadingResults ? (
                      <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : checkResults.length === 0 ? (
                      <p className="text-sm text-gray-400">No results recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {checkResults.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100"
                          >
                            <div
                              className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                                RESULT_DOT[r.result] || 'bg-gray-300'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-900 capitalize">
                                  {r.result}
                                </span>
                                <span className="text-gray-400">
                                  {formatTimestamp(r.created_at)}
                                </span>
                                {r.run_by_name && (
                                  <span className="text-gray-400">by {r.run_by_name}</span>
                                )}
                              </div>
                              {r.notes && (
                                <p className="text-xs text-gray-500 mt-1">{r.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
