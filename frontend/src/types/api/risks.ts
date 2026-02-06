import { z } from 'zod';

// ============================================================================
// Risk Enums
// ============================================================================

export const RiskCategoryEnum = z.enum([
  'technical',
  'operational',
  'compliance',
  'financial',
  'reputational',
  'strategic',
]);
export type RiskCategory = z.infer<typeof RiskCategoryEnum>;

export const RiskLevelEnum = z.enum(['low', 'moderate', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelEnum>;

export const RiskTreatmentEnum = z.enum(['mitigate', 'accept', 'transfer', 'avoid']);
export type RiskTreatment = z.infer<typeof RiskTreatmentEnum>;

export const RiskStatusEnum = z.enum(['open', 'in_treatment', 'monitored', 'closed', 'accepted']);
export type RiskStatus = z.infer<typeof RiskStatusEnum>;

// ============================================================================
// Risk Schema
// ============================================================================

export const RiskSchema = z.object({
  id: z.string(),
  risk_id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  system_id: z.string(),
  system_name: z.string().default(''),
  category: z.string().default('technical'),
  likelihood: z.number().min(1).max(5).default(3),
  impact: z.number().min(1).max(5).default(3),
  risk_score: z.number().default(0),
  risk_level: z.string().default('moderate'),
  treatment: z.string().default('mitigate'),
  treatment_plan: z.string().nullable().default(null),
  treatment_due_date: z.string().nullable().default(null),
  owner: z.string().nullable().default(null),
  owner_name: z.string().nullable().default(null),
  status: z.string().default('open'),
  related_controls: z.string().nullable().default(null),
  ai_risk_score: z.number().nullable().default(null),
  ai_recommendation: z.string().nullable().default(null),
  ai_scored_at: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type Risk = z.infer<typeof RiskSchema>;

// ============================================================================
// Risk Stats Schema
// ============================================================================

export const RiskStatsSchema = z.object({
  total: z.number().default(0),
  open_count: z.number().default(0),
  avg_score: z.number().default(0),
  with_treatment: z.number().default(0),
  by_level: z.record(z.string(), z.number()).default({}),
  by_treatment: z.record(z.string(), z.number()).default({}),
  by_category: z.record(z.string(), z.number()).default({}),
});

export type RiskStats = z.infer<typeof RiskStatsSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const RisksResponseSchema = z.object({
  risks: z.array(RiskSchema).default([]),
  total: z.number().default(0),
});

export type RisksResponse = z.infer<typeof RisksResponseSchema>;

export const RiskResponseSchema = z.object({
  risk: RiskSchema,
});

export type RiskResponse = z.infer<typeof RiskResponseSchema>;

export const RiskStatsResponseSchema = z.object({
  stats: RiskStatsSchema.optional().default({
    total: 0,
    open_count: 0,
    avg_score: 0,
    with_treatment: 0,
    by_level: {},
    by_treatment: {},
    by_category: {},
  }),
});

export type RiskStatsResponse = z.infer<typeof RiskStatsResponseSchema>;
