import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api, getAccessToken } from '../utils/api';
import { exportControlsCSV } from '../utils/exportHelpers';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { PageHeader } from '../components/PageHeader';
import { MetricCard as ChartMetricCard } from '../components/charts';
import { SkeletonMetricCards, SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { ProgressBar } from '../components/ProgressBar';
import { InheritanceTreeView } from '../components/InheritanceTreeView';
import { TYPOGRAPHY, FORMS, MODALS, BUTTONS, BADGES } from '../utils/typography';
import type { Framework, Control, System, Implementation, InheritanceMap, ControlComment, Evidence } from '../types/api';

export function ControlsPage() {
  const { t, nav } = useExperience();
  const { addToast } = useToast();
  const { canEdit } = useAuth();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selectedFw, setSelectedFw] = useState('');
  const [controls, setControls] = useState<Control[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [implementations, setImplementations] = useState<Record<string, Implementation>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState('');
  const [generatingNarrative, setGeneratingNarrative] = useState('');
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, { implementation_description: string; responsible_role: string; ai_narrative: string }>>({});
  const [savingImpl, setSavingImpl] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedControls, setSelectedControls] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkRole, setBulkRole] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [bulkCurrent, setBulkCurrent] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);

  // Evidence state for expanded control
  const [controlEvidence, setControlEvidence] = useState<Evidence[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [allEvidence, setAllEvidence] = useState<Evidence[]>([]);
  const [showEvidencePicker, setShowEvidencePicker] = useState(false);

  // Quick edit
  const [quickEditMode, setQuickEditMode] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(null as string|null);
  const [inlineRoles, setInlineRoles] = useState({} as Record<string,string>);
  const [savingInlineRole, setSavingInlineRole] = useState('');

  // Inheritance map state
  const [showInheritanceMap, setShowInheritanceMap] = useState(false);
  const [inheritanceData, setInheritanceData] = useState<InheritanceMap | null>(null);
  const [loadingInheritance, setLoadingInheritance] = useState(false);

  // Comments state
  const [controlComments, setControlComments] = useState<ControlComment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Saved filter views
  interface SavedFilter {
    id: string;
    name: string;
    statusFilter: string;
    inheritFilter: '' | 'inherited' | 'native';
    search: string;
  }

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try { return JSON.parse(localStorage.getItem('fc360_control_filters') || '[]'); } catch { return []; }
  });
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Inheritance state
  const [inheritFilter, setInheritFilter] = useState<'' | 'inherited' | 'native'>('');
  const [showInheritModal, setShowInheritModal] = useState(false);
  const [inheritSource, setInheritSource] = useState('');
  const [inheriting, setInheriting] = useState(false);
  const [inheritResult, setInheritResult] = useState<{ inherited_count: number; skipped_count: number; source_name: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Baseline state
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [applyingBaseline, setApplyingBaseline] = useState(false);
  const [baselineOverwrite, setBaselineOverwrite] = useState(false);

  const loadInheritanceMap = async () => {
    setLoadingInheritance(true);
    try {
      const params = selectedFw ? `?framework_id=${selectedFw}` : '';
      const data = await api(`/api/v1/implementations/inheritance-map${params}`);
      setInheritanceData(data);
      setShowInheritanceMap(true);
    } catch {} finally { setLoadingInheritance(false); }
  };

  useEffect(() => {
    Promise.all([
      api('/api/v1/frameworks/enabled'),
      api('/api/v1/systems'),
    ]).then(([fwData, sysData]) => {
      setFrameworks(fwData.frameworks);
      setSystems(sysData.systems);
      if (fwData.frameworks.length > 0) setSelectedFw(fwData.frameworks[0].id);
      if (sysData.systems.length > 0) setSelectedSystem(sysData.systems[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFw) return;
    api(`/api/v1/controls?framework_id=${selectedFw}&page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`)
      .then((d) => { setControls(d.controls); setTotal(d.total); });
  }, [selectedFw, page, search]);

  const loadImplementations = () => {
    if (!selectedFw || !selectedSystem) return;
    const params = new URLSearchParams({ system_id: selectedSystem, framework_id: selectedFw });
    if (inheritFilter) params.set('inherited', inheritFilter === 'inherited' ? '1' : '0');
    api(`/api/v1/implementations?${params.toString()}`)
      .then((d) => {
        const map: Record<string, any> = {};
        d.implementations.forEach((impl: any) => { map[impl.control_id] = impl; });
        setImplementations(map);
      });
  };

  useEffect(() => { loadImplementations(); }, [selectedFw, selectedSystem, inheritFilter]);

  const updateStatus = async (controlId: string, status: string) => {
    if (!selectedSystem || !selectedFw || !canEdit) return;
    setSaving(controlId);
    try {
      await api('/api/v1/implementations', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw, control_id: controlId, status }),
      });
      setImplementations((prev) => ({ ...prev, [controlId]: { ...prev[controlId], status } }));
    } catch { } finally { setSaving(''); }
  };

  const generateNarrative = async (controlId: string) => {
    if (!selectedSystem || !selectedFw || !canEdit) return;
    setGeneratingNarrative(controlId);
    try {
      const result = await api('/api/v1/ai/narrative', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw, control_id: controlId }),
      });
      setImplementations(prev => ({ ...prev, [controlId]: { ...prev[controlId], ai_narrative: result.narrative } }));
      setEditFields(prev => ({
        ...prev,
        [controlId]: { ...prev[controlId], ai_narrative: result.narrative, implementation_description: prev[controlId]?.implementation_description || '', responsible_role: prev[controlId]?.responsible_role || '' },
      }));
    } catch { } finally { setGeneratingNarrative(''); }
  };

  const loadComments = (controlId: string) => {
    if (!selectedSystem) return;
    api(`/api/v1/controls/${controlId}/comments?system_id=${selectedSystem}`)
      .then(d => setControlComments(d.comments || []))
      .catch(() => setControlComments([]));
  };

  const addComment = async (controlId: string) => {
    if (!newComment.trim() || !selectedSystem) return;
    try {
      const impl = implementations[controlId];
      await api(`/api/v1/controls/${controlId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment, system_id: selectedSystem, implementation_id: impl?.id || '' }),
      });
      setNewComment('');
      loadComments(controlId);
    } catch { }
  };

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const toggleExpand = (controlId: string) => {
    if (expandedControl === controlId) {
      setExpandedControl(null);
      setControlEvidence([]);
    } else {
      setExpandedControl(controlId);
      const impl = implementations[controlId];
      setEditFields(prev => ({
        ...prev,
        [controlId]: {
          implementation_description: impl?.implementation_description || '',
          responsible_role: impl?.responsible_role || '',
          ai_narrative: impl?.ai_narrative || '',
        },
      }));
      if (impl?.id) {
        setLoadingEvidence(true);
        api(`/api/v1/implementations/${impl.id}/evidence`)
          .then((d) => setControlEvidence(d.evidence || []))
          .catch(() => setControlEvidence([]))
          .finally(() => setLoadingEvidence(false));
      } else {
        setControlEvidence([]);
      }
      loadComments(controlId);
    }
  };

  const saveImplementation = async (controlId: string) => {
    if (!selectedSystem || !selectedFw || !canEdit) return;
    setSavingImpl(controlId);
    try {
      const fields = editFields[controlId];
      const impl = implementations[controlId];
      const result = await api('/api/v1/implementations', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem,
          framework_id: selectedFw,
          control_id: controlId,
          status: impl?.status || 'not_implemented',
          implementation_description: fields?.implementation_description || null,
          responsible_role: fields?.responsible_role || null,
          ai_narrative: fields?.ai_narrative || null,
        }),
      });
      setImplementations(prev => ({
        ...prev,
        [controlId]: {
          ...prev[controlId],
          ...result.implementation,
          implementation_description: fields?.implementation_description,
          responsible_role: fields?.responsible_role,
          ai_narrative: fields?.ai_narrative,
        },
      }));
    } catch { } finally { setSavingImpl(''); }
  };

  const refineWithAI = async (controlId: string, fieldName: 'implementation_description' | 'ai_narrative') => {
    if (!selectedSystem || !selectedFw || !canEdit) return;
    const currentText = editFields[controlId]?.[fieldName] || '';
    if (!currentText.trim()) return generateNarrative(controlId);
    setGeneratingNarrative(controlId);
    try {
      const result = await api('/api/v1/ai/narrative', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem,
          framework_id: selectedFw,
          control_id: controlId,
          additional_context: `Please refine and improve the following existing text to make it more professional, specific, and assessor-ready:\n\n${currentText}`,
        }),
      });
      setEditFields(prev => ({
        ...prev,
        [controlId]: { ...prev[controlId], [fieldName]: result.narrative },
      }));
      setImplementations(prev => ({ ...prev, [controlId]: { ...prev[controlId], ai_narrative: result.narrative } }));
    } catch { } finally { setGeneratingNarrative(''); }
  };

  // Bulk operations
  const toggleSelectControl = (controlId: string) => {
    setSelectedControls(prev => {
      const next = new Set(prev);
      if (next.has(controlId)) next.delete(controlId);
      else next.add(controlId);
      return next;
    });
  };

  const selectAllOnPage = () => {
    if (selectedControls.size === filteredControls.length) {
      setSelectedControls(new Set());
    } else {
      setSelectedControls(new Set(filteredControls.map(c => c.control_id)));
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (!bulkStatus || selectedControls.size === 0 || !selectedSystem || !selectedFw) return;
    setBulkProcessing(true);
    setBulkTotal(selectedControls.size);
    setBulkCurrent(0);
    setBulkProgress('Updating status...');
    try {
      await api('/api/v1/implementations/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw, control_ids: [...selectedControls], status: bulkStatus }),
      });
      setBulkCurrent(selectedControls.size);
      const d = await api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFw}`);
      const map: Record<string, any> = {};
      d.implementations.forEach((impl: any) => { map[impl.control_id] = impl; });
      setImplementations(map);
      setBulkStatus('');
      setBulkProgress('');
      setBulkCurrent(0);
      setBulkTotal(0);
    } catch { } finally { setBulkProcessing(false); }
  };

  const handleBulkUpdateRole = async () => {
    if (!bulkRole.trim() || selectedControls.size === 0 || !selectedSystem || !selectedFw) return;
    setBulkProcessing(true);
    setBulkTotal(selectedControls.size);
    setBulkCurrent(0);
    setBulkProgress('Assigning role...');
    try {
      await api('/api/v1/implementations/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw, control_ids: [...selectedControls], responsible_role: bulkRole }),
      });
      setBulkCurrent(selectedControls.size);
      const d = await api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFw}`);
      const map: Record<string, any> = {};
      d.implementations.forEach((impl: any) => { map[impl.control_id] = impl; });
      setImplementations(map);
      setBulkRole('');
      setBulkProgress('');
      setBulkCurrent(0);
      setBulkTotal(0);
    } catch { } finally { setBulkProcessing(false); }
  };

  const handleBulkAINarrative = async () => {
    if (selectedControls.size === 0 || !selectedSystem || !selectedFw) return;
    const ids = [...selectedControls];
    const batchSize = 20;
    setBulkProcessing(true);
    setBulkTotal(ids.length);
    setBulkCurrent(0);
    try {
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        setBulkProgress(`Generating AI narratives ${i + 1}-${Math.min(i + batchSize, ids.length)} of ${ids.length}...`);
        await api('/api/v1/ai/narrative/bulk', {
          method: 'POST',
          body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw, control_ids: batch }),
        });
        setBulkCurrent(Math.min(i + batchSize, ids.length));
      }
      const d = await api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFw}`);
      const map: Record<string, any> = {};
      d.implementations.forEach((impl: any) => { map[impl.control_id] = impl; });
      setImplementations(map);
      setBulkProgress('');
      setBulkCurrent(0);
      setBulkTotal(0);
    } catch { } finally { setBulkProcessing(false); }
  };

  const linkEvidence = async (evidenceId: string, implId: string) => {
    try {
      await api('/api/v1/evidence/link', {
        method: 'POST',
        body: JSON.stringify({ evidence_id: evidenceId, implementation_id: implId }),
      });
      const d = await api(`/api/v1/implementations/${implId}/evidence`);
      setControlEvidence(d.evidence || []);
      setShowEvidencePicker(false);
    } catch { }
  };

  const handleInherit = async () => {
    if (!inheritSource || !selectedSystem || !selectedFw) return;
    setInheriting(true);
    setInheritResult(null);
    try {
      const result = await api('/api/v1/implementations/inherit', {
        method: 'POST',
        body: JSON.stringify({ source_system_id: inheritSource, target_system_id: selectedSystem, framework_id: selectedFw }),
      });
      setInheritResult({ inherited_count: result.inherited_count, skipped_count: result.skipped_count, source_name: result.source_name });
      loadImplementations();
    } catch (e: any) { addToast({ type: 'error', title: 'Inherit Failed', message: e.message || 'Failed to inherit controls' }); }
    finally { setInheriting(false); }
  };

  const handleSyncInherited = async () => {
    if (!selectedSystem || !selectedFw) return;
    setSyncing(true);
    try {
      const result = await api('/api/v1/implementations/sync-inherited', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw }),
      });
      addToast({ type: 'success', title: 'Controls Synced', message: `Synced ${result.synced_count} inherited control(s) from source.` });
      loadImplementations();
    } catch (e: any) { addToast({ type: 'error', title: 'Sync Failed', message: e.message || 'Failed to sync inherited controls' }); }
    finally { setSyncing(false); }
  };

  const handleApplyBaseline = async () => {
    if (!selectedSystem || !selectedFw) return;
    setApplyingBaseline(true);
    try {
      const result = await api('/api/v1/implementations/apply-baseline', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw, overwrite: baselineOverwrite }),
      });
      addToast({ type: 'success', title: 'Baseline Applied', message: `Applied ${result.applied} baseline descriptions. ${result.skipped} controls skipped.` });
      loadImplementations();
      setShowBaselineModal(false);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Failed', message: e.message || 'Failed to apply baseline' });
    } finally { setApplyingBaseline(false); }
  };

  const saveInlineRole = async (controlId: string, role: string) => {
    if (!selectedSystem || !selectedFw || !canEdit) return;
    setSavingInlineRole(controlId);
    try {
      const impl = implementations[controlId];
      await api("/api/v1/implementations", { method: "POST", body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw, control_id: controlId, status: impl?.status || "not_implemented", responsible_role: role || null }) });
      setImplementations(prev => ({ ...prev, [controlId]: { ...prev[controlId], responsible_role: role } }));
    } catch { } finally { setSavingInlineRole(""); }
  };

  const handleQuickAction = (controlId: string, action: "narrative" | "evidence" | "note") => {
    setQuickActionsOpen(null);
    if (expandedControl !== controlId) { toggleExpand(controlId); }
    setTimeout(() => {
      const el=document.getElementById("control-"+action+"-"+controlId);
      if(el) el.scrollIntoView({behavior:"smooth",block:"center"});
      if(action==="narrative"){const impl=implementations[controlId];if(!impl?.ai_narrative&&canEdit){generateNarrative(controlId);}}
    },150);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;
    const newFilter: SavedFilter = {
      id: Date.now().toString(36),
      name: filterName.trim(),
      statusFilter,
      inheritFilter,
      search,
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('fc360_control_filters', JSON.stringify(updated));
    setFilterName('');
    setShowSaveFilter(false);
  };

  const loadFilter = (f: SavedFilter) => {
    setStatusFilter(f.statusFilter);
    setInheritFilter(f.inheritFilter);
    setSearch(f.search);
    setPage(1);
  };

  const deleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('fc360_control_filters', JSON.stringify(updated));
  };

  const inheritedCount = Object.values(implementations).filter((i: any) => i.inherited === 1).length;

  const statusOptions = [
    { value: 'implemented', label: 'Implemented', color: 'bg-green-100 text-green-700', accent: 'bg-green-500' },
    { value: 'partially_implemented', label: 'Partial', color: 'bg-yellow-100 text-yellow-700', accent: 'bg-yellow-500' },
    { value: 'planned', label: 'Planned', color: 'bg-forge-navy/10 text-forge-navy-700', accent: 'bg-forge-navy/50' },
    { value: 'alternative', label: 'Alternative', color: 'bg-purple-100 text-purple-700', accent: 'bg-purple-500' },
    { value: 'not_applicable', label: 'N/A', color: 'bg-gray-100 text-gray-600', accent: 'bg-gray-400' },
    { value: 'not_implemented', label: 'Not Impl', color: 'bg-red-100 text-red-700', accent: 'bg-red-500' },
  ];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Compute stats
  const stats = {
    total: controls.length,
    implemented: controls.filter(c => implementations[c.control_id]?.status === 'implemented').length,
    partial: controls.filter(c => ['partially_implemented', 'planned'].includes(implementations[c.control_id]?.status)).length,
    gaps: controls.filter(c => !implementations[c.control_id]?.status || implementations[c.control_id]?.status === 'not_implemented').length,
  };

  // Filter controls by status
  const filteredControls = statusFilter
    ? controls.filter(c => {
        const s = implementations[c.control_id]?.status || 'not_implemented';
        return s === statusFilter;
      })
    : controls;

  const getAccentColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.accent || 'bg-gray-300';
  };

  if (loading) return <div><SkeletonMetricCards /><SkeletonListItem count={8} /></div>;

  return (
    <div>
      <PageHeader
        title={nav('controls')}
        subtitle={`Browse, implement, and document ${t('control').toLowerCase()}s. Click a control to expand and edit details.`}
      >
        {canEdit && (
          <Link
            to="/assessment"
            className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 flex items-center gap-2 border border-white/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Assessment Wizard
          </Link>
        )}
        {canEdit && (
          <button
            onClick={() => setShowBaselineModal(true)}
            disabled={!selectedSystem || !selectedFw}
            className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 flex items-center gap-2 border border-white/20 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Apply Baseline
          </button>
        )}
        <button
          onClick={loadInheritanceMap}
          disabled={loadingInheritance}
          className="px-4 py-2 bg-purple-500/30 text-white rounded-lg text-sm font-medium hover:bg-purple-500/50 flex items-center gap-2 border border-purple-300/30 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          {loadingInheritance ? 'Loading...' : 'Inheritance Map'}
        </button>
      </PageHeader>

      {/* Inheritance Map Panel */}
      {showInheritanceMap && inheritanceData && (
        <div className="bg-white rounded-xl border border-purple-200 mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 bg-purple-50 border-b border-purple-200">
            <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Control Inheritance Map
            </h3>
            <button onClick={() => setShowInheritanceMap(false)} className="text-xs text-purple-600 hover:text-purple-800 font-medium">Close</button>
          </div>
          <div className="p-6">
            <InheritanceTreeView
              nodes={inheritanceData.nodes || []}
              edges={inheritanceData.edges || []}
              summary={inheritanceData.summary || { total_systems: 0, providers: 0, consumers: 0, total_inherited: 0, total_edges: 0 }}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ChartMetricCard title="Total Controls" value={String(stats.total)} accentColor="#3b82f6" />
        <ChartMetricCard title="Implemented" value={String(stats.implemented)} subtitle={stats.total > 0 ? `${Math.round((stats.implemented / stats.total) * 100)}%` : '0%'} accentColor="#22c55e" />
        <ChartMetricCard title="In Progress" value={String(stats.partial)} subtitle="Partial + Planned" accentColor="#eab308" />
        <ChartMetricCard title="Gaps" value={String(stats.gaps)} subtitle="Not Implemented" accentColor={stats.gaps > 0 ? '#ef4444' : '#22c55e'} />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        {/* Row 1: Core Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <select value={selectedFw} onChange={(e) => { setSelectedFw(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
            {frameworks.map((fw) => <option key={fw.id} value={fw.id}>{fw.name}</option>)}
            {frameworks.length === 0 && <option>No frameworks enabled</option>}
          </select>
          <select value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
            {systems.map((sys) => <option key={sys.id} value={sys.id}>{sys.name}</option>)}
            {systems.length === 0 && <option>No systems created</option>}
          </select>
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder={`Search ${t('control').toLowerCase()}s...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        {/* Row 2: Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white font-medium">
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={inheritFilter} onChange={(e) => setInheritFilter(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white font-medium">
            <option value="">All Controls</option>
            <option value="inherited">Inherited Only</option>
            <option value="native">Native Only</option>
          </select>

          <div className="h-5 border-l border-gray-200 mx-1" />

          <button
            onClick={() => exportControlsCSV(controls, implementations, frameworks.find(f => f.id === selectedFw)?.name || 'Controls')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>

          {canEdit && (
            <button
              onClick={() => { setBulkMode(!bulkMode); setSelectedControls(new Set()); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${bulkMode ? 'bg-forge-navy-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Bulk Edit
            </button>
          )}

          {canEdit && (
            <button onClick={() => setQuickEditMode(!quickEditMode)}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-300">Quick Edit</button>
          )}

          {canEdit && systems.length > 1 && (
            <button
              onClick={() => { setShowInheritModal(true); setInheritSource(''); setInheritResult(null); }}
              className="px-3 py-2 border border-teal-300 bg-teal-50 rounded-lg text-xs font-medium text-teal-700 hover:bg-teal-100 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              Inherit
            </button>
          )}
          {canEdit && inheritedCount > 0 && (
            <button
              onClick={handleSyncInherited}
              disabled={syncing}
              className="px-3 py-2 border border-teal-300 bg-teal-50 rounded-lg text-xs font-medium text-teal-700 hover:bg-teal-100 flex items-center gap-1.5 disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {syncing ? 'Syncing...' : `Sync (${inheritedCount})`}
            </button>
          )}

          {(statusFilter || inheritFilter) && (
            <>
              <div className="h-5 border-l border-gray-200 mx-1" />
              <button onClick={() => { setStatusFilter(''); setInheritFilter(''); }} className="px-3 py-2 text-xs text-red-600 hover:text-red-700 font-medium">
                Clear Filters
              </button>
            </>
          )}

          <span className="ml-auto text-xs text-gray-500">
            Showing {filteredControls.length} of {controls.length} controls
          </span>
        </div>

        {/* Saved Filters */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100 mt-3">
            {savedFilters.map(f => (
              <div key={f.id} className="group flex items-center gap-1 px-2.5 py-1 bg-forge-navy/5 dark:bg-forge-navy/20 border border-gray-200 dark:border-forge-navy/40 rounded-lg text-xs">
                <button onClick={() => loadFilter(f)} className="text-forge-navy-700 dark:text-forge-navy-100 font-medium hover:text-forge-navy-900">{f.name}</button>
                <button onClick={() => deleteFilter(f.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {!showSaveFilter ? (
              <button onClick={() => setShowSaveFilter(true)} className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-500 hover:text-forge-navy hover:border-forge-navy">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Save View
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input type="text" value={filterName} onChange={e => setFilterName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveCurrentFilter()} placeholder="Filter name..." className="px-2 py-1 border border-forge-navy rounded-lg text-xs w-32 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" autoFocus />
                <button onClick={saveCurrentFilter} disabled={!filterName.trim()} className="px-2 py-1 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50">Save</button>
                <button onClick={() => { setShowSaveFilter(false); setFilterName(''); }} className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700">Cancel</button>
              </div>
            )}
          </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {bulkMode && selectedControls.size > 0 && (
        <div className="bg-forge-navy/5 rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-forge-navy-800">{selectedControls.size} selected</span>
            <div className="h-5 border-l border-gray-200" />
            <div className="flex items-center gap-2">
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="px-2 py-1.5 border border-forge-navy rounded-lg text-xs bg-white">
                <option value="">Set Status...</option>
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button onClick={handleBulkUpdateStatus} disabled={!bulkStatus || bulkProcessing} className="px-3 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50">Apply</button>
            </div>
            <div className="h-5 border-l border-gray-200" />
            <div className="flex items-center gap-2">
              <input type="text" value={bulkRole} onChange={(e) => setBulkRole(e.target.value)} placeholder="Assign role..." className="px-2 py-1.5 border border-forge-navy rounded-lg text-xs w-40 bg-white" />
              <button onClick={handleBulkUpdateRole} disabled={!bulkRole.trim() || bulkProcessing} className="px-3 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50">Assign</button>
            </div>
            <div className="h-5 border-l border-gray-200" />
            <button onClick={handleBulkAINarrative} disabled={bulkProcessing} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              ForgeML Writers
            </button>
            <button onClick={() => { setSelectedControls(new Set()); setBulkMode(false); }} className="px-3 py-1.5 text-gray-600 text-xs font-medium hover:text-gray-900">Cancel</button>
          </div>
          {bulkProcessing && bulkTotal > 0 && (
            <div className="w-full mt-3">
              <ProgressBar current={bulkCurrent} total={bulkTotal} label={bulkProgress || undefined} color="bg-forge-navy-900" />
            </div>
          )}
        </div>
      )}

      {/* Controls List */}
      <div className="space-y-3">
        {bulkMode && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200">
            <input type="checkbox" checked={selectedControls.size === filteredControls.length && filteredControls.length > 0} onChange={selectAllOnPage} className="rounded border-gray-300" />
            <span className="text-xs text-gray-600 font-medium">Select all on this page ({filteredControls.length})</span>
          </div>
        )}
        {filteredControls.map((ctrl) => {
          const impl = implementations[ctrl.control_id];
          const currentStatus = impl?.status || 'not_implemented';
          const isExpanded = expandedControl === ctrl.control_id;
          const fields = editFields[ctrl.control_id];
          const hasUnsavedChanges = fields && (
            (fields.implementation_description || '') !== (impl?.implementation_description || '') ||
            (fields.responsible_role || '') !== (impl?.responsible_role || '') ||
            (fields.ai_narrative || '') !== (impl?.ai_narrative || '')
          );
          return (
            <div key={ctrl.id} className={`bg-white rounded-xl border ${isExpanded ? 'border-forge-navy ring-2 ring-forge-navy/10 shadow-md' : 'border-gray-200 shadow-sm hover:shadow-md'} transition-all overflow-hidden`}>
              {/* Control Header */}
              <div className="flex">
                {/* Status Accent Bar */}
                <div className={`w-1.5 flex-shrink-0 ${getAccentColor(currentStatus)}`} />

                <div className="flex-1 p-5 cursor-pointer" role="button" aria-expanded={isExpanded} tabIndex={bulkMode ? -1 : 0} onClick={() => !bulkMode && toggleExpand(ctrl.control_id)} onKeyDown={(e) => { if (!bulkMode && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleExpand(ctrl.control_id); } }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        {bulkMode && (
                          <input
                            type="checkbox"
                            checked={selectedControls.has(ctrl.control_id)}
                            onChange={(e) => { e.stopPropagation(); toggleSelectControl(ctrl.control_id); }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 flex-shrink-0"
                          />
                        )}
                        {!bulkMode && (
                          <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                        <span className="inline-flex items-center px-2.5 py-1 bg-forge-navy/5 border border-gray-200 rounded-md font-mono text-xs font-bold text-forge-navy-700">{ctrl.control_id}</span>
                        <h3 className="text-sm font-semibold text-gray-900">{ctrl.title}</h3>
                      </div>

                      <div className="flex items-center gap-2 ml-7 flex-wrap">
                        <span className="text-xs text-gray-500">{ctrl.family}</span>
                        {impl?.implementation_description && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium border border-green-200">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Documented
                          </span>
                        )}
                        {impl?.ai_narrative && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium border border-purple-200">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            ForgeML Writer
                          </span>
                        )}
                        {impl?.inherited === 1 && (
                          <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-medium border border-teal-200">
                            Inherited{impl.inherited_from_name ? ` from ${impl.inherited_from_name}` : ''}
                          </span>
                        )}
                        {impl?.inherited === 0 && impl?.inherited_from && (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200">
                            Customized
                          </span>
                        )}
                      </div>

                      {!isExpanded && ctrl.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 ml-7 mt-1.5">{ctrl.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {canEdit && (
                        <button
                          onClick={() => generateNarrative(ctrl.control_id)}
                          disabled={generatingNarrative === ctrl.control_id || !selectedSystem}
                          className="text-xs px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 disabled:opacity-50 flex items-center gap-1.5"
                          title="Generate ForgeML implementation narrative"
                        >
                          {generatingNarrative === ctrl.control_id ? (
                            <><div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> ForgeML...</>
                          ) : (
                            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> ForgeML</>
                          )}
                        </button>
                      )}
                      {canEdit ? (
                        <select
                          value={currentStatus}
                          onChange={(e) => updateStatus(ctrl.control_id, e.target.value)}
                          disabled={saving === ctrl.control_id || !selectedSystem}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs px-3 py-2 rounded-lg border font-semibold cursor-pointer ${statusOptions.find((s) => s.value === currentStatus)?.color || ''}`}
                        >
                          {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs px-3 py-2 rounded-lg border font-semibold ${statusOptions.find((s) => s.value === currentStatus)?.color || ''}`}>
                          {statusOptions.find((s) => s.value === currentStatus)?.label || currentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Edit Panel */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-5 bg-gray-50/50">
                  {/* Control Description */}
                  {ctrl.description && (
                    <div className="mb-4 p-4 bg-forge-navy/5 rounded-lg border border-forge-navy/20">
                      <p className="text-xs font-semibold text-forge-navy-700 mb-1">Control Description</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{ctrl.description}</p>
                    </div>
                  )}

                  {/* Inheritance Info Banner */}
                  {impl?.inherited === 1 && (
                    <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-teal-700">
                          Inherited from {impl.inherited_from_name || 'another system'}
                        </p>
                        <p className="text-xs text-teal-600 mt-0.5">Editing this control will mark it as customized and break the inheritance link.</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await api('/api/v1/implementations/sync-inherited', {
                              method: 'POST',
                              body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw }),
                            });
                            loadImplementations();
                          } catch {}
                        }}
                        className="px-3 py-2 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200 border border-teal-300 flex-shrink-0"
                      >
                        Sync from Source
                      </button>
                    </div>
                  )}
                  {impl?.inherited === 0 && impl?.inherited_from && (
                    <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700">
                        Customized (originally inherited from {impl.inherited_from_name || 'another system'})
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">This control was inherited but has been manually edited. Re-inherit to restore the source values.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Implementation Details */}
                    <div className="space-y-3">
                      <div>
                        <label className={FORMS.label}>Responsible Role / Team</label>
                        <input
                          type="text"
                          value={fields?.responsible_role || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, [ctrl.control_id]: { ...prev[ctrl.control_id], responsible_role: e.target.value } }))}
                          className={FORMS.input}
                          placeholder="e.g., IT Security Team, CISO, System Administrator"
                          readOnly={!canEdit}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={FORMS.label}>Implementation Description</label>
                          {canEdit && (
                            <button
                              onClick={() => refineWithAI(ctrl.control_id, 'implementation_description')}
                              disabled={generatingNarrative === ctrl.control_id}
                              className="text-[10px] px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 font-medium flex items-center gap-1"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z M19 3v18" /></svg>
                              ✨ Enhance
                            </button>
                          )}
                        </div>
                        <textarea
                          value={fields?.implementation_description || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, [ctrl.control_id]: { ...prev[ctrl.control_id], implementation_description: e.target.value } }))}
                          rows={6}
                          className={FORMS.textarea}
                          placeholder="Describe how this control is implemented in your organization..."
                          readOnly={!canEdit}
                        />
                      </div>
                    </div>

                    {/* Right: ForgeML Writer */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={FORMS.label}>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            ForgeML Writer (SSP-Ready)
                          </span>
                        </label>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => refineWithAI(ctrl.control_id, 'ai_narrative')}
                              disabled={generatingNarrative === ctrl.control_id}
                              className="text-[10px] px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 font-medium flex items-center gap-1"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              Refine
                            </button>
                            <button
                              onClick={() => generateNarrative(ctrl.control_id)}
                              disabled={generatingNarrative === ctrl.control_id}
                              className="text-[10px] px-2.5 py-1 rounded-md bg-forge-navy/5 text-forge-navy border border-gray-200 hover:bg-forge-navy/10 font-medium flex items-center gap-1"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              {fields?.ai_narrative ? 'Regenerate' : 'Generate'}
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={fields?.ai_narrative || ''}
                        onChange={(e) => setEditFields(prev => ({ ...prev, [ctrl.control_id]: { ...prev[ctrl.control_id], ai_narrative: e.target.value } }))}
                        rows={10}
                        className={`${FORMS.textarea} focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30`}
                        placeholder="Click 'Generate' to create an AI narrative, or write your own."
                        readOnly={!canEdit}
                      />
                      {generatingNarrative === ctrl.control_id && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-purple-600">
                          <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          AI is generating narrative...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evidence Section */}
                  <div className="mt-5 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Linked Evidence ({controlEvidence.length})
                      </h4>
                      {canEdit && impl?.id && (
                        <button
                          onClick={() => {
                            setShowEvidencePicker(true);
                            api('/api/v1/evidence').then(d => setAllEvidence(d.evidence || [])).catch(() => {});
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-forge-navy/5 text-forge-navy border border-gray-200 hover:bg-forge-navy/10 font-medium flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Link Evidence
                        </button>
                      )}
                    </div>
                    {loadingEvidence ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> Loading...</div>
                    ) : controlEvidence.length > 0 ? (
                      <div className="space-y-1.5">
                        {controlEvidence.map((ev: any) => (
                          <div key={ev.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-forge-navy/20">
                            <div className="flex items-center gap-2 min-w-0">
                              <svg className="w-4 h-4 text-forge-navy flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                              <span className="text-sm text-gray-700 truncate">{ev.title || ev.file_name}</span>
                              <span className="text-xs text-gray-400">{formatSize(ev.file_size || 0)}</span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  const apiBase = import.meta.env.VITE_API_URL || '';
                                  const res = await fetch(`${apiBase}/api/v1/evidence/${ev.id}/download`, {
                                    headers: { Authorization: `Bearer ${getAccessToken()}` },
                                  });
                                  if (!res.ok) throw new Error('Download failed');
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = ev.file_name || 'evidence';
                                  a.click();
                                  URL.revokeObjectURL(url);
                                } catch {}
                              }}
                              className="text-xs text-forge-navy hover:text-forge-navy-900 font-medium flex-shrink-0"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No evidence linked to this control yet.</p>
                    )}

                    {/* Evidence Picker */}
                    {showEvidencePicker && (
                      <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-700">Select evidence to link:</span>
                          <button onClick={() => setShowEvidencePicker(false)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Close</button>
                        </div>
                        {allEvidence.length === 0 ? (
                          <p className="text-xs text-gray-400">No evidence available. Upload evidence first.</p>
                        ) : (
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {allEvidence.filter(ev => !controlEvidence.some((ce: any) => ce.id === ev.id)).map((ev) => (
                              <button
                                key={ev.id}
                                onClick={() => impl?.id && linkEvidence(ev.id, impl.id)}
                                className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-forge-navy/5 text-xs border border-transparent hover:border-gray-200"
                              >
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                <span className="text-gray-700 truncate">{ev.title || ev.file_name}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{formatSize(ev.file_size || 0)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Comments ({controlComments.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {controlComments.length === 0 && <p className="text-xs text-gray-400">No comments yet.</p>}
                      {controlComments.map((c: any) => (
                        <div key={c.id} className="py-2 px-3 bg-white dark:bg-gray-700 rounded border border-gray-100 dark:border-gray-600">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{c.author_name || 'Unknown'}</span>
                            <span className="text-[10px] text-gray-400">{relativeTime(c.created_at)}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{c.content}</p>
                        </div>
                      ))}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2 mt-2">
                        <input type="text" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment(ctrl.control_id)} className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 dark:text-gray-200" />
                        <button onClick={() => addComment(ctrl.control_id)} disabled={!newComment.trim()} className="px-3 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50">Post</button>
                      </div>
                    )}
                  </div>

                  {/* Activity Timeline */}
                  {impl?.id && (
                    <div className="mt-5 pt-4 border-t border-gray-200">
                      <ActivityTimeline resourceType="control_implementation" resourceId={impl.id} />
                    </div>
                  )}

                  {/* Save Bar */}
                  {canEdit && (
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        {impl?.updated_at && <span>Last updated: {new Date(impl.updated_at).toLocaleString()}</span>}
                        {impl?.ai_narrative_generated_at && <span className="ml-3">AI generated: {new Date(impl.ai_narrative_generated_at).toLocaleString()}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasUnsavedChanges && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
                        <button
                          onClick={() => saveImplementation(ctrl.control_id)}
                          disabled={savingImpl === ctrl.control_id || !selectedSystem}
                          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${hasUnsavedChanges ? 'bg-forge-navy-900 text-white hover:bg-forge-navy-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50`}
                        >
                          {savingImpl === ctrl.control_id ? (
                            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                          ) : (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Save Implementation</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredControls.length === 0 && !loading && (
        <EmptyState title="No controls found" subtitle="Adjust your filters or sync controls from a framework" icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      )}

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-forge-navy/5 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 font-medium">
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 50)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-forge-navy/5 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      )}

      {/* Inherit Controls Modal */}
      {showInheritModal && (
        <div className={MODALS.backdrop}>
          <div className={MODALS.container} role="dialog" aria-modal="true" aria-labelledby="inherit-controls-modal-title">
            <div className={MODALS.header}>
              <h3 id="inherit-controls-modal-title" className={TYPOGRAPHY.modalTitle}>Inherit Controls</h3>
            </div>
            <div className={MODALS.body}>
              <p className={`${TYPOGRAPHY.bodyMuted} mb-4`}>
                Copy implemented controls from another system into <strong>{systems.find(s => s.id === selectedSystem)?.name}</strong>.
                Controls already implemented natively will be skipped.
              </p>

              <label className={FORMS.label}>Source System</label>
              <select
                value={inheritSource}
                onChange={(e) => setInheritSource(e.target.value)}
                className={`${FORMS.select} mb-4`}
              >
                <option value="">Select a source system...</option>
                {systems.filter(s => s.id !== selectedSystem).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {inheritResult && (
                <div className={`mb-4 p-3 rounded-lg border ${BADGES.success} border-green-200`}>
                  <p className="text-sm font-medium">
                    Inherited {inheritResult.inherited_count} control(s) from {inheritResult.source_name}
                  </p>
                  {inheritResult.skipped_count > 0 && (
                    <p className="text-xs mt-0.5 opacity-80">{inheritResult.skipped_count} control(s) skipped (already implemented)</p>
                  )}
                </div>
              )}
            </div>
            <div className={MODALS.footer}>
              <button
                onClick={() => setShowInheritModal(false)}
                className={BUTTONS.secondary}
              >
                {inheritResult ? 'Close' : 'Cancel'}
              </button>
              {!inheritResult && (
                <button
                  onClick={handleInherit}
                  disabled={!inheritSource || inheriting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {inheriting ? (
                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Inheriting...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> Inherit Controls</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showBaselineModal && (
        <div className={MODALS.backdrop} onClick={() => setShowBaselineModal(false)}>
          <div className={MODALS.container} onClick={e => e.stopPropagation()}>
            <div className={MODALS.header}>
              <h3 className={TYPOGRAPHY.modalTitle}>Apply Framework Baseline</h3>
            </div>
            <div className={MODALS.body}>
              <p className={`${TYPOGRAPHY.bodyMuted} mb-4`}>
                This will populate implementation descriptions and responsible roles with industry-standard baseline text for all controls in the selected framework.
              </p>
              <div className="bg-forge-navy/5 rounded-lg p-3 mb-4">
                <p className="text-xs text-forge-navy-700 font-medium">
                  Framework: {frameworks.find(f => f.id === selectedFw)?.name || selectedFw}
                </p>
                <p className="text-xs text-forge-navy">
                  System: {systems.find(s => s.id === selectedSystem)?.name || selectedSystem}
                </p>
              </div>
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input type="checkbox" checked={baselineOverwrite} onChange={e => setBaselineOverwrite(e.target.checked)} className={FORMS.checkbox} />
                <span className={TYPOGRAPHY.body}>Overwrite existing descriptions</span>
              </label>
              <p className={`${TYPOGRAPHY.bodySmallMuted} ${baselineOverwrite ? 'text-amber-600' : ''}`}>
                {baselineOverwrite ? 'Warning: This will replace ALL existing implementation descriptions.' : 'Only empty fields will be populated. Existing descriptions will be preserved.'}
              </p>
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setShowBaselineModal(false)} className={BUTTONS.secondary}>Cancel</button>
              <button onClick={handleApplyBaseline} disabled={applyingBaseline} className={`${BUTTONS.primary} flex items-center gap-2`}>
                {applyingBaseline ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Applying...</> : 'Apply Baseline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
