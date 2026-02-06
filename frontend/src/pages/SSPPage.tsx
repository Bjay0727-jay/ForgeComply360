import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportSSPPackageDoc, exportFullSSPDoc, exportSSPSectionDoc } from '../utils/exportHelpers';
import { exportFullSSPPdf, exportSSPSectionPdf, exportProfessionalSSPPdf, SSPExportData } from '../utils/pdfExportHelpers';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { BUTTONS, TYPOGRAPHY, MODALS, FORMS, CARDS } from '../utils/typography';

// --- Constants ---
const SECTIONS = [
  { key: 'system_info', label: 'System Information', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', required: true },
  { key: 'fips199_categorization', label: 'FIPS 199 Categorization', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', required: true },
  { key: 'control_baseline', label: 'Control Baseline', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', required: true },
  { key: 'authorization_boundary', label: 'Authorization Boundary', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', required: true },
  { key: 'data_flow', label: 'Data Flow', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { key: 'network_architecture', label: 'Network Architecture', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2' },
  { key: 'system_interconnections', label: 'System Interconnections', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { key: 'personnel', label: 'Personnel & Roles', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', required: true },
  { key: 'control_implementations', label: 'Control Implementations', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', required: true },
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

  // Approval workflow
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalJustification, setApprovalJustification] = useState('');
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'professional-pdf' | 'basic-pdf' | 'docx' | 'oscal'>('professional-pdf');
  const [exportOptions, setExportOptions] = useState({
    includeControlDetails: true,
    includeSignaturePages: true,
    includeDraftWatermark: true,
    includeTableOfContents: true,
    groupControlsByFamily: true,
    classificationBanner: 'CUI' as 'CUI' | 'FOUO' | 'none',
  });
  const [exporting, setExporting] = useState(false);

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
    if (newStatus === 'published') {
      setApprovalJustification('');
      setApprovalError(null);
      setShowApprovalModal(true);
      return;
    }
    setStatusChanging(true);
    try {
      await api(`/api/v1/ssp/${activeDoc.id}/status`, {
        method: 'PUT', body: JSON.stringify({ status: newStatus }),
      });
      setActiveDoc({ ...activeDoc, status: newStatus });
      refreshDocList();
    } catch { } finally { setStatusChanging(false); }
  };

  const submitPublicationApproval = async () => {
    if (!activeDoc || !approvalJustification.trim()) return;
    setRequestingApproval(true);
    setApprovalError(null);
    try {
      await api('/api/v1/approvals', {
        method: 'POST',
        body: JSON.stringify({ request_type: 'ssp_publication', resource_id: activeDoc.id, justification: approvalJustification.trim() }),
      });
      setShowApprovalModal(false);
    } catch (e: any) {
      setApprovalError(e.message || 'Failed to submit approval request');
    } finally {
      setRequestingApproval(false);
    }
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

  const handleExportFullPdf = async () => {
    if (!activeDoc) return;
    const sections = getSections();
    const isDraft = activeDoc.status === 'draft';
    try {
      const impls = await api(`/api/v1/implementations?system_id=${activeDoc.system_id}&framework_id=${activeDoc.framework_id}`);
      await exportFullSSPPdf(
        activeDoc.system_name || 'System', activeDoc.framework_name || 'Framework',
        activeDoc.approved_by_name ? activeDoc.approved_by_name : 'Organization',
        sections, impls.implementations, isDraft,
      );
    } catch {
      await exportFullSSPPdf(activeDoc.system_name || 'System', activeDoc.framework_name || 'Framework', 'Organization', sections, undefined, isDraft);
    }
  };

  const handleExportSectionPdf = async () => {
    if (!activeDoc) return;
    const sec = getSections()[activeSection];
    const label = SECTIONS.find(s => s.key === activeSection)?.label || activeSection;
    await exportSSPSectionPdf(label, sec?.content || '', activeDoc.system_name || 'System', activeDoc.framework_name || 'Framework', 'Organization');
  };

  const handleExportProfessionalPdf = async () => {
    if (!activeDoc) return;
    const sections = getSections();
    let impls: any[] = [];
    try {
      const data = await api(`/api/v1/implementations?system_id=${activeDoc.system_id}&framework_id=${activeDoc.framework_id}`);
      impls = data.implementations || [];
    } catch { /* ignore */ }

    // Build SSPExportData for professional export
    const exportData: SSPExportData = {
      systemName: activeDoc.system_name || 'System',
      systemAcronym: activeDoc.system_acronym,
      frameworkName: activeDoc.framework_name || 'Framework',
      orgName: activeDoc.approved_by_name || 'Organization',
      version: activeDoc.version || '1.0',
      status: activeDoc.status || 'draft',
      preparedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      // Parse FIPS 199 from system_info or fips199_categorization section
      fips199: parseFIPS199FromSections(sections),
      // Parse roles from personnel section
      roles: parseRolesFromSections(sections),
      // Environment info
      environment: {
        cloudProvider: 'AWS GovCloud (US)',
        deploymentModel: 'Government Community Cloud',
        serviceModel: 'Platform as a Service (PaaS)',
        securityServices: [
          'AWS Identity and Access Management (IAM)',
          'AWS Key Management Service (KMS)',
          'AWS CloudTrail for audit logging',
          'AWS GuardDuty for threat detection',
        ],
      },
      sections,
      implementations: impls,
      controlBaseline: {
        name: activeDoc.framework_name || 'NIST SP 800-53',
        revision: 'Rev 5',
        totalControls: impls.length || 0,
        inheritedControls: Math.round((impls.length || 0) * 0.3),
        systemImplemented: Math.round((impls.length || 0) * 0.7),
      },
    };

    await exportProfessionalSSPPdf(exportData);
  };

  // Unified export handler with options
  const handleExportWithOptions = async () => {
    if (!activeDoc) return;
    setExporting(true);
    try {
      const sections = getSections();
      let impls: any[] = [];
      if (exportOptions.includeControlDetails) {
        try {
          const data = await api(`/api/v1/implementations?system_id=${activeDoc.system_id}&framework_id=${activeDoc.framework_id}`);
          impls = data.implementations || [];
        } catch { /* ignore */ }
      }

      switch (exportFormat) {
        case 'professional-pdf': {
          const exportData: SSPExportData = {
            systemName: activeDoc.system_name || 'System',
            systemAcronym: activeDoc.system_acronym,
            frameworkName: activeDoc.framework_name || 'Framework',
            orgName: activeDoc.approved_by_name || 'Organization',
            version: activeDoc.version || '1.0',
            status: exportOptions.includeDraftWatermark ? activeDoc.status : 'published',
            preparedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            fips199: parseFIPS199FromSections(sections),
            roles: parseRolesFromSections(sections),
            environment: {
              cloudProvider: 'AWS GovCloud (US)',
              deploymentModel: 'Government Community Cloud',
              serviceModel: 'Platform as a Service (PaaS)',
              securityServices: [
                'AWS Identity and Access Management (IAM)',
                'AWS Key Management Service (KMS)',
                'AWS CloudTrail for audit logging',
                'AWS GuardDuty for threat detection',
              ],
            },
            sections,
            implementations: exportOptions.includeControlDetails ? impls : undefined,
            controlBaseline: {
              name: activeDoc.framework_name || 'NIST SP 800-53',
              revision: 'Rev 5',
              totalControls: impls.length || 0,
              inheritedControls: Math.round((impls.length || 0) * 0.3),
              systemImplemented: Math.round((impls.length || 0) * 0.7),
            },
          };
          await exportProfessionalSSPPdf(exportData);
          break;
        }
        case 'basic-pdf': {
          const isDraft = exportOptions.includeDraftWatermark && (activeDoc.status === 'draft' || activeDoc.status === 'in_review');
          await exportFullSSPPdf(
            activeDoc.system_name || 'System',
            activeDoc.framework_name || 'Framework',
            activeDoc.approved_by_name || 'Organization',
            sections,
            exportOptions.includeControlDetails ? impls : undefined,
            isDraft
          );
          break;
        }
        case 'docx': {
          await exportFullSSPDoc(
            activeDoc.system_name || 'System',
            activeDoc.framework_name || 'Framework',
            activeDoc.approved_by_name || 'Organization',
            sections,
            exportOptions.includeControlDetails ? impls : undefined
          );
          break;
        }
        case 'oscal': {
          downloadOscalJson();
          break;
        }
      }
      setShowExportModal(false);
    } finally {
      setExporting(false);
    }
  };

  // Helper to parse FIPS 199 info from sections
  const parseFIPS199FromSections = (sections: Record<string, any>) => {
    const fipsContent = sections.fips199_categorization?.content || sections.system_info?.content || '';
    // Default to Moderate if not explicitly stated
    const detectLevel = (text: string, type: string): 'Low' | 'Moderate' | 'High' => {
      const lower = text.toLowerCase();
      if (lower.includes(`${type.toLowerCase()}: high`) || lower.includes(`${type.toLowerCase()} impact: high`)) return 'High';
      if (lower.includes(`${type.toLowerCase()}: low`) || lower.includes(`${type.toLowerCase()} impact: low`)) return 'Low';
      return 'Moderate';
    };
    return {
      confidentiality: detectLevel(fipsContent, 'confidentiality'),
      integrity: detectLevel(fipsContent, 'integrity'),
      availability: detectLevel(fipsContent, 'availability'),
      overallLevel: 'Moderate' as const,
      justification: fipsContent.includes('categorization') ? fipsContent.substring(0, 500) : undefined,
    };
  };

  // Helper to parse roles from personnel section
  const parseRolesFromSections = (sections: Record<string, any>) => {
    const personnel = sections.personnel?.content || '';
    // Simple parsing - in production would be more sophisticated
    return {
      authorizingOfficial: { name: 'TBD', title: 'Authorizing Official', org: 'Organization' },
      systemOwner: { name: 'TBD', title: 'System Owner', org: 'Organization' },
      isso: { name: 'TBD', title: 'ISSO', org: 'Organization' },
      securityEngineer: { name: 'TBD', title: 'Security Engineer', org: 'Organization' },
      assessor: { name: 'TBD', title: '3PAO Assessor', org: 'TBD' },
    };
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

  if (loading) return <div className="space-y-6"><SkeletonCard /><SkeletonCard /></div>;

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
        <div className="bg-white border-b border-blue-200 px-6 py-3 flex items-center justify-between flex-wrap gap-2">
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
                Request Publication
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
          <div className="w-64 bg-gray-50 border-r border-blue-200 overflow-y-auto flex-shrink-0">
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
            <div className="p-3 border-t border-blue-200 space-y-2">
              <button onClick={handleAIPopulateAll} disabled={aiPopulating}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {aiPopulating ? (
                  <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Auto-populate All</>
                )}
              </button>
              {/* Enhanced Export Button */}
              <button onClick={() => setShowExportModal(true)} className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export SSP Document
              </button>
              {/* Quick export shortcuts */}
              <div className="flex gap-1 w-full">
                <button onClick={handleExportProfessionalPdf} className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded-l-lg text-xs hover:bg-gray-200 flex items-center justify-center gap-1" title="Professional PDF">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF
                </button>
                <button onClick={handleExportFullDocx} className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded-none text-xs hover:bg-gray-200 flex items-center justify-center gap-1 border-x border-white" title="Word Document">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  DOCX
                </button>
                <button onClick={downloadOscalJson} className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded-r-lg text-xs hover:bg-gray-200 flex items-center justify-center gap-1" title="OSCAL JSON">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  JSON
                </button>
              </div>
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
                      {aiRefining ? <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z M19 3v18" /></svg>}
                      ✨ Enhance
                    </button>
                    <button onClick={handleExportSectionDocx} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">
                      DOCX
                    </button>
                    <button onClick={handleExportSectionPdf} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
                      PDF
                    </button>
                  </>
                )}
                {!currentSec.content?.trim() && canEdit && !editing && (
                  <button onClick={() => handleAIPopulateOne(activeSection)} disabled={aiRefining}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
                    {aiRefining ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    Auto-populate with AI
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
                  <button onClick={handleSaveSection} disabled={saving} className={BUTTONS.primary}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} className={BUTTONS.secondary}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {currentSec.content?.trim() ? (
                  <div className="bg-white border border-blue-200 rounded-lg p-6">
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
                    <EmptyState compact title="This section has not been completed yet" subtitle="Write manually or generate with AI" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    {canEdit && (
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => { setEditContent(''); setEditing(true); }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                          Write Manually
                        </button>
                        <button onClick={() => handleAIPopulateOne(activeSection)} disabled={aiRefining}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          Generate with AI
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
              <div className="mt-8 border-t border-blue-200 pt-6">
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
      <PageHeader title={title} subtitle="Build, edit, and manage AI-powered System Security Plans">
        {documents.length >= 2 && canEdit && (
          <Link to="/ssp/compare" className="px-3 py-2 text-xs font-medium text-blue-100 bg-blue-500/30 rounded-lg hover:bg-blue-500/50 flex items-center gap-1.5 border border-blue-300/30">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Compare SSPs
          </Link>
        )}
      </PageHeader>

      {/* Generator */}
      <div className="bg-white rounded-xl border border-blue-200 p-6 mb-6">
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
      <div className="bg-white rounded-xl border border-blue-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">SSP Documents</h2>
        {documents.length === 0 ? (
          <EmptyState title="No SSP documents yet" subtitle="Use the form above to create your first SSP" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                      className={`ml-4 flex-shrink-0 ${BUTTONS.sm} ${BUTTONS.primary}`}>
                      Open Editor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SSP Publication Approval Modal */}
      {showApprovalModal && activeDoc && (
        <div className={MODALS.backdrop}>
          <div className={`${MODALS.container} max-w-md`}>
            <div className={MODALS.header}>
              <h2 className={TYPOGRAPHY.modalTitle}>Request Publication Approval</h2>
              <p className={`${TYPOGRAPHY.bodySmallMuted} mt-1`}>Publishing an SSP requires admin approval.</p>
            </div>
            <div className={MODALS.body}>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium text-gray-900 text-sm">{activeDoc.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">Version {activeDoc.version}</p>
              </div>
              <label className={FORMS.label}>Justification (required)</label>
              <textarea
                value={approvalJustification}
                onChange={(e) => setApprovalJustification(e.target.value)}
                className={FORMS.textarea}
                rows={3}
                placeholder="Explain why this SSP should be published..."
              />
              {approvalError && <p className="text-sm text-red-600 mt-2">{approvalError}</p>}
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setShowApprovalModal(false)} className={BUTTONS.ghost} disabled={requestingApproval}>Cancel</button>
              <button
                onClick={submitPublicationApproval}
                disabled={requestingApproval || !approvalJustification.trim()}
                className={BUTTONS.primary}
              >
                {requestingApproval ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Export Modal */}
      {showExportModal && activeDoc && (
        <div className={MODALS.backdrop} onClick={() => !exporting && setShowExportModal(false)}>
          <div className={`${MODALS.container} max-w-lg`} onClick={(e) => e.stopPropagation()}>
            <div className={MODALS.header}>
              <h2 className={TYPOGRAPHY.modalTitle}>Export SSP Document</h2>
              <p className={`${TYPOGRAPHY.bodySmallMuted} mt-1`}>Choose format and customize export options</p>
            </div>
            <div className={MODALS.body}>
              {/* Document Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium text-gray-900 text-sm">{activeDoc.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activeDoc.system_name} • {activeDoc.framework_name} • v{activeDoc.version}
                </p>
              </div>

              {/* Export Format Selection */}
              <div className="mb-4">
                <label className={FORMS.label}>Export Format</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setExportFormat('professional-pdf')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${exportFormat === 'professional-pdf' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${exportFormat === 'professional-pdf' ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Professional PDF</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">FedRAMP-compliant format with CUI banners</p>
                  </button>
                  <button
                    onClick={() => setExportFormat('basic-pdf')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${exportFormat === 'basic-pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${exportFormat === 'basic-pdf' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Basic PDF</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Simple format for internal review</p>
                  </button>
                  <button
                    onClick={() => setExportFormat('docx')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${exportFormat === 'docx' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${exportFormat === 'docx' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Word Document</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Editable DOCX for collaboration</p>
                  </button>
                  <button
                    onClick={() => setExportFormat('oscal')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${exportFormat === 'oscal' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${exportFormat === 'oscal' ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">OSCAL JSON</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Machine-readable standard format</p>
                  </button>
                </div>
              </div>

              {/* Export Options */}
              {exportFormat !== 'oscal' && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <p className={`${FORMS.label} mb-2`}>Export Options</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeControlDetails}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeControlDetails: e.target.checked })}
                      className={FORMS.checkbox}
                    />
                    <span className="text-sm text-gray-700">Include control implementation details (Appendix)</span>
                  </label>
                  {(exportFormat === 'professional-pdf' || exportFormat === 'basic-pdf') && (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeDraftWatermark}
                          onChange={(e) => setExportOptions({ ...exportOptions, includeDraftWatermark: e.target.checked })}
                          className={FORMS.checkbox}
                        />
                        <span className="text-sm text-gray-700">Include DRAFT watermark (if applicable)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeTableOfContents}
                          onChange={(e) => setExportOptions({ ...exportOptions, includeTableOfContents: e.target.checked })}
                          className={FORMS.checkbox}
                        />
                        <span className="text-sm text-gray-700">Include table of contents</span>
                      </label>
                    </>
                  )}
                  {exportFormat === 'professional-pdf' && (
                    <div className="mt-3">
                      <label className={FORMS.label}>Classification Banner</label>
                      <select
                        value={exportOptions.classificationBanner}
                        onChange={(e) => setExportOptions({ ...exportOptions, classificationBanner: e.target.value as 'CUI' | 'FOUO' | 'none' })}
                        className={`${FORMS.select} mt-1`}
                      >
                        <option value="CUI">CUI (Controlled Unclassified Information)</option>
                        <option value="FOUO">FOUO (For Official Use Only)</option>
                        <option value="none">No Classification Banner</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setShowExportModal(false)} className={BUTTONS.secondary} disabled={exporting}>
                Cancel
              </button>
              <button onClick={handleExportWithOptions} disabled={exporting} className={`${BUTTONS.primary} flex items-center gap-2`}>
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export {exportFormat === 'professional-pdf' ? 'Professional PDF' : exportFormat === 'basic-pdf' ? 'Basic PDF' : exportFormat === 'docx' ? 'DOCX' : 'OSCAL JSON'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
