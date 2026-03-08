/**
 * ForgeComply 360 — OSCAL SSP Compliance Validator
 *
 * Validates OSCAL System Security Plan (SSP) JSON against NIST OSCAL 1.1.2
 * schema requirements with FedRAMP readiness checks. Designed for Cloudflare
 * Workers (no Node.js deps).
 *
 * NOTE: This is a *compliance-level* validator that complements the schema-based
 * validator in standalone-ssp-builder/src/utils/oscalValidator.ts. That validator
 * uses the official NIST JSON schema via Ajv. This one performs structural,
 * cross-reference, and FedRAMP-specific checks with actionable fix suggestions.
 *
 * Validation tiers:
 *   CRITICAL  — Document will be rejected by any OSCAL-aware tool
 *   ERROR     — 3PAO or automated assessment will flag these
 *   WARNING   — Best practice violations that weaken credibility
 *   INFO      — Suggestions for completeness
 *
 * Usage (Worker API):
 *   import { validateOscalSSPCompliance } from './oscal-validator';
 *   const result = validateOscalSSPCompliance(sspJsonObject);
 *   // result.valid: boolean
 *   // result.score: 0-100
 *   // result.issues: { severity, path, message, fix }[]
 *
 * Usage (standalone):
 *   node oscal-validator.js path/to/ssp.json
 */

// ============================================================================
// Constants
// ============================================================================

const OSCAL_VERSION = '1.1.2';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const CONTROL_ID_REGEX = /^[a-z]{2}-\d+(\.\d+)?(\(\d+\))?$/;
const VALID_IMPACT_LEVELS = ['fips-199-low', 'fips-199-moderate', 'fips-199-high', 'low', 'moderate', 'high'];
const VALID_SYSTEM_STATES = ['operational', 'under-development', 'under-major-modification', 'disposition', 'other'];
const VALID_COMPONENT_TYPES = ['this-system', 'system', 'interconnection', 'software', 'hardware', 'service', 'policy', 'process', 'procedure', 'plan', 'guidance', 'standard', 'validation'];
const VALID_COMPONENT_STATES = ['under-development', 'operational', 'disposition', 'other'];

const SEVERITY = { CRITICAL: 'critical', ERROR: 'error', WARNING: 'warning', INFO: 'info' };

// Score deduction caps per severity to maintain differentiation
const SCORE_DEDUCTIONS = {
  [SEVERITY.CRITICAL]: { per: 15, max: 60 },
  [SEVERITY.ERROR]:    { per: 5,  max: 30 },
  [SEVERITY.WARNING]:  { per: 2,  max: 20 },
  [SEVERITY.INFO]:     { per: 0,  max: 0 },
};

// FedRAMP baseline minimum control counts (slightly relaxed for partial implementations)
const BASELINE_MIN_CONTROLS = {
  low: 125,
  moderate: 300,
  high: 380,
};

// Maximum payload size for the validation endpoint (5MB)
const MAX_VALIDATION_PAYLOAD_SIZE = 5 * 1024 * 1024;

// ============================================================================
// Validation Engine
// ============================================================================

/**
 * Validate an OSCAL SSP JSON object for compliance readiness.
 * @param {object} ssp - The parsed OSCAL SSP JSON
 * @param {object} [options] - Validation options
 * @param {string} [options.baseline] - Expected baseline: 'low', 'moderate', 'high'
 * @param {boolean} [options.strict] - Enable strict FedRAMP checks (default: true)
 * @param {boolean} [options.checkControlIds] - Validate control-id format (default: true)
 * @returns {ValidationResult}
 */
