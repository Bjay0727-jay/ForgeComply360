import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { FormField } from '../components/FormField';
import { DynamicTable, TableColumn } from '../components/DynamicTable';
import { BUTTONS, TYPOGRAPHY, FORMS, CARDS } from '../utils/typography';

// Simple section definitions
const FISMA_SECTIONS = [
  { key: 'system_info', label: 'System Information', group: 'Frontmatter' },
  { key: 'fips_199', label: 'FIPS 199 Categorization', group: 'Frontmatter' },
  { key: 'information_types', label: 'Information Types', group: 'Frontmatter' },
  { key: 'control_baseline', label: 'Control Baseline', group: 'Frontmatter' },
  { key: 'rmf_lifecycle', label: 'RMF Lifecycle Tracker', group: 'Frontmatter' },
  { key: 'authorization_boundary', label: 'Authorization Boundary', group: 'Architecture' },
  { key: 'data_flow', label: 'Data Flow', group: 'Architecture' },
  { key: 'network_architecture', label: 'Network Architecture', group: 'Architecture' },
  { key: 'ports_protocols', label: 'Ports, Protocols & Services', group: 'Architecture' },
  { key: 'system_interconnections', label: 'System Interconnections', group: 'Architecture' },
  { key: 'crypto_modules', label: 'Cryptographic Modules', group: 'Architecture' },
  { key: 'personnel', label: 'Personnel & Roles', group: 'Personnel' },
  { key: 'digital_identity', label: 'Digital Identity', group: 'Personnel' },
  { key: 'separation_duties', label: 'Separation of Duties', group: 'Personnel' },
  { key: 'control_implementations', label: 'Control Implementations', group: 'Controls' },
  { key: 'security_policies', label: 'Security Policies', group: 'Controls' },
  { key: 'scrm', label: 'Supply Chain Risk Mgmt', group: 'Controls' },
  { key: 'privacy_analysis', label: 'Privacy Analysis', group: 'Controls' },
  { key: 'contingency_plan', label: 'Contingency Plan', group: 'Plans' },
  { key: 'incident_response', label: 'Incident Response', group: 'Plans' },
  { key: 'config_management', label: 'Configuration Management', group: 'Plans' },
  { key: 'continuous_monitoring', label: 'Continuous Monitoring', group: 'Post-Auth' },
  { key: 'poam', label: 'POA&M Summary', group: 'Post-Auth' },
];

const IMPACT_LEVELS = [
  { value: 'Low', label: 'Low' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'High', label: 'High' },
];

const RMF_STEPS = ['prepare', 'categorize', 'select', 'implement', 'assess', 'authorize', 'monitor'];

