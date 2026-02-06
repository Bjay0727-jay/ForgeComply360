// Evidence API response schemas
import { z } from 'zod';

// Automation stats - includes the pass_rate_24h fix
export const AutomationStatsSchema = z.object({
  total_tests: z.number().default(0),
  pass_rate_24h: z.number().default(0),  // THE FIX - defaults to 0 if missing
  tests_run_today: z.number().default(0),
  failed_tests: z.number().default(0),
  active_rules: z.number().default(0),
  pending_reviews: z.number().default(0),
});

export type AutomationStats = z.infer<typeof AutomationStatsSchema>;

// Evidence item schema
export const EvidenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  file_name: z.string().default(''),
  file_size: z.number().default(0),
  mime_type: z.string().optional().default(''),
  description: z.string().optional().default(''),
  status: z.enum(['active', 'expired', 'archived']).default('active'),
  collection_date: z.string().nullable().default(null),
  expiry_date: z.string().nullable().default(null),
  uploaded_by: z.string().optional(),
  uploaded_by_name: z.string().optional().default('Unknown'),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

// Evidence list response
export const EvidenceListResponseSchema = z.object({
  evidence: z.array(EvidenceSchema).default([]),
  total: z.number().default(0),
});

export type EvidenceListResponse = z.infer<typeof EvidenceListResponseSchema>;

// Automation rule schema
export const AutomationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(''),
  rule_type: z.string(),
  target_url: z.string().optional().default(''),
  schedule_cron: z.string().optional().default(''),
  enabled: z.number().default(1),
  last_run: z.string().nullable().default(null),
  last_status: z.enum(['pass', 'fail', 'error', 'pending']).nullable().default(null),
  consecutive_failures: z.number().default(0),
  control_id: z.string().nullable().default(null),
  control_title: z.string().optional().default(''),
});

export type AutomationRule = z.infer<typeof AutomationRuleSchema>;

// Automation rules list response
export const AutomationRulesResponseSchema = z.object({
  rules: z.array(AutomationRuleSchema).default([]),
});

export type AutomationRulesResponse = z.infer<typeof AutomationRulesResponseSchema>;

// Automation test result schema
export const AutomationResultSchema = z.object({
  id: z.string(),
  rule_id: z.string(),
  rule_name: z.string().optional().default(''),
  status: z.enum(['pass', 'fail', 'error']),
  message: z.string().optional().default(''),
  evidence_url: z.string().nullable().default(null),
  screenshot_url: z.string().nullable().default(null),
  executed_at: z.string(),
  duration_ms: z.number().optional().default(0),
});

export type AutomationResult = z.infer<typeof AutomationResultSchema>;

// Automation results list response
export const AutomationResultsResponseSchema = z.object({
  results: z.array(AutomationResultSchema).default([]),
  total: z.number().default(0),
});

export type AutomationResultsResponse = z.infer<typeof AutomationResultsResponseSchema>;
