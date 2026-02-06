import { z } from 'zod';

// ============================================================================
// Framework Schema
// ============================================================================

export const FrameworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().default(''),
  description: z.string().nullable().default(null),
  control_count: z.number().default(0),
  family_count: z.number().optional().default(0),
  enabled: z.number().default(0),
  created_at: z.string().optional(),
});

export type Framework = z.infer<typeof FrameworkSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const FrameworksResponseSchema = z.object({
  frameworks: z.array(FrameworkSchema).default([]),
});

export type FrameworksResponse = z.infer<typeof FrameworksResponseSchema>;

export const EnabledFrameworksResponseSchema = z.object({
  frameworks: z.array(FrameworkSchema).default([]),
});

export type EnabledFrameworksResponse = z.infer<typeof EnabledFrameworksResponseSchema>;
