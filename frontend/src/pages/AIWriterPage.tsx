import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportAsDocx, exportComplianceDocByTemplate, COMPLIANCE_DOC_TYPES } from '../utils/exportHelpers';
import { PageHeader } from '../components/PageHeader';
import { MetricCard as ChartMetricCard } from '../components/charts';
import { EmptyState } from '../components/EmptyState';
import { SkeletonMetricCards, SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, BUTTONS } from '../utils/typography';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  system_prompt: string;
  user_prompt_template: string;
  variables: string;
  is_builtin: number;
}

interface Variable {
  name: string;
  label: string;
  description: string;
  type: string;
  required: boolean;
}

interface AIDocument {
  id: string;
  title: string;
  template_type: string;
  generated_content: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

interface System {
  id: string;
  name: string;
  acronym: string;
  impact_level: string;
  system_owner: string | null;
  authorizing_official: string | null;
  security_officer: string | null;
  authorization_date: string | null;
  authorization_expiry: string | null;
  description: string | null;
}

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Framework {
  id: string;
  name: string;
}

// Smart dropdown options for template variables that have known values
const SMART_DROPDOWN_OPTIONS: Record<string, { label: string; options: string[] }> = {
  auth_decision: { label: 'Authorization Decision', options: ['ATO', 'ATO with Conditions', 'Interim ATO (IATO)', 'Denial to Operate (DATO)'] },
  overall_risk: { label: 'Overall Risk Level', options: ['Low', 'Moderate', 'High', 'Very High'] },
  assessment_type: { label: 'Assessment Type', options: ['Initial', 'Annual', 'Significant Change', 'Ad Hoc'] },
  partner_impact_level: { label: 'Impact Level', options: ['Low', 'Moderate', 'High'] },
  interconnection_type: { label: 'Interconnection Type', options: ['API (REST/SOAP)', 'VPN (Site-to-Site)', 'VPN (Client)', 'Direct Network Connection', 'File Transfer (SFTP/FTPS)', 'Database Replication', 'Message Queue'] },
  data_classification: { label: 'Data Classification', options: ['Public', 'CUI', 'FOUO', 'PII', 'PHI', 'FTI', 'Classified'] },
  scenario_type: { label: 'Scenario Type', options: ['Ransomware Attack', 'Data Breach', 'Natural Disaster', 'Data Center Outage', 'Insider Threat', 'DDoS Attack', 'Supply Chain Compromise', 'Power Outage'] },
};

// Variables that should be auto-filled from selected system data
const SYSTEM_FIELD_MAP: Record<string, keyof System> = {
  system_owner: 'system_owner',
  authorizing_official: 'authorizing_official',
  isso_name: 'security_officer',
  auth_date: 'authorization_date',
  auth_expiry: 'authorization_expiry',
  system_description: 'description',
  system_purpose: 'description',
};

// Variables that should show a user picker dropdown
const USER_PICKER_VARS = new Set([
  'lead_assessor', 'prepared_by', 'plan_coordinator', 'facilitator',
  'ccb_chair', 'system_owner', 'authorizing_official', 'isso_name',
]);

const TEMPLATE_HELP: Record<string, { purpose: string; audience: string; sections: string[]; tips: string[] }> = {
  'tpl-sar': {
    purpose: 'Documents the results of a security assessment, including control test findings, risk determinations, and assessor recommendations.',
    audience: 'Authorizing Official (AO), ISSO, System Owner, 3PAO assessors',
    sections: ['Executive Summary', 'Assessment Scope & Methodology', 'System Description', 'Assessment Results', 'Detailed Findings', 'Risk Determination Matrix', 'Recommendations'],
    tips: ['Include the assessment date range and type (Initial/Annual)', 'Specify the lead assessor or 3PAO firm name', 'List any known findings to incorporate into the report'],
  },
  'tpl-isra': {
    purpose: 'Provides a formal risk assessment with threat/vulnerability analysis, likelihood/impact ratings, and a risk matrix per NIST SP 800-30.',
    audience: 'Risk Management team, AO, ISSO, System Owner',
    sections: ['Purpose & Scope', 'System Characterization', 'Threat Sources', 'Threat Events', 'Vulnerabilities', 'Likelihood & Impact', 'Risk Matrix', 'Risk Responses'],
    tips: ['Describe the system and its purpose clearly', 'Include industry-specific threats if applicable', 'Note any existing security controls that mitigate risks'],
  },
  'tpl-pia': {
    purpose: 'Evaluates how PII is collected, stored, used, shared, and protected within a system, identifying privacy risks and mitigations.',
    audience: 'Privacy Officer, Senior Agency Official for Privacy (SAOP), Legal, System Owner',
    sections: ['System Overview', 'PII Inventory', 'Authority to Collect', 'Data Flow', 'Data Sharing', 'Privacy Safeguards', 'Individual Rights', 'Privacy Risk Assessment'],
    tips: ['List all PII types collected (SSN, DOB, email, etc.)', 'Specify the approximate number of records', 'Note any data sharing with external parties'],
  },
  'tpl-iscp': {
    purpose: 'Provides procedures for system recovery following a disruption, including activation, recovery, and reconstitution phases.',
    audience: 'ISCP Coordinator, IT Operations, System Owner, CISO',
    sections: ['Introduction', 'Concept of Operations', 'Notification & Activation', 'Recovery Procedures', 'Reconstitution', 'Personnel Contacts', 'Backup Procedures', 'Plan Maintenance'],
    tips: ['Define realistic RTO and RPO values', 'Identify the alternate processing site', 'List critical business functions that must recover first'],
  },
  'tpl-cmp': {
    purpose: 'Establishes policies and procedures for managing system configurations, baselines, and changes through the CM lifecycle.',
    audience: 'CM Manager, CCB members, System Administrators, Developers',
    sections: ['CM Governance', 'Configuration Identification', 'Baseline Management', 'Change Control Process', 'Monitoring & Auditing', 'Status Accounting', 'Patch Management', 'Secure Configuration Standards'],
    tips: ['List your CM tools (Ansible, Terraform, GitHub, etc.)', 'Identify the CCB chair and meeting cadence', 'Describe your environments (dev, staging, prod)'],
  },
  'tpl-isa': {
    purpose: 'Defines security responsibilities, data protections, and technical requirements for a system-to-system interconnection.',
    audience: 'System Owners (both parties), ISSOs, AOs, Legal/Contracts',
    sections: ['Purpose & Authority', 'System Descriptions', 'Interconnection Details', 'Security Controls', 'Data Handling', 'Incident Response', 'Rules of Behavior', 'Signature Blocks'],
    tips: ['Identify the partner organization and their system clearly', 'Specify the interconnection type (API, VPN, file transfer)', 'Classify the data being exchanged (CUI, PII, PHI, etc.)'],
  },
  'tpl-ato-letter': {
    purpose: 'Formal memorandum from the Authorizing Official granting, denying, or conditionally authorizing system operation.',
    audience: 'Authorizing Official, System Owner, ISSO, CISO',
    sections: ['Memorandum Header', 'References', 'System Description', 'Assessment Summary', 'Risk Determination', 'Authorization Decision', 'Conditions', 'POA&M Requirements', 'Signature Block'],
    tips: ['Specify the authorization decision type (ATO, IATO, ATO with Conditions, DATO)', 'Include the authorization date and expiry (typically 3 years)', 'List the number of open POA&Ms at time of authorization'],
  },
  'tpl-fips199': {
    purpose: 'Determines the security categorization (Low/Moderate/High) for confidentiality, integrity, and availability using the high-water mark approach.',
    audience: 'System Owner, ISSO, AO, Security team',
    sections: ['System Identification', 'Information Types', 'C/I/A Impact Assessments', 'Impact Summary Table', 'Overall Categorization', 'Justification Narrative', 'Approval Signatures'],
    tips: ['List all information types processed by the system', 'Describe what the system does and why it exists', 'Reference NIST SP 800-60 for information type mappings'],
  },
  'tpl-cptt': {
    purpose: 'Documents a tabletop exercise testing the contingency plan, including scenario, observations, gaps, and corrective actions.',
    audience: 'ISCP Coordinator, CISO, IT Management, Exercise Participants',
    sections: ['Exercise Overview', 'Scenario Description', 'Participants & Roles', 'Timeline & Discussion', 'Key Observations', 'Gaps & Deficiencies', 'Corrective Action Plan', 'Lessons Learned'],
    tips: ['Describe the exercise scenario (ransomware, outage, disaster, etc.)', 'List all participants with their roles', 'Include specific exercise objectives being tested'],
  },
  'tpl-control-narrative': {
    purpose: 'Generates a professional control implementation narrative for SSP documentation describing how a specific security control is implemented.',
    audience: 'Assessors, ISSO, System Owner',
    sections: ['Control Implementation Description', 'Technologies & Tools', 'Processes & Procedures', 'Roles & Responsibilities', 'Monitoring & Verification'],
    tips: ['Select the specific system and framework', 'Add any environment-specific details in Additional Context', 'Output addresses WHO, WHAT, WHEN, WHERE, and HOW'],
  },
  'tpl-poam-remediation': {
    purpose: 'Creates a detailed remediation plan with milestones, timelines, and resource requirements for addressing a specific weakness.',
    audience: 'ISSO, System Owner, Remediation team',
    sections: ['Weakness Summary', 'Root Cause Analysis', 'Remediation Steps', 'Milestones & Timeline', 'Resource Requirements', 'Risk if Not Remediated'],
    tips: ['Describe the weakness clearly with its risk level', 'Include the affected control family', 'Specify any budget or resource constraints'],
  },
};

export function AIWriterPage() {
  const { t } = useExperience();
  const { canEdit } = useAuth();
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedDocId, setGeneratedDocId] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'templates'>('generate');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', category: 'custom', system_prompt: '', user_prompt_template: '', variables: '[]' });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [docFilter, setDocFilter] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    Promise.all([
      api('/api/v1/ai/templates').then(d => setTemplates(d.templates)),
      api('/api/v1/ai/documents').then(d => setDocuments(d.documents)),
      api('/api/v1/systems').then(d => setSystems(d.systems)),
      api('/api/v1/frameworks').then(d => setFrameworks(d.frameworks)),
      api('/api/v1/users').then(d => setUsers(d.users || [])).catch(() => setUsers([])),
    ]).catch(() => addToast({ type: 'error', title: 'Failed to load AI Writer data' })).finally(() => setLoading(false));
  }, [addToast]);

  const loadDocuments = () => {
    const url = docFilter ? `/api/v1/ai/documents?template_type=${docFilter}` : '/api/v1/ai/documents';
    api(url).then(d => setDocuments(d.documents)).catch(() => addToast({ type: 'error', title: 'Failed to load documents' }));
  };

  const getTemplateVars = (template: Template): Variable[] => {
    try { return JSON.parse(template.variables); } catch { return []; }
  };

  // Auto-fill variables from selected system data
  useEffect(() => {
    if (!selectedSystem || !selectedTemplate) return;
    const sys = systems.find(s => s.id === selectedSystem);
    if (!sys) return;
    const autoFilled: Record<string, string> = {};
    const templateVars = getTemplateVars(selectedTemplate);
    for (const v of templateVars) {
      const sysField = SYSTEM_FIELD_MAP[v.name];
      if (sysField && sys[sysField] && !variables[v.name]) {
        autoFilled[v.name] = String(sys[sysField]);
      }
    }
    // Auto-fill open POAMs count if variable exists
    if (templateVars.some(v => v.name === 'open_poams_count') && !variables.open_poams_count) {
      api(`/api/v1/poams?status=open&system_id=${selectedSystem}`).then(d => {
        if (d.total !== undefined) {
          setVariables(prev => ({ ...prev, open_poams_count: String(d.total) }));
        }
      }).catch(() => {});
    }
    if (Object.keys(autoFilled).length > 0) {
      setVariables(prev => ({ ...prev, ...autoFilled }));
    }
  }, [selectedSystem]);

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setVariables({});
    setGeneratedContent('');
    setGeneratedDocId('');
    setShowHelp(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent('');
    try {
      const payload: any = {};
      if (selectedTemplate) {
        payload.template_id = selectedTemplate.id;
        if (selectedSystem) payload.system_id = selectedSystem;
        payload.variables = { ...variables };
        const sys = systems.find(s => s.id === selectedSystem);
        if (sys) {
          payload.variables.system_name = sys.name;
          payload.variables.system_acronym = sys.acronym;
          payload.variables.impact_level = sys.impact_level;
        }
      } else {
        payload.custom_prompt = customPrompt;
        if (selectedSystem) payload.system_id = selectedSystem;
      }
      const result = await api('/api/v1/ai/generate', { method: 'POST', body: JSON.stringify(payload) });
      setGeneratedContent(result.document.generated_content);
      setGeneratedDocId(result.document.id);
      loadDocuments();
    } catch (err: any) {
      setGeneratedContent(`Error: ${err.message || 'Generation failed. Please try again.'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedContent : generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setEditedContent(generatedContent);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!generatedDocId) return;
    setSavingDoc(true);
    try {
      await api(`/api/v1/ai/documents/${generatedDocId}`, {
        method: 'PUT',
        body: JSON.stringify({ generated_content: editedContent }),
      });
      setGeneratedContent(editedContent);
      setIsEditing(false);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
      loadDocuments();
    } catch {} finally { setSavingDoc(false); }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const handleRefineWithAI = async () => {
    if (!selectedTemplate && !customPrompt) return;
    setGenerating(true);
    try {
      const currentText = isEditing ? editedContent : generatedContent;
      const payload: any = {
        custom_prompt: `You are a senior compliance consultant. Please refine and improve the following compliance document to make it more professional, specific, and suitable for federal assessors. Maintain the same structure and key points but enhance the language, add specificity, and ensure it reads as a polished final document.\n\nOriginal text to refine:\n\n${currentText}`,
      };
      if (selectedSystem) payload.system_id = selectedSystem;
      const result = await api('/api/v1/ai/generate', { method: 'POST', body: JSON.stringify(payload) });
      const refinedContent = result.document.generated_content;
      if (isEditing) {
        setEditedContent(refinedContent);
      } else {
        setGeneratedContent(refinedContent);
        setGeneratedDocId(result.document.id);
      }
      loadDocuments();
    } catch (err: any) {
      // keep existing content
    } finally { setGenerating(false); }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await api(`/api/v1/ai/documents/${id}`, { method: 'DELETE' });
      loadDocuments();
      if (generatedDocId === id) { setGeneratedContent(''); setGeneratedDocId(''); }
    } catch {}
  };

  const handleViewDoc = async (id: string) => {
    try {
      const result = await api(`/api/v1/ai/documents/${id}`);
      setGeneratedContent(result.document.generated_content);
      setGeneratedDocId(result.document.id);
      setIsEditing(false);
      setEditedContent('');
      setActiveTab('generate');
    } catch {}
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTemplate(true);
    try {
      let parsedVars = [];
      try { parsedVars = JSON.parse(templateForm.variables); } catch { parsedVars = []; }
      await api('/api/v1/ai/templates', {
        method: 'POST',
        body: JSON.stringify({ ...templateForm, variables: parsedVars }),
      });
      const d = await api('/api/v1/ai/templates');
      setTemplates(d.templates);
      setShowCreateTemplate(false);
      setTemplateForm({ name: '', description: '', category: 'custom', system_prompt: '', user_prompt_template: '', variables: '[]' });
    } catch {} finally { setSavingTemplate(false); }
  };

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      control_narrative: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      poam: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      risk: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      executive: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      gap_analysis: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      audit_response: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      vendor: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      custom: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    };
    return icons[cat] || icons.custom;
  };

  const ATO_TEMPLATE_IDS = new Set([
    'tpl-sar', 'tpl-isra', 'tpl-pia', 'tpl-iscp', 'tpl-cmp',
    'tpl-isa', 'tpl-ato-letter', 'tpl-fips199', 'tpl-cptt',
  ]);

  const atoTemplates = templates.filter(t => ATO_TEMPLATE_IDS.has(t.id));
  const writerTemplates = templates.filter(t => !ATO_TEMPLATE_IDS.has(t.id));
  const customTemplates = templates.filter(t => !t.is_builtin);

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      control_narrative: 'bg-blue-50 text-blue-700 border-blue-200',
      poam: 'bg-orange-50 text-orange-700 border-orange-200',
      risk: 'bg-red-50 text-red-700 border-red-200',
      executive: 'bg-purple-50 text-purple-700 border-purple-200',
      gap_analysis: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      audit_response: 'bg-green-50 text-green-700 border-green-200',
      vendor: 'bg-teal-50 text-teal-700 border-teal-200',
      custom: 'bg-gray-50 text-gray-700 border-blue-200',
    };
    return colors[cat] || colors.custom;
  };

  const categoryAccent = (cat: string) => {
    const accents: Record<string, string> = {
      control_narrative: 'bg-blue-500',
      poam: 'bg-orange-500',
      risk: 'bg-red-500',
      executive: 'bg-purple-500',
      gap_analysis: 'bg-indigo-500',
      audit_response: 'bg-green-500',
      vendor: 'bg-teal-500',
      custom: 'bg-gray-500',
    };
    return accents[cat] || accents.custom;
  };

  const tabConfig = [
    { key: 'generate' as const, label: 'Generate', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { key: 'history' as const, label: 'Document History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'templates' as const, label: 'Custom Templates', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  ];

  if (loading) return <div className="space-y-6"><SkeletonMetricCards count={4} /><SkeletonCard /></div>;

  return (
    <div>
      {/* Header */}
      <PageHeader title="Authorization Packages" subtitle="Generate professional ATO compliance documents with AI">
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
          <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span className="text-xs font-medium text-white/80">Powered by Workers AI</span>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ChartMetricCard
          title="Total Templates"
          value={String(templates.length)}
          subtitle={`${atoTemplates.length} ATO + ${writerTemplates.length} writing`}
        />
        <ChartMetricCard
          title="ATO Documents"
          value={String(atoTemplates.length)}
          subtitle="Authorization package templates"
        />
        <ChartMetricCard
          title="Documents Generated"
          value={String(documents.length)}
          subtitle="Total AI-generated documents"
        />
        <ChartMetricCard
          title="Custom Templates"
          value={String(customTemplates.length)}
          subtitle="Organization-specific templates"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabConfig.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Template Selection & Config */}
          <div className="space-y-4">
            {/* Template Grid */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900">Select Template</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose a document type to generate</p>
              </div>
              <div className="p-5">
                {/* ATO Package Documents */}
                {atoTemplates.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-md border border-indigo-200">
                        <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        <span className="text-xs font-semibold text-indigo-700">ATO Package Documents</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{atoTemplates.length} templates</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                      {atoTemplates.map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => selectTemplate(tpl)}
                          className={`text-left rounded-xl border-2 transition-all overflow-hidden flex ${selectedTemplate?.id === tpl.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200 shadow-sm' : 'border-blue-200 hover:border-blue-300 hover:shadow-sm'}`}
                        >
                          <div className={`w-1.5 flex-shrink-0 ${selectedTemplate?.id === tpl.id ? 'bg-blue-500' : 'bg-indigo-400'}`} />
                          <div className="p-3 flex items-start gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex-shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categoryIcon(tpl.category)} />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-medium text-gray-900 truncate">{tpl.name}</p>
                                {COMPLIANCE_DOC_TYPES[tpl.id] && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-semibold whitespace-nowrap">{COMPLIANCE_DOC_TYPES[tpl.id]}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tpl.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Writing Tools */}
                {writerTemplates.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md border border-gray-200">
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span className="text-xs font-semibold text-gray-700">Writing Tools</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{writerTemplates.length} templates</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {writerTemplates.map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => selectTemplate(tpl)}
                          className={`text-left rounded-xl border-2 transition-all overflow-hidden flex ${selectedTemplate?.id === tpl.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200 shadow-sm' : 'border-blue-200 hover:border-blue-300 hover:shadow-sm'}`}
                        >
                          <div className={`w-1.5 flex-shrink-0 ${selectedTemplate?.id === tpl.id ? 'bg-blue-500' : categoryAccent(tpl.category)}`} />
                          <div className="p-3 flex items-start gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg flex-shrink-0 ${categoryColor(tpl.category)}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categoryIcon(tpl.category)} />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{tpl.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tpl.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Template Help Panel */}
            {selectedTemplate && TEMPLATE_HELP[selectedTemplate.id] && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 overflow-hidden">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="w-full flex items-center gap-2 px-5 py-3 text-left hover:bg-blue-100/50 transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-800">Template Guide</span>
                  <svg className={`w-3.5 h-3.5 ml-auto text-blue-600 transition-transform ${showHelp ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showHelp && (() => {
                  const help = TEMPLATE_HELP[selectedTemplate.id];
                  return (
                    <div className="px-5 pb-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">What This Generates</p>
                        <p className="text-sm text-gray-700">{help.purpose}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Target Audience</p>
                        <p className="text-sm text-gray-700">{help.audience}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Key Sections Included</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {help.sections.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-white border border-blue-200 rounded-full text-blue-700">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Tips for Best Results</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {help.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Context & Variables */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900">
                  {selectedTemplate ? 'Configure' : 'Custom Prompt'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedTemplate ? `Set parameters for "${selectedTemplate.name}"` : 'Write a custom document prompt'}
                </p>
              </div>
              <div className="p-5">
                {/* System selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('system')}</label>
                  <select
                    value={selectedSystem}
                    onChange={e => setSelectedSystem(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a {t('system').toLowerCase()} (optional)</option>
                    {systems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.acronym})</option>)}
                  </select>
                </div>

                {selectedTemplate ? (
                  <>
                    {getTemplateVars(selectedTemplate).map(v => {
                      const dropdownOpts = SMART_DROPDOWN_OPTIONS[v.name];
                      const isUserPicker = USER_PICKER_VARS.has(v.name);
                      const isAutoFilled = SYSTEM_FIELD_MAP[v.name] && variables[v.name];

                      return (
                        <div key={v.name} className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {v.label} {v.required && <span className="text-red-500">*</span>}
                            {isAutoFilled && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Auto-filled</span>}
                          </label>
                          {v.description && <p className="text-xs text-gray-500 mb-1">{v.description}</p>}

                          {/* Dropdown for known option lists */}
                          {dropdownOpts ? (
                            <select
                              value={variables[v.name] || ''}
                              onChange={e => setVariables({ ...variables, [v.name]: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select {v.label.toLowerCase()}...</option>
                              {dropdownOpts.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>

                          /* User picker for personnel fields */
                          ) : isUserPicker && users.length > 0 ? (
                            <div>
                              <select
                                value={users.some(u => u.name === variables[v.name]) ? variables[v.name] : '__custom__'}
                                onChange={e => {
                                  if (e.target.value !== '__custom__') {
                                    setVariables({ ...variables, [v.name]: e.target.value });
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-1"
                              >
                                <option value="__custom__">Type a name or select...</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={variables[v.name] || ''}
                                onChange={e => setVariables({ ...variables, [v.name]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Or type ${v.label.toLowerCase()} name...`}
                              />
                            </div>

                          /* Textarea for long content */
                          ) : v.type === 'textarea' ? (
                            <textarea
                              value={variables[v.name] || ''}
                              onChange={e => setVariables({ ...variables, [v.name]: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={v.label}
                            />

                          /* Default text/number input */
                          ) : (
                            <input
                              type={v.type === 'number' ? 'number' : 'text'}
                              value={variables[v.name] || ''}
                              onChange={e => setVariables({ ...variables, [v.name]: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={v.label}
                            />
                          )}
                        </div>
                      );
                    })}

                    {selectedTemplate.category === 'control_narrative' && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
                        <select
                          value={variables.framework_name || ''}
                          onChange={e => setVariables({ ...variables, framework_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select framework</option>
                          {frameworks.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your custom prompt. Describe the compliance document you need..."
                  />
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating || (!selectedTemplate && !customPrompt)}
                  className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Generate Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div className={`bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden ${!generatedContent ? 'self-start' : ''}`}>
            <div className="px-6 py-4 border-b border-blue-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">Generated Output</h2>
                {isEditing && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Editing</span>}
                {savedNotice && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Saved</span>}
              </div>
              {generatedContent && (
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          const content = isEditing ? editedContent : generatedContent;
                          const title = selectedTemplate?.name || 'AI Document';
                          if (selectedTemplate && COMPLIANCE_DOC_TYPES[selectedTemplate.id]) {
                            const sys = systems.find(s => s.id === selectedSystem);
                            exportComplianceDocByTemplate(selectedTemplate.id, title, content, {
                              system_name: sys?.name || '', system_acronym: sys?.acronym || '', impact_level: sys?.impact_level || '',
                            });
                          } else {
                            exportAsDocx(title, content);
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        DOCX
                      </button>
                      <button
                        onClick={handleEdit}
                        className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button
                        onClick={handleRefineWithAI}
                        disabled={generating}
                        className="px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z M19 3v18" /></svg>
                        ✨ Enhance
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Redo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleRefineWithAI}
                        disabled={generating}
                        className="px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z M19 3v18" /></svg>
                        ✨ Enhance
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingDoc}
                        className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50 transition-colors"
                      >
                        {savingDoc ? (
                          <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                        ) : (
                          <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Save</>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="p-5">
              {generatedContent ? (
                isEditing ? (
                  <div>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg text-sm text-gray-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[500px] max-h-[700px] font-mono"
                      style={{ height: '500px' }}
                    />
                    <p className="text-xs text-gray-400 mt-2">Edit the content above. Click "✨ Enhance" to improve, or "Save" to persist changes.</p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-white rounded-lg p-6 border border-gray-200 max-h-[600px] overflow-y-auto prose prose-sm max-w-none prose-headings:text-[#1e3a5f] prose-h2:text-lg prose-h2:font-bold prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h2:mt-6 prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-table:text-xs prose-th:bg-[#1e3a5f] prose-th:text-white prose-th:font-semibold prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-gray-200 prose-strong:text-gray-900 prose-li:text-gray-700 prose-p:text-gray-700 prose-p:leading-relaxed prose-hr:my-6">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Click "Edit" to modify, or "✨ Enhance" to polish the content.</p>
                  </div>
                )
              ) : (
                <EmptyState compact title="Select a template and click Generate" subtitle="AI-generated compliance documents will appear here" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-blue-100 flex items-center justify-between">
            <p className="text-sm text-gray-600 font-medium">{documents.length} document{documents.length !== 1 ? 's' : ''} generated</p>
            <select
              value={docFilter}
              onChange={e => { setDocFilter(e.target.value); }}
              onBlur={loadDocuments}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="control_narrative">Control Narratives</option>
              <option value="poam">POA&M Plans</option>
              <option value="risk">Risk Assessments</option>
              <option value="executive">Executive Summaries</option>
              <option value="gap_analysis">Gap Analyses</option>
              <option value="audit_response">Audit Responses</option>
              <option value="vendor">Vendor Assessments</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {documents.length === 0 ? (
            <EmptyState title="No documents generated yet" subtitle="Generated documents will appear here" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className={`text-left px-5 py-3 ${TYPOGRAPHY.tableHeader}`}>Title</th>
                  <th className={`text-left px-5 py-3 ${TYPOGRAPHY.tableHeader}`}>Type</th>
                  <th className={`text-left px-5 py-3 ${TYPOGRAPHY.tableHeader}`}>Created By</th>
                  <th className={`text-left px-5 py-3 ${TYPOGRAPHY.tableHeader}`}>Date</th>
                  <th className={`text-left px-5 py-3 ${TYPOGRAPHY.tableHeader}`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">{doc.title}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColor(doc.template_type)}`}>
                        {doc.template_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{doc.created_by_name}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleViewDoc(doc.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors">View</button>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">Create custom document templates for your organization</p>
            {canEdit && (
              <button
                onClick={() => setShowCreateTemplate(true)}
                className={`${BUTTONS.primary} flex items-center gap-1.5 shadow-sm transition-colors`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Template
              </button>
            )}
          </div>

          {showCreateTemplate && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create Custom Template</h3>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                    <input type="text" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Board Risk Report" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={templateForm.category} onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="custom">Custom</option>
                      <option value="control_narrative">Control Narrative</option>
                      <option value="poam">POA&M</option>
                      <option value="risk">Risk</option>
                      <option value="executive">Executive</option>
                      <option value="gap_analysis">Gap Analysis</option>
                      <option value="audit_response">Audit Response</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="What does this template generate?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt *</label>
                  <p className="text-xs text-gray-500 mb-1">Defines the AI's role and writing style</p>
                  <textarea value={templateForm.system_prompt} onChange={e => setTemplateForm({ ...templateForm, system_prompt: e.target.value })} rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="You are a senior compliance consultant..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Template *</label>
                  <p className="text-xs text-gray-500 mb-1">{'Use {{variable_name}} for dynamic content. System context ({{org_name}}, {{system_name}}) is auto-filled.'}</p>
                  <textarea value={templateForm.user_prompt_template} onChange={e => setTemplateForm({ ...templateForm, user_prompt_template: e.target.value })} rows={6} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={'Write a {{document_type}} for:\n\nOrganization: {{org_name}}\nSystem: {{system_name}}\n...'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variables (JSON)</label>
                  <p className="text-xs text-gray-500 mb-1">Define input fields. Format: [{'{"name":"var","label":"Label","type":"text","required":true}'}]</p>
                  <textarea value={templateForm.variables} onChange={e => setTemplateForm({ ...templateForm, variables: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={savingTemplate} className={`${BUTTONS.primary} shadow-sm transition-colors`}>{savingTemplate ? 'Creating...' : 'Create Template'}</button>
                  <button type="button" onClick={() => setShowCreateTemplate(false)} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden flex hover:shadow-md transition-shadow">
                <div className={`w-1.5 flex-shrink-0 ${categoryAccent(tpl.category)}`} />
                <div className="p-4 flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${categoryColor(tpl.category)}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categoryIcon(tpl.category)} />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 text-sm">{tpl.name}</h3>
                      {tpl.is_builtin ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Built-in</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-semibold">Custom</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tpl.description}</p>
                    <div className="mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor(tpl.category)}`}>{tpl.category.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
