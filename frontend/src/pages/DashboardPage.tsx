import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

interface DashboardStats {
  systems: number;
  controls: { implemented: number; partially_implemented: number; planned: number; not_implemented: number; not_applicable: number; total: number };
  compliance_percentage: number;
  poams: { open: number; in_progress: number; completed: number; total: number };
  evidence_count: number;
  risks: { low: number; moderate: number; high: number; critical: number };
}

export function DashboardPage() {
  const { t, nav, isFederal, isHealthcare } = useExperience();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ stats: DashboardStats }>('/api/v1/dashboard/stats')
      .then((d) => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const s = stats;
  const compPct = s?.compliance_percentage || 0;
  const compColor = compPct >= 80 ? 'text-green-600' : compPct >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{nav('dashboard')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('compliance')} overview for your organization</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title={`${t('compliance')} Score`} value={`${compPct}%`} subtitle={`${s?.controls.implemented || 0} of ${s?.controls.total || 0} ${t('control').toLowerCase()}s`} color={compColor} />
        <MetricCard title={nav('systems')} value={String(s?.systems || 0)} subtitle="Active information systems" color="text-blue-600" />
        <MetricCard title={isFederal ? 'POA&M Items' : t('milestone') + 's'} value={String(s?.poams.open || 0)} subtitle={`${s?.poams.in_progress || 0} in progress`} color="text-orange-600" />
        <MetricCard title={t('evidence')} value={String(s?.evidence_count || 0)} subtitle="Documents uploaded" color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Implementation Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t('control')} Implementation Status</h2>
          {s && s.controls.total > 0 ? (
            <div className="space-y-3">
              <StatusBar label="Implemented" count={s.controls.implemented} total={s.controls.total} color="bg-green-500" />
              <StatusBar label="Partially Implemented" count={s.controls.partially_implemented} total={s.controls.total} color="bg-yellow-500" />
              <StatusBar label="Planned" count={s.controls.planned} total={s.controls.total} color="bg-blue-500" />
              <StatusBar label="Not Implemented" count={s.controls.not_implemented} total={s.controls.total} color="bg-red-500" />
              <StatusBar label="Not Applicable" count={s.controls.not_applicable} total={s.controls.total} color="bg-gray-400" />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No controls initialized yet. Select a system and framework to begin.</p>
          )}
        </div>

        {/* Risk Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t('risk')} Overview</h2>
          {s && (s.risks.critical + s.risks.high + s.risks.moderate + s.risks.low) > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <RiskBadge level="Critical" count={s.risks.critical} color="bg-red-100 text-red-800 border-red-200" />
              <RiskBadge level="High" count={s.risks.high} color="bg-orange-100 text-orange-800 border-orange-200" />
              <RiskBadge level="Moderate" count={s.risks.moderate} color="bg-yellow-100 text-yellow-800 border-yellow-200" />
              <RiskBadge level="Low" count={s.risks.low} color="bg-green-100 text-green-800 border-green-200" />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No risks recorded yet. Use the {t('risk')} module to track organizational risks.</p>
          )}
        </div>

        {/* POA&M / Action Items Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{isFederal ? 'POA&M' : t('milestone')} Summary</h2>
          {s && s.poams.total > 0 ? (
            <div className="space-y-3">
              <StatusBar label="Open" count={s.poams.open} total={s.poams.total} color="bg-red-500" />
              <StatusBar label="In Progress" count={s.poams.in_progress} total={s.poams.total} color="bg-yellow-500" />
              <StatusBar label="Completed" count={s.poams.completed} total={s.poams.total} color="bg-green-500" />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No {t('milestone').toLowerCase()}s created yet.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction href="/controls" label={`Review ${t('control')}s`} description={`Browse and implement ${t('control').toLowerCase()}s`} />
            <QuickAction href="/evidence" label={`Upload ${t('evidence')}`} description="Add supporting documentation" />
            <QuickAction href="/ssp" label={`Generate ${t('documentShort')}`} description={`Create ${t('document').toLowerCase()} package`} />
            <QuickAction href="/crosswalks" label="View Crosswalks" description="Map controls across frameworks" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{count} ({Math.round(pct)}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RiskBadge({ level, count, color }: { level: string; count: number; color: string }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs font-medium">{level}</p>
    </div>
  );
}

function QuickAction({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <a href={href} className="block p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </a>
  );
}
