import { z } from 'zod';

// ============================================================================
// Vendor Enums
// ============================================================================

export const VendorCriticalityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export type VendorCriticality = z.infer<typeof VendorCriticalityEnum>;

export const VendorStatusEnum = z.enum([
  'active',
  'under_review',
  'approved',
  'suspended',
  'terminated',
]);
export type VendorStatus = z.infer<typeof VendorStatusEnum>;

// ============================================================================
// Vendor Schema
// ============================================================================

export const VendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  criticality: z.string().default('medium'),
  risk_tier: z.number().nullable().default(null),
  status: z.string().default('active'),
  contact_name: z.string().nullable().default(null),
  contact_email: z.string().nullable().default(null),
  contact_phone: z.string().nullable().default(null),
  website: z.string().nullable().default(null),
  contract_start: z.string().nullable().default(null),
  contract_end: z.string().nullable().default(null),
  contract_value: z.number().nullable().default(null),
  last_assessment_date: z.string().nullable().default(null),
  next_assessment_date: z.string().nullable().default(null),
  overall_risk_score: z.number().nullable().default(null),
  data_classification: z.string().nullable().default(null),
  data_access_level: z.string().nullable().default(null),
  has_baa: z.number().default(0),
  has_nda: z.number().default(0),
  soc2_certified: z.number().default(0),
  iso27001_certified: z.number().default(0),
  metadata: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type Vendor = z.infer<typeof VendorSchema>;

// ============================================================================
// Vendor Assessment Schema
// ============================================================================

export const VendorAssessmentSchema = z.object({
  id: z.string(),
  vendor_id: z.string(),
  assessment_date: z.string(),
  assessor: z.string().nullable().default(null),
  overall_score: z.number().nullable().default(null),
  security_score: z.number().nullable().default(null),
  compliance_score: z.number().nullable().default(null),
  operational_score: z.number().nullable().default(null),
  findings: z.string().nullable().default(null),
  recommendations: z.string().nullable().default(null),
  status: z.string().default('completed'),
  created_at: z.string(),
});

export type VendorAssessment = z.infer<typeof VendorAssessmentSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const VendorsResponseSchema = z.object({
  vendors: z.array(VendorSchema).default([]),
  total: z.number().default(0),
});

export type VendorsResponse = z.infer<typeof VendorsResponseSchema>;

export const VendorResponseSchema = z.object({
  vendor: VendorSchema,
});

export type VendorResponse = z.infer<typeof VendorResponseSchema>;

export const VendorAssessmentsResponseSchema = z.object({
  assessments: z.array(VendorAssessmentSchema).default([]),
});

export type VendorAssessmentsResponse = z.infer<typeof VendorAssessmentsResponseSchema>;

// ============================================================================
// Vendor Stats Schema
// ============================================================================

export const VendorStatsSchema = z.object({
  total: z.number().default(0),
  active: z.number().default(0),
  by_criticality: z.record(z.string(), z.number()).default({}),
  by_status: z.record(z.string(), z.number()).default({}),
  assessments_due: z.number().default(0),
  contracts_expiring: z.number().default(0),
  avg_risk_score: z.number().default(0),
});

export type VendorStats = z.infer<typeof VendorStatsSchema>;