function validateOscalSSPCompliance(ssp, options = {}) {
  const opts = {
    baseline: options.baseline || null,
    strict: options.strict !== false,
    checkControlIds: options.checkControlIds !== false,
  };

  const issues = [];
  const ctx = { issues, opts, uuids: new Set(), componentUuids: new Set() };

  // ---- Root structure ----
  validateRootStructure(ssp, ctx);

  // Only continue deeper validation if root structure exists
  const sspDoc = ssp?.['system-security-plan'];
  if (sspDoc) {
    validateUuid(sspDoc, 'system-security-plan', ctx);
    validateMetadata(sspDoc?.metadata, ctx);
    validateImportProfile(sspDoc?.['import-profile'], ctx);
    validateSystemCharacteristics(sspDoc?.['system-characteristics'], ctx);
    validateSystemImplementation(sspDoc?.['system-implementation'], ctx);
    validateControlImplementation(sspDoc?.['control-implementation'], ctx);
    validateBackMatter(sspDoc?.['back-matter'], ctx);
    validateInternalConsistency(sspDoc, ctx);
  }

  // Compute score with per-severity caps
  const score = computeScore(issues);
  const valid = !issues.some(i => i.severity === SEVERITY.CRITICAL || i.severity === SEVERITY.ERROR);

  return {
    valid,
    score,
    oscalVersion: OSCAL_VERSION,
    timestamp: new Date().toISOString(),
    summary: {
      critical: issues.filter(i => i.severity === SEVERITY.CRITICAL).length,
      errors: issues.filter(i => i.severity === SEVERITY.ERROR).length,
      warnings: issues.filter(i => i.severity === SEVERITY.WARNING).length,
      info: issues.filter(i => i.severity === SEVERITY.INFO).length,
      total: issues.length,
    },
    issues,
  };
}

// ============================================================================
// Validators
// ============================================================================

function validateRootStructure(ssp, ctx) {
  if (!ssp || typeof ssp !== 'object') {
    addIssue(ctx, SEVERITY.CRITICAL, '$', 'Input is not a valid JSON object', 'Provide a valid JSON object');
    return;
  }
  if (!ssp['system-security-plan']) {
    addIssue(ctx, SEVERITY.CRITICAL, '$', 'Missing root element "system-security-plan"',
      'OSCAL SSP must have a top-level "system-security-plan" property');
  }
}

function validateUuid(obj, path, ctx) {
  if (!obj?.uuid) {
    addIssue(ctx, SEVERITY.CRITICAL, `${path}.uuid`, 'Missing required UUID',
      'Add a uuid field with a valid UUID v4 value');
  } else if (!UUID_REGEX.test(obj.uuid)) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.uuid`, `Invalid UUID format: "${obj.uuid}"`,
      'Use a valid UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
  } else {
    if (ctx.uuids.has(obj.uuid)) {
      addIssue(ctx, SEVERITY.ERROR, `${path}.uuid`, `Duplicate UUID: "${obj.uuid}"`,
        'Each element must have a unique UUID');
    }
    ctx.uuids.add(obj.uuid);
  }
}

function validateMetadata(metadata, ctx) {
  const path = 'system-security-plan.metadata';

  if (!metadata) {
    addIssue(ctx, SEVERITY.CRITICAL, path, 'Missing required "metadata" section',
      'Add metadata with title, last-modified, version, and oscal-version');
    return;
  }

  // Required fields
  if (!metadata.title || typeof metadata.title !== 'string' || metadata.title.trim() === '') {
    addIssue(ctx, SEVERITY.CRITICAL, `${path}.title`, 'Missing or empty metadata.title',
      'Provide a descriptive title like "System Security Plan - [System Name]"');
  }

  if (!metadata['last-modified']) {
    addIssue(ctx, SEVERITY.CRITICAL, `${path}.last-modified`, 'Missing required metadata.last-modified',
      'Add an ISO 8601 datetime string');
  } else if (!ISO_DATETIME_REGEX.test(metadata['last-modified'])) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.last-modified`,
      `Invalid datetime format: "${metadata['last-modified']}"`,
      'Use ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ');
  }

  if (!metadata['oscal-version']) {
    addIssue(ctx, SEVERITY.CRITICAL, `${path}.oscal-version`, 'Missing required metadata.oscal-version',
      `Set to "${OSCAL_VERSION}"`);
  } else if (metadata['oscal-version'] !== OSCAL_VERSION) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.oscal-version`,
      `OSCAL version "${metadata['oscal-version']}" does not match expected "${OSCAL_VERSION}"`,
      `Update to "${OSCAL_VERSION}" for current NIST compatibility`);
  }

  if (!metadata.version) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.version`, 'Missing metadata.version',
      'Add a document version string (e.g., "1.0.0")');
  }

  // Roles
  if (!metadata.roles || !Array.isArray(metadata.roles) || metadata.roles.length === 0) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.roles`, 'No roles defined in metadata',
      'Add roles like system-owner, isso, and authorizing-official');
  } else {
    const roleIds = metadata.roles.map(r => r.id);
    const requiredRoles = ['system-owner'];
    for (const rr of requiredRoles) {
      if (!roleIds.includes(rr)) {
        addIssue(ctx, SEVERITY.WARNING, `${path}.roles`,
          `Missing recommended role: "${rr}"`,
          `Add { id: "${rr}", title: "..." } to roles array`);
      }
    }
  }

  // Parties
  if (!metadata.parties || !Array.isArray(metadata.parties) || metadata.parties.length === 0) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.parties`, 'No parties defined in metadata',
      'Add at least one party for the organization');
  } else {
    for (let i = 0; i < metadata.parties.length; i++) {
      const party = metadata.parties[i];
      if (!party.uuid || !UUID_REGEX.test(party.uuid)) {
        addIssue(ctx, SEVERITY.ERROR, `${path}.parties[${i}].uuid`, 'Party missing valid UUID');
      }
      if (!party.type || !['organization', 'person'].includes(party.type)) {
        addIssue(ctx, SEVERITY.ERROR, `${path}.parties[${i}].type`,
          `Invalid party type: "${party.type}"`, 'Use "organization" or "person"');
      }
      if (!party.name && party.type === 'organization') {
        addIssue(ctx, SEVERITY.WARNING, `${path}.parties[${i}].name`, 'Organization party missing name');
      }
    }
  }

  // Responsible parties (FedRAMP expects these)
  if (ctx.opts.strict) {
    if (!metadata['responsible-parties'] || metadata['responsible-parties'].length === 0) {
      addIssue(ctx, SEVERITY.INFO, `${path}.responsible-parties`,
        'No responsible-parties defined', 'Link roles to parties for FedRAMP completeness');
    }
  }
}

