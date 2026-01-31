import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './useAuth';

interface Terminology {
  assessment: string;
  assessmentShort: string;
  milestone: string;
  system: string;
  compliance: string;
  complianceVerb: string;
  document: string;
  documentShort: string;
  finding: string;
  risk: string;
  control: string;
  evidence: string;
  dashboard: string;
  vendor: string;
}

interface Workflow {
  steps: string[];
  methodology: string;
  defaultFramework: string;
}

interface NavLabels {
  dashboard: string;
  systems: string;
  controls: string;
  poams: string;
  evidence: string;
  ssp: string;
  monitoring: string;
  risks: string;
  vendors: string;
  settings: string;
}

interface ExperienceConfig {
  experience_type: string;
  display_name: string;
  terminology: Terminology;
  default_workflow: Workflow;
  dashboard_widgets: string[];
  nav_labels: NavLabels;
  doc_templates: string[];
  theme_overrides: Record<string, string>;
}

interface ExperienceContextType {
  config: ExperienceConfig | null;
  loading: boolean;
  t: (key: keyof Terminology) => string;
  nav: (key: keyof NavLabels) => string;
  isFederal: boolean;
  isHealthcare: boolean;
  isEnterprise: boolean;
}

const DEFAULT_TERMINOLOGY: Terminology = {
  assessment: 'Assessment',
  assessmentShort: 'Assessment',
  milestone: 'Action Item',
  system: 'System',
  compliance: 'Compliance',
  complianceVerb: 'Assess',
  document: 'Report',
  documentShort: 'Report',
  finding: 'Finding',
  risk: 'Risk',
  control: 'Control',
  evidence: 'Evidence',
  dashboard: 'Dashboard',
  vendor: 'Vendor',
};

const DEFAULT_NAV: NavLabels = {
  dashboard: 'Dashboard',
  systems: 'Systems',
  controls: 'Controls',
  poams: 'Action Items',
  evidence: 'Evidence',
  ssp: 'Reports',
  monitoring: 'Monitoring',
  risks: 'Risks',
  vendors: 'Vendors',
  settings: 'Settings',
};

const ExperienceContext = createContext<ExperienceContextType>({
  config: null,
  loading: true,
  t: (key) => DEFAULT_TERMINOLOGY[key],
  nav: (key) => DEFAULT_NAV[key],
  isFederal: false,
  isHealthcare: false,
  isEnterprise: true,
});

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const { user, org } = useAuth();
  const [config, setConfig] = useState<ExperienceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && org) {
      api<ExperienceConfig>('/api/v1/experience')
        .then(setConfig)
        .catch(() => setConfig(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, org]);

  const t = (key: keyof Terminology): string => {
    return config?.terminology?.[key] || DEFAULT_TERMINOLOGY[key];
  };

  const nav = (key: keyof NavLabels): string => {
    return config?.nav_labels?.[key] || DEFAULT_NAV[key];
  };

  const experienceType = config?.experience_type || org?.experience_type || 'enterprise';

  return (
    <ExperienceContext.Provider
      value={{
        config,
        loading,
        t,
        nav,
        isFederal: experienceType === 'federal',
        isHealthcare: experienceType === 'healthcare',
        isEnterprise: experienceType === 'enterprise',
      }}
    >
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  return useContext(ExperienceContext);
}
