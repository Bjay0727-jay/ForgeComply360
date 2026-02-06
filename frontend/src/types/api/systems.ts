import { z } from 'zod';

// ============================================================================
// System Schema
// ============================================================================

export const SystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  acronym: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  system_type: z.string().default('general'),
  authorization_status: z.string().default('not_started'),
  ato_date: z.string().nullable().default(null),
  ato_expiry: z.string().nullable().default(null),
  impact_level: z.string().default('moderate'),
  boundary_description: z.string().nullable().default(null),
  environment: z.string().nullable().default(null),
  hosting_type: z.string().nullable().default(null),
  data_types: z.string().nullable().default(null),
  user_count: z.number().nullable().default(null),
  system_owner: z.string().nullable().default(null),
  isso: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type System = z.infer<typeof SystemSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const SystemsResponseSchema = z.object({
  systems: z.array(SystemSchema).default([]),
  total: z.number().optional().default(0),
});

export type SystemsResponse = z.infer<typeof SystemsResponseSchema>;

export const SystemResponseSchema = z.object({
  system: SystemSchema,
});

export type SystemResponse = z.infer<typeof SystemResponseSchema>;