function validateImportProfile(importProfile, ctx) {
  const path = 'system-security-plan.import-profile';

  if (!importProfile) {
    addIssue(ctx, SEVERITY.CRITICAL, path, 'Missing required "import-profile" section',
      'Add import-profile with href pointing to NIST baseline profile');
    return;
  }

  if (!importProfile.href) {
    addIssue(ctx, SEVERITY.CRITICAL, `${path}.href`, 'Missing required import-profile.href',
      'Set href to the NIST baseline profile URL (e.g., NIST_SP-800-53_rev5_MODERATE-baseline_profile.json)');
  } else if (typeof importProfile.href === 'string' && importProfile.href.trim() === '') {
    addIssue(ctx, SEVERITY.CRITICAL, `${path}.href`, 'import-profile.href is empty',
      'Provide a valid URL or internal reference to the baseline profile');
  }
}

function validateSystemCharacteristics(syschars, ctx) {
  const path = 'system-security-plan.system-characteristics';

  if (!syschars) {
    addIssue(ctx, SEVERITY.CRITICAL, path, 'Missing required "system-characteristics" section',
      'Add system-characteristics with system-name, description, security-impact-level, status, and authorization-boundary');
    return;
  }

  // System IDs
  if (!syschars['system-ids'] || syschars['system-ids'].length === 0) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.system-ids`, 'Missing system-ids',
      'Add at least one system identifier');
  }

  // System name
  if (!syschars['system-name'] || syschars['system-name'].trim() === '') {
    addIssue(ctx, SEVERITY.CRITICAL, `${path}.system-name`, 'Missing or empty system-name',
      'Provide the official system name');
  }

  // Description
  if (!syschars.description || syschars.description.trim() === '') {
    addIssue(ctx, SEVERITY.ERROR, `${path}.description`, 'Missing system description',
      'Provide a comprehensive system description');
  } else if (syschars.description.length < 50) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.description`,
      `System description is very short (${syschars.description.length} chars)`,
      '3PAO reviewers expect a thorough description (200+ characters recommended)');
  }

  // Security sensitivity level
  if (!syschars['security-sensitivity-level']) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.security-sensitivity-level`,
      'Missing security-sensitivity-level', 'Set to "fips-199-low", "fips-199-moderate", or "fips-199-high"');
  } else if (!VALID_IMPACT_LEVELS.includes(syschars['security-sensitivity-level'])) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.security-sensitivity-level`,
      `Unexpected value: "${syschars['security-sensitivity-level']}"`,
      'Standard values: fips-199-low, fips-199-moderate, fips-199-high');
  }

  // Security impact level
  const sil = syschars['security-impact-level'];
  if (!sil) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.security-impact-level`,
      'Missing security-impact-level', 'Add confidentiality, integrity, and availability objectives');
  } else {
    for (const obj of ['security-objective-confidentiality', 'security-objective-integrity', 'security-objective-availability']) {
      if (!sil[obj]) {
        addIssue(ctx, SEVERITY.ERROR, `${path}.security-impact-level.${obj}`,
          `Missing ${obj}`, 'Set to "fips-199-low", "fips-199-moderate", or "fips-199-high"');
      }
    }
  }

  // System information
  if (!syschars['system-information']) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.system-information`,
      'Missing system-information section', 'Add information-types for FedRAMP compliance');
  } else {
    const infotypes = syschars['system-information']['information-types'];
    if (!infotypes || infotypes.length === 0) {
      addIssue(ctx, SEVERITY.WARNING, `${path}.system-information.information-types`,
        'No information-types defined', 'List information types processed by the system (NIST SP 800-60)');
    }
  }

  // Status
  if (!syschars.status) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.status`, 'Missing system status', 'Add status with state property');
  } else if (!syschars.status.state) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.status.state`, 'Missing status.state',
      `Set to one of: ${VALID_SYSTEM_STATES.join(', ')}`);
  } else if (!VALID_SYSTEM_STATES.includes(syschars.status.state)) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.status.state`,
      `Invalid status state: "${syschars.status.state}"`,
      `Must be one of: ${VALID_SYSTEM_STATES.join(', ')}`);
  }

  // Authorization boundary
  if (!syschars['authorization-boundary']) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.authorization-boundary`,
      'Missing authorization-boundary', 'Define the system authorization boundary');
  } else if (!syschars['authorization-boundary'].description ||
             syschars['authorization-boundary'].description.trim() === '') {
    addIssue(ctx, SEVERITY.WARNING, `${path}.authorization-boundary.description`,
      'Authorization boundary has no description',
      'Provide a narrative describing the system boundary');
  }
}

