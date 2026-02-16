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

// Dashboard widget configuration
export interface DashboardWidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

export const DASHBOARD_WIDGET_TYPES = [
  { id: 'alert_banner', label: 'Alert Banner', description: 'Compliance alerts and actions needed' },
  { id: 'hero_compliance', label: 'Compliance Score', description: 'Organization-wide compliance health' },
  { id: 'key_metrics', label: 'Key Metrics', description: 'Systems, POA&Ms, Evidence, Risks summary' },
  { id: 'executive_summary', label: 'Executive Summary', description: 'Weekly highlights (Manager+)' },
  { id: 'compliance_trend', label: 'Compliance Trend', description: '30-day compliance history chart' },
  { id: 'framework_compliance', label: 'Framework Compliance', description: 'Per-framework compliance scores' },
  { id: 'recommendations', label: 'Smart Recommendations', description: 'AI-powered action suggestions' },
  { id: 'my_work', label: 'My Work', description: 'Your assigned tasks and items' },
  { id: 'monitoring_health', label: 'Monitoring Health', description: 'Automated testing status' },
  { id: 'activity_feed', label: 'Activity Feed', description: 'Recent organization activity' },
] as const;

export type DashboardWidgetId = typeof DASHBOARD_WIDGET_TYPES[number]['id'];

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = DASHBOARD_WIDGET_TYPES.map((w, i) => ({
  id: w.id,
  visible: true,
  order: i,
}));

interface ExperienceConfig {
  experience_type: string;
  display_name: string;
  terminology: Terminology;
  default_workflow: Workflow;
  dashboard_widgets: string[];
  dashboard_widget_config?: DashboardWidgetConfig[];
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
  dashboardWidgets: DashboardWidgetConfig[];
  updateDashboardWidgets: (widgets: DashboardWidgetConfig[]) => Promise<void>;
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
  evidence: 'Artifact Repository',
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
  dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
  updateDashboardWidgets: async () => {},
});

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const { user, org } = useAuth();
  const [config, setConfig] = useState<ExperienceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetConfig[]>(DEFAULT_DASHBOARD_WIDGETS);

  useEffect(() => {
    if (user && org) {
      api<ExperienceConfig>('/api/v1/experience')
        .then((cfg) => {
          setConfig(cfg);
          // Load dashboard widget config if available
          if (cfg.dashboard_widget_config && cfg.dashboard_widget_config.length > 0) {
            setDashboardWidgets(cfg.dashboard_widget_config);
          }
        })
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

  const updateDashboardWidgets = async (widgets: DashboardWidgetConfig[]) => {
    try {
      await api('/api/v1/settings/dashboard-widgets', {
        method: 'PATCH',
        body: JSON.stringify({ widgets }),
      });
      setDashboardWidgets(widgets);
    } catch (err) {
      console.error('Failed to save dashboard widget config:', err);
      throw err;
    }
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
        dashboardWidgets,
        updateDashboardWidgets,
      }}
    >
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  return useContext(ExperienceContext);
}