export function FISMASSPBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useExperience();
  const { canEdit } = useAuth();

  // Document state
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Section state
  const [activeSection, setActiveSection] = useState('system_info');
  const [sectionData, setSectionData] = useState<Record<string, any>>({});

  // Extended table data
  const [infoTypes, setInfoTypes] = useState<any[]>([]);
  const [rmfTracking, setRmfTracking] = useState<any>(null);
  const [portsProtocols, setPortsProtocols] = useState<any[]>([]);
  const [cryptoModules, setCryptoModules] = useState<any[]>([]);
  const [digitalIdentity, setDigitalIdentity] = useState<any>(null);
  const [separationDuties, setSeparationDuties] = useState<any[]>([]);
  const [policyMappings, setPolicyMappings] = useState<any[]>([]);
  const [scrmEntries, setScrmEntries] = useState<any[]>([]);
  const [scrmPlan, setScrmPlan] = useState<any>(null);
  const [privacyAnalysis, setPrivacyAnalysis] = useState<any>(null);
  const [configManagement, setConfigManagement] = useState<any>(null);
  const [cmBaselines, setCmBaselines] = useState<any[]>([]);
  const [poamSummary, setPoamSummary] = useState<any>(null);

  // Load document and related data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api(`/api/v1/ssp/${id}`),
      api(`/api/v1/ssp/${id}/info-types`).catch(() => ({ info_types: [] })),
      api(`/api/v1/ssp/${id}/rmf-tracking`).catch(() => ({ rmf_tracking: null })),
      api(`/api/v1/ssp/${id}/ports-protocols`).catch(() => ({ ports_protocols: [] })),
      api(`/api/v1/ssp/${id}/crypto-modules`).catch(() => ({ crypto_modules: [] })),
      api(`/api/v1/ssp/${id}/digital-identity`).catch(() => ({ digital_identity: null })),
      api(`/api/v1/ssp/${id}/separation-duties`).catch(() => ({ separation_duties: [] })),
      api(`/api/v1/ssp/${id}/policy-mappings`).catch(() => ({ policy_mappings: [] })),
      api(`/api/v1/ssp/${id}/scrm`).catch(() => ({ scrm_entries: [] })),
      api(`/api/v1/ssp/${id}/scrm-plan`).catch(() => ({ scrm_plan: null })),
      api(`/api/v1/ssp/${id}/privacy-analysis`).catch(() => ({ privacy_analysis: null })),
      api(`/api/v1/ssp/${id}/config-management`).catch(() => ({ config_management: null })),
      api(`/api/v1/ssp/${id}/cm-baselines`).catch(() => ({ cm_baselines: [] })),
      api(`/api/v1/ssp/${id}/poam-summary`).catch(() => ({ poam_summary: null })),
    ]).then(([doc, it, rmf, pps, crypto, di, sd, pm, scrm, scrmP, priv, cm, cmb, poam]) => {
      setDocument(doc.document);
      setSectionData(doc.document?.oscal_json?._authoring?.sections || {});
      setInfoTypes(it.info_types || []);
      setRmfTracking(rmf.rmf_tracking);
      setPortsProtocols(pps.ports_protocols || []);
      setCryptoModules(crypto.crypto_modules || []);
      setDigitalIdentity(di.digital_identity);
      setSeparationDuties(sd.separation_duties || []);
      setPolicyMappings(pm.policy_mappings || []);
      setScrmEntries(scrm.scrm_entries || []);
      setScrmPlan(scrmP.scrm_plan);
      setPrivacyAnalysis(priv.privacy_analysis);
      setConfigManagement(cm.config_management);
      setCmBaselines(cmb.cm_baselines || []);
      setPoamSummary(poam.poam_summary);
    }).finally(() => setLoading(false));
  }, [id]);

  // Save section content
  const saveSection = useCallback(async (key: string, content: string) => {
    if (!id) return;
    setSaving(true);
    try {
      await api(`/api/v1/ssp/${id}/sections/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
      setLastSaved(new Date());
      setSectionData(prev => ({
        ...prev,
        [key]: { ...prev[key], content, status: content.trim() ? 'draft' : 'empty' },
      }));
    } finally {
      setSaving(false);
    }
  }, [id]);

  // Get current section
  const currentSection = FISMA_SECTIONS.find(s => s.key === activeSection);
  const currentContent = sectionData[activeSection]?.content || '';

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">SSP Not Found</h3>
          <p className="text-gray-500 mt-2">The requested SSP document could not be found.</p>
          <button onClick={() => navigate('/ssp')} className={`${BUTTONS.secondary} mt-4`}>
            Back to SSP List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="FISMA SSP Builder"
        subtitle={document.name || 'Untitled SSP'}
        breadcrumbs={[
          { label: 'SSP Documents', path: '/ssp' },
          { label: document.name || 'SSP Builder', path: '' },
        ]}
      />

      {/* Save indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          {saving ? (
            <span className="text-sm text-amber-500">Saving...</span>
          ) : lastSaved ? (
            <span className="text-sm text-green-600">✓ Saved {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
      </div>

      {/* Section selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
        <select
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
          className={FORMS.select}
        >
          {FISMA_SECTIONS.map(section => (
            <option key={section.key} value={section.key}>
              {section.group}: {section.label}
            </option>
          ))}
        </select>
      </div>

      {/* Section content */}
      <div className={CARDS.base}>
        <h2 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>{currentSection?.label}</h2>
        {renderSectionContent()}
      </div>
    </div>
  );

  // --- Section Renderers ---
  function renderSectionContent() {
    switch (activeSection) {
      case 'fips_199':
        return renderFIPS199Section();
      case 'information_types':
        return renderInfoTypesSection();
      case 'rmf_lifecycle':
        return renderRMFLifecycleSection();
      case 'ports_protocols':
        return renderPortsProtocolsSection();
      case 'crypto_modules':
        return renderCryptoModulesSection();
      case 'digital_identity':
        return renderDigitalIdentitySection();
      case 'separation_duties':
        return renderSeparationDutiesSection();
      case 'security_policies':
        return renderSecurityPoliciesSection();
      case 'scrm':
        return renderSCRMSection();
      case 'privacy_analysis':
        return renderPrivacyAnalysisSection();
      case 'config_management':
        return renderConfigManagementSection();
      case 'poam':
        return renderPOAMSection();
      default:
        return renderTextSection();
    }
  }

  // Text-based section (default)
  function renderTextSection() {
    return (
      <textarea
        value={currentContent}
        onChange={(e) => setSectionData(prev => ({
          ...prev,
          [activeSection]: { ...prev[activeSection], content: e.target.value },
        }))}
        onBlur={() => saveSection(activeSection, sectionData[activeSection]?.content || '')}
        placeholder={`Enter ${currentSection?.label} content...`}
        className={`${FORMS.textarea} min-h-[400px]`}
        disabled={!canEdit}
      />
    );
  }

  // FIPS 199 Section
  function renderFIPS199Section() {
    const data = sectionData[activeSection] || {};
    let parsed: any = {};
    try { parsed = JSON.parse(data.content || '{}'); } catch {}

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <FormField
            name="confidentiality"
            label="Confidentiality"
            type="select"
            value={parsed.confidentiality || ''}
            onChange={(v) => updateStructuredSection('fips_199', { ...parsed, confidentiality: v })}
            required
          >
            <option value="">Select...</option>
            {IMPACT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </FormField>
          <FormField
            name="integrity"
            label="Integrity"
            type="select"
            value={parsed.integrity || ''}
            onChange={(v) => updateStructuredSection('fips_199', { ...parsed, integrity: v })}
            required
          >
            <option value="">Select...</option>
            {IMPACT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </FormField>
          <FormField
            name="availability"
            label="Availability"
            type="select"
            value={parsed.availability || ''}
            onChange={(v) => updateStructuredSection('fips_199', { ...parsed, availability: v })}
            required
          >
            <option value="">Select...</option>
            {IMPACT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </FormField>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800">
            Overall System Categorization: {' '}
            <span className="font-bold">
              {getHighestImpact(parsed.confidentiality, parsed.integrity, parsed.availability) || '—'}
            </span>
          </div>
        </div>
        <FormField
          name="justification"
          label="Categorization Justification"
          type="textarea"
          value={parsed.justification || ''}
          onChange={(v) => updateStructuredSection('fips_199', { ...parsed, justification: v })}
          rows={4}
          placeholder="Provide justification for the security categorization..."
        />
      </div>
    );
  }

  // Information Types Section
  function renderInfoTypesSection() {
    const columns: TableColumn[] = [
      { key: 'nist_id', label: 'NIST ID', placeholder: 'e.g., C.2.8.12', width: '120px' },
      { key: 'name', label: 'Information Type', placeholder: 'e.g., Personnel Management' },
      { key: 'confidentiality', label: 'C', type: 'select', options: IMPACT_LEVELS, width: '80px' },
      { key: 'integrity', label: 'I', type: 'select', options: IMPACT_LEVELS, width: '80px' },
      { key: 'availability', label: 'A', type: 'select', options: IMPACT_LEVELS, width: '80px' },
    ];

    return (
      <DynamicTable
        columns={columns}
        rows={infoTypes}
        onAddRow={() => addInfoType()}
        onDeleteRow={(i) => deleteInfoType(infoTypes[i]?.id)}
        onUpdateCell={(i, k, v) => updateInfoType(i, k, v)}
        addLabel="Add Information Type"
        emptyMessage="No information types defined"
        readOnly={!canEdit}
      />
    );
  }

  // RMF Lifecycle Section
  function renderRMFLifecycleSection() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField
            name="current_step"
            label="Current RMF Step"
            type="select"
            value={rmfTracking?.current_step || 'prepare'}
            onChange={(v) => updateRMFTracking({ current_step: v })}
          >
            {RMF_STEPS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </FormField>
          <FormField
            name="target_ato_date"
            label="Target ATO Date"
            type="date"
            value={rmfTracking?.target_ato_date || ''}
            onChange={(v) => updateRMFTracking({ target_ato_date: v })}
          />
        </div>
        {/* RMF Step Progress */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">RMF Progress</label>
          <div className="flex gap-2">
            {RMF_STEPS.map((step, i) => {
              const currentIdx = RMF_STEPS.indexOf(rmfTracking?.current_step || 'prepare');
              const isComplete = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div
                  key={step}
                  className={`flex-1 p-3 rounded-lg text-center text-sm font-medium ${
                    isComplete ? 'bg-green-100 text-green-700' :
                    isCurrent ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' :
                    'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Ports, Protocols & Services Section
  function renderPortsProtocolsSection() {
    const columns: TableColumn[] = [
      { key: 'port', label: 'Port', placeholder: '443', width: '80px' },
      { key: 'protocol', label: 'Protocol', type: 'select', options: [
        { value: 'TCP', label: 'TCP' },
        { value: 'UDP', label: 'UDP' },
        { value: 'ICMP', label: 'ICMP' },
      ], width: '100px' },
      { key: 'service', label: 'Service', placeholder: 'HTTPS' },
      { key: 'purpose', label: 'Purpose', placeholder: 'Web application traffic' },
      { key: 'direction', label: 'Direction', type: 'select', options: [
        { value: 'Inbound', label: 'Inbound' },
        { value: 'Outbound', label: 'Outbound' },
        { value: 'Internal', label: 'Internal' },
        { value: 'Bidirectional', label: 'Bidirectional' },
      ], width: '120px' },
    ];

    return (
      <DynamicTable
        columns={columns}
        rows={portsProtocols}
        onAddRow={() => addPortProtocol()}
        onDeleteRow={(i) => deletePortProtocol(portsProtocols[i]?.id)}
        onUpdateCell={(i, k, v) => updatePortProtocol(i, k, v)}
        addLabel="Add Port/Protocol"
        emptyMessage="No ports, protocols, or services defined"
        readOnly={!canEdit}
      />
    );
  }

  // Crypto Modules Section
  function renderCryptoModulesSection() {
    const columns: TableColumn[] = [
      { key: 'module_name', label: 'Module Name', placeholder: 'OpenSSL FIPS Module' },
      { key: 'vendor', label: 'Vendor', placeholder: 'OpenSSL Foundation', width: '150px' },
      { key: 'fips_cert_number', label: 'FIPS Cert #', placeholder: '4282', width: '100px' },
      { key: 'validation_level', label: 'Level', type: 'select', options: [
        { value: 'Level 1', label: 'Level 1' },
        { value: 'Level 2', label: 'Level 2' },
        { value: 'Level 3', label: 'Level 3' },
        { value: 'Level 4', label: 'Level 4' },
      ], width: '100px' },
      { key: 'usage', label: 'Usage', type: 'select', options: [
        { value: 'DAR', label: 'DAR' },
        { value: 'DIT', label: 'DIT' },
        { value: 'DIU', label: 'DIU' },
      ], width: '80px' },
    ];

    return (
      <DynamicTable
        columns={columns}
        rows={cryptoModules}
        onAddRow={() => addCryptoModule()}
        onDeleteRow={(i) => deleteCryptoModule(cryptoModules[i]?.id)}
        onUpdateCell={(i, k, v) => updateCryptoModule(i, k, v)}
        addLabel="Add Cryptographic Module"
        emptyMessage="No cryptographic modules defined"
        readOnly={!canEdit}
      />
    );
  }

  // Digital Identity Section
  function renderDigitalIdentitySection() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <FormField
            name="ial"
            label="Identity Assurance Level (IAL)"
            type="select"
            value={digitalIdentity?.ial || ''}
            onChange={(v) => updateDigitalIdentity({ ial: v })}
          >
            <option value="">Select...</option>
            <option value="IAL1">IAL1 - Self-asserted</option>
            <option value="IAL2">IAL2 - Remote or in-person proofing</option>
            <option value="IAL3">IAL3 - In-person proofing</option>
          </FormField>
          <FormField
            name="aal"
            label="Authenticator Assurance Level (AAL)"
            type="select"
            value={digitalIdentity?.aal || ''}
            onChange={(v) => updateDigitalIdentity({ aal: v })}
          >
            <option value="">Select...</option>
            <option value="AAL1">AAL1 - Single-factor</option>
            <option value="AAL2">AAL2 - Multi-factor</option>
            <option value="AAL3">AAL3 - Hardware-based MFA</option>
          </FormField>
          <FormField
            name="fal"
            label="Federation Assurance Level (FAL)"
            type="select"
            value={digitalIdentity?.fal || ''}
            onChange={(v) => updateDigitalIdentity({ fal: v })}
          >
            <option value="">Select...</option>
            <option value="FAL1">FAL1 - Bearer assertion</option>
            <option value="FAL2">FAL2 - Holder-of-key assertion</option>
            <option value="N/A">N/A - No federation</option>
          </FormField>
        </div>
        <FormField
          name="mfa_methods"
          label="MFA Methods"
          value={digitalIdentity?.mfa_methods || ''}
          onChange={(v) => updateDigitalIdentity({ mfa_methods: v })}
          placeholder="e.g., PIV, TOTP, Push notification"
        />
        <FormField
          name="identity_narrative"
          label="Identity Narrative"
          type="textarea"
          value={digitalIdentity?.narrative || ''}
          onChange={(v) => updateDigitalIdentity({ narrative: v })}
          rows={4}
          placeholder="Describe the identity proofing and authentication mechanisms..."
        />
      </div>
    );
  }

  // Separation of Duties Section
  function renderSeparationDutiesSection() {
    const columns: TableColumn[] = [
      { key: 'role', label: 'Role', placeholder: 'System Administrator' },
      { key: 'access_level', label: 'Access Level', placeholder: 'Admin' },
      { key: 'prohibited_roles', label: 'Prohibited Combinations', placeholder: 'Auditor, Security Officer' },
      { key: 'justification', label: 'Justification', placeholder: 'Prevents conflicts of interest' },
    ];

    return (
      <DynamicTable
        columns={columns}
        rows={separationDuties}
        onAddRow={() => addSeparationDuty()}
        onDeleteRow={(i) => deleteSeparationDuty(separationDuties[i]?.id)}
        onUpdateCell={(i, k, v) => updateSeparationDuty(i, k, v)}
        addLabel="Add Role"
        emptyMessage="No separation of duties defined"
        readOnly={!canEdit}
      />
    );
  }

  // Security Policies Section
  function renderSecurityPoliciesSection() {
    const columns: TableColumn[] = [
      { key: 'control_family', label: 'Family', type: 'select', options: [
        { value: 'AC', label: 'AC' }, { value: 'AT', label: 'AT' }, { value: 'AU', label: 'AU' },
        { value: 'CA', label: 'CA' }, { value: 'CM', label: 'CM' }, { value: 'CP', label: 'CP' },
        { value: 'IA', label: 'IA' }, { value: 'IR', label: 'IR' }, { value: 'MA', label: 'MA' },
        { value: 'MP', label: 'MP' }, { value: 'PE', label: 'PE' }, { value: 'PL', label: 'PL' },
        { value: 'PM', label: 'PM' }, { value: 'PS', label: 'PS' }, { value: 'PT', label: 'PT' },
        { value: 'RA', label: 'RA' }, { value: 'SA', label: 'SA' }, { value: 'SC', label: 'SC' },
        { value: 'SI', label: 'SI' }, { value: 'SR', label: 'SR' },
      ], width: '80px' },
      { key: 'policy_title', label: 'Policy Title', placeholder: 'Access Control Policy' },
      { key: 'version', label: 'Version', placeholder: '1.0', width: '80px' },
      { key: 'owner', label: 'Owner', placeholder: 'CISO' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { value: 'Current', label: 'Current' },
        { value: 'Draft', label: 'Draft' },
        { value: 'Under Review', label: 'Under Review' },
        { value: 'Expired', label: 'Expired' },
      ], width: '120px' },
    ];

    return (
      <DynamicTable
        columns={columns}
        rows={policyMappings}
        onAddRow={() => addPolicyMapping()}
        onDeleteRow={(i) => deletePolicyMapping(policyMappings[i]?.id)}
        onUpdateCell={(i, k, v) => updatePolicyMapping(i, k, v)}
        addLabel="Add Policy"
        emptyMessage="No security policies mapped"
        readOnly={!canEdit}
      />
    );
  }

  // SCRM Section
  function renderSCRMSection() {
    const columns: TableColumn[] = [
      { key: 'supplier_name', label: 'Supplier', placeholder: 'AWS' },
      { key: 'component_type', label: 'Type', type: 'select', options: [
        { value: 'CSP', label: 'CSP' },
        { value: 'SaaS', label: 'SaaS' },
        { value: 'PaaS', label: 'PaaS' },
        { value: 'Open Source', label: 'Open Source' },
        { value: 'COTS', label: 'COTS' },
      ], width: '120px' },
      { key: 'criticality', label: 'Criticality', type: 'select', options: [
        { value: 'Critical', label: 'Critical' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
      ], width: '100px' },
      { key: 'sbom_status', label: 'SBOM', type: 'select', options: [
        { value: 'Complete', label: 'Complete' },
        { value: 'Partial', label: 'Partial' },
        { value: 'Pending', label: 'Pending' },
        { value: 'N/A', label: 'N/A' },
      ], width: '100px' },
      { key: 'risk_level', label: 'Risk', type: 'select', options: [
        { value: 'Critical', label: 'Critical' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
      ], width: '100px' },
    ];

    return (
      <div className="space-y-6">
        <FormField
          name="scrm_plan_summary"
          label="SCRM Plan Summary"
          type="textarea"
          value={scrmPlan?.plan_summary || ''}
          onChange={(v) => updateSCRMPlan({ plan_summary: v })}
          rows={4}
          placeholder="Describe the supply chain risk management approach..."
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Critical Suppliers</label>
          <DynamicTable
            columns={columns}
            rows={scrmEntries}
            onAddRow={() => addSCRMEntry()}
            onDeleteRow={(i) => deleteSCRMEntry(scrmEntries[i]?.id)}
            onUpdateCell={(i, k, v) => updateSCRMEntry(i, k, v)}
            addLabel="Add Supplier"
            emptyMessage="No suppliers defined"
            readOnly={!canEdit}
          />
        </div>
      </div>
    );
  }

  // Privacy Analysis Section
  function renderPrivacyAnalysisSection() {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800">Privacy Threshold Analysis (PTA)</h4>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <FormField
            name="collects_pii"
            label="Does the system collect PII?"
            type="select"
            value={privacyAnalysis?.collects_pii || ''}
            onChange={(v) => updatePrivacyAnalysis({ collects_pii: v })}
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="metadata">Metadata only</option>
          </FormField>
          <FormField
            name="pia_required"
            label="Is a full PIA required?"
            type="select"
            value={privacyAnalysis?.pia_required || ''}
            onChange={(v) => updatePrivacyAnalysis({ pia_required: v })}
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="tbd">TBD</option>
          </FormField>
        </div>
        {privacyAnalysis?.collects_pii === 'yes' && (
          <>
            <FormField
              name="pii_types"
              label="PII Types Collected"
              value={privacyAnalysis?.pii_types || ''}
              onChange={(v) => updatePrivacyAnalysis({ pii_types: v })}
              placeholder="e.g., Name, SSN, Email, Address"
            />
            <div className="p-4 bg-amber-50 rounded-lg mt-6">
              <h4 className="font-medium text-amber-800">Privacy Impact Assessment (PIA)</h4>
            </div>
            <FormField
              name="authority_to_collect"
              label="Authority to Collect"
              type="textarea"
              value={privacyAnalysis?.authority_to_collect || ''}
              onChange={(v) => updatePrivacyAnalysis({ authority_to_collect: v })}
              rows={2}
              placeholder="Legal authority citation..."
            />
            <FormField
              name="purpose_of_collection"
              label="Purpose of Collection"
              type="textarea"
              value={privacyAnalysis?.purpose_of_collection || ''}
              onChange={(v) => updatePrivacyAnalysis({ purpose_of_collection: v })}
              rows={2}
            />
          </>
        )}
        <div className="grid grid-cols-2 gap-6">
          <FormField
            name="sorn_status"
            label="SORN Status"
            type="select"
            value={privacyAnalysis?.sorn_status || ''}
            onChange={(v) => updatePrivacyAnalysis({ sorn_status: v })}
          >
            <option value="">Select...</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Not Required">Not Required</option>
            <option value="N/A">N/A</option>
          </FormField>
          <FormField
            name="sorn_number"
            label="SORN Number"
            value={privacyAnalysis?.sorn_number || ''}
            onChange={(v) => updatePrivacyAnalysis({ sorn_number: v })}
            placeholder="e.g., DHS/ALL-001"
          />
        </div>
      </div>
    );
  }

  // Configuration Management Section
  function renderConfigManagementSection() {
    const columns: TableColumn[] = [
      { key: 'component', label: 'Component', placeholder: 'Web Server' },
      { key: 'benchmark', label: 'Benchmark', placeholder: 'CIS Level 1' },
      { key: 'version', label: 'Version', placeholder: '1.0', width: '80px' },
      { key: 'compliance_pct', label: 'Compliance %', placeholder: '95', width: '100px' },
      { key: 'last_scan', label: 'Last Scan', type: 'date', width: '140px' },
    ];

    return (
      <div className="space-y-6">
        <FormField
          name="cm_purpose"
          label="CM Purpose"
          type="textarea"
          value={configManagement?.purpose || ''}
          onChange={(v) => updateConfigManagement({ purpose: v })}
          rows={3}
          placeholder="Describe the purpose and scope of configuration management..."
        />
        <FormField
          name="change_control_process"
          label="Change Control Process"
          type="textarea"
          value={configManagement?.change_control_process || ''}
          onChange={(v) => updateConfigManagement({ change_control_process: v })}
          rows={3}
          placeholder="Describe the change control process..."
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Configuration Baselines</label>
          <DynamicTable
            columns={columns}
            rows={cmBaselines}
            onAddRow={() => addCMBaseline()}
            onDeleteRow={(i) => deleteCMBaseline(cmBaselines[i]?.id)}
            onUpdateCell={(i, k, v) => updateCMBaseline(i, k, v)}
            addLabel="Add Baseline"
            emptyMessage="No baselines defined"
            readOnly={!canEdit}
          />
        </div>
      </div>
    );
  }

  // POA&M Section
  function renderPOAMSection() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-700">{poamSummary?.critical_count || 0}</div>
            <div className="text-sm text-red-600">Critical</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-700">{poamSummary?.high_count || 0}</div>
            <div className="text-sm text-orange-600">High</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-700">{poamSummary?.moderate_count || 0}</div>
            <div className="text-sm text-yellow-600">Moderate</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-700">{poamSummary?.low_count || 0}</div>
            <div className="text-sm text-blue-600">Low</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{poamSummary?.total_open || 0}</div>
            <div className="text-sm text-gray-500">Open Items</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{poamSummary?.total_closed || 0}</div>
            <div className="text-sm text-gray-500">Closed Items</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-red-600">{poamSummary?.overdue_count || 0}</div>
            <div className="text-sm text-gray-500">Overdue</div>
          </div>
        </div>
        <FormField
          name="review_frequency"
          label="Review Frequency"
          type="select"
          value={poamSummary?.review_frequency || ''}
          onChange={(v) => updatePOAMSummary({ review_frequency: v })}
        >
          <option value="">Select...</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
        </FormField>
        <FormField
          name="remediation_workflow"
          label="Remediation Workflow"
          type="textarea"
          value={poamSummary?.remediation_workflow || ''}
          onChange={(v) => updatePOAMSummary({ remediation_workflow: v })}
          rows={3}
          placeholder="Describe the POA&M remediation process..."
        />
      </div>
    );
  }

  // --- Helper Functions ---

  function getHighestImpact(...levels: (string | undefined)[]): string {
    const order = ['High', 'Moderate', 'Low'];
    for (const level of order) {
      if (levels.includes(level)) return level;
    }
    return '';
  }

  function updateStructuredSection(key: string, data: any) {
    const content = JSON.stringify(data);
    setSectionData(prev => ({
      ...prev,
      [key]: { ...prev[key], content },
    }));
    saveSection(key, content);
  }

  // --- CRUD Operations for Extended Tables ---

  async function addInfoType() {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/info-types`, {
      method: 'POST',
      body: JSON.stringify({ nist_id: '', name: '' }),
    });
    setInfoTypes(prev => [...prev, result]);
  }

  async function deleteInfoType(infoTypeId: string) {
    if (!id || !infoTypeId) return;
    await api(`/api/v1/ssp/${id}/info-types/${infoTypeId}`, { method: 'DELETE' });
    setInfoTypes(prev => prev.filter(it => it.id !== infoTypeId));
  }

  function updateInfoType(index: number, key: string, value: any) {
    setInfoTypes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  async function updateRMFTracking(data: any) {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/rmf-tracking`, {
      method: 'PUT',
      body: JSON.stringify({ ...rmfTracking, ...data }),
    });
    setRmfTracking(result.rmf_tracking);
  }

  async function addPortProtocol() {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/ports-protocols`, {
      method: 'POST',
      body: JSON.stringify({ port: '' }),
    });
    setPortsProtocols(prev => [...prev, result]);
  }

  async function deletePortProtocol(ppsId: string) {
    if (!id || !ppsId) return;
    await api(`/api/v1/ssp/${id}/ports-protocols/${ppsId}`, { method: 'DELETE' });
    setPortsProtocols(prev => prev.filter(p => p.id !== ppsId));
  }

  function updatePortProtocol(index: number, key: string, value: any) {
    setPortsProtocols(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  async function addCryptoModule() {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/crypto-modules`, {
      method: 'POST',
      body: JSON.stringify({ module_name: '' }),
    });
    setCryptoModules(prev => [...prev, result]);
  }

  async function deleteCryptoModule(moduleId: string) {
    if (!id || !moduleId) return;
    await api(`/api/v1/ssp/${id}/crypto-modules/${moduleId}`, { method: 'DELETE' });
    setCryptoModules(prev => prev.filter(m => m.id !== moduleId));
  }

  function updateCryptoModule(index: number, key: string, value: any) {
    setCryptoModules(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  async function updateDigitalIdentity(data: any) {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/digital-identity`, {
      method: 'PUT',
      body: JSON.stringify({ ...digitalIdentity, ...data }),
    });
    setDigitalIdentity(result.digital_identity);
  }

  async function addSeparationDuty() {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/separation-duties`, {
      method: 'POST',
      body: JSON.stringify({ role: '' }),
    });
    setSeparationDuties(prev => [...prev, result]);
  }

  async function deleteSeparationDuty(dutyId: string) {
    if (!id || !dutyId) return;
    await api(`/api/v1/ssp/${id}/separation-duties/${dutyId}`, { method: 'DELETE' });
    setSeparationDuties(prev => prev.filter(d => d.id !== dutyId));
  }

  function updateSeparationDuty(index: number, key: string, value: any) {
    setSeparationDuties(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  async function addPolicyMapping() {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/policy-mappings`, {
      method: 'POST',
      body: JSON.stringify({ control_family: '', policy_title: '' }),
    });
    setPolicyMappings(prev => [...prev, result]);
  }

  async function deletePolicyMapping(mappingId: string) {
    if (!id || !mappingId) return;
    await api(`/api/v1/ssp/${id}/policy-mappings/${mappingId}`, { method: 'DELETE' });
    setPolicyMappings(prev => prev.filter(m => m.id !== mappingId));
  }

  function updatePolicyMapping(index: number, key: string, value: any) {
    setPolicyMappings(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  async function addSCRMEntry() {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/scrm`, {
      method: 'POST',
      body: JSON.stringify({ supplier_name: '' }),
    });
    setScrmEntries(prev => [...prev, result]);
  }

  async function deleteSCRMEntry(entryId: string) {
    if (!id || !entryId) return;
    await api(`/api/v1/ssp/${id}/scrm/${entryId}`, { method: 'DELETE' });
    setScrmEntries(prev => prev.filter(e => e.id !== entryId));
  }

  function updateSCRMEntry(index: number, key: string, value: any) {
    setScrmEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  async function updateSCRMPlan(data: any) {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/scrm-plan`, {
      method: 'PUT',
      body: JSON.stringify({ ...scrmPlan, ...data }),
    });
    setScrmPlan(result.scrm_plan);
  }

  async function updatePrivacyAnalysis(data: any) {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/privacy-analysis`, {
      method: 'PUT',
      body: JSON.stringify({ ...privacyAnalysis, ...data }),
    });
    setPrivacyAnalysis(result.privacy_analysis);
  }

  async function updateConfigManagement(data: any) {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/config-management`, {
      method: 'PUT',
      body: JSON.stringify({ ...configManagement, ...data }),
    });
    setConfigManagement(result.config_management);
  }

  async function addCMBaseline() {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/cm-baselines`, {
      method: 'POST',
      body: JSON.stringify({ component: '' }),
    });
    setCmBaselines(prev => [...prev, result]);
  }

  async function deleteCMBaseline(baselineId: string) {
    if (!id || !baselineId) return;
    await api(`/api/v1/ssp/${id}/cm-baselines/${baselineId}`, { method: 'DELETE' });
    setCmBaselines(prev => prev.filter(b => b.id !== baselineId));
  }

  function updateCMBaseline(index: number, key: string, value: any) {
    setCmBaselines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  async function updatePOAMSummary(data: any) {
    if (!id) return;
    const result = await api(`/api/v1/ssp/${id}/poam-summary`, {
      method: 'PUT',
      body: JSON.stringify({ ...poamSummary, ...data }),
    });
    setPoamSummary(result.poam_summary);
  }
}

export default FISMASSPBuilderPage;
