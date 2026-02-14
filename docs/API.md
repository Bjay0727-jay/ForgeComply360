# ForgeComply 360 API Documentation

**Version:** 5.0.0
**Base URL:** `https://forge-comply360-api.stanley-riley.workers.dev`

---

## Overview

The ForgeComply 360 API is a RESTful API built on Cloudflare Workers. All endpoints require authentication unless otherwise noted. Responses are JSON-formatted.

### Authentication

All authenticated requests require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via the `/api/v1/auth/login` endpoint and can be refreshed using `/api/v1/auth/refresh`.

### Rate Limiting

- **Login/Register:** 5 requests per 60 seconds per IP
- **MFA Verification:** 5 attempts per 60 seconds per user
- **General API:** 100 requests per 60 seconds per user

Rate-limited responses return HTTP 429 with a `Retry-After` header.

### Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Validation errors include field details:

```json
{
  "error": "Validation failed",
  "fields": {
    "email": "email is required",
    "password": "password must be at least 8 characters"
  }
}
```

---

## Authentication Endpoints

### POST /api/v1/auth/register

Create a new user account and organization.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "organization_name": "Acme Corp"
}
```

**Response (201):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "owner"
  },
  "org": {
    "id": "uuid",
    "name": "Acme Corp"
  }
}
```

---

### POST /api/v1/auth/login

Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):** Same as register, or if MFA is enabled:

```json
{
  "mfa_required": true,
  "mfa_token": "temporary-token"
}
```

---

### POST /api/v1/auth/mfa/verify

Complete MFA verification during login.

**Request Body:**
```json
{
  "mfa_token": "temporary-token",
  "code": "123456"
}
```

**Response (200):** Full authentication response with tokens.

---

### POST /api/v1/auth/refresh

Refresh an expired access token.

**Request Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

---

### GET /api/v1/auth/me

Get current authenticated user information.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "mfa_enabled": true,
    "onboarding_completed": true
  },
  "org": {
    "id": "uuid",
    "name": "Acme Corp",
    "subscription_tier": "enterprise"
  }
}
```

---

### POST /api/v1/auth/change-password

Change the current user's password.

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### POST /api/v1/auth/mfa/setup

Initialize MFA setup. Returns a TOTP secret and QR code.

**Response (200):**
```json
{
  "secret": "BASE32SECRET",
  "qr_code_url": "otpauth://totp/ForgeComply:user@example.com?secret=..."
}
```

---

### POST /api/v1/auth/mfa/verify-setup

Complete MFA setup by verifying the first code.

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "backup_codes": ["code1", "code2", "..."]
}
```

---

### POST /api/v1/auth/mfa/disable

