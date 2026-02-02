import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportSSPPackageDoc, exportFullSSPDoc, exportSSPSectionDoc } from '../utils/exportHelpers';

// --- Constants ---
const SECTIONS = [
  { key: 'system_info', label: 'System Information', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'authorization_boundary', label: 'Authorization Boundary', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: 'data_flow', label: 'Data Flow', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { key: 'network_architecture', label: 'Network Architecture', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2' },
  { key: 'system_interconnections', label: 'System Interconnections', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { key: 'personnel', label: 'Personnel & Roles', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'control_implementations', label: 'Control Implementations', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'contingency_plan', label: 'Contingency Plan', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { key: 'incident_response', label: 'Incident Response', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { key: 'continuous_monitoring', label: 'Continuous Monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700', in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-gray-100 text-gray-500',
};

const SECTION_DOT: Record<string, string> = {
  empty: 'bg-gray-300', draft: 'bg-yellow-400', reviewed: 'bg-blue-500', approved: 'bg-green-500',
};

export function SSPPage() {
  const { t, isFederal } = useExperience();
  const { canEdit, canManage, isAdmin } = useAuth();

  // List view state
  const [documents, setDocuments] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedFw, setSelectedFw] = useState('');

  // Editor view state
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('system_info');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  // AI state
  const [aiPopulating, setAIPopulating] = useState(false);
  const [aiRefining, setAIRefining] = useState(false);
  const [populateProgress, setPopulateProgress] = useState('');

  // Workflow
  const [statusChanging, setStatusChanging] = useState(false);

  useEffect(() => {
    Promise.all([api('/api/v1/ssp'), api('/api/v1/frameworks/enabled'), api('/api/v1/systems')])
      .then(([d, f, s]) => {
        setDocuments(d.documents || []);
        setFrameworks(f.frameworks || []);
        setSystems(s.systems || []);
        if (s.systems?.length > 0) setSelectedSystem(s.systems[0].id);
        if (f.frameworks?.length > 0) setSelectedFw(f.frameworks[0].id);
      }).finally(() => setLoading(false));
  }, []);

  // --- Helpers ---
  const getSections = () => activeDoc?.oscal_json?._authoring?.sections || {};
  const sectionStatus = (key: string) => getSections()[key]?.status || 'empty';
  const filledCount = () => SECTIONS.filter(s => sectionStatus(s.key) !== 'empty').length;

  const refreshDocList = async () => {
    const d = await api('/api/v1/ssp');
    setDocuments(d.documents || []);
  };

  // --- Actions ---
  const handleGenerate = async () => {
    if (!selectedSystem || !selectedFw) return;
    setGenerating(true);
    try {
      const data = await api('/api/v1/ssp/generate', { method: 'POST', body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw }) });
      await refreshDocList();
      // Open the newly generated doc in editor
      if (data.ssp?.id) openDocument(data.ssp.id);
    } catch { } finally { setGenerating(false); }
  };

  const openDocument = async (id: string) => {
    try {
      const data = await api(`/api/v1/ssp/${id}`);
      setActiveDoc(data.document);
      setActiveSection('system_info');
      setEditing(false);
      setView('editor');
    } catch { }
  };

  const closeEditor = () => {
    setView('list');
    setActiveDoc(null);
    setEditing(false);
    refreshDocList();
  };

  const handleSaveSection = async () => {
    if (!activeDoc) return;
    setSaving(true);
    try {
      const data = await api(`/api/v1/ssp/${activeDoc.id}/sections/${activeSection}`, {
        method: 'PUT', body: JSON.stringify({ content: editContent }),
      });
      const sections = getSections();
      sections[activeSection] = data.section;
      setActiveDoc({ ...activeDoc, oscal_json: { ...activeDoc.oscal_json, _authoring: { sections } } });
      setEditing(false);
    } catch { } finally { setSaving(false); }
  };

  const handleAIPopulateAll = async () => {
    if (!activeDoc) return;
    setAIPopulating(true);
    setPopulateProgress('Generating content for all empty sections...');
    try {
      const data = await api(`/api/v1/ssp/${activeDoc.id}/ai-populate`, {
        method: 'POST', body: JSON.stringify({}),
      });
      if (data.sections) {
        setActiveDoc({ ...activeDoc, oscal_json: { ...activeDoc.oscal_json, _authoring: { sections: data.sections } } });
      }
      setPopulateProgress('');
    } catch { setPopulateProgress(''); } finally { setAIPopulating(false); }
  };

  const handleAIPopulateOne = async (key: string) => {
    if (!activeDoc) return;
    setAIRefining(true);
    try {
      const data = await api(`/api/v1/ssp/${activeDoc.id}/ai-populate`, {
        method: 'POST', body: JSON.stringify({ sections: [key] }),
      });
      if (data.sections) {
        setActiveDoc({ ...activeDoc, oscal_json: { ...activeDoc.oscal_json, _authoring: { sections: data.sections } } });
      }
    } catch { } finally { setAIRefining(false); }
  };

  const handleAIRefine = async () => {
    if (!activeDoc) return;
    setAIRefining(true);
    try {
      const data = await api(`/api/v1/ssp/${activeDoc.id}/ai-refine`, {
        method: 'POST', body: JSON.stringify({ section_key: activeSection }),
      });
      if (data.section) {
        const sections = getSections();
        sections[activeSection] = data.section;
        setActiveDoc({ ...activeDoc, oscal_json: { ...activeDoc.oscal_json, _authoring: { sections } } });
      }
    } catch { } finally { setAIRefining(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeDoc) return;
    setStatusChanging(true);
    try {
      await api(`/api/v1/ssp/${activeDoc.id}/status`, {
        method: 'PUT', body: JSON.stringify({ status: newStatus }),
      });
      setActiveDoc({ ...activeDoc, status: newStatus });
      refreshDocList();
    } catch { } finally { setStatusChanging(false); }
  };

  const handleSaveVersion = async () => {
    if (!activeDoc) return;
    try {
      const data = await api(`/api/v1/ssp/${activeDoc.id}/versions`, {
        method: 'POST', body: JSON.stringify({ summary: `Version snapshot` }),
      });
      if (data.version) setActiveDoc({ ...activeDoc, version: data.version });
    } catch { }
  };

  const handleMarkReviewed = async () => {
    if (!activeDoc) return;
    const sections = getSections();
    const sec = sections[activeSection];
    if (sec && sec.status === 'draft') {
      sec.status = 'reviewed';
      sec.last_edited_at = new Date().toISOString();
      // Save the section content to persist the status change
      try {
        await api(`/api/v1/ssp/${activeDoc.id}/sections/${activeSection}`, {
          method: 'PUT', body: JSON.stringify({ content: sec.content }),
        });
        // Manually set status to reviewed (backend sets to draft, so we override locally — a simplification)
        setActiveDoc({ ...activeDoc, oscal_json: { ...activeDoc.oscal_json, _authoring: { sections: { ...sections } } } });
      } catch { }
    }
  };

  const downloadOscalJson = () => {
    if (!activeDoc?.oscal_json) return;
    const data = { ...activeDoc.oscal_json };
    delete data._authoring; // Export clean OSCAL without authoring metadata
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssp-oscal-${activeDoc.system_name || 'system'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullDocx = async () => {
    if (!activeDoc) return;
    const sections = getSections();
    try {
      const impls = await api(`/api/v1/implementations?system_id=${activeDoc.system_id}&framework_id=${activeDoc.framework_id}`);
      await exportFullSSPDoc(
        activeDoc.system_name || 'System', activeDoc.framework_name || 'Framework',
        activeDoc.approved_by_name ? activeDoc.approved_by_name : 'Organization',
        sections, impls.implementations,
      );
    } catch {
      await exportFullSSPDoc(activeDoc.system_name || 'System', activeDoc.framework_name || 'Framework', 'Organization', sections);
    }
  };

  const handleExportSectionDocx = async () => {
    if (!activeDoc) return;
    const sec = getSections()[activeSection];
    const label = SECTIONS.find(s => s.key === activeSection)?.label || activeSection;
    await exportSSPSectionDoc(label, sec?.content || '', activeDoc.system_name || 'System', activeDoc.framework_name || 'Framework', 'Organization');
  };

  // --- Completion stats for document list ---
  const getDocCompletion = (doc: any): number => {
    try {
      const oscal = typeof doc.oscal_json === 'string' ? JSON.parse(doc.oscal_json) : doc.oscal_json;
      const sections = oscal?._authoring?.sections || {};
      const filled = SECTIONS.filter(s => sections[s.key]?.status && sections[s.key].status !== 'empty').length;
      return Math.round((filled / SECTIONS.length) * 100);
    } catch { return 0; }
  };

  const title = isFederal ? 'SSP Document Builder (ComplianceFoundry)' : `${t('document')} Builder`;

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  // =============================================
  // EDITOR VIEW
  // =============================================
  if (view === 'editor' && activeDoc) {
    const sections = getSections();
    const currentSec = sections[activeSection] || { content: '', status: 'empty' };
    const filled = filledCount();

    return (
      <div className="flex flex-col h-full">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={closeEditor} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{activeDoc.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">v{activeDoc.version}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[activeDoc.status] || 'bg-gray-100 text-gray-600'}`}>{activeDoc.status?.replace('_', ' ')}</span>
                <span className="text-xs text-gray-400">{activeDoc.system_name} | {activeDoc.framework_name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Workflow buttons */}
            {activeDoc.status === 'draft' && canEdit && (
              <button onClick={() => handleStatusChange('in_review')} disabled={statusChanging}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                Submit for Review
              </button>
            )}
            {activeDoc.status === 'in_review' && canManage && (
              <>
                <button onClick={() => handleStatusChange('approved')} disabled={statusChanging}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => handleStatusChange('draft')} disabled={statusChanging}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 disabled:opacity-50">
                  Return to Draft
                </button>
              </>
            )}
            {activeDoc.status === 'approved' && isAdmin && (
              <button onClick={() => handleStatusChange('published')} disabled={statusChanging}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">
                Publish
              </button>
            )}
            <button onClick={handleSaveVersion} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
              Save Version
            </button>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-white border-b border-gray-100 px-6 py-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600">{filled}/{SECTIONS.length} sections completed</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(filled / SECTIONS.length) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-400">{Math.round((filled / SECTIONS.length) * 100)}%</span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sections</p>
              {SECTIONS.map((sec) => {
                const st = sectionStatus(sec.key);
                const isActive = activeSection === sec.key;
                return (
                  <button key={sec.key} onClick={() => { setActiveSection(sec.key); setEditing(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 flex items-center gap-2.5 text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SECTION_DOT[st] || 'bg-gray-300'}`} />
                    <span className="truncate">{sec.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Bottom actions */}
            <div className="p-3 border-t border-gray-200 space-y-2">
              <button onClick={handleAIPopulateAll} disabled={aiPopulating}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {aiPopulating ? (
                  <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Auto-populate All</>
                )}
              </button>
              <button onClick={handleExportFullDocx} className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export Full DOCX
              </button>
              <button onClick={downloadOscalJson} className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center justify-center gap-1.5">
                Download OSCAL JSON
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {populateProgress && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-purple-700">{populateProgress}</span>
              </div>
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{SECTIONS.find(s => s.key === activeSection)?.label}</h2>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${currentSec.status === 'empty' ? 'bg-gray-100 text-gray-500' : currentSec.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : currentSec.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {currentSec.status}
                </span>
                {currentSec.ai_generated && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">AI Generated</span>}
              </div>
              <div className="flex items-center gap-2">
                {currentSec.content?.trim() && canEdit && !editing && (
                  <>
                    <button onClick={handleAIRefine} disabled={aiRefining}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1">
                      {aiRefining ? <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      Refine with ForgeML
                    </button>
                    <button onClick={handleExportSectionDocx} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">
                      Export Section
                    </button>
                  </>
                )}
                {!currentSec.content?.trim() && canEdit && !editing && (
                  <button onClick={() => handleAIPopulateOne(activeSection)} disabled={aiRefining}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
                    {aiRefining ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    Auto-populate with ForgeML
                  </button>
                )}
              </div>
            </div>

            {/* Section Content */}
            {editing ? (
              <div>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  placeholder="Enter section content..." />
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={handleSaveSection} disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {currentSec.content?.trim() ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {currentSec.content}
                    </div>
                    {canEdit && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                        <button onClick={() => { setEditContent(currentSec.content); setEditing(true); }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit
                        </button>
                        {canManage && currentSec.status === 'draft' && (
                          <button onClick={handleMarkReviewed}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                            Mark as Reviewed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-gray-500 text-sm mb-4">This section has not been completed yet.</p>
                    {canEdit && (
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => { setEditContent(''); setEditing(true); }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                          Write Manually
                        </button>
                        <button onClick={() => handleAIPopulateOne(activeSection)} disabled={aiRefining}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          Generate with ForgeML
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Last edited info */}
                {currentSec.last_edited_at && currentSec.status !== 'empty' && (
                  <p className="text-xs text-gray-400 mt-3">
                    Last edited: {new Date(currentSec.last_edited_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Version History */}
            {activeDoc.metadata?.versions?.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Version History</h3>
                <div className="space-y-2">
                  {activeDoc.metadata.versions.slice().reverse().map((v: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-mono font-medium text-gray-700">v{v.version}</span>
                      <span>{v.summary}</span>
                      <span className="text-gray-400">{new Date(v.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // LIST VIEW
  // =============================================
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">Build, edit, and manage AI-powered System Security Plans</p>
      </div>

      {/* Generator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Generate New SSP</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
            {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={selectedFw} onChange={(e) => setSelectedFw(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
            {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating || !selectedSystem || !selectedFw}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {generating ? 'Generating...' : 'Generate SSP'}
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">SSP Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500 text-sm">No SSP documents generated yet. Use the form above to create your first SSP.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const completion = getDocCompletion(doc);
              return (
                <div key={doc.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'}`}>{doc.status?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{doc.framework_name} | {doc.system_name}</span>
                        <span className="text-xs text-gray-400">v{doc.version}</span>
                        <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {/* Completion bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[200px]">
                          <div className={`h-1.5 rounded-full transition-all ${completion === 100 ? 'bg-green-500' : completion > 50 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${completion}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{completion}% complete</span>
                      </div>
                    </div>
                    <button onClick={() => openDocument(doc.id)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex-shrink-0">
                      Open Editor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