function validateSystemImplementation(sysimpl, ctx) {
  const path = 'system-security-plan.system-implementation';

  if (!sysimpl) {
    addIssue(ctx, SEVERITY.CRITICAL, path, 'Missing required "system-implementation" section',
      'Add system-implementation with users and components');
    return;
  }

  // Users
  if (!sysimpl.users || !Array.isArray(sysimpl.users) || sysimpl.users.length === 0) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.users`, 'No users defined in system-implementation',
      'Add at least one user entry');
  } else {
    for (let i = 0; i < sysimpl.users.length; i++) {
      const user = sysimpl.users[i];
      if (!user.uuid || !UUID_REGEX.test(user.uuid)) {
        addIssue(ctx, SEVERITY.ERROR, `${path}.users[${i}].uuid`, 'User missing valid UUID');
      }
    }
  }

  // Components
  if (!sysimpl.components || !Array.isArray(sysimpl.components) || sysimpl.components.length === 0) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.components`, 'No components defined',
      'Add at least one component (type: "this-system" is required)');
  } else {
    let hasThisSystem = false;
    for (let i = 0; i < sysimpl.components.length; i++) {
      const comp = sysimpl.components[i];
      if (!comp.uuid || !UUID_REGEX.test(comp.uuid)) {
        addIssue(ctx, SEVERITY.ERROR, `${path}.components[${i}].uuid`, 'Component missing valid UUID');
      } else {
        ctx.componentUuids.add(comp.uuid);
      }

      if (!comp.type) {
        addIssue(ctx, SEVERITY.ERROR, `${path}.components[${i}].type`, 'Component missing type');
      } else {
        if (comp.type === 'this-system') hasThisSystem = true;
        if (!VALID_COMPONENT_TYPES.includes(comp.type)) {
          addIssue(ctx, SEVERITY.WARNING, `${path}.components[${i}].type`,
            `Non-standard component type: "${comp.type}"`);
        }
      }

      if (!comp.title) {
        addIssue(ctx, SEVERITY.WARNING, `${path}.components[${i}].title`, 'Component missing title');
      }

      if (comp.status && comp.status.state && !VALID_COMPONENT_STATES.includes(comp.status.state)) {
        addIssue(ctx, SEVERITY.WARNING, `${path}.components[${i}].status.state`,
          `Non-standard component state: "${comp.status.state}"`);
      }
    }

    if (!hasThisSystem) {
      addIssue(ctx, SEVERITY.ERROR, `${path}.components`,
        'No component with type "this-system" found',
        'OSCAL requires at least one component representing the system itself');
    }
  }
}

