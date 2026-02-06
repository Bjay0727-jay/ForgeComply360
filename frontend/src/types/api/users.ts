import { z } from 'zod';

// ============================================================================
// Role Enum
// ============================================================================

export const UserRoleEnum = z.enum(['owner', 'admin', 'manager', 'analyst', 'viewer']);
export type UserRole = z.infer<typeof UserRoleEnum>;

// ============================================================================
// Organization User Schema (full user data)
// ============================================================================

export const OrgUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: UserRoleEnum.default('viewer'),
  status: z.enum(['active', 'deactivated']).default('active'),
  mfa_enabled: z.number().default(0),
  onboarding_completed: z.number().default(0),
  last_login_at: z.string().nullable().default(null),
  created_at: z.string(),
  failed_login_attempts: z.number().default(0),
  locked_until: z.string().nullable().default(null),
});

export type OrgUser = z.infer<typeof OrgUserSchema>;

// ============================================================================
// Organization Member Schema (lightweight, for dropdowns/assignments)
// ============================================================================

export const OrgMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
});

export type OrgMember = z.infer<typeof OrgMemberSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const OrgUsersResponseSchema = z.object({
  users: z.array(OrgUserSchema).default([]),
  total: z.number().optional().default(0),
});

export type OrgUsersResponse = z.infer<typeof OrgUsersResponseSchema>;

export const OrgMembersResponseSchema = z.object({
  members: z.array(OrgMemberSchema).default([]),
});

export type OrgMembersResponse = z.infer<typeof OrgMembersResponseSchema>;
