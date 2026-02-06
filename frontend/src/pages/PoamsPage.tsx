import React, { useEffect, useState, useCallback } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportPoamsCSV } from '../utils/exportHelpers';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { PageHeader } from '../components/PageHeader';
import { FilterBar, FilterField } from '../components/FilterBar';
import { SkeletonMetricCards, SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { FormField } from '../components/FormField';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, BUTTONS, FORMS, CARDS, MODALS, BADGES } from '../utils/typography';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', open: 'Open', in_progress: 'In Progress',
  verification: 'Verification', completed: 'Completed',
  accepted: 'Accepted', deferred: 'Deferred',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700', verification: 'bg-forge-navy/10 text-forge-navy-700',
  completed: 'bg-green-100 text-green-700', accepted: 'bg-emerald-100 text-emerald-700',
  deferred: 'bg-gray-100 text-gray-500',
};
const RISK_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  moderate: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700',
};
const WORKFLOW_STEPS = ['draft', 'open', 'in_progress', 'verification', 'completed'];
const MS_COLORS: Record<string, string> = { pending: 'bg-gray-100 text-gray-600', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700' };

function ageColor(days: number): string {
  if (days < 30) return 'bg-green-100 text-green-700';
  if (days < 60) return 'bg-yellow-100 text-yellow-700';
  if (days < 90) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function PoamsPage() {
  const { t, nav, isFederal } = useExperience();
  const { canEdit, canManage } = useAuth();
  const { addToast } = useToast();

  const [poams, setPoams] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSystem, setFilterSystem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ system_id: '', weakness_name: '', weakness_description: '', risk_level: 'moderate', scheduled_completion: '', responsible_party: '', assigned_to: '' });
  const [saving, setSaving] = useState(false);

  // Expanded view
  const [confirmDeleteId, setConfirmDeleteId] = useState(null as string|null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [savingEdit, setSavingEdit] = useState('');

  // Milestones + comments for expanded view
  const [milestones, setMilestones] = useState<any[]>([]);
  const [newMs, setNewMs] = useState({ title: '', target_date: '' });
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  // Approval workflow
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState<{ id: string; name: string } | null>(null);
  const [approvalJustification, setApprovalJustification] = useState('');
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const loadPoams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filterSystem) params.set('system_id', filterSystem);
    if (filterStatus) params.set('status', filterStatus);
    if (filterRisk) params.set('risk_level', filterRisk);
    if (filterOverdue) params.set('overdue', '1');
    api(`/api/v1/poams?${params.toString()}`).then((d) => { setPoams(d.poams || []); setTotal(d.total || (d.poams || []).length); });
  }, [filterSystem, filterStatus, filterRisk, filterOverdue, page, limit]);

  useEffect(() => {
    Promise.all([api('/api/v1/poams?page=1&limit=50'), api('/api/v1/systems'), api('/api/v1/org-members')])
      .then(([p, s, m]) => {
        setPoams(p.poams || []);
        setTotal(p.total || (p.poams || []).length);
        setSystems(s.systems || []);
        setMembers(m.members || []);
        if (s.systems?.length > 0) setForm((f) => ({ ...f, system_id: s.systems[0].id }));
      }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (!loading) loadPoams(); }, [filterSystem, filterStatus, filterRisk, filterOverdue, page, limit]);
  useEffect(() => { setPage(1); }, [filterSystem, filterStatus, filterRisk, filterOverdue]);

  const loadDetail = (poamId: string) => {
    api(`/api/v1/poams/${poamId}/milestones`).then((d) => setMilestones(d.milestones || [])).catch(() => {});
    api(`/api/v1/poams/${poamId}/comments`).then((d) => setComments(d.comments || [])).catch(() => {});
  };

  const toggleExpand = (p: any) => {
    if (expandedId === p.id) { setExpandedId(null); return; }
    setExpandedId(p.id);
    setEditFields((prev) => ({ ...prev, [p.id]: { weakness_name: p.weakness_name, weakness_description: p.weakness_description || '', risk_level: p.risk_level, scheduled_completion: p.scheduled_completion || '', responsible_party: p.responsible_party || '', assigned_to: p.assigned_to || '', resources_required: p.resources_required || '', cost_estimate: p.cost_estimate || '', vendor_dependency: p.vendor_dependency || 0 } }));
    loadDetail(p.id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api('/api/v1/poams', { method: 'POST', body: JSON.stringify(form) }); setShowCreate(false); loadPoams(); } catch { } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    if (['completed', 'accepted'].includes(status)) {
      const poam = poams.find((p: any) => p.id === id);
      setApprovalTarget({ id, name: poam?.weakness_name || '' });
      setApprovalJustification('');
      setApprovalError(null);
      setShowApprovalModal(true);
      return;
    }
    await api(`/api/v1/poams/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    loadPoams();
  };

  const submitApprovalRequest = async () => {
    if (!approvalTarget || !approvalJustification.trim()) return;
    setRequestingApproval(true);
    setApprovalError(null);
    try {
      await api('/api/v1/approvals', {
        method: 'POST',
        body: JSON.stringify({ request_type: 'poam_closure', resource_id: approvalTarget.id, justification: approvalJustification.trim() }),
      });
      setShowApprovalModal(false);
      setApprovalTarget(null);
    } catch (e: any) {
      setApprovalError(e.message || 'Failed to submit approval request');
    } finally {
      setRequestingApproval(false);
    }
  };

  const saveEdit = async (id: string) => {
    setSavingEdit(id);
    try {
      const fields = editFields[id];
      await api(`/api/v1/poams/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
      loadPoams();
    } catch { } finally { setSavingEdit(''); }
  };

  const deletePoam = async (id: string) => {
    try {
      await api(`/api/v1/poams/${id}`, { method: 'DELETE' }); setExpandedId(null); setConfirmDeleteId(null); loadPoams(); addToast({ type: 'success', title: 'POA&M Deleted' });
    } catch { addToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete POA&M' }); }
  };

  const addMilestone = async (poamId: string) => {
    if (!newMs.title.trim()) return;
    try {
      await api(`/api/v1/poams/${poamId}/milestones`, { method: 'POST', body: JSON.stringify(newMs) });
      setNewMs({ title: '', target_date: '' });
      loadDetail(poamId);
      loadPoams();
    } catch { }
  };

  const updateMilestone = async (poamId: string, msId: string, data: any) => {
    try { await api(`/api/v1/poams/${poamId}/milestones/${msId}`, { method: 'PUT', body: JSON.stringify(data) }); loadDetail(poamId); loadPoams(); } catch { }
  };

  const addComment = async (poamId: string) => {
    if (!newComment.trim()) return;
    try {
      await api(`/api/v1/poams/${poamId}/comments`, { method: 'POST', body: JSON.stringify({ content: newComment }) });
      setNewComment('');
      loadDetail(poamId);
    } catch { }
  };

  const title = isFederal ? 'POA&M Tracker' : nav('poams');

  if (loading) return <div><SkeletonMetricCards /><SkeletonListItem count={5} /></div>;

  return (
    <div>
      <PageHeader title={title} subtitle={`Track ${isFederal ? 'weaknesses, milestones, and remediation' : 'findings and remediation'}`}>
        {canEdit && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90">+ New {t('milestone')}</button>}
      </PageHeader>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="System" name="poam_system" type="select" value={form.system_id} onChange={v => setForm({ ...form, system_id: v })} required className="mb-0">
                {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </FormField>
              <FormField label="Risk Level" name="poam_risk_level" type="select" value={form.risk_level} onChange={v => setForm({ ...form, risk_level: v })} className="mb-0">
                <option value="low">Low Risk</option><option value="moderate">Moderate Risk</option><option value="high">High Risk</option><option value="critical">Critical Risk</option>
              </FormField>
              <FormField label="Assigned To" name="poam_assigned_to" type="select" value={form.assigned_to} onChange={v => setForm({ ...form, assigned_to: v })} className="mb-0">
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </FormField>
            </div>
            <FormField label={`${t('finding')} Name`} name="poam_weakness_name" value={form.weakness_name} onChange={v => setForm({ ...form, weakness_name: v })} required placeholder={`${t('finding')} Name`} />
            <FormField label="Description" name="poam_desc" type="textarea" value={form.weakness_description} onChange={v => setForm({ ...form, weakness_description: v })} rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Scheduled Completion" name="poam_scheduled_completion" type="date" value={form.scheduled_completion} onChange={v => setForm({ ...form, scheduled_completion: v })} className="mb-0" />
              <FormField label="Responsible Party" name="poam_responsible_party" value={form.responsible_party} onChange={v => setForm({ ...form, responsible_party: v })} placeholder="Responsible Party" className="mb-0" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-forge-navy-900 text-white rounded-lg text-sm font-medium hover:bg-forge-navy-800 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={[
          { type: 'select', key: 'system', label: 'All Systems', options: systems.map(s => ({ value: s.id, label: s.name })) },
          { type: 'select', key: 'status', label: 'All Statuses', options: Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })) },
          { type: 'select', key: 'risk', label: 'All Risk Levels', options: [{ value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'moderate', label: 'Moderate' }, { value: 'low', label: 'Low' }] },
          { type: 'toggle', key: 'overdue', label: 'Overdue only' },
        ] as FilterField[]}
        values={{ system: filterSystem, status: filterStatus, risk: filterRisk, overdue: filterOverdue }}
        onChange={(key, val) => {
          if (key === 'system') setFilterSystem(val as string);
          else if (key === 'status') setFilterStatus(val as string);
          else if (key === 'risk') setFilterRisk(val as string);
          else if (key === 'overdue') setFilterOverdue(val as boolean);
        }}
        onClear={() => { setFilterSystem(''); setFilterStatus(''); setFilterRisk(''); setFilterOverdue(false); }}
        resultCount={poams.length}
        resultLabel="items"
        actions={
          <button onClick={() => exportPoamsCSV(poams)} className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            CSV
          </button>
        }
      />

      {/* POA&M List */}
      {poams.length === 0 ? (
        <EmptyState title="No POA&Ms found" subtitle="Create a plan of action to remediate findings" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      ) : (
        <div className="space-y-2">
          {poams.map((p) => {
            const isExpanded = expandedId === p.id;
            const ef = editFields[p.id];
            return (
              <div key={p.id} className={`bg-white rounded-lg border transition-all ${isExpanded ? 'border-forge-navy ring-2 ring-forge-navy/10' : 'border-gray-200'}`}>
                {/* Card Header */}
                <div className="p-4 cursor-pointer" role="button" aria-expanded={isExpanded} tabIndex={0} onClick={() => toggleExpand(p)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(p); } }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="font-mono text-xs text-gray-400">{p.poam_id}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${RISK_COLORS[p.risk_level] || ''}`}>{p.risk_level}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ageColor(p.days_open)}`}>{p.days_open}d open</span>
                        {p.is_overdue && <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-600 text-white">OVERDUE</span>}
                        {p.milestone_total > 0 && (
                          <span className="text-xs text-gray-500">{p.milestone_completed}/{p.milestone_total} milestones</span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm">{p.weakness_name}</h3>
                      {!isExpanded && p.weakness_description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.weakness_description}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                        {p.scheduled_completion && <span>Due: {p.scheduled_completion}</span>}
                        {p.assigned_to_name && <span>Assigned: {p.assigned_to_name}</span>}
                        {p.responsible_party && <span>Owner: {p.responsible_party}</span>}
                        {p.system_name && <span>System: {p.system_name}</span>}
                      </div>
                      {p.milestone_total > 0 && (
                        <div className="mt-2 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(p.milestone_completed / p.milestone_total) * 100}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <select value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)} className={`text-xs px-2 py-1.5 rounded-lg border font-medium ${STATUS_COLORS[p.status] || ''}`}>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-1.5 rounded-lg border font-medium ${STATUS_COLORS[p.status] || ''}`}>{STATUS_LABELS[p.status] || p.status}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Detail View */}
                {isExpanded && ef && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50/50">
                    {/* Workflow Steps */}
                    <div className="flex items-center gap-1 mb-4 flex-wrap">
                      {WORKFLOW_STEPS.map((step, i) => {
                        const idx = WORKFLOW_STEPS.indexOf(p.status);
                        const stepIdx = i;
                        const isCurrent = step === p.status;
                        const isPast = stepIdx < idx;
                        return (
                          <React.Fragment key={step}>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${isCurrent ? 'bg-forge-navy-900 text-white' : isPast ? 'bg-forge-green-100 text-forge-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              {isPast && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              {STATUS_LABELS[step]}
                            </div>
                            {i < WORKFLOW_STEPS.length - 1 && <div className={`w-4 h-0.5 ${stepIdx < idx ? 'bg-forge-green-500' : 'bg-gray-200'}`} />}
                          </React.Fragment>
                        );
                      })}
                      {['accepted', 'deferred'].includes(p.status) && (
                        <div className={`ml-2 px-2 py-1 rounded text-[10px] font-medium ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Edit Fields */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Weakness Name</label>
                          <input type="text" value={ef.weakness_name} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], weakness_name: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" readOnly={!canEdit} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                          <textarea value={ef.weakness_description} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], weakness_description: e.target.value } }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" readOnly={!canEdit} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Risk Level</label>
                            <select value={ef.risk_level} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], risk_level: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" disabled={!canEdit}>
                              <option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                            <input type="date" value={ef.scheduled_completion} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], scheduled_completion: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" readOnly={!canEdit} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned To</label>
                            <select value={ef.assigned_to} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], assigned_to: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" disabled={!canEdit}>
                              <option value="">Unassigned</option>
                              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible Party</label>
                            <input type="text" value={ef.responsible_party} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], responsible_party: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" readOnly={!canEdit} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Resources Required</label>
                            <input type="text" value={ef.resources_required} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], resources_required: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" readOnly={!canEdit} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Cost Estimate ($)</label>
                            <input type="number" value={ef.cost_estimate} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], cost_estimate: parseFloat(e.target.value) || '' } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" readOnly={!canEdit} />
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-2 pt-2">
                            <button onClick={() => saveEdit(p.id)} disabled={savingEdit === p.id} className="px-4 py-2 bg-forge-navy-900 text-white rounded-lg text-sm font-medium hover:bg-forge-navy-800 disabled:opacity-50">
                              {savingEdit === p.id ? 'Saving...' : 'Save Changes'}
                            </button>
                            {canManage && (
                              confirmDeleteId === p.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-600">Delete this POA&M?</span>
                                  <button onClick={() => deletePoam(p.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Yes, Delete</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeleteId(p.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-200">Delete</button>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Milestones + Comments */}
                      <div className="space-y-4">
                        {/* Milestones */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            Milestones ({milestones.length})
                          </h4>
                          {milestones.length > 0 && (
                            <div className="mb-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(milestones.filter((m: any) => m.status === 'completed').length / milestones.length) * 100}%` }} />
                            </div>
                          )}
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {milestones.map((ms: any) => (
                              <div key={ms.id} className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-gray-700 truncate">{ms.title}</span>
                                  {ms.target_date && <span className="text-gray-400 flex-shrink-0">{ms.target_date}</span>}
                                </div>
                                {canEdit ? (
                                  <select value={ms.status} onChange={(e) => updateMilestone(p.id, ms.id, { status: e.target.value })} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${MS_COLORS[ms.status] || ''}`}>
                                    <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
                                  </select>
                                ) : (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${MS_COLORS[ms.status] || ''}`}>{ms.status}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-2 mt-2">
                              <input type="text" placeholder="Milestone title" value={newMs.title} onChange={(e) => setNewMs({ ...newMs, title: e.target.value })} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                              <input type="date" value={newMs.target_date} onChange={(e) => setNewMs({ ...newMs, target_date: e.target.value })} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                              <button onClick={() => addMilestone(p.id)} className="px-2.5 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800">Add</button>
                            </div>
                          )}
                        </div>

                        {/* Comments */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Comments ({comments.length})
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {comments.length === 0 && <p className="text-xs text-gray-400">No comments yet.</p>}
                            {comments.map((c: any) => (
                              <div key={c.id} className="py-2 px-2 bg-white rounded border border-gray-100">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-medium text-gray-800">{c.author_name || 'Unknown'}</span>
                                  <span className="text-[10px] text-gray-400">{relativeTime(c.created_at)}</span>
                                </div>
                                <p className="text-xs text-gray-600">{c.content}</p>
                              </div>
                            ))}
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-2 mt-2">
                              <input type="text" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment(p.id)} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                              <button onClick={() => addComment(p.id)} className="px-2.5 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800">Post</button>
                            </div>
                          )}
                        </div>

                        {/* Activity Timeline */}
                        <ActivityTimeline resourceType="poam" resourceId={p.id} />
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
      {/* Approval Request Modal */}
      {showApprovalModal && approvalTarget && (
        <div className={MODALS.backdrop}>
          <div className={`${MODALS.container} max-w-md`} role="dialog" aria-modal="true" aria-labelledby="poam-approval-modal-title">
            <div className={MODALS.body}>
              <h2 id="poam-approval-modal-title" className={`${TYPOGRAPHY.modalTitle} mb-1`}>Request Approval</h2>
              <p className={`${TYPOGRAPHY.bodyMuted} mb-4`}>Closing a POA&M requires manager approval.</p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className={TYPOGRAPHY.body}>{approvalTarget.name}</p>
              </div>
              <label className={FORMS.label}>Justification (required)</label>
              <textarea
                value={approvalJustification}
                onChange={(e) => setApprovalJustification(e.target.value)}
                className={FORMS.textarea}
                rows={3}
                placeholder="Explain why this POA&M should be closed..."
              />
              {approvalError && <p className={FORMS.errorText}>{approvalError}</p>}
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => { setShowApprovalModal(false); setApprovalTarget(null); }} className={BUTTONS.ghost} disabled={requestingApproval}>Cancel</button>
              <button
                onClick={submitApprovalRequest}
                disabled={requestingApproval || !approvalJustification.trim()}
                className={BUTTONS.primary}
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
