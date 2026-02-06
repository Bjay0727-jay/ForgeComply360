export const mockUser = {
  id: 'user-1',
  email: 'admin@forgecyber.com',
  name: 'Test Admin',
  role: 'admin',
  onboarding_completed: 1,
  mfa_enabled: 0,
};

export const mockViewerUser = {
  ...mockUser,
  id: 'user-2',
  email: 'viewer@forgecyber.com',
  name: 'Test Viewer',
  role: 'viewer',
};

export const mockAnalystUser = {
  ...mockUser,
  id: 'user-3',
  email: 'analyst@forgecyber.com',
  name: 'Test Analyst',
  role: 'analyst',
};

export const mockOwnerUser = {
  ...mockUser,
  id: 'user-4',
  email: 'owner@forgecyber.com',
  name: 'Test Owner',
  role: 'owner',
};

export const mockOrg = {
  id: 'org-1',
  name: 'Forge Cyber Defense',
  industry: 'cybersecurity',
  experience_type: 'federal',
  subscription_tier: 'professional',
  subscription_status: 'active',
};

export const mockEnterpriseOrg = {
  ...mockOrg,
  experience_type: 'enterprise',
};

export const mockHealthcareOrg = {
  ...mockOrg,
  experience_type: 'healthcare',
};

export const mockExperienceConfig = {
  experience_type: 'federal',
  display_name: 'Federal',
  terminology: {
    assessment: 'Authorization',
    assessmentShort: 'ATO',
    milestone: 'Milestone',
    system: 'Information System',
    compliance: 'Authorization',
    complianceVerb: 'Authorize',
    document: 'System Security Plan',
    documentShort: 'SSP',
    finding: 'Weakness',
    risk: 'Risk',
    control: 'Control',
    evidence: 'Artifact',
    dashboard: 'Mission Dashboard',
    vendor: 'Vendor',
  },
  default_workflow: {
    steps: ['Categorize', 'Select', 'Implement', 'Assess', 'Authorize', 'Monitor'],
    methodology: 'RMF',
    defaultFramework: 'NIST 800-53',
  },
  dashboard_widgets: ['compliance_score', 'poam_status', 'ato_timeline'],
  nav_labels: {
    dashboard: 'Mission Dashboard',
    systems: 'Information Systems',
    controls: 'Security Controls',
    poams: 'POA&Ms',
    evidence: 'Artifacts',
    ssp: 'SSP Builder',
    monitoring: 'ConMon',
    risks: 'Risk Register',
    vendors: 'Vendors',
    settings: 'Settings',
  },
  doc_templates: ['ssp', 'poam_report', 'sar'],
  theme_overrides: {},
};

export const mockSubscription = {
  tier: 'professional',
  status: 'active',
  trial_ends_at: null,
  usage: { frameworks: 2, systems: 3 },
  limits: { max_frameworks: 5, max_systems: 10 },
};
