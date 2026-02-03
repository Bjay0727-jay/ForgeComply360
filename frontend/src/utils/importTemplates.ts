// importTemplates.ts — Entity configurations for bulk CSV import

export interface ImportColumn {
  csvName: string;
  fieldName: string;
  required: boolean;
  aliases?: string[]; // Alternative CSV header names for fuzzy matching
}

export interface ImportEntityConfig {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  pageLink: string;
  icon: string;
  color: string;
  columns: ImportColumn[];
  validators: Record<string, (value: string) => string | null>;
  needsContext?: boolean; // requires system_id / framework_id from UI
}

const enumValidator = (allowed: string[], label: string) => (v: string): string | null => {
  if (!v) return null;
  if (!allowed.includes(v.toLowerCase())) return `Invalid ${label}: "${v}". Allowed: ${allowed.join(', ')}`;
  return null;
};

const rangeValidator = (min: number, max: number, label: string) => (v: string): string | null => {
  if (!v) return null;
  const n = parseInt(v, 10);
  if (isNaN(n) || n < min || n > max) return `${label} must be ${min}-${max}`;
  return null;
};

const requiredValidator = (label: string) => (v: string): string | null => {
  if (!v.trim()) return `${label} is required`;
  return null;
};

export const IMPORT_CONFIGS: Record<string, ImportEntityConfig> = {
  systems: {
    key: 'systems',
    label: 'Systems',
    description: 'Import information systems with impact levels and deployment models.',
    endpoint: '/api/v1/import/systems',
    pageLink: '/systems',
    icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
    color: 'blue',
    columns: [
      { csvName: 'Name', fieldName: 'name', required: true },
      { csvName: 'Acronym', fieldName: 'acronym', required: false },
      { csvName: 'Description', fieldName: 'description', required: false },
      { csvName: 'Impact Level', fieldName: 'impact_level', required: false },
      { csvName: 'Deployment Model', fieldName: 'deployment_model', required: false },
      { csvName: 'Service Model', fieldName: 'service_model', required: false },
    ],
    validators: {
      name: requiredValidator('Name'),
      impact_level: enumValidator(['low', 'moderate', 'high'], 'Impact Level'),
      deployment_model: enumValidator(['cloud', 'on_premises', 'hybrid', 'government_cloud'], 'Deployment Model'),
      service_model: enumValidator(['iaas', 'paas', 'saas', 'other'], 'Service Model'),
    },
  },
  risks: {
    key: 'risks',
    label: 'Risks',
    description: 'Import risk register entries with scoring and treatment plans.',
    endpoint: '/api/v1/import/risks',
    pageLink: '/risks',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    color: 'orange',
    columns: [
      { csvName: 'Title', fieldName: 'title', required: true },
      { csvName: 'Description', fieldName: 'description', required: false },
      { csvName: 'System', fieldName: 'system', required: false },
      { csvName: 'Category', fieldName: 'category', required: false },
      { csvName: 'Likelihood', fieldName: 'likelihood', required: false },
      { csvName: 'Impact', fieldName: 'impact', required: false },
      { csvName: 'Treatment', fieldName: 'treatment', required: false },
      { csvName: 'Treatment Plan', fieldName: 'treatment_plan', required: false },
      { csvName: 'Treatment Due Date', fieldName: 'treatment_due_date', required: false },
      { csvName: 'Owner', fieldName: 'owner', required: false },
      { csvName: 'Related Controls', fieldName: 'related_controls', required: false },
    ],
    validators: {
      title: requiredValidator('Title'),
      category: enumValidator(['technical', 'operational', 'compliance', 'financial', 'reputational', 'strategic'], 'Category'),
      likelihood: rangeValidator(1, 5, 'Likelihood'),
      impact: rangeValidator(1, 5, 'Impact'),
      treatment: enumValidator(['accept', 'mitigate', 'transfer', 'avoid'], 'Treatment'),
    },
  },
  vendors: {
    key: 'vendors',
    label: 'Vendors',
    description: 'Import third-party vendors with contact and contract information.',
    endpoint: '/api/v1/import/vendors',
    pageLink: '/vendors',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    color: 'green',
    columns: [
      { csvName: 'Name', fieldName: 'name', required: true },
      { csvName: 'Description', fieldName: 'description', required: false },
      { csvName: 'Category', fieldName: 'category', required: false },
      { csvName: 'Criticality', fieldName: 'criticality', required: false },
      { csvName: 'Contact Name', fieldName: 'contact_name', required: false },
      { csvName: 'Contact Email', fieldName: 'contact_email', required: false },
      { csvName: 'Contract Start', fieldName: 'contract_start', required: false },
      { csvName: 'Contract End', fieldName: 'contract_end', required: false },
      { csvName: 'Data Classification', fieldName: 'data_classification', required: false },
      { csvName: 'BAA', fieldName: 'has_baa', required: false },
    ],
    validators: {
      name: requiredValidator('Name'),
      criticality: enumValidator(['low', 'medium', 'high', 'critical'], 'Criticality'),
    },
  },
  poams: {
    key: 'poams',
    label: 'POA&Ms',
    description: 'Import Plan of Action & Milestones with risk levels and assignments.',
    endpoint: '/api/v1/import/poams',
    pageLink: '/poams',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    color: 'purple',
    columns: [
      { csvName: 'Weakness Name', fieldName: 'weakness_name', required: true },
      { csvName: 'Description', fieldName: 'weakness_description', required: false },
      { csvName: 'System', fieldName: 'system', required: true },
      { csvName: 'Risk Level', fieldName: 'risk_level', required: false },
      { csvName: 'Due Date', fieldName: 'scheduled_completion', required: false },
      { csvName: 'Assigned To', fieldName: 'assigned_to', required: false },
      { csvName: 'Responsible Party', fieldName: 'responsible_party', required: false },
      { csvName: 'Cost Estimate', fieldName: 'cost_estimate', required: false },
    ],
    validators: {
      weakness_name: requiredValidator('Weakness Name'),
      system: requiredValidator('System'),
      risk_level: enumValidator(['low', 'moderate', 'high', 'critical'], 'Risk Level'),
    },
  },
  implementations: {
    key: 'implementations',
    label: 'Control Implementations',
    description: 'Import control implementation statuses for a specific system and framework.',
    endpoint: '/api/v1/import/implementations',
    pageLink: '/controls',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    color: 'indigo',
    needsContext: true,
    columns: [
      { csvName: 'Control ID', fieldName: 'control_id', required: true },
      { csvName: 'Status', fieldName: 'status', required: false },
      { csvName: 'Responsible Role', fieldName: 'responsible_role', required: false },
      { csvName: 'Implementation Description', fieldName: 'implementation_description', required: false },
      { csvName: 'AI Narrative', fieldName: 'ai_narrative', required: false },
    ],
    validators: {
      control_id: requiredValidator('Control ID'),
      status: enumValidator(['implemented', 'partially_implemented', 'planned', 'alternative', 'not_applicable', 'not_implemented'], 'Status'),
    },
  },
  nist_controls: {
    key: 'nist_controls',
    label: 'NIST 800-53 Controls',
    description: 'Import control baselines from NIST SP 800-53 exports (eMASS, CSAM, spreadsheets).',
    endpoint: '/api/v1/import/controls',
    pageLink: '/controls',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    color: 'teal',
    needsContext: true,
    columns: [
      { csvName: 'Control ID', fieldName: 'control_id', required: true, aliases: ['Control Identifier', 'CTRL ID', 'Number', 'Control Number'] },
      { csvName: 'Family', fieldName: 'family', required: false, aliases: ['Control Family', 'Family Name'] },
      { csvName: 'Title', fieldName: 'title', required: true, aliases: ['Control Title', 'Control Name'] },
      { csvName: 'Description', fieldName: 'description', required: false, aliases: ['Control Description', 'Statement'] },
      { csvName: 'Baseline', fieldName: 'baseline', required: false, aliases: ['Baseline Impact', 'Baseline Level', 'Impact Level'] },
      { csvName: 'Status', fieldName: 'status', required: false, aliases: ['Implementation Status', 'Control Status', 'Impl Status'] },
      { csvName: 'Implementation Details', fieldName: 'implementation_description', required: false, aliases: ['Implementation Description', 'Impl Details', 'Implementation Narrative'] },
      { csvName: 'Priority', fieldName: 'priority', required: false, aliases: ['Control Priority'] },
    ],
    validators: {
      control_id: requiredValidator('Control ID'),
      title: requiredValidator('Title'),
      priority: enumValidator(['p0', 'p1', 'p2', 'p3'], 'Priority'),
      status: enumValidator(['implemented', 'partially_implemented', 'planned', 'alternative', 'not_applicable', 'not_implemented'], 'Status'),
    },
  },
  poams_fedramp: {
    key: 'poams_fedramp',
    label: 'POA&M (FedRAMP/DoD)',
    description: 'Import POA&Ms in FedRAMP or DoD eMASS format with milestones and risk ratings.',
    endpoint: '/api/v1/import/poams-enhanced',
    pageLink: '/poams',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    color: 'rose',
    columns: [
      { csvName: 'POA&M ID', fieldName: 'poam_id', required: false, aliases: ['POAM ID', 'ID'] },
      { csvName: 'Weakness Name', fieldName: 'weakness_name', required: true, aliases: ['Weakness', 'Finding', 'Vulnerability'] },
      { csvName: 'Weakness Description', fieldName: 'weakness_description', required: false, aliases: ['Description', 'Finding Description'] },
      { csvName: 'System', fieldName: 'system', required: true, aliases: ['System Name', 'Information System'] },
      { csvName: 'Control ID', fieldName: 'control_id', required: false, aliases: ['Control', 'Associated Control'] },
      { csvName: 'Original Risk Rating', fieldName: 'original_risk_rating', required: false, aliases: ['Original Risk', 'Initial Risk'] },
      { csvName: 'Residual Risk Rating', fieldName: 'residual_risk_rating', required: false, aliases: ['Residual Risk', 'Adjusted Risk'] },
      { csvName: 'Risk Level', fieldName: 'risk_level', required: false, aliases: ['Severity', 'Risk'] },
      { csvName: 'Status', fieldName: 'status', required: false, aliases: ['POA&M Status', 'POAM Status'] },
      { csvName: 'Scheduled Completion', fieldName: 'scheduled_completion', required: false, aliases: ['Due Date', 'Completion Date', 'Target Date'] },
      { csvName: 'Milestone 1', fieldName: 'milestone_1', required: false },
      { csvName: 'Milestone 1 Due Date', fieldName: 'milestone_1_date', required: false },
      { csvName: 'Milestone 2', fieldName: 'milestone_2', required: false },
      { csvName: 'Milestone 2 Due Date', fieldName: 'milestone_2_date', required: false },
      { csvName: 'Milestone 3', fieldName: 'milestone_3', required: false },
      { csvName: 'Milestone 3 Due Date', fieldName: 'milestone_3_date', required: false },
      { csvName: 'Responsible Party', fieldName: 'responsible_party', required: false },
      { csvName: 'Resources Required', fieldName: 'resources_required', required: false },
      { csvName: 'Vendor Dependency', fieldName: 'vendor_dependency', required: false },
      { csvName: 'Cost Estimate', fieldName: 'cost_estimate', required: false },
      { csvName: 'Comments', fieldName: 'comments', required: false },
    ],
    validators: {
      weakness_name: requiredValidator('Weakness Name'),
      system: requiredValidator('System'),
      risk_level: enumValidator(['low', 'moderate', 'high', 'critical'], 'Risk Level'),
      original_risk_rating: enumValidator(['low', 'moderate', 'high', 'critical', 'very high'], 'Original Risk Rating'),
      residual_risk_rating: enumValidator(['low', 'moderate', 'high', 'critical', 'very high'], 'Residual Risk Rating'),
      status: enumValidator(['draft', 'open', 'in_progress', 'verification', 'completed', 'accepted', 'deferred'], 'Status'),
    },
  },
};

// Configs that are "specialized" (shown in separate section on import page)
export const SPECIALIZED_IMPORT_KEYS = ['nist_controls', 'poams_fedramp'];
// OSCAL formats are handled separately (not in IMPORT_CONFIGS since they're JSON, not CSV)
export const OSCAL_FORMATS = ['oscal_ssp', 'oscal_catalog'] as const;

/**
 * Download an empty CSV template for an entity type.
 */
export function downloadTemplate(entityType: string): void {
  const config = IMPORT_CONFIGS[entityType];
  if (!config) return;
  const headers = config.columns.map(c => c.csvName);
  const csv = '\uFEFF' + headers.join(',') + '\r\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.label.replace(/[^a-zA-Z0-9]/g, '_')}_Import_Template.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
