import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api, getAccessToken } from '../utils/api';
import { exportControlsCSV } from '../utils/exportHelpers';

export function ControlsPage() {
  const { t, nav } = useExperience();
  const { canEdit } = useAuth();
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [selectedFw, setSelectedFw] = useState('');
  const [controls, setControls] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [implementations, setImplementations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState('');
  const [generatingNarrative, setGeneratingNarrative] = useState('');
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, { implementation_description: string; responsible_role: string; ai_narrative: string }>>({});
  const [savingImpl, setSavingImpl] = useState('');

  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedControls, setSelectedControls] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkRole, setBulkRole] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');

  // Evidence state for expanded control
  const [controlEvidence, setControlEvidence] = useState<any[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [allEvidence, setAllEvidence] = useState<any[]>([]);
  const [showEvidencePicker, setShowEvidencePicker] = useState(false);

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

  useEffect(() => {
    if (!selectedFw || !selectedSystem) return;
    api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFw}`)
      .then((d) => {
        const map: Record<string, any> = {};
        d.implementations.forEach((impl: any) => { map[impl.control_id] = impl; });
        setImplementations(map);
      });
  }, [selectedFw, selectedSystem]);

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
      // Load evidence for this control's implementation
      if (impl?.id) {
        setLoadingEvidence(true);
        api(`/api/v1/implementations/${impl.id}/evidence`)
          .then((d) => setControlEvidence(d.evidence || []))
          .catch(() => setControlEvidence([]))
          .finally(() => setLoadingEvidence(false));
      } else {
        setControlEvidence([]);
      }
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
    if (selectedControls.size === controls.length) {
      setSelectedControls(new Set());
    } else {
      setSelectedControls(new Set(controls.map(c => c.control_id)));
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (!bulkStatus || selectedControls.size === 0 || !selectedSystem || !selectedFw) return;
    setBulkProcessing(true);
    setBulkProgress('Updating status...');
    try {
      await api('/api/v1/implementations/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem,
          framework_id: selectedFw,
          control_ids: [...selectedControls],
          status: bulkStatus,
        }),
      });
      // Refresh implementations
      const d = await api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFw}`);
      const map: Record<string, any> = {};
      d.implementations.forEach((impl: any) => { map[impl.control_id] = impl; });
      setImplementations(map);
      setBulkStatus('');
      setBulkProgress('');
    } catch { } finally { setBulkProcessing(false); }
  };

  const handleBulkUpdateRole = async () => {
    if (!bulkRole.trim() || selectedControls.size === 0 || !selectedSystem || !selectedFw) return;
    setBulkProcessing(true);
    setBulkProgress('Assigning role...');
    try {
      await api('/api/v1/implementations/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem,
          framework_id: selectedFw,
          control_ids: [...selectedControls],
          responsible_role: bulkRole,
        }),
      });
      const d = await api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFw}`);
      const map: Record<string, any> = {};
      d.implementations.forEach((impl: any) => { map[impl.control_id] = impl; });
      setImplementations(map);
      setBulkRole('');
      setBulkProgress('');
    } catch { } finally { setBulkProcessing(false); }
  };

  const handleBulkAINarrative = async () => {
    if (selectedControls.size === 0 || !selectedSystem || !selectedFw) return;
    const ids = [...selectedControls];
    const batchSize = 20;
    setBulkProcessing(true);
    try {
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        setBulkProgress(`Generating AI narratives ${i + 1}-${Math.min(i + batchSize, ids.length)} of ${ids.length}...`);
        await api('/api/v1/ai/narrative/bulk', {
          method: 'POST',
          body: JSON.stringify({
            system_id: selectedSystem,
            framework_id: selectedFw,
            control_ids: batch,
          }),
        });
      }
      // Refresh implementations
      const d = await api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFw}`);
      const map: Record<string, any> = {};
      d.implementations.forEach((impl: any) => { map[impl.control_id] = impl; });
      setImplementations(map);
      setBulkProgress('');
    } catch { } finally { setBulkProcessing(false); }
  };

  const linkEvidence = async (evidenceId: string, implId: string) => {
    try {
      await api('/api/v1/evidence/link', {
        method: 'POST',
        body: JSON.stringify({ evidence_id: evidenceId, implementation_id: implId }),
      });
      // Reload evidence for this control
      const d = await api(`/api/v1/implementations/${implId}/evidence`);
      setControlEvidence(d.evidence || []);
      setShowEvidencePicker(false);
    } catch { }
  };

  const statusOptions = [
    { value: 'implemented', label: 'Implemented', color: 'bg-green-100 text-green-700' },
    { value: 'partially_implemented', label: 'Partial', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'planned', label: 'Planned', color: 'bg-blue-100 text-blue-700' },
    { value: 'alternative', label: 'Alternative', color: 'bg-purple-100 text-purple-700' },
    { value: 'not_applicable', label: 'N/A', color: 'bg-gray-100 text-gray-600' },
    { value: 'not_implemented', label: 'Not Impl', color: 'bg-red-100 text-red-700' },
  ];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{nav('controls')}</h1>
        <p className="text-gray-500 text-sm mt-1">Browse, implement, and document {t('control').toLowerCase()}s. Click a control to expand and edit details.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={selectedFw} onChange={(e) => { setSelectedFw(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
            {frameworks.map((fw) => <option key={fw.id} value={fw.id}>{fw.name}</option>)}
            {frameworks.length === 0 && <option>No frameworks enabled</option>}
          </select>
          <select value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
            {systems.map((sys) => <option key={sys.id} value={sys.id}>{sys.name}</option>)}
            {systems.length === 0 && <option>No systems created</option>}
          </select>
          <input type="text" placeholder={`Search ${t('control').toLowerCase()}s...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
          <div className="flex gap-2">
            <button
              onClick={() => exportControlsCSV(controls, implementations, frameworks.find(f => f.id === selectedFw)?.name || 'Controls')}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            {canEdit && (
              <button
                onClick={() => { setBulkMode(!bulkMode); setSelectedControls(new Set()); }}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-1 ${bulkMode ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Bulk
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {bulkMode && selectedControls.size > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-blue-800">{selectedControls.size} selected</span>
            <div className="flex items-center gap-2">
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="px-2 py-1.5 border border-blue-300 rounded-lg text-xs">
                <option value="">Set Status...</option>
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button onClick={handleBulkUpdateStatus} disabled={!bulkStatus || bulkProcessing} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">Apply</button>
            </div>
            <div className="flex items-center gap-2">
              <input type="text" value={bulkRole} onChange={(e) => setBulkRole(e.target.value)} placeholder="Assign role..." className="px-2 py-1.5 border border-blue-300 rounded-lg text-xs w-40" />
              <button onClick={handleBulkUpdateRole} disabled={!bulkRole.trim() || bulkProcessing} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">Assign</button>
            </div>
            <button onClick={handleBulkAINarrative} disabled={bulkProcessing} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Bulk AI Narratives
            </button>
            <button onClick={() => { setSelectedControls(new Set()); setBulkMode(false); }} className="px-3 py-1.5 text-gray-600 text-xs font-medium hover:text-gray-900">Cancel</button>
            {bulkProgress && <span className="text-xs text-blue-600 font-medium">{bulkProgress}</span>}
          </div>
        </div>
      )}

      {/* Controls list */}
      <div className="space-y-2">
        {bulkMode && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <input type="checkbox" checked={selectedControls.size === controls.length && controls.length > 0} onChange={selectAllOnPage} className="rounded" />
            <span className="text-xs text-gray-600">Select all on this page</span>
          </div>
        )}
        {controls.map((ctrl) => {
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
            <div key={ctrl.id} className={`bg-white rounded-lg border ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'} transition-all`}>
              {/* Control Header */}
              <div className="p-4 cursor-pointer" onClick={() => !bulkMode && toggleExpand(ctrl.control_id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {bulkMode && (
                        <input
                          type="checkbox"
                          checked={selectedControls.has(ctrl.control_id)}
                          onChange={(e) => { e.stopPropagation(); toggleSelectControl(ctrl.control_id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded flex-shrink-0"
                        />
                      )}
                      {!bulkMode && <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                      <span className="font-mono text-sm font-semibold text-blue-700">{ctrl.control_id}</span>
                      <span className="text-sm font-medium text-gray-900">{ctrl.title}</span>
                      <span className="text-xs text-gray-400">{ctrl.family}</span>
                      {impl?.implementation_description && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-medium">Documented</span>
                      )}
                      {impl?.ai_narrative && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-medium">AI Narrative</span>
                      )}
                    </div>
                    {!isExpanded && ctrl.description && <p className="text-xs text-gray-500 line-clamp-2 ml-6">{ctrl.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                      <button
                        onClick={() => generateNarrative(ctrl.control_id)}
                        disabled={generatingNarrative === ctrl.control_id || !selectedSystem}
                        className="text-xs px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 disabled:opacity-50 flex items-center gap-1"
                        title="Generate AI implementation narrative"
                      >
                        {generatingNarrative === ctrl.control_id ? (
                          <><div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> AI...</>
                        ) : (
                          <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> AI</>
                        )}
                      </button>
                    )}
                    {canEdit ? (
                      <select
                        value={currentStatus}
                        onChange={(e) => updateStatus(ctrl.control_id, e.target.value)}
                        disabled={saving === ctrl.control_id || !selectedSystem}
                        className={`text-xs px-2 py-1.5 rounded-lg border font-medium ${statusOptions.find((s) => s.value === currentStatus)?.color || ''}`}
                      >
                        {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1.5 rounded-lg border font-medium ${statusOptions.find((s) => s.value === currentStatus)?.color || ''}`}>
                        {statusOptions.find((s) => s.value === currentStatus)?.label || currentStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Edit Panel */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50/50">
                  {/* Control Description */}
                  {ctrl.description && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-700 mb-1">Control Description</p>
                      <p className="text-sm text-gray-700">{ctrl.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Implementation Details */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible Role / Team</label>
                        <input
                          type="text"
                          value={fields?.responsible_role || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, [ctrl.control_id]: { ...prev[ctrl.control_id], responsible_role: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., IT Security Team, CISO, System Administrator"
                          readOnly={!canEdit}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-gray-700">Implementation Description</label>
                          {canEdit && (
                            <button
                              onClick={() => refineWithAI(ctrl.control_id, 'implementation_description')}
                              disabled={generatingNarrative === ctrl.control_id}
                              className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 font-medium flex items-center gap-1"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              Refine with ForgeML
                            </button>
                          )}
                        </div>
                        <textarea
                          value={fields?.implementation_description || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, [ctrl.control_id]: { ...prev[ctrl.control_id], implementation_description: e.target.value } }))}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe how this control is implemented in your organization..."
                          readOnly={!canEdit}
                        />
                      </div>
                    </div>

                    {/* Right: AI Narrative */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            AI-Generated Narrative (SSP-Ready)
                          </span>
                        </label>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => refineWithAI(ctrl.control_id, 'ai_narrative')}
                              disabled={generatingNarrative === ctrl.control_id}
                              className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 font-medium flex items-center gap-1"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              Refine with ForgeML
                            </button>
                            <button
                              onClick={() => generateNarrative(ctrl.control_id)}
                              disabled={generatingNarrative === ctrl.control_id}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-medium flex items-center gap-1"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30"
                        placeholder="Click 'Generate' to create an AI narrative, or write your own."
                        readOnly={!canEdit}
                      />
                      {generatingNarrative === ctrl.control_id && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-purple-600">
                          <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          ForgeML is generating narrative...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evidence Section */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Linked Evidence ({controlEvidence.length})
                      </h4>
                      {canEdit && impl?.id && (
                        <button
                          onClick={() => {
                            setShowEvidencePicker(true);
                            api('/api/v1/evidence').then(d => setAllEvidence(d.evidence || [])).catch(() => {});
                          }}
                          className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-medium"
                        >
                          + Link Evidence
                        </button>
                      )}
                    </div>
                    {loadingEvidence ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> Loading...</div>
                    ) : controlEvidence.length > 0 ? (
                      <div className="space-y-1">
                        {controlEvidence.map((ev: any) => (
                          <div key={ev.id} className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                              <span className="text-xs text-gray-700 truncate">{ev.title || ev.file_name}</span>
                              <span className="text-[10px] text-gray-400">{formatSize(ev.file_size || 0)}</span>
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
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No evidence linked to this control yet.</p>
                    )}

                    {/* Evidence Picker Modal */}
                    {showEvidencePicker && (
                      <div className="mt-2 p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Select evidence to link:</span>
                          <button onClick={() => setShowEvidencePicker(false)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
                        </div>
                        {allEvidence.length === 0 ? (
                          <p className="text-xs text-gray-400">No evidence available. Upload evidence first.</p>
                        ) : (
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {allEvidence.filter(ev => !controlEvidence.some((ce: any) => ce.id === ev.id)).map((ev) => (
                              <button
                                key={ev.id}
                                onClick={() => impl?.id && linkEvidence(ev.id, impl.id)}
                                className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded hover:bg-blue-50 text-xs"
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

                  {/* Save Bar */}
                  {canEdit && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        {impl?.updated_at && <span>Last updated: {new Date(impl.updated_at).toLocaleString()}</span>}
                        {impl?.ai_narrative_generated_at && <span className="ml-3">AI generated: {new Date(impl.ai_narrative_generated_at).toLocaleString()}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasUnsavedChanges && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
                        <button
                          onClick={() => saveImplementation(ctrl.control_id)}
                          disabled={savingImpl === ctrl.control_id || !selectedSystem}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${hasUnsavedChanges ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50`}
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

      {controls.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {frameworks.length === 0 ? 'Enable a framework in Settings to see controls.' : `No ${t('control').toLowerCase()}s found.`}
          </p>
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border rounded text-sm disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {Math.ceil(total / 50)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 50)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
