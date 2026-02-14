/**
 * ForgeComply 360 - Controls Page
 * Refactored to use modular hooks and components
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportControlsCSV } from '../utils/exportHelpers';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { PageHeader } from '../components/PageHeader';
import { MetricCard as ChartMetricCard } from '../components/charts';
import { SkeletonMetricCards, SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { InheritanceTreeView } from '../components/InheritanceTreeView';
import { FORMS } from '../utils/typography';

// Extracted components
import {
  BulkActionsToolbar,
  BaselineModal,
  InheritModal,
  LinkedEvidence,
  ControlComments,
} from '../components/controls';

// Extracted hooks
import { useControlsBulk } from '../hooks/useControlsBulk';
import { useControlsFilters } from '../hooks/useControlsFilters';
import { useControlsInheritance } from '../hooks/useControlsInheritance';

import type { Framework, Control, System, Implementation } from '../types/api';

// Status options constant
const STATUS_OPTIONS = [
  { value: 'implemented', label: 'Implemented', color: 'bg-green-100 text-green-700', accent: 'bg-green-500' },
  { value: 'partially_implemented', label: 'Partial', color: 'bg-yellow-100 text-yellow-700', accent: 'bg-yellow-500' },
  { value: 'planned', label: 'Planned', color: 'bg-forge-navy/10 text-forge-navy-700', accent: 'bg-forge-navy/50' },
  { value: 'alternative', label: 'Alternative', color: 'bg-purple-100 text-purple-700', accent: 'bg-purple-500' },
  { value: 'not_applicable', label: 'N/A', color: 'bg-gray-100 text-gray-600', accent: 'bg-gray-400' },
  { value: 'not_implemented', label: 'Not Impl', color: 'bg-red-100 text-red-700', accent: 'bg-red-500' },
];

export function ControlsPage() {
  const { t, nav } = useExperience();
  const { addToast } = useToast();
  const { canEdit } = useAuth();

  // Core state
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selectedFw, setSelectedFw] = useState('');
  const [controls, setControls] = useState<Control[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [implementations, setImplementations] = useState<Record<string, Implementation>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // UI state
  const [saving, setSaving] = useState('');
  const [generatingNarrative, setGeneratingNarrative] = useState('');
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, { implementation_description: string; responsible_role: string; ai_narrative: string }>>({});
  const [savingImpl, setSavingImpl] = useState('');

  // Baseline modal state
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [applyingBaseline, setApplyingBaseline] = useState(false);
  const [baselineOverwrite, setBaselineOverwrite] = useState(false);

  // Use extracted hooks
  const filters = useControlsFilters();

  const loadImplementations = useCallback(async () => {
    if (!selectedFw || !selectedSystem) return;
    const params = new URLSearchParams({ system_id: selectedSystem, framework_id: selectedFw });
    if (filters.inheritFilter) params.set('inherited', filters.inheritFilter === 'inherited' ? '1' : '0');
    const d = await api(`/api/v1/implementations?${params.toString()}`);
    const map: Record<string, Implementation> = {};
    d.implementations.forEach((impl: Implementation) => { map[impl.control_id] = impl; });
    setImplementations(map);
  }, [selectedFw, selectedSystem, filters.inheritFilter]);

  const bulk = useControlsBulk({
    selectedSystem,
    selectedFw,
    onImplementationsUpdate: setImplementations,
  });

  const inheritance = useControlsInheritance({
    selectedSystem,
    selectedFw,
    onImplementationsUpdate: loadImplementations,
  });

  // Initial data load
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

  // Load controls when framework changes
  useEffect(() => {
    if (!selectedFw) return;
    api(`/api/v1/controls?framework_id=${selectedFw}&page=${page}&limit=50${filters.search ? `&search=${encodeURIComponent(filters.search)}` : ''}`)
      .then((d) => { setControls(d.controls); setTotal(d.total); });
  }, [selectedFw, page, filters.search]);

  // Load implementations when system/framework/filter changes
  useEffect(() => { loadImplementations(); }, [loadImplementations]);

  // Update status for a control
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

  // Generate AI narrative
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

  // Refine existing text with AI
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

  // Toggle expanded control
  const toggleExpand = (controlId: string) => {
    if (expandedControl === controlId) {
      setExpandedControl(null);
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
    }
  };

  // Save implementation
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

  // Apply baseline
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

  // Compute stats
  const stats = {
    total: controls.length,
    implemented: controls.filter(c => implementations[c.control_id]?.status === 'implemented').length,
    partial: controls.filter(c => ['partially_implemented', 'planned'].includes(implementations[c.control_id]?.status)).length,
    gaps: controls.filter(c => !implementations[c.control_id]?.status || implementations[c.control_id]?.status === 'not_implemented').length,
  };

  // Filter controls
  const filteredControls = filters.statusFilter
    ? controls.filter(c => implementations[c.control_id]?.status === filters.statusFilter)
    : controls;

  const inheritedCount = Object.values(implementations).filter((i: any) => i.inherited === 1).length;

  const getAccentColor = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.accent || 'bg-gray-300';

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
          onClick={inheritance.loadInheritanceMap}
          disabled={inheritance.loadingInheritance}
          className="px-4 py-2 bg-purple-500/30 text-white rounded-lg text-sm font-medium hover:bg-purple-500/50 flex items-center gap-2 border border-purple-300/30 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          {inheritance.loadingInheritance ? 'Loading...' : 'Inheritance Map'}
        </button>
      </PageHeader>

      {/* Inheritance Map Panel */}
      {inheritance.showInheritanceMap && inheritance.inheritanceData && (
        <div className="bg-white rounded-xl border border-purple-200 mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 bg-purple-50 border-b border-purple-200">
            <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Control Inheritance Map
            </h3>
            <button onClick={() => inheritance.setShowInheritanceMap(false)} className="text-xs text-purple-600 hover:text-purple-800 font-medium">Close</button>
          </div>
          <div className="p-6">
            <InheritanceTreeView
              nodes={inheritance.inheritanceData.nodes || []}
              edges={inheritance.inheritanceData.edges || []}
              summary={inheritance.inheritanceData.summary || { total_systems: 0, providers: 0, consumers: 0, total_inherited: 0, total_edges: 0 }}
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
            <input type="text" placeholder={`Search ${t('control').toLowerCase()}s...`} value={filters.search} onChange={(e) => { filters.setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        {/* Row 2: Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
          <select value={filters.statusFilter} onChange={(e) => filters.setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white font-medium">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filters.inheritFilter} onChange={(e) => filters.setInheritFilter(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white font-medium">
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
              onClick={bulk.toggleBulkMode}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${bulk.bulkState.mode ? 'bg-forge-navy-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Bulk Edit
            </button>
          )}

          {canEdit && systems.length > 1 && (
            <button
              onClick={inheritance.openInheritModal}
              className="px-3 py-2 border border-teal-300 bg-teal-50 rounded-lg text-xs font-medium text-teal-700 hover:bg-teal-100 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              Inherit
            </button>
          )}

          {canEdit && inheritedCount > 0 && (
            <button
              onClick={inheritance.handleSyncInherited}
              disabled={inheritance.syncing}
              className="px-3 py-2 border border-teal-300 bg-teal-50 rounded-lg text-xs font-medium text-teal-700 hover:bg-teal-100 flex items-center gap-1.5 disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${inheritance.syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {inheritance.syncing ? 'Syncing...' : `Sync (${inheritedCount})`}
            </button>
          )}

          {filters.hasActiveFilters && (
            <>
              <div className="h-5 border-l border-gray-200 mx-1" />
              <button onClick={filters.clearFilters} className="px-3 py-2 text-xs text-red-600 hover:text-red-700 font-medium">
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
          {filters.savedFilters.map(f => (
            <div key={f.id} className="group flex items-center gap-1 px-2.5 py-1 bg-forge-navy/5 border border-gray-200 rounded-lg text-xs">
              <button onClick={() => filters.loadFilter(f)} className="text-forge-navy-700 font-medium hover:text-forge-navy-900">{f.name}</button>
              <button onClick={() => filters.deleteFilter(f.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {!filters.showSaveFilter ? (
            <button onClick={() => filters.setShowSaveFilter(true)} className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:text-forge-navy hover:border-forge-navy">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Save View
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input type="text" value={filters.filterName} onChange={e => filters.setFilterName(e.target.value)} onKeyDown={e => e.key === 'Enter' && filters.saveCurrentFilter()} placeholder="Filter name..." className="px-2 py-1 border border-forge-navy rounded-lg text-xs w-32 bg-white" autoFocus />
              <button onClick={filters.saveCurrentFilter} disabled={!filters.filterName.trim()} className="px-2 py-1 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50">Save</button>
              <button onClick={() => { filters.setShowSaveFilter(false); filters.setFilterName(''); }} className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700">Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        bulkState={bulk.bulkState}
        statusOptions={STATUS_OPTIONS}
        onSetStatus={bulk.setBulkStatus}
        onSetRole={bulk.setBulkRole}
        onUpdateStatus={bulk.handleBulkUpdateStatus}
        onUpdateRole={bulk.handleBulkUpdateRole}
        onGenerateNarratives={bulk.handleBulkAINarrative}
        onCancel={bulk.clearBulkSelection}
      />

      {/* Controls List */}
      <div className="space-y-3">
        {bulk.bulkState.mode && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200">
            <input type="checkbox" checked={bulk.bulkState.selectedControls.size === filteredControls.length && filteredControls.length > 0} onChange={() => bulk.selectAllOnPage(filteredControls.map(c => c.control_id))} className="rounded border-gray-300" />
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
                <div className={`w-1.5 flex-shrink-0 ${getAccentColor(currentStatus)}`} />
                <div className="flex-1 p-5 cursor-pointer" role="button" aria-expanded={isExpanded} tabIndex={bulk.bulkState.mode ? -1 : 0} onClick={() => !bulk.bulkState.mode && toggleExpand(ctrl.control_id)} onKeyDown={(e) => { if (!bulk.bulkState.mode && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleExpand(ctrl.control_id); } }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        {bulk.bulkState.mode && (
                          <input
                            type="checkbox"
                            checked={bulk.bulkState.selectedControls.has(ctrl.control_id)}
                            onChange={(e) => { e.stopPropagation(); bulk.toggleSelectControl(ctrl.control_id); }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 flex-shrink-0"
                          />
                        )}
                        {!bulk.bulkState.mode && (
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
                          className={`text-xs px-3 py-2 rounded-lg border font-semibold cursor-pointer ${STATUS_OPTIONS.find((s) => s.value === currentStatus)?.color || ''}`}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs px-3 py-2 rounded-lg border font-semibold ${STATUS_OPTIONS.find((s) => s.value === currentStatus)?.color || ''}`}>
                          {STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label || currentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Panel */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-5 bg-gray-50/50">
                  {ctrl.description && (
                    <div className="mb-4 p-4 bg-forge-navy/5 rounded-lg border border-forge-navy/20">
                      <p className="text-xs font-semibold text-forge-navy-700 mb-1">Control Description</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{ctrl.description}</p>
                    </div>
                  )}

                  {impl?.inherited === 1 && (
                    <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-teal-700">Inherited from {impl.inherited_from_name || 'another system'}</p>
                        <p className="text-xs text-teal-600 mt-0.5">Editing this control will mark it as customized.</p>
                      </div>
                      <button onClick={inheritance.syncSingleControl} className="px-3 py-2 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200 border border-teal-300 flex-shrink-0">
                        Sync from Source
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className={FORMS.label}>Responsible Role / Team</label>
                        <input
                          type="text"
                          value={fields?.responsible_role || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, [ctrl.control_id]: { ...prev[ctrl.control_id], responsible_role: e.target.value } }))}
                          className={FORMS.input}
                          placeholder="e.g., IT Security Team, CISO"
                          readOnly={!canEdit}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={FORMS.label}>Implementation Description</label>
                          {canEdit && (
                            <button onClick={() => refineWithAI(ctrl.control_id, 'implementation_description')} disabled={generatingNarrative === ctrl.control_id} className="text-[10px] px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 font-medium flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z M19 3v18" /></svg>
                              Enhance
                            </button>
                          )}
                        </div>
                        <textarea
                          value={fields?.implementation_description || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, [ctrl.control_id]: { ...prev[ctrl.control_id], implementation_description: e.target.value } }))}
                          rows={6}
                          className={FORMS.textarea}
                          placeholder="Describe how this control is implemented..."
                          readOnly={!canEdit}
                        />
                      </div>
                    </div>

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
                            <button onClick={() => refineWithAI(ctrl.control_id, 'ai_narrative')} disabled={generatingNarrative === ctrl.control_id} className="text-[10px] px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 font-medium">Refine</button>
                            <button onClick={() => generateNarrative(ctrl.control_id)} disabled={generatingNarrative === ctrl.control_id} className="text-[10px] px-2.5 py-1 rounded-md bg-forge-navy/5 text-forge-navy border border-gray-200 hover:bg-forge-navy/10 font-medium">
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
                        placeholder="Click 'Generate' to create an AI narrative..."
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

                  {/* Evidence & Comments */}
                  <LinkedEvidence implementation={impl} canEdit={canEdit} />
                  <ControlComments controlId={ctrl.control_id} systemId={selectedSystem} implementation={impl} canEdit={canEdit} />

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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-forge-navy/5 disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-600 font-medium">Page {page} of {Math.ceil(total / 50)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 50)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-forge-navy/5 disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Modals */}
      <InheritModal
        isOpen={inheritance.showInheritModal}
        onClose={inheritance.closeInheritModal}
        onInherit={inheritance.handleInherit}
        inheriting={inheritance.inheriting}
        systems={systems}
        selectedSystem={selectedSystem}
        inheritSource={inheritance.inheritSource}
        onSourceChange={inheritance.setInheritSource}
        inheritResult={inheritance.inheritResult}
      />

      <BaselineModal
        isOpen={showBaselineModal}
        onClose={() => setShowBaselineModal(false)}
        onApply={handleApplyBaseline}
        applying={applyingBaseline}
        overwrite={baselineOverwrite}
        onOverwriteChange={setBaselineOverwrite}
        framework={frameworks.find(f => f.id === selectedFw)}
        system={systems.find(s => s.id === selectedSystem)}
      />
    </div>
  );
}
