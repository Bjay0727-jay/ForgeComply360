import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportRisksCSV, exportRiskRegisterDoc } from '../utils/exportHelpers';

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

const riskColor = (score: number) => score >= 15 ? 'bg-red-100 text-red-700 border-red-200' : score >= 10 ? 'bg-orange-100 text-orange-700 border-orange-200' : score >= 5 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200';
const levelColor = (level: string) => level === 'critical' ? 'bg-red-100 text-red-700' : level === 'high' ? 'bg-orange-100 text-orange-700' : level === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
const statusColor = (status: string) => status === 'closed' ? 'bg-green-100 text-green-700' : status === 'accepted' ? 'bg-blue-100 text-blue-700' : status === 'monitored' ? 'bg-purple-100 text-purple-700' : status === 'in_treatment' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
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

  // Filters
  const [filterSystem, setFilterSystem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [heatMapFilter, setHeatMapFilter] = useState<{ l: number; i: number } | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', system_id: '', category: 'technical',
    likelihood: 3, impact: 3, treatment: 'mitigate', treatment_plan: '',
    treatment_due_date: '', owner: '',
  });

  const loadRisks = () => {
    const params = new URLSearchParams();
    if (filterSystem) params.set('system_id', filterSystem);
    if (filterStatus) params.set('status', filterStatus);
    if (filterCategory) params.set('category', filterCategory);
    if (filterLevel) params.set('risk_level', filterLevel);
    if (searchTerm) params.set('search', searchTerm);
    if (heatMapFilter) { params.set('likelihood', String(heatMapFilter.l)); params.set('impact', String(heatMapFilter.i)); }
    const qs = params.toString();
    api(`/api/v1/risks${qs ? '?' + qs : ''}`).then(d => setRisks(d.risks)).catch(() => {});
  };

  const loadStats = () => {
    api('/api/v1/risks/stats').then(d => setStats(d.stats)).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api('/api/v1/risks').then(d => setRisks(d.risks)),
      api('/api/v1/systems').then(d => setSystems(d.systems)),
      api('/api/v1/risks/stats').then(d => setStats(d.stats)),
      api('/api/v1/controls').then(d => setControls(d.controls || [])).catch(() => {}),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (!loading) loadRisks(); }, [filterSystem, filterStatus, filterCategory, filterLevel, searchTerm, heatMapFilter]);

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
    setSavingEdit(true);
    try {
      await api(`/api/v1/risks/${riskId}`, { method: 'PUT', body: JSON.stringify(editFields) });
      loadRisks();
      loadStats();
    } catch {} finally { setSavingEdit(false); }
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

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const heatData = buildHeatMapData();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{nav('risks')} (RiskForge ERM)</h1>
          <p className="text-gray-500 text-sm mt-1">Identify, assess, and manage organizational {t('risk').toLowerCase()}s</p>
        </div>
        <div className="flex items-center gap-2">
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
            </>
          )}
          {canManage && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New {t('risk')}</button>}
        </div>
      </div>

      {/* Analytics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Open Risks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.open_count}</p>
            <p className="text-[10px] text-gray-400 mt-1">{stats.total} total registered</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Critical / High</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{(stats.by_level?.critical || 0) + (stats.by_level?.high || 0)}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] text-red-500">{stats.by_level?.critical || 0} critical</span>
              <span className="text-[10px] text-orange-500">{stats.by_level?.high || 0} high</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Avg Risk Score</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avg_score}<span className="text-sm text-gray-400 font-normal">/25</span></p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="h-1.5 rounded-full" style={{ width: `${(stats.avg_score / 25) * 100}%`, backgroundColor: stats.avg_score >= 15 ? '#dc2626' : stats.avg_score >= 10 ? '#ea580c' : stats.avg_score >= 5 ? '#ca8a04' : '#16a34a' }} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Treatment Plans</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total > 0 ? Math.round((stats.with_treatment / stats.total) * 100) : 0}%</p>
            <p className="text-[10px] text-gray-400 mt-1">{stats.with_treatment} of {stats.total} have plans</p>
          </div>
        </div>
      )}

      {/* Heat Map */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
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
            <div className="flex gap-6">
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center mr-1">
                  <span className="text-[10px] text-gray-400 font-medium -rotate-90 whitespace-nowrap mb-8">LIKELIHOOD</span>
                </div>
                <div>
                  <svg width="330" height="330" viewBox="0 0 330 330">
                    {/* Y-axis labels */}
                    {[5, 4, 3, 2, 1].map((l, yi) => (
                      <text key={`yl-${l}`} x="20" y={yi * 58 + 38} textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="500">{l}</text>
                    ))}
                    {/* X-axis labels */}
                    {[1, 2, 3, 4, 5].map((i, xi) => (
                      <text key={`xl-${i}`} x={xi * 58 + 68} y="320" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="500">{i}</text>
                    ))}
                    {/* Grid cells */}
                    {[5, 4, 3, 2, 1].map((l, yi) =>
                      [1, 2, 3, 4, 5].map((i, xi) => {
                        const score = l * i;
                        const count = heatData[l - 1]?.[i - 1] || 0;
                        const isActive = heatMapFilter?.l === l && heatMapFilter?.i === i;
                        return (
                          <g key={`${l}-${i}`}>
                            <rect
                              x={xi * 58 + 40}
                              y={yi * 58 + 10}
                              width="54"
                              height="54"
                              rx="6"
                              fill={heatCellColor(score)}
                              stroke={isActive ? '#3b82f6' : heatCellBorder(score)}
                              strokeWidth={isActive ? 3 : 1.5}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (isActive) { setHeatMapFilter(null); } else { setHeatMapFilter({ l, i }); }
                              }}
                            />
                            {count > 0 && (
                              <text x={xi * 58 + 67} y={yi * 58 + 42} textAnchor="middle" fontSize="16" fontWeight="700" fill={score >= 15 ? '#dc2626' : score >= 10 ? '#ea580c' : score >= 5 ? '#a16207' : '#15803d'} style={{ pointerEvents: 'none' }}>{count}</text>
                            )}
                            <text x={xi * 58 + 67} y={yi * 58 + 56} textAnchor="middle" fontSize="8" fill="#9ca3af" style={{ pointerEvents: 'none' }}>{score}</text>
                          </g>
                        );
                      })
                    )}
                  </svg>
                  <p className="text-[10px] text-gray-400 text-center font-medium mt-1">IMPACT</p>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-col justify-center gap-2 text-xs">
                <p className="font-medium text-gray-700 mb-1">Risk Zones</p>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }} /><span className="text-gray-600">Critical (15-25)</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ background: '#ffedd5', border: '1px solid #fdba74' }} /><span className="text-gray-600">High (10-14)</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ background: '#fef9c3', border: '1px solid #fde047' }} /><span className="text-gray-600">Moderate (5-9)</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ background: '#dcfce7', border: '1px solid #86efac' }} /><span className="text-gray-600">Low (1-4)</span></div>
                {heatMapFilter && (
                  <button onClick={() => setHeatMapFilter(null)} className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">Clear heat map filter</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
        <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs">
          <option value="">All Systems</option>
          {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs">
          <option value="">All Levels</option>
          {LEVELS.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
        </select>
        <input type="text" placeholder="Search risks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs flex-1 min-w-[150px]" />
        <span className="text-xs text-gray-400 ml-auto">{risks.length} risk{risks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Register New {t('risk')}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" placeholder={`${t('risk')} Title *`} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select value={form.system_id} onChange={e => setForm({ ...form, system_id: e.target.value })} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                <option value="">Select System</option>
                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <div>
                <label className="text-xs text-gray-500">Likelihood (1-5)</label>
                <input type="number" min={1} max={5} value={form.likelihood} onChange={e => setForm({ ...form, likelihood: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Impact (1-5)</label>
                <input type="number" min={1} max={5} value={form.impact} onChange={e => setForm({ ...form, impact: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                {TREATMENTS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              <input type="text" placeholder="Risk Owner" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
              <input type="date" value={form.treatment_due_date} onChange={e => setForm({ ...form, treatment_due_date: e.target.value })} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" title="Treatment Due Date" />
              <div className="flex items-center">
                <span className={`text-sm font-medium px-3 py-1.5 rounded ${riskColor(form.likelihood * form.impact)}`}>Score: {form.likelihood * form.impact}</span>
              </div>
            </div>
            <textarea placeholder="Treatment plan details..." value={form.treatment_plan} onChange={e => setForm({ ...form, treatment_plan: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create Risk'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Risk List */}
      {risks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-gray-500">No {t('risk').toLowerCase()}s found{(filterSystem || filterStatus || filterCategory || filterLevel || searchTerm || heatMapFilter) ? ' matching filters' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map(r => {
            const isExpanded = expandedId === r.id;
            let relControls: string[] = [];
            try { relControls = JSON.parse(r.related_controls || '[]'); } catch {}

            return (
              <div key={r.id} className={`bg-white rounded-xl border ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'} overflow-hidden`}>
                {/* Collapsed Row */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => handleExpand(r)}>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  <span className="font-mono text-xs text-gray-400 flex-shrink-0 w-24">{r.risk_id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold flex-shrink-0 ${riskColor(r.risk_score)}`}>{r.risk_score}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${levelColor(r.risk_level)}`}>{r.risk_level}</span>
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
                  <div className="border-t border-gray-200 px-6 py-5 bg-gray-50">
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
                              <button onClick={() => handleSaveEdit(r.id)} disabled={savingEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                                {savingEdit ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Save Changes</>}
                              </button>
                              <button onClick={() => setExpandedId(null)} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800">Cancel</button>
                              <div className="ml-auto">
                                {deleteConfirm === r.id ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-600">Delete this risk?</span>
                                    <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700">Confirm</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-gray-500 text-xs">No</button>
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
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
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
                      </div>
                    </div>
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
