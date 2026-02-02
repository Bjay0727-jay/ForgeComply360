import React, { useEffect, useState, useMemo } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportVendorsCSV, exportVendorAssessmentDoc } from '../utils/exportHelpers';

interface Vendor {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  criticality: string;
  risk_tier: number | null;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  contract_start: string | null;
  contract_end: string | null;
  last_assessment_date: string | null;
  next_assessment_date: string | null;
  overall_risk_score: number | null;
  data_classification: string | null;
  has_baa: number;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

interface VendorStats {
  total: number;
  avg_score: number;
  overdue_assessments: number;
  expiring_contracts: number;
  critical_high: number;
  by_criticality: Record<string, number>;
  by_status: Record<string, number>;
  by_tier: Record<string, number>;
}

const CRITICALITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['active', 'under_review', 'approved', 'suspended', 'terminated'];
const RISK_TIERS = [1, 2, 3, 4];
const DATA_CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'];

const ASSESSMENT_CATEGORIES = [
  { key: 'security_posture', label: 'Security Posture', desc: 'Controls, encryption, access management' },
  { key: 'data_handling', label: 'Data Handling', desc: 'Storage, transfer, retention practices' },
  { key: 'compliance_status', label: 'Compliance Status', desc: 'Certifications, audit results' },
  { key: 'incident_history', label: 'Incident History', desc: 'Breaches, response readiness' },
  { key: 'financial_stability', label: 'Financial Stability', desc: 'Viability, insurance coverage' },
];

const critColor = (c: string) =>
  c === 'critical' ? 'bg-red-100 text-red-700' : c === 'high' ? 'bg-orange-100 text-orange-700' : c === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';

const statusColor = (s: string) =>
  s === 'approved' ? 'bg-green-100 text-green-700' : s === 'active' ? 'bg-blue-100 text-blue-700' : s === 'under_review' ? 'bg-yellow-100 text-yellow-700' : s === 'suspended' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';

const tierColor = (t: number) =>
  t === 4 ? 'bg-red-100 text-red-700' : t === 3 ? 'bg-orange-100 text-orange-700' : t === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';

const tierLabel = (t: number) =>
  t === 1 ? 'Tier 1' : t === 2 ? 'Tier 2' : t === 3 ? 'Tier 3' : 'Tier 4';

const scoreColorHex = (s: number) =>
  s >= 21 ? '#22c55e' : s >= 16 ? '#eab308' : s >= 11 ? '#f97316' : '#ef4444';

const scoreBadgeClass = (s: number) =>
  s >= 21 ? 'bg-green-100 text-green-700 border-green-200' : s >= 16 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : s >= 11 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200';

function formatDate(d: string | null): string {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdueAssessment(v: Vendor): boolean {
  if (!v.next_assessment_date) return false;
  return new Date(v.next_assessment_date) < new Date();
}

function isContractExpiring(v: Vendor): boolean {
  if (!v.contract_end) return false;
  const end = new Date(v.contract_end);
  const now = new Date();
  return end >= now && end.getTime() - now.getTime() <= 30 * 86400000;
}

function RiskScoreDonut({ score }: { score: number }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 25, 1);
  const offset = circ - pct * circ;
  const color = scoreColorHex(score);
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 32 32)" className="transition-all duration-500" />
      <text x="32" y="35" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#111827">{score}</text>
    </svg>
  );
}