Disable MFA for the current user.

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "MFA disabled"
}
```

---

## Systems Endpoints

### GET /api/v1/systems

List all information systems for the organization.

**Query Parameters:**
- `search` - Filter by name (optional)
- `type` - Filter by system type (optional)

**Response (200):**
```json
{
  "systems": [
    {
      "id": "uuid",
      "name": "Production Cloud",
      "abbreviation": "PROD",
      "description": "Main production environment",
      "system_type": "major_application",
      "fips_impact_level": "moderate",
      "status": "operational",
      "ato_status": "authorized",
      "ato_date": "2024-01-15",
      "ato_expiration": "2027-01-15",
      "authorizing_official": "Jane Smith",
      "system_owner": "John Doe",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/v1/systems

Create a new information system.

**Request Body:**
```json
{
  "name": "Development Environment",
  "abbreviation": "DEV",
  "description": "Development and testing environment",
  "system_type": "minor_application",
  "fips_impact_level": "low",
  "status": "under_development",
  "boundary_description": "AWS us-east-1 VPC",
  "parent_system_id": "uuid-of-parent"
}
```

**Response (201):**
```json
{
  "system": { ... }
}
```

---

### PUT /api/v1/systems/:id

Update an existing system.

---

### DELETE /api/v1/systems/:id

Delete a system (admin/owner only).

---

## Frameworks Endpoints

### GET /api/v1/frameworks

List all available compliance frameworks.

**Response (200):**
```json
{
  "frameworks": [
    {
      "id": "nist-800-53-rev5",
      "name": "NIST SP 800-53 Rev 5",
      "version": "Rev 5",
      "description": "Security and Privacy Controls for Information Systems",
      "control_count": 1189,
      "category": "federal"
    }
  ]
}
```

---

### GET /api/v1/frameworks/enabled

List frameworks enabled for the organization.

**Response (200):**
```json
{
  "frameworks": [
    {
      "id": "nist-800-53-rev5",
      "name": "NIST SP 800-53 Rev 5",
      "enabled_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/v1/frameworks/enable

Enable a framework for the organization.

**Request Body:**
```json
{
  "framework_id": "fedramp-moderate"
}
```

---

### POST /api/v1/frameworks/disable

Disable a framework for the organization.

**Request Body:**
```json
{
  "framework_id": "fedramp-moderate"
}
```

---

## Controls Endpoints

### GET /api/v1/controls

List security controls with optional filtering.

**Query Parameters:**
- `framework_id` - Filter by framework (required)
- `family` - Filter by control family (e.g., "AC", "AU")
- `search` - Search in control ID and title
- `baseline` - Filter by baseline level (low, moderate, high)
- `priority` - Filter by priority (P1, P2, P3)

**Response (200):**
```json
{
  "controls": [
    {
      "id": "AC-1",
      "framework_id": "nist-800-53-rev5",
      "family": "AC",
      "title": "Policy and Procedures",
      "description": "...",
      "supplemental_guidance": "...",
      "baseline_low": true,
      "baseline_moderate": true,
      "baseline_high": true,
      "priority": "P1"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 50
}
```

---

### GET /api/v1/crosswalks

Get control mappings across frameworks.

**Query Parameters:**
- `source_framework` - Source framework ID
- `target_framework` - Target framework ID
- `control_id` - Specific control to map

**Response (200):**
```json
{
  "crosswalks": [
    {
      "source_control_id": "AC-1",
      "source_framework": "nist-800-53-rev5",
      "target_control_id": "CC6.1",
      "target_framework": "soc2",
      "relationship": "equivalent",
      "notes": "Direct mapping"
    }
  ]
}
```

---

## Implementations Endpoints

### GET /api/v1/implementations

List control implementations for a system.

**Query Parameters:**
- `system_id` - System ID (required)
- `framework_id` - Filter by framework
- `status` - Filter by status (implemented, partially_implemented, planned, not_implemented, not_applicable)
- `family` - Filter by control family

**Response (200):**
```json
{
  "implementations": [
    {
      "id": "uuid",
      "control_id": "AC-1",
      "system_id": "uuid",
      "framework_id": "nist-800-53-rev5",
      "status": "implemented",
      "implementation_description": "Policy documented in...",
      "responsible_role": "ISSO",
      "ai_narrative": "...",
      "inherited": false,
      "inherited_from": null,
      "updated_at": "2024-01-15T00:00:00Z"
    }
  ],
  "stats": {
    "implemented": 45,
    "partially_implemented": 12,
    "planned": 8,
    "not_implemented": 5,
    "not_applicable": 10,
    "total": 80
  }
}
```

---

### POST /api/v1/implementations

Create or update a control implementation.

**Request Body:**
```json
{
  "control_id": "AC-1",
  "system_id": "uuid",
  "framework_id": "nist-800-53-rev5",
  "status": "implemented",
  "implementation_description": "Policy is documented in...",
  "responsible_role": "ISSO"
}
```

---

### POST /api/v1/implementations/bulk

Bulk initialize implementations for a system and framework.

**Request Body:**
```json
{
  "system_id": "uuid",
  "framework_id": "nist-800-53-rev5",
  "baseline": "moderate"
}
```

---

### POST /api/v1/implementations/bulk-update

Bulk update multiple implementations.

**Request Body:**
```json
{
  "updates": [
    {
      "id": "uuid",
      "status": "implemented",
      "implementation_description": "..."
    }
  ]
}
```

---

### POST /api/v1/implementations/inherit

Inherit implementations from a parent system.

**Request Body:**
```json
{
  "child_system_id": "uuid",
  "parent_system_id": "uuid",
  "framework_id": "nist-800-53-rev5",
  "control_ids": ["AC-1", "AC-2", "AC-3"]
}
```

---

### GET /api/v1/implementations/inheritance-map

Get the inheritance relationship map for systems.

**Query Parameters:**
- `system_id` - System to get map for

**Response (200):**
```json
{
  "nodes": [
    { "id": "uuid", "name": "Parent System", "type": "provider" },
    { "id": "uuid", "name": "Child System", "type": "consumer" }
  ],
  "edges": [
    { "source": "parent-uuid", "target": "child-uuid", "controls": 45 }
  ],
  "summary": {
    "total_inherited": 45,
    "total_edges": 1
  }
}
```

---

## Evidence Endpoints

### GET /api/v1/evidence

List evidence artifacts.

**Query Parameters:**
- `system_id` - Filter by system
- `control_id` - Filter by linked control
- `type` - Filter by evidence type

**Response (200):**
```json
{
  "evidence": [
    {
      "id": "uuid",
      "title": "Access Control Policy v2.1",
      "description": "Annual policy review",
      "type": "document",
      "file_name": "ac-policy-v2.1.pdf",
      "file_size": 245678,
      "mime_type": "application/pdf",
      "collected_at": "2024-01-15T00:00:00Z",
      "uploaded_by": "John Doe",
      "control_links": ["AC-1", "AC-2"]
    }
  ]
}
```

---

### POST /api/v1/evidence

Upload new evidence (multipart/form-data).

**Form Fields:**
- `file` - The evidence file
- `title` - Evidence title
- `description` - Description
- `type` - Evidence type (document, screenshot, test_result, log, config, attestation)
- `system_id` - Associated system
- `control_ids` - Comma-separated control IDs to link

---

### POST /api/v1/evidence/link

Link evidence to controls.

**Request Body:**
```json
{
  "evidence_id": "uuid",
  "control_ids": ["AC-1", "AC-2"]
}
```

---

### GET /api/v1/evidence/schedules

List evidence collection schedules.

**Response (200):**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "title": "Monthly Access Review",
      "description": "Review of user access rights",
      "frequency": "monthly",
      "next_due": "2024-02-01",
      "assigned_to": "uuid",
      "assigned_to_name": "Jane Doe",
      "control_ids": ["AC-2", "AC-6"],
      "last_collected": "2024-01-01",
      "status": "on_track"
    }
  ]
}
```

---

### POST /api/v1/evidence/schedules

Create an evidence schedule.

**Request Body:**
```json
{
  "title": "Quarterly Vulnerability Scan",
  "description": "Run and document vulnerability scan",
  "frequency": "quarterly",
  "start_date": "2024-01-01",
  "assigned_to": "uuid",
  "control_ids": ["RA-5", "SI-2"]
}
```

---

## POAMs Endpoints

### GET /api/v1/poams

List Plans of Action and Milestones.

**Query Parameters:**
- `system_id` - Filter by system
- `status` - Filter by status (open, in_progress, completed, cancelled)
- `risk_level` - Filter by risk level (low, moderate, high, critical)

**Response (200):**
```json
{
  "poams": [
    {
      "id": "uuid",
      "poam_id": "POAM-2024-001",
      "system_id": "uuid",
      "system_name": "Production Cloud",
      "weakness_name": "Outdated TLS Configuration",
      "weakness_description": "...",
      "control_id": "SC-8",
      "risk_level": "high",
      "status": "in_progress",
      "scheduled_completion": "2024-03-15",
      "actual_completion": null,
      "resources_required": "2 engineering days",
      "milestones": [
        {
          "id": "uuid",
          "description": "Update TLS configuration",
          "due_date": "2024-02-15",
          "status": "completed"
        }
      ],
      "comments_count": 3,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/v1/poams

Create a new POAM.

**Request Body:**
```json
{
  "system_id": "uuid",
  "weakness_name": "Missing Audit Logging",
  "weakness_description": "Detailed description...",
  "control_id": "AU-2",
  "risk_level": "moderate",
  "scheduled_completion": "2024-06-30",
  "resources_required": "5 engineering days",
  "remediation_plan": "Step-by-step plan..."
}
```

---

## Risks Endpoints

### GET /api/v1/risks

List risks in the risk register.

**Query Parameters:**
- `system_id` - Filter by system
- `status` - Filter by status (identified, analyzing, mitigating, monitoring, closed)
- `level` - Filter by risk level

**Response (200):**
```json
{
  "risks": [
    {
      "id": "uuid",
      "title": "Third-party Data Breach",
      "description": "...",
      "category": "vendor",
      "likelihood": 3,
      "impact": 4,
      "risk_score": 12,
      "risk_level": "high",
      "status": "mitigating",
      "mitigation_plan": "...",
      "owner": "John Doe",
      "system_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/v1/risks

Create a new risk.

**Request Body:**
```json
{
  "title": "Ransomware Attack",
  "description": "Risk of ransomware affecting operations",
  "category": "threat",
  "likelihood": 3,
  "impact": 5,
  "system_id": "uuid",
  "mitigation_plan": "Implement backup strategy..."
}
```

---

### POST /api/v1/risks/ai-score

Get AI-powered risk scoring and recommendations.

**Request Body:**
```json
{
  "risk_id": "uuid"
}
```

**Response (200):**
```json
{
  "ai_score": 78,
  "ai_analysis": "Based on the risk factors...",
  "recommendations": [
    "Implement additional controls...",
    "Consider cyber insurance..."
  ]
}
```

---

## Dashboard Endpoints

### GET /api/v1/dashboard/stats

Get dashboard statistics.

**Response (200):**
```json
{
  "stats": {
    "systems": 5,
    "controls": {
      "implemented": 245,
      "partially_implemented": 45,
      "planned": 30,
      "not_implemented": 15,
      "not_applicable": 20,
      "total": 355
    },
    "compliance_percentage": 82,
    "poams": {
      "open": 12,
      "in_progress": 8,
      "completed": 45,
      "total": 65
    },
    "evidence_count": 234,
    "risks": {
      "low": 5,
      "moderate": 12,
      "high": 3,
      "critical": 1
    }
  }
}
```

---

### GET /api/v1/dashboard/framework-stats

Get compliance statistics by framework.

**Response (200):**
```json
{
  "frameworks": [
    {
      "framework_id": "nist-800-53-rev5",
      "framework_name": "NIST SP 800-53 Rev 5",
      "total_controls": 355,
      "implemented": 245,
      "partially_implemented": 45,
      "compliance_percentage": 82
    }
  ]
}
```

---

### GET /api/v1/dashboard/my-work

Get the current user's assigned work items.

**Response (200):**
```json
{
  "data": {
    "poams": [...],
    "evidence_schedules": [...],
    "audit_tasks": [...]
  }
}
```

---

### GET /api/v1/compliance/scores

Get detailed compliance scores with letter grades.

**Response (200):**
```json
{
  "organization": {
    "overall_score": 82,
    "letter_grade": "B",
    "dimensions": [
      { "name": "Control Implementation", "score": 85, "weight": 0.4 },
      { "name": "Evidence Coverage", "score": 78, "weight": 0.3 },
      { "name": "Risk Management", "score": 80, "weight": 0.2 },
      { "name": "Policy Attestation", "score": 90, "weight": 0.1 }
    ]
  },
  "systems": [
    {
      "system_id": "uuid",
      "system_name": "Production Cloud",
      "score": 88,
      "letter_grade": "B+"
    }
  ]
}
```

---

## AI Endpoints

### POST /api/v1/ai/generate

Generate compliance content using AI.

**Request Body:**
```json
{
  "type": "policy",
  "context": {
    "title": "Access Control Policy",
    "framework": "nist-800-53-rev5",
    "system_name": "Production Cloud"
  }
}
```

**Response (200):**
```json
{
  "content": "# Access Control Policy\n\n## Purpose\n...",
  "tokens_used": 1500
}
```

---

### POST /api/v1/ai/narrative

Generate a control implementation narrative.

**Request Body:**
```json
{
  "control_id": "AC-1",
  "system_id": "uuid",
  "framework_id": "nist-800-53-rev5"
}
```

**Response (200):**
```json
{
  "narrative": "The organization has implemented AC-1 through..."
}
```

---

### POST /api/v1/ai/narrative/bulk

Bulk generate narratives for multiple controls.

**Request Body:**
```json
{
  "system_id": "uuid",
  "framework_id": "nist-800-53-rev5",
  "control_ids": ["AC-1", "AC-2", "AC-3"]
}
```

---

## Monitoring Endpoints

### GET /api/v1/monitoring/dashboard

Get continuous monitoring dashboard.

**Response (200):**
```json
{
  "dashboard": {
    "health_score": 94,
    "active_rules": 25,
    "recent_alerts": 3,
    "tests_24h": 48,
    "pass_rate": 96
  }
}
```

---

### GET /api/v1/monitoring/drift

Get compliance drift analysis.

**Response (200):**
```json
{
  "drift": {
    "period": "30d",
    "start_score": 85,
    "end_score": 82,
    "change": -3,
    "significant_changes": [
      {
        "control_id": "AC-2",
        "previous_status": "implemented",
        "current_status": "partially_implemented",
        "changed_at": "2024-01-15"
      }
    ]
  }
}
```

---

## Calendar Endpoints

### GET /api/v1/calendar/events

Get calendar events from multiple sources.

**Query Parameters:**
- `start` - Start date (ISO format)
- `end` - End date (ISO format)

**Response (200):**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Access Review Due",
      "type": "evidence_schedule",
      "date": "2024-02-01",
      "color": "#3b82f6",
      "metadata": {
        "schedule_id": "uuid"
      }
    },
    {
      "id": "uuid",
      "title": "POAM-2024-001 Due",
      "type": "poam_deadline",
      "date": "2024-03-15",
      "color": "#ef4444"
    }
  ]
}
```

Event types include: `evidence_schedule`, `poam_deadline`, `ato_expiration`, `policy_review`, `audit_task`, `risk_review`, `assessment_deadline`

---

## Import Endpoints

### POST /api/v1/import/systems

Bulk import systems from CSV/JSON.

### POST /api/v1/import/risks

Bulk import risks.

### POST /api/v1/import/vendors

Bulk import vendors.

### POST /api/v1/import/poams

Bulk import POAMs.

### POST /api/v1/import/implementations

Bulk import control implementations.

### POST /api/v1/import/oscal-ssp

Import OSCAL-formatted SSP.

### POST /api/v1/import/oscal-catalog

Import OSCAL control catalog.

---

## Audit Log Endpoint

### GET /api/v1/audit-log

Get the audit log with filtering.

**Query Parameters:**
- `action` - Filter by action type
- `entity_type` - Filter by entity type
- `user_id` - Filter by user
- `start_date` - Start of date range
- `end_date` - End of date range
- `page` - Page number
- `per_page` - Items per page (max 100)

**Response (200):**
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "update",
      "entity_type": "control_implementation",
      "entity_id": "uuid",
      "user_id": "uuid",
      "user_email": "john@example.com",
      "details": {
        "changes": {
          "status": { "from": "planned", "to": "implemented" }
        }
      },
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "per_page": 50
}
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

---

## Pagination

Endpoints returning lists support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 50, max: 100)

**Response includes:**
```json
{
  "items": [...],
  "total": 500,
  "page": 1,
  "per_page": 50,
  "total_pages": 10
}
```

---

## Webhooks

Configure webhooks to receive real-time notifications:

### POST /api/v1/webhooks

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["poam.created", "evidence.uploaded", "implementation.updated"],
  "secret": "your-webhook-secret"
}
```

Webhook payloads are signed using HMAC-SHA256. Verify the `X-Webhook-Signature` header.

---

## OSCAL Support

ForgeComply 360 supports OSCAL (Open Security Controls Assessment Language) format:

- Import SSP documents: `POST /api/v1/import/oscal-ssp`
- Import control catalogs: `POST /api/v1/import/oscal-catalog`
- Export SSP in OSCAL format: `GET /api/v1/ssp/:id?format=oscal`

---

*For additional support, contact: support@forgecyber.com*
