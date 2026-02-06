import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { ScoreRadialChart, TrendAreaChart, MetricCard as ChartMetricCard } from '../components/charts';
import { STATUS_COLORS } from '../utils/chartTheme';
import { SkeletonMetricCards, SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { BUTTONS, FORMS, CARDS, BADGES } from '../utils/typography';
import { CHECK_TYPE_COLORS, FREQUENCY_COLORS, RESULT_DOTS, getScoreBadgeClass } from '../utils/colorSystem';

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
  is_active: number;
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

interface TrendPoint {
  snapshot_date: string;
  compliance_percentage: number;
  framework_name: string;
  system_name: string;
}

interface SnapshotDrift {
  system_id: string;
  framework_id: string;
  framework_name: string;
  system_name: string;
  current_date: string;
  current_pct: number;
  previous_date: string;
  previous_pct: number;
  delta: number;
}

interface ControlDrift {
  id: string;
  control_id: string;
  status: string;
  updated_at: string;
  system_name: string;
  framework_name: string;
}

const CHECK_TYPES = ['automated', 'manual', 'hybrid'];
const FREQUENCIES = ['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually'];
const RESULTS = ['pass', 'fail', 'warning', 'error'];

// Color constants imported from colorSystem.ts:
// CHECK_TYPE_COLORS, FREQUENCY_COLORS, RESULT_DOTS, getScoreBadgeClass

const FREQ_HOURS: Record<string, number> = {
  continuous: 1,
  daily: 24,
  weekly: 168,
  monthly: 720,
  quarterly: 2160,
  annually: 8760,
};

function isOverdue(check: MonitoringCheck): boolean {
  if (!check.last_run_at || !check.is_active) return false;
  const maxHours = FREQ_HOURS[check.frequency] || 720;
  const elapsed = (Date.now() - new Date(check.last_run_at).getTime()) / (1000 * 60 * 60);
  return elapsed > maxHours;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

// scoreBadgeClass imported from colorSystem.ts as getScoreBadgeClass

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

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// HealthDonut replaced by ScoreRadialChart from charts/

// TrendChart replaced by TrendAreaChart from charts/

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

  // Trend data
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendSystem, setTrendSystem] = useState('');
  const [trendFramework, setTrendFramework] = useState('');
  const [trendDays, setTrendDays] = useState('30');

  // Drift data
  const [snapshotDrift, setSnapshotDrift] = useState<SnapshotDrift[]>([]);
  const [controlDrift, setControlDrift] = useState<ControlDrift[]>([]);
  const [showDrift, setShowDrift] = useState(false);

  // Bulk run
  const [bulkSystem, setBulkSystem] = useState('');
  const [bulkRunning, setBulkRunning] = useState(false);

  const loadData = () => {
    Promise.all([
      api('/api/v1/monitoring/dashboard').catch(() => null),
      api('/api/v1/monitoring/checks').catch(() => ({ checks: [] })),
      api('/api/v1/systems').catch(() => ({ systems: [] })),
      api('/api/v1/frameworks/enabled').catch(() => ({ frameworks: [] })),
      api('/api/v1/monitoring/drift').catch(() => ({ drift: { snapshot_drift: [], control_drift: [] } })),
    ]).then(([dashData, checksData, sysData, fwData, driftData]) => {
      if (dashData) setStats(dashData);
      setChecks(checksData.checks || []);
      setSystems(sysData.systems || []);
      setFrameworks(fwData.frameworks || []);
      if (driftData?.drift) {
        setSnapshotDrift(driftData.drift.snapshot_drift || []);
        setControlDrift(driftData.drift.control_drift || []);
      }
      setLoading(false);
    });
  };

  useEffect(loadData, []);

  // Load trends when filters change
  useEffect(() => {
    const params = new URLSearchParams({ days: trendDays });
    if (trendSystem) params.set('system_id', trendSystem);
    if (trendFramework) params.set('framework_id', trendFramework);
    api(`/api/v1/compliance/trends?${params}`).then((d) => setTrendData(d.trends || [])).catch(() => setTrendData([]));
  }, [trendSystem, trendFramework, trendDays]);

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
      const data = await api(`/api/v1/monitoring/checks/${checkId}/results`);
      setResults((prev) => ({ ...prev, [checkId]: data.results || [] }));
      loadData();
    } catch {
    } finally {
      setSubmittingRun(false);
    }
  };

  const handleBulkRun = async () => {
    if (!bulkSystem) return;
    setBulkRunning(true);
    try {
      await api('/api/v1/monitoring/bulk-run', {
        method: 'POST',
        body: JSON.stringify({ system_id: bulkSystem, result: 'pass', notes: 'Bulk run — all checks pass' }),
      });
      loadData();
    } catch {
    } finally {
      setBulkRunning(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = (window as any).__API_BASE || '';
      const res = await fetch(`${baseUrl}/api/v1/monitoring/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'monitoring_checks.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  if (loading) return <div><SkeletonMetricCards /><SkeletonListItem count={5} /></div>;

  const healthScore = stats?.health_score ?? 0;
  const overdueCount = checks.filter((c) => isOverdue(c)).length;
  const latestPct = trendData.length > 0 ? trendData[trendData.length - 1].compliance_percentage : null;
  const prevPct = trendData.length > 1 ? trendData[0].compliance_percentage : null;
  const delta = latestPct !== null && prevPct !== null ? latestPct - prevPct : null;
  const totalDriftItems = snapshotDrift.length + controlDrift.length;

  return (
    <div>
      {/* Header */}
      <PageHeader title={`ControlPulse ${nav('monitoring')}`} subtitle="Continuous monitoring and automated compliance checks">
        <span className={`text-sm px-3 py-1 rounded-full font-semibold ${getScoreBadgeClass(healthScore)}`}>
          {healthScore}% Health
        </span>
        <button
          onClick={handleExportCSV}
          className={BUTTONS.secondary}
        >
          Export CSV
        </button>
        {canEdit && (
          <div className="flex items-center gap-1">
            <select
              value={bulkSystem}
              onChange={(e) => setBulkSystem(e.target.value)}
              className={FORMS.select}
            >
              <option value="">Bulk Run...</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {bulkSystem && (
              <button
                onClick={handleBulkRun}
                disabled={bulkRunning}
                className={BUTTONS.success}
              >
                {bulkRunning ? 'Running...' : 'Go'}
              </button>
            )}
          </div>
        )}
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className={BUTTONS.primary}
          >
            + Create Check
          </button>
        )}
      </PageHeader>

      {/* Health Score Section */}
      {stats && (
        <div className={`${CARDS.elevated} p-6 mb-6`}>
          <div className="flex items-center gap-8">
            <ScoreRadialChart score={healthScore} size={140} label="Health" thickness={14} />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-6 gap-4">
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
              <div className="text-center">
                <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{overdueCount}</div>
                <div className="text-xs text-gray-500 mt-1">Overdue</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Velocity Cards — Dark MetricCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ChartMetricCard
          title="Current Compliance"
          value={latestPct !== null ? `${latestPct}%` : '--'}
          accentColor={STATUS_COLORS.info}
        />
        <ChartMetricCard
          title="30-Day Delta"
          value={delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : '--'}
          trend={delta !== null ? { value: Math.round(delta), label: '%' } : undefined}
          accentColor={delta !== null ? (delta >= 0 ? STATUS_COLORS.success : STATUS_COLORS.danger) : STATUS_COLORS.muted}
        />
        <ChartMetricCard
          title="Overdue Checks"
          value={String(overdueCount)}
          subtitle={overdueCount === 0 ? 'All on schedule' : 'Action required'}
          accentColor={overdueCount > 0 ? STATUS_COLORS.danger : STATUS_COLORS.success}
        />
      </div>

      {/* Compliance Trends */}
      <div className={`${CARDS.elevated} p-6 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Compliance Trends</h2>
          <div className="flex items-center gap-2">
            <select value={trendSystem} onChange={(e) => setTrendSystem(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
              <option value="">All Systems</option>
              {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={trendFramework} onChange={(e) => setTrendFramework(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
              <option value="">All Frameworks</option>
              {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select value={trendDays} onChange={(e) => setTrendDays(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
        </div>
        {trendData.length >= 2 ? (
          <TrendAreaChart
            data={trendData.map((tp) => ({ date: tp.snapshot_date, value: tp.compliance_percentage }))}
            height={200}
            valueLabel="Compliance"
            valueSuffix="%"
          />
        ) : (
          <p className="text-sm text-gray-400 py-4 text-center">Need at least 2 snapshots for a trend line.</p>
        )}
      </div>

      {/* Drift Detection */}
      <div className={`${CARDS.elevated} mb-6 overflow-hidden`}>
        <button
          onClick={() => setShowDrift(!showDrift)}
          className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-900">Drift Detection</h2>
            {totalDriftItems > 0 && (
              <span className={`${BADGES.pill} ${BADGES.error}`}>
                {totalDriftItems} issue{totalDriftItems !== 1 ? 's' : ''}
              </span>
            )}
            {totalDriftItems === 0 && (
              <span className={`${BADGES.pill} ${BADGES.success}`}>No drift</span>
            )}
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDrift ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showDrift && (
          <div className="border-t border-gray-100 p-5 space-y-4">
            {/* Snapshot drift */}
            {snapshotDrift.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Framework Compliance Degradations</h3>
                <div className="space-y-2">
                  {snapshotDrift.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{d.framework_name}</span>
                        <span className="text-xs text-gray-500 ml-2">({d.system_name})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{d.previous_pct}%</span>
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700">{d.current_pct}%</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">{d.delta.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Control drift */}
            {controlDrift.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recently Degraded Controls (7 days)</h3>
                <div className="space-y-1">
                  {controlDrift.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-gray-900">{c.control_id}</span>
                        <span className="text-xs text-gray-500">{c.system_name} / {c.framework_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 capitalize">{c.status.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-400">{formatTimestamp(c.updated_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {totalDriftItems === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">No compliance drift detected. All systems stable.</p>
            )}
          </div>
        )}
      </div>

      {/* Create Check Form */}
      {showCreate && (
        <div className={`${CARDS.elevated} p-6 mb-6`}>
          <h2 className="font-semibold text-gray-900 mb-4">Create Monitoring Check</h2>
          <form onSubmit={handleCreateCheck} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Check Name *"
                value={createForm.check_name}
                onChange={(e) => setCreateForm({ ...createForm, check_name: e.target.value })}
                required
                className={FORMS.input}
              />
              <select
                value={createForm.check_type}
                onChange={(e) => setCreateForm({ ...createForm, check_type: e.target.value })}
                className={FORMS.select}
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
                className={FORMS.select}
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
                className={FORMS.select}
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
                className={FORMS.select}
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
              className={FORMS.input}
            />
            <textarea
              placeholder="Check Description"
              value={createForm.check_description}
              onChange={(e) =>
                setCreateForm({ ...createForm, check_description: e.target.value })
              }
              rows={3}
              className={FORMS.textarea}
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className={BUTTONS.primary}
              >
                {saving ? 'Creating...' : 'Create Check'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className={BUTTONS.ghost}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Checks List */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Monitoring Checks ({checks.length})</h2>
      </div>
      {checks.length === 0 ? (
        <EmptyState title="No monitoring checks found" subtitle="Create your first check to get started" />
      ) : (
        <div className="space-y-3">
          {checks.map((check) => {
            const isExpanded = expandedId === check.id;
            const checkResults = results[check.id] || [];
            const isLoadingResults = loadingResults === check.id;
            const isRunning = runningId === check.id;
            const overdue = isOverdue(check);

            return (
              <div
                key={check.id}
                className={`bg-white rounded-xl border overflow-hidden ${overdue ? 'border-red-300' : 'border-blue-200'}`}
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
                            ? RESULT_DOTS[check.last_result] || 'bg-gray-300'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{check.check_name}</h3>
                          {overdue && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold uppercase">Overdue</span>
                          )}
                        </div>
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
                          CHECK_TYPE_COLORS[check.check_type] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {check.check_type}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          FREQUENCY_COLORS[check.frequency] || 'bg-gray-100 text-gray-600'
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
                        className={`mb-4 ${BUTTONS.primary} ${BUTTONS.sm}`}
                      >
                        Run Check
                      </button>
                    )}

                    {isRunning && (
                      <div className={`mb-4 p-4 ${CARDS.base}`}>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Record Check Result</h4>
                        <div className="space-y-3">
                          <select
                            value={runForm.result}
                            onChange={(e) => setRunForm({ ...runForm, result: e.target.value })}
                            className={FORMS.select}
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
                            className={FORMS.textarea}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRunCheck(check.id)}
                              disabled={submittingRun}
                              className={`${BUTTONS.primary} ${BUTTONS.sm}`}
                            >
                              {submittingRun ? 'Submitting...' : 'Submit Result'}
                            </button>
                            <button
                              onClick={() => setRunningId(null)}
                              className={`${BUTTONS.ghost} ${BUTTONS.sm}`}
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
                                RESULT_DOTS[r.result] || 'bg-gray-300'
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
