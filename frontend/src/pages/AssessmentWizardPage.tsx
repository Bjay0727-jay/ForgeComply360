import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

type WizardStep = 'select' | 'assess' | 'review' | 'complete';

const STATUS_OPTIONS = [
  { value: 'implemented', label: 'Implemented', color: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  { value: 'partially_implemented', label: 'Partial', color: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500' },
  { value: 'planned', label: 'Planned', color: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' },
  { value: 'alternative', label: 'Alternative', color: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  { value: 'not_applicable', label: 'N/A', color: 'bg-gray-100 text-gray-600', bar: 'bg-gray-400' },
  { value: 'not_implemented', label: 'Not Impl', color: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
];

const statusColor = (s: string) => STATUS_OPTIONS.find(o => o.value === s)?.color || 'bg-gray-100 text-gray-600';

const WIZARD_STEPS = ['Select', 'Assess by Family', 'Review', 'Complete'];

export function AssessmentWizardPage() {
  const { canEdit } = useAuth();

  // Wizard navigation
  const [step, setStep] = useState<WizardStep>('select');

  // Selection
  const [systems, setSystems] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [previewStats, setPreviewStats] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Data
  const [allControls, setAllControls] = useState<any[]>([]);
  const [implementations, setImplementations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Family navigation
  const [families, setFamilies] = useState<string[]>([]);
  const [activeFamilyIndex, setActiveFamilyIndex] = useState(0);

  // Control interaction
  const [savingControlId, setSavingControlId] = useState<string | null>(null);
  const [expandedControlId, setExpandedControlId] = useState<string | null>(null);
  const [focusedControlIndex, setFocusedControlIndex] = useState(0);
  const [editDesc, setEditDesc] = useState('');
  const [editRole, setEditRole] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  // Bulk
  const [bulkApplying, setBulkApplying] = useState(false);

  // Review
  const [generatingNarratives, setGeneratingNarratives] = useState(false);
  const [narrativeProgress, setNarrativeProgress] = useState('');
  const [showAllGaps, setShowAllGaps] = useState(false);

  // Load systems + frameworks on mount
  useEffect(() => {
    Promise.all([api('/api/v1/systems'), api('/api/v1/frameworks/enabled')])
      .then(([s, f]) => {
        setSystems(s.systems || []);
        setFrameworks(f.frameworks || []);
      })
      .catch(() => {});
  }, []);

  // Preview stats when both selected
  useEffect(() => {
    if (!selectedSystem || !selectedFramework) { setPreviewStats(null); return; }
    setLoadingPreview(true);
    api(`/api/v1/implementations/stats?system_id=${selectedSystem}&framework_id=${selectedFramework}`)
      .then(d => setPreviewStats(d.stats || null))
      .catch(() => setPreviewStats(null))
      .finally(() => setLoadingPreview(false));
  }, [selectedSystem, selectedFramework]);

  // Derived state
  const familyControls = useMemo(() =>
    allControls.filter(c => c.family === families[activeFamilyIndex]).sort((a, b) => a.sort_order - b.sort_order),
    [allControls, families, activeFamilyIndex]
  );

  const familyStats = useMemo(() => {
    const stats: Record<string, { total: number; assessed: number }> = {};
    for (const family of families) {
      const fControls = allControls.filter(c => c.family === family);
      const assessed = fControls.filter(c => {
        const impl = implementations[c.control_id];
        return impl && impl.status !== 'not_implemented';
      }).length;
      stats[family] = { total: fControls.length, assessed };
    }
    return stats;
  }, [allControls, families, implementations]);

  const totalControls = allControls.length;
  const assessedControls = useMemo(() =>
    allControls.filter(c => { const impl = implementations[c.control_id]; return impl && impl.status !== 'not_implemented'; }).length,
    [allControls, implementations]
  );
  const compliancePct = totalControls > 0 ? Math.round((assessedControls / totalControls) * 100) : 0;

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_OPTIONS.forEach(o => { counts[o.value] = 0; });
    for (const ctrl of allControls) {
      const status = implementations[ctrl.control_id]?.status || 'not_implemented';
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, [allControls, implementations]);

  const gaps = useMemo(() =>
    allControls.filter(c => !implementations[c.control_id] || implementations[c.control_id].status === 'not_implemented'),
    [allControls, implementations]
  );

  const missingNarratives = useMemo(() =>
    allControls.filter(c => {
      const impl = implementations[c.control_id];
      return impl && impl.status === 'implemented' && !impl.ai_narrative;
    }),
    [allControls, implementations]
  );

  // Start assessment
  const startAssessment = async () => {
    setLoading(true);
    try {
      const [controlsData, implData] = await Promise.all([
        api(`/api/v1/controls?framework_id=${selectedFramework}&limit=2000`),
        api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFramework}`),
      ]);
      setAllControls(controlsData.controls || []);
      const map: Record<string, any> = {};
      (implData.implementations || []).forEach((impl: any) => { map[impl.control_id] = impl; });
      setImplementations(map);
      const uniqueFamilies = [...new Set((controlsData.controls || []).map((c: any) => c.family))].sort() as string[];
      setFamilies(uniqueFamilies);
      setActiveFamilyIndex(0);
      setFocusedControlIndex(0);
      setStep('assess');
    } catch {} finally { setLoading(false); }
  };

  // Update single control status (auto-save)
  const updateControlStatus = useCallback(async (controlId: string, status: string) => {
    if (!controlId) return;
    setImplementations(prev => ({
      ...prev,
      [controlId]: { ...prev[controlId], control_id: controlId, status }
    }));
    setSavingControlId(controlId);
    try {
      await api('/api/v1/implementations', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFramework, control_id: controlId, status }),
      });
    } catch {} finally { setSavingControlId(null); }
  }, [selectedSystem, selectedFramework]);

  // Save expanded details
  const saveDetails = async (controlId: string) => {
    setSavingDetails(true);
    try {
      await api('/api/v1/implementations', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem, framework_id: selectedFramework, control_id: controlId,
          status: implementations[controlId]?.status || 'not_implemented',
          implementation_description: editDesc, responsible_role: editRole,
        }),
      });
      setImplementations(prev => ({
        ...prev,
        [controlId]: { ...prev[controlId], implementation_description: editDesc, responsible_role: editRole }
      }));
    } catch {} finally { setSavingDetails(false); }
  };

  // Expand a control
  const toggleExpand = (controlId: string) => {
    if (expandedControlId === controlId) {
      setExpandedControlId(null);
    } else {
      setExpandedControlId(controlId);
      const impl = implementations[controlId];
      setEditDesc(impl?.implementation_description || '');
      setEditRole(impl?.responsible_role || '');
    }
  };

  // Bulk family action
  const bulkFamilyAction = async (status: string) => {
    setBulkApplying(true);
    const controlIds = familyControls.map(c => c.control_id);
    // Optimistic update
    setImplementations(prev => {
      const next = { ...prev };
      controlIds.forEach(id => { next[id] = { ...next[id], control_id: id, status }; });
      return next;
    });
    try {
      await api('/api/v1/implementations/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFramework, control_ids: controlIds, status }),
      });
    } catch {} finally { setBulkApplying(false); }
  };

  // AI narrative generation
  const generateMissingNarratives = async () => {
    setGeneratingNarratives(true);
    const batchSize = 20;
    for (let i = 0; i < missingNarratives.length; i += batchSize) {
      const batch = missingNarratives.slice(i, i + batchSize);
      setNarrativeProgress(`Generating ${i + 1}-${Math.min(i + batchSize, missingNarratives.length)} of ${missingNarratives.length}...`);
      try {
        await api('/api/v1/ai/narrative/bulk', {
          method: 'POST',
          body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFramework, control_ids: batch.map(c => c.control_id) }),
        });
      } catch { break; }
    }
    // Reload implementations
    try {
      const d = await api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFramework}`);
      const map: Record<string, any> = {};
      (d.implementations || []).forEach((impl: any) => { map[impl.control_id] = impl; });
      setImplementations(map);
    } catch {}
    setGeneratingNarratives(false);
    setNarrativeProgress('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (step !== 'assess') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const ctrl = familyControls[focusedControlIndex];
      switch (e.key) {
        case 'ArrowDown': case 'j':
          e.preventDefault(); setFocusedControlIndex(p => Math.min(p + 1, familyControls.length - 1)); break;
        case 'ArrowUp': case 'k':
          e.preventDefault(); setFocusedControlIndex(p => Math.max(p - 1, 0)); break;
        case 'ArrowRight':
          e.preventDefault(); setActiveFamilyIndex(p => Math.min(p + 1, families.length - 1)); setFocusedControlIndex(0); break;
        case 'ArrowLeft':
          e.preventDefault(); setActiveFamilyIndex(p => Math.max(p - 1, 0)); setFocusedControlIndex(0); break;
        case '1': if (ctrl) updateControlStatus(ctrl.control_id, 'implemented'); break;
        case '2': if (ctrl) updateControlStatus(ctrl.control_id, 'partially_implemented'); break;
        case '3': if (ctrl) updateControlStatus(ctrl.control_id, 'planned'); break;
        case '4': if (ctrl) updateControlStatus(ctrl.control_id, 'alternative'); break;
        case '5': if (ctrl) updateControlStatus(ctrl.control_id, 'not_applicable'); break;
        case '6': if (ctrl) updateControlStatus(ctrl.control_id, 'not_implemented'); break;
        case 'Enter': e.preventDefault(); if (ctrl) toggleExpand(ctrl.control_id); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, focusedControlIndex, familyControls, families, activeFamilyIndex, updateControlStatus]);

  // Auto-scroll focused control into view
  useEffect(() => {
    if (step !== 'assess') return;
    const el = document.querySelector(`[data-control-idx="${focusedControlIndex}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedControlIndex, step]);

  if (!canEdit) {
    return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">You need at least analyst access to use the Assessment Wizard.</div></div>;
  }

  const stepOrder: WizardStep[] = ['select', 'assess', 'review', 'complete'];
  const currentStepIndex = stepOrder.indexOf(step);
  const systemName = systems.find(s => s.id === selectedSystem)?.name || '';
  const frameworkName = frameworks.find(f => f.id === selectedFramework)?.name || '';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {WIZARD_STEPS.map((label, i) => {
          const isActive = i === currentStepIndex;
          const isDone = i < currentStepIndex;
          return (
            <React.Fragment key={label}>
              {i > 0 && <div className={`h-px flex-1 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-blue-100 text-blue-700' : isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {isDone && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ==================== SELECT STEP ==================== */}
      {step === 'select' && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Framework Assessment Wizard</h1>
          <p className="text-gray-500 text-sm mb-6">Quickly assess all controls in a framework for a specific system using keyboard shortcuts and bulk actions.</p>

          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
                <select value={selectedSystem} onChange={e => setSelectedSystem(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select a system...</option>
                  {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
                <select value={selectedFramework} onChange={e => setSelectedFramework(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select a framework...</option>
                  {frameworks.map(f => <option key={f.id} value={f.id}>{f.name} {f.version}</option>)}
                </select>
              </div>
            </div>

            {/* Preview stats */}
            {previewStats && !loadingPreview && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Existing Progress</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="text-green-600 font-medium">{previewStats.implemented || 0} implemented</span>
                  <span>{previewStats.partially_implemented || 0} partial</span>
                  <span>{previewStats.planned || 0} planned</span>
                  <span className="text-red-600">{previewStats.not_implemented || 0} not assessed</span>
                </div>
                {previewStats.total > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${previewStats.compliance_percentage || 0}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{previewStats.compliance_percentage || 0}% assessed</p>
                  </div>
                )}
              </div>
            )}
            {loadingPreview && <div className="mt-4 text-xs text-gray-400">Loading progress...</div>}

            <button
              onClick={startAssessment}
              disabled={!selectedSystem || !selectedFramework || loading}
              className="mt-6 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading controls...' : previewStats && previewStats.total > 0 && (previewStats.not_implemented || 0) < previewStats.total ? 'Continue Assessment' : 'Start Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== ASSESS STEP ==================== */}
      {step === 'assess' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{frameworkName}</h1>
              <p className="text-sm text-gray-500">System: {systemName} &middot; {assessedControls}/{totalControls} assessed ({compliancePct}%)</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('select')} className="px-3 py-1.5 text-xs text-gray-600 border rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => setStep('review')} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Review</button>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${compliancePct}%` }} />
          </div>

          {/* Two-column layout */}
          <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ minHeight: '60vh' }}>
            {/* Family sidebar */}
            <div className="w-52 flex-shrink-0 border-r border-gray-200 overflow-y-auto bg-gray-50">
              {families.map((family, idx) => {
                const stats = familyStats[family];
                const isActive = idx === activeFamilyIndex;
                const isComplete = stats?.assessed === stats?.total;
                return (
                  <button
                    key={family}
                    onClick={() => { setActiveFamilyIndex(idx); setFocusedControlIndex(0); setExpandedControlId(null); }}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 ${
                      isActive ? 'bg-blue-50 border-r-2 border-r-blue-600 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-mono text-xs">{family}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isComplete ? 'bg-green-100 text-green-700' : stats?.assessed > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {stats?.assessed || 0}/{stats?.total || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Family bulk bar */}
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{families[activeFamilyIndex]} &middot; {familyControls.length} controls</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 mr-2">Bulk:</span>
                  {[
                    { status: 'implemented', label: 'All Impl', cls: 'hover:bg-green-50 text-green-700' },
                    { status: 'not_applicable', label: 'All N/A', cls: 'hover:bg-gray-100 text-gray-600' },
                    { status: 'planned', label: 'All Planned', cls: 'hover:bg-blue-50 text-blue-700' },
                  ].map(b => (
                    <button key={b.status} onClick={() => bulkFamilyAction(b.status)} disabled={bulkApplying}
                      className={`text-[10px] px-2 py-1 border border-gray-300 rounded font-medium ${b.cls} disabled:opacity-40`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control rows */}
              <div className="flex-1 overflow-y-auto">
                {familyControls.map((ctrl, idx) => {
                  const impl = implementations[ctrl.control_id];
                  const currentStatus = impl?.status || 'not_implemented';
                  const isAssessed = currentStatus !== 'not_implemented';
                  const isFocused = idx === focusedControlIndex;
                  const isExpanded = expandedControlId === ctrl.control_id;
                  const isSaving = savingControlId === ctrl.control_id;

                  return (
                    <div key={ctrl.control_id} data-control-idx={idx}>
                      <div className={`px-4 py-2.5 flex items-center gap-3 border-b border-gray-100 transition-colors ${
                        isFocused ? 'ring-2 ring-inset ring-blue-300 bg-blue-50/30' : ''
                      } ${!isAssessed ? 'bg-amber-50/20' : ''}`}>
                        {/* Dot */}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isAssessed ? 'bg-green-500' : 'bg-gray-300'}`} />

                        {/* Control info */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(ctrl.control_id)}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-blue-700">{ctrl.control_id}</span>
                            <span className="text-sm text-gray-900 truncate">{ctrl.title}</span>
                            {ctrl.priority && <span className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded">{ctrl.priority}</span>}
                            {ctrl.is_enhancement === 1 && <span className="text-[10px] px-1 py-0.5 bg-indigo-50 text-indigo-500 rounded">ENH</span>}
                          </div>
                        </div>

                        {/* Quick-set buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {[
                            { s: 'implemented', l: 'Impl', ac: 'bg-green-600 text-white border-green-600', in: 'border-gray-300 text-gray-500 hover:bg-green-50' },
                            { s: 'not_applicable', l: 'N/A', ac: 'bg-gray-600 text-white border-gray-600', in: 'border-gray-300 text-gray-500 hover:bg-gray-50' },
                            { s: 'planned', l: 'Plan', ac: 'bg-blue-600 text-white border-blue-600', in: 'border-gray-300 text-gray-500 hover:bg-blue-50' },
                          ].map(b => (
                            <button key={b.s} onClick={() => updateControlStatus(ctrl.control_id, b.s)}
                              className={`text-[10px] px-2 py-1 rounded border font-medium ${currentStatus === b.s ? b.ac : b.in}`}>
                              {b.l}
                            </button>
                          ))}
                        </div>

                        {/* Full dropdown */}
                        <select
                          value={currentStatus}
                          onChange={e => updateControlStatus(ctrl.control_id, e.target.value)}
                          className={`text-xs px-2 py-1.5 rounded-lg border font-medium w-28 ${statusColor(currentStatus)}`}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>

                        {/* Saving indicator */}
                        {isSaving && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          {ctrl.description && <p className="text-xs text-gray-600 mb-2">{ctrl.description}</p>}
                          {ctrl.guidance && <p className="text-xs text-gray-400 mb-3 italic">{ctrl.guidance}</p>}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">Implementation Description</label>
                              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" placeholder="Describe how this control is implemented..." />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">Responsible Role</label>
                              <input value={editRole} onChange={e => setEditRole(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" placeholder="e.g. System Administrator" />
                              {impl?.ai_narrative && (
                                <div className="mt-2">
                                  <label className="text-xs font-medium text-gray-700 mb-1 block">AI Narrative</label>
                                  <p className="text-xs text-gray-500 bg-white rounded border p-2 max-h-20 overflow-y-auto">{impl.ai_narrative}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <button onClick={() => saveDetails(ctrl.control_id)} disabled={savingDetails}
                            className="mt-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {savingDetails ? 'Saving...' : 'Save Details'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Keyboard legend */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-400">
                <span className="font-medium text-gray-500">Keyboard:</span>{' '}
                <span className="font-mono">↑↓</span> or <span className="font-mono">j/k</span> navigate &middot;{' '}
                <span className="font-mono">←→</span> switch family &middot;{' '}
                <span className="font-mono">1</span>=Impl <span className="font-mono">2</span>=Partial <span className="font-mono">3</span>=Planned{' '}
                <span className="font-mono">4</span>=Alt <span className="font-mono">5</span>=N/A <span className="font-mono">6</span>=Not Impl &middot;{' '}
                <span className="font-mono">Enter</span>=expand
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REVIEW STEP ==================== */}
      {step === 'review' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assessment Review</h1>
              <p className="text-sm text-gray-500">{frameworkName} &middot; {systemName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('assess')} className="px-3 py-1.5 text-xs text-gray-600 border rounded-lg hover:bg-gray-50">Back to Assessment</button>
              <button onClick={() => setStep('complete')} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">Complete</button>
            </div>
          </div>

          {/* Overall progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Overall Progress</h2>
              <span className="text-2xl font-bold text-blue-700">{compliancePct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${compliancePct}%` }} />
            </div>
            <p className="text-sm text-gray-500">{assessedControls} of {totalControls} controls assessed</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Status Distribution</h2>
              <div className="space-y-2">
                {STATUS_OPTIONS.map(opt => {
                  const count = statusDistribution[opt.value] || 0;
                  const pct = totalControls > 0 ? (count / totalControls) * 100 : 0;
                  return (
                    <div key={opt.value} className="flex items-center gap-2">
                      <span className="text-xs w-20 text-right text-gray-600">{opt.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4">
                        <div className={`h-4 rounded-full ${opt.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs w-8 text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-family completion */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Per-Family Completion</h2>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {families.map(f => {
                  const s = familyStats[f];
                  const pct = s?.total > 0 ? Math.round((s.assessed / s.total) * 100) : 0;
                  return (
                    <div key={f} className="flex items-center gap-2">
                      <span className="font-mono text-xs w-8 text-gray-600">{f}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-400' : 'bg-gray-300'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 w-16 text-right">{s?.assessed}/{s?.total} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gaps */}
          {gaps.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Gaps ({gaps.length} controls not assessed)</h2>
              <div className="space-y-1">
                {(showAllGaps ? gaps : gaps.slice(0, 10)).map(c => (
                  <div key={c.control_id} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-red-600 w-16">{c.control_id}</span>
                    <span className="text-gray-700 truncate">{c.title}</span>
                  </div>
                ))}
              </div>
              {gaps.length > 10 && !showAllGaps && (
                <button onClick={() => setShowAllGaps(true)} className="mt-2 text-xs text-blue-600 hover:underline">Show all {gaps.length} gaps</button>
              )}
            </div>
          )}

          {/* AI Narratives */}
          {missingNarratives.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-2">AI Narrative Generation</h2>
              <p className="text-sm text-gray-500 mb-3">{missingNarratives.length} implemented controls are missing narratives.</p>
              <button
                onClick={generateMissingNarratives}
                disabled={generatingNarratives}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {generatingNarratives ? narrativeProgress || 'Generating...' : `Generate Narratives for ${missingNarratives.length} Controls`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== COMPLETE STEP ==================== */}
      {step === 'complete' && (
        <div className="text-center py-12 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
          <p className="text-gray-500 mb-6">{frameworkName} &middot; {systemName}</p>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{assessedControls}</p>
                <p className="text-xs text-gray-500">Assessed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalControls}</p>
                <p className="text-xs text-gray-500">Total Controls</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{compliancePct}%</p>
                <p className="text-xs text-gray-500">Compliance</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link to="/controls" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">View Controls</Link>
            <Link to="/reports" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Reports</Link>
            <button onClick={() => { setStep('select'); setAllControls([]); setImplementations({}); setFamilies([]); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              Assess Another Framework
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
