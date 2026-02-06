import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportRisksCSV, exportRiskRegisterDoc } from '../utils/exportHelpers';
import { exportRiskRegisterPdf } from '../utils/pdfExportHelpers';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { PageHeader } from '../components/PageHeader';
import { FilterBar, FilterField } from '../components/FilterBar';
import { RiskHeatMap, MetricCard as ChartMetricCard } from '../components/charts';
import { STATUS_COLORS } from '../utils/chartTheme';
import { SkeletonMetricCards, SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { FormField } from '../components/FormField';
import { Pagination } from '../components/Pagination';
import { TYPOGRAPHY, BUTTONS, FORMS, CARDS, MODALS, BADGES, STATUS_BADGE_COLORS } from '../utils/typography';

interface Risk {
  id: string;
  risk_id: string;
  title: string;
  description: string;
  system_id: string;
  system_name: string;
  category: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  risk_level: string;
  treatment: string;
  treatment_plan: string;
  treatment_due_date: string;
  owner: string;
  status: string;
  related_controls: string;
  created_at: string;
  updated_at: string;
  ai_risk_score: number | null;
  ai_recommendation: string | null;
  ai_scored_at: string | null;
}

interface RiskStats {
  total: number;
  open_count: number;
  avg_score: number;
  with_treatment: number;
  by_level: Record<string, number>;
  by_treatment: Record<string, number>;
  by_category: Record<string, number>;
}

const CATEGORIES = ['technical', 'operational', 'compliance', 'financial', 'reputational', 'strategic'];
const TREATMENTS = ['mitigate', 'accept', 'transfer', 'avoid'];
const STATUSES = ['open', 'in_treatment', 'monitored', 'closed', 'accepted'];
const LEVELS = ['low', 'moderate', 'high', 'critical'];

const riskColor = (score: number) => score >= 15 ? `${BADGES.error} border-red-200` : score >= 10 ? `${BADGES.orange} border-orange-200` : score >= 5 ? `${BADGES.warning} border-yellow-200` : `${BADGES.success} border-green-200`;
const levelColor = (level: string) => level === 'critical' ? BADGES.error : level === 'high' ? BADGES.orange : level === 'moderate' ? BADGES.warning : BADGES.success;
const statusColor = (status: string) => status === 'closed' ? BADGES.success : status === 'accepted' ? BADGES.info : status === 'monitored' ? BADGES.purple : status === 'in_treatment' ? BADGES.warning : BADGES.error;
const heatCellColor = (score: number) => score >= 15 ? '#fee2e2' : score >= 10 ? '#ffedd5' : score >= 5 ? '#fef9c3' : '#dcfce7';
const heatCellBorder = (score: number) => score >= 15 ? '#fca5a5' : score >= 10 ? '#fdba74' : score >= 5 ? '#fde047' : '#86efac';

export function RisksPage() {
  const { t, nav } = useExperience();
  const { canManage } = useAuth();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [aiScoring, setAiScoring] = useState<string | null>(null); // null | risk_id | 'all'
  const [showAiDetail, setShowAiDetail] = useState<string | null>(null);

  // Filters
  const [filterSystem, setFilterSystem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [heatMapFilter, setHeatMapFilter] = useState<{ l: number; i: number } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);

  // Approval workflow
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalRiskId, setApprovalRiskId] = useState<string | null>(null);
  const [approvalJustification, setApprovalJustification] = useState('');
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', system_id: '', category: 'technical',
    likelihood: 3, impact: 3, treatment: 'mitigate', treatment_plan: '',
    treatment_due_date: '', owner: '',
  });

  const loadRisks = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filterSystem) params.set('system_id', filterSystem);
    if (filterStatus) params.set('status', filterStatus);
    if (filterCategory) params.set('category', filterCategory);
    if (filterLevel) params.set('risk_level', filterLevel);
    if (searchTerm) params.set('search', searchTerm);
    if (heatMapFilter) { params.set('likelihood', String(heatMapFilter.l)); params.set('impact', String(heatMapFilter.i)); }
    api(`/api/v1/risks?${params.toString()}`).then(d => { setRisks(d.risks); setTotal(d.total || d.risks.length); }).catch(() => {});
  };

  const loadStats = () => {
    api('/api/v1/risks/stats').then(d => setStats(d.stats)).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api('/api/v1/risks?page=1&limit=50').then(d => { setRisks(d.risks); setTotal(d.total || d.risks.length); }),
      api('/api/v1/systems').then(d => setSystems(d.systems)),
      api('/api/v1/risks/stats').then(d => setStats(d.stats)),
      api('/api/v1/controls').then(d => setControls(d.controls || [])).catch(() => {}),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (!loading) { setPage(1); loadRisks(); } }, [filterSystem, filterStatus, filterCategory, filterLevel, searchTerm, heatMapFilter]);
  useEffect(() => { if (!loading) loadRisks(); }, [page, limit]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/v1/risks', { method: 'POST', body: JSON.stringify(form) });
      setShowCreate(false);
      setForm({ title: '', description: '', system_id: '', category: 'technical', likelihood: 3, impact: 3, treatment: 'mitigate', treatment_plan: '', treatment_due_date: '', owner: '' });
      loadRisks();
      loadStats();
    } catch {} finally { setSaving(false); }
  };

  const handleExpand = (risk: Risk) => {
    if (expandedId === risk.id) { setExpandedId(null); return; }
    setExpandedId(risk.id);
    let relControls: string[] = [];
    try { relControls = JSON.parse(risk.related_controls || '[]'); } catch {}
    setEditFields({
      title: risk.title, description: risk.description || '', category: risk.category,
      likelihood: risk.likelihood, impact: risk.impact, treatment: risk.treatment,
      treatment_plan: risk.treatment_plan || '', treatment_due_date: risk.treatment_due_date || '',
      owner: risk.owner || '', status: risk.status, related_controls: relControls,
    });
  };

  const handleSaveEdit = async (riskId: string) => {
    if (editFields.treatment === 'accept' || editFields.status === 'accepted') {
      setApprovalRiskId(riskId);
      setApprovalJustification('');
      setApprovalError(null);
      setShowApprovalModal(true);
      return;
    }
    setSavingEdit(true);
    try {
      await api(`/api/v1/risks/${riskId}`, { method: 'PUT', body: JSON.stringify(editFields) });
      loadRisks();
      loadStats();
    } catch {} finally { setSavingEdit(false); }
  };

  const submitRiskApproval = async () => {
    if (!approvalRiskId || !approvalJustification.trim()) return;
    setRequestingApproval(true);
    setApprovalError(null);
    try {
      await api('/api/v1/approvals', {
        method: 'POST',
        body: JSON.stringify({ request_type: 'risk_acceptance', resource_id: approvalRiskId, justification: approvalJustification.trim() }),
      });
      setShowApprovalModal(false);
      setApprovalRiskId(null);
    } catch (e: any) {
      setApprovalError(e.message || 'Failed to submit approval request');
    } finally {
      setRequestingApproval(false);
    }
  };

  const handleDelete = async (riskId: string) => {
    try {
      await api(`/api/v1/risks/${riskId}`, { method: 'DELETE' });
      setExpandedId(null);
      setDeleteConfirm(null);
      loadRisks();
      loadStats();
    } catch {}
  };

  const handleAIScoreAll = async () => {
    setAiScoring('all');
    try {
      const res = await api('/api/v1/risks/ai-score', { method: 'POST', body: JSON.stringify({ score_all: true }) });
      if (res.scored) {
        setRisks(prev => prev.map(r => {
          const scored = res.scored.find((s: any) => s.risk_id === r.id);
          return scored ? { ...r, ai_risk_score: scored.ai_risk_score, ai_recommendation: scored.ai_recommendation, ai_scored_at: scored.ai_scored_at } : r;
        }));
      }
    } catch {} finally { setAiScoring(null); }
  };

  const handleAIScoreSingle = async (riskId: string) => {
    setAiScoring(riskId);
    try {
      const res = await api('/api/v1/risks/ai-score', { method: 'POST', body: JSON.stringify({ risk_id: riskId }) });
      setRisks(prev => prev.map(r => r.id === riskId ? { ...r, ai_risk_score: res.ai_risk_score, ai_recommendation: res.ai_recommendation, ai_scored_at: res.ai_scored_at } : r));
    } catch {} finally { setAiScoring(null); }
  };

  const toggleControl = (controlId: string) => {
    const current: string[] = editFields.related_controls || [];
    setEditFields({
      ...editFields,
      related_controls: current.includes(controlId) ? current.filter((c: string) => c !== controlId) : [...current, controlId],
    });
  };

  // Build heat map data: count risks at each L/I coordinate (from all unfiltered risks for accurate view)
  const buildHeatMapData = () => {
    const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
    for (const r of risks) {
      if (r.likelihood >= 1 && r.likelihood <= 5 && r.impact >= 1 && r.impact <= 5) {
        grid[r.likelihood - 1][r.impact - 1]++;
      }
    }
    return grid;
  };

  if (loading) return <div><SkeletonMetricCards /><SkeletonListItem count={5} /></div>;

  const heatData = buildHeatMapData();

  return (
    <div>
      {/* Header */}
      <PageHeader title={`${nav('risks')} (RiskForge ERM)`} subtitle={`Identify, assess, and manage organizational ${t('risk').toLowerCase()}s`}>
        {risks.length > 0 && (
          <>
            <button onClick={() => exportRisksCSV(risks)} className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button onClick={() => exportRiskRegisterDoc(risks, 'Organization')} className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              DOCX
            </button>
            <button onClick={() => exportRiskRegisterPdf(risks, 'Organization')} className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
          </>
        )}
        {canManage && (
          <button onClick={handleAIScoreAll} disabled={aiScoring === 'all'} className="px-3 py-2 text-xs font-medium text-purple-100 bg-purple-600/40 rounded-lg hover:bg-purple-600/60 flex items-center gap-1 border border-purple-400/30 disabled:opacity-50">
            {aiScoring === 'all' ? <><div className="w-3 h-3 border-2 border-purple-200 border-t-transparent rounded-full animate-spin" /> Scoring...</> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> AI Score All</>}
          </button>
        )}
        {canManage && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90">+ New {t('risk')}</button>}
      </PageHeader>

      {/* Analytics Cards — Dark MetricCards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ChartMetricCard
            title="Open Risks"
            value={String(stats.open_count || 0)}
            subtitle={`${stats.total || 0} total registered`}
            accentColor={STATUS_COLORS.danger}
          />
          <ChartMetricCard
            title="Critical / High"
            value={String((stats.by_level?.critical || 0) + (stats.by_level?.high || 0))}
            subtitle={`${stats.by_level?.critical || 0} critical, ${stats.by_level?.high || 0} high`}
            accentColor={STATUS_COLORS.danger}
          />
          <ChartMetricCard
            title="Avg Risk Score"
            value={`${stats.avg_score}/25`}
            accentColor={stats.avg_score >= 15 ? STATUS_COLORS.danger : stats.avg_score >= 10 ? STATUS_COLORS.orange : stats.avg_score >= 5 ? STATUS_COLORS.warning : STATUS_COLORS.success}
          />
          <ChartMetricCard
            title="Treatment Plans"
            value={`${stats.total > 0 ? Math.round(((stats.with_treatment || 0) / stats.total) * 100) : 0}%`}
            subtitle={`${stats.with_treatment || 0} of ${stats.total || 0} have plans`}
            accentColor={STATUS_COLORS.info}
          />
        </div>
      )}

      {/* Heat Map — Enhanced RiskHeatMap */}
      <div className="bg-white rounded-xl border border-blue-200 mb-6">
        <button onClick={() => setShowHeatMap(!showHeatMap)} className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="text-sm font-semibold text-gray-900">5x5 Risk Heat Map</span>
            {heatMapFilter && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Filtered: L:{heatMapFilter.l} x I:{heatMapFilter.i}</span>}
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showHeatMap ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {showHeatMap && (
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <RiskHeatMap
                risks={(() => {
                  // Build risk cells from grid data
                  const cells: { likelihood: number; impact: number; count: number; score: number }[] = [];
                  for (let l = 1; l <= 5; l++) {
                    for (let i = 1; i <= 5; i++) {
                      const count = heatData[l - 1]?.[i - 1] || 0;
                      cells.push({ likelihood: l, impact: i, count, score: l * i });
                    }
                  }
                  return cells;
                })()}
                size={380}
                onCellClick={(cell) => {
                  if (heatMapFilter?.l === cell.likelihood && heatMapFilter?.i === cell.impact) {
                    setHeatMapFilter(null);
                  } else {
                    setHeatMapFilter({ l: cell.likelihood, i: cell.impact });
                  }
                }}
              />
              {/* Legend */}
              <div className="flex flex-col justify-center gap-2 text-xs">
                <p className="font-medium text-gray-700 mb-1">Risk Zones</p>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }} /><span className="text-gray-600">Critical (15-25)</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ background: '#fff7ed', border: '1px solid #fdba74' }} /><span className="text-gray-600">High (10-14)</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ background: '#fffbeb', border: '1px solid #fde047' }} /><span className="text-gray-600">Moderate (5-9)</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ background: '#f0fdf4', border: '1px solid #86efac' }} /><span className="text-gray-600">Low (1-4)</span></div>
                {heatMapFilter && (
                  <button onClick={() => setHeatMapFilter(null)} className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">Clear heat map filter</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={[
          { type: 'select', key: 'system', label: 'All Systems', options: systems.map(s => ({ value: s.id, label: s.name })) },
          { type: 'select', key: 'status', label: 'All Statuses', options: STATUSES.map(s => ({ value: s, label: s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })) },
          { type: 'select', key: 'category', label: 'All Categories', options: CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })) },
          { type: 'select', key: 'level', label: 'All Levels', options: LEVELS.map(l => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) })) },
          { type: 'search', key: 'search', label: 'Search risks...' },
        ] as FilterField[]}
        values={{ system: filterSystem, status: filterStatus, category: filterCategory, level: filterLevel, search: searchTerm }}
        onChange={(key, val) => {
          const v = val as string;
          if (key === 'system') setFilterSystem(v);
          else if (key === 'status') setFilterStatus(v);
          else if (key === 'category') setFilterCategory(v);
          else if (key === 'level') setFilterLevel(v);
          else if (key === 'search') setSearchTerm(v);
        }}
        onClear={() => { setFilterSystem(''); setFilterStatus(''); setFilterCategory(''); setFilterLevel(''); setSearchTerm(''); }}
        resultCount={risks.length}
        resultLabel="risks"
      />

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Register New {t('risk')}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField label={`${t('risk')} Title`} name="risk_title" value={form.title} onChange={v => setForm({ ...form, title: v })} required placeholder={`Enter ${t('risk').toLowerCase()} title`} />
            <FormField label="Description" name="risk_desc" type="textarea" value={form.description} onChange={v => setForm({ ...form, description: v })} rows={2} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="System" name="risk_system" type="select" value={form.system_id} onChange={v => setForm({ ...form, system_id: v })} className="mb-0">
                <option value="">Select System</option>
                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </FormField>
              <FormField label="Category" name="risk_category" type="select" value={form.category} onChange={v => setForm({ ...form, category: v })} className="mb-0">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </FormField>
              <FormField label="Likelihood (1-5)" name="risk_likelihood" type="number" value={String(form.likelihood)} onChange={v => setForm({ ...form, likelihood: +v })} min={1} max={5} validate={v => { const n = +v; return n < 1 || n > 5 ? 'Must be 1-5' : null; }} className="mb-0" />
              <FormField label="Impact (1-5)" name="risk_impact" type="number" value={String(form.impact)} onChange={v => setForm({ ...form, impact: +v })} min={1} max={5} validate={v => { const n = +v; return n < 1 || n > 5 ? 'Must be 1-5' : null; }} className="mb-0" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="Treatment" name="risk_treatment" type="select" value={form.treatment} onChange={v => setForm({ ...form, treatment: v })} className="mb-0">
                {TREATMENTS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </FormField>
              <FormField label="Risk Owner" name="risk_owner" value={form.owner} onChange={v => setForm({ ...form, owner: v })} placeholder="Risk Owner" className="mb-0" />
              <FormField label="Treatment Due Date" name="risk_due_date" type="date" value={form.treatment_due_date} onChange={v => setForm({ ...form, treatment_due_date: v })} className="mb-0" />
              <div className="flex items-center">
                <span className={`text-sm font-medium px-3 py-1.5 rounded ${riskColor(form.likelihood * form.impact)}`}>Score: {form.likelihood * form.impact}</span>
              </div>
            </div>
            <FormField label="Treatment Plan" name="risk_treatment_plan" type="textarea" value={form.treatment_plan} onChange={v => setForm({ ...form, treatment_plan: v })} rows={2} placeholder="Treatment plan details..." />
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className={BUTTONS.primary}>{saving ? 'Creating...' : 'Create Risk'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className={BUTTONS.ghost}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Risk List */}
      {risks.length === 0 ? (
        <EmptyState title="No risks found" subtitle="Create a risk assessment to get started" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      ) : (
        <div className="space-y-3">
          {risks.map(r => {
            const isExpanded = expandedId === r.id;
            let relControls: string[] = [];
            try { relControls = JSON.parse(r.related_controls || '[]'); } catch {}

            return (
              <div key={r.id} className={`bg-white rounded-xl border ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-blue-200'} overflow-hidden`}>
                {/* Collapsed Row */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50" role="button" aria-expanded={isExpanded} tabIndex={0} onClick={() => handleExpand(r)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleExpand(r); } }}>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  <span className="font-mono text-xs text-gray-400 flex-shrink-0 w-24">{r.risk_id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold flex-shrink-0 ${riskColor(r.risk_score)}`}>{r.risk_score}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${levelColor(r.risk_level)}`}>{r.risk_level}</span>
                  {r.ai_risk_score !== null && r.ai_risk_score !== undefined && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${r.ai_risk_score >= 70 ? 'bg-green-100 text-green-700' : r.ai_risk_score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>AI:{r.ai_risk_score}</span>}
                  <span className="text-sm font-medium text-gray-900 truncate flex-1">{r.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize flex-shrink-0">{r.category}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">L:{r.likelihood} I:{r.impact}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize flex-shrink-0">{r.treatment}</span>
                  {r.owner && <span className="text-xs text-gray-400 flex-shrink-0 max-w-[80px] truncate">{r.owner}</span>}
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize flex-shrink-0 ${statusColor(r.status)}`}>{r.status.replace(/_/g, ' ')}</span>
                  {relControls.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 flex-shrink-0">{relControls.length} ctrl</span>}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-blue-200 px-6 py-5 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Editable Fields */}
                      <div className="lg:col-span-2 space-y-3">
                        {canManage ? (
                          <>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Title</label>
                              <input type="text" value={editFields.title || ''} onChange={e => setEditFields({ ...editFields, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Description</label>
                              <textarea value={editFields.description || ''} onChange={e => setEditFields({ ...editFields, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-500">Category</label>
                                <select value={editFields.category || ''} onChange={e => setEditFields({ ...editFields, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1">
                                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Likelihood</label>
                                <input type="number" min={1} max={5} value={editFields.likelihood || 1} onChange={e => setEditFields({ ...editFields, likelihood: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1" />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Impact</label>
                                <input type="number" min={1} max={5} value={editFields.impact || 1} onChange={e => setEditFields({ ...editFields, impact: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1" />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Score</label>
                                <div className={`mt-1 px-3 py-2 rounded-lg text-sm font-bold text-center ${riskColor((editFields.likelihood || 1) * (editFields.impact || 1))}`}>
                                  {(editFields.likelihood || 1) * (editFields.impact || 1)}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-500">Treatment</label>
                                <select value={editFields.treatment || ''} onChange={e => setEditFields({ ...editFields, treatment: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1">
                                  {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Status</label>
                                <select value={editFields.status || ''} onChange={e => setEditFields({ ...editFields, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1">
                                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Owner</label>
                                <input type="text" value={editFields.owner || ''} onChange={e => setEditFields({ ...editFields, owner: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1" />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Treatment Due</label>
                                <input type="date" value={editFields.treatment_due_date || ''} onChange={e => setEditFields({ ...editFields, treatment_due_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Treatment Plan</label>
                              <textarea value={editFields.treatment_plan || ''} onChange={e => setEditFields({ ...editFields, treatment_plan: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1" placeholder="Describe the treatment approach, milestones, and expected outcomes..." />
                            </div>

                            {/* Related Controls */}
                            <div>
                              <label className="text-xs font-medium text-gray-500">Related Controls ({(editFields.related_controls || []).length} linked)</label>
                              <div className="mt-1 border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto bg-white">
                                {controls.length === 0 ? (
                                  <p className="text-xs text-gray-400 py-1">No controls available</p>
                                ) : (
                                  <div className="space-y-1">
                                    {controls.slice(0, 50).map((c: any) => (
                                      <label key={c.id} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1">
                                        <input
                                          type="checkbox"
                                          checked={(editFields.related_controls || []).includes(c.control_id || c.id)}
                                          onChange={() => toggleControl(c.control_id || c.id)}
                                          className="rounded border-gray-300 text-blue-600"
                                        />
                                        <span className="font-mono text-gray-500">{c.control_id}</span>
                                        <span className="text-gray-700 truncate">{c.title}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                              <button onClick={() => handleSaveEdit(r.id)} disabled={savingEdit} className={`${BUTTONS.primary} flex items-center gap-1`}>
                                {savingEdit ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Save Changes</>}
                              </button>
                              <button onClick={() => setExpandedId(null)} className={BUTTONS.ghost}>Cancel</button>
                              <div className="ml-auto">
                                {deleteConfirm === r.id ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-600">Delete this risk?</span>
                                    <button onClick={() => handleDelete(r.id)} className={`${BUTTONS.danger} ${BUTTONS.sm}`}>Confirm</button>
                                    <button onClick={() => setDeleteConfirm(null)} className={`${BUTTONS.ghost} ${BUTTONS.sm}`}>No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirm(r.id)} className="px-3 py-1.5 text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Read-only view for non-managers */
                          <div className="space-y-3">
                            <div><label className="text-xs font-medium text-gray-500">Description</label><p className="text-sm text-gray-700 mt-1">{r.description || 'No description'}</p></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div><label className="text-xs font-medium text-gray-500">Category</label><p className="capitalize mt-1">{r.category}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Treatment</label><p className="capitalize mt-1">{r.treatment}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Owner</label><p className="mt-1">{r.owner || 'Unassigned'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Due Date</label><p className="mt-1">{r.treatment_due_date || 'Not set'}</p></div>
                            </div>
                            {r.treatment_plan && <div><label className="text-xs font-medium text-gray-500">Treatment Plan</label><p className="text-sm text-gray-700 mt-1">{r.treatment_plan}</p></div>}
                            {relControls.length > 0 && <div><label className="text-xs font-medium text-gray-500">Related Controls</label><div className="flex flex-wrap gap-1 mt-1">{relControls.map((c: string) => <span key={c} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono">{c}</span>)}</div></div>}
                          </div>
                        )}
                      </div>

                      {/* Right: Mini Scoring Matrix */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Risk Position</p>
                        <div className="bg-white rounded-lg border border-blue-200 p-3">
                          <svg width="180" height="180" viewBox="0 0 180 180">
                            {[5, 4, 3, 2, 1].map((l, yi) => (
                              <text key={`ml-${l}`} x="8" y={yi * 30 + 22} textAnchor="middle" fontSize="9" fill="#9ca3af">{l}</text>
                            ))}
                            {[1, 2, 3, 4, 5].map((i, xi) => (
                              <text key={`mi-${i}`} x={xi * 30 + 35} y="175" textAnchor="middle" fontSize="9" fill="#9ca3af">{i}</text>
                            ))}
                            {[5, 4, 3, 2, 1].map((l, yi) =>
                              [1, 2, 3, 4, 5].map((i, xi) => (
                                <rect key={`m-${l}-${i}`} x={xi * 30 + 20} y={yi * 30 + 6} width="28" height="28" rx="3" fill={heatCellColor(l * i)} stroke={heatCellBorder(l * i)} strokeWidth="1" />
                              ))
                            )}
                            {/* Current risk position indicator */}
                            <circle
                              cx={(canManage ? (editFields.impact || r.impact) : r.impact) * 30 - 30 + 34}
                              cy={(5 - (canManage ? (editFields.likelihood || r.likelihood) : r.likelihood)) * 30 + 20}
                              r="8" fill="#1e40af" stroke="white" strokeWidth="2"
                            />
                            <text
                              x={(canManage ? (editFields.impact || r.impact) : r.impact) * 30 - 30 + 34}
                              y={(5 - (canManage ? (editFields.likelihood || r.likelihood) : r.likelihood)) * 30 + 24}
                              textAnchor="middle" fontSize="9" fontWeight="700" fill="white" style={{ pointerEvents: 'none' }}>
                              {(canManage ? (editFields.likelihood || r.likelihood) : r.likelihood) * (canManage ? (editFields.impact || r.impact) : r.impact)}
                            </text>
                          </svg>
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                          <div className="flex justify-between"><span>System</span><span className="font-medium text-gray-700">{r.system_name || 'None'}</span></div>
                          <div className="flex justify-between"><span>Created</span><span className="font-medium text-gray-700">{new Date(r.created_at).toLocaleDateString()}</span></div>
                          <div className="flex justify-between"><span>Updated</span><span className="font-medium text-gray-700">{new Date(r.updated_at).toLocaleDateString()}</span></div>
                        </div>

                        {/* AI Insights */}
                        <div className="mt-4 pt-3 border-t border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-500">AI Risk Insights</p>
                            <button onClick={() => handleAIScoreSingle(r.id)} disabled={aiScoring === r.id} className="text-[10px] px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 disabled:opacity-50 font-medium">
                              {aiScoring === r.id ? 'Scoring...' : 'Score with AI'}
                            </button>
                          </div>
                          {r.ai_risk_score !== null && r.ai_risk_score !== undefined ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={`text-lg font-bold ${r.ai_risk_score >= 70 ? 'text-green-600' : r.ai_risk_score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{r.ai_risk_score}/100</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${r.ai_risk_score >= 70 ? 'bg-green-500' : r.ai_risk_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${r.ai_risk_score}%` }} />
                                </div>
                              </div>
                              {r.ai_recommendation && (
                                <div>
                                  <button onClick={() => setShowAiDetail(showAiDetail === r.id ? null : r.id)} className="text-[10px] text-purple-600 hover:underline font-medium">{showAiDetail === r.id ? 'Hide' : 'Show'} Recommendation</button>
                                  {showAiDetail === r.id && <p className="text-xs text-gray-600 mt-1 bg-purple-50 rounded-lg p-2 border border-purple-100">{r.ai_recommendation}</p>}
                                </div>
                              )}
                              {r.ai_scored_at && <p className="text-[10px] text-gray-400">Scored {new Date(r.ai_scored_at).toLocaleDateString()}</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Not yet scored. Click "Score with AI" to analyze.</p>
                          )}
                        </div>

                        {/* Activity Timeline */}
                        <div className="mt-4 pt-3 border-t border-blue-200">
                          <ActivityTimeline resourceType="risk" resourceId={r.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} onLimitChange={setLimit} showLimitSelector />
      {/* Risk Acceptance Approval Modal */}
      {showApprovalModal && approvalRiskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" role="dialog" aria-modal="true" aria-labelledby="risk-approval-modal-title">
            <h2 id="risk-approval-modal-title" className="text-lg font-bold text-gray-900 mb-1">Request Approval</h2>
            <p className="text-sm text-gray-500 mb-4">Accepting a risk requires admin approval.</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-gray-900 text-sm">{risks.find((r: any) => r.id === approvalRiskId)?.title || 'Risk'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Score: {risks.find((r: any) => r.id === approvalRiskId)?.risk_score || '?'} &middot; Level: {risks.find((r: any) => r.id === approvalRiskId)?.risk_level || '?'}</p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justification (required)</label>
            <textarea
              value={approvalJustification}
              onChange={(e) => setApprovalJustification(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Explain why this risk should be accepted..."
            />
            {approvalError && <p className="text-sm text-red-600 mt-2">{approvalError}</p>}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => { setShowApprovalModal(false); setApprovalRiskId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" disabled={requestingApproval}>Cancel</button>
              <button
                onClick={submitRiskApproval}
                disabled={requestingApproval || !approvalJustification.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {requestingApproval ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
