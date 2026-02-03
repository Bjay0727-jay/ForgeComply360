import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  systems: number;
  controls: {
    implemented: number;
    partially_implemented: number;
    planned: number;
    not_implemented: number;
    not_applicable: number;
    total: number;
  };
  compliance_percentage: number;
  poams: { open: number; in_progress: number; completed: number; total: number };
  evidence_count: number;
  risks: { low: number; moderate: number; high: number; critical: number };
}

interface FrameworkStat {
  framework_id: string;
  framework_name: string;
  implemented: number;
  partially_implemented: number;
  planned: number;
  not_implemented: number;
  not_applicable: number;
  total: number;
}

interface GapItem {
  family: string;
  framework_name: string;
  count: number;
}

interface MonitoringDashboard {
  health_score: number;
  active_rules: number;
  recent_alerts: number;
}

interface TrendPoint {
  date: string;
  compliance_percentage: number;
}

interface MyWorkData {
  my_poams: { id: string; title: string; status: string; scheduled_completion: string }[];
  my_evidence_schedules: { id: string; title: string; next_due_date: string; cadence: string }[];
  my_audit_tasks: { id: string; title: string; completed: number; due_date: string }[];
  counts: { poams: number; overdue_poams: number; evidence_due: number; audit_tasks: number };
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { t, nav, isFederal, isHealthcare } = useExperience();
  const { user, canEdit, canManage } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // New data sources
  const [frameworkStats, setFrameworkStats] = useState<FrameworkStat[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapItem[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringDashboard | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState('');
  const [scheduleStats, setScheduleStats] = useState<{ total: number; overdue: number; due_this_week: number; due_this_month: number } | null>(null);
  const [auditScore, setAuditScore] = useState<{ score: number; passed_checks: number; total_checks: number } | null>(null);
  const [myWork, setMyWork] = useState<MyWorkData | null>(null);
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number | null>(null);

  useEffect(() => {
    // Core dashboard stats (always loaded)
    api<{ stats: DashboardStats }>('/api/v1/dashboard/stats')
      .then((d) => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Framework-level compliance stats (always loaded)
    api<{ frameworks: FrameworkStat[]; gap_analysis: GapItem[] }>('/api/v1/dashboard/framework-stats')
      .then((d) => {
        setFrameworkStats(d.frameworks || []);
        setGapAnalysis(d.gap_analysis || []);
      })
      .catch(() => {});

    // Analyst+ data
    if (canEdit) {
      // Compliance trends
      api<{ trends: TrendPoint[] }>('/api/v1/compliance/trends?days=30')
        .then((d) => setTrends(d.trends || []))
        .catch(() => {});

      // My Work (personal items)
      api<MyWorkData>('/api/v1/dashboard/my-work')
        .then((d) => setMyWork(d))
        .catch(() => {});
    }

    // Manager+ data
    if (canManage) {
      api<MonitoringDashboard>('/api/v1/monitoring/dashboard')
        .then((d) => setMonitoring(d))
        .catch(() => {});

      api<{ stats: { total: number; overdue: number; due_this_week: number; due_this_month: number } }>('/api/v1/evidence/schedules/stats')
        .then((d) => setScheduleStats(d.stats))
        .catch(() => {});

      api<{ readiness: { score: number; passed_checks: number; total_checks: number } }>('/api/v1/audit-prep/readiness')
        .then((d) => setAuditScore(d.readiness))
        .catch(() => {});

      api<{ count: number }>('/api/v1/approvals/pending/count')
        .then((d) => setPendingApprovalCount(d.count))
        .catch(() => {});
    }
  }, [canEdit, canManage]);

  const handleSnapshot = async () => {
    setSnapshotLoading(true);
    setSnapshotMsg('');
    try {
      await api('/api/v1/compliance/snapshot', { method: 'POST' });
      setSnapshotMsg('Snapshot saved successfully.');
      api<{ trends: TrendPoint[] }>('/api/v1/compliance/trends?days=30')
        .then((d) => setTrends(d.trends || []))
        .catch(() => {});
    } catch {
      setSnapshotMsg('Failed to take snapshot.');
    } finally {
      setSnapshotLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats;
  const compPct = s?.compliance_percentage || 0;
  const compColor =
    compPct >= 80 ? 'text-green-600' : compPct >= 50 ? 'text-yellow-600' : 'text-red-600';

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{nav('dashboard')}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t('compliance')} overview for your organization
        </p>
      </div>

      {/* Key Metrics — all roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title={`${t('compliance')} Score`}
          value={`${compPct}%`}
          subtitle={`${s?.controls.implemented || 0} of ${s?.controls.total || 0} ${t('control').toLowerCase()}s`}
          color={compColor}
        />
        <MetricCard
          title={nav('systems')}
          value={String(s?.systems || 0)}
          subtitle="Active information systems"
          color="text-blue-600"
        />
        <MetricCard
          title={isFederal ? 'POA&M Items' : t('milestone') + 's'}
          value={String(s?.poams.open || 0)}
          subtitle={`${s?.poams.in_progress || 0} in progress`}
          color="text-orange-600"
        />
        <MetricCard
          title={t('evidence')}
          value={String(s?.evidence_count || 0)}
          subtitle="Documents uploaded"
          color="text-purple-600"
        />
      </div>

      {/* Per-Framework Compliance Donuts — all roles */}
      {frameworkStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {t('compliance')} by Framework
          </h2>
          <div className="flex flex-wrap gap-8 justify-center">
            {frameworkStats.map((fw) => {
              const compliant = fw.implemented + fw.not_applicable;
              const pct = fw.total > 0 ? Math.round((compliant / fw.total) * 100) : 0;
              return (
                <DonutChart
                  key={fw.framework_id}
                  label={fw.framework_name}
                  percentage={pct}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MY WORK — analyst+ (personal items assigned to current user)     */}
      {/* ================================================================ */}
      {canEdit && myWork && (myWork.counts.poams > 0 || myWork.counts.evidence_due > 0 || myWork.counts.audit_tasks > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900">My Work</h2>
            {(myWork.counts.overdue_poams > 0 || myWork.counts.evidence_due > 0) && (
              <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {myWork.counts.overdue_poams + myWork.counts.evidence_due} overdue
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* My POA&Ms */}
            <div className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">{isFederal ? 'My POA&Ms' : `My ${t('milestone')}s`}</h3>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">{myWork.counts.poams}</span>
              </div>
              {myWork.my_poams.length > 0 ? (
                <div className="space-y-2">
                  {myWork.my_poams.map((p) => (
                    <div key={p.id} className="flex items-start justify-between text-xs">
                      <span className="text-gray-700 truncate flex-1 mr-2">{p.title}</span>
                      <span className={`whitespace-nowrap ${p.scheduled_completion && p.scheduled_completion < today ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {p.scheduled_completion ? new Date(p.scheduled_completion).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No assigned items</p>
              )}
              <a href="/poams" className="block mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">View All &rarr;</a>
            </div>

            {/* My Evidence Schedules */}
            <div className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">My Evidence</h3>
                {myWork.counts.evidence_due > 0 ? (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">{myWork.counts.evidence_due} due</span>
                ) : (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">On track</span>
                )}
              </div>
              {myWork.my_evidence_schedules.length > 0 ? (
                <div className="space-y-2">
                  {myWork.my_evidence_schedules.map((e) => (
                    <div key={e.id} className="flex items-start justify-between text-xs">
                      <span className="text-gray-700 truncate flex-1 mr-2">{e.title}</span>
                      <span className={`whitespace-nowrap ${e.next_due_date && e.next_due_date <= today ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {e.next_due_date ? new Date(e.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No evidence schedules</p>
              )}
              <a href="/evidence/schedules" className="block mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">View All &rarr;</a>
            </div>

            {/* My Audit Tasks */}
            <div className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">My Audit Tasks</h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">{myWork.counts.audit_tasks}</span>
              </div>
              {myWork.my_audit_tasks.length > 0 ? (
                <div className="space-y-2">
                  {myWork.my_audit_tasks.map((t) => (
                    <div key={t.id} className="flex items-start justify-between text-xs">
                      <span className="text-gray-700 truncate flex-1 mr-2">{t.title}</span>
                      <span className={`whitespace-nowrap ${t.due_date && t.due_date < today ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No assigned tasks</p>
              )}
              <a href="/audit-prep" className="block mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">View All &rarr;</a>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMPLIANCE TREND — analyst+ */}
      {/* ================================================================ */}
      {canEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Compliance Trend (30 Days)</h2>
            {canManage && (
              <button
                onClick={handleSnapshot}
                disabled={snapshotLoading}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {snapshotLoading ? 'Saving...' : 'Take Snapshot'}
              </button>
            )}
          </div>
          {snapshotMsg && (
            <p
              className={`text-xs mb-3 ${snapshotMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}
            >
              {snapshotMsg}
            </p>
          )}
          {trends.length >= 2 ? (
            <TrendChart data={trends} />
          ) : (
            <p className="text-gray-500 text-sm">
              Take a snapshot to start tracking compliance trends over time.
            </p>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* GAP ANALYSIS + MONITORING — manager+ */}
      {/* ================================================================ */}
      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Gap Analysis</h2>
            {gapAnalysis.length > 0 ? (
              <GapAnalysisPanel gaps={gapAnalysis} />
            ) : (
              <p className="text-gray-500 text-sm">
                No gap data available yet. Implement controls to see gap analysis.
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900 mb-4">Monitoring Health</h2>
            {monitoring ? (
              <MonitoringHealthWidget data={monitoring} />
            ) : (
              <p className="text-gray-500 text-sm">
                Monitoring data unavailable.{' '}
                <a href="/monitoring" className="text-blue-600 hover:underline">
                  Configure monitoring
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TWO-COLUMN GRID — role-filtered widgets */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Implementation Status — analyst+ */}
        {canEdit && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              {t('control')} Implementation Status
            </h2>
            {s && s.controls.total > 0 ? (
              <div className="space-y-3">
                <StatusBar label="Implemented" count={s.controls.implemented} total={s.controls.total} color="bg-green-500" />
                <StatusBar label="Partially Implemented" count={s.controls.partially_implemented} total={s.controls.total} color="bg-yellow-500" />
                <StatusBar label="Planned" count={s.controls.planned} total={s.controls.total} color="bg-blue-500" />
                <StatusBar label="Not Implemented" count={s.controls.not_implemented} total={s.controls.total} color="bg-red-500" />
                <StatusBar label="Not Applicable" count={s.controls.not_applicable} total={s.controls.total} color="bg-gray-400" />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No controls initialized yet. Select a system and framework to begin.
              </p>
            )}
          </div>
        )}

        {/* Risk Overview — manager+ */}
        {canManage && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">{t('risk')} Overview</h2>
            {s && s.risks.critical + s.risks.high + s.risks.moderate + s.risks.low > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <RiskBadge level="Critical" count={s.risks.critical} color="bg-red-100 text-red-800 border-red-200" />
                <RiskBadge level="High" count={s.risks.high} color="bg-orange-100 text-orange-800 border-orange-200" />
                <RiskBadge level="Moderate" count={s.risks.moderate} color="bg-yellow-100 text-yellow-800 border-yellow-200" />
                <RiskBadge level="Low" count={s.risks.low} color="bg-green-100 text-green-800 border-green-200" />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No risks recorded yet. Use the {t('risk')} module to track organizational risks.
              </p>
            )}
          </div>
        )}

        {/* POA&M Summary — manager+ */}
        {canManage && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              {isFederal ? 'POA&M' : t('milestone')} Summary
            </h2>
            {s && s.poams.total > 0 ? (
              <div className="space-y-3">
                <StatusBar label="Open" count={s.poams.open} total={s.poams.total} color="bg-red-500" />
                <StatusBar label="In Progress" count={s.poams.in_progress} total={s.poams.total} color="bg-yellow-500" />
                <StatusBar label="Completed" count={s.poams.completed} total={s.poams.total} color="bg-green-500" />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No {t('milestone').toLowerCase()}s created yet.
              </p>
            )}
          </div>
        )}

        {/* Audit Readiness — manager+ */}
        {canManage && auditScore && (
          <div className={`bg-white rounded-xl border p-6 ${auditScore.score >= 90 ? 'border-green-200' : auditScore.score >= 70 ? 'border-amber-200' : 'border-red-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Audit Readiness</h2>
              <a href="/audit-prep" className="text-sm text-blue-600 hover:text-blue-800">View Checklist &rarr;</a>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-3xl font-bold ${auditScore.score >= 90 ? 'text-green-600' : auditScore.score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {auditScore.score}%
              </span>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${auditScore.score >= 90 ? 'bg-green-500' : auditScore.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${auditScore.score}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{auditScore.passed_checks}/{auditScore.total_checks} checks passed</p>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Schedules — manager+ */}
        {canManage && scheduleStats && (scheduleStats.total > 0 || scheduleStats.overdue > 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Evidence Schedules</h2>
              <a href="/evidence/schedules" className="text-sm text-blue-600 hover:text-blue-800">View All &rarr;</a>
            </div>
            <div className="space-y-2">
              {scheduleStats.overdue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overdue</span>
                  <span className="font-semibold text-red-600">{scheduleStats.overdue}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Due This Week</span>
                <span className="font-semibold text-amber-600">{scheduleStats.due_this_week}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Due This Month</span>
                <span className="font-semibold text-blue-600">{scheduleStats.due_this_month}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-gray-600">Total Active</span>
                <span className="font-semibold text-gray-900">{scheduleStats.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals — manager+ */}
        {canManage && pendingApprovalCount !== null && pendingApprovalCount > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
              <a href="/approvals" className="text-sm text-blue-600 hover:text-blue-800">Review &rarr;</a>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <span className="text-xl font-bold text-amber-700">{pendingApprovalCount}</span>
              </div>
              <p className="text-sm text-gray-600">
                {pendingApprovalCount === 1 ? '1 request awaiting' : `${pendingApprovalCount} requests awaiting`} your review
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions — all roles (filtered) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction
              href="/controls"
              label={`Review ${t('control')}s`}
              description={`Browse and assess ${t('control').toLowerCase()}s`}
            />
            <QuickAction
              href="/crosswalks"
              label="View Crosswalks"
              description="Map controls across frameworks"
            />
            {canEdit && (
              <>
                <QuickAction
                  href="/evidence"
                  label={`Upload ${t('evidence')}`}
                  description="Add supporting documentation"
                />
                <QuickAction
                  href="/poams"
                  label={isFederal ? 'View POA&Ms' : `View ${t('milestone')}s`}
                  description="Track remediation items"
                />
              </>
            )}
            {canManage && (
              <>
                <QuickAction
                  href="/ssp"
                  label={`Generate ${t('documentShort')}`}
                  description={`Create ${t('document').toLowerCase()} package`}
                />
                <QuickAction
                  href="/reports"
                  label="Generate Reports"
                  description="Export compliance reports"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">
          {count} ({Math.round(pct)}%)
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RiskBadge({
  level,
  count,
  color,
}: {
  level: string;
  count: number;
  color: string;
}) {
  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs font-medium">{level}</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="block p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
    >
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart for per-framework compliance
// ---------------------------------------------------------------------------

function DonutChart({ label, percentage }: { label: string; percentage: number }) {
  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const strokeColor =
    percentage >= 80 ? '#16a34a' : percentage >= 50 ? '#ca8a04' : '#dc2626';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span
        className="text-lg font-bold -mt-16 mb-8"
        style={{ color: strokeColor }}
      >
        {percentage}%
      </span>
      <p className="text-xs text-gray-600 font-medium text-center max-w-[120px] truncate">
        {label}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gap Analysis Panel
// ---------------------------------------------------------------------------

function GapAnalysisPanel({ gaps }: { gaps: GapItem[] }) {
  const sorted = [...gaps].sort((a, b) => b.count - a.count).slice(0, 10);
  const maxCount = sorted.length > 0 ? sorted[0].count : 1;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-2">
        Top control families with unimplemented controls
      </p>
      {sorted.map((gap, idx) => {
        const widthPct = Math.max((gap.count / maxCount) * 100, 4);
        return (
          <div key={idx}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-700 font-medium truncate mr-2">
                {gap.family}
                {gap.framework_name ? (
                  <span className="text-gray-400 ml-1">({gap.framework_name})</span>
                ) : null}
              </span>
              <span className="text-gray-500 whitespace-nowrap">{gap.count} gaps</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-red-400 h-2 rounded-full transition-all"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monitoring Health Widget
// ---------------------------------------------------------------------------

function MonitoringHealthWidget({ data }: { data: MonitoringDashboard }) {
  const score = data.health_score;
  const scoreColor =
    score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bgColor =
    score >= 80 ? 'bg-green-50' : score >= 50 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className={`rounded-full w-24 h-24 flex items-center justify-center ${bgColor} mb-3`}>
        <span className={`text-3xl font-bold ${scoreColor}`}>{score}%</span>
      </div>
      <p className="text-sm text-gray-600 mb-1">Health Score</p>
      <div className="flex gap-4 text-xs text-gray-500 mt-2">
        <span>{data.active_rules} active rules</span>
        <span>{data.recent_alerts} recent alerts</span>
      </div>
      <a
        href="/monitoring"
        className="mt-3 text-xs text-blue-600 hover:underline font-medium"
      >
        View Monitoring Dashboard
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance Trend Chart (simple SVG line chart)
// ---------------------------------------------------------------------------

function TrendChart({ data }: { data: TrendPoint[] }) {
  const width = 600;
  const height = 160;
  const paddingX = 40;
  const paddingY = 20;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const minVal = Math.min(...data.map((d) => d.compliance_percentage));
  const maxVal = Math.max(...data.map((d) => d.compliance_percentage));
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW;
    const y = paddingY + chartH - ((d.compliance_percentage - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${paddingY + chartH} L ${points[0].x} ${paddingY + chartH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[600px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <text x={paddingX - 4} y={paddingY + 4} fontSize="9" fill="#9ca3af" textAnchor="end">
          {maxVal}%
        </text>
        <text
          x={paddingX - 4}
          y={paddingY + chartH + 4}
          fontSize="9"
          fill="#9ca3af"
          textAnchor="end"
        >
          {minVal}%
        </text>

        <line
          x1={paddingX}
          y1={paddingY}
          x2={paddingX + chartW}
          y2={paddingY}
          stroke="#e5e7eb"
          strokeDasharray="4 2"
        />
        <line
          x1={paddingX}
          y1={paddingY + chartH}
          x2={paddingX + chartW}
          y2={paddingY + chartH}
          stroke="#e5e7eb"
          strokeDasharray="4 2"
        />

        <path d={areaD} fill="url(#trendGrad)" />
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
        ))}

        {points.length > 0 && (
          <>
            <text
              x={points[0].x}
              y={paddingY + chartH + 14}
              fontSize="8"
              fill="#9ca3af"
              textAnchor="middle"
            >
              {formatShortDate(points[0].date)}
            </text>
            <text
              x={points[points.length - 1].x}
              y={paddingY + chartH + 14}
              fontSize="8"
              fill="#9ca3af"
              textAnchor="middle"
            >
              {formatShortDate(points[points.length - 1].date)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
