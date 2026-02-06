import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { exportPoliciesCSV } from '../utils/exportHelpers';
import { TYPOGRAPHY, BADGES, STATUS_BADGE_COLORS, BUTTONS, FORMS, CARDS, MODALS } from '../utils/typography';

interface Policy {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: string | null;
  status: string;
  version: string;
  effective_date: string | null;
  review_date: string | null;
  owner_id: string | null;
  owner_name: string | null;
  created_by: string;
  created_by_name: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface Attestation {
  id: string;
  policy_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  policy_version: string;
  status: string;
  attested_at: string | null;
  requested_at: string;
  due_date: string | null;
  requested_by_name: string | null;
}

interface ControlLink {
  link_id: string;
  implementation_id: string;
  status: string;
  control_id: string;
  control_title: string;
  family: string;
  framework_name: string;
  system_name: string;
  linked_at: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  security: { label: 'Security', color: 'bg-blue-100 text-blue-700' },
  privacy: { label: 'Privacy', color: 'bg-purple-100 text-purple-700' },
  acceptable_use: { label: 'Acceptable Use', color: 'bg-green-100 text-green-700' },
  incident_response: { label: 'Incident Response', color: 'bg-red-100 text-red-700' },
  access_control: { label: 'Access Control', color: 'bg-yellow-100 text-yellow-700' },
  business_continuity: { label: 'Business Continuity', color: 'bg-orange-100 text-orange-700' },
  data_management: { label: 'Data Management', color: 'bg-teal-100 text-teal-700' },
  custom: { label: 'Custom', color: 'bg-gray-100 text-gray-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-700' },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-800' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700' },
};

const ROLE_HIERARCHY: Record<string, number> = { viewer: 0, analyst: 1, manager: 2, admin: 3, owner: 4 };

function requireRole(userRole: string, minRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 99);
}

