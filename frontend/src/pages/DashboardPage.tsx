import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { validatedApi } from '../utils/validatedApi';
import { DashboardStatsResponseSchema, MonitoringResponseSchema } from '../types/api/dashboard';
import type { Activity, AlertSummary, ExecutiveSummary } from '../types/api';
import { PageHeader } from '../components/PageHeader';
import {
  TrendAreaChart,
  ScoreRadialChart,
  HorizontalBarList,
  StackedStatusBar,
  MetricCard as ChartMetricCard,
} from '../components/charts';
import { STATUS_COLORS, GRADE_COLORS } from '../utils/chartTheme';
import { DashboardSkeleton } from '../components/Skeleton';
import { TYPOGRAPHY } from '../utils/typography';

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

interface ScoreDimension {
  score: number;
  weight: number;
}

interface ComplianceScoreResult {
  score: number;
  grade: string;
  dimensions: Record<string, ScoreDimension>;
  previous_score: number | null;
}

interface ComplianceScoreEntry {
  system_id: string;
  system_name: string;
  framework_id: string;
  framework_name: string;
  score: number;
  grade: string;
  dimensions: Record<string, ScoreDimension>;
  previous_score: number | null;
}

interface ComplianceScoresResponse {
  scores: ComplianceScoreEntry[];
  org_score: ComplianceScoreResult;
}