export function VendorsPage() {
  const { t, nav, isHealthcare } = useExperience();
  const { canEdit, canManage } = useAuth();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', criticality: 'medium', status: 'active', contact_name: '', contact_email: '', contract_start: '', contract_end: '', data_classification: '', has_baa: 0 });
  const [saving, setSaving] = useState(false);

  // Expand + edit
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Assessment
  const [assessScores, setAssessScores] = useState<Record<string, number>>({ security_posture: 3, data_handling: 3, compliance_status: 3, incident_history: 3, financial_stability: 3 });
  const [assessing, setAssessing] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filters
  const [filterCrit, setFilterCrit] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [search, setSearch] = useState('');

  const loadData = () => {
    Promise.all([
      api('/api/v1/vendors').catch(() => ({ vendors: [] })),
      api('/api/v1/vendors/stats').catch(() => ({ stats: null })),
    ]).then(([vData, sData]) => {
      setVendors(vData.vendors || []);
      setStats(sData.stats || null);
      setLoading(false);
    });
  };

  useEffect(loadData, []);

  const filtered = useMemo(() => {
    let list = vendors;
    if (filterCrit) list = list.filter((v) => v.criticality === filterCrit);
    if (filterStatus) list = list.filter((v) => v.status === filterStatus);
    if (filterTier) list = list.filter((v) => v.risk_tier === Number(filterTier));
    if (filterClass) list = list.filter((v) => v.data_classification === filterClass);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((v) => v.name.toLowerCase().includes(s) || (v.category || '').toLowerCase().includes(s) || (v.contact_name || '').toLowerCase().includes(s) || (v.description || '').toLowerCase().includes(s));
    }
    return list;
  }, [vendors, filterCrit, filterStatus, filterTier, filterClass, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/v1/vendors', { method: 'POST', body: JSON.stringify(form) });
      setShowCreate(false);
      setForm({ name: '', description: '', category: '', criticality: 'medium', status: 'active', contact_name: '', contact_email: '', contract_start: '', contract_end: '', data_classification: '', has_baa: 0 });
      loadData();
    } catch {} finally { setSaving(false); }
  };

  const handleExpand = (v: Vendor) => {
    if (expandedId === v.id) { setExpandedId(null); return; }
    setExpandedId(v.id);
    setEditFields({ name: v.name, description: v.description || '', category: v.category || '', criticality: v.criticality, status: v.status, contact_name: v.contact_name || '', contact_email: v.contact_email || '', contract_start: v.contract_start || '', contract_end: v.contract_end || '', data_classification: v.data_classification || '', has_baa: v.has_baa });
    let meta: any = {};
    try { meta = JSON.parse(v.metadata || '{}'); } catch {}
    const last = (meta.assessments || []).slice(-1)[0];
    if (last?.scores) {
      setAssessScores(last.scores);
    } else {
      setAssessScores({ security_posture: 3, data_handling: 3, compliance_status: 3, incident_history: 3, financial_stability: 3 });
    }
  };

  const handleSaveEdit = async (vendorId: string) => {
    setSavingEdit(true);
    try {
      await api(`/api/v1/vendors/${vendorId}`, { method: 'PUT', body: JSON.stringify(editFields) });
      loadData();
    } catch {} finally { setSavingEdit(false); }
  };

  const handleAssess = async (vendorId: string) => {
    setAssessing(true);
    try {
      await api(`/api/v1/vendors/${vendorId}/assess`, { method: 'POST', body: JSON.stringify(assessScores) });
      loadData();
    } catch {} finally { setAssessing(false); }
  };

  const handleDelete = async (vendorId: string) => {
    try {
      await api(`/api/v1/vendors/${vendorId}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      setExpandedId(null);
      loadData();
    } catch {}
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const assessTotal = Object.values(assessScores).reduce((a, b) => a + b, 0);
  const assessTier = assessTotal >= 21 ? 1 : assessTotal >= 16 ? 2 : assessTotal >= 11 ? 3 : 4;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{nav('vendors')} (VendorGuard TPRM)</h1>
          <p className="text-gray-500 text-sm mt-1">Manage {t('vendor').toLowerCase()} risk and compliance</p>
        </div>
        <div className="flex items-center gap-2">
          {vendors.length > 0 && (
            <button onClick={() => exportVendorsCSV(vendors)} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Export CSV
            </button>
          )}
          {canManage && (
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              + New {t('vendor')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Vendors</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.by_status.active || 0} active</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Critical / High</div>
            <div className={`text-3xl font-bold ${stats.critical_high > 0 ? 'text-red-600' : 'text-gray-400'}`}>{stats.critical_high}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.by_criticality.critical || 0} critical, {stats.by_criticality.high || 0} high</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Risk Score</div>
            <div className="text-3xl font-bold text-gray-900">{stats.avg_score > 0 ? `${stats.avg_score}/25` : '--'}</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${(stats.avg_score / 25) * 100}%`, backgroundColor: stats.avg_score > 0 ? scoreColorHex(stats.avg_score) : '#d1d5db' }} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overdue Assessments</div>
            <div className={`text-3xl font-bold ${stats.overdue_assessments > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.overdue_assessments}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.expiring_contracts} contract{stats.expiring_contracts !== 1 ? 's' : ''} expiring</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={filterCrit} onChange={(e) => setFilterCrit(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Criticality</option>
          {CRITICALITIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Tiers</option>
          {RISK_TIERS.map((t) => <option key={t} value={String(t)}>Tier {t}</option>)}
        </select>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Classifications</option>
          {DATA_CLASSIFICATIONS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
        <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[180px]" />
        <span className="text-sm text-gray-500">{filtered.length} vendor{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">New {t('vendor')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder={`${t('vendor')} Name *`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-4 py-2.5 border border-gray-300 rounded-lg" />
              <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                {CRITICALITIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
              <input type="text" placeholder="Contact Name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
              <input type="email" placeholder="Contact Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Contract Start</label>
                <input type="date" value={form.contract_start} onChange={(e) => setForm({ ...form, contract_start: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Contract End</label>
                <input type="date" value={form.contract_end} onChange={(e) => setForm({ ...form, contract_end: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <select value={form.data_classification} onChange={(e) => setForm({ ...form, data_classification: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                <option value="">Data Classification</option>
                {DATA_CLASSIFICATIONS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
              {isHealthcare && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.has_baa === 1} onChange={(e) => setForm({ ...form, has_baa: e.target.checked ? 1 : 0 })} className="rounded" />
                  BAA in Place
                </label>
              )}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Vendor Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">{vendors.length === 0 ? `No ${t('vendor').toLowerCase()}s added yet.` : 'No vendors match filters.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const isExpanded = expandedId === v.id;
            const overdue = isOverdueAssessment(v);
            const expiring = isContractExpiring(v);
            let meta: any = {};
            try { meta = JSON.parse(v.metadata || '{}'); } catch {}
            const assessments = (meta.assessments || []).slice(-3).reverse();

            return (
              <div key={v.id} className={`bg-white rounded-xl border overflow-hidden ${overdue ? 'border-red-300' : 'border-gray-200'}`}>
                {/* Collapsed Row */}
                <div className="p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleExpand(v)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{v.name}</h3>
                          {overdue && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold uppercase">Overdue</span>}
                          {expiring && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold">Contract Expiring</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {v.category && <span className="mr-2">{v.category}</span>}
                          {v.contact_name && <span className="mr-2">{v.contact_name}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${critColor(v.criticality)}`}>{v.criticality}</span>
                      {v.overall_risk_score !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded border font-bold ${scoreBadgeClass(v.overall_risk_score)}`}>{v.overall_risk_score}/25</span>
                      )}
                      {v.risk_tier !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${tierColor(v.risk_tier)}`}>{tierLabel(v.risk_tier)}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor(v.status)}`}>{v.status.replace('_', ' ')}</span>
                      {isHealthcare && v.has_baa ? (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">BAA</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Edit Fields */}
                      <div className="lg:col-span-2 space-y-3">
                        {canManage ? (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                                <input type="text" value={editFields.name || ''} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                                <input type="text" value={editFields.category || ''} onChange={(e) => setEditFields({ ...editFields, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Description</label>
                              <textarea value={editFields.description || ''} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Criticality</label>
                                <select value={editFields.criticality} onChange={(e) => setEditFields({ ...editFields, criticality: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                  {CRITICALITIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                                <select value={editFields.status} onChange={(e) => setEditFields({ ...editFields, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Contact Name</label>
                                <input type="text" value={editFields.contact_name || ''} onChange={(e) => setEditFields({ ...editFields, contact_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Contact Email</label>
                                <input type="email" value={editFields.contact_email || ''} onChange={(e) => setEditFields({ ...editFields, contact_email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Contract Start</label>
                                <input type="date" value={editFields.contract_start || ''} onChange={(e) => setEditFields({ ...editFields, contract_start: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Contract End</label>
                                <input type="date" value={editFields.contract_end || ''} onChange={(e) => setEditFields({ ...editFields, contract_end: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Data Classification</label>
                                <select value={editFields.data_classification || ''} onChange={(e) => setEditFields({ ...editFields, data_classification: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                  <option value="">None</option>
                                  {DATA_CLASSIFICATIONS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                </select>
                              </div>
                              {isHealthcare && (
                                <label className="flex items-center gap-2 text-sm mt-5">
                                  <input type="checkbox" checked={editFields.has_baa === 1} onChange={(e) => setEditFields({ ...editFields, has_baa: e.target.checked ? 1 : 0 })} className="rounded" />
                                  BAA in Place
                                </label>
                              )}
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                              <button onClick={() => handleSaveEdit(v.id)} disabled={savingEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                {savingEdit ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button onClick={() => exportVendorAssessmentDoc(v, '')} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">
                                Export DOCX
                              </button>
                              {deleteConfirm === v.id ? (
                                <div className="flex items-center gap-2 ml-auto">
                                  <span className="text-xs text-red-600 font-medium">Delete this vendor?</span>
                                  <button onClick={() => handleDelete(v.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Yes, Delete</button>
                                  <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-gray-600 text-xs">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirm(v.id)} className="ml-auto px-3 py-1.5 text-red-600 text-xs hover:text-red-700">Delete</button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            {v.description && <p className="text-sm text-gray-600">{v.description}</p>}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-gray-500">Category:</span> {v.category || 'N/A'}</div>
                              <div><span className="text-gray-500">Contact:</span> {v.contact_name || 'N/A'} {v.contact_email && `(${v.contact_email})`}</div>
                              <div><span className="text-gray-500">Contract:</span> {formatDate(v.contract_start)} — {formatDate(v.contract_end)}</div>
                              <div><span className="text-gray-500">Classification:</span> {(v.data_classification || 'N/A').toUpperCase()}</div>
                              {isHealthcare && <div><span className="text-gray-500">BAA:</span> {v.has_baa ? 'Yes' : 'No'}</div>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Assessment Panel */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {v.overall_risk_score !== null ? (
                              <RiskScoreDonut score={v.overall_risk_score} />
                            ) : (
                              <div className="w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {v.risk_tier !== null ? tierLabel(v.risk_tier) : 'Not Assessed'}
                              </div>
                              <div className="text-xs text-gray-500">Last: {formatDate(v.last_assessment_date)}</div>
                              <div className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                Next: {formatDate(v.next_assessment_date)} {overdue && '(OVERDUE)'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {canManage && (
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Risk Assessment</h4>
                            <div className="space-y-3">
                              {ASSESSMENT_CATEGORIES.map((cat) => (
                                <div key={cat.key}>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium text-gray-700">{cat.label}</label>
                                    <span className="text-xs font-bold text-gray-900">{assessScores[cat.key]}/5</span>
                                  </div>
                                  <input
                                    type="range" min="1" max="5" step="1"
                                    value={assessScores[cat.key]}
                                    onChange={(e) => setAssessScores({ ...assessScores, [cat.key]: Number(e.target.value) })}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                  />
                                  <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">Overall: {assessTotal}/25</span>
                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${tierColor(assessTier)}`}>{tierLabel(assessTier)}</span>
                                </div>
                                <button
                                  onClick={() => handleAssess(v.id)}
                                  disabled={assessing}
                                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  {assessing ? 'Assessing...' : 'Run Assessment'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {assessments.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Assessment History</h4>
                            <div className="space-y-2">
                              {assessments.map((a: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                                  <div>
                                    <span className="text-gray-500">{formatDate(a.date)}</span>
                                    <span className="text-gray-400 ml-1">by {a.assessor}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded border font-bold ${scoreBadgeClass(a.overall_score)}`}>{a.overall_score}/25</span>
                                    <span className={`px-1.5 py-0.5 rounded font-medium ${tierColor(a.risk_tier)}`}>{tierLabel(a.risk_tier)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