function validateControlImplementation(ctrlImpl, ctx) {
  const path = 'system-security-plan.control-implementation';

  if (!ctrlImpl) {
    addIssue(ctx, SEVERITY.CRITICAL, path, 'Missing required "control-implementation" section',
      'Add control-implementation with description and implemented-requirements');
    return;
  }

  if (!ctrlImpl.description || ctrlImpl.description.trim() === '') {
    addIssue(ctx, SEVERITY.WARNING, `${path}.description`,
      'Missing control-implementation description',
      'Add a brief description of the control implementation approach');
  }

  const reqs = ctrlImpl['implemented-requirements'];
  if (!reqs || !Array.isArray(reqs) || reqs.length === 0) {
    addIssue(ctx, SEVERITY.CRITICAL, `${path}.implemented-requirements`,
      'No implemented-requirements found',
      'Add control implementation entries for each applicable control');
    return;
  }

  // Track control IDs for duplicate detection
  const controlIds = new Set();
  let missingUuidCount = 0;
  let invalidControlIdCount = 0;
  let emptyStatementCount = 0;

  for (let i = 0; i < reqs.length; i++) {
    const req = reqs[i];

    // UUID
    if (!req.uuid || !UUID_REGEX.test(req.uuid)) {
      missingUuidCount++;
    }

    // Control ID
    if (!req['control-id']) {
      addIssue(ctx, SEVERITY.ERROR, `${path}.implemented-requirements[${i}].control-id`,
        'Missing control-id');
    } else {
      const cid = req['control-id'];
      if (controlIds.has(cid)) {
        addIssue(ctx, SEVERITY.WARNING, `${path}.implemented-requirements[${i}].control-id`,
          `Duplicate control-id: "${cid}"`, 'Each control should appear only once');
      }
      controlIds.add(cid);

      if (ctx.opts.checkControlIds && !CONTROL_ID_REGEX.test(cid)) {
        invalidControlIdCount++;
      }
    }

    // Statements
    if (req.statements && Array.isArray(req.statements)) {
      for (let j = 0; j < req.statements.length; j++) {
        const stmt = req.statements[j];
        if ((!stmt.description || stmt.description.trim() === '') &&
            (!stmt.remarks || (typeof stmt.remarks === 'string' && stmt.remarks.trim() === ''))) {
          emptyStatementCount++;
        }

        // Check by-components references
        if (stmt['by-components'] && Array.isArray(stmt['by-components'])) {
          for (const bc of stmt['by-components']) {
            if (bc['component-uuid'] && ctx.componentUuids.size > 0 &&
                !ctx.componentUuids.has(bc['component-uuid'])) {
              addIssue(ctx, SEVERITY.ERROR,
                `${path}.implemented-requirements[${i}].statements[${j}].by-components`,
                `References non-existent component UUID: "${bc['component-uuid']}"`,
                'Ensure by-component references match UUIDs in system-implementation.components');
            }
          }
        }
      }
    }

    // Check top-level by-components references (when statements are not used)
    if (req['by-components'] && Array.isArray(req['by-components'])) {
      for (const bc of req['by-components']) {
        if (bc['component-uuid'] && ctx.componentUuids.size > 0 &&
            !ctx.componentUuids.has(bc['component-uuid'])) {
          addIssue(ctx, SEVERITY.ERROR,
            `${path}.implemented-requirements[${i}].by-components`,
            `References non-existent component UUID: "${bc['component-uuid']}"`,
            'Ensure by-component references match UUIDs in system-implementation.components');
        }
      }
    }
  }

  // Batch report common issues
  if (missingUuidCount > 0) {
    addIssue(ctx, SEVERITY.ERROR, `${path}.implemented-requirements`,
      `${missingUuidCount} implemented-requirement(s) missing valid UUID`,
      'Each implemented-requirement must have a unique UUID v4');
  }

  if (invalidControlIdCount > 0) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.implemented-requirements`,
      `${invalidControlIdCount} control-id(s) don't match NIST format (e.g., "ac-2", "si-4(2)")`,
      'Use lowercase NIST 800-53 control identifiers');
  }

  if (emptyStatementCount > 0) {
    addIssue(ctx, SEVERITY.WARNING, `${path}.implemented-requirements`,
      `${emptyStatementCount} statement(s) have empty descriptions`,
      '3PAO reviewers will flag controls without implementation narratives');
  }

  // Baseline control count check
  const baseline = ctx.opts.baseline?.toLowerCase();
  const minControls = BASELINE_MIN_CONTROLS[baseline];
  if (minControls && reqs.length < minControls) {
    const fullCounts = { low: 156, moderate: 325, high: 421 };
    addIssue(ctx, SEVERITY.WARNING, `${path}.implemented-requirements`,
      `Only ${reqs.length} controls implemented (FedRAMP ${baseline} requires ~${fullCounts[baseline]})`,
      'Ensure all baseline controls have implementation entries');
  }
}