export function PoliciesPage() {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'viewer';
  const { addToast } = useToast();

  // List view state
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  // Detail view state
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'attestations' | 'controls'>('content');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', category: 'security', description: '', content: '', review_date: '' });

  // Create modal
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', category: 'security', description: '', review_date: '' });
  const [saving, setSaving] = useState(false);

  // Attestations
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [attestTotal, setAttestTotal] = useState(0);
  const [attestAttested, setAttestAttested] = useState(0);
  const [showAttestModal, setShowAttestModal] = useState(false);
  const [attestRole, setAttestRole] = useState('viewer');
  const [attestDueDate, setAttestDueDate] = useState('');

  // Controls
  const [linkedControls, setLinkedControls] = useState<ControlLink[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableImpls, setAvailableImpls] = useState<any[]>([]);
  const [linkImplId, setLinkImplId] = useState('');

  // Version modal
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionSummary, setVersionSummary] = useState('');

  // Status modal
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [approvalJustification, setApprovalJustification] = useState('');

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (search) params.set('search', search);
      const data = await api<any>(`/api/v1/policies?${params}`);
      setPolicies(data.policies || []);
      setTotal(data.total || 0);
    } catch { setPolicies([]); }
    setLoading(false);
  }, [page, statusFilter, categoryFilter, search]);

  useEffect(() => { loadPolicies(); }, [loadPolicies]);

  const loadPolicyDetail = async (id: string) => {
    const data = await api<any>(`/api/v1/policies/${id}`);
    setActivePolicy(data.policy);
    return data.policy;
  };

  const loadAttestations = async (id: string) => {
    try {
      const data = await api<any>(`/api/v1/policies/${id}/attestations`);
      setAttestations(data.attestations || []);
      setAttestTotal(data.total || 0);
      setAttestAttested(data.attested || 0);
    } catch { setAttestations([]); }
  };

  const loadControls = async (id: string) => {
    try {
      const data = await api<any>(`/api/v1/policies/${id}/controls`);
      setLinkedControls(data.controls || []);
    } catch { setLinkedControls([]); }
  };

  const openDetail = async (policy: Policy) => {
    const p = await loadPolicyDetail(policy.id);
    setView('detail');
    setActiveTab('content');
    setEditing(false);
    loadAttestations(policy.id);
    loadControls(policy.id);
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    setSaving(true);
    try {
      await api('/api/v1/policies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) });
      setShowCreate(false);
      setCreateForm({ title: '', category: 'security', description: '', review_date: '' });
      loadPolicies();
    } catch {}
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!activePolicy) return;
    setSaving(true);
    try {
      const data = await api<any>(`/api/v1/policies/${activePolicy.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setActivePolicy(data.policy);
      setEditing(false);
    } catch {}
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activePolicy) return;
    setSaving(true);
    try {
      const data = await api<any>(`/api/v1/policies/${activePolicy.id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setActivePolicy(data.policy);
      setStatusAction(null);
    } catch {}
    setSaving(false);
  };

  const handleRequestPublication = async () => {
    if (!activePolicy) return;
    setSaving(true);
    try {
      await api('/api/v1/approvals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_type: 'policy_publication', resource_id: activePolicy.id, justification: approvalJustification }),
      });
      setStatusAction(null);
      setApprovalJustification('');
      loadPolicyDetail(activePolicy.id);
    } catch {}
    setSaving(false);
  };

  const handleCreateVersion = async () => {
    if (!activePolicy) return;
    setSaving(true);
    try {
      const data = await api<any>(`/api/v1/policies/${activePolicy.id}/versions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: versionSummary }),
      });
      setActivePolicy(data.policy);
      setShowVersionModal(false);
      setVersionSummary('');
    } catch {}
    setSaving(false);
  };

  const handleRequestAttestations = async () => {
    if (!activePolicy) return;
    setSaving(true);
    try {
      await api(`/api/v1/policies/${activePolicy.id}/attestations/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: attestRole, due_date: attestDueDate || undefined }),
      });
      setShowAttestModal(false);
      loadAttestations(activePolicy.id);
    } catch {}
    setSaving(false);
  };

  const handleAttest = async () => {
    if (!activePolicy) return;
    setSaving(true);
    try {
      await api(`/api/v1/policies/${activePolicy.id}/attest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      loadAttestations(activePolicy.id);
    } catch {}
    setSaving(false);
  };

  const handleLinkControl = async () => {
    if (!activePolicy || !linkImplId) return;
    await api('/api/v1/policies/link-control', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy_id: activePolicy.id, implementation_id: linkImplId }),
    });
    setShowLinkModal(false);
    setLinkImplId('');
    loadControls(activePolicy.id);
  };

  const handleUnlinkControl = async (implId: string) => {
    if (!activePolicy) return;
    await api('/api/v1/policies/unlink-control', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy_id: activePolicy.id, implementation_id: implId }),
    });
    loadControls(activePolicy.id);
  };

  const handleDelete = async () => {
    if (!activePolicy) return;
    try {
      await api(`/api/v1/policies/${activePolicy.id}`, { method: 'DELETE' });
      setView('list'); setConfirmDelete(false); loadPolicies(); addToast({ type: 'success', title: 'Policy Deleted' });
    } catch { addToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete policy' }); }
  };

  const openLinkModal = async () => {
    try {
      const data = await api<any>('/api/v1/implementations?limit=200');
      setAvailableImpls(data.implementations || []);
    } catch { setAvailableImpls([]); }
    setShowLinkModal(true);
  };

  const startEditing = () => {
    if (!activePolicy) return;
    setEditForm({
      title: activePolicy.title,
      category: activePolicy.category,
      description: activePolicy.description || '',
      content: activePolicy.content || '',
      review_date: activePolicy.review_date || '',
    });
    setEditing(true);
  };

  const myPendingAttestation = attestations.find(a => a.user_id === (user as any)?.id && a.status === 'pending');
  const versions = activePolicy?.metadata?.versions || [];

  // ── List View ──
  if (view === 'list') {
    return (
      <div className="space-y-6">
        <PageHeader title="Policy & Procedure Library" subtitle={`${total} ${total === 1 ? 'policy' : 'policies'}`}>
          <button onClick={() => exportPoliciesCSV(policies)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            CSV
          </button>
          {requireRole(userRole, 'analyst') && (
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-white/90 text-sm font-medium">
              + New Policy
            </button>
          )}
        </PageHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search policies..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm w-64" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div><SkeletonListItem count={5} /></div>
        ) : policies.length === 0 ? (
          <EmptyState title="No policies found" subtitle="Upload or create compliance policies" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Title</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Category</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Status</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Version</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Owner</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Review Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {policies.map(p => {
                  const cat = CATEGORY_CONFIG[p.category] || CATEGORY_CONFIG.custom;
                  const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
                  const reviewSoon = p.review_date && p.status === 'published' && new Date(p.review_date) <= new Date(Date.now() + 30 * 86400000);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(p)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.title}</p>
                        {p.description && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{p.description}</p>}
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span></td>
                      <td className="px-4 py-3 text-gray-600">v{p.version}</td>
                      <td className="px-4 py-3 text-gray-600">{p.owner_name || '—'}</td>
                      <td className="px-4 py-3">
                        {p.review_date ? (
                          <span className={reviewSoon ? 'text-amber-600 font-medium' : 'text-gray-600'}>{p.review_date}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {total > 50 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 50)}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Prev</button>
                  <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="create-policy-modal-title" onClick={e => e.stopPropagation()}>
              <h2 id="create-policy-modal-title" className="text-lg font-semibold mb-4">Create New Policy</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., Information Security Policy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
                  <input type="date" value={createForm.review_date} onChange={e => setCreateForm(f => ({ ...f, review_date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className={BUTTONS.secondary}>Cancel</button>
                <button onClick={handleCreate} disabled={!createForm.title.trim() || saving} className={BUTTONS.primary}>
                  {saving ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Detail View ──
  if (!activePolicy) return null;
  const st = STATUS_CONFIG[activePolicy.status] || STATUS_CONFIG.draft;
  const cat = CATEGORY_CONFIG[activePolicy.category] || CATEGORY_CONFIG.custom;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => { setView('list'); loadPolicies(); }} className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Policies
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{activePolicy.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
            <span className="text-xs text-gray-500">v{activePolicy.version}</span>
            {activePolicy.owner_name && <span className="text-xs text-gray-500">Owner: {activePolicy.owner_name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {/* Status actions */}
          {activePolicy.status === 'draft' && requireRole(userRole, 'manager') && (
            <button onClick={() => handleStatusChange('in_review')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Submit for Review</button>
          )}
          {activePolicy.status === 'in_review' && requireRole(userRole, 'admin') && (
            <button onClick={() => handleStatusChange('approved')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Approve</button>
          )}
          {activePolicy.status === 'in_review' && requireRole(userRole, 'manager') && (
            <button onClick={() => handleStatusChange('draft')} className="px-3 py-1.5 border rounded-lg text-sm">Return to Draft</button>
          )}
          {activePolicy.status === 'approved' && requireRole(userRole, 'manager') && (
            <button onClick={() => setStatusAction('publish')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Request Publication</button>
          )}
          {['published', 'expired'].includes(activePolicy.status) && requireRole(userRole, 'analyst') && (
            <button onClick={() => setShowVersionModal(true)} className="px-3 py-1.5 border rounded-lg text-sm">New Version</button>
          )}
          {activePolicy.status === 'published' && requireRole(userRole, 'admin') && (
            <button onClick={() => handleStatusChange('archived')} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600">Archive</button>
          )}
          {['draft', 'archived'].includes(activePolicy.status) && requireRole(userRole, 'admin') && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Delete this policy?</span>
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Yes, Delete</button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">Delete</button>
            )
          )}
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-white rounded-lg border px-4 py-3">
        {activePolicy.effective_date && <span>Effective: <strong>{activePolicy.effective_date}</strong></span>}
        {activePolicy.review_date && (
          <span className={activePolicy.status === 'published' && new Date(activePolicy.review_date) <= new Date(Date.now() + 30 * 86400000) ? 'text-amber-600 font-medium' : ''}>
            Review: <strong>{activePolicy.review_date}</strong>
          </span>
        )}
        <span>Created: {new Date(activePolicy.created_at + 'Z').toLocaleDateString()}</span>
        <span>Updated: {new Date(activePolicy.updated_at + 'Z').toLocaleDateString()}</span>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-1" role="tablist">
        {(['content', 'attestations', 'controls'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'content' ? 'Content' : tab === 'attestations' ? `Attestations (${attestTotal})` : `Controls (${linkedControls.length})`}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-xl border">
          {editing ? (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
                  <input type="date" value={editForm.review_date} onChange={e => setEditForm(f => ({ ...f, review_date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Content</label>
                <textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={20} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(false)} className={BUTTONS.secondary}>Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving} className={BUTTONS.primary}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {activePolicy.description && <p className="text-gray-600 text-sm mb-4">{activePolicy.description}</p>}
                </div>
                {activePolicy.status !== 'published' && requireRole(userRole, 'analyst') && (
                  <button onClick={startEditing} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">Edit</button>
                )}
              </div>
              {activePolicy.content ? (
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 border-t pt-4">{activePolicy.content}</div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>No content yet.</p>
                  {requireRole(userRole, 'analyst') && activePolicy.status !== 'published' && (
                    <button onClick={startEditing} className="mt-2 text-blue-600 text-sm hover:underline">Add content</button>
                  )}
                </div>
              )}
              {/* Version History */}
              {versions.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Version History</h3>
                  <div className="space-y-2">
                    {versions.slice().reverse().map((v: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">v{v.version}</span>
                        <span className="text-gray-600">{v.summary}</span>
                        <span className="text-gray-400 text-xs">{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Attestations Tab */}
      {activeTab === 'attestations' && (
        <div className="space-y-4">
          {/* Progress bar */}
          {attestTotal > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Attestation Progress</span>
                <span className="text-sm text-gray-500">{attestAttested} / {attestTotal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${attestTotal > 0 ? (attestAttested / attestTotal) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* My attestation banner */}
          {myPendingAttestation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">You have a pending attestation for this policy</p>
                {myPendingAttestation.due_date && <p className="text-xs text-amber-600">Due: {myPendingAttestation.due_date}</p>}
              </div>
              <button onClick={handleAttest} disabled={saving} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
                Acknowledge Policy
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Attestation Records</h3>
            {activePolicy.status === 'published' && requireRole(userRole, 'manager') && (
              <button onClick={() => setShowAttestModal(true)} className={`${BUTTONS.sm} ${BUTTONS.primary}`}>
                Request Attestations
              </button>
            )}
          </div>

          {/* Table */}
          {attestations.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-400 text-sm">No attestation records yet</div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>User</th>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Role</th>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Version</th>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Status</th>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Due Date</th>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Attested</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attestations.map(a => (
                    <tr key={a.id}>
                      <td className="px-4 py-3">{a.user_name}</td>
                      <td className="px-4 py-3 capitalize text-gray-500">{a.user_role}</td>
                      <td className="px-4 py-3 text-gray-500">v{a.policy_version}</td>
                      <td className="px-4 py-3">
                        <span className={`${BADGES.pill} ${a.status === 'attested' ? STATUS_BADGE_COLORS.completed : a.status === 'overdue' ? STATUS_BADGE_COLORS.overdue : STATUS_BADGE_COLORS.pending}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.due_date || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{a.attested_at ? new Date(a.attested_at + 'Z').toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Controls Tab */}
      {activeTab === 'controls' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Linked Controls ({linkedControls.length})</h3>
            {requireRole(userRole, 'analyst') && (
              <button onClick={openLinkModal} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Link Control</button>
            )}
          </div>
          {linkedControls.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-400 text-sm">No controls linked to this policy</div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Control</th>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Framework</th>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>System</th>
                    <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {linkedControls.map(c => (
                    <tr key={c.link_id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{c.control_id}</p>
                        <p className="text-xs text-gray-500">{c.control_title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.framework_name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.system_name}</td>
                      <td className="px-4 py-3">
                        <span className={`${BADGES.pill} ${c.status === 'implemented' ? STATUS_BADGE_COLORS.implemented : c.status === 'partially_implemented' ? STATUS_BADGE_COLORS.partially_implemented : BADGES.neutral}`}>
                          {c.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {requireRole(userRole, 'analyst') && (
                          <button onClick={() => handleUnlinkControl(c.implementation_id)} className="text-xs text-red-500 hover:text-red-700">Unlink</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Publication Request Modal */}
      {statusAction === 'publish' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setStatusAction(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="publication-modal-title" onClick={e => e.stopPropagation()}>
            <h2 id="publication-modal-title" className="text-lg font-semibold mb-4">Request Publication Approval</h2>
            <p className="text-sm text-gray-600 mb-4">This will create an approval request for an admin to review and publish the policy.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Justification *</label>
              <textarea value={approvalJustification} onChange={e => setApprovalJustification(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="Why should this policy be published?" />
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setStatusAction(null)} className={BUTTONS.secondary}>Cancel</button>
              <button onClick={handleRequestPublication} disabled={!approvalJustification.trim() || saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowVersionModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="version-modal-title" onClick={e => e.stopPropagation()}>
            <h2 id="version-modal-title" className="text-lg font-semibold mb-4">Create New Version</h2>
            <p className="text-sm text-gray-600 mb-4">This will create v{(parseFloat(activePolicy.version) + 0.1).toFixed(1)} and reset the policy to draft status for editing.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version Summary</label>
              <input type="text" value={versionSummary} onChange={e => setVersionSummary(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="What changed in this version?" />
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setShowVersionModal(false)} className={BUTTONS.secondary}>Cancel</button>
              <button onClick={handleCreateVersion} disabled={saving} className={BUTTONS.primary}>
                {saving ? 'Creating...' : 'Create Version'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Attestations Modal */}
      {showAttestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAttestModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="attest-modal-title" onClick={e => e.stopPropagation()}>
            <h2 id="attest-modal-title" className="text-lg font-semibold mb-4">Request Attestations</h2>
            <p className="text-sm text-gray-600 mb-4">All users at or above the selected role will receive an attestation request.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Role</label>
                <select value={attestRole} onChange={e => setAttestRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="viewer">Viewer (all users)</option>
                  <option value="analyst">Analyst+</option>
                  <option value="manager">Manager+</option>
                  <option value="admin">Admin+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                <input type="date" value={attestDueDate} onChange={e => setAttestDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setShowAttestModal(false)} className={BUTTONS.secondary}>Cancel</button>
              <button onClick={handleRequestAttestations} disabled={saving} className={BUTTONS.primary}>
                {saving ? 'Sending...' : 'Send Requests'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Control Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="link-control-modal-title" onClick={e => e.stopPropagation()}>
            <h2 id="link-control-modal-title" className="text-lg font-semibold mb-4">Link Control Implementation</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Implementation</label>
              <select value={linkImplId} onChange={e => setLinkImplId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Choose...</option>
                {availableImpls.map((impl: any) => (
                  <option key={impl.id} value={impl.id}>{impl.control_id} — {impl.control_title} ({impl.system_name})</option>
                ))}
              </select>
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setShowLinkModal(false)} className={BUTTONS.secondary}>Cancel</button>
              <button onClick={handleLinkControl} disabled={!linkImplId} className={BUTTONS.primary}>Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
