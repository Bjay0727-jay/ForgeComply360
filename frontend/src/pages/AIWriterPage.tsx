import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

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
}

interface Framework {
  id: string;
  name: string;
}

export function AIWriterPage() {
  const { t } = useExperience();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
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

  useEffect(() => {
    Promise.all([
      api('/api/v1/ai/templates').then(d => setTemplates(d.templates)),
      api('/api/v1/ai/documents').then(d => setDocuments(d.documents)),
      api('/api/v1/systems').then(d => setSystems(d.systems)),
      api('/api/v1/frameworks').then(d => setFrameworks(d.frameworks)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadDocuments = () => {
    const url = docFilter ? `/api/v1/ai/documents?template_type=${docFilter}` : '/api/v1/ai/documents';
    api(url).then(d => setDocuments(d.documents)).catch(() => {});
  };

  const getTemplateVars = (template: Template): Variable[] => {
    try { return JSON.parse(template.variables); } catch { return []; }
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setVariables({});
    setGeneratedContent('');
    setGeneratedDocId('');
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
        // Add framework info if a framework variable exists
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
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      control_narrative: 'bg-blue-50 text-blue-700 border-blue-200',
      poam: 'bg-orange-50 text-orange-700 border-orange-200',
      risk: 'bg-red-50 text-red-700 border-red-200',
      executive: 'bg-purple-50 text-purple-700 border-purple-200',
      gap_analysis: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      audit_response: 'bg-green-50 text-green-700 border-green-200',
      vendor: 'bg-teal-50 text-teal-700 border-teal-200',
      custom: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[cat] || colors.custom;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ForgeML Writer</h1>
          <p className="text-gray-500 text-sm mt-1">Generate professional compliance documents with AI</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1.5 rounded-lg border border-blue-200">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span className="text-xs font-medium text-blue-700">Powered by Workers AI</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {(['generate', 'history', 'templates'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {tab === 'generate' ? 'Generate' : tab === 'history' ? 'Document History' : 'Custom Templates'}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Template Selection & Config */}
          <div className="space-y-4">
            {/* Template Grid */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Select Template</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => selectTemplate(tpl)}
                    className={`text-left p-3 rounded-lg border-2 transition-all ${selectedTemplate?.id === tpl.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-md ${categoryColor(tpl.category)}`}>
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
            </div>

            {/* Context & Variables */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                {selectedTemplate ? 'Configure' : 'Custom Prompt'}
              </h2>

              {/* System selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('system')}</label>
                <select
                  value={selectedSystem}
                  onChange={e => setSelectedSystem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select a {t('system').toLowerCase()} (optional)</option>
                  {systems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.acronym})</option>)}
                </select>
              </div>

              {selectedTemplate ? (
                <>
                  {/* Dynamic variable inputs */}
                  {getTemplateVars(selectedTemplate).map(v => (
                    <div key={v.name} className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {v.label} {v.required && <span className="text-red-500">*</span>}
                      </label>
                      {v.description && <p className="text-xs text-gray-500 mb-1">{v.description}</p>}
                      {v.type === 'textarea' ? (
                        <textarea
                          value={variables[v.name] || ''}
                          onChange={e => setVariables({ ...variables, [v.name]: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder={v.label}
                        />
                      ) : (
                        <input
                          type={v.type === 'number' ? 'number' : 'text'}
                          value={variables[v.name] || ''}
                          onChange={e => setVariables({ ...variables, [v.name]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder={v.label}
                        />
                      )}
                    </div>
                  ))}

                  {/* Framework selector for control narrative */}
                  {selectedTemplate.category === 'control_narrative' && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
                      <select
                        value={variables.framework_name || ''}
                        onChange={e => setVariables({ ...variables, framework_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Enter your custom prompt. Describe the compliance document you need..."
                />
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || (!selectedTemplate && !customPrompt)}
                className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Right: Output */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Generated Output</h2>
              {generatedContent && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {generatedContent ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed max-h-[600px] overflow-y-auto">
                  {generatedContent}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Select a template and click Generate</p>
                <p className="text-xs mt-1">AI-generated content will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <p className="text-sm text-gray-600">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
            <select
              value={docFilter}
              onChange={e => { setDocFilter(e.target.value); }}
              onBlur={loadDocuments}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs"
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
            <div className="p-12 text-center text-gray-500">No documents generated yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Created By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{doc.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${categoryColor(doc.template_type)}`}>
                        {doc.template_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{doc.created_by_name}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleViewDoc(doc.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View</button>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
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
            <button onClick={() => setShowCreateTemplate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Template</button>
          </div>

          {showCreateTemplate && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create Custom Template</h3>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                    <input type="text" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g., Board Risk Report" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={templateForm.category} onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
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
                  <input type="text" value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="What does this template generate?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt *</label>
                  <p className="text-xs text-gray-500 mb-1">Defines the AI's role and writing style</p>
                  <textarea value={templateForm.system_prompt} onChange={e => setTemplateForm({ ...templateForm, system_prompt: e.target.value })} rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" placeholder="You are a senior compliance consultant..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Template *</label>
                  <p className="text-xs text-gray-500 mb-1">{'Use {{variable_name}} for dynamic content. System context ({{org_name}}, {{system_name}}) is auto-filled.'}</p>
                  <textarea value={templateForm.user_prompt_template} onChange={e => setTemplateForm({ ...templateForm, user_prompt_template: e.target.value })} rows={6} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" placeholder={'Write a {{document_type}} for:\n\nOrganization: {{org_name}}\nSystem: {{system_name}}\n...'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variables (JSON)</label>
                  <p className="text-xs text-gray-500 mb-1">Define input fields. Format: [{'{"name":"var","label":"Label","type":"text","required":true}'}]</p>
                  <textarea value={templateForm.variables} onChange={e => setTemplateForm({ ...templateForm, variables: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={savingTemplate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{savingTemplate ? 'Creating...' : 'Create Template'}</button>
                  <button type="button" onClick={() => setShowCreateTemplate(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${categoryColor(tpl.category)}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categoryIcon(tpl.category)} />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 text-sm">{tpl.name}</h3>
                      {tpl.is_builtin ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Built-in</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">Custom</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tpl.description}</p>
                    <div className="mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColor(tpl.category)}`}>{tpl.category.replace(/_/g, ' ')}</span>
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
