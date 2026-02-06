import { z } from 'zod';

// ============================================================================
// Control Schema
// ============================================================================

export const ControlSchema = z.object({
  id: z.string(),
  control_id: z.string(),
  framework_id: z.string(),
  title: z.string(),
  family: z.string().default(''),
  description: z.string().nullable().default(null),
  guidance: z.string().nullable().default(null),
  related_controls: z.string().nullable().default(null),
  priority: z.string().nullable().default(null),
  baseline_low: z.number().optional().default(0),
  baseline_moderate: z.number().optional().default(0),
  baseline_high: z.number().optional().default(0),
});

export type Control = z.infer<typeof ControlSchema>;

// ============================================================================
// Implementation Schema
// ============================================================================

export const ImplementationStatusValues = [
  'implemented',
  'partially_implemented',
  'planned',
  'alternative',
  'not_applicable',
  'not_implemented',
] as const;

export type ImplementationStatus = typeof ImplementationStatusValues[number];

export const ImplementationSchema = z.object({
  id: z.string(),
  control_id: z.string(),
  system_id: z.string(),
  framework_id: z.string(),
  status: z.string().default('not_implemented'),
  implementation_description: z.string().nullable().default(null),
  responsible_role: z.string().nullable().default(null),
  ai_narrative: z.string().nullable().default(null),
  ai_narrative_generated_at: z.string().nullable().default(null),
  inherited: z.number().default(0),
  inherited_from: z.string().nullable().default(null),
  inherited_from_name: z.string().nullable().default(null),
  updated_at: z.string().optional(),
  updated_by: z.string().nullable().default(null),
});

export type Implementation = z.infer<typeof ImplementationSchema>;

// ============================================================================
// Control Comment Schema
// ============================================================================

export const ControlCommentSchema = z.object({
  id: z.string(),
  control_id: z.string(),
  system_id: z.string().optional(),
  content: z.string(),
  author_id: z.string().nullable().default(null),
  author_name: z.string().default('Unknown'),
  created_at: z.string(),
});

export type ControlComment = z.infer<typeof ControlCommentSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const ControlsResponseSchema = z.object({
  controls: z.array(ControlSchema).default([]),
  total: z.number().default(0),
});

export type ControlsResponse = z.infer<typeof ControlsResponseSchema>;

export const ImplementationsResponseSchema = z.object({
  implementations: z.array(ImplementationSchema).default([]),
});

export type ImplementationsResponse = z.infer<typeof ImplementationsResponseSchema>;

export const ControlCommentsResponseSchema = z.object({
  comments: z.array(ControlCommentSchema).default([]),
});

export type ControlCommentsResponse = z.infer<typeof ControlCommentsResponseSchema>;

// ============================================================================
// Inheritance Map Types (matches InheritanceTreeView component)
// ============================================================================

export interface InheritanceNode {
  id: string;
  name: string;
  type: 'provider' | 'consumer' | 'both' | 'standalone';
  native_controls: number;
  inherited_controls: number;
  provided_controls: number;
}

export interface InheritanceEdge {
  source: string;
  target: string;
  control_count: number;
  families: string[];
  statuses: Record<string, number>;
  controls: string[];
}

export interface InheritanceSummary {
  total_systems: number;
  providers: number;
  consumers: number;
  total_inherited: number;
  total_edges: number;
}

export interface InheritanceMap {
  nodes: InheritanceNode[];
  edges: InheritanceEdge[];
  summary: InheritanceSummary;
}
