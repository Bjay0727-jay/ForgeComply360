import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

// ---------------------------------------------------------------------------
// Feature Registry
// ---------------------------------------------------------------------------

export interface FeatureDefinition {
  key: string;
  label: string;
  description: string;
  category: string;
  core?: boolean; // core features cannot be disabled
}

const CATEGORY_LABELS: Record<string, string> = {
  overview: 'Overview',
  compliance: 'Compliance',
  remediation: 'Remediation',
  documentation: 'Documentation',
  riskMonitoring: 'Risk & Monitoring',
  tools: 'Tools',
  admin: 'Administration',
};

const FEATURE_REGISTRY: FeatureDefinition[] = [
  // Overview
  { key: 'dashboard', label: 'Dashboard', description: 'Main dashboard with compliance overview', category: 'overview', core: true },
  { key: 'calendar', label: 'Calendar', description: 'Compliance calendar with deadlines and milestones', category: 'overview' },
  { key: 'notifications', label: 'Notifications', description: 'In-app notification center', category: 'overview', core: true },

  // Compliance
  { key: 'systems', label: 'Systems', description: 'Manage information systems and boundaries', category: 'compliance' },
  { key: 'controls', label: 'Controls', description: 'Security controls catalog and implementation status', category: 'compliance' },
  { key: 'assessment', label: 'Assessment', description: 'Control assessment wizard', category: 'compliance' },
  { key: 'questionnaires', label: 'Questionnaires', description: 'Compliance questionnaire builder and responses', category: 'compliance' },
  { key: 'crosswalks', label: 'Crosswalks', description: 'Framework control crosswalk mapping', category: 'compliance' },
  { key: 'systemComparison', label: 'System Comparison', description: 'Side-by-side system compliance comparison', category: 'compliance' },

  // Remediation
  { key: 'poams', label: 'POA&Ms', description: 'Plan of Action and Milestones tracking', category: 'remediation' },
  { key: 'evidence', label: 'Evidence / Artifact Repository', description: 'Evidence artifact upload and management', category: 'remediation' },
  { key: 'evidenceSchedules', label: 'Evidence Schedules', description: 'Automated evidence collection schedules', category: 'remediation' },
  { key: 'evidenceAutomation', label: 'Evidence Automation', description: 'Automated evidence testing and collection', category: 'remediation' },
  { key: 'approvals', label: 'Approvals', description: 'Deviation and change approval workflows', category: 'remediation' },

  // Documentation
  { key: 'ssp', label: 'SSP', description: 'System Security Plan management', category: 'documentation' },
  { key: 'policies', label: 'Policies', description: 'Security policy document management', category: 'documentation' },
  { key: 'auditPrep', label: 'Audit Prep', description: 'Audit preparation checklists and readiness', category: 'documentation' },
  { key: 'reports', label: 'Reports', description: 'Compliance reports and exports', category: 'documentation' },
  { key: 'analytics', label: 'Analytics', description: 'Compliance analytics and trend dashboards', category: 'documentation' },

  // Risk & Monitoring
  { key: 'risks', label: 'Risks', description: 'Risk register and risk management', category: 'riskMonitoring' },
  { key: 'monitoring', label: 'Monitoring', description: 'Continuous monitoring dashboard', category: 'riskMonitoring' },
  { key: 'vendors', label: 'Vendors', description: 'Third-party vendor risk management', category: 'riskMonitoring' },
  { key: 'scans', label: 'Vulnerability Scans', description: 'Vulnerability scan import and tracking', category: 'riskMonitoring' },
  { key: 'assets', label: 'Assets', description: 'IT asset inventory management', category: 'riskMonitoring' },
  { key: 'security-incidents', label: 'Security Incidents', description: 'Security incident detection and response', category: 'riskMonitoring' },

  // Tools
  { key: 'aiWriter', label: 'AI Writer', description: 'AI-assisted authorization package narratives', category: 'tools' },
  { key: 'import', label: 'Compliance Imports', description: 'Bulk import compliance data (OSCAL, CSV)', category: 'tools' },

  // Administration
  { key: 'users', label: 'User Management', description: 'Manage users, roles, and invitations', category: 'admin' },
  { key: 'connectors', label: 'Connectors', description: 'API connector integrations (GitHub, Okta, Jira)', category: 'admin' },
  { key: 'servicenow', label: 'ServiceNow CMDB', description: 'ServiceNow CMDB asset sync', category: 'admin' },
  { key: 'portals', label: 'Auditor Portals', description: 'External auditor portal management', category: 'admin' },
  { key: 'auditLog', label: 'Activity Log', description: 'Organization-wide activity audit trail', category: 'admin' },
  { key: 'settings', label: 'Settings', description: 'Organization and user settings', category: 'admin', core: true },
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface FeatureFlagContextType {
  flags: Record<string, boolean>;
  isFeatureEnabled: (key: string) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: {},
  isFeatureEnabled: () => true,
  loading: true,
  refresh: async () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadFlags = useCallback(async () => {
    try {
      const data = await api('/api/v1/feature-flags');
      setFlags(data.flags || {});
    } catch {
      // Fail-open: if we can't load flags, treat all as enabled
      setFlags({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFlags(); }, [loadFlags]);

  const isFeatureEnabled = useCallback((key: string): boolean => {
    // Core features are always enabled
    const def = FEATURE_REGISTRY.find((f) => f.key === key);
    if (def?.core) return true;
    // If not explicitly set, default to enabled
    if (flags[key] === undefined) return true;
    return flags[key];
  }, [flags]);

  return (
    <FeatureFlagContext.Provider value={{ flags, isFeatureEnabled, loading, refresh: loadFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}

// ---------------------------------------------------------------------------
// Exports for Settings UI
// ---------------------------------------------------------------------------

export { FEATURE_REGISTRY, CATEGORY_LABELS };