function validateBackMatter(backMatter, ctx) {
  const path = 'system-security-plan.back-matter';

  if (!backMatter) {
    addIssue(ctx, SEVERITY.INFO, path, 'No back-matter section',
      'Add back-matter with resources for diagrams, policies, and references');
    return;
  }

  if (backMatter.resources && Array.isArray(backMatter.resources)) {
    for (let i = 0; i < backMatter.resources.length; i++) {
      const res = backMatter.resources[i];
      if (!res.uuid || !UUID_REGEX.test(res.uuid)) {
        addIssue(ctx, SEVERITY.WARNING, `${path}.resources[${i}].uuid`,
          'Resource missing valid UUID');
      }
    }
  }
}

function validateInternalConsistency(sspDoc, ctx) {
  const path = 'system-security-plan';

  // Check role-id references in responsible-parties
  if (sspDoc.metadata?.['responsible-parties'] && sspDoc.metadata?.roles) {
    const roleIds = new Set(sspDoc.metadata.roles.map(r => r.id));
    for (const rp of sspDoc.metadata['responsible-parties']) {
      if (rp['role-id'] && !roleIds.has(rp['role-id'])) {
        addIssue(ctx, SEVERITY.ERROR, `${path}.metadata.responsible-parties`,
          `responsible-party references undefined role-id: "${rp['role-id']}"`,
          'Ensure role-id matches a defined role in metadata.roles');
      }
    }
  }

  // Check party-uuid references in responsible-parties
  if (sspDoc.metadata?.['responsible-parties'] && sspDoc.metadata?.parties) {
    const partyUuids = new Set(sspDoc.metadata.parties.map(p => p.uuid));
    for (const rp of sspDoc.metadata['responsible-parties']) {
      if (rp['party-uuids'] && Array.isArray(rp['party-uuids'])) {
        for (const pu of rp['party-uuids']) {
          if (!partyUuids.has(pu)) {
            addIssue(ctx, SEVERITY.ERROR, `${path}.metadata.responsible-parties`,
              `responsible-party references undefined party UUID: "${pu}"`,
              'Ensure party-uuids match defined parties in metadata.parties');
          }
        }
      }
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

function addIssue(ctx, severity, path, message, fix) {
  ctx.issues.push({ severity, path, message, fix: fix || null });
}

function computeScore(issues) {
  // Start at 100, deduct based on severity with per-category caps
  let score = 100;
  const deductions = {};

  for (const issue of issues) {
    const config = SCORE_DEDUCTIONS[issue.severity];
    if (!config) continue;

    const key = issue.severity;
    deductions[key] = (deductions[key] || 0) + config.per;
  }

  // Apply capped deductions
  for (const [severity, total] of Object.entries(deductions)) {
    const cap = SCORE_DEDUCTIONS[severity].max;
    score -= Math.min(total, cap);
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Worker API Integration Helper
// ============================================================================

/**
 * Returns a JSON Response with SSP + validation for the Worker API.
 * Validation is returned in a separate envelope, NOT inside the OSCAL document.
 */
function oscalValidatedResponse(oscalSSP, options = {}, corsHeaders = {}) {
  const validation = validateOscalSSPCompliance(oscalSSP, options);

  const body = JSON.stringify({
    oscal: oscalSSP,
    validation,
  }, null, 2);

  const headers = {
    'Content-Type': 'application/json',
    'X-OSCAL-Validation-Score': String(validation.score),
    'X-OSCAL-Valid': String(validation.valid),
    ...corsHeaders,
  };

  return new Response(body, { status: 200, headers });
}

/**
 * Standalone validation endpoint handler.
 * POST /api/v1/oscal/validate with JSON body.
 */
async function handleValidateEndpoint(request, corsHeaders = {}) {
  try {
    // Check payload size
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_VALIDATION_PAYLOAD_SIZE) {
      return new Response(JSON.stringify({
        valid: false,
        score: 0,
        error: `Payload too large (${contentLength} bytes). Maximum: ${MAX_VALIDATION_PAYLOAD_SIZE} bytes.`,
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await request.json();
    const options = {
      baseline: body._options?.baseline || null,
      strict: body._options?.strict !== false,
    };

    // Build clean SSP object without internal options
    const { _options, ...ssp } = body;

    const result = validateOscalSSPCompliance(ssp, options);
    return new Response(JSON.stringify(result, null, 2), {
      status: result.valid ? 200 : 422,
      headers: {
        'Content-Type': 'application/json',
        'X-OSCAL-Validation-Score': String(result.score),
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      valid: false,
      score: 0,
      error: `Failed to parse request body: ${err.message}`,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// ============================================================================
// CLI Mode (for standalone testing)
// ============================================================================

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('oscal-validator')) {
  (async () => {
    const fs = await import('node:fs');
    const filePath = process.argv[2];

    if (!filePath) {
      console.log('Usage: node oscal-validator.js <ssp.json> [--baseline moderate]');
      console.log('');
      console.log('Options:');
      console.log('  --baseline <low|moderate|high>  Check control count against baseline');
      console.log('  --strict                        Enable strict FedRAMP checks (default)');
      console.log('  --no-strict                     Disable strict FedRAMP checks');
      process.exit(1);
    }

    const args = process.argv.slice(3);
    const options = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--baseline' && args[i + 1]) { options.baseline = args[i + 1]; i++; }
      if (args[i] === '--no-strict') options.strict = false;
    }

    try {
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const result = validateOscalSSPCompliance(json, options);

      // Pretty print
      const colors = { critical: '\x1b[31m', error: '\x1b[91m', warning: '\x1b[33m', info: '\x1b[36m' };
      const reset = '\x1b[0m';
      const bold = '\x1b[1m';

      console.log(`${bold}ForgeComply 360 — OSCAL SSP Compliance Validator${reset}`);
      console.log(`File: ${filePath}`);
      console.log(`OSCAL Version: ${OSCAL_VERSION}`);
      console.log('');
      console.log(`Score: ${result.score}/100  |  Valid: ${result.valid ? 'YES' : 'NO'}`);
      console.log(`Critical: ${result.summary.critical}  |  Errors: ${result.summary.errors}  |  Warnings: ${result.summary.warnings}  |  Info: ${result.summary.info}`);
      console.log('');

      if (result.issues.length > 0) {
        console.log(`${bold}Issues:${reset}`);
        for (const issue of result.issues) {
          const color = colors[issue.severity] || '';
          const label = issue.severity.toUpperCase().padEnd(8);
          console.log(`  ${color}${label}${reset} ${issue.path}`);
          console.log(`           ${issue.message}`);
          if (issue.fix) console.log(`           Fix: ${issue.fix}`);
        }
      } else {
        console.log('No issues found. SSP passes all compliance checks.');
      }

      process.exit(result.valid ? 0 : 1);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  })();
}

// ============================================================================
// Exports (ESM only — compatible with Workers and Node.js --input-type=module)
// ============================================================================

export { validateOscalSSPCompliance, oscalValidatedResponse, handleValidateEndpoint };
