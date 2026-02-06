import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportVendorsCSV, exportVendorAssessmentDoc } from '../utils/exportHelpers';
import { PageHeader } from '../components/PageHeader';
import { FilterBar, FilterField } from '../components/FilterBar';
import { ScoreRadialChart, MetricCard as ChartMetricCard } from '../components/charts';
import { STATUS_COLORS } from '../utils/chartTheme';
import { SkeletonMetricCards, SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { FormField } from '../components/FormField';
import { Pagination } from '../components/Pagination';
import { TYPOGRAPHY, FORMS, BUTTONS, BADGES, CARDS } from '../utils/typography';

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
  c === 'critical' ? BADGES.error : c === 'high' ? BADGES.orange : c === 'medium' ? BADGES.warning : BADGES.success;

const statusColor = (s: string) =>
  s === 'approved' ? BADGES.success : s === 'active' ? BADGES.info : s === 'under_review' ? BADGES.warning : s === 'suspended' ? BADGES.orange : BADGES.error;

const tierColor = (t: number) =>
  t === 4 ? BADGES.error : t === 3 ? BADGES.orange : t === 2 ? BADGES.warning : BADGES.success;

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

// RiskScoreDonut replaced by ScoreRadialChart from charts/

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);

  const loadData = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filterCrit) params.set('criticality', filterCrit);
    if (filterStatus) params.set('status', filterStatus);
    if (filterTier) params.set('tier', filterTier);
    if (filterClass) params.set('data_classification', filterClass);
    if (search) params.set('search', search);
    Promise.all([
      api(`/api/v1/vendors?${params.toString()}`).catch(() => ({ vendors: [], total: 0 })),
      api('/api/v1/vendors/stats').catch(() => ({ stats: null })),
    ]).then(([vData, sData]) => {
      setVendors(vData.vendors || []);
      setTotal(vData.total || (vData.vendors || []).length);
      setStats(sData.stats || null);
      setLoading(false);
    });
  };

  useEffect(loadData, [page, limit, filterCrit, filterStatus, filterTier, filterClass, search]);
  useEffect(() => { setPage(1); }, [filterCrit, filterStatus, filterTier, filterClass, search]);

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

  if (loading) return <div><SkeletonMetricCards /><SkeletonListItem count={5} /></div>;

  const assessTotal = Object.values(assessScores).reduce((a, b) => a + b, 0);
  const assessTier = assessTotal >= 21 ? 1 : assessTotal >= 16 ? 2 : assessTotal >= 11 ? 3 : 4;

  return (
    <div>
      {/* Header */}
      <PageHeader title={`${nav('vendors')} (VendorGuard TPRM)`} subtitle={`Manage ${t('vendor').toLowerCase()} risk and compliance`}>
        {vendors.length > 0 && (
          <button onClick={() => exportVendorsCSV(vendors)} className={BUTTONS.secondary}>
            Export CSV
          </button>
        )}
        {canManage && (
          <button onClick={() => setShowCreate(true)} className={BUTTONS.primary}>
            + New {t('vendor')}
          </button>
        )}
      </PageHeader>

      {/* Stats Cards — Dark MetricCards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <ChartMetricCard
            title="Total Vendors"
            value={String(stats.total)}
            subtitle={`${stats.by_status.active || 0} active`}
            accentColor={STATUS_COLORS.info}
          />
          <ChartMetricCard
            title="Critical / High"
            value={String(stats.critical_high)}
            subtitle={`${stats.by_criticality.critical || 0} critical, ${stats.by_criticality.high || 0} high`}
            accentColor={stats.critical_high > 0 ? STATUS_COLORS.danger : STATUS_COLORS.muted}
          />
          <ChartMetricCard
            title="Avg Risk Score"
            value={stats.avg_score > 0 ? `${stats.avg_score}/25` : '--'}
            accentColor={stats.avg_score > 0 ? (stats.avg_score >= 21 ? STATUS_COLORS.success : stats.avg_score >= 16 ? STATUS_COLORS.warning : STATUS_COLORS.danger) : STATUS_COLORS.muted}
          />
          <ChartMetricCard
            title="Overdue Assessments"
            value={String(stats.overdue_assessments)}
            subtitle={`${stats.expiring_contracts} contract${stats.expiring_contracts !== 1 ? 's' : ''} expiring`}
            accentColor={stats.overdue_assessments > 0 ? STATUS_COLORS.danger : STATUS_COLORS.success}
          />
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={[
          { type: 'select', key: 'criticality', label: 'All Criticality', options: CRITICALITIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })) },
          { type: 'select', key: 'status', label: 'All Status', options: STATUSES.map(s => ({ value: s, label: s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) })) },
          { type: 'select', key: 'tier', label: 'All Tiers', options: RISK_TIERS.map(t => ({ value: String(t), label: `Tier ${t}` })) },
          { type: 'select', key: 'classification', label: 'All Classifications', options: DATA_CLASSIFICATIONS.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })) },
          { type: 'search', key: 'search', label: 'Search vendors...' },
        ] as FilterField[]}
        values={{ criticality: filterCrit, status: filterStatus, tier: filterTier, classification: filterClass, search }}
        onChange={(key, val) => {
          const v = val as string;
          if (key === 'criticality') setFilterCrit(v);
          else if (key === 'status') setFilterStatus(v);
          else if (key === 'tier') setFilterTier(v);
          else if (key === 'classification') setFilterClass(v);
          else if (key === 'search') setSearch(v);
        }}
        onClear={() => { setFilterCrit(''); setFilterStatus(''); setFilterTier(''); setFilterClass(''); setSearch(''); }}
        resultCount={total}
        resultLabel="vendors"
      />

      {/* Create Form */}
      {showCreate && (
        <div className={`${CARDS.elevated} p-6 mb-6`}>
          <h2 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>New {t('vendor')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={`${t('vendor')} Name`} name="vendor_name" value={form.name} onChange={v => setForm({ ...form, name: v })} required className="mb-0" />
              <FormField label="Category" name="vendor_category" value={form.category} onChange={v => setForm({ ...form, category: v })} placeholder="Category" className="mb-0" />
            </div>
            <FormField label="Description" name="vendor_desc" type="textarea" value={form.description} onChange={v => setForm({ ...form, description: v })} rows={2} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="Criticality" name="vendor_criticality" type="select" value={form.criticality} onChange={v => setForm({ ...form, criticality: v })} className="mb-0">
                {CRITICALITIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </FormField>
              <FormField label="Status" name="vendor_status" type="select" value={form.status} onChange={v => setForm({ ...form, status: v })} className="mb-0">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </FormField>
              <FormField label="Contact Name" name="vendor_contact_name" value={form.contact_name} onChange={v => setForm({ ...form, contact_name: v })} placeholder="Contact Name" className="mb-0" />
              <FormField label="Contact Email" name="vendor_contact_email" type="email" value={form.contact_email} onChange={v => setForm({ ...form, contact_email: v })} placeholder="Contact Email" validate={v => v && !/\S+@\S+\.\S+/.test(v) ? 'Invalid email' : null} className="mb-0" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="Contract Start" name="vendor_contract_start" type="date" value={form.contract_start} onChange={v => setForm({ ...form, contract_start: v })} className="mb-0" />
              <FormField label="Contract End" name="vendor_contract_end" type="date" value={form.contract_end} onChange={v => setForm({ ...form, contract_end: v })} className="mb-0" />
              <FormField label="Data Classification" name="vendor_data_class" type="select" value={form.data_classification} onChange={v => setForm({ ...form, data_classification: v })} className="mb-0">
                <option value="">Data Classification</option>
                {DATA_CLASSIFICATIONS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </FormField>
              {isHealthcare && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.has_baa === 1} onChange={(e) => setForm({ ...form, has_baa: e.target.checked ? 1 : 0 })} className="rounded" />
                  BAA in Place
                </label>
              )}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className={BUTTONS.primary}>{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className={BUTTONS.ghost}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Vendor Cards */}
      {vendors.length === 0 ? (
        <EmptyState title="No vendors found" subtitle="Add vendors to track third-party risk" icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => {
            const isExpanded = expandedId === v.id;
            const overdue = isOverdueAssessment(v);
            const expiring = isContractExpiring(v);
            let meta: any = {};
            try { meta = JSON.parse(v.metadata || '{}'); } catch {}
            const assessments = (meta.assessments || []).slice(-3).reverse();

            return (
              <div key={v.id} className={`${CARDS.base} overflow-hidden ${overdue ? 'border-red-300' : ''}`}>
                {/* Collapsed Row */}
                <div className="p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleExpand(v)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={TYPOGRAPHY.cardTitle}>{v.name}</h3>
                          {overdue && <span className={`${BADGES.base} ${BADGES.error} uppercase`}>Overdue</span>}
                          {expiring && <span className={`${BADGES.base} ${BADGES.orange}`}>Contract Expiring</span>}
                        </div>
                        <p className={`${TYPOGRAPHY.bodySmallMuted} mt-0.5`}>
                          {v.category && <span className="mr-2">{v.category}</span>}
                          {v.contact_name && <span className="mr-2">{v.contact_name}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${BADGES.base} ${critColor(v.criticality)}`}>{v.criticality}</span>
                      {v.overall_risk_score !== null && (
                        <span className={`${BADGES.base} border font-bold ${scoreBadgeClass(v.overall_risk_score)}`}>{v.overall_risk_score}/25</span>
                      )}
                      {v.risk_tier !== null && (
                        <span className={`${BADGES.base} ${tierColor(v.risk_tier)}`}>{tierLabel(v.risk_tier)}</span>
                      )}
                      <span className={`${BADGES.base} ${statusColor(v.status)}`}>{v.status.replace('_', ' ')}</span>
                      {isHealthcare && v.has_baa ? (
                        <span className={`${BADGES.base} ${BADGES.success}`}>BAA</span>
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
                                <label className={FORMS.label}>Name</label>
                                <input type="text" value={editFields.name || ''} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} className={FORMS.input} />
                              </div>
                              <div>
                                <label className={FORMS.label}>Category</label>
                                <input type="text" value={editFields.category || ''} onChange={(e) => setEditFields({ ...editFields, category: e.target.value })} className={FORMS.input} />
                              </div>
                            </div>
                            <div>
                              <label className={FORMS.label}>Description</label>
                              <textarea value={editFields.description || ''} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} rows={2} className={FORMS.textarea} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className={FORMS.label}>Criticality</label>
                                <select value={editFields.criticality} onChange={(e) => setEditFields({ ...editFields, criticality: e.target.value })} className={FORMS.select}>
                                  {CRITICALITIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className={FORMS.label}>Status</label>
                                <select value={editFields.status} onChange={(e) => setEditFields({ ...editFields, status: e.target.value })} className={FORMS.select}>
                                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className={FORMS.label}>Contact Name</label>
                                <input type="text" value={editFields.contact_name || ''} onChange={(e) => setEditFields({ ...editFields, contact_name: e.target.value })} className={FORMS.input} />
                              </div>
                              <div>
                                <label className={FORMS.label}>Contact Email</label>
                                <input type="email" value={editFields.contact_email || ''} onChange={(e) => setEditFields({ ...editFields, contact_email: e.target.value })} className={FORMS.input} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className={FORMS.label}>Contract Start</label>
                                <input type="date" value={editFields.contract_start || ''} onChange={(e) => setEditFields({ ...editFields, contract_start: e.target.value })} className={FORMS.input} />
                              </div>
                              <div>
                                <label className={FORMS.label}>Contract End</label>
                                <input type="date" value={editFields.contract_end || ''} onChange={(e) => setEditFields({ ...editFields, contract_end: e.target.value })} className={FORMS.input} />
                              </div>
                              <div>
                                <label className={FORMS.label}>Data Classification</label>
                                <select value={editFields.data_classification || ''} onChange={(e) => setEditFields({ ...editFields, data_classification: e.target.value })} className={FORMS.select}>
                                  <option value="">None</option>
                                  {DATA_CLASSIFICATIONS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                </select>
                              </div>
                              {isHealthcare && (
                                <label className="flex items-center gap-2 text-sm mt-5">
                                  <input type="checkbox" checked={editFields.has_baa === 1} onChange={(e) => setEditFields({ ...editFields, has_baa: e.target.checked ? 1 : 0 })} className={FORMS.checkbox} />
                                  BAA in Place
                                </label>
                              )}
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                              <button onClick={() => handleSaveEdit(v.id)} disabled={savingEdit} className={BUTTONS.primary}>
                                {savingEdit ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button onClick={() => exportVendorAssessmentDoc(v, '')} className={BUTTONS.secondary}>
                                Export DOCX
                              </button>
                              {deleteConfirm === v.id ? (
                                <div className="flex items-center gap-2 ml-auto">
                                  <span className="text-xs text-red-600 font-medium">Delete this vendor?</span>
                                  <button onClick={() => handleDelete(v.id)} className={`${BUTTONS.danger} ${BUTTONS.sm}`}>Yes, Delete</button>
                                  <button onClick={() => setDeleteConfirm(null)} className={`${BUTTONS.ghost} ${BUTTONS.sm}`}>Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirm(v.id)} className="ml-auto text-red-600 text-xs hover:text-red-700">Delete</button>
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
                        <div className="bg-white rounded-lg border border-blue-200 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {v.overall_risk_score !== null ? (
                              <ScoreRadialChart
                                score={Math.round((v.overall_risk_score / 25) * 100)}
                                size={64}
                                thickness={6}
                                showLabel={false}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full border-4 border-blue-200 flex items-center justify-center text-gray-400 text-xs">N/A</div>
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
                          <div className="bg-white rounded-lg border border-blue-200 p-4">
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
                          <div className="bg-white rounded-lg border border-blue-200 p-4">
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
      <Pagination page={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} onLimitChange={setLimit} showLimitSelector />
    </div>
  );
}
