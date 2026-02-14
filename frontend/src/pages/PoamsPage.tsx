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
const MS_COLORS: Record<string, string> = { pending: 'bg-gray-100 text-gray-600', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', delayed: 'bg-orange-100 text-orange-700', blocked: 'bg-red-100 text-red-700' };
const LINK_REASON_COLORS: Record<string, string> = { vulnerable: 'bg-red-100 text-red-700', impacted: 'bg-orange-100 text-orange-700', affected: 'bg-yellow-100 text-yellow-700', at_risk: 'bg-blue-100 text-blue-700', remediated: 'bg-green-100 text-green-700' };
const MAPPING_TYPE_COLORS: Record<string, string> = { primary: 'bg-blue-100 text-blue-700', related: 'bg-gray-100 text-gray-600', inherited: 'bg-purple-100 text-purple-700' };
const PURPOSE_COLORS: Record<string, string> = { identification: 'bg-red-100 text-red-700', remediation: 'bg-yellow-100 text-yellow-700', closure: 'bg-green-100 text-green-700', verification: 'bg-blue-100 text-blue-700', deviation: 'bg-purple-100 text-purple-700' };
// Data Classification & CUI (CMMC/NIST)
const DATA_CLASS_LABELS: Record<string, string> = { public: 'Public', internal: 'Internal', confidential: 'Confidential', cui: 'CUI', classified: 'Classified' };
const DATA_CLASS_COLORS: Record<string, string> = { public: 'bg-gray-100 text-gray-600', internal: 'bg-blue-100 text-blue-700', confidential: 'bg-yellow-100 text-yellow-700', cui: 'bg-orange-100 text-orange-700', classified: 'bg-red-100 text-red-700' };
// Deviation Types (FedRAMP AO)
const DEVIATION_LABELS: Record<string, string> = { operational_requirement: 'Operational Requirement', false_positive: 'False Positive', risk_accepted: 'Risk Accepted', vendor_dependency: 'Vendor Dependency', compensating_control: 'Compensating Control' };
const DEVIATION_COLORS: Record<string, string> = { operational_requirement: 'bg-blue-100 text-blue-700', false_positive: 'bg-gray-100 text-gray-600', risk_accepted: 'bg-yellow-100 text-yellow-700', vendor_dependency: 'bg-purple-100 text-purple-700', compensating_control: 'bg-green-100 text-green-700' };
const REVIEW_FREQ_LABELS: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly', semi_annual: 'Semi-Annual', annual: 'Annual' };

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

  // Junction table data (FedRAMP compliance)
  const [linkedAssets, setLinkedAssets] = useState<any[]>([]);
  const [linkedControls, setLinkedControls] = useState<any[]>([]);
  const [linkedEvidence, setLinkedEvidence] = useState<any[]>([]);
  const [linkedFindings, setLinkedFindings] = useState<any[]>([]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [availableEvidence, setAvailableEvidence] = useState<any[]>([]);
  const [availableFindings, setAvailableFindings] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [deviationHistory, setDeviationHistory] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Bulk selection state
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>([]);
  const [bulkLinking, setBulkLinking] = useState(false);

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
    // Junction table data (FedRAMP)
    api(`/api/v1/poams/${poamId}/affected-assets`).then((d) => setLinkedAssets(d.assets || [])).catch(() => {});
    api(`/api/v1/poams/${poamId}/control-mappings`).then((d) => setLinkedControls(d.controls || [])).catch(() => {});
    api(`/api/v1/poams/${poamId}/evidence`).then((d) => setLinkedEvidence(d.evidence || [])).catch(() => {});
    api(`/api/v1/poams/${poamId}/findings`).then((d) => setLinkedFindings(d.findings || [])).catch(() => {});
    // Deviation history (CMMC/FedRAMP AO)
    api(`/api/v1/poams/${poamId}/deviation-history`).then((d) => setDeviationHistory(d.history || [])).catch(() => {});
    // Clear bulk selections when switching POA&Ms
    setSelectedAssetIds([]);
    setSelectedFindingIds([]);
  };

  // Load available assets/evidence/frameworks/risks/findings for linking
  useEffect(() => {
    api('/api/v1/assets?limit=500').then((d) => setAvailableAssets(d.assets || [])).catch(() => {});
    api('/api/v1/evidence?limit=500').then((d) => setAvailableEvidence(d.evidence || [])).catch(() => {});
    api('/api/v1/frameworks').then((d) => setFrameworks(d.frameworks || [])).catch(() => {});
    api('/api/v1/risks?limit=500').then((d) => setRisks(d.risks || [])).catch(() => {});
    api('/api/v1/vendors?limit=500').then((d) => setVendors(d.vendors || [])).catch(() => {});
    api('/api/v1/vulnerability-findings?limit=500').then((d) => setAvailableFindings(d.findings || [])).catch(() => {});
  }, []);

  const toggleExpand = (p: any) => {
    if (expandedId === p.id) { setExpandedId(null); return; }
    setExpandedId(p.id);
    setEditFields((prev) => ({ ...prev, [p.id]: {
      weakness_name: p.weakness_name, weakness_description: p.weakness_description || '', risk_level: p.risk_level,
      scheduled_completion: p.scheduled_completion || '', responsible_party: p.responsible_party || '',
      assigned_to: p.assigned_to || '', resources_required: p.resources_required || '',
      cost_estimate: p.cost_estimate || '', vendor_dependency: p.vendor_dependency || 0,
      // Data Sensitivity (CMMC)
      data_classification: p.data_classification || 'internal', cui_category: p.cui_category || '',
      risk_register_id: p.risk_register_id || '', impact_confidentiality: p.impact_confidentiality || '',
      impact_integrity: p.impact_integrity || '', impact_availability: p.impact_availability || '',
      // Deviation Tracking (FedRAMP AO)
      deviation_type: p.deviation_type || '', deviation_rationale: p.deviation_rationale || '',
      deviation_expires_at: p.deviation_expires_at || '', deviation_review_frequency: p.deviation_review_frequency || '',
      deviation_next_review: p.deviation_next_review || '', compensating_control_description: p.compensating_control_description || '',
      // VendorGuard Linkage
      vendor_id: p.vendor_id || '', vendor_dependency_notes: p.vendor_dependency_notes || '',
      // OSCAL Metadata
      oscal_uuid: p.oscal_uuid || '', oscal_poam_item_id: p.oscal_poam_item_id || '',
      related_observations: p.related_observations || '[]', related_risks: p.related_risks || '[]'
    } }));
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
      addToast({ type: 'success', title: 'POA&M Saved', message: 'Changes saved successfully' });
      loadPoams();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Save Failed', message: e.message || 'Could not save POA&M changes' });
    } finally { setSavingEdit(''); }
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

  // Junction table operations (FedRAMP compliance)
  const [linkingAsset, setLinkingAsset] = useState({ poamId: '', assetId: '', reason: 'affected' });
  const [linkingControl, setLinkingControl] = useState({ poamId: '', frameworkId: '', controlId: '', type: 'primary' });
  const [linkingEvidence, setLinkingEvidence] = useState({ poamId: '', evidenceId: '', purpose: 'closure' });

  const linkAsset = async (poamId: string) => {
    if (!linkingAsset.assetId) return;
    try {
      await api(`/api/v1/poams/${poamId}/affected-assets`, { method: 'POST', body: JSON.stringify({ asset_id: linkingAsset.assetId, link_reason: linkingAsset.reason }) });
      setLinkingAsset({ poamId: '', assetId: '', reason: 'affected' });
      loadDetail(poamId);
      loadPoams();
      addToast({ type: 'success', title: 'Asset Linked' });
    } catch (e: any) { addToast({ type: 'error', title: 'Link Failed', message: e.message }); }
  };

  const unlinkAsset = async (poamId: string, linkId: string) => {
    try {
      await api(`/api/v1/poams/${poamId}/affected-assets/${linkId}`, { method: 'DELETE' });
      loadDetail(poamId);
      loadPoams();
    } catch { }
  };

  const linkControl = async (poamId: string) => {
    if (!linkingControl.frameworkId || !linkingControl.controlId) return;
    try {
      await api(`/api/v1/poams/${poamId}/control-mappings`, { method: 'POST', body: JSON.stringify({ framework_id: linkingControl.frameworkId, control_id: linkingControl.controlId, mapping_type: linkingControl.type }) });
      setLinkingControl({ poamId: '', frameworkId: '', controlId: '', type: 'primary' });
      loadDetail(poamId);
      loadPoams();
      addToast({ type: 'success', title: 'Control Mapped' });
    } catch (e: any) { addToast({ type: 'error', title: 'Mapping Failed', message: e.message }); }
  };

  const unlinkControl = async (poamId: string, linkId: string) => {
    try {
      await api(`/api/v1/poams/${poamId}/control-mappings/${linkId}`, { method: 'DELETE' });
      loadDetail(poamId);
      loadPoams();
    } catch { }
  };

  const linkEvidence = async (poamId: string) => {
    if (!linkingEvidence.evidenceId) return;
    try {
      await api(`/api/v1/poams/${poamId}/evidence`, { method: 'POST', body: JSON.stringify({ evidence_id: linkingEvidence.evidenceId, purpose: linkingEvidence.purpose }) });
      setLinkingEvidence({ poamId: '', evidenceId: '', purpose: 'closure' });
      loadDetail(poamId);
      loadPoams();
      addToast({ type: 'success', title: 'Evidence Linked' });
    } catch (e: any) { addToast({ type: 'error', title: 'Link Failed', message: e.message }); }
  };

  const unlinkEvidence = async (poamId: string, linkId: string) => {
    try {
      await api(`/api/v1/poams/${poamId}/evidence/${linkId}`, { method: 'DELETE' });
      loadDetail(poamId);
      loadPoams();
    } catch { }
  };

  // Bulk asset linking
  const bulkLinkAssets = async (poamId: string) => {
    if (selectedAssetIds.length === 0) return;
    setBulkLinking(true);
    try {
      const result = await api(`/api/v1/poams/${poamId}/affected-assets/bulk`, {
        method: 'POST',
        body: JSON.stringify({ asset_ids: selectedAssetIds, link_reason: 'affected' })
      });
      setSelectedAssetIds([]);
      loadDetail(poamId);
      loadPoams();
      if (result.linked > 0) {
        addToast({ type: 'success', title: 'Assets Linked', message: `Successfully linked ${result.linked} asset(s)` });
      } else if (result.skipped > 0) {
        addToast({ type: 'info', title: 'Already Linked', message: `All ${result.skipped} selected asset(s) were already linked to this POA&M` });
      }
    } catch (e: any) { addToast({ type: 'error', title: 'Bulk Link Failed', message: e.message }); }
    finally { setBulkLinking(false); }
  };

  // Finding linking
  const linkFinding = async (poamId: string, findingId: string) => {
    try {
      await api(`/api/v1/poams/${poamId}/findings`, { method: 'POST', body: JSON.stringify({ finding_id: findingId, link_reason: 'related' }) });
      loadDetail(poamId);
      addToast({ type: 'success', title: 'Finding Linked' });
    } catch (e: any) { addToast({ type: 'error', title: 'Link Failed', message: e.message }); }
  };

  const unlinkFinding = async (poamId: string, linkId: string) => {
    try {
      await api(`/api/v1/poams/${poamId}/findings/${linkId}`, { method: 'DELETE' });
      loadDetail(poamId);
    } catch { }
  };

  const bulkLinkFindings = async (poamId: string) => {
    if (selectedFindingIds.length === 0) return;
    setBulkLinking(true);
    let linked = 0;
    for (const findingId of selectedFindingIds) {
      try {
        await api(`/api/v1/poams/${poamId}/findings`, { method: 'POST', body: JSON.stringify({ finding_id: findingId, link_reason: 'related' }) });
        linked++;
      } catch { }
    }
    setSelectedFindingIds([]);
    loadDetail(poamId);
    addToast({ type: 'success', title: 'Findings Linked', message: `Linked ${linked} finding(s)` });
    setBulkLinking(false);
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
                        {p.asset_count > 0 && p.control_count > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">FedRAMP Ready</span>
                        )}
                        {p.data_classification && p.data_classification !== 'internal' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DATA_CLASS_COLORS[p.data_classification] || ''}`}>{DATA_CLASS_LABELS[p.data_classification]}</span>
                        )}
                        {p.deviation_type && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DEVIATION_COLORS[p.deviation_type] || ''}`}>
                            {p.deviation_approved_by ? '✓ ' : ''}{DEVIATION_LABELS[p.deviation_type]?.split(' ')[0]}
                          </span>
                        )}
                        {p.vendor_name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700">
                            🏢 {p.vendor_name}
                          </span>
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

                        {/* Data Sensitivity (CMMC/NIST) */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Data Sensitivity {p.data_classification === 'cui' && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded font-medium">CUI</span>}
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Data Classification</label>
                              <select value={ef.data_classification || 'internal'} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], data_classification: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" disabled={!canEdit}>
                                <option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="cui">CUI</option><option value="classified">Classified</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">CUI Category</label>
                              <input type="text" placeholder="e.g., CTI, ITAR" value={ef.cui_category || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], cui_category: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" readOnly={!canEdit} />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Confidentiality Impact</label>
                              <select value={ef.impact_confidentiality || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], impact_confidentiality: e.target.value } }))} className="w-full px-2 py-1 border border-gray-300 rounded text-[10px]" disabled={!canEdit}>
                                <option value="">—</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Integrity Impact</label>
                              <select value={ef.impact_integrity || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], impact_integrity: e.target.value } }))} className="w-full px-2 py-1 border border-gray-300 rounded text-[10px]" disabled={!canEdit}>
                                <option value="">—</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Availability Impact</label>
                              <select value={ef.impact_availability || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], impact_availability: e.target.value } }))} className="w-full px-2 py-1 border border-gray-300 rounded text-[10px]" disabled={!canEdit}>
                                <option value="">—</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="block text-[10px] text-gray-500 mb-0.5">Linked Risk Register Entry</label>
                            <select value={ef.risk_register_id || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], risk_register_id: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" disabled={!canEdit}>
                              <option value="">None</option>
                              {risks.map((r: any) => <option key={r.id} value={r.id}>{r.title}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Deviation/Risk Acceptance (FedRAMP AO) */}
                        {(p.status === 'deferred' || p.status === 'accepted' || p.deviation_type) && (
                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              Risk Deviation
                              {p.deviation_approved_by && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium">Approved</span>}
                              {!p.deviation_approved_by && p.deviation_type && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded font-medium">Pending Approval</span>}
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">Deviation Type</label>
                                <select value={ef.deviation_type || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], deviation_type: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" disabled={!canEdit}>
                                  <option value="">Select type...</option>
                                  {Object.entries(DEVIATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">Review Frequency</label>
                                <select value={ef.deviation_review_frequency || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], deviation_review_frequency: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" disabled={!canEdit}>
                                  <option value="">None</option>
                                  {Object.entries(REVIEW_FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">Expires At</label>
                                <input type="date" value={ef.deviation_expires_at || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], deviation_expires_at: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" readOnly={!canEdit} />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">Next Review</label>
                                <input type="date" value={ef.deviation_next_review || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], deviation_next_review: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" readOnly={!canEdit} />
                              </div>
                            </div>
                            <div className="mt-2">
                              <label className="block text-[10px] text-gray-500 mb-0.5">Deviation Rationale</label>
                              <textarea value={ef.deviation_rationale || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], deviation_rationale: e.target.value } }))} rows={2} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" placeholder="Explain why this deviation is justified..." readOnly={!canEdit} />
                            </div>
                            {ef.deviation_type === 'compensating_control' && (
                              <div className="mt-2">
                                <label className="block text-[10px] text-gray-500 mb-0.5">Compensating Control Description</label>
                                <textarea value={ef.compensating_control_description || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], compensating_control_description: e.target.value } }))} rows={2} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" placeholder="Describe the compensating control..." readOnly={!canEdit} />
                              </div>
                            )}
                            {/* Deviation History */}
                            {deviationHistory.length > 0 && (
                              <div className="mt-3 border-t border-gray-100 pt-2">
                                <label className="block text-[10px] text-gray-500 mb-1">Deviation History</label>
                                <div className="max-h-24 overflow-y-auto space-y-1">
                                  {deviationHistory.map((h: any) => (
                                    <div key={h.id} className="flex items-center justify-between text-[10px] text-gray-600 px-2 py-1 bg-gray-50 rounded">
                                      <span className={`px-1 py-0.5 rounded font-medium ${h.action === 'approved' ? 'bg-green-100 text-green-700' : h.action === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{h.action}</span>
                                      <span>{h.performed_by_name}</span>
                                      <span>{new Date(h.performed_at).toLocaleDateString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* VendorGuard Vendor Linkage (FedRAMP Supply Chain) */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Vendor Dependency
                            {p.vendor_id && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-medium">Linked</span>}
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Linked Vendor</label>
                              <select value={ef.vendor_id || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], vendor_id: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" disabled={!canEdit}>
                                <option value="">No vendor dependency</option>
                                {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.criticality || 'medium'})</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Dependency Notes</label>
                              <input type="text" placeholder="e.g., Awaiting patch from vendor" value={ef.vendor_dependency_notes || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], vendor_dependency_notes: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" readOnly={!canEdit} />
                            </div>
                          </div>
                        </div>

                        {/* OSCAL Export Metadata */}
                        <details className="border-t border-gray-200 pt-3 mt-3">
                          <summary className="text-xs font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                            OSCAL Metadata
                            <span className="text-[10px] font-normal text-gray-400 ml-1">(for eMASS/CSAM export)</span>
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">OSCAL UUID</label>
                                <input type="text" value={ef.oscal_uuid || ''} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[10px] font-mono bg-gray-50 text-gray-500" readOnly />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">POA&M Item ID</label>
                                <input type="text" placeholder="Optional custom ID" value={ef.oscal_poam_item_id || ''} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], oscal_poam_item_id: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" readOnly={!canEdit} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Related Observations (JSON array of UUIDs)</label>
                              <input type="text" placeholder='["uuid1", "uuid2"]' value={ef.related_observations || '[]'} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], related_observations: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-[10px] font-mono" readOnly={!canEdit} />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Related Risks (JSON array of UUIDs)</label>
                              <input type="text" placeholder='["uuid1", "uuid2"]' value={ef.related_risks || '[]'} onChange={(e) => setEditFields((prev) => ({ ...prev, [p.id]: { ...prev[p.id], related_risks: e.target.value } }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-[10px] font-mono" readOnly={!canEdit} />
                            </div>
                          </div>
                        </details>

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

                        {/* FedRAMP Compliance Sections */}
                        {/* Affected Assets with Bulk Selection */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>
                            Affected Assets ({linkedAssets.length})
                            {linkedAssets.length > 0 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">FedRAMP</span>}
                          </h4>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {linkedAssets.length === 0 && <p className="text-xs text-gray-400">No assets linked. FedRAMP requires listing affected components.</p>}
                            {linkedAssets.map((a: any) => (
                              <div key={a.id} className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-gray-700 truncate font-medium">{a.hostname || a.ip_address || 'Unknown'}</span>
                                  {a.system_name && <span className="text-gray-400 text-[10px]">{a.system_name}</span>}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${LINK_REASON_COLORS[a.link_reason] || 'bg-gray-100 text-gray-600'}`}>{a.link_reason}</span>
                                </div>
                                {canEdit && (
                                  <button onClick={() => unlinkAsset(p.id, a.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {canEdit && (
                            <div className="mt-2">
                              <p className="text-[10px] text-gray-500 mb-1">Select multiple assets to link:</p>
                              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                                {availableAssets.filter(a => !linkedAssets.find(la => la.asset_id === a.id)).length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">All assets are already linked</p>
                                ) : (
                                  availableAssets.filter(a => !linkedAssets.find(la => la.asset_id === a.id)).slice(0, 50).map((a) => (
                                    <label key={a.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded text-xs">
                                      <input
                                        type="checkbox"
                                        checked={selectedAssetIds.includes(a.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) setSelectedAssetIds(prev => [...prev, a.id]);
                                          else setSelectedAssetIds(prev => prev.filter(id => id !== a.id));
                                        }}
                                        className="rounded border-gray-300 text-forge-navy-600 focus:ring-forge-navy-500"
                                      />
                                      <span className="text-gray-700">{a.hostname || a.ip_address}</span>
                                      {a.system_name && <span className="text-gray-400 text-[10px]">({a.system_name})</span>}
                                    </label>
                                  ))
                                )}
                              </div>
                              <button
                                onClick={() => bulkLinkAssets(p.id)}
                                disabled={selectedAssetIds.length === 0 || bulkLinking}
                                className="mt-2 px-3 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50"
                              >
                                {bulkLinking ? 'Linking...' : `Link ${selectedAssetIds.length} Asset${selectedAssetIds.length !== 1 ? 's' : ''}`}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Vulnerability Findings */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Vulnerability Findings ({linkedFindings.length})
                            {linkedFindings.length > 0 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">Scan Data</span>}
                          </h4>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {linkedFindings.length === 0 && <p className="text-xs text-gray-400">No vulnerability findings linked. Link scan results to track remediation.</p>}
                            {linkedFindings.map((f: any) => (
                              <div key={f.id} className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100 text-xs">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    f.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                    f.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                    f.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>{f.severity}</span>
                                  <span className="text-gray-700 truncate font-medium" title={f.title}>{f.title?.substring(0, 40)}{f.title?.length > 40 ? '...' : ''}</span>
                                  {f.hostname && <span className="text-gray-400 text-[10px]">({f.hostname})</span>}
                                </div>
                                {canEdit && (
                                  <button onClick={() => unlinkFinding(p.id, f.id)} className="text-red-500 hover:text-red-700 p-1 ml-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {canEdit && availableFindings.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[10px] text-gray-500 mb-1">Select vulnerability findings to link:</p>
                              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                                {availableFindings.filter(f => !linkedFindings.find(lf => lf.finding_id === f.id)).length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">All findings are already linked</p>
                                ) : (
                                  availableFindings.filter(f => !linkedFindings.find(lf => lf.finding_id === f.id)).slice(0, 50).map((f) => (
                                    <label key={f.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded text-xs">
                                      <input
                                        type="checkbox"
                                        checked={selectedFindingIds.includes(f.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) setSelectedFindingIds(prev => [...prev, f.id]);
                                          else setSelectedFindingIds(prev => prev.filter(id => id !== f.id));
                                        }}
                                        className="rounded border-gray-300 text-forge-navy-600 focus:ring-forge-navy-500"
                                      />
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                        f.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                        f.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                        f.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>{f.severity}</span>
                                      <span className="text-gray-700 truncate" title={f.title}>{f.title?.substring(0, 30)}{f.title?.length > 30 ? '...' : ''}</span>
                                      {f.hostname && <span className="text-gray-400 text-[10px]">({f.hostname})</span>}
                                    </label>
                                  ))
                                )}
                              </div>
                              <button
                                onClick={() => bulkLinkFindings(p.id)}
                                disabled={selectedFindingIds.length === 0 || bulkLinking}
                                className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                              >
                                {bulkLinking ? 'Linking...' : `Link ${selectedFindingIds.length} Finding${selectedFindingIds.length !== 1 ? 's' : ''}`}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Mapped Controls */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Mapped Controls ({linkedControls.length})
                            {linkedControls.length > 1 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Multi-Control</span>}
                          </h4>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {linkedControls.length === 0 && <p className="text-xs text-gray-400">No controls mapped. Map to SI-2, RA-5, CM-3, etc.</p>}
                            {linkedControls.map((c: any) => (
                              <div key={c.id} className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-gray-700 font-medium">{c.control_id}</span>
                                  <span className="text-gray-400 text-[10px]">{c.framework_name || c.framework_id}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${MAPPING_TYPE_COLORS[c.mapping_type] || 'bg-gray-100 text-gray-600'}`}>{c.mapping_type}</span>
                                </div>
                                {canEdit && (
                                  <button onClick={() => unlinkControl(p.id, c.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-2 mt-2">
                              <select value={linkingControl.frameworkId} onChange={(e) => setLinkingControl({ ...linkingControl, poamId: p.id, frameworkId: e.target.value })} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
                                <option value="">Framework...</option>
                                {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                              <input type="text" placeholder="Control ID (e.g. SI-2)" value={linkingControl.controlId} onChange={(e) => setLinkingControl({ ...linkingControl, controlId: e.target.value.toUpperCase() })} className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                              <select value={linkingControl.type} onChange={(e) => setLinkingControl({ ...linkingControl, type: e.target.value })} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
                                <option value="primary">Primary</option>
                                <option value="related">Related</option>
                                <option value="inherited">Inherited</option>
                              </select>
                              <button onClick={() => linkControl(p.id)} disabled={!linkingControl.frameworkId || !linkingControl.controlId} className="px-2.5 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50">Map</button>
                            </div>
                          )}
                        </div>

                        {/* Evidence */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            Evidence ({linkedEvidence.length})
                            {linkedEvidence.some(e => e.purpose === 'closure') && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Closure Ready</span>}
                          </h4>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {linkedEvidence.length === 0 && <p className="text-xs text-gray-400">No evidence attached. Link closure evidence before completing.</p>}
                            {linkedEvidence.map((e: any) => (
                              <div key={e.id} className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-gray-700 truncate font-medium">{e.evidence_title || e.file_name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PURPOSE_COLORS[e.purpose] || 'bg-gray-100 text-gray-600'}`}>{e.purpose}</span>
                                </div>
                                {canEdit && (
                                  <button onClick={() => unlinkEvidence(p.id, e.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-2 mt-2">
                              <select value={linkingEvidence.evidenceId} onChange={(e) => setLinkingEvidence({ ...linkingEvidence, poamId: p.id, evidenceId: e.target.value })} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
                                <option value="">Select evidence...</option>
                                {availableEvidence.filter(e => !linkedEvidence.find(le => le.evidence_id === e.id && le.purpose === linkingEvidence.purpose)).map((e) => (
                                  <option key={e.id} value={e.id}>{e.title || e.file_name}</option>
                                ))}
                              </select>
                              <select value={linkingEvidence.purpose} onChange={(e) => setLinkingEvidence({ ...linkingEvidence, purpose: e.target.value })} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
                                <option value="identification">Identification</option>
                                <option value="remediation">Remediation</option>
                                <option value="closure">Closure</option>
                                <option value="verification">Verification</option>
                                <option value="deviation">Deviation</option>
                              </select>
                              <button onClick={() => linkEvidence(p.id)} disabled={!linkingEvidence.evidenceId} className="px-2.5 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50">Link</button>
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
