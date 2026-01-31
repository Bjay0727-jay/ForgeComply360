import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

export function ControlsPage() {
  const { t, nav } = useExperience();
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
  const [narrativePreview, setNarrativePreview] = useState<Record<string, string>>({});

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
    if (!selectedSystem || !selectedFw) return;
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
    if (!selectedSystem || !selectedFw) return;
    setGeneratingNarrative(controlId);
    try {
      const result = await api('/api/v1/ai/narrative', {
        method: 'POST',
        body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw, control_id: controlId }),
      });
      setNarrativePreview(prev => ({ ...prev, [controlId]: result.narrative }));
      // Update implementation to reflect narrative exists
      setImplementations(prev => ({ ...prev, [controlId]: { ...prev[controlId], ai_narrative: result.narrative } }));
    } catch { } finally { setGeneratingNarrative(''); }
  };

  const statusOptions = [
    { value: 'implemented', label: 'Implemented', color: 'bg-green-100 text-green-700' },
    { value: 'partially_implemented', label: 'Partial', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'planned', label: 'Planned', color: 'bg-blue-100 text-blue-700' },
    { value: 'alternative', label: 'Alternative', color: 'bg-purple-100 text-purple-700' },
    { value: 'not_applicable', label: 'N/A', color: 'bg-gray-100 text-gray-600' },
    { value: 'not_implemented', label: 'Not Impl', color: 'bg-red-100 text-red-700' },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{nav('controls')}</h1>
        <p className="text-gray-500 text-sm mt-1">Browse and implement {t('control').toLowerCase()}s</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={selectedFw} onChange={(e) => { setSelectedFw(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
            {frameworks.map((fw) => <option key={fw.id} value={fw.id}>{fw.name}</option>)}
            {frameworks.length === 0 && <option>No frameworks enabled</option>}
          </select>
          <select value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
            {systems.map((sys) => <option key={sys.id} value={sys.id}>{sys.name}</option>)}
            {systems.length === 0 && <option>No systems created</option>}
          </select>
          <input type="text" placeholder={`Search ${t('control').toLowerCase()}s...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      {/* Controls list */}
      <div className="space-y-2">
        {controls.map((ctrl) => {
          const impl = implementations[ctrl.control_id];
          const currentStatus = impl?.status || 'not_implemented';
          return (
            <div key={ctrl.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-blue-700">{ctrl.control_id}</span>
                    <span className="text-sm font-medium text-gray-900">{ctrl.title}</span>
                    <span className="text-xs text-gray-400">{ctrl.family}</span>
                  </div>
                  {ctrl.description && <p className="text-xs text-gray-500 line-clamp-2">{ctrl.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                  <select
                    value={currentStatus}
                    onChange={(e) => updateStatus(ctrl.control_id, e.target.value)}
                    disabled={saving === ctrl.control_id || !selectedSystem}
                    className={`text-xs px-2 py-1.5 rounded-lg border font-medium ${statusOptions.find((s) => s.value === currentStatus)?.color || ''}`}
                  >
                    {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              {/* AI Narrative Preview */}
              {narrativePreview[ctrl.control_id] && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="text-xs font-medium text-purple-700">AI-Generated Narrative</span>
                    <button onClick={() => setNarrativePreview(prev => { const next = { ...prev }; delete next[ctrl.control_id]; return next; })} className="ml-auto text-xs text-purple-500 hover:text-purple-700">Hide</button>
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{narrativePreview[ctrl.control_id]}</p>
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
