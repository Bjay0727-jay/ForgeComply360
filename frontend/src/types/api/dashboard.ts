// Dashboard API response schemas
import { z } from 'zod';

// Control status breakdown
export const ControlStatusSchema = z.object({
  implemented: z.number().default(0),
  partially_implemented: z.number().default(0),
  planned: z.number().default(0),
  not_implemented: z.number().default(0),
  not_applicable: z.number().default(0),
  total: z.number().default(0),
});

export type ControlStatus = z.infer<typeof ControlStatusSchema>;

// POA&M status breakdown
export const PoamStatusSchema = z.object({
  open: z.number().default(0),
  in_progress: z.number().default(0),
  completed: z.number().default(0),
  total: z.number().default(0),
});

export type PoamStatus = z.infer<typeof PoamStatusSchema>;

// Risk breakdown
export const RiskBreakdownSchema = z.object({
  low: z.number().default(0),
  moderate: z.number().default(0),
  high: z.number().default(0),
  critical: z.number().default(0),
});

export type RiskBreakdown = z.infer<typeof RiskBreakdownSchema>;

// Main dashboard stats
export const DashboardStatsSchema = z.object({
  systems: z.number().default(0),
  controls: ControlStatusSchema.optional().default({
    implemented: 0,
    partially_implemented: 0,
    planned: 0,
    not_implemented: 0,
    not_applicable: 0,
    total: 0,
  }),
  compliance_percentage: z.number().default(0),
  poams: PoamStatusSchema.optional().default({
    open: 0,
    in_progress: 0,
    completed: 0,
    total: 0,
  }),
  evidence_count: z.number().default(0),
  risks: RiskBreakdownSchema.optional().default({
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  }),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// Dashboard stats API response wrapper
export const DashboardStatsResponseSchema = z.object({
  stats: DashboardStatsSchema.optional().default({
    systems: 0,
    controls: {
      implemented: 0,
      partially_implemented: 0,
      planned: 0,
      not_implemented: 0,
      not_applicable: 0,
      total: 0,
    },
    compliance_percentage: 0,
    poams: {
      open: 0,
      in_progress: 0,
      completed: 0,
      total: 0,
    },
    evidence_count: 0,
    risks: {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    },
  }),
});

export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponseSchema>;

// Framework statistics
export const FrameworkStatSchema = z.object({
  framework_id: z.string(),
  framework_name: z.string(),
  total_controls: z.number().default(0),
  implemented: z.number().default(0),
  partially_implemented: z.number().default(0),
  planned: z.number().default(0),
  not_implemented: z.number().default(0),
  not_applicable: z.number().default(0),
  compliance_percentage: z.number().default(0),
});

export type FrameworkStat = z.infer<typeof FrameworkStatSchema>;

// Framework stats response
export const FrameworkStatsResponseSchema = z.object({
  frameworks: z.array(FrameworkStatSchema).default([]),
});

export type FrameworkStatsResponse = z.infer<typeof FrameworkStatsResponseSchema>;

// Gap analysis item
export const GapItemSchema = z.object({
  family: z.string(),
  framework_id: z.string(),
  framework_name: z.string(),
  gap_count: z.number().default(0),
  total_controls: z.number().default(0),
});

export type GapItem = z.infer<typeof GapItemSchema>;

// Gap analysis response
export const GapAnalysisResponseSchema = z.object({
  gap_analysis: z.array(GapItemSchema).default([]),
});

export type GapAnalysisResponse = z.infer<typeof GapAnalysisResponseSchema>;

// Monitoring dashboard
export const MonitoringDashboardSchema = z.object({
  health_score: z.number().default(100),
  active_rules: z.number().default(0),
  recent_alerts: z.number().default(0),
  tests_24h: z.number().default(0),
  pass_rate: z.number().default(0),
});

export type MonitoringDashboard = z.infer<typeof MonitoringDashboardSchema>;

// Monitoring response wrapper
export const MonitoringResponseSchema = z.object({
  dashboard: MonitoringDashboardSchema.optional().default({
    health_score: 100,
    active_rules: 0,
    recent_alerts: 0,
    tests_24h: 0,
    pass_rate: 0,
  }),
});

export type MonitoringResponse = z.infer<typeof MonitoringResponseSchema>;

// Trend point for compliance history
export const TrendPointSchema = z.object({
  date: z.string(),
  value: z.number().default(0),
  percentage: z.number().optional().default(0),
});

export type TrendPoint = z.infer<typeof TrendPointSchema>;

// Compliance trend response
export const ComplianceTrendResponseSchema = z.object({
  trends: z.array(TrendPointSchema).default([]),
});

export type ComplianceTrendResponse = z.infer<typeof ComplianceTrendResponseSchema>;

// My work data (user tasks)
export const MyWorkDataSchema = z.object({
  poams: z.array(z.object({
    id: z.string(),
    poam_id: z.string(),
    weakness_name: z.string(),
    risk_level: z.string(),
    scheduled_completion: z.string().nullable(),
    is_overdue: z.boolean().default(false),
  })).default([]),
  evidence_schedules: z.array(z.object({
    id: z.string(),
    title: z.string(),
    next_due: z.string().nullable(),
    frequency: z.string(),
  })).default([]),
  audit_tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    due_date: z.string().nullable(),
    status: z.string(),
  })).default([]),
});

export type MyWorkData = z.infer<typeof MyWorkDataSchema>;

// My work response wrapper
export const MyWorkResponseSchema = z.object({
  data: MyWorkDataSchema.optional().default({
    poams: [],
    evidence_schedules: [],
    audit_tasks: [],
  }),
});

export type MyWorkResponse = z.infer<typeof MyWorkResponseSchema>;

// Compliance score dimension
export const ComplianceDimensionSchema = z.object({
  name: z.string(),
  score: z.number().default(0),
  weight: z.number().default(1),
});

export type ComplianceDimension = z.infer<typeof ComplianceDimensionSchema>;

// Compliance score result
export const ComplianceScoreSchema = z.object({
  overall_score: z.number().default(0),
  letter_grade: z.string().default('N/A'),
  dimensions: z.array(ComplianceDimensionSchema).default([]),
});

export type ComplianceScore = z.infer<typeof ComplianceScoreSchema>;

// System compliance score
export const SystemComplianceScoreSchema = z.object({
  system_id: z.string(),
  system_name: z.string(),
  score: z.number().default(0),
  letter_grade: z.string().default('N/A'),
});

export type SystemComplianceScore = z.infer<typeof SystemComplianceScoreSchema>;

// Compliance scores response
export const ComplianceScoresResponseSchema = z.object({
  organization: ComplianceScoreSchema.optional().default({
    overall_score: 0,
    letter_grade: 'N/A',
    dimensions: [],
  }),
  systems: z.array(SystemComplianceScoreSchema).default([]),
});

export type ComplianceScoresResponse = z.infer<typeof ComplianceScoresResponseSchema>;
