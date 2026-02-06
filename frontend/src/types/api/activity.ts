import { z } from 'zod';

// ============================================================================
// Activity Schema (for audit logs and activity feeds)
// ============================================================================

export const ActivitySchema = z.object({
  id: z.string(),
  user_id: z.string().nullable().default(null),
  user_name: z.string().nullable().default(null),
  user_email: z.string().nullable().default(null),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().nullable().default(null),
  resource_name: z.string().nullable().default(null),
  details: z.string().nullable().default(null),
  ip_address: z.string().nullable().default(null),
  user_agent: z.string().nullable().default(null),
  created_at: z.string(),
});

export type Activity = z.infer<typeof ActivitySchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const ActivitiesResponseSchema = z.object({
  activities: z.array(ActivitySchema).default([]),
  total: z.number().optional().default(0),
});

export type ActivitiesResponse = z.infer<typeof ActivitiesResponseSchema>;

// ============================================================================
// Alert Summary Schema (for dashboard)
// ============================================================================

export const AlertSummarySchema = z.object({
  poams_overdue: z.number().default(0),
  poams_upcoming: z.number().default(0),
  ato_expiring: z.number().default(0),
  vendor_assessments_due: z.number().default(0),
  vendor_contracts_ending: z.number().default(0),
  risks_overdue: z.number().default(0),
  policies_review_due: z.number().default(0),
  evidence_expired: z.number().default(0),
  evidence_expiring: z.number().default(0),
  total: z.number().default(0),
});

export type AlertSummary = z.infer<typeof AlertSummarySchema>;

export const AlertSummaryResponseSchema = z.object({
  summary: AlertSummarySchema.optional().default({
    poams_overdue: 0,
    poams_upcoming: 0,
    ato_expiring: 0,
    vendor_assessments_due: 0,
    vendor_contracts_ending: 0,
    risks_overdue: 0,
    policies_review_due: 0,
    evidence_expired: 0,
    evidence_expiring: 0,
    total: 0,
  }),
});

export type AlertSummaryResponse = z.infer<typeof AlertSummaryResponseSchema>;

// ============================================================================
// Executive Summary Schema (for dashboard)
// ============================================================================

export const TeamActivitySchema = z.object({
  user_id: z.string(),
  name: z.string(),
  actions_count: z.number().default(0),
});

export type TeamActivity = z.infer<typeof TeamActivitySchema>;

export const ExecutiveSummarySchema = z.object({
  current_score: z.number().default(0),
  score_delta: z.number().default(0),
  poams_closed: z.number().default(0),
  new_risks: z.number().default(0),
  evidence_uploaded: z.number().default(0),
  team_activity: z.array(TeamActivitySchema).default([]),
});

export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>;

export const ExecutiveSummaryResponseSchema = z.object({
  summary: ExecutiveSummarySchema.optional().default({
    current_score: 0,
    score_delta: 0,
    poams_closed: 0,
    new_risks: 0,
    evidence_uploaded: 0,
    team_activity: [],
  }),
});

export type ExecutiveSummaryResponse = z.infer<typeof ExecutiveSummaryResponseSchema>;
