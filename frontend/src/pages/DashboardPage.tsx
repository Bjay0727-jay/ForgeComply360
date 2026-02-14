import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useExperience, DASHBOARD_WIDGET_TYPES, DashboardWidgetConfig } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
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
import { TYPOGRAPHY, CARDS_V2, TYPOGRAPHY_DASHBOARD } from '../utils/typography';

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

interface DashboardRecommendation {
  id: string;
  type: 'critical_control' | 'evidence_gap' | 'poam_overdue' | 'expiring_evidence' | 'control_gap' |
        'policy_review' | 'vendor_assessment' | 'system_authorization' |
        'evidence_schedule_overdue' | 'risk_treatment_overdue' | 'audit_task_due';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  framework_name?: string;
  control_id?: string;
  affected_count: number;
  action_text: string;
  action_href: string;
  impact_score: number;
}

interface RecommendationsResponse {
  recommendations: DashboardRecommendation[];
  summary: { critical: number; high: number; medium: number; low: number };
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
  const { t, nav, isFederal, isHealthcare, dashboardWidgets, updateDashboardWidgets } = useExperience();
  const { user, canEdit, canManage } = useAuth();
  const { addToast } = useToast();

  // Widget customization state
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [localWidgetConfig, setLocalWidgetConfig] = useState<DashboardWidgetConfig[]>([]);
  const [savingWidgets, setSavingWidgets] = useState(false);

  // Initialize local config when modal opens
  useEffect(() => {
    if (showWidgetSettings) {
      setLocalWidgetConfig([...dashboardWidgets]);
    }
  }, [showWidgetSettings, dashboardWidgets]);

  // Helper to check if widget is visible
  const isWidgetVisible = useMemo(() => {
    const visibilityMap = new Map<string, boolean>();
    dashboardWidgets.forEach(w => visibilityMap.set(w.id, w.visible));
    return (id: string) => visibilityMap.get(id) ?? true;
  }, [dashboardWidgets]);

  // Get sorted visible widgets
  const sortedWidgets = useMemo(() => {
    return [...dashboardWidgets].sort((a, b) => a.order - b.order);
  }, [dashboardWidgets]);

  // Widget settings handlers
  const toggleWidgetVisibility = (id: string) => {
    setLocalWidgetConfig(prev =>
      prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
  };

  const moveWidgetUp = (id: string) => {
    setLocalWidgetConfig(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(w => w.id === id);
      if (idx <= 0) return prev;
      // Swap orders
      const newOrder = sorted[idx - 1].order;
      sorted[idx - 1].order = sorted[idx].order;
      sorted[idx].order = newOrder;
      return sorted;
    });
  };

