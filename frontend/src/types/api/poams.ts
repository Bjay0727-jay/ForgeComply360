import { z } from 'zod';

// ============================================================================
// POAM Status Enum
// ============================================================================

export const PoamStatusEnum = z.enum([
  'draft',
  'open',
  'in_progress',
  'verification',
  'completed',
  'accepted',
  'deferred',
]);
export type PoamStatusValue = z.infer<typeof PoamStatusEnum>;

// ============================================================================
// POAM Schema
// ============================================================================

export const PoamSchema = z.object({
  id: z.string(),
  poam_id: z.string(),
  system_id: z.string(),
  system_name: z.string().default(''),
  weakness_name: z.string(),
  weakness_description: z.string().nullable().default(null),
  source: z.string().nullable().default(null),
  risk_level: z.string().default('moderate'),
  status: z.string().default('open'),
  scheduled_completion: z.string().nullable().default(null),
  actual_completion: z.string().nullable().default(null),
  responsible_party: z.string().nullable().default(null),
  assigned_to: z.string().nullable().default(null),
  assigned_to_name: z.string().nullable().default(null),
  resources_required: z.string().nullable().default(null),
  cost_estimate: z.string().nullable().default(null),
  vendor_dependency: z.number().default(0),
  age_days: z.number().default(0),
  is_overdue: z.number().default(0),
  related_controls: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type Poam = z.infer<typeof PoamSchema>;

// ============================================================================
// Milestone Schema
// ============================================================================

export const MilestoneSchema = z.object({
  id: z.string(),
  poam_id: z.string(),
  title: z.string(),
  description: z.string().nullable().default(null),
  target_date: z.string().nullable().default(null),
  completion_date: z.string().nullable().default(null),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  created_at: z.string(),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

// ============================================================================
// Comment Schema (shared with controls)
// ============================================================================

export const CommentSchema = z.object({
  id: z.string(),
  content: z.string(),
  author_id: z.string().nullable().default(null),
  author_name: z.string().default('Unknown'),
  created_at: z.string(),
});

export type Comment = z.infer<typeof CommentSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const PoamsResponseSchema = z.object({
  poams: z.array(PoamSchema).default([]),
  total: z.number().default(0),
});

export type PoamsResponse = z.infer<typeof PoamsResponseSchema>;

export const PoamResponseSchema = z.object({
  poam: PoamSchema,
});

export type PoamResponse = z.infer<typeof PoamResponseSchema>;

export const MilestonesResponseSchema = z.object({
  milestones: z.array(MilestoneSchema).default([]),
});

export type MilestonesResponse = z.infer<typeof MilestonesResponseSchema>;

export const CommentsResponseSchema = z.object({
  comments: z.array(CommentSchema).default([]),
});

export type CommentsResponse = z.infer<typeof CommentsResponseSchema>;

// ============================================================================
// POAM Stats Schema
// ============================================================================

export const PoamStatsSchema = z.object({
  total: z.number().default(0),
  open: z.number().default(0),
  in_progress: z.number().default(0),
  completed: z.number().default(0),
  overdue: z.number().default(0),
  by_risk_level: z.record(z.string(), z.number()).default({}),
  by_status: z.record(z.string(), z.number()).default({}),
});

export type PoamStats = z.infer<typeof PoamStatsSchema>;