interface AssetSummary {
  summary: {
    total_assets: number;
    assets_with_critical: number;
    assets_with_high: number;
    recently_discovered: number;
    vulnerabilities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  by_system: { system_name: string; system_id: string; count: number }[];
  by_environment: { environment: string; count: number }[];
  recently_discovered: { id: string; hostname: string; ip_address: string; discovery_source: string; first_seen_at: string; risk_score: number }[];
  top_risk_assets: { id: string; hostname: string; ip_address: string; risk_score: number; environment: string; system_name: string; critical_count: number; high_count: number }[];
}

const DIMENSION_META: Record<string, { label: string; icon: string; href: string }> = {
  control: { label: 'Controls', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', href: '/controls' },
  poam: { label: 'POA&Ms', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', href: '/poams' },
  evidence: { label: 'Evidence', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', href: '/evidence' },
  risk: { label: 'Risk Posture', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', href: '/risks' },
  monitoring: { label: 'Monitoring', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', href: '/monitoring' },
};

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { t, nav, isFederal, isHealthcare } = useExperience();
  const { user, canEdit, canManage } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [compScores, setCompScores] = useState<ComplianceScoresResponse | null>(null);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);

  // Executive summary (manager+)
  const [execSummary, setExecSummary] = useState<ExecutiveSummary | null>(null);

  // Asset summary
  const [assetSummary, setAssetSummary] = useState<AssetSummary | null>(null);

  useEffect(() => {
    // Use validatedApi for dashboard stats - ensures all fields have defaults
    validatedApi('/api/v1/dashboard/stats', DashboardStatsResponseSchema)
      .then((d) => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false));

    api<{ frameworks: FrameworkStat[]; gap_analysis: GapItem[] }>('/api/v1/dashboard/framework-stats')
      .then((d) => {
        setFrameworkStats(d.frameworks || []);
        setGapAnalysis(d.gap_analysis || []);
      })
      .catch(() => {});

    if (canEdit) {
      api<any>('/api/v1/alerts/summary').then((d) => setAlertSummary(d)).catch(() => {});
      api<ComplianceScoresResponse>('/api/v1/compliance/scores').then((d) => setCompScores(d)).catch(() => {});
      api<{ trends: TrendPoint[] }>('/api/v1/compliance/trends?days=30').then((d) => setTrends(d.trends || [])).catch(() => {});
      api<MyWorkData>('/api/v1/dashboard/my-work').then((d) => setMyWork(d)).catch(() => {});
      api('/api/v1/activity/recent?limit=15').then((d: any) => setActivities(d.activities || [])).catch(() => {});
      api<AssetSummary>('/api/v1/dashboard/asset-summary').then((d) => setAssetSummary(d)).catch(() => {});
    }

    if (canManage) {
      // Use validatedApi for monitoring - ensures health_score has a default
      validatedApi('/api/v1/monitoring/dashboard', MonitoringResponseSchema)
        .then((d) => setMonitoring(d.dashboard))
        .catch(() => {});
      api<{ stats: { total: number; overdue: number; due_this_week: number; due_this_month: number } }>('/api/v1/evidence/schedules/stats').then((d) => setScheduleStats(d.stats)).catch(() => {});
      api<{ readiness: { score: number; passed_checks: number; total_checks: number } }>('/api/v1/audit-prep/readiness').then((d) => setAuditScore(d.readiness)).catch(() => {});
      api<{ count: number }>('/api/v1/approvals/pending/count').then((d) => setPendingApprovalCount(d.count)).catch(() => {});
      api('/api/v1/dashboard/executive-summary').then(d => setExecSummary(d)).catch(() => {});
    }
  }, [canEdit, canManage]);

  const handleSnapshot = async () => {
    setSnapshotLoading(true);
    setSnapshotMsg('');
    try {
      await api('/api/v1/compliance/snapshot', { method: 'POST' });
      setSnapshotMsg('Snapshot saved successfully.');
      api<{ trends: TrendPoint[] }>('/api/v1/compliance/trends?days=30').then((d) => setTrends(d.trends || [])).catch(() => {});
    } catch {
      setSnapshotMsg('Failed to take snapshot.');
    } finally {
      setSnapshotLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const s = stats;
  const compPct = s?.compliance_percentage || 0;
  const today = new Date().toISOString().split('T')[0];
  const orgScore = compScores?.org_score;
  const trend = orgScore?.previous_score !== null && orgScore?.previous_score !== undefined
    ? orgScore.score - orgScore.previous_score
    : null;

  return (
    <div>
      <PageHeader title={nav('dashboard')} subtitle={`${t('compliance')} overview for your organization`} />

      {/* Compliance Alert Banner */}
      {alertSummary && alertSummary.total > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="font-semibold text-amber-800">{alertSummary.total} Compliance Alert{alertSummary.total !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertSummary.poams_overdue > 0 && (
              <a href="/poams" className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{alertSummary.poams_overdue} POA&M overdue
              </a>
            )}
            {alertSummary.poams_upcoming > 0 && (
              <a href="/poams" className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />{alertSummary.poams_upcoming} POA&M due soon
              </a>
            )}
            {alertSummary.ato_expiring > 0 && (
              <a href="/systems" className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium hover:bg-amber-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />{alertSummary.ato_expiring} ATO expiring
              </a>
            )}
            {alertSummary.vendor_assessments_due > 0 && (
              <a href="/vendors" className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />{alertSummary.vendor_assessments_due} vendor assessment{alertSummary.vendor_assessments_due !== 1 ? 's' : ''} due
              </a>
            )}
            {alertSummary.vendor_contracts_ending > 0 && (
              <a href="/vendors" className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />{alertSummary.vendor_contracts_ending} contract{alertSummary.vendor_contracts_ending !== 1 ? 's' : ''} ending
              </a>
            )}
            {alertSummary.risks_overdue > 0 && (
              <a href="/risks" className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium hover:bg-rose-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />{alertSummary.risks_overdue} risk treatment overdue
              </a>
            )}
            {alertSummary.policies_review_due > 0 && (
              <a href="/policies" className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />{alertSummary.policies_review_due} policy review{alertSummary.policies_review_due !== 1 ? 's' : ''} due
              </a>
            )}
            {alertSummary.evidence_expired > 0 && (
              <a href="/evidence" className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{alertSummary.evidence_expired} evidence expired
              </a>
            )}
            {alertSummary.evidence_expiring > 0 && (
              <a href="/evidence" className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />{alertSummary.evidence_expiring} evidence expiring
              </a>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* KEY METRICS — Dark MetricCards with sparklines */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/controls" className="block group hover:shadow-md transition-shadow rounded-xl">
          {orgScore ? (
            <ChartMetricCard
              title={`${t('compliance')} Score`}
              value={`${orgScore.grade}`}
              subtitle={`${orgScore.score}/100 — ${s?.controls.implemented || 0} of ${s?.controls.total || 0} ${t('control').toLowerCase()}s`}
              trend={trend !== null ? { value: trend, label: ' pts' } : undefined}
              accentColor={GRADE_COLORS[orgScore.grade] || STATUS_COLORS.info}
            />
          ) : (
            <ChartMetricCard
              title={`${t('compliance')} Score`}
              value={`${compPct}%`}
              subtitle={`${s?.controls.implemented || 0} of ${s?.controls.total || 0} ${t('control').toLowerCase()}s`}
              accentColor={compPct >= 80 ? STATUS_COLORS.success : compPct >= 50 ? STATUS_COLORS.warning : STATUS_COLORS.danger}
            />
          )}
        </Link>
        <Link to="/systems" className="block group hover:shadow-md transition-shadow rounded-xl">
          <ChartMetricCard
            title={nav('systems')}
            value={String(s?.systems || 0)}
            subtitle="Active information systems"
            accentColor={STATUS_COLORS.info}
          />
        </Link>
        <Link to="/poams" className="block group hover:shadow-md transition-shadow rounded-xl">
          <ChartMetricCard
            title={isFederal ? 'POA&M Items' : t('milestone') + 's'}
            value={String(s?.poams.open || 0)}
            subtitle={`${s?.poams.in_progress || 0} in progress`}
            accentColor={STATUS_COLORS.orange}
          />
        </Link>
        <Link to="/evidence" className="block group hover:shadow-md transition-shadow rounded-xl">
          <ChartMetricCard
            title={t('evidence')}
            value={String(s?.evidence_count || 0)}
            subtitle="Documents uploaded"
            accentColor="#8b5cf6"
          />
        </Link>
      </div>

      {/* Executive Summary — Manager+ */}
      {canManage && execSummary && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-forge-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Weekly Executive Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-gray-900">{execSummary.current_score}%</span>
                {execSummary.score_delta !== 0 && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${execSummary.score_delta > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {execSummary.score_delta > 0 ? '\u2191' : '\u2193'}{Math.abs(execSummary.score_delta)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Compliance Score</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{execSummary.poams_closed}</p>
              <p className="text-xs text-gray-500 mt-1">POA&Ms Closed</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{execSummary.new_risks}</p>
              <p className="text-xs text-gray-500 mt-1">New Risks</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-forge-navy-700">{execSummary.evidence_uploaded}</p>
              <p className="text-xs text-gray-500 mt-1">Evidence Uploaded</p>
            </div>
          </div>
          {execSummary.team_activity && execSummary.team_activity.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Team Activity (Past 7 Days)</p>
              <div className="space-y-1.5">
                {execSummary.team_activity.slice(0, 5).map((ta: any) => {
                  const maxActions = Math.max(...execSummary.team_activity.map((t: any) => t.actions_count));
                  return (
                    <div key={ta.user_id} className="flex items-center gap-3">
                      <span className="text-xs text-gray-700 w-28 truncate">{ta.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-forge-green-500 h-2 rounded-full" style={{ width: `${(ta.actions_count / maxActions) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{ta.actions_count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* PER-FRAMEWORK COMPLIANCE — Radial charts */}
      {/* ================================================================ */}
      {frameworkStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>
            {t('compliance')} by Framework
          </h2>
          <div className="flex flex-wrap gap-8 justify-center">
            {frameworkStats.map((fw) => {
              const compliant = fw.implemented + fw.not_applicable;
              const pct = fw.total > 0 ? Math.round((compliant / fw.total) * 100) : 0;
              const fwScores = compScores?.scores.filter(sc => sc.framework_id === fw.framework_id) || [];
              const avgScore = fwScores.length > 0
                ? Math.round(fwScores.reduce((sum, sc) => sum + sc.score, 0) / fwScores.length)
                : null;
              const grade = avgScore !== null
                ? (avgScore >= 90 ? 'A' : avgScore >= 80 ? 'B' : avgScore >= 70 ? 'C' : avgScore >= 60 ? 'D' : 'F')
                : undefined;
              return (
                <div key={fw.framework_id} className="flex flex-col items-center">
                  <ScoreRadialChart
                    score={pct}
                    size={100}
                    grade={grade}
                    thickness={8}
                  />
                  <p className="text-xs text-gray-600 font-medium text-center max-w-[120px] truncate mt-2">
                    {fw.framework_name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Welcome Card — Viewers Only */}
      {!canEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className={`${TYPOGRAPHY.sectionTitle} mb-2`}>Welcome to ForgeComply 360</h2>
          <p className="text-sm text-gray-600 mb-4">You have view-only access to your organization's compliance posture. Contact an administrator to request elevated permissions.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/controls" className="flex items-center gap-3 p-3 bg-forge-navy-50 rounded-lg hover:bg-forge-navy-100 transition-colors">
              <svg className="w-5 h-5 text-forge-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <div><p className="text-sm font-medium text-forge-navy-900">Browse Controls</p><p className="text-xs text-forge-navy-700">View implementation status</p></div>
            </Link>
            <Link to="/risks" className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div><p className="text-sm font-medium text-amber-900">Risk Register</p><p className="text-xs text-amber-600">Review organizational risks</p></div>
            </Link>
            <Link to="/policies" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <div><p className="text-sm font-medium text-green-900">Policies</p><p className="text-xs text-green-600">Read compliance policies</p></div>
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MY WORK — analyst+ */}
      {/* ================================================================ */}
      {canEdit && myWork && (myWork.counts.poams > 0 || myWork.counts.evidence_due > 0 || myWork.counts.audit_tasks > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className={TYPOGRAPHY.cardTitle}>My Work</h2>
            {(myWork.counts.overdue_poams > 0 || myWork.counts.evidence_due > 0) && (
              <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {myWork.counts.overdue_poams + myWork.counts.evidence_due} overdue
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {p.scheduled_completion ? new Date(p.scheduled_completion).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No assigned items</p>
              )}
              <a href="/poams" className="block mt-3 text-xs text-forge-green-600 hover:text-forge-green-700 font-medium">View All &rarr;</a>
            </div>

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
                        {e.next_due_date ? new Date(e.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No evidence schedules</p>
              )}
              <a href="/evidence/schedules" className="block mt-3 text-xs text-forge-green-600 hover:text-forge-green-700 font-medium">View All &rarr;</a>
            </div>

            <div className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">My Audit Tasks</h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">{myWork.counts.audit_tasks}</span>
              </div>
              {myWork.my_audit_tasks.length > 0 ? (
                <div className="space-y-2">
                  {myWork.my_audit_tasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between text-xs">
                      <span className="text-gray-700 truncate flex-1 mr-2">{task.title}</span>
                      <span className={`whitespace-nowrap ${task.due_date && task.due_date < today ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No assigned tasks</p>
              )}
              <a href="/audit-prep" className="block mt-3 text-xs text-forge-green-600 hover:text-forge-green-700 font-medium">View All &rarr;</a>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMPLIANCE TREND — Recharts area chart */}
      {/* ================================================================ */}
      {canEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={TYPOGRAPHY.cardTitle}>Compliance Trend (30 Days)</h2>
            {canManage && (
              <button
                onClick={handleSnapshot}
                disabled={snapshotLoading}
                className="px-3 py-1.5 text-xs font-medium bg-forge-navy-900 text-white rounded-lg hover:bg-forge-navy-800 disabled:opacity-50 transition-colors"
              >
                {snapshotLoading ? 'Saving...' : 'Take Snapshot'}
              </button>
            )}
          </div>
          {snapshotMsg && (
            <p className={`text-xs mb-3 ${snapshotMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {snapshotMsg}
            </p>
          )}
          {trends.length >= 2 ? (
            <TrendAreaChart
              data={trends.map((tp) => ({ date: tp.date, value: tp.compliance_percentage }))}
              height={240}
              valueLabel="Compliance"
              valueSuffix="%"
            />
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
            <h2 className={`${TYPOGRAPHY.cardTitle} mb-4`}>Gap Analysis</h2>
            {gapAnalysis.length > 0 ? (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Top control families with unimplemented controls
                </p>
                <HorizontalBarList
                  data={[...gapAnalysis]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
                    .map((gap) => ({
                      name: gap.family,
                      value: gap.count,
                      sublabel: gap.framework_name || undefined,
                      suffix: ' gaps',
                      color: STATUS_COLORS.danger,
                    }))}
                  barColor={STATUS_COLORS.danger}
                />
              </>
            ) : (
              <p className="text-gray-500 text-sm">
                No gap data available yet. Implement controls to see gap analysis.
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
            <h2 className={`${TYPOGRAPHY.cardTitle} mb-4`}>Monitoring Health</h2>
            {monitoring ? (
              <div className="flex flex-col items-center justify-center flex-1">
                <ScoreRadialChart
                  score={monitoring.health_score}
                  size={140}
                  label="Health"
                  thickness={14}
                />
                <div className="flex gap-4 text-xs text-gray-500 mt-3">
                  <span>{monitoring.active_rules} active rules</span>
                  <span>{monitoring.recent_alerts} recent alerts</span>
                </div>
                <a href="/monitoring" className="mt-3 text-xs text-forge-navy-700 hover:underline font-medium">
                  View Monitoring Dashboard
                </a>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Monitoring data unavailable.{' '}
                <a href="/monitoring" className="text-forge-navy-700 hover:underline">Configure monitoring</a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ASSET SUMMARY — analyst+ */}
      {/* ================================================================ */}
      {canEdit && assetSummary && assetSummary.summary.total_assets > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h2 className={TYPOGRAPHY.cardTitle}>Asset Inventory</h2>
            <Link to="/assets" className="ml-auto text-xs text-forge-green-600 hover:text-forge-green-700 font-medium">
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{assetSummary.summary.total_assets}</p>
              <p className="text-xs text-gray-500 mt-1">Total Assets</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{assetSummary.summary.assets_with_critical}</p>
              <p className="text-xs text-gray-500 mt-1">Critical Vulns</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{assetSummary.summary.assets_with_high}</p>
              <p className="text-xs text-gray-500 mt-1">High Vulns</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{assetSummary.summary.recently_discovered}</p>
              <p className="text-xs text-gray-500 mt-1">New (7 days)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Risk Assets */}
            {assetSummary.top_risk_assets.length > 0 && (
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Highest Risk Assets</h3>
                <div className="space-y-2">
                  {assetSummary.top_risk_assets.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${asset.risk_score >= 70 ? 'bg-red-500' : asset.risk_score >= 40 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                        <span className="text-gray-700 truncate">{asset.hostname || asset.ip_address}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {asset.critical_count > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">{asset.critical_count}C</span>
                        )}
                        {asset.high_count > 0 && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-medium">{asset.high_count}H</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${asset.risk_score >= 70 ? 'bg-red-100 text-red-700' : asset.risk_score >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {asset.risk_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Discovered */}
            {assetSummary.recently_discovered.length > 0 && (
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recently Discovered</h3>
                <div className="space-y-2">
                  {assetSummary.recently_discovered.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-gray-700 truncate">{asset.hostname || asset.ip_address}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[10px] font-medium capitalize">
                          {(asset.discovery_source || 'manual').replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-400">
                          {new Date(asset.first_seen_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assets by System - show if no risk/recent data */}
            {assetSummary.top_risk_assets.length === 0 && assetSummary.by_system.length > 0 && (
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Assets by System</h3>
                <div className="space-y-2">
                  {assetSummary.by_system.slice(0, 5).map((sys, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate">{sys.system_name || 'Unassigned'}</span>
                      <span className="text-gray-500 font-medium">{sys.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assetSummary.recently_discovered.length === 0 && assetSummary.by_environment.length > 0 && (
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Assets by Environment</h3>
                <div className="space-y-2">
                  {assetSummary.by_environment.slice(0, 5).map((env, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate capitalize">{env.environment || 'Unclassified'}</span>
                      <span className="text-gray-500 font-medium">{env.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TWO-COLUMN GRID — role-filtered widgets */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Breakdown — Recharts horizontal bars */}
        {canEdit && compScores?.org_score && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className={`${TYPOGRAPHY.cardTitle} mb-4`}>Score Breakdown</h2>
            <HorizontalBarList
              data={Object.entries(compScores.org_score.dimensions)
                .filter(([key]) => DIMENSION_META[key])
                .map(([key, dim]) => ({
                  name: DIMENSION_META[key].label,
                  value: dim.score,
                  suffix: ` (${Math.round(dim.weight * 100)}%)`,
                }))}
              maxValue={100}
              colorByScore
              barSize={16}
              onBarClick={(item) => {
                const entry = Object.entries(DIMENSION_META).find(([, m]) => m.label === item.name);
                if (entry) window.location.href = entry[1].href;
              }}
            />
            <p className="text-xs text-gray-400 mt-2">Click a bar for details</p>
          </div>
        )}

        {/* Control Implementation Status — Stacked bar */}
        {canEdit && !compScores?.org_score && (
          <Link to="/controls" className="block group hover:shadow-md transition-shadow rounded-xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className={`${TYPOGRAPHY.cardTitle} mb-3`}>
                {t('control')} Implementation Status
              </h2>
              {s && s.controls.total > 0 ? (
                <StackedStatusBar
                  segments={[
                    { key: 'implemented', label: 'Implemented', value: s.controls.implemented, color: STATUS_COLORS.success },
                    { key: 'partial', label: 'Partially Implemented', value: s.controls.partially_implemented, color: STATUS_COLORS.warning },
                    { key: 'planned', label: 'Planned', value: s.controls.planned, color: STATUS_COLORS.info },
                    { key: 'not_impl', label: 'Not Implemented', value: s.controls.not_implemented, color: STATUS_COLORS.danger },
                    { key: 'na', label: 'Not Applicable', value: s.controls.not_applicable, color: STATUS_COLORS.muted },
                  ]}
                />
              ) : (
                <p className="text-gray-500 text-sm">
                  No controls initialized yet. Select a system and framework to begin.
                </p>
              )}
            </div>
          </Link>
        )}

        {/* Risk Overview — Horizontal bars */}
        {canManage && (
          <Link to="/risks" className="block group hover:shadow-md transition-shadow rounded-xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className={`${TYPOGRAPHY.cardTitle} mb-3`}>{t('risk')} Overview</h2>
              {s && s.risks.critical + s.risks.high + s.risks.moderate + s.risks.low > 0 ? (
                <HorizontalBarList
                  data={[
                    { name: 'Critical', value: s.risks.critical, color: STATUS_COLORS.danger },
                    { name: 'High', value: s.risks.high, color: STATUS_COLORS.orange },
                    { name: 'Moderate', value: s.risks.moderate, color: STATUS_COLORS.warning },
                    { name: 'Low', value: s.risks.low, color: STATUS_COLORS.success },
                  ]}
                />
              ) : (
                <p className="text-gray-500 text-sm">
                  No risks recorded yet. Use the {t('risk')} module to track organizational risks.
                </p>
              )}
            </div>
          </Link>
        )}

        {/* POA&M Summary — Stacked bar */}
        {canManage && (
          <Link to="/poams" className="block group hover:shadow-md transition-shadow rounded-xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className={`${TYPOGRAPHY.cardTitle} mb-3`}>
                {isFederal ? 'POA&M' : t('milestone')} Summary
              </h2>
              {s && s.poams.total > 0 ? (
                <StackedStatusBar
                  segments={[
                    { key: 'open', label: 'Open', value: s.poams.open, color: STATUS_COLORS.danger },
                    { key: 'in_progress', label: 'In Progress', value: s.poams.in_progress, color: STATUS_COLORS.warning },
                    { key: 'completed', label: 'Completed', value: s.poams.completed, color: STATUS_COLORS.success },
                  ]}
                />
              ) : (
                <p className="text-gray-500 text-sm">
                  No {t('milestone').toLowerCase()}s created yet.
                </p>
              )}
            </div>
          </Link>
        )}

        {/* Audit Readiness — Radial chart */}
        {canManage && auditScore && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className={TYPOGRAPHY.cardTitle}>Audit Readiness</h2>
              <a href="/audit-prep" className="text-sm text-forge-green-600 hover:text-forge-green-700">View Checklist &rarr;</a>
            </div>
            <div className="flex items-center gap-6">
              <ScoreRadialChart
                score={auditScore.score}
                size={100}
                label="Ready"
                thickness={10}
              />
              <div>
                <p className="text-sm text-gray-600">{auditScore.passed_checks}/{auditScore.total_checks} checks passed</p>
                <p className="text-xs text-gray-400 mt-1">
                  {auditScore.score >= 90 ? 'Audit Ready' : auditScore.score >= 70 ? 'Needs Attention' : 'Not Ready'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Schedules — manager+ */}
        {canManage && scheduleStats && (scheduleStats.total > 0 || scheduleStats.overdue > 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={TYPOGRAPHY.cardTitle}>Evidence Schedules</h2>
              <a href="/evidence/schedules" className="text-sm text-forge-green-600 hover:text-forge-green-700">View All &rarr;</a>
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
                <span className="font-semibold text-forge-navy-700">{scheduleStats.due_this_month}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-gray-600">Total Active</span>
                <span className={TYPOGRAPHY.cardTitle}>{scheduleStats.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals — manager+ */}
        {canManage && pendingApprovalCount !== null && pendingApprovalCount > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className={TYPOGRAPHY.cardTitle}>Pending Approvals</h2>
              <a href="/approvals" className="text-sm text-forge-green-600 hover:text-forge-green-700">Review &rarr;</a>
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

        {/* Recent Activity Feed */}
        {canEdit && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Recent Activity
            </h3>
            {activities.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${ACTION_COLORS[a.action] || 'text-gray-600 bg-gray-100'}`}>
                      {a.action === 'create' ? '+' : a.action === 'update' ? '~' : a.action === 'delete' ? '×' : a.action === 'upload' ? '↑' : '•'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 dark:text-gray-300 truncate">
                        <span className="font-medium">{a.user_name || 'System'}</span>{' '}
                        <span className="text-gray-500 dark:text-gray-400">{actionLabel(a.action, a.resource_type).toLowerCase()}</span>
                      </p>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">{timeAgo(a.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">No recent activity</p>
            )}
          </div>
        )}
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className={`${TYPOGRAPHY.cardTitle} mb-4`}>Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction href="/controls" label={`Review ${t('control')}s`} description={`Browse and assess ${t('control').toLowerCase()}s`} />
            <QuickAction href="/crosswalks" label="View Crosswalks" description="Map controls across frameworks" />
            {canEdit && (
              <>
                <QuickAction href="/evidence" label={`Upload ${t('evidence')}`} description="Add supporting documentation" />
                <QuickAction href="/poams" label={isFederal ? 'View POA&Ms' : `View ${t('milestone')}s`} description="Track remediation items" />
              </>
            )}
            {canManage && (
              <>
                <QuickAction href="/ssp" label={`Generate ${t('documentShort')}`} description={`Create ${t('document').toLowerCase()} package`} />
                <QuickAction href="/reports" label="Generate Reports" description="Export compliance reports" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (non-chart)
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
function actionLabel(action: string, resourceType: string): string {
  const verb = action === 'create' ? 'Created' : action === 'update' ? 'Updated' : action === 'delete' ? 'Deleted' : action === 'upload' ? 'Uploaded' : action.charAt(0).toUpperCase() + action.slice(1);
  const resource = resourceType.replace(/_/g, ' ');
  return `${verb} ${resource}`;
}
const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-600 bg-green-100',
  update: 'text-forge-navy-700 bg-forge-navy-100',
  delete: 'text-red-600 bg-red-100',
  upload: 'text-purple-600 bg-purple-100',
  login: 'text-gray-600 bg-gray-100',
};
function QuickAction({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <a href={href} className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-forge-navy-50 transition-colors">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </a>
  );
}