  const moveWidgetDown = (id: string) => {
    setLocalWidgetConfig(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(w => w.id === id);
      if (idx >= sorted.length - 1) return prev;
      // Swap orders
      const newOrder = sorted[idx + 1].order;
      sorted[idx + 1].order = sorted[idx].order;
      sorted[idx].order = newOrder;
      return sorted;
    });
  };

  const saveWidgetSettings = async () => {
    setSavingWidgets(true);
    try {
      await updateDashboardWidgets(localWidgetConfig);
      addToast({ type: 'success', title: 'Dashboard updated' });
      setShowWidgetSettings(false);
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to save settings' });
    } finally {
      setSavingWidgets(false);
    }
  };

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

  // Smart recommendations
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);

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
      // Smart recommendations
      api<RecommendationsResponse>('/api/v1/dashboard/recommendations').then((d) => setRecommendations(d)).catch(() => {});
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
      <PageHeader title={nav('dashboard')} subtitle={`${t('compliance')} overview for your organization`}>
        <button
          onClick={() => setShowWidgetSettings(true)}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Customize
        </button>
      </PageHeader>

      {/* Widget Settings Modal */}
      {showWidgetSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${CARDS_V2.primary} p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={TYPOGRAPHY.sectionTitle}>Customize Dashboard</h3>
              <button
                onClick={() => setShowWidgetSettings(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Toggle visibility and reorder dashboard widgets.
            </p>

            <div className="space-y-2">
              {[...localWidgetConfig].sort((a, b) => a.order - b.order).map((widget, idx) => {
                const meta = DASHBOARD_WIDGET_TYPES.find(w => w.id === widget.id);
                if (!meta) return null;
                return (
                  <div
                    key={widget.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      widget.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <button
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        widget.visible ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {widget.visible && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                      <p className="text-xs text-gray-500 truncate">{meta.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveWidgetUp(widget.id)}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveWidgetDown(widget.id)}
                        disabled={idx === localWidgetConfig.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowWidgetSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={saveWidgetSettings}
                disabled={savingWidgets}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {savingWidgets && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Alert Banner - Redesigned */}
      {isWidgetVisible('alert_banner') && alertSummary && alertSummary.total > 0 && (
        <div className={`${CARDS_V2.alertBanner} mb-6 animate-fade-slide-in`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className={TYPOGRAPHY_DASHBOARD.alertTitle}>Action Required</h3>
              <p className={TYPOGRAPHY_DASHBOARD.alertSubtitle}>{alertSummary.total} item{alertSummary.total !== 1 ? 's' : ''} need your attention</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {alertSummary.poams_overdue > 0 && (
              <a href="/poams" className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-sm">{alertSummary.poams_overdue}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">POA&M Overdue</p>
                  <p className="text-xs text-gray-500">Immediate action</p>
                </div>
              </a>
            )}
            {alertSummary.poams_upcoming > 0 && (
              <a href="/poams" className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">{alertSummary.poams_upcoming}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">POA&M Due Soon</p>
                  <p className="text-xs text-gray-500">This week</p>
                </div>
              </a>
            )}
            {alertSummary.ato_expiring > 0 && (
              <a href="/systems" className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">{alertSummary.ato_expiring}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">ATO Expiring</p>
                  <p className="text-xs text-gray-500">Renew authorization</p>
                </div>
              </a>
            )}
            {alertSummary.evidence_expired > 0 && (
              <a href="/evidence" className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-sm">{alertSummary.evidence_expired}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Evidence Expired</p>
                  <p className="text-xs text-gray-500">Upload new</p>
                </div>
              </a>
            )}
            {alertSummary.evidence_expiring > 0 && (
              <a href="/evidence" className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">{alertSummary.evidence_expiring}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Evidence Expiring</p>
                  <p className="text-xs text-gray-500">Plan renewal</p>
                </div>
              </a>
            )}
            {alertSummary.risks_overdue > 0 && (
              <a href="/risks" className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">{alertSummary.risks_overdue}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Risk Treatment</p>
                  <p className="text-xs text-gray-500">Overdue</p>
                </div>
              </a>
            )}
            {alertSummary.policies_review_due > 0 && (
              <a href="/policies" className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">{alertSummary.policies_review_due}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Policy Review</p>
                  <p className="text-xs text-gray-500">Due for review</p>
                </div>
              </a>
            )}
            {alertSummary.vendor_assessments_due > 0 && (
              <a href="/vendors" className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <span className="text-teal-600 dark:text-teal-400 font-bold text-sm">{alertSummary.vendor_assessments_due}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Vendor Assessment</p>
                  <p className="text-xs text-gray-500">Due this month</p>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* KEY METRICS — Hero Compliance Score + Supporting Metrics */}
      {/* ================================================================ */}
      {(isWidgetVisible('hero_compliance') || isWidgetVisible('key_metrics')) && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Hero Compliance Score Card - Full width on mobile, 2 cols on lg */}
        <Link to="/controls" className="sm:col-span-2 lg:col-span-2 block group animate-fade-slide-in animate-stagger-1">
          <div className={`${CARDS_V2.hero} relative overflow-hidden h-full`}>
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(132,204,22,0.15),transparent_50%)]" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-forge-green-400 text-sm font-semibold uppercase tracking-wide">{t('compliance')} Score</p>
                {orgScore ? (
                  <>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className={TYPOGRAPHY_DASHBOARD.heroValue + ' text-white'}>{orgScore.grade}</span>
                      <span className={TYPOGRAPHY_DASHBOARD.heroSubvalue + ' text-white/70'}>{orgScore.score}/100</span>
                    </div>
                    <p className="text-sm text-white/60 mt-1">{s?.controls.implemented || 0} of {s?.controls.total || 0} {t('control').toLowerCase()}s implemented</p>
                    {trend !== null && (
                      <div className="mt-3">
                        <span className={trend >= 0 ? TYPOGRAPHY_DASHBOARD.trendUp : TYPOGRAPHY_DASHBOARD.trendDown}>
                          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} pts this week
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className={TYPOGRAPHY_DASHBOARD.heroValue + ' text-white'}>{compPct}%</span>
                    </div>
                    <p className="text-sm text-white/60 mt-1">{s?.controls.implemented || 0} of {s?.controls.total || 0} {t('control').toLowerCase()}s implemented</p>
                  </>
                )}
              </div>
              <div className="hidden sm:block">
                <ScoreRadialChart
                  score={orgScore?.score || compPct}
                  size={120}
                  grade={orgScore?.grade}
                  thickness={10}
                />
              </div>
            </div>
          </div>
        </Link>

        {/* Supporting Metrics with Glass Effect */}
        <Link to="/systems" className="block group animate-fade-slide-in animate-stagger-2">
          <div className={`${CARDS_V2.glass} p-5 h-full`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel}>{nav('systems')}</p>
            </div>
            <p className={TYPOGRAPHY_DASHBOARD.cardValue + ' text-gray-900 dark:text-white'}>{s?.systems || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active information systems</p>
          </div>
        </Link>

        <Link to="/poams" className="block group animate-fade-slide-in animate-stagger-3">
          <div className={`${CARDS_V2.glass} p-5 h-full`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel}>{isFederal ? 'POA&M Items' : t('milestone') + 's'}</p>
            </div>
            <p className={TYPOGRAPHY_DASHBOARD.cardValue + ' text-gray-900 dark:text-white'}>{s?.poams.open || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s?.poams.in_progress || 0} in progress</p>
          </div>
        </Link>

        <Link to="/evidence" className="block group animate-fade-slide-in animate-stagger-4">
          <div className={`${CARDS_V2.glass} p-5 h-full`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel}>{t('evidence')}</p>
            </div>
            <p className={TYPOGRAPHY_DASHBOARD.cardValue + ' text-gray-900 dark:text-white'}>{s?.evidence_count || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Documents uploaded</p>
          </div>
        </Link>

        <Link to="/risks" className="block group animate-fade-slide-in animate-stagger-5">
          <div className={`${CARDS_V2.glass} p-5 h-full`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel}>Open {t('risk')}s</p>
            </div>
            <p className={TYPOGRAPHY_DASHBOARD.cardValue + ' text-gray-900 dark:text-white'}>{(s?.risks.critical || 0) + (s?.risks.high || 0) + (s?.risks.moderate || 0) + (s?.risks.low || 0)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s?.risks.critical || 0} critical, {s?.risks.high || 0} high</p>
          </div>
        </Link>
      </div>
      )}

      {/* Executive Summary — Manager+ */}
      {isWidgetVisible('executive_summary') && canManage && execSummary && (
        <div className={`${CARDS_V2.primary} p-6 mb-8`}>
          <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-4'}>
            <svg className="w-5 h-5 text-forge-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Weekly Executive Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className={`${CARDS_V2.tertiary} text-center p-4`}>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{execSummary.current_score}%</span>
                {execSummary.score_delta !== 0 && (
                  <span className={execSummary.score_delta > 0 ? TYPOGRAPHY_DASHBOARD.trendUp : TYPOGRAPHY_DASHBOARD.trendDown}>
                    {execSummary.score_delta > 0 ? '↑' : '↓'}{Math.abs(execSummary.score_delta)}
                  </span>
                )}
              </div>
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel + ' mt-1'}>Compliance Score</p>
            </div>
            <div className={`${CARDS_V2.statusSuccess} text-center`}>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{execSummary.poams_closed}</p>
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel + ' mt-1'}>POA&Ms Closed</p>
            </div>
            <div className={`${CARDS_V2.statusWarning} text-center`}>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{execSummary.new_risks}</p>
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel + ' mt-1'}>New Risks</p>
            </div>
            <div className={`${CARDS_V2.statusInfo} text-center`}>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{execSummary.evidence_uploaded}</p>
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel + ' mt-1'}>Evidence Uploaded</p>
            </div>
          </div>
          {execSummary.team_activity && execSummary.team_activity.length > 0 && (
            <div>
              <p className={TYPOGRAPHY_DASHBOARD.dataLabel + ' mb-3'}>Team Activity (Past 7 Days)</p>
              <div className="space-y-2">
                {execSummary.team_activity.slice(0, 5).map((ta: any) => {
                  const maxActions = Math.max(...execSummary.team_activity.map((t: any) => t.actions_count));
                  return (
                    <div key={ta.user_id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300 w-32 truncate font-medium">{ta.name}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-forge-green-500 to-forge-green-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(ta.actions_count / maxActions) * 100}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right font-semibold">{ta.actions_count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* PER-FRAMEWORK COMPLIANCE — Card Grid with Context */}
      {/* ================================================================ */}
      {isWidgetVisible('framework_compliance') && frameworkStats.length > 0 && (
        <div className={`${CARDS_V2.secondary} p-6 mb-6`}>
          <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-4'}>
            <svg className="w-5 h-5 text-forge-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            {t('compliance')} by Framework
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <div key={fw.framework_id} className={`${CARDS_V2.interactive} p-4 text-center`}>
                  <ScoreRadialChart
                    score={pct}
                    size={80}
                    grade={grade}
                    thickness={8}
                  />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-3 truncate">
                    {fw.framework_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {fw.implemented}/{fw.total} controls
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Welcome Card — Viewers Only */}
      {!canEdit && (
        <div className={`${CARDS_V2.primary} p-6 mb-8`}>
          <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-2'}>
            <svg className="w-5 h-5 text-forge-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            Welcome to ForgeComply 360
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">You have view-only access to your organization's compliance posture. Contact an administrator to request elevated permissions.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/controls" className="flex items-center gap-3 p-3 bg-forge-navy-50 dark:bg-forge-navy-900/30 rounded-lg hover:bg-forge-navy-100 dark:hover:bg-forge-navy-900/50 transition-all duration-200 hover:-translate-y-0.5">
              <svg className="w-5 h-5 text-forge-navy-700 dark:text-forge-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <div><p className="text-sm font-medium text-forge-navy-900 dark:text-white">Browse Controls</p><p className="text-xs text-forge-navy-700 dark:text-gray-400">View implementation status</p></div>
            </Link>
            <Link to="/risks" className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-200 hover:-translate-y-0.5">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div><p className="text-sm font-medium text-amber-900 dark:text-amber-100">Risk Register</p><p className="text-xs text-amber-600 dark:text-amber-400">Review organizational risks</p></div>
            </Link>
            <Link to="/policies" className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 hover:-translate-y-0.5">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <div><p className="text-sm font-medium text-green-900 dark:text-green-100">Policies</p><p className="text-xs text-green-600 dark:text-green-400">Read compliance policies</p></div>
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MY WORK — analyst+ */}
      {/* ================================================================ */}
      {isWidgetVisible('my_work') && canEdit && myWork && (myWork.counts.poams > 0 || myWork.counts.evidence_due > 0 || myWork.counts.audit_tasks > 0) && (
        <div className={`${CARDS_V2.primary} p-6 mb-6`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader}>My Work</h2>
            {(myWork.counts.overdue_poams > 0 || myWork.counts.evidence_due > 0) && (
              <span className="ml-auto px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">
                {myWork.counts.overdue_poams + myWork.counts.evidence_due} overdue
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* POA&Ms - show danger border if any overdue */}
            <div className={myWork.counts.overdue_poams > 0 ? CARDS_V2.statusDanger : CARDS_V2.tertiary + ' p-4'}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{isFederal ? 'My POA&Ms' : `My ${t('milestone')}s`}</h3>
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">{myWork.counts.poams}</span>
              </div>
              {myWork.my_poams.length > 0 ? (
                <div className="space-y-2">
                  {myWork.my_poams.map((p) => {
                    const isOverdue = p.scheduled_completion && p.scheduled_completion < today;
                    return (
                      <div key={p.id} className={`flex items-center gap-2 text-xs ${isOverdue ? 'bg-red-50 dark:bg-red-900/20 -mx-2 px-2 py-1 rounded' : ''}`}>
                        {isOverdue && <span className="w-1 h-4 rounded-full bg-red-500 flex-shrink-0" />}
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{p.title}</span>
                        <span className={`whitespace-nowrap flex-shrink-0 ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-400'}`}>
                          {p.scheduled_completion ? new Date(p.scheduled_completion).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">No assigned items</p>
              )}
              <a href="/poams" className="block mt-3 text-xs text-forge-green-600 hover:text-forge-green-700 font-medium">View All &rarr;</a>
            </div>

            {/* Evidence - show danger border if any due */}
            <div className={myWork.counts.evidence_due > 0 ? CARDS_V2.statusDanger : CARDS_V2.tertiary + ' p-4'}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">My Evidence</h3>
                {myWork.counts.evidence_due > 0 ? (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">{myWork.counts.evidence_due} due</span>
                ) : (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">On track</span>
                )}
              </div>
              {myWork.my_evidence_schedules.length > 0 ? (
                <div className="space-y-2">
                  {myWork.my_evidence_schedules.map((e) => {
                    const isDue = e.next_due_date && e.next_due_date <= today;
                    return (
                      <div key={e.id} className={`flex items-center gap-2 text-xs ${isDue ? 'bg-red-50 dark:bg-red-900/20 -mx-2 px-2 py-1 rounded' : ''}`}>
                        {isDue && <span className="w-1 h-4 rounded-full bg-red-500 flex-shrink-0" />}
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{e.title}</span>
                        <span className={`whitespace-nowrap flex-shrink-0 ${isDue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-400'}`}>
                          {e.next_due_date ? new Date(e.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">No evidence schedules</p>
              )}
              <a href="/evidence/schedules" className="block mt-3 text-xs text-forge-green-600 hover:text-forge-green-700 font-medium">View All &rarr;</a>
            </div>

            {/* Audit Tasks */}
            <div className={`${CARDS_V2.tertiary} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">My Audit Tasks</h3>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">{myWork.counts.audit_tasks}</span>
              </div>
              {myWork.my_audit_tasks.length > 0 ? (
                <div className="space-y-2">
                  {myWork.my_audit_tasks.map((task) => {
                    const isOverdue = task.due_date && task.due_date < today;
                    return (
                      <div key={task.id} className={`flex items-center gap-2 text-xs ${isOverdue ? 'bg-red-50 dark:bg-red-900/20 -mx-2 px-2 py-1 rounded' : ''}`}>
                        {isOverdue && <span className="w-1 h-4 rounded-full bg-red-500 flex-shrink-0" />}
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{task.title}</span>
                        <span className={`whitespace-nowrap flex-shrink-0 ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-400'}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">No assigned tasks</p>
              )}
              <a href="/audit-prep" className="block mt-3 text-xs text-forge-green-600 hover:text-forge-green-700 font-medium">View All &rarr;</a>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMPLIANCE TREND — Recharts area chart */}
      {/* ================================================================ */}
      {isWidgetVisible('compliance_trend') && canEdit && (
        <div className={`${CARDS_V2.secondary} p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader}>
              <svg className="w-5 h-5 text-forge-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              Compliance Trend (30 Days)
            </h2>
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
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Take a snapshot to start tracking compliance trends over time.
            </p>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SMART RECOMMENDATIONS + MONITORING — manager+ */}
      {/* ================================================================ */}
      {canManage && (isWidgetVisible('recommendations') || isWidgetVisible('monitoring_health')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Smart Recommendations */}
          {isWidgetVisible('recommendations') && (
          <div className={`lg:col-span-2 ${recommendations && recommendations.summary.critical > 0 ? CARDS_V2.statusDanger : recommendations && recommendations.summary.high > 0 ? CARDS_V2.statusWarning : CARDS_V2.primary + ' p-6'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader}>
                <svg className="w-5 h-5 text-forge-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                Recommendations
              </h2>
              {recommendations && (recommendations.summary.critical > 0 || recommendations.summary.high > 0) && (
                <div className="flex gap-2">
                  {recommendations.summary.critical > 0 && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">
                      {recommendations.summary.critical} Critical
                    </span>
                  )}
                  {recommendations.summary.high > 0 && (
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">
                      {recommendations.summary.high} High
                    </span>
                  )}
                </div>
              )}
            </div>
            {recommendations && recommendations.recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.recommendations.slice(0, 5).map((rec) => (
                  <a
                    key={rec.id}
                    href={rec.action_href}
                    className={`block p-3 rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      rec.priority === 'critical' ? 'border-l-4 border-l-red-500 border-blue-200 dark:border-blue-700 bg-red-50/50 dark:bg-red-900/10' :
                      rec.priority === 'high' ? 'border-l-4 border-l-orange-500 border-blue-200 dark:border-blue-700 bg-orange-50/50 dark:bg-orange-900/10' :
                      'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        rec.type === 'critical_control' ? 'bg-red-100 dark:bg-red-900/30' :
                        rec.type === 'evidence_gap' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        rec.type === 'poam_overdue' ? 'bg-orange-100 dark:bg-orange-900/30' :
                        rec.type === 'expiring_evidence' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        rec.type === 'policy_review' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                        rec.type === 'vendor_assessment' ? 'bg-teal-100 dark:bg-teal-900/30' :
                        rec.type === 'system_authorization' ? 'bg-sky-100 dark:bg-sky-900/30' :
                        rec.type === 'evidence_schedule_overdue' ? 'bg-rose-100 dark:bg-rose-900/30' :
                        rec.type === 'risk_treatment_overdue' ? 'bg-red-100 dark:bg-red-900/30' :
                        rec.type === 'audit_task_due' ? 'bg-violet-100 dark:bg-violet-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {rec.type === 'critical_control' && (
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                        {rec.type === 'evidence_gap' && (
                          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        )}
                        {rec.type === 'poam_overdue' && (
                          <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        {rec.type === 'expiring_evidence' && (
                          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        )}
                        {rec.type === 'control_gap' && (
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        )}
                        {rec.type === 'policy_review' && (
                          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )}
                        {rec.type === 'vendor_assessment' && (
                          <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        )}
                        {rec.type === 'system_authorization' && (
                          <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                        )}
                        {rec.type === 'evidence_schedule_overdue' && (
                          <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        )}
                        {rec.type === 'risk_treatment_overdue' && (
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                        {rec.type === 'audit_task_due' && (
                          <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{rec.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{rec.description}</p>
                      </div>
                      <span className="text-xs font-medium text-forge-green-600 dark:text-forge-green-400 whitespace-nowrap flex-shrink-0">
                        {rec.action_text} →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">All caught up!</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">No urgent recommendations at this time.</p>
              </div>
            )}
            {recommendations && recommendations.recommendations.length > 5 && (
              <Link to="/controls" className="block mt-4 text-center text-sm text-forge-green-600 hover:text-forge-green-700 dark:text-forge-green-400 dark:hover:text-forge-green-300 font-medium">
                View All {recommendations.recommendations.length} Recommendations →
              </Link>
            )}
          </div>
          )}

          {/* Monitoring Health - status-aware border based on health score */}
          {isWidgetVisible('monitoring_health') && (
          <div className={`${monitoring && monitoring.health_score >= 80 ? CARDS_V2.statusSuccess : monitoring && monitoring.health_score >= 60 ? CARDS_V2.statusWarning : CARDS_V2.secondary + ' p-6'} flex flex-col`}>
            <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-4'}>
              <svg className="w-5 h-5 text-forge-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Monitoring Health
            </h2>
            {monitoring ? (
              <div className="flex flex-col items-center justify-center flex-1">
                <ScoreRadialChart
                  score={monitoring.health_score}
                  size={140}
                  label="Health"
                  thickness={14}
                />
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3">
                  <span>{monitoring.active_rules} active rules</span>
                  <span>{monitoring.recent_alerts} recent alerts</span>
                </div>
                <a href="/monitoring" className="mt-3 text-xs text-forge-navy-700 dark:text-forge-green-400 hover:underline font-medium">
                  View Monitoring Dashboard
                </a>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Monitoring data unavailable.{' '}
                <a href="/monitoring" className="text-forge-navy-700 dark:text-forge-green-400 hover:underline">Configure monitoring</a>
              </p>
            )}
          </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* ASSET SUMMARY — analyst+ */}
      {/* ================================================================ */}
      {canEdit && assetSummary && assetSummary.summary.total_assets > 0 && (
        <div className={`${assetSummary.summary.assets_with_critical > 0 ? CARDS_V2.statusDanger : assetSummary.summary.assets_with_high > 0 ? CARDS_V2.statusWarning : CARDS_V2.secondary + ' p-6'} mb-6`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader}>Asset Inventory</h2>
            <Link to="/assets" className="ml-auto text-xs text-forge-green-600 hover:text-forge-green-700 font-medium">
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className={`${CARDS_V2.tertiary} text-center p-3`}>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assetSummary.summary.total_assets}</p>
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel + ' mt-1'}>Total Assets</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/30">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{assetSummary.summary.assets_with_critical}</p>
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel + ' mt-1'}>Critical Vulns</p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/30">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{assetSummary.summary.assets_with_high}</p>
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel + ' mt-1'}>High Vulns</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{assetSummary.summary.recently_discovered}</p>
              <p className={TYPOGRAPHY_DASHBOARD.cardLabel + ' mt-1'}>New (7 days)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Risk Assets - danger status card */}
            {assetSummary.top_risk_assets.length > 0 && (
              <div className={`${CARDS_V2.tertiary} p-4`}>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Highest Risk Assets
                </h3>
                <div className="space-y-2">
                  {assetSummary.top_risk_assets.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${asset.risk_score >= 70 ? 'bg-red-500' : asset.risk_score >= 40 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                        <span className="text-gray-700 dark:text-gray-300 truncate">{asset.hostname || asset.ip_address}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {asset.critical_count > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-[10px] font-medium">{asset.critical_count}C</span>
                        )}
                        {asset.high_count > 0 && (
                          <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-[10px] font-medium">{asset.high_count}H</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${asset.risk_score >= 70 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : asset.risk_score >= 40 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                          {asset.risk_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Discovered - info status card */}
            {assetSummary.recently_discovered.length > 0 && (
              <div className={`${CARDS_V2.tertiary} p-4`}>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  Recently Discovered
                </h3>
                <div className="space-y-2">
                  {assetSummary.recently_discovered.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-gray-700 dark:text-gray-300 truncate">{asset.hostname || asset.ip_address}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded text-[10px] font-medium capitalize">
                          {(asset.discovery_source || 'manual').replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">
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
              <div className={`${CARDS_V2.tertiary} p-4`}>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Assets by System</h3>
                <div className="space-y-2">
                  {assetSummary.by_system.slice(0, 5).map((sys, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300 truncate">{sys.system_name || 'Unassigned'}</span>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">{sys.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assetSummary.recently_discovered.length === 0 && assetSummary.by_environment.length > 0 && (
              <div className={`${CARDS_V2.tertiary} p-4`}>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Assets by Environment</h3>
                <div className="space-y-2">
                  {assetSummary.by_environment.slice(0, 5).map((env, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300 truncate capitalize">{env.environment || 'Unclassified'}</span>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">{env.count}</span>
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
          <div className={`${CARDS_V2.secondary} p-6`}>
            <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-4'}>
              <svg className="w-5 h-5 text-forge-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Score Breakdown
            </h2>
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
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Click a bar for details</p>
          </div>
        )}

        {/* Control Implementation Status — Stacked bar */}
        {canEdit && !compScores?.org_score && (
          <Link to="/controls" className={`block ${CARDS_V2.interactive} p-5`}>
            <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-3'}>
              <svg className="w-5 h-5 text-forge-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
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
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No controls initialized yet. Select a system and framework to begin.
              </p>
            )}
          </Link>
        )}

        {/* Risk Overview — Horizontal bars with status-aware border */}
        {canManage && (
          <Link to="/risks" className={`block ${s && s.risks.critical > 0 ? CARDS_V2.statusDanger : s && s.risks.high > 0 ? CARDS_V2.statusWarning : CARDS_V2.interactive + ' p-5'}`}>
            <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-3'}>
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {t('risk')} Overview
            </h2>
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
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No risks recorded yet. Use the {t('risk')} module to track organizational risks.
              </p>
            )}
          </Link>
        )}

        {/* POA&M Summary — Stacked bar with status-aware border */}
        {canManage && (
          <Link to="/poams" className={`block ${s && s.poams.open > 5 ? CARDS_V2.statusWarning : CARDS_V2.interactive + ' p-5'}`}>
            <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-3'}>
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
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
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No {t('milestone').toLowerCase()}s created yet.
              </p>
            )}
          </Link>
        )}

        {/* Audit Readiness — Radial chart with status-aware border */}
        {canManage && auditScore && (
          <div className={auditScore.score >= 90 ? CARDS_V2.statusSuccess : auditScore.score >= 70 ? CARDS_V2.statusWarning : CARDS_V2.statusDanger}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader}>
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Audit Readiness
              </h2>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{auditScore.passed_checks}/{auditScore.total_checks} checks passed</p>
                <p className={`text-xs mt-1 font-medium ${auditScore.score >= 90 ? 'text-green-600 dark:text-green-400' : auditScore.score >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {auditScore.score >= 90 ? 'Audit Ready' : auditScore.score >= 70 ? 'Needs Attention' : 'Not Ready'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Schedules — manager+ with status-aware border */}
        {canManage && scheduleStats && (scheduleStats.total > 0 || scheduleStats.overdue > 0) && (
          <div className={scheduleStats.overdue > 0 ? CARDS_V2.statusDanger : CARDS_V2.secondary + ' p-6'}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader}>
                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Evidence Schedules
              </h2>
              <a href="/evidence/schedules" className="text-sm text-forge-green-600 hover:text-forge-green-700">View All &rarr;</a>
            </div>
            <div className="space-y-2">
              {scheduleStats.overdue > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Overdue
                  </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{scheduleStats.overdue}</span>
                </div>
              )}
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Due This Week
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{scheduleStats.due_this_week}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-forge-navy-500" />
                  Due This Month
                </span>
                <span className="font-semibold text-forge-navy-700 dark:text-forge-navy-300">{scheduleStats.due_this_month}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total Active</span>
                <span className="font-bold text-gray-900 dark:text-white">{scheduleStats.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals — manager+ with warning status */}
        {canManage && pendingApprovalCount !== null && pendingApprovalCount > 0 && (
          <div className={CARDS_V2.statusWarning}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader}>
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Pending Approvals
              </h2>
              <a href="/approvals" className="text-sm text-forge-green-600 hover:text-forge-green-700">Review &rarr;</a>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-xl font-bold text-amber-700 dark:text-amber-400">{pendingApprovalCount}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {pendingApprovalCount === 1 ? '1 request awaiting' : `${pendingApprovalCount} requests awaiting`} your review
              </p>
            </div>
          </div>
        )}

        {/* Recent Activity Feed */}
        {isWidgetVisible('activity_feed') && canEdit && (
          <div className={`${CARDS_V2.secondary} p-5`}>
            <h3 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-3'}>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Recent Activity
            </h3>
            {activities.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${ACTION_COLORS[a.action] || 'text-gray-600 bg-gray-100 dark:bg-gray-700'}`}>
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

        {/* Forge Reporter - Featured Tool */}
        <Link to="/reporter" className="block bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white hover:from-indigo-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Forge Reporter</h3>
              <p className="text-indigo-200 text-sm">Advanced SSP Builder</p>
            </div>
          </div>
          <p className="text-indigo-100 text-sm mb-3">
            Create FISMA/FedRAMP-compliant System Security Plans with AI-assisted narrative generation and OSCAL export.
          </p>
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <span className="bg-white/20 px-2 py-0.5 rounded">21 NIST Sections</span>
            <span className="bg-white/20 px-2 py-0.5 rounded">ForgeML AI</span>
            <span className="bg-white/20 px-2 py-0.5 rounded">OSCAL</span>
          </div>
        </Link>

        {/* Quick Actions */}
        <div className={`${CARDS_V2.secondary} p-6`}>
          <h2 className={TYPOGRAPHY_DASHBOARD.sectionHeader + ' mb-4'}>
            <svg className="w-5 h-5 text-forge-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Quick Actions
          </h2>
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
                <QuickAction href="/ssp" label={`Manage ${t('documentShort')}s`} description={`View and manage SSP documents`} />
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
    <a href={href} className="block p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-forge-navy-50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </a>
  );
}
