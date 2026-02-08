// ============================================================================
// FORGECOMPLY 360 - CLOUDFLARE WORKERS API v5.0
// Forge Cyber Defense - Service-Disabled Veteran-Owned Small Business (SDVOSB)
// Single Engine, Multiple Experiences Architecture
// ============================================================================

import { Toucan } from 'toucan-js';
import { XMLParser } from 'fast-xml-parser';

// Initialize Sentry for error monitoring in production
function initSentry(request, env, ctx) {
  if (!env.SENTRY_DSN) return null;
  return new Toucan({
    dsn: env.SENTRY_DSN,
    context: ctx,
    request,
    environment: env.ENVIRONMENT || 'production',
    release: 'forgecomply360-api@5.0.0',
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get('Origin') || '';
    const sentry = initSentry(request, env, ctx);

    // Allow CORS for production domain and all preview deployments (*.forgecomply360.pages.dev)
    const allowedOriginPattern = /^https:\/\/([a-z0-9-]+\.)?forgecomply360\.pages\.dev$/;
    // SECURITY: No wildcard fallback - use production domain if origin doesn't match pattern
    const corsOrigin = allowedOriginPattern.test(requestOrigin)
      ? requestOrigin
      : (env.CORS_ORIGIN || 'https://forgecomply360.pages.dev');

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(corsOrigin),
      });
    }

    try {
      const response = await handleRequest(request, env, url, ctx);
      // Add CORS + security headers
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(corsOrigin)).forEach(([k, v]) => headers.set(k, v));
      // Security headers
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      // CSP - allows self, inline styles/scripts for React, images from any https, API connections
      headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.forgecomply360.pages.dev; font-src 'self' data:; frame-ancestors 'none';");
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      return new Response(response.body, { status: response.status, headers });
    } catch (err) {
      // Send to Sentry if available
      if (sentry) {
        sentry.setTag('endpoint', url.pathname);
        sentry.setTag('method', request.method);
        sentry.captureException(err);
      }
      console.error(`Unhandled error [${request.method} ${url.pathname}]:`, err.message, err.stack);
      return jsonResponse({ error: 'Internal server error' }, 500, corsOrigin);
    }
  },

  async scheduled(event, env, ctx) {
    // Initialize Sentry for scheduled tasks
    const sentry = env.SENTRY_DSN ? new Toucan({
      dsn: env.SENTRY_DSN,
      context: ctx,
      environment: env.ENVIRONMENT || 'production',
      release: 'forgecomply360-api@5.0.0',
    }) : null;

    try {
      if (event.cron === '0 8 * * 1') {
        // Weekly digest - Mondays at 8 AM UTC
        ctx.waitUntil(handleWeeklyDigest(env));
      } else if (event.cron === '0 2 * * *') {
        // Daily backup - 2 AM UTC
        ctx.waitUntil(handleScheduledBackup(env));
      } else {
        // Daily evidence checks and alerts - 6 AM UTC
        ctx.waitUntil(
          handleScheduledEvidenceChecks(env)
            .then(() => handleScheduledComplianceAlerts(env))
            .then(() => handleSecurityIncidentDetection(env))
            .then(() => handleAuditLogRetention(env))
            .then(() => handleEmailDigest(env))
        );
      }
    } catch (err) {
      if (sentry) {
        sentry.setTag('cron', event.cron);
        sentry.captureException(err);
      }
      console.error(`Scheduled task error [${event.cron}]:`, err.message, err.stack);
    }
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status = 200, corsOrigin = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(corsOrigin),
    },
  });
}

// ============================================================================
// RATE LIMITING
// ============================================================================

async function checkRateLimit(env, key, maxRequests, windowSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    // Clean old entries and get current count
    await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(windowStart).run();

    const row = await env.DB.prepare('SELECT count FROM rate_limits WHERE key = ? AND window_start >= ?')
      .bind(key, windowStart).first();

    if (row && row.count >= maxRequests) {
      return { limited: true, retryAfter: windowSeconds };
    }

    // Upsert count
    await env.DB.prepare(
      'INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1'
    ).bind(key, now).run();

    return { limited: false };
  } catch {
    // If rate limit table doesn't exist, create it and allow the request
    try {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER DEFAULT 1, window_start INTEGER NOT NULL)`).run();
    } catch {}
    return { limited: false };
  }
}

function rateLimitResponse(retryAfter, corsOrigin = '*') {
  return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
    status: 429,
    headers: { ...corsHeaders(corsOrigin), 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
  });
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

function validateBody(body, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field];
    if (rule.required && (value === undefined || value === null || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${field} is required`;
      continue;
    }
    if (value !== undefined && value !== null) {
      if (rule.type === 'string' && typeof value !== 'string') errors[field] = `${field} must be a string`;
      if (rule.type === 'number' && typeof value !== 'number') errors[field] = `${field} must be a number`;
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) errors[field] = `${field} must be ${rule.maxLength} characters or less`;
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) errors[field] = `${field} must be at least ${rule.minLength} characters`;
      if (rule.enum && !rule.enum.includes(value)) errors[field] = `${field} must be one of: ${rule.enum.join(', ')}`;
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) errors[field] = `${field} must be at least ${rule.min}`;
      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) errors[field] = `${field} must be at most ${rule.max}`;
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

function validationErrorResponse(errors, corsOrigin = '*') {
  return new Response(JSON.stringify({ error: 'Validation failed', fields: errors }), {
    status: 400,
    headers: { ...corsHeaders(corsOrigin), 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// ROUTER
// ============================================================================

async function handleRequest(request, env, url, ctx) {
  const path = url.pathname;
  const method = request.method;

  // Health check
  if (path === '/health') {
    return jsonResponse({ status: 'ok', version: '5.0.0', timestamp: new Date().toISOString() });
  }

  // Rate limit auth endpoints (10 requests per minute per IP)
  if (path.startsWith('/api/v1/auth/')) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(env, `auth:${ip}`, 10, 60);
    if (rl.limited) return rateLimitResponse(rl.retryAfter);
  }

  // Public auth routes
  if (path === '/api/v1/auth/register' && method === 'POST') return handleRegister(request, env);
  if (path === '/api/v1/auth/login' && method === 'POST') return handleLogin(request, env);
  if (path === '/api/v1/auth/refresh' && method === 'POST') return handleRefreshToken(request, env);
  if (path === '/api/v1/auth/mfa/verify' && method === 'POST') return handleMFAVerify(request, env);
  if (path === '/api/v1/auth/emergency-access' && method === 'POST') return handleEmergencyAccess(request, env);

  // Public routes (no auth required)
  if (path.match(/^\/api\/v1\/public\/badge\/verify\/[\w-]+$/) && method === 'GET') return handleVerifyBadge(request, env, path.split('/').pop());
  if (path.match(/^\/api\/v1\/public\/questionnaire\/[\w-]+$/) && method === 'GET') return handlePublicQuestionnaire(env, path.split('/').pop());
  if (path.match(/^\/api\/v1\/public\/questionnaire\/[\w-]+\/submit$/) && method === 'POST') return handleSubmitQuestionnaireResponse(request, env, path.split('/')[5]);
  if (path.match(/^\/api\/v1\/public\/portal\/[\w-]+$/) && method === 'GET') return handlePublicPortalAccess(request, env, path.split('/').pop());
  if (path.match(/^\/api\/v1\/public\/portal\/[\w-]+\/evidence\/[\w-]+$/) && method === 'GET') return handlePortalEvidenceDownload(request, env, path.split('/')[5], path.split('/')[7]);
  if (path.match(/^\/api\/v1\/public\/portal\/[\w-]+\/comments$/) && method === 'POST') return handlePortalComment(request, env, path.split('/')[5]);

  // All routes below require auth
  const auth = await authenticateRequest(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, org } = auth;

  // Rate limit API endpoints per user (120 requests per minute)
  const userRl = await checkRateLimit(env, `api:${user.id}`, 120, 60);
  if (userRl.limited) return rateLimitResponse(userRl.retryAfter);

  // Rate limit API endpoints per organization (600 requests per minute across all users)
  // This prevents one organization from consuming all system resources
  const orgRl = await checkRateLimit(env, `org:${org.id}`, 600, 60);
  if (orgRl.limited) return rateLimitResponse(orgRl.retryAfter);

  // Auth
  if (path === '/api/v1/auth/me' && method === 'GET') {
    const meta = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {});
    return jsonResponse({ user, org, session_timeout_minutes: meta.session_timeout_minutes || 30 });
  }
  if (path === '/api/v1/auth/logout' && method === 'POST') return handleLogout(request, env, user);
  if (path === '/api/v1/auth/change-password' && method === 'POST') return handleChangePassword(request, env, user);
  if (path === '/api/v1/auth/mfa/setup' && method === 'POST') return handleMFASetup(request, env, user);
  if (path === '/api/v1/auth/mfa/verify-setup' && method === 'POST') return handleMFAVerifySetup(request, env, user);
  if (path === '/api/v1/auth/mfa/disable' && method === 'POST') return handleMFADisable(request, env, user);
  if (path === '/api/v1/auth/mfa/backup-codes' && method === 'POST') return handleMFARegenerateBackupCodes(request, env, user);

  // Experience Layer
  if (path === '/api/v1/experience' && method === 'GET') return handleGetExperience(env, org);
  if (path === '/api/v1/experience' && method === 'PUT') return handleUpdateExperience(request, env, org, user);

  // Organization
  if (path === '/api/v1/organization' && method === 'GET') return jsonResponse({ org });
  if (path === '/api/v1/organization' && method === 'PUT') return handleUpdateOrg(request, env, org, user);

  // Frameworks
  if (path === '/api/v1/frameworks' && method === 'GET') return handleListFrameworks(env, url);
  if (path === '/api/v1/frameworks/enabled' && method === 'GET') return handleListEnabledFrameworks(env, org);
  if (path === '/api/v1/frameworks/enable' && method === 'POST') return handleEnableFramework(request, env, org, user);
  if (path === '/api/v1/frameworks/disable' && method === 'POST') return handleDisableFramework(request, env, org, user);

  // Crosswalks
  if (path === '/api/v1/crosswalks' && method === 'GET') return handleGetCrosswalks(env, url);

  // Controls
  if (path === '/api/v1/controls' && method === 'GET') return handleListControls(env, url, org);

  // Systems
  if (path === '/api/v1/systems' && method === 'GET') return handleListSystems(env, org);
  if (path === '/api/v1/systems' && method === 'POST') return handleCreateSystem(request, env, org, user);
  if (path.match(/^\/api\/v1\/systems\/[\w-]+$/) && method === 'GET') return handleGetSystem(env, org, path.split('/').pop());
  if (path.match(/^\/api\/v1\/systems\/[\w-]+$/) && method === 'PUT') return handleUpdateSystem(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/systems\/[\w-]+$/) && method === 'DELETE') return handleDeleteSystem(env, org, user, path.split('/').pop());

  // Control Implementations
  if (path === '/api/v1/implementations' && method === 'GET') return handleListImplementations(env, url, org);
  if (path === '/api/v1/implementations' && method === 'POST') return handleUpsertImplementation(request, env, org, user);
  if (path === '/api/v1/implementations/bulk' && method === 'POST') return handleBulkInitImplementations(request, env, org, user);
  if (path === '/api/v1/implementations/bulk-update' && method === 'POST') return handleBulkUpdateImplementations(request, env, org, user);
  if (path === '/api/v1/implementations/inherit' && method === 'POST') return handleInheritImplementations(request, env, org, user);
  if (path === '/api/v1/implementations/sync-inherited' && method === 'POST') return handleSyncInherited(request, env, org, user);
  if (path === '/api/v1/implementations/apply-baseline' && method === 'POST') return handleApplyBaseline(request, env, org, user);
  if (path === '/api/v1/implementations/stats' && method === 'GET') return handleImplementationStats(env, url, org);
  if (path === '/api/v1/implementations/inheritance-map' && method === 'GET') return handleInheritanceMap(env, org, url);
  if (path.match(/^\/api\/v1\/implementations\/[\w-]+\/evidence$/) && method === 'GET') return handleGetImplementationEvidence(env, org, path.split('/')[4]);

  // Control Comments
  if (path.match(/^\/api\/v1\/controls\/[\w-]+\/comments$/) && method === 'GET') return handleListControlComments(env, org, url, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/controls\/[\w-]+\/comments$/) && method === 'POST') return handleCreateControlComment(request, env, org, user, path.split('/')[4]);

  // POA&Ms
  if (path === '/api/v1/poams' && method === 'GET') return handleListPoams(env, url, org);
  if (path === '/api/v1/poams' && method === 'POST') return handleCreatePoam(request, env, org, user);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+$/) && method === 'PUT') return handleUpdatePoam(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/poams\/[\w-]+$/) && method === 'DELETE') return handleDeletePoam(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/milestones$/) && method === 'GET') return handleListMilestones(env, org, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/milestones$/) && method === 'POST') return handleCreateMilestone(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/milestones\/[\w-]+$/) && method === 'PUT') return handleUpdateMilestone(request, env, org, user, path.split('/')[4], path.split('/')[6]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/comments$/) && method === 'GET') return handleListComments(env, org, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/comments$/) && method === 'POST') return handleCreateComment(request, env, org, user, path.split('/')[4]);
  // POA&M Junction Tables (FedRAMP compliance)
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/affected-assets$/) && method === 'GET') return handleListPoamAssets(env, org, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/affected-assets$/) && method === 'POST') return handleLinkPoamAsset(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/affected-assets\/[\w-]+$/) && method === 'DELETE') return handleUnlinkPoamAsset(env, org, user, path.split('/')[4], path.split('/')[6]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/control-mappings$/) && method === 'GET') return handleListPoamControls(env, org, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/control-mappings$/) && method === 'POST') return handleLinkPoamControl(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/control-mappings\/[\w-]+$/) && method === 'DELETE') return handleUnlinkPoamControl(env, org, user, path.split('/')[4], path.split('/')[6]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/evidence$/) && method === 'GET') return handleListPoamEvidence(env, org, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/evidence$/) && method === 'POST') return handleLinkPoamEvidence(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/evidence\/[\w-]+$/) && method === 'DELETE') return handleUnlinkPoamEvidence(env, org, user, path.split('/')[4], path.split('/')[6]);
  // POA&M Deviation History (CMMC/FedRAMP AO audit trail)
  if (path.match(/^\/api\/v1\/poams\/[\w-]+\/deviation-history$/) && method === 'GET') return handleListDeviationHistory(env, org, path.split('/')[4]);
  if (path === '/api/v1/org-members' && method === 'GET') return handleListOrgMembers(env, org);

  // Evidence
  if (path === '/api/v1/evidence' && method === 'GET') return handleListEvidence(env, org, url);
  if (path === '/api/v1/evidence' && method === 'POST') return handleUploadEvidence(request, env, org, user);
  if (path.match(/^\/api\/v1\/evidence\/[\w-]+\/download$/) && method === 'GET') {
    const id = path.split('/')[4];
    return handleDownloadEvidence(env, org, id);
  }
  if (path === '/api/v1/evidence/link' && method === 'POST') return handleLinkEvidence(request, env, org, user);

  // Evidence Schedules
  if (path === '/api/v1/evidence/schedules/stats' && method === 'GET') return handleEvidenceScheduleStats(env, org);
  if (path === '/api/v1/evidence/schedules' && method === 'GET') return handleListEvidenceSchedules(env, org, url);
  if (path === '/api/v1/evidence/schedules' && method === 'POST') return handleCreateEvidenceSchedule(request, env, org, user);
  if (path.match(/^\/api\/v1\/evidence\/schedules\/[\w-]+\/complete$/) && method === 'POST') return handleCompleteEvidenceSchedule(request, env, org, user, path.split('/')[5]);
  if (path.match(/^\/api\/v1\/evidence\/schedules\/[\w-]+$/) && method === 'GET') return handleGetEvidenceSchedule(env, org, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/evidence\/schedules\/[\w-]+$/) && method === 'PUT') return handleUpdateEvidenceSchedule(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/evidence\/schedules\/[\w-]+$/) && method === 'DELETE') return handleDeleteEvidenceSchedule(env, org, user, path.split('/')[4]);

  // Audit Preparation
  if (path === '/api/v1/audit-prep/readiness' && method === 'GET') return handleAuditReadiness(env, org);
  if (path === '/api/v1/audit-prep/items' && method === 'GET') return handleListAuditItems(env, org);
  if (path === '/api/v1/audit-prep/items' && method === 'POST') return handleCreateAuditItem(request, env, org, user);
  if (path.match(/^\/api\/v1\/audit-prep\/items\/[\w-]+$/) && method === 'PUT') return handleUpdateAuditItem(request, env, org, user, path.split('/')[5]);
  if (path.match(/^\/api\/v1\/audit-prep\/items\/[\w-]+$/) && method === 'DELETE') return handleDeleteAuditItem(env, org, user, path.split('/')[5]);

  // SSP / OSCAL
  if (path === '/api/v1/ssp/generate' && method === 'POST') return handleGenerateSSP(request, env, org, user);
  if (path === '/api/v1/ssp' && method === 'GET') return handleListSSPs(env, org);
  if (path === '/api/v1/ssp/compare' && method === 'GET') return handleCompareSSPs(env, org, url);
  if (path.match(/^\/api\/v1\/ssp\/[\w-]+$/) && method === 'GET') return handleGetSSP(env, org, path.split('/').pop());
  if (path.match(/^\/api\/v1\/ssp\/[\w-]+\/sections\/[\w-]+$/) && method === 'PUT') return handleUpdateSSPSection(request, env, org, user, path.split('/')[4], path.split('/')[6]);
  if (path.match(/^\/api\/v1\/ssp\/[\w-]+\/ai-populate$/) && method === 'POST') return handleAIPopulateSSP(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/ssp\/[\w-]+\/ai-refine$/) && method === 'POST') return handleAIRefineSSP(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/ssp\/[\w-]+\/status$/) && method === 'PUT') return handleUpdateSSPStatus(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/ssp\/[\w-]+\/versions$/) && method === 'POST') return handleCreateSSPVersion(request, env, org, user, path.split('/')[4]);

  // Risks (RiskForge ERM)
  if (path === '/api/v1/risks' && method === 'GET') return handleListRisks(request, env, org);
  if (path === '/api/v1/risks' && method === 'POST') return handleCreateRisk(request, env, org, user);
  if (path === '/api/v1/risks/stats' && method === 'GET') return handleRiskStats(env, org);
  if (path.match(/^\/api\/v1\/risks\/[\w-]+$/) && method === 'GET') return handleGetRisk(env, org, path.split('/').pop());
  if (path.match(/^\/api\/v1\/risks\/[\w-]+$/) && method === 'PUT') return handleUpdateRisk(request, env, org, user, path.split('/').pop());
  if (path === '/api/v1/risks/ai-score' && method === 'POST') return handleAIScoreRisk(request, env, org, user);
  if (path === '/api/v1/risks/recommendations' && method === 'GET') return handleRiskRecommendations(env, org);
  if (path.match(/^\/api\/v1\/risks\/[\w-]+$/) && method === 'DELETE') return handleDeleteRisk(env, org, user, path.split('/').pop());

  // Vendors (VendorGuard)
  if (path === '/api/v1/vendors' && method === 'GET') return handleListVendors(env, org, url);
  if (path === '/api/v1/vendors' && method === 'POST') return handleCreateVendor(request, env, org, user);
  if (path.match(/^\/api\/v1\/vendors\/[\w-]+$/) && method === 'PUT') return handleUpdateVendor(request, env, org, user, path.split('/').pop());
  if (path === '/api/v1/vendors/stats' && method === 'GET') return handleVendorStats(env, org);
  if (path.match(/^\/api\/v1\/vendors\/[\w-]+\/assess$/) && method === 'POST') return handleAssessVendor(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/vendors\/[\w-]+$/) && method === 'GET') return handleGetVendor(env, org, path.split('/').pop());
  if (path.match(/^\/api\/v1\/vendors\/[\w-]+$/) && method === 'DELETE') return handleDeleteVendor(env, org, user, path.split('/').pop());

  // Monitoring (ControlPulse CCM)
  if (path === '/api/v1/monitoring/checks' && method === 'GET') return handleListMonitoringChecks(env, org);
  if (path === '/api/v1/monitoring/checks' && method === 'POST') return handleCreateMonitoringCheck(request, env, org, user);
  if (path.match(/^\/api\/v1\/monitoring\/checks\/[\w-]+$/) && method === 'PUT') return handleUpdateMonitoringCheck(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/monitoring\/checks\/[\w-]+\/run$/) && method === 'POST') return handleRunMonitoringCheck(request, env, org, user, path.split('/')[5]);
  if (path.match(/^\/api\/v1\/monitoring\/checks\/[\w-]+\/results$/) && method === 'GET') return handleGetCheckResults(env, org, path.split('/')[5]);
  if (path === '/api/v1/monitoring/dashboard' && method === 'GET') return handleMonitoringDashboard(env, org);
  if (path === '/api/v1/monitoring/drift' && method === 'GET') return handleMonitoringDrift(env, org);
  if (path === '/api/v1/monitoring/bulk-run' && method === 'POST') return handleBulkRunChecks(request, env, org, user);
  if (path === '/api/v1/monitoring/export-csv' && method === 'GET') return handleMonitoringExportCSV(env, org);

  // User Management
  if (path === '/api/v1/users' && method === 'GET') return handleListUsers(env, org, user);
  if (path === '/api/v1/users' && method === 'POST') return handleCreateUser(request, env, org, user);
  if (path.match(/^\/api\/v1\/users\/[\w-]+\/role$/) && method === 'PUT') return handleUpdateUserRole(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/users\/[\w-]+\/status$/) && method === 'PUT') return handleUpdateUserStatus(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/users\/[\w-]+\/reset-password$/) && method === 'POST') return handleResetUserPassword(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/users\/[\w-]+\/disable-mfa$/) && method === 'POST') return handleForceDisableMFA(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/users\/[\w-]+\/unlock$/) && method === 'POST') return handleUnlockUser(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/users\/[\w-]+$/) && method === 'PUT') return handleUpdateUser(request, env, org, user, path.split('/')[4]);

  // User / Onboarding
  if (path === '/api/v1/user/onboarding' && method === 'POST') return handleCompleteOnboarding(request, env, user);

  // Subscription
  if (path === '/api/v1/subscription' && method === 'GET') return handleGetSubscription(env, org);

  // Security Settings
  if (path === '/api/v1/security-settings' && method === 'GET') return handleGetSecuritySettings(env, org, user);
  if (path === '/api/v1/security-settings' && method === 'PUT') return handleUpdateSecuritySettings(request, env, org, user);

  // Data Export
  if (path === '/api/v1/organization/export' && method === 'GET') return handleOrgExport(env, org, user);

  // Dashboard stats
  if (path === '/api/v1/dashboard/stats' && method === 'GET') return handleDashboardStats(env, org);
  if (path === '/api/v1/dashboard/executive-summary' && method === 'GET') return handleExecutiveSummary(env, org, user);
  if (path === '/api/v1/dashboard/framework-stats' && method === 'GET') return handleFrameworkStats(env, org);
  if (path === '/api/v1/dashboard/my-work' && method === 'GET') return handleMyWork(env, org, user);
  if (path === '/api/v1/dashboard/asset-summary' && method === 'GET') return handleAssetSummary(env, org);
  if (path === '/api/v1/dashboard/system-comparison' && method === 'GET') return handleSystemComparison(env, org, user);
  if (path === '/api/v1/compliance/snapshot' && method === 'POST') return handleCreateComplianceSnapshot(request, env, org, user);
  if (path === '/api/v1/compliance/trends' && method === 'GET') return handleGetComplianceTrends(env, url, org);
  if (path === '/api/v1/compliance/scores' && method === 'GET') return handleComplianceScores(env, url, org, user);
  if (path === '/api/v1/compliance/score-config' && method === 'GET') return handleGetScoreConfig(env, org, user);
  if (path === '/api/v1/compliance/score-config' && method === 'PUT') return handleUpdateScoreConfig(request, env, org, user);
  if (path === '/api/v1/calendar/events' && method === 'GET') return handleCalendarEvents(env, url, org, user);

  // Compliance Alerts
  if (path === '/api/v1/alerts/summary' && method === 'GET') return handleAlertSummary(env, url, org, user);
  if (path === '/api/v1/alert-settings' && method === 'GET') return handleGetAlertSettings(env, org, user);
  if (path === '/api/v1/alert-settings' && method === 'PUT') return handleUpdateAlertSettings(request, env, org, user);

  // Policies
  if (path === '/api/v1/policies' && method === 'GET') return handleListPolicies(env, url, org);
  if (path === '/api/v1/policies' && method === 'POST') return handleCreatePolicy(request, env, org, user);
  if (path === '/api/v1/policies/stats' && method === 'GET') return handlePolicyStats(env, org);
  if (path === '/api/v1/policies/link-control' && method === 'POST') return handleLinkPolicyControl(request, env, org, user);
  if (path === '/api/v1/policies/unlink-control' && method === 'POST') return handleUnlinkPolicyControl(request, env, org, user);
  if (path === '/api/v1/attestations/my' && method === 'GET') return handleMyAttestations(env, org, user);
  if (path.match(/^\/api\/v1\/policies\/[\w-]+\/attestations\/request$/) && method === 'POST') return handleRequestAttestations(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/policies\/[\w-]+\/attestations$/) && method === 'GET') return handleGetPolicyAttestations(env, org, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/policies\/[\w-]+\/attest$/) && method === 'POST') return handleAttestPolicy(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/policies\/[\w-]+\/controls$/) && method === 'GET') return handleGetPolicyControls(env, org, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/policies\/[\w-]+\/versions$/) && method === 'POST') return handleCreatePolicyVersion(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/policies\/[\w-]+\/status$/) && method === 'PUT') return handleUpdatePolicyStatus(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/policies\/[\w-]+$/) && method === 'GET') return handleGetPolicy(env, org, path.split('/').pop());
  if (path.match(/^\/api\/v1\/policies\/[\w-]+$/) && method === 'PUT') return handleUpdatePolicy(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/policies\/[\w-]+$/) && method === 'DELETE') return handleDeletePolicy(env, org, user, path.split('/').pop());

  // Audit log
  if (path === '/api/v1/audit-log' && method === 'GET') return handleGetAuditLog(env, url, org, user);
  if (path === '/api/v1/activity/recent' && method === 'GET') return handleGetRecentActivity(env, url, org, user);
  if (path.match(/^\/api\/v1\/activity\/[\w_-]+\/[\w-]+$/) && method === 'GET') return handleGetResourceActivity(env, url, org, user, path.split('/')[4], path.split('/')[5]);
  if (path === '/api/v1/search' && method === 'GET') return handleGlobalSearch(env, url, org, user);

  // Backup & Restore (admin/owner only)
  if (path === '/api/v1/backups' && method === 'GET') return handleListBackups(env, org, user);
  if (path === '/api/v1/backups' && method === 'POST') return handleTriggerBackup(env, org, user);
  if (path.match(/^\/api\/v1\/backups\/[\w-]+$/) && method === 'GET') return handleGetBackup(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/backups\/[\w-]+\/restore$/) && method === 'POST') return handleRestoreBackup(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/backups\/[\w-]+$/) && method === 'DELETE') return handleDeleteBackup(env, org, user, path.split('/').pop());

  // Notifications
  if (path === '/api/v1/notifications' && method === 'GET') return handleGetNotifications(env, url, user);
  if (path === '/api/v1/notifications/unread-count' && method === 'GET') return handleUnreadCount(env, user);
  if (path === '/api/v1/notifications/poll' && method === 'GET') return handleNotificationPoll(env, url, user);
  if (path === '/api/v1/notifications/mark-read' && method === 'POST') return handleMarkRead(request, env, user);
  if (path === '/api/v1/notifications/mark-all-read' && method === 'POST') return handleMarkAllRead(env, user);
  if (path === '/api/v1/notification-preferences' && method === 'GET') return handleGetNotificationPrefs(env, user);
  if (path === '/api/v1/notification-preferences' && method === 'PUT') return handleUpdateNotificationPrefs(request, env, user);

  // ForgeML AI Writer
  if (path === '/api/v1/ai/generate' && method === 'POST') return handleAIGenerate(request, env, org, user);
  if (path === '/api/v1/ai/narrative' && method === 'POST') return handleAINarrative(request, env, org, user);
  if (path === '/api/v1/ai/narrative/bulk' && method === 'POST') return handleBulkAINarrative(request, env, org, user);
  if (path === '/api/v1/ai/documents' && method === 'GET') return handleListAIDocuments(env, url, org);
  if (path.match(/^\/api\/v1\/ai\/documents\/[\w-]+$/) && method === 'GET') return handleGetAIDocument(env, org, path.split('/').pop());
  if (path.match(/^\/api\/v1\/ai\/documents\/[\w-]+$/) && method === 'PUT') return handleUpdateAIDocument(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/ai\/documents\/[\w-]+$/) && method === 'DELETE') return handleDeleteAIDocument(env, org, user, path.split('/').pop());
  if (path === '/api/v1/ai/templates' && method === 'GET') return handleListAITemplates(env, org);
  if (path === '/api/v1/ai/templates' && method === 'POST') return handleCreateAITemplate(request, env, org, user);

  // Approvals
  if (path === '/api/v1/approvals' && method === 'POST') return handleCreateApproval(request, env, org, user);
  if (path === '/api/v1/approvals' && method === 'GET') return handleListApprovals(env, url, org, user);
  if (path === '/api/v1/approvals/pending/count' && method === 'GET') return handlePendingApprovalCount(env, org, user);
  if (path.match(/^\/api\/v1\/approvals\/[\w-]+\/approve$/) && method === 'PUT') return handleApproveRequest(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/approvals\/[\w-]+\/reject$/) && method === 'PUT') return handleRejectRequest(request, env, org, user, path.split('/')[4]);

  // Bulk Import
  if (path === '/api/v1/import/systems' && method === 'POST') return handleBulkImportSystems(request, env, org, user);
  if (path === '/api/v1/import/risks' && method === 'POST') return handleBulkImportRisks(request, env, org, user);
  if (path === '/api/v1/import/vendors' && method === 'POST') return handleBulkImportVendors(request, env, org, user);
  if (path === '/api/v1/import/poams' && method === 'POST') return handleBulkImportPoams(request, env, org, user);
  if (path === '/api/v1/import/implementations' && method === 'POST') return handleBulkImportImplementations(request, env, org, user);
  if (path === '/api/v1/import/oscal-ssp' && method === 'POST') return handleBulkImportOscalSSP(request, env, org, user);
  if (path === '/api/v1/import/oscal-catalog' && method === 'POST') return handleBulkImportOscalCatalog(request, env, org, user);
  if (path === '/api/v1/import/controls' && method === 'POST') return handleBulkImportControls(request, env, org, user);
  if (path === '/api/v1/import/poams-enhanced' && method === 'POST') return handleBulkImportPoamsEnhanced(request, env, org, user);

  // Vulnerability Scans (Nessus Integration)
  if (path === '/api/v1/scans/import' && method === 'POST') return handleScanImport(request, env, org, user, ctx);
  if (path === '/api/v1/scans/imports' && method === 'GET') return handleListScanImports(env, url, org);
  if (path.match(/^\/api\/v1\/scans\/import\/[\w-]+\/generate-poams$/) && method === 'POST') return handleGenerateScanPOAMs(request, env, org, user, path.split('/')[5]);
  if (path.match(/^\/api\/v1\/scans\/import\/[\w-]+$/) && method === 'GET') return handleGetScanImport(env, org, path.split('/')[5]);
  if (path.match(/^\/api\/v1\/scans\/import\/[\w-]+$/) && method === 'DELETE') return handleDeleteScanImport(env, org, user, path.split('/')[5]);

  // Assets (Inventory Management)
  if (path === '/api/v1/assets' && method === 'GET') return handleListAssets(env, url, org);
  if (path === '/api/v1/assets' && method === 'POST') return handleCreateAsset(request, env, org, user);
  if (path === '/api/v1/assets/export-csv' && method === 'GET') return handleExportAssetsCSV(env, org, user);
  if (path === '/api/v1/assets/import-csv' && method === 'POST') return handleImportAssetsCSV(request, env, org, user);
  if (path === '/api/v1/assets/bulk-update' && method === 'POST') return handleBulkUpdateAssets(request, env, org, user);
  if (path === '/api/v1/assets/bulk-delete' && method === 'POST') return handleBulkDeleteAssets(request, env, org, user);
  if (path === '/api/v1/assets/recalculate-risk-scores' && method === 'POST') return handleRecalculateRiskScores(request, env, org, user);
  if (path.match(/^\/api\/v1\/assets\/[\w-]+$/) && method === 'GET') return handleGetAsset(env, org, path.split('/').pop());
  if (path.match(/^\/api\/v1\/assets\/[\w-]+$/) && method === 'PUT') return handleUpdateAsset(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/assets\/[\w-]+$/) && method === 'DELETE') return handleDeleteAsset(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/assets\/[\w-]+\/scan-history$/) && method === 'GET') return handleGetAssetScanHistory(env, org, path.split('/')[4]);

  // Webhooks (Integration Framework)
  if (path === '/api/v1/webhooks' && method === 'GET') return handleListWebhooks(env, org, user);
  if (path === '/api/v1/webhooks' && method === 'POST') return handleCreateWebhook(request, env, org, user);
  if (path.match(/^\/api\/v1\/webhooks\/[\w-]+$/) && method === 'PUT') return handleUpdateWebhook(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/webhooks\/[\w-]+$/) && method === 'DELETE') return handleDeleteWebhook(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/webhooks\/[\w-]+\/deliveries$/) && method === 'GET') return handleWebhookDeliveries(env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/webhooks\/[\w-]+\/test$/) && method === 'POST') return handleTestWebhook(env, org, user, path.split('/')[4]);

  // Compliance Badges
  if (path === '/api/v1/compliance/badges' && method === 'GET') return handleListBadges(env, org, user);
  if (path === '/api/v1/compliance/badges' && method === 'POST') return handleCreateBadge(request, env, org, user);
  if (path.match(/^\/api\/v1\/compliance\/badges\/[\w-]+$/) && method === 'DELETE') return handleRevokeBadge(env, org, user, path.split('/').pop());

  // PDF Reports
  if (path === '/api/v1/reports/generate-pdf' && method === 'POST') return handleGeneratePDF(request, env, org, user);

  // Questionnaires
  if (path === '/api/v1/questionnaires' && method === 'GET') return handleListQuestionnaires(env, org, user);
  if (path === '/api/v1/questionnaires' && method === 'POST') return handleCreateQuestionnaire(request, env, org, user);
  if (path.match(/^\/api\/v1\/questionnaires\/[\w-]+$/) && method === 'GET') return handleGetQuestionnaire(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/questionnaires\/[\w-]+$/) && method === 'PUT') return handleUpdateQuestionnaire(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/questionnaires\/[\w-]+$/) && method === 'DELETE') return handleDeleteQuestionnaire(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/questionnaires\/[\w-]+\/responses$/) && method === 'GET') return handleListQuestionnaireResponses(env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/questionnaires\/[\w-]+\/analyze$/) && method === 'POST') return handleAnalyzeQuestionnaireResponses(request, env, org, user, path.split('/')[4]);

  // API Connectors
  if (path === '/api/v1/connectors' && method === 'GET') return handleListConnectors(env, org, user);
  if (path === '/api/v1/connectors' && method === 'POST') return handleCreateConnector(request, env, org, user);
  if (path.match(/^\/api\/v1\/connectors\/[\w-]+$/) && method === 'PUT') return handleUpdateConnector(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/connectors\/[\w-]+$/) && method === 'DELETE') return handleDeleteConnector(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/connectors\/[\w-]+\/test$/) && method === 'POST') return handleTestConnector(env, org, user, path.split('/')[4]);

  // Evidence Automation
  if (path === '/api/v1/evidence/tests' && method === 'GET') return handleListEvidenceTests(env, org, user);
  if (path === '/api/v1/evidence/tests' && method === 'POST') return handleCreateEvidenceTest(request, env, org, user);
  if (path === '/api/v1/evidence/automation/stats' && method === 'GET') return handleAutomationStats(env, org, user);
  if (path.match(/^\/api\/v1\/evidence\/tests\/[\w-]+$/) && method === 'GET') return handleGetEvidenceTest(env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/evidence\/tests\/[\w-]+$/) && method === 'PUT') return handleUpdateEvidenceTest(request, env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/evidence\/tests\/[\w-]+$/) && method === 'DELETE') return handleDeleteEvidenceTest(env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/evidence\/tests\/[\w-]+\/run$/) && method === 'POST') return handleRunEvidenceTest(env, org, user, path.split('/')[4]);
  if (path.match(/^\/api\/v1\/evidence\/tests\/[\w-]+\/results$/) && method === 'GET') return handleEvidenceTestResults(env, org, user, path.split('/')[4]);

  // Auditor Portals
  if (path === '/api/v1/portals' && method === 'GET') return handleListPortals(env, org, user);
  if (path === '/api/v1/portals' && method === 'POST') return handleCreatePortal(request, env, org, user);
  if (path.match(/^\/api\/v1\/portals\/[\w-]+$/) && method === 'GET') return handleGetPortal(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/portals\/[\w-]+$/) && method === 'PUT') return handleUpdatePortal(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/portals\/[\w-]+$/) && method === 'DELETE') return handleDeletePortal(env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/portals\/[\w-]+\/activity$/) && method === 'GET') return handlePortalActivity(env, org, user, path.split('/')[4]);

  return jsonResponse({ error: 'Not found' }, 404);
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const payload = await verifyJWT(token, requireJWTSecret(env));
    if (payload.purpose) return null; // reject MFA tokens used as access tokens
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first();
    if (!user) return null;
    const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(user.org_id).first();
    if (!org) return null;
    return { user: sanitizeUser(user), org };
  } catch {
    return null;
  }
}

function sanitizeUser(user) {
  const { password_hash, salt, mfa_secret, mfa_backup_codes, ...safe } = user;
  return safe;
}

// ============================================================================
// JWT SECRET VALIDATION
// ============================================================================

function requireJWTSecret(env) {
  if (!env.JWT_SECRET) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is not set. ' +
      'The application cannot start without a cryptographic signing secret. ' +
      'Set JWT_SECRET via: wrangler secret put JWT_SECRET (cloud) or .env file (Docker).'
    );
  }
  if (env.JWT_SECRET.length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET must be at least 32 characters for adequate security. ' +
      'Use a cryptographically random string of 64+ characters.'
    );
  }
  return env.JWT_SECRET;
}

// ============================================================================
// JWT HELPERS
// ============================================================================

async function createJWT(payload, secret, expiresInMinutes = 60) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresInMinutes * 60 };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const encodedSignature = base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${signingInput}.${encodedSignature}`;
}

async function verifyJWT(token, secret) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('Invalid token');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = base64urlDecode(signatureB64);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    Uint8Array.from(signature, (c) => c.charCodeAt(0)),
    new TextEncoder().encode(signingInput)
  );

  if (!valid) throw new Error('Invalid signature');

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');

  return payload;
}

function base64urlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

// ============================================================================
// PASSWORD HASHING (PBKDF2)
// ============================================================================

async function hashPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// PASSWORD POLICY (TAC-003 / NIST IA-5 / SP 800-63B)
// ============================================================================

function validatePasswordPolicy(password) {
  const errors = [];
  if (password.length < 12) errors.push('Password must be at least 12 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one digit');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push('Password must contain at least one special character');
  // Check for common patterns
  if (/(.)\1{3,}/.test(password)) errors.push('Password must not contain 4 or more repeating characters');
  if (/^(password|12345|qwerty|admin|letmein)/i.test(password)) errors.push('Password is too common');
  return errors.length > 0 ? errors : null;
}

async function checkPasswordHistory(env, userId, newPassword, historyCount = 12) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT password_hash, salt FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(userId, historyCount).all();
    for (const entry of results) {
      const hash = await hashPassword(newPassword, entry.salt);
      if (hash === entry.password_hash) return true; // Password was previously used
    }
  } catch { /* password_history table may not exist yet */ }
  return false;
}

async function recordPasswordHistory(env, userId, passwordHash, salt) {
  try {
    await env.DB.prepare(
      'INSERT INTO password_history (id, user_id, password_hash, salt) VALUES (?, ?, ?, ?)'
    ).bind(generateId(), userId, passwordHash, salt).run();
    // Keep only the last 24 entries per user
    await env.DB.prepare(
      "DELETE FROM password_history WHERE user_id = ? AND id NOT IN (SELECT id FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 24)"
    ).bind(userId, userId).run();
  } catch { /* password_history table may not exist yet */ }
}

async function checkBreachedPassword(password) {
  // NIST SP 800-63B: Check against known breached passwords via k-Anonymity (Have I Been Pwned)
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const fullHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'ForgeComply360-PasswordCheck' }
    });
    if (!response.ok) return false; // Fail open — don't block registration if API is down
    const body = await response.text();
    return body.split('\n').some(line => line.startsWith(suffix));
  } catch {
    return false; // Fail open on network errors
  }
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

// ============================================================================
// FIELD-LEVEL ENCRYPTION (AES-256-GCM) — HIPAA 164.312(a)(2)(iv)
// Encrypts sensitive fields (MFA secrets, backup codes) at rest.
// Uses the JWT_SECRET to derive a separate encryption key via HKDF.
// ============================================================================

async function deriveEncryptionKey(env) {
  const secret = requireJWTSecret(env);
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), 'HKDF', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('forgecomply360-field-encryption'), info: new TextEncoder().encode('aes-256-gcm') },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptField(env, plaintext) {
  if (!plaintext) return null;
  const key = await deriveEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  // Store as: base64(iv + ciphertext)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return 'enc:' + btoa(String.fromCharCode(...combined));
}

async function decryptField(env, stored) {
  if (!stored) return null;
  // Support unencrypted legacy values (migration path)
  if (!stored.startsWith('enc:')) return stored;
  const key = await deriveEncryptionKey(env);
  const raw = Uint8Array.from(atob(stored.slice(4)), c => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const ciphertext = raw.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

// ============================================================================
// TOTP TWO-FACTOR AUTHENTICATION
// ============================================================================

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  const bytes = new Uint8Array(buffer);
  let bits = 0, value = 0, output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) { output += BASE32_CHARS[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(str) {
  const cleaned = str.replace(/=+$/, '').toUpperCase();
  let bits = 0, value = 0, index = 0;
  const output = new Uint8Array(Math.floor(cleaned.length * 5 / 8));
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { output[index++] = (value >>> (bits - 8)) & 255; bits -= 8; }
  }
  return output.slice(0, index);
}

async function computeHOTP(secretBytes, counter, digits = 6) {
  const counterBuf = new ArrayBuffer(8);
  const view = new DataView(counterBuf);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter & 0xFFFFFFFF);
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBuf));
  const offset = sig[sig.length - 1] & 0x0F;
  const code = (((sig[offset] & 0x7F) << 24) | ((sig[offset + 1] & 0xFF) << 16) | ((sig[offset + 2] & 0xFF) << 8) | (sig[offset + 3] & 0xFF)) % (10 ** digits);
  return code.toString().padStart(digits, '0');
}

async function verifyTOTP(secretBytes, inputCode, window = 1) {
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const expected = await computeHOTP(secretBytes, counter + i, 6);
    if (timingSafeEqual(inputCode, expected)) return true;
  }
  return false;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function generateMFASecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return { bytes, base32: base32Encode(bytes) };
}

function generateBackupCodes(count = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    let code = '';
    for (let j = 0; j < 8; j++) code += chars[bytes[j] % chars.length];
    codes.push(code.slice(0, 4) + '-' + code.slice(4));
  }
  return codes;
}

function buildTOTPUri(secret, email, issuer = 'ForgeComply360') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

const ROLE_HIERARCHY = { viewer: 0, analyst: 1, manager: 2, admin: 3, owner: 4 };

function requireRole(user, minimumRole) {
  if (ROLE_HIERARCHY[user.role] === undefined || ROLE_HIERARCHY[minimumRole] === undefined) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole];
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function auditLog(env, orgId, userId, action, resourceType, resourceId, details = {}, request = null) {
  try {
    const id = generateId();
    const ipAddress = request?.headers?.get('CF-Connecting-IP') || null;
    const userAgent = request?.headers?.get('User-Agent') || null;
    const detailsStr = JSON.stringify(details);
    const timestamp = new Date().toISOString();

    // Hash chaining: get the most recent log hash for this org (TAC-002 / NIST AU-9)
    let prevHash = null;
    try {
      const lastLog = await env.DB.prepare(
        'SELECT integrity_hash FROM audit_logs WHERE org_id = ? ORDER BY created_at DESC LIMIT 1'
      ).bind(orgId).first();
      prevHash = lastLog?.integrity_hash || null;
    } catch { /* integrity_hash column may not exist yet — graceful degradation */ }

    // Compute integrity hash: SHA-256(prev_hash + id + action + resource + timestamp + details)
    let integrityHash = null;
    try {
      const hashInput = `${prevHash || 'GENESIS'}|${id}|${orgId}|${userId}|${action}|${resourceType}|${resourceId}|${timestamp}|${detailsStr}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput));
      integrityHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { /* hash computation is best-effort */ }

    await env.DB.prepare(
      'INSERT INTO audit_logs (id, org_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at, integrity_hash, prev_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, orgId, userId, action, resourceType, resourceId, detailsStr, ipAddress, userAgent, timestamp, integrityHash, prevHash).run();
  } catch (e) {
    // Fallback: if new columns don't exist yet, use legacy insert
    try {
      await env.DB.prepare(
        'INSERT INTO audit_logs (id, org_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(generateId(), orgId, userId, action, resourceType, resourceId, JSON.stringify(details), request?.headers?.get('CF-Connecting-IP') || null, request?.headers?.get('User-Agent') || null).run();
    } catch (e2) {
      console.error('Audit log error:', e2);
    }
  }
}

function computeDiff(oldRecord, newBody, trackedFields) {
  const changes = {};
  for (const field of trackedFields) {
    if (newBody[field] !== undefined) {
      const oldVal = oldRecord?.[field] ?? null;
      const newVal = newBody[field] ?? null;
      const oldStr = oldVal === null ? '' : String(oldVal);
      const newStr = newVal === null ? '' : String(newVal);
      if (oldStr !== newStr) {
        changes[field] = { from: oldVal, to: newVal };
      }
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

// ============================================================================
// COMPLIANCE SCORING ENGINE
// ============================================================================

const DEFAULT_SCORE_WEIGHTS = { control: 0.40, poam: 0.20, evidence: 0.15, risk: 0.15, monitoring: 0.10 };

function computeComplianceScore(data, weights) {
  const w = weights && typeof weights === 'object' ? { ...DEFAULT_SCORE_WEIGHTS, ...weights } : DEFAULT_SCORE_WEIGHTS;

  // 1. Control Implementation (0-1): full credit for implemented+NA, partial for partially/planned
  const ctrlTotal = data.controls.total || 1;
  const ctrlScore = Math.min(1, (data.controls.implemented * 1.0 + data.controls.partially * 0.5 +
    data.controls.planned * 0.2 + data.controls.na * 1.0) / ctrlTotal);

  // 2. POA&M Health (0-1): penalize open/overdue items
  const poamTotal = Math.max(data.poams.open + data.poams.in_progress + data.poams.completed, 1);
  const poamPenalty = (data.poams.open * 0.5 + data.poams.overdue * 1.0) / poamTotal;
  const poamScore = Math.max(0, Math.min(1, 1.0 - poamPenalty));

  // 3. Evidence Coverage (0-1): ratio of controls with evidence
  const evidenceScore = data.evidence.applicable > 0
    ? Math.min(1, data.evidence.covered / data.evidence.applicable)
    : 1.0;

  // 4. Risk Posture (0-1): weighted penalty by severity
  const riskTotal = data.risks.critical + data.risks.high + data.risks.moderate + data.risks.low;
  const riskPenalty = riskTotal > 0
    ? (data.risks.critical * 1.0 + data.risks.high * 0.6 + data.risks.moderate * 0.3 + data.risks.low * 0.1) / riskTotal
    : 0;
  const riskScore = Math.max(0, Math.min(1, 1.0 - riskPenalty));

  // 5. Monitoring Health (0-1): passing checks ratio
  const monitoringScore = data.monitoring.total > 0
    ? Math.min(1, data.monitoring.pass / data.monitoring.total)
    : 1.0;

  // Composite weighted score
  const composite = ctrlScore * w.control + poamScore * w.poam + evidenceScore * w.evidence +
    riskScore * w.risk + monitoringScore * w.monitoring;
  const score = Math.min(100, Math.max(0, Math.round(composite * 100)));
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return {
    score,
    grade,
    dimensions: {
      control: { score: Math.round(ctrlScore * 100), weight: w.control },
      poam: { score: Math.round(poamScore * 100), weight: w.poam },
      evidence: { score: Math.round(evidenceScore * 100), weight: w.evidence },
      risk: { score: Math.round(riskScore * 100), weight: w.risk },
      monitoring: { score: Math.round(monitoringScore * 100), weight: w.monitoring },
    },
  };
}

function getOrgScoringWeights(org) {
  try {
    const meta = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {});
    if (meta.scoring_weights) return { ...DEFAULT_SCORE_WEIGHTS, ...meta.scoring_weights };
  } catch {}
  return DEFAULT_SCORE_WEIGHTS;
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

const INSTANT_EMAIL_TYPES = ['monitoring_fail', 'approval_request', 'evidence_expiry'];

const NOTIFICATION_TYPE_LABELS = {
  poam_update: 'POA&M Updates', risk_alert: 'Risk Alerts', monitoring_fail: 'Monitoring Failures',
  control_change: 'Control Changes', role_change: 'Role Changes', compliance_alert: 'Compliance Alerts',
  evidence_upload: 'Evidence Uploads', approval_request: 'Approval Requests', approval_decision: 'Approval Decisions',
  evidence_reminder: 'Evidence Reminders', evidence_expiry: 'Evidence Expiry',
  policy_update: 'Policy Updates', attestation_request: 'Attestation Requests',
  deadline_alert: 'Deadline Alerts',
};

async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) { console.warn('[EMAIL] RESEND_API_KEY not configured, skipping email'); return null; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'ForgeComply 360 <notifications@forgecomply360.com>', to: [to], subject, html }),
    });
    if (!res.ok) { const err = await res.text(); console.error('[EMAIL] Resend error:', res.status, err); return null; }
    const data = await res.json();
    console.log('[EMAIL] Sent to', to, 'id:', data.id);
    return data;
  } catch (e) { console.error('[EMAIL] Send error:', e); return null; }
}

function buildInstantEmailHtml(userName, type, title, message) {
  const typeLabel = NOTIFICATION_TYPE_LABELS[type] || type;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
<tr><td style="background:#1e40af;padding:24px 32px"><h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">ForgeComply 360</h1></td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;color:#374151;font-size:15px">Hi ${userName || 'there'},</p>
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:0 8px 8px 0;margin:0 0 16px">
<p style="margin:0 0 4px;font-weight:600;color:#92400e;font-size:13px">${typeLabel}</p>
<p style="margin:0 0 4px;font-weight:600;color:#1f2937;font-size:15px">${title}</p>
<p style="margin:0;color:#4b5563;font-size:14px">${message}</p>
</div>
<a href="https://forgecomply360.pages.dev/notifications" style="display:inline-block;background:#1e40af;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">View in ForgeComply 360</a>
</td></tr>
<tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
<p style="margin:0;color:#9ca3af;font-size:12px">Critical alert from ForgeComply 360. Manage emails in <a href="https://forgecomply360.pages.dev/settings" style="color:#3b82f6">Settings</a>.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function buildDigestEmailHtml(userName, notifications) {
  const grouped = {};
  for (const n of notifications) { if (!grouped[n.type]) grouped[n.type] = []; grouped[n.type].push(n); }
  let sectionsHtml = '';
  for (const [type, items] of Object.entries(grouped)) {
    const label = NOTIFICATION_TYPE_LABELS[type] || type;
    let itemsHtml = '';
    for (const item of items) {
      const time = new Date(item.created_at + 'Z').toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      itemsHtml += `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6"><p style="margin:0;font-weight:500;color:#1f2937;font-size:14px">${item.title}</p><p style="margin:2px 0 0;color:#6b7280;font-size:13px">${item.message}</p></td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;white-space:nowrap;vertical-align:top"><p style="margin:0;color:#9ca3af;font-size:12px">${time}</p></td></tr>`;
    }
    sectionsHtml += `<div style="margin:0 0 24px"><p style="margin:0 0 8px;font-weight:600;color:#1e40af;font-size:14px">${label} (${items.length})</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${itemsHtml}</table></div>`;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
<tr><td style="background:#1e40af;padding:24px 32px"><h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">ForgeComply 360</h1><p style="margin:4px 0 0;color:#93c5fd;font-size:13px">Daily Notification Digest</p></td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 8px;color:#374151;font-size:15px">Hi ${userName || 'there'},</p>
<p style="margin:0 0 24px;color:#6b7280;font-size:14px">You have <strong>${notifications.length}</strong> notification${notifications.length !== 1 ? 's' : ''} from the past 24 hours:</p>
${sectionsHtml}
<a href="https://forgecomply360.pages.dev/notifications" style="display:inline-block;background:#1e40af;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">View All in ForgeComply 360</a>
</td></tr>
<tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
<p style="margin:0;color:#9ca3af;font-size:12px">Email digests are enabled. Opt out in <a href="https://forgecomply360.pages.dev/settings" style="color:#3b82f6">Settings</a>.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function createNotification(env, orgId, recipientUserId, type, title, message, resourceType, resourceId, details = {}, priority = 'normal') {
  try {
    const pref = await env.DB.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').bind(recipientUserId).first();
    if (pref && pref[type] === 0) return;

    const isInstantType = INSTANT_EMAIL_TYPES.includes(type);
    // Determine priority: urgent for critical findings, high for instant email types
    const finalPriority = priority || (isInstantType ? 'high' : 'normal');

    await env.DB.prepare(
      'INSERT INTO notifications (id, org_id, recipient_user_id, type, title, message, resource_type, resource_id, details, priority, email_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(generateId(), orgId, recipientUserId, type, title, message, resourceType || null, resourceId || null, JSON.stringify(details), finalPriority, isInstantType ? 1 : 0).run();

    // Increment notification version for efficient polling
    await env.DB.prepare(
      'UPDATE users SET notification_version = COALESCE(notification_version, 0) + 1 WHERE id = ?'
    ).bind(recipientUserId).run();

    // Send instant email for critical notification types
    if (isInstantType) {
      const emailEnabled = !pref || pref.email_digest !== 0;
      if (emailEnabled) {
        const user = await env.DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(recipientUserId).first();
        if (user && user.email) {
          await sendEmail(env, user.email, `[ForgeComply 360] ${title}`, buildInstantEmailHtml(user.name, type, title, message));
        }
      }
    }

    // Fire outbound webhooks
    fireWebhooks(env, orgId, type, { title, message, resource_type: resourceType, resource_id: resourceId, ...details });
  } catch (e) {
    console.error('Notification error:', e);
  }
}

async function notifyOrgRole(env, orgId, actorId, minRole, type, title, message, resourceType, resourceId, details = {}) {
  try {
    const minLevel = ROLE_HIERARCHY[minRole] ?? 99;
    const query = actorId
      ? 'SELECT id, role FROM users WHERE org_id = ? AND id != ?'
      : 'SELECT id, role FROM users WHERE org_id = ?';
    const bindings = actorId ? [orgId, actorId] : [orgId];
    const { results: users } = await env.DB.prepare(query).bind(...bindings).all();
    for (const u of users) {
      if ((ROLE_HIERARCHY[u.role] ?? 0) >= minLevel) {
        await createNotification(env, orgId, u.id, type, title, message, resourceType, resourceId, details);
      }
    }
  } catch (e) {
    console.error('NotifyOrgRole error:', e);
  }
}

// ============================================================================
// AUTH HANDLERS
// ============================================================================

async function handleRegister(request, env) {
  const body = await request.json();
  const { email, password, name, organizationName, industry, size } = body;

  const valErrors = validateBody(body, {
    email: { required: true, type: 'string', maxLength: 255 },
    password: { required: true, type: 'string', minLength: 12 },
    name: { required: true, type: 'string', maxLength: 255 },
    organizationName: { type: 'string', maxLength: 255 },
    industry: { type: 'string', maxLength: 200 },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  // Password complexity validation (TAC-003 / NIST IA-5)
  const policyErrors = validatePasswordPolicy(password);
  if (policyErrors) return jsonResponse({ error: 'Password does not meet complexity requirements', details: policyErrors }, 400);

  // Breached password check (NIST SP 800-63B)
  const isBreached = await checkBreachedPassword(password);
  if (isBreached) return jsonResponse({ error: 'This password has been found in a data breach. Please choose a different password.' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (existing) return jsonResponse({ error: 'Email already registered' }, 409);

  // Determine experience type from industry
  let experienceType = 'enterprise';
  if (['Defense & Aerospace', 'Federal Government'].includes(industry)) experienceType = 'federal';
  else if (['Healthcare'].includes(industry)) experienceType = 'healthcare';

  const orgId = generateId();
  const userId = generateId();
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT INTO organizations (id, name, industry, size, experience_type, subscription_tier, subscription_status, trial_ends_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(orgId, organizationName || `${name}'s Organization`, industry || null, size || null, experienceType, 'starter', 'trial', trialEnd).run();

  await env.DB.prepare(
    'INSERT INTO users (id, org_id, email, password_hash, salt, name, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(userId, orgId, email.toLowerCase(), passwordHash, salt, name, 'owner').run();

  // Record initial password in history
  await recordPasswordHistory(env, userId, passwordHash, salt);

  const accessToken = await createJWT({ sub: userId, org: orgId, role: 'owner' }, requireJWTSecret(env), 60);
  const refreshToken = generateId() + generateId();
  const refreshHash = await hashPassword(refreshToken, 'refresh-salt');
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), userId, refreshHash, refreshExpiry).run();

  await auditLog(env, orgId, userId, 'register', 'user', userId, { email }, request);

  return jsonResponse({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: { id: userId, email: email.toLowerCase(), name, role: 'owner', onboarding_completed: 0 },
    org: { id: orgId, name: organizationName, experience_type: experienceType, subscription_tier: 'starter', subscription_status: 'trial' },
  }, 201);
}

async function handleLogin(request, env) {
  const body = await request.json();
  const { email, password } = body;

  const valErrors = validateBody(body, {
    email: { required: true, type: 'string', maxLength: 255 },
    password: { required: true, type: 'string', minLength: 1 },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (!user) return jsonResponse({ error: 'Invalid credentials' }, 401);

  // Deactivated account check
  if (user.status === 'deactivated') {
    return jsonResponse({ error: 'Account has been deactivated. Contact your administrator.' }, 403);
  }

  // Account lockout check
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return jsonResponse({ error: 'Account locked. Try again later.' }, 423);
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
    await env.DB.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?')
      .bind(attempts, lockUntil, user.id).run();
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  // Reset failed attempts on success
  await env.DB.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), user.id).run();

  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(user.org_id).first();

  // Check for 2FA — return MFA challenge instead of real tokens
  if (user.mfa_enabled) {
    const mfaToken = await createJWT({ sub: user.id, org: user.org_id, purpose: 'mfa' }, requireJWTSecret(env), 5);
    await auditLog(env, user.org_id, user.id, 'login_mfa_pending', 'user', user.id, {}, request);
    return jsonResponse({ mfa_required: true, mfa_token: mfaToken });
  }

  const accessToken = await createJWT({ sub: user.id, org: user.org_id, role: user.role }, requireJWTSecret(env), 60);
  const refreshToken = generateId() + generateId();
  const refreshHash = await hashPassword(refreshToken, 'refresh-salt');
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), user.id, refreshHash, refreshExpiry).run();

  await auditLog(env, user.org_id, user.id, 'login', 'user', user.id, {}, request);

  return jsonResponse({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: sanitizeUser(user),
    org,
  });
}

async function handleRefreshToken(request, env) {
  const { refresh_token } = await request.json();
  if (!refresh_token) return jsonResponse({ error: 'Refresh token required' }, 400);

  const tokenHash = await hashPassword(refresh_token, 'refresh-salt');
  const stored = await env.DB.prepare(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > datetime("now")'
  ).bind(tokenHash).first();

  if (!stored) return jsonResponse({ error: 'Invalid or expired refresh token' }, 401);

  // Revoke old token
  await env.DB.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').bind(stored.id).run();

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(stored.user_id).first();
  if (!user) return jsonResponse({ error: 'User not found' }, 404);
  if (user.status === 'deactivated') return jsonResponse({ error: 'Account has been deactivated' }, 403);

  const accessToken = await createJWT({ sub: user.id, org: user.org_id, role: user.role }, requireJWTSecret(env), 60);
  const newRefreshToken = generateId() + generateId();
  const newRefreshHash = await hashPassword(newRefreshToken, 'refresh-salt');
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), user.id, newRefreshHash, refreshExpiry).run();

  return jsonResponse({ access_token: accessToken, refresh_token: newRefreshToken });
}

async function handleLogout(request, env, user) {
  await env.DB.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').bind(user.id).run();
  return jsonResponse({ message: 'Logged out' });
}

async function handleChangePassword(request, env, user) {
  const { current_password, new_password } = await request.json();
  if (!current_password || !new_password) return jsonResponse({ error: 'Current password and new password are required' }, 400);
  if (current_password === new_password) return jsonResponse({ error: 'New password must be different from current password' }, 400);

  // Password complexity validation (TAC-003 / NIST IA-5)
  const policyErrors = validatePasswordPolicy(new_password);
  if (policyErrors) return jsonResponse({ error: 'Password does not meet complexity requirements', details: policyErrors }, 400);

  const fullUser = await env.DB.prepare('SELECT password_hash, salt FROM users WHERE id = ?').bind(user.id).first();
  const currentHash = await hashPassword(current_password, fullUser.salt);
  if (currentHash !== fullUser.password_hash) return jsonResponse({ error: 'Current password is incorrect' }, 401);

  // Check password history — prevent reuse of last 12 passwords (NIST IA-5(1)(e))
  const wasUsed = await checkPasswordHistory(env, user.id, new_password, 12);
  if (wasUsed) return jsonResponse({ error: 'This password was used recently. Choose a password you have not used in the last 12 changes.' }, 400);

  // Breached password check (NIST SP 800-63B)
  const isBreached = await checkBreachedPassword(new_password);
  if (isBreached) return jsonResponse({ error: 'This password has been found in a data breach. Please choose a different password.' }, 400);

  const newSalt = generateSalt();
  const newHash = await hashPassword(new_password, newSalt);
  await env.DB.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .bind(newHash, newSalt, user.id).run();

  // Record in password history
  await recordPasswordHistory(env, user.id, newHash, newSalt);

  // Revoke all refresh tokens to force re-login on other devices
  await env.DB.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').bind(user.id).run();

  await auditLog(env, user.org_id, user.id, 'update', 'user', user.id, { action: 'password_change' }, request);
  return jsonResponse({ message: 'Password changed successfully' });
}

// ============================================================================
// MFA ENDPOINTS
// ============================================================================

async function handleMFASetup(request, env, user) {
  const fullUser = await env.DB.prepare('SELECT mfa_enabled FROM users WHERE id = ?').bind(user.id).first();
  if (fullUser.mfa_enabled) return jsonResponse({ error: '2FA is already enabled' }, 400);

  const { base32 } = generateMFASecret();
  const uri = buildTOTPUri(base32, user.email);
  const encryptedSecret = await encryptField(env, base32);
  await env.DB.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').bind(encryptedSecret, user.id).run();
  return jsonResponse({ secret: base32, uri });
}

async function handleMFAVerifySetup(request, env, user) {
  const { code } = await request.json();
  if (!code) return jsonResponse({ error: 'Code required' }, 400);

  const fullUser = await env.DB.prepare('SELECT mfa_secret, mfa_enabled FROM users WHERE id = ?').bind(user.id).first();
  if (!fullUser.mfa_secret) return jsonResponse({ error: 'No MFA setup in progress' }, 400);
  if (fullUser.mfa_enabled) return jsonResponse({ error: '2FA is already enabled' }, 400);

  const decryptedSecret = await decryptField(env, fullUser.mfa_secret);
  const secretBytes = base32Decode(decryptedSecret);
  const valid = await verifyTOTP(secretBytes, code.replace(/\s/g, ''));
  if (!valid) return jsonResponse({ error: 'Invalid code. Check your authenticator app and try again.' }, 400);

  const backupCodes = generateBackupCodes(8);
  const encryptedBackupCodes = await encryptField(env, JSON.stringify(backupCodes));
  await env.DB.prepare('UPDATE users SET mfa_enabled = 1, mfa_backup_codes = ? WHERE id = ?')
    .bind(encryptedBackupCodes, user.id).run();
  await auditLog(env, user.org_id, user.id, 'mfa_enabled', 'user', user.id, {});
  return jsonResponse({ backup_codes: backupCodes });
}

async function handleMFAVerify(request, env) {
  const { mfa_token, code } = await request.json();
  if (!mfa_token || !code) return jsonResponse({ error: 'MFA token and code required' }, 400);

  let payload;
  try {
    payload = await verifyJWT(mfa_token, requireJWTSecret(env));
  } catch {
    return jsonResponse({ error: 'Invalid or expired MFA token' }, 401);
  }
  if (payload.purpose !== 'mfa') return jsonResponse({ error: 'Invalid token type' }, 401);

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first();
  if (!user || !user.mfa_enabled) return jsonResponse({ error: 'Invalid MFA state' }, 400);

  const cleanCode = code.replace(/[\s-]/g, '');
  let valid = false;

  // Try TOTP — decrypt the secret first
  const decryptedMfaSecret = await decryptField(env, user.mfa_secret);
  const secretBytes = base32Decode(decryptedMfaSecret);
  valid = await verifyTOTP(secretBytes, cleanCode);

  // Try backup codes if TOTP didn't match — decrypt backup codes first
  if (!valid && user.mfa_backup_codes) {
    const decryptedBackupCodes = await decryptField(env, user.mfa_backup_codes);
    const backupCodes = JSON.parse(decryptedBackupCodes);
    const normalizedInput = cleanCode.toUpperCase();
    const matchIndex = backupCodes.findIndex(bc => bc.replace(/-/g, '') === normalizedInput);
    if (matchIndex !== -1) {
      valid = true;
      backupCodes.splice(matchIndex, 1);
      const encryptedUpdatedCodes = await encryptField(env, JSON.stringify(backupCodes));
      await env.DB.prepare('UPDATE users SET mfa_backup_codes = ? WHERE id = ?')
        .bind(encryptedUpdatedCodes, user.id).run();
    }
  }

  if (!valid) return jsonResponse({ error: 'Invalid code' }, 401);

  // Issue real tokens
  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(user.org_id).first();
  const accessToken = await createJWT({ sub: user.id, org: user.org_id, role: user.role }, requireJWTSecret(env), 60);
  const refreshToken = generateId() + generateId();
  const refreshHash = await hashPassword(refreshToken, 'refresh-salt');
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)')
    .bind(generateId(), user.id, refreshHash, refreshExpiry).run();

  await auditLog(env, user.org_id, user.id, 'login', 'user', user.id, { mfa: true }, request);

  return jsonResponse({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: sanitizeUser(user),
    org,
  });
}

async function handleMFADisable(request, env, user) {
  const { code } = await request.json();
  if (!code) return jsonResponse({ error: 'Current TOTP code required' }, 400);

  const fullUser = await env.DB.prepare('SELECT mfa_secret, mfa_enabled, mfa_backup_codes FROM users WHERE id = ?').bind(user.id).first();
  if (!fullUser.mfa_enabled) return jsonResponse({ error: '2FA is not enabled' }, 400);

  const cleanCode = code.replace(/[\s-]/g, '');
  const decryptedSecret = await decryptField(env, fullUser.mfa_secret);
  const secretBytes = base32Decode(decryptedSecret);
  let valid = await verifyTOTP(secretBytes, cleanCode);

  if (!valid && fullUser.mfa_backup_codes) {
    const decryptedCodes = await decryptField(env, fullUser.mfa_backup_codes);
    const backupCodes = JSON.parse(decryptedCodes);
    valid = backupCodes.some(bc => bc.replace(/-/g, '') === cleanCode.toUpperCase());
  }
  if (!valid) return jsonResponse({ error: 'Invalid code' }, 401);

  await env.DB.prepare('UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_backup_codes = NULL WHERE id = ?').bind(user.id).run();
  await auditLog(env, user.org_id, user.id, 'mfa_disabled', 'user', user.id, {});
  return jsonResponse({ success: true });
}

async function handleMFARegenerateBackupCodes(request, env, user) {
  const { code } = await request.json();
  if (!code) return jsonResponse({ error: 'Current TOTP code required' }, 400);

  const fullUser = await env.DB.prepare('SELECT mfa_secret, mfa_enabled FROM users WHERE id = ?').bind(user.id).first();
  if (!fullUser.mfa_enabled) return jsonResponse({ error: '2FA is not enabled' }, 400);

  const decryptedSecret = await decryptField(env, fullUser.mfa_secret);
  const secretBytes = base32Decode(decryptedSecret);
  const valid = await verifyTOTP(secretBytes, code.replace(/\s/g, ''));
  if (!valid) return jsonResponse({ error: 'Invalid code' }, 401);

  const newCodes = generateBackupCodes(8);
  const encryptedCodes = await encryptField(env, JSON.stringify(newCodes));
  await env.DB.prepare('UPDATE users SET mfa_backup_codes = ? WHERE id = ?').bind(encryptedCodes, user.id).run();
  await auditLog(env, user.org_id, user.id, 'mfa_backup_regenerated', 'user', user.id, {});
  return jsonResponse({ backup_codes: newCodes });
}

// ============================================================================
// EXPERIENCE LAYER
// ============================================================================

async function handleGetExperience(env, org) {
  const config = await env.DB.prepare('SELECT * FROM experience_configs WHERE experience_type = ?')
    .bind(org.experience_type || 'enterprise').first();

  if (!config) return jsonResponse({ error: 'Experience config not found' }, 404);

  return jsonResponse({
    experience_type: config.experience_type,
    display_name: config.display_name,
    terminology: JSON.parse(config.terminology),
    default_workflow: JSON.parse(config.default_workflow),
    dashboard_widgets: JSON.parse(config.dashboard_widgets),
    nav_labels: JSON.parse(config.nav_labels),
    doc_templates: JSON.parse(config.doc_templates),
    theme_overrides: JSON.parse(config.theme_overrides || '{}'),
  });
}

async function handleUpdateExperience(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { experience_type } = await request.json();
  if (!['federal', 'enterprise', 'healthcare', 'custom'].includes(experience_type)) {
    return jsonResponse({ error: 'Invalid experience type' }, 400);
  }
  await env.DB.prepare('UPDATE organizations SET experience_type = ?, updated_at = ? WHERE id = ?')
    .bind(experience_type, new Date().toISOString(), org.id).run();
  await auditLog(env, org.id, user.id, 'update_experience', 'organization', org.id, { experience_type });
  return jsonResponse({ message: 'Experience updated', experience_type });
}

// ============================================================================
// ORGANIZATION
// ============================================================================

async function handleUpdateOrg(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { name, industry, size } = body;

  // Auto-detect experience type from industry
  let experienceType = org.experience_type;
  if (industry) {
    if (['Defense & Aerospace', 'Federal Government'].includes(industry)) experienceType = 'federal';
    else if (['Healthcare'].includes(industry)) experienceType = 'healthcare';
    else experienceType = 'enterprise';
  }

  await env.DB.prepare(
    'UPDATE organizations SET name = COALESCE(?, name), industry = COALESCE(?, industry), size = COALESCE(?, size), experience_type = ?, updated_at = ? WHERE id = ?'
  ).bind(name || null, industry || null, size || null, experienceType, new Date().toISOString(), org.id).run();

  await auditLog(env, org.id, user.id, 'update', 'organization', org.id, body);
  const updated = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(org.id).first();
  return jsonResponse({ org: updated });
}

// ============================================================================
// FRAMEWORKS
// ============================================================================

async function handleListFrameworks(env, url) {
  const category = url.searchParams.get('category');
  let query = 'SELECT * FROM compliance_frameworks WHERE is_active = 1';
  const params = [];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY category, name';
  const stmt = params.length ? env.DB.prepare(query).bind(...params) : env.DB.prepare(query);
  const { results } = await stmt.all();
  return jsonResponse({ frameworks: results });
}

async function handleListEnabledFrameworks(env, org) {
  const { results } = await env.DB.prepare(
    `SELECT cf.*, of2.is_primary, of2.enabled_at
     FROM organization_frameworks of2
     JOIN compliance_frameworks cf ON cf.id = of2.framework_id
     WHERE of2.org_id = ? AND of2.enabled = 1
     ORDER BY of2.is_primary DESC, cf.name`
  ).bind(org.id).all();
  return jsonResponse({ frameworks: results });
}

async function handleEnableFramework(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { framework_id, is_primary } = await request.json();

  // Check framework limit
  const { count } = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM organization_frameworks WHERE org_id = ? AND enabled = 1'
  ).bind(org.id).first();

  if (count >= org.max_frameworks) {
    return jsonResponse({ error: `Framework limit reached (${org.max_frameworks}). Upgrade your plan for more.` }, 403);
  }

  // If setting as primary, unset existing primary
  if (is_primary) {
    await env.DB.prepare('UPDATE organization_frameworks SET is_primary = 0 WHERE org_id = ?').bind(org.id).run();
  }

  await env.DB.prepare(
    `INSERT INTO organization_frameworks (id, org_id, framework_id, enabled, is_primary)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(org_id, framework_id) DO UPDATE SET enabled = 1, is_primary = COALESCE(?, is_primary)`
  ).bind(generateId(), org.id, framework_id, is_primary ? 1 : 0, is_primary ? 1 : null).run();

  await auditLog(env, org.id, user.id, 'enable_framework', 'framework', framework_id);
  return jsonResponse({ message: 'Framework enabled' }, 201);
}

async function handleDisableFramework(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { framework_id } = await request.json();
  await env.DB.prepare('UPDATE organization_frameworks SET enabled = 0 WHERE org_id = ? AND framework_id = ?')
    .bind(org.id, framework_id).run();
  await auditLog(env, org.id, user.id, 'disable_framework', 'framework', framework_id);
  return jsonResponse({ message: 'Framework disabled' });
}

// ============================================================================
// CROSSWALKS
// ============================================================================

async function handleGetCrosswalks(env, url) {
  const sourceFramework = url.searchParams.get('source_framework');
  const targetFramework = url.searchParams.get('target_framework');
  const sourceControl = url.searchParams.get('source_control');

  let query = 'SELECT * FROM control_crosswalks WHERE 1=1';
  const params = [];

  if (sourceFramework) { query += ' AND source_framework_id = ?'; params.push(sourceFramework); }
  if (targetFramework) { query += ' AND target_framework_id = ?'; params.push(targetFramework); }
  if (sourceControl) { query += ' AND source_control_id = ?'; params.push(sourceControl); }

  query += ' ORDER BY source_control_id, target_framework_id';
  const stmt = params.length ? env.DB.prepare(query).bind(...params) : env.DB.prepare(query);
  const { results } = await stmt.all();
  return jsonResponse({ crosswalks: results });
}

// ============================================================================
// CONTROLS
// ============================================================================

async function handleListControls(env, url, org) {
  const frameworkId = url.searchParams.get('framework_id');
  const family = url.searchParams.get('family');
  const baseline = url.searchParams.get('baseline');
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM security_controls WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM security_controls WHERE 1=1';
  const params = [];
  const countParams = [];

  if (frameworkId) {
    query += ' AND framework_id = ?'; countQuery += ' AND framework_id = ?';
    params.push(frameworkId); countParams.push(frameworkId);
  }
  if (family) {
    query += ' AND family = ?'; countQuery += ' AND family = ?';
    params.push(family); countParams.push(family);
  }
  if (baseline) {
    const col = `baseline_${baseline}`;
    if (['baseline_low', 'baseline_moderate', 'baseline_high'].includes(col)) {
      query += ` AND ${col} = 1`; countQuery += ` AND ${col} = 1`;
    }
  }
  if (search) {
    query += ' AND (control_id LIKE ? OR title LIKE ? OR description LIKE ?)';
    countQuery += ' AND (control_id LIKE ? OR title LIKE ? OR description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term); countParams.push(term, term, term);
  }

  const { total } = await (countParams.length
    ? env.DB.prepare(countQuery).bind(...countParams)
    : env.DB.prepare(countQuery)
  ).first();

  query += ' ORDER BY sort_order, control_id LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse({ controls: results, total, page, limit, pages: Math.ceil(total / limit) });
}

// ============================================================================
// SYSTEMS
// ============================================================================

async function handleListSystems(env, org) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM systems WHERE org_id = ? ORDER BY created_at DESC'
  ).bind(org.id).all();
  return jsonResponse({ systems: results });
}

async function handleCreateSystem(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { name, acronym, description, impact_level, deployment_model, service_model } = body;
  if (!name) return jsonResponse({ error: 'System name is required' }, 400);

  // Check system limit
  const { count } = await env.DB.prepare('SELECT COUNT(*) as count FROM systems WHERE org_id = ?').bind(org.id).first();
  if (count >= org.max_systems) {
    return jsonResponse({ error: `System limit reached (${org.max_systems}). Upgrade your plan.` }, 403);
  }

  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO systems (id, org_id, name, acronym, description, impact_level, deployment_model, service_model)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, name, acronym || null, description || null, impact_level || 'moderate', deployment_model || null, service_model || null).run();

  await auditLog(env, org.id, user.id, 'create', 'system', id, { name });
  const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ?').bind(id).first();
  return jsonResponse({ system }, 201);
}

async function handleGetSystem(env, org, systemId) {
  const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(systemId, org.id).first();
  if (!system) return jsonResponse({ error: 'System not found' }, 404);
  return jsonResponse({ system });
}

async function handleUpdateSystem(request, env, org, user, systemId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(systemId, org.id).first();
  if (!system) return jsonResponse({ error: 'System not found' }, 404);

  const fields = ['name', 'acronym', 'description', 'impact_level', 'status', 'system_owner', 'authorizing_official', 'security_officer', 'boundary_description', 'deployment_model', 'service_model'];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(systemId);

  await env.DB.prepare(`UPDATE systems SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  const changes = computeDiff(system, body, ['name', 'acronym', 'description', 'impact_level', 'status', 'system_owner', 'authorizing_official', 'security_officer', 'boundary_description', 'deployment_model', 'service_model']);
  await auditLog(env, org.id, user.id, 'update', 'system', systemId, { ...body, _changes: changes });

  const updated = await env.DB.prepare('SELECT * FROM systems WHERE id = ?').bind(systemId).first();
  return jsonResponse({ system: updated });
}

async function handleDeleteSystem(env, org, user, systemId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(systemId, org.id).first();
  if (!system) return jsonResponse({ error: 'System not found' }, 404);

  await env.DB.prepare('DELETE FROM systems WHERE id = ?').bind(systemId).run();
  await auditLog(env, org.id, user.id, 'delete', 'system', systemId, { name: system.name });
  return jsonResponse({ message: 'System deleted' });
}

// ============================================================================
// CONTROL IMPLEMENTATIONS
// ============================================================================

async function handleListImplementations(env, url, org) {
  const systemId = url.searchParams.get('system_id');
  const frameworkId = url.searchParams.get('framework_id');
  const status = url.searchParams.get('status');
  const inherited = url.searchParams.get('inherited');

  let query = `SELECT ci.*, sc.title as control_title, sc.family, sc.description as control_description, s2.name as inherited_from_name
    FROM control_implementations ci
    LEFT JOIN security_controls sc ON sc.framework_id = ci.framework_id AND sc.control_id = ci.control_id
    LEFT JOIN systems s2 ON s2.id = ci.inherited_from
    WHERE ci.org_id = ?`;
  const params = [org.id];

  if (systemId) { query += ' AND ci.system_id = ?'; params.push(systemId); }
  if (frameworkId) { query += ' AND ci.framework_id = ?'; params.push(frameworkId); }
  if (status) { query += ' AND ci.status = ?'; params.push(status); }
  if (inherited === '1') { query += ' AND ci.inherited = 1'; }
  if (inherited === '0') { query += ' AND (ci.inherited = 0 OR ci.inherited IS NULL)'; }

  query += ' ORDER BY sc.sort_order, ci.control_id';
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse({ implementations: results });
}

async function handleUpsertImplementation(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, framework_id, control_id, status, implementation_description, responsible_role, ai_narrative } = body;

  if (!system_id || !framework_id || !control_id) {
    return jsonResponse({ error: 'system_id, framework_id, and control_id are required' }, 400);
  }

  const oldImpl = await env.DB.prepare(
    'SELECT * FROM control_implementations WHERE system_id = ? AND framework_id = ? AND control_id = ?'
  ).bind(system_id, framework_id, control_id).first();

  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role, ai_narrative)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(system_id, framework_id, control_id) DO UPDATE SET
       status = COALESCE(?, status),
       implementation_description = COALESCE(?, implementation_description),
       responsible_role = COALESCE(?, responsible_role),
       ai_narrative = COALESCE(?, ai_narrative),
       inherited = 0,
       updated_at = datetime('now')`
  ).bind(
    id, org.id, system_id, framework_id, control_id, status || 'not_implemented', implementation_description || null, responsible_role || null, ai_narrative || null,
    status || null, implementation_description || null, responsible_role || null, ai_narrative || null
  ).run();

  // Return the full implementation record
  const impl = await env.DB.prepare(
    'SELECT * FROM control_implementations WHERE system_id = ? AND framework_id = ? AND control_id = ?'
  ).bind(system_id, framework_id, control_id).first();

  const implChanges = oldImpl ? computeDiff(oldImpl, body, ['status', 'implementation_description', 'responsible_role', 'ai_narrative']) : null;
  const implAction = oldImpl ? 'update' : 'create';
  await auditLog(env, org.id, user.id, implAction, 'control_implementation', impl.id, { system_id, framework_id, control_id, status, _changes: implChanges });
  if (status === 'not_implemented') await notifyOrgRole(env, org.id, user.id, 'manager', 'control_change', 'Control Set to Not Implemented', 'A control was marked as not implemented', 'control_implementation', control_id, { framework_id, system_id });
  return jsonResponse({ message: 'Implementation saved', implementation: impl }, 201);
}

async function handleBulkInitImplementations(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { system_id, framework_id } = await request.json();
  if (!system_id || !framework_id) return jsonResponse({ error: 'system_id and framework_id required' }, 400);

  // Get all controls for this framework
  const { results: controls } = await env.DB.prepare(
    'SELECT control_id FROM security_controls WHERE framework_id = ?'
  ).bind(framework_id).all();

  let inserted = 0;
  for (const ctrl of controls) {
    try {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO control_implementations (id, org_id, system_id, framework_id, control_id, status)
         VALUES (?, ?, ?, ?, ?, 'not_implemented')`
      ).bind(generateId(), org.id, system_id, framework_id, ctrl.control_id).run();
      inserted++;
    } catch { /* skip duplicates */ }
  }

  await auditLog(env, org.id, user.id, 'bulk_init', 'control_implementation', framework_id, { system_id, count: inserted });
  return jsonResponse({ message: `Initialized ${inserted} control implementations` }, 201);
}

async function handleImplementationStats(env, url, org) {
  const systemId = url.searchParams.get('system_id');
  const frameworkId = url.searchParams.get('framework_id');

  let query = `SELECT status, COUNT(*) as count FROM control_implementations WHERE org_id = ?`;
  const params = [org.id];
  if (systemId) { query += ' AND system_id = ?'; params.push(systemId); }
  if (frameworkId) { query += ' AND framework_id = ?'; params.push(frameworkId); }
  query += ' GROUP BY status';

  const { results } = await env.DB.prepare(query).bind(...params).all();

  const stats = { implemented: 0, partially_implemented: 0, planned: 0, alternative: 0, not_applicable: 0, not_implemented: 0, total: 0 };
  for (const row of results) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  stats.compliance_percentage = stats.total > 0 ? Math.round(((stats.implemented + stats.not_applicable) / stats.total) * 100) : 0;

  return jsonResponse({ stats });
}

// ============================================================================
// POA&Ms
// ============================================================================

async function handleListPoams(env, url, org) {
  const systemId = url.searchParams.get('system_id');
  const status = url.searchParams.get('status');
  const riskLevel = url.searchParams.get('risk_level');
  const overdue = url.searchParams.get('overdue');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let where = ' WHERE p.org_id = ?';
  const params = [org.id];
  if (systemId) { where += ' AND p.system_id = ?'; params.push(systemId); }
  if (status) { where += ' AND p.status = ?'; params.push(status); }
  if (riskLevel) { where += ' AND p.risk_level = ?'; params.push(riskLevel); }
  if (overdue === '1') { where += " AND p.scheduled_completion < date('now') AND p.status NOT IN ('completed','accepted','deferred')"; }

  const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM poams p' + where).bind(...params).first();
  const total = countResult?.total || 0;

  const orderBy = ' ORDER BY CASE p.risk_level WHEN "critical" THEN 0 WHEN "high" THEN 1 WHEN "moderate" THEN 2 ELSE 3 END, p.created_at DESC';
  const query = `SELECT p.*, u.name as assigned_to_name, u2.name as created_by_name, s.name as system_name, v.name as vendor_name, v.criticality as vendor_criticality
    FROM poams p LEFT JOIN users u ON p.assigned_to = u.id LEFT JOIN users u2 ON p.created_by = u2.id LEFT JOIN systems s ON s.id = p.system_id LEFT JOIN vendors v ON v.id = p.vendor_id`
    + where + orderBy + ' LIMIT ? OFFSET ?';

  const { results } = await env.DB.prepare(query).bind(...params, limit, offset).all();

  const now = new Date().toISOString().split('T')[0];
  for (const p of results) {
    p.days_open = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000);
    p.is_overdue = !!(p.scheduled_completion && p.scheduled_completion < now && !['completed','accepted','deferred'].includes(p.status));
  }

  // Milestone counts per poam
  const poamIds = results.map(r => r.id);
  if (poamIds.length > 0) {
    const ph = poamIds.map(() => '?').join(',');
    const { results: ms } = await env.DB.prepare(
      `SELECT poam_id, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM poam_milestones WHERE poam_id IN (${ph}) GROUP BY poam_id`
    ).bind(...poamIds).all();
    const msMap = {};
    for (const m of ms) msMap[m.poam_id] = m;
    for (const p of results) { const m = msMap[p.id]; p.milestone_total = m?.total || 0; p.milestone_completed = m?.completed || 0; }

    // Junction table counts (FedRAMP compliance)
    const { results: assetCounts } = await env.DB.prepare(
      `SELECT poam_id, COUNT(*) as count FROM poam_affected_assets WHERE poam_id IN (${ph}) GROUP BY poam_id`
    ).bind(...poamIds).all();
    const assetMap = {};
    for (const a of assetCounts) assetMap[a.poam_id] = a.count;

    const { results: controlCounts } = await env.DB.prepare(
      `SELECT poam_id, COUNT(*) as count FROM poam_control_mappings WHERE poam_id IN (${ph}) GROUP BY poam_id`
    ).bind(...poamIds).all();
    const controlMap = {};
    for (const c of controlCounts) controlMap[c.poam_id] = c.count;

    const { results: evidenceCounts } = await env.DB.prepare(
      `SELECT poam_id, COUNT(*) as count FROM poam_evidence WHERE poam_id IN (${ph}) GROUP BY poam_id`
    ).bind(...poamIds).all();
    const evidenceMap = {};
    for (const e of evidenceCounts) evidenceMap[e.poam_id] = e.count;

    for (const p of results) {
      p.asset_count = assetMap[p.id] || 0;
      p.control_count = controlMap[p.id] || 0;
      p.evidence_count = evidenceMap[p.id] || 0;
    }
  }

  return jsonResponse({ poams: results, total, page, limit });
}

async function handleCreatePoam(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, weakness_name, weakness_description, control_id, framework_id, risk_level, scheduled_completion, responsible_party, assigned_to,
    data_classification, cui_category, risk_register_id, impact_confidentiality, impact_integrity, impact_availability,
    asset_owner_id, asset_owner_name, vendor_id, vendor_dependency_notes, related_observations, related_risks } = body;

  const valErrors = validateBody(body, {
    weakness_name: { required: true, type: 'string', maxLength: 500 },
    risk_level: { enum: ['low', 'moderate', 'high', 'critical'] },
    system_id: { required: true, type: 'string' },
    data_classification: { enum: ['public', 'internal', 'confidential', 'cui', 'classified'] },
    impact_confidentiality: { enum: ['low', 'moderate', 'high'] },
    impact_integrity: { enum: ['low', 'moderate', 'high'] },
    impact_availability: { enum: ['low', 'moderate', 'high'] },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  const id = generateId();
  const poamId = `POAM-${Date.now().toString(36).toUpperCase()}`;
  const oscalUuid = generateId(); // OSCAL UUID for export

  await env.DB.prepare(
    `INSERT INTO poams (id, org_id, system_id, poam_id, weakness_name, weakness_description, control_id, framework_id, risk_level, status, scheduled_completion, responsible_party, assigned_to, created_by,
     data_classification, cui_category, risk_register_id, impact_confidentiality, impact_integrity, impact_availability, asset_owner_id, asset_owner_name,
     vendor_id, vendor_dependency_notes, oscal_uuid, related_observations, related_risks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, system_id, poamId, weakness_name, weakness_description || null, control_id || null, framework_id || null, risk_level || 'moderate', scheduled_completion || null, responsible_party || null, assigned_to || null, user.id,
    data_classification || 'internal', cui_category || null, risk_register_id || null, impact_confidentiality || null, impact_integrity || null, impact_availability || null, asset_owner_id || null, asset_owner_name || null,
    vendor_id || null, vendor_dependency_notes || null, oscalUuid, related_observations || '[]', related_risks || '[]').run();

  await auditLog(env, org.id, user.id, 'create', 'poam', id, { poam_id: poamId, weakness_name, data_classification, vendor_id });
  await notifyOrgRole(env, org.id, user.id, 'manager', 'poam_update', 'New POA&M Created', 'POA&M "' + weakness_name + '" was created', 'poam', id, {});
  if (assigned_to && assigned_to !== user.id) {
    await createNotification(env, org.id, assigned_to, 'poam_update', 'POA&M Assigned to You', 'You were assigned to POA&M "' + weakness_name + '"', 'poam', id, {});
  }
  const poam = await env.DB.prepare('SELECT * FROM poams WHERE id = ?').bind(id).first();
  return jsonResponse({ poam }, 201);
}

async function handleUpdatePoam(request, env, org, user, poamId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const poam = await env.DB.prepare('SELECT * FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);

  const fields = ['weakness_name', 'weakness_description', 'risk_level', 'status', 'scheduled_completion', 'actual_completion', 'milestones', 'responsible_party', 'resources_required', 'cost_estimate', 'comments', 'assigned_to', 'vendor_dependency',
    'data_classification', 'cui_category', 'risk_register_id', 'impact_confidentiality', 'impact_integrity', 'impact_availability',
    'deviation_type', 'deviation_rationale', 'deviation_expires_at', 'deviation_review_frequency', 'deviation_next_review', 'compensating_control_description',
    'asset_owner_id', 'asset_owner_name', 'vendor_id', 'vendor_dependency_notes', 'oscal_poam_item_id', 'related_observations', 'related_risks'];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(field === 'milestones' ? JSON.stringify(body[field]) : body[field]);
    }
  }

  // Handle deviation approval (manager+ required)
  if (body.deviation_approved !== undefined) {
    if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Manager role required for deviation approval' }, 403);
    if (body.deviation_approved) {
      updates.push('deviation_approved_by = ?', 'deviation_approved_at = ?');
      values.push(user.id, new Date().toISOString());
      // Record in deviation history
      await env.DB.prepare(
        'INSERT INTO poam_deviation_history (id, poam_id, action, deviation_type, rationale, performed_by, expires_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(generateId(), poamId, 'approved', body.deviation_type || poam.deviation_type, body.deviation_rationale || poam.deviation_rationale, user.id, body.deviation_expires_at || null, body.approval_notes || null).run();
    } else {
      // Revoke approval
      updates.push('deviation_approved_by = NULL', 'deviation_approved_at = NULL');
      await env.DB.prepare(
        'INSERT INTO poam_deviation_history (id, poam_id, action, deviation_type, performed_by, notes) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(generateId(), poamId, 'revoked', poam.deviation_type, user.id, body.revoke_reason || null).run();
    }
  }

  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(poamId);

  await env.DB.prepare(`UPDATE poams SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  const changes = computeDiff(poam, body, ['weakness_name', 'weakness_description', 'risk_level', 'status', 'scheduled_completion', 'actual_completion', 'responsible_party', 'resources_required', 'cost_estimate', 'assigned_to', 'vendor_dependency', 'data_classification', 'deviation_type']);
  await auditLog(env, org.id, user.id, 'update', 'poam', poamId, { ...body, _changes: changes });
  if (body.status) {
    await notifyOrgRole(env, org.id, user.id, 'manager', 'poam_update', 'POA&M Status Changed', 'POA&M "' + poam.weakness_name + '" status changed to ' + body.status, 'poam', poamId, { status: body.status });
    if (poam.assigned_to && poam.assigned_to !== user.id) {
      await createNotification(env, org.id, poam.assigned_to, 'poam_update', 'POA&M Status Changed', 'POA&M "' + poam.weakness_name + '" status changed to ' + body.status, 'poam', poamId, {});
    }
  }
  if (body.assigned_to && body.assigned_to !== poam.assigned_to && body.assigned_to !== user.id) {
    await createNotification(env, org.id, body.assigned_to, 'poam_update', 'POA&M Assigned to You', 'You were assigned to POA&M "' + poam.weakness_name + '"', 'poam', poamId, {});
  }

  const updated = await env.DB.prepare('SELECT * FROM poams WHERE id = ?').bind(poamId).first();
  return jsonResponse({ poam: updated });
}

async function handleDeletePoam(env, org, user, poamId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT * FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  await env.DB.prepare('DELETE FROM poams WHERE id = ?').bind(poamId).run();
  await auditLog(env, org.id, user.id, 'delete', 'poam', poamId, { poam_id: poam.poam_id, weakness_name: poam.weakness_name });
  return jsonResponse({ message: 'POA&M deleted' });
}

// POA&M Milestones
async function handleListMilestones(env, org, poamId) {
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const { results } = await env.DB.prepare('SELECT * FROM poam_milestones WHERE poam_id = ? ORDER BY target_date ASC, created_at ASC').bind(poamId).all();
  return jsonResponse({ milestones: results });
}

async function handleCreateMilestone(request, env, org, user, poamId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT * FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const body = await request.json();
  if (!body.title) return jsonResponse({ error: 'title required' }, 400);
  const id = generateId();
  // Get next sequence number
  const maxSeq = await env.DB.prepare('SELECT MAX(sequence_number) as max_seq FROM poam_milestones WHERE poam_id = ?').bind(poamId).first();
  const seqNum = (maxSeq?.max_seq || 0) + 1;
  await env.DB.prepare(
    'INSERT INTO poam_milestones (id, poam_id, title, description, target_date, sequence_number, responsible_party, evidence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, poamId, body.title, body.description || null, body.target_date || null, body.sequence_number || seqNum, body.responsible_party || null, body.evidence_id || null).run();
  await auditLog(env, org.id, user.id, 'create', 'poam_milestone', id, { poam_id: poamId, title: body.title });
  const milestone = await env.DB.prepare('SELECT * FROM poam_milestones WHERE id = ?').bind(id).first();
  return jsonResponse({ milestone }, 201);
}

async function handleUpdateMilestone(request, env, org, user, poamId, milestoneId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const body = await request.json();
  const fields = ['title', 'description', 'target_date', 'status', 'completion_date', 'sequence_number', 'progress_percentage', 'responsible_party', 'evidence_id', 'blocked_reason'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); values.push(body[f]); }
  }
  if (body.status === 'completed' && !body.completion_date) { updates.push('completion_date = ?'); values.push(new Date().toISOString()); updates.push('progress_percentage = ?'); values.push(100); }
  if (body.status === 'blocked' && body.blocked_reason === undefined) return jsonResponse({ error: 'blocked_reason required for blocked status' }, 400);
  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push('updated_at = ?'); values.push(new Date().toISOString()); values.push(milestoneId); values.push(poamId);
  await env.DB.prepare(`UPDATE poam_milestones SET ${updates.join(', ')} WHERE id = ? AND poam_id = ?`).bind(...values).run();
  const updated = await env.DB.prepare('SELECT * FROM poam_milestones WHERE id = ?').bind(milestoneId).first();
  return jsonResponse({ milestone: updated });
}

// POA&M Comments
async function handleListComments(env, org, poamId) {
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const { results } = await env.DB.prepare('SELECT c.*, u.name as author_name FROM poam_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.poam_id = ? ORDER BY c.created_at ASC').bind(poamId).all();
  return jsonResponse({ comments: results });
}

async function handleCreateComment(request, env, org, user, poamId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT * FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const body = await request.json();
  if (!body.content || !body.content.trim()) return jsonResponse({ error: 'content required' }, 400);
  const id = generateId();
  await env.DB.prepare('INSERT INTO poam_comments (id, poam_id, user_id, content) VALUES (?, ?, ?, ?)').bind(id, poamId, user.id, body.content.trim()).run();
  await auditLog(env, org.id, user.id, 'create', 'poam_comment', id, { poam_id: poamId });
  if (poam.assigned_to && poam.assigned_to !== user.id) {
    await createNotification(env, org.id, poam.assigned_to, 'poam_update', 'New Comment on POA&M', user.name + ' commented on POA&M "' + poam.weakness_name + '"', 'poam', poamId, {});
  }
  await notifyOrgRole(env, org.id, user.id, 'manager', 'poam_update', 'New Comment on POA&M', user.name + ' commented on POA&M "' + poam.weakness_name + '"', 'poam', poamId, {});
  const comment = await env.DB.prepare('SELECT c.*, u.name as author_name FROM poam_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.id = ?').bind(id).first();
  return jsonResponse({ comment }, 201);
}

// ============================================================================
// POA&M DEVIATION HISTORY (CMMC/FedRAMP AO Audit Trail)
// ============================================================================

async function handleListDeviationHistory(env, org, poamId) {
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const { results } = await env.DB.prepare(`
    SELECT h.*, u.name as performed_by_name
    FROM poam_deviation_history h
    LEFT JOIN users u ON u.id = h.performed_by
    WHERE h.poam_id = ?
    ORDER BY h.performed_at DESC
  `).bind(poamId).all();
  return jsonResponse({ history: results });
}

// ============================================================================
// POA&M JUNCTION TABLES (FedRAMP Compliance)
// ============================================================================

// POA&M Affected Assets
async function handleListPoamAssets(env, org, poamId) {
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const { results } = await env.DB.prepare(`
    SELECT paa.*, a.hostname, a.ip_address, a.fqdn, a.os_type, a.asset_type,
           a.system_id, s.name as system_name, u.name as linked_by_name
    FROM poam_affected_assets paa
    JOIN assets a ON paa.asset_id = a.id
    LEFT JOIN systems s ON a.system_id = s.id
    LEFT JOIN users u ON paa.linked_by = u.id
    WHERE paa.poam_id = ?
    ORDER BY paa.linked_at DESC
  `).bind(poamId).all();
  return jsonResponse({ assets: results });
}

async function handleLinkPoamAsset(request, env, org, user, poamId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const body = await request.json();
  const { asset_id, link_reason, notes, responsibility_model, impact_description } = body;
  if (!asset_id) return jsonResponse({ error: 'asset_id required' }, 400);
  const asset = await env.DB.prepare('SELECT id FROM assets WHERE id = ? AND org_id = ?').bind(asset_id, org.id).first();
  if (!asset) return jsonResponse({ error: 'Asset not found' }, 404);
  const id = generateId();
  try {
    await env.DB.prepare(
      'INSERT INTO poam_affected_assets (id, poam_id, asset_id, link_reason, notes, responsibility_model, impact_description, linked_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, poamId, asset_id, link_reason || 'affected', notes || null, responsibility_model || 'csp', impact_description || null, user.id).run();
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return jsonResponse({ error: 'Asset already linked to this POA&M' }, 409);
    throw e;
  }
  await auditLog(env, org.id, user.id, 'link', 'poam_asset', id, { poam_id: poamId, asset_id, link_reason, responsibility_model });
  return jsonResponse({ message: 'Asset linked to POA&M', id }, 201);
}

async function handleUnlinkPoamAsset(env, org, user, poamId, linkId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const link = await env.DB.prepare('SELECT * FROM poam_affected_assets WHERE id = ? AND poam_id = ?').bind(linkId, poamId).first();
  if (!link) return jsonResponse({ error: 'Link not found' }, 404);
  await env.DB.prepare('DELETE FROM poam_affected_assets WHERE id = ?').bind(linkId).run();
  await auditLog(env, org.id, user.id, 'unlink', 'poam_asset', linkId, { poam_id: poamId, asset_id: link.asset_id });
  return jsonResponse({ message: 'Asset unlinked from POA&M' });
}

// POA&M Control Mappings
async function handleListPoamControls(env, org, poamId) {
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const { results } = await env.DB.prepare(`
    SELECT pcm.*, cf.name as framework_name, sc.title as control_title, u.name as mapped_by_name
    FROM poam_control_mappings pcm
    LEFT JOIN compliance_frameworks cf ON pcm.framework_id = cf.id
    LEFT JOIN security_controls sc ON pcm.control_id = sc.control_id AND pcm.framework_id = sc.framework_id
    LEFT JOIN users u ON pcm.mapped_by = u.id
    WHERE pcm.poam_id = ?
    ORDER BY pcm.mapping_type ASC, pcm.mapped_at DESC
  `).bind(poamId).all();
  return jsonResponse({ controls: results });
}

async function handleLinkPoamControl(request, env, org, user, poamId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const body = await request.json();
  const { framework_id, control_id, mapping_type, confidence, notes } = body;
  if (!framework_id || !control_id) return jsonResponse({ error: 'framework_id and control_id required' }, 400);
  const framework = await env.DB.prepare('SELECT id FROM compliance_frameworks WHERE id = ?').bind(framework_id).first();
  if (!framework) return jsonResponse({ error: 'Framework not found' }, 404);
  const id = generateId();
  try {
    await env.DB.prepare('INSERT INTO poam_control_mappings (id, poam_id, framework_id, control_id, mapping_type, confidence, notes, mapped_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, poamId, framework_id, control_id, mapping_type || 'primary', confidence || 'high', notes || null, user.id).run();
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return jsonResponse({ error: 'Control already mapped to this POA&M' }, 409);
    throw e;
  }
  await auditLog(env, org.id, user.id, 'link', 'poam_control', id, { poam_id: poamId, framework_id, control_id, mapping_type });
  return jsonResponse({ message: 'Control mapped to POA&M', id }, 201);
}

async function handleUnlinkPoamControl(env, org, user, poamId, linkId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const link = await env.DB.prepare('SELECT * FROM poam_control_mappings WHERE id = ? AND poam_id = ?').bind(linkId, poamId).first();
  if (!link) return jsonResponse({ error: 'Mapping not found' }, 404);
  await env.DB.prepare('DELETE FROM poam_control_mappings WHERE id = ?').bind(linkId).run();
  await auditLog(env, org.id, user.id, 'unlink', 'poam_control', linkId, { poam_id: poamId, framework_id: link.framework_id, control_id: link.control_id });
  return jsonResponse({ message: 'Control unmapped from POA&M' });
}

// POA&M Evidence
async function handleListPoamEvidence(env, org, poamId) {
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const { results } = await env.DB.prepare(`
    SELECT pe.*, e.title as evidence_title, e.file_name, e.file_type, e.file_size, e.collection_date,
           u.name as linked_by_name, v.name as verified_by_name
    FROM poam_evidence pe
    JOIN evidence e ON pe.evidence_id = e.id
    LEFT JOIN users u ON pe.linked_by = u.id
    LEFT JOIN users v ON pe.verified_by = v.id
    WHERE pe.poam_id = ?
    ORDER BY pe.purpose ASC, pe.linked_at DESC
  `).bind(poamId).all();
  return jsonResponse({ evidence: results });
}

async function handleLinkPoamEvidence(request, env, org, user, poamId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const body = await request.json();
  const { evidence_id, purpose, description } = body;
  if (!evidence_id || !purpose) return jsonResponse({ error: 'evidence_id and purpose required' }, 400);
  const validPurposes = ['identification', 'remediation', 'closure', 'verification', 'deviation'];
  if (!validPurposes.includes(purpose)) return jsonResponse({ error: 'Invalid purpose. Must be: ' + validPurposes.join(', ') }, 400);
  const evidence = await env.DB.prepare('SELECT id FROM evidence WHERE id = ? AND org_id = ?').bind(evidence_id, org.id).first();
  if (!evidence) return jsonResponse({ error: 'Evidence not found' }, 404);
  const id = generateId();
  try {
    await env.DB.prepare('INSERT INTO poam_evidence (id, poam_id, evidence_id, purpose, description, linked_by) VALUES (?, ?, ?, ?, ?, ?)').bind(id, poamId, evidence_id, purpose, description || null, user.id).run();
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return jsonResponse({ error: 'Evidence already linked for this purpose' }, 409);
    throw e;
  }
  await auditLog(env, org.id, user.id, 'link', 'poam_evidence', id, { poam_id: poamId, evidence_id, purpose });
  return jsonResponse({ message: 'Evidence linked to POA&M', id }, 201);
}

async function handleUnlinkPoamEvidence(env, org, user, poamId, linkId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const link = await env.DB.prepare('SELECT * FROM poam_evidence WHERE id = ? AND poam_id = ?').bind(linkId, poamId).first();
  if (!link) return jsonResponse({ error: 'Link not found' }, 404);
  await env.DB.prepare('DELETE FROM poam_evidence WHERE id = ?').bind(linkId).run();
  await auditLog(env, org.id, user.id, 'unlink', 'poam_evidence', linkId, { poam_id: poamId, evidence_id: link.evidence_id, purpose: link.purpose });
  return jsonResponse({ message: 'Evidence unlinked from POA&M' });
}

// Control Comments
async function handleListControlComments(env, org, url, controlId) {
  const systemId = url.searchParams.get('system_id');
  if (!systemId) return jsonResponse({ error: 'system_id required' }, 400);
  const { results } = await env.DB.prepare(
    'SELECT c.*, u.name as author_name FROM control_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.control_id = ? AND c.system_id = ? AND c.org_id = ? ORDER BY c.created_at ASC'
  ).bind(controlId, systemId, org.id).all();
  return jsonResponse({ comments: results });
}

async function handleCreateControlComment(request, env, org, user, controlId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  if (!body.content || !body.content.trim()) return jsonResponse({ error: 'content required' }, 400);
  if (!body.system_id) return jsonResponse({ error: 'system_id required' }, 400);
  const id = generateId();
  const implId = body.implementation_id || '';
  await env.DB.prepare(
    'INSERT INTO control_comments (id, implementation_id, control_id, system_id, org_id, user_id, content) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, implId, controlId, body.system_id, org.id, user.id, body.content.trim()).run();
  await auditLog(env, org.id, user.id, 'create', 'control_comment', id, { control_id: controlId });
  const comment = await env.DB.prepare(
    'SELECT c.*, u.name as author_name FROM control_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.id = ?'
  ).bind(id).first();
  return jsonResponse({ comment }, 201);
}

// Org Members (lightweight for assignment dropdowns)
async function handleListOrgMembers(env, org) {
  const { results } = await env.DB.prepare('SELECT id, name, email FROM users WHERE org_id = ? ORDER BY name').bind(org.id).all();
  return jsonResponse({ members: results });
}

// ============================================================================
// EVIDENCE VAULT
// ============================================================================

async function handleListEvidence(env, org, url) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search');

  let where = ' WHERE e.org_id = ?';
  const params = [org.id];
  if (search) { where += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.file_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM evidence e' + where).bind(...params).first();
  const total = countResult?.total || 0;

  const { results } = await env.DB.prepare(
    'SELECT e.*, u.name as uploaded_by_name FROM evidence e LEFT JOIN users u ON u.id = e.uploaded_by' + where + ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?'
  ).bind(...params, limit, offset).all();
  return jsonResponse({ evidence: results, total, page, limit });
}

async function handleUploadEvidence(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const formData = await request.formData();
  const file = formData.get('file');
  const title = formData.get('title') || file.name;
  const description = formData.get('description') || '';
  const collectionDate = formData.get('collection_date') || null;
  const expiryDate = formData.get('expiry_date') || null;

  if (!file) return jsonResponse({ error: 'No file provided' }, 400);

  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const sha256 = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const id = generateId();
  const r2Key = `${org.id}/${id}/${file.name}`;

  await env.EVIDENCE_VAULT.put(r2Key, arrayBuffer, {
    customMetadata: { orgId: org.id, evidenceId: id, sha256, uploadedBy: user.id },
  });

  await env.DB.prepare(
    `INSERT INTO evidence (id, org_id, title, description, file_name, file_size, file_type, r2_key, sha256_hash, uploaded_by, collection_date, expiry_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, title, description, file.name, arrayBuffer.byteLength, file.type, r2Key, sha256, user.id, collectionDate, expiryDate).run();

  await auditLog(env, org.id, user.id, 'upload', 'evidence', id, { file_name: file.name, size: arrayBuffer.byteLength });
  await notifyOrgRole(env, org.id, user.id, 'manager', 'evidence_upload', 'New Evidence Uploaded', 'Evidence file "' + file.name + '" was uploaded', 'evidence', id, {});

  const evidence = await env.DB.prepare('SELECT * FROM evidence WHERE id = ?').bind(id).first();
  return jsonResponse({ evidence }, 201);
}

async function handleDownloadEvidence(env, org, evidenceId) {
  const evidence = await env.DB.prepare('SELECT * FROM evidence WHERE id = ? AND org_id = ?').bind(evidenceId, org.id).first();
  if (!evidence) return jsonResponse({ error: 'Evidence not found' }, 404);

  const object = await env.EVIDENCE_VAULT.get(evidence.r2_key);
  if (!object) return jsonResponse({ error: 'File not found in storage' }, 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': evidence.file_type,
      'Content-Disposition': `attachment; filename="${evidence.file_name}"`,
      'X-SHA256': evidence.sha256_hash,
    },
  });
}

async function handleLinkEvidence(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { evidence_id, implementation_id } = await request.json();
  if (!evidence_id || !implementation_id) return jsonResponse({ error: 'evidence_id and implementation_id required' }, 400);

  await env.DB.prepare(
    'INSERT OR IGNORE INTO evidence_control_links (id, evidence_id, implementation_id, linked_by) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), evidence_id, implementation_id, user.id).run();

  await auditLog(env, org.id, user.id, 'link', 'evidence', evidence_id, { implementation_id });
  return jsonResponse({ message: 'Evidence linked' }, 201);
}

// ============================================================================
// SSP / OSCAL GENERATION
// ============================================================================

const SSP_SECTION_KEYS = ['system_info','authorization_boundary','data_flow','network_architecture','system_interconnections','personnel','control_implementations','contingency_plan','incident_response','continuous_monitoring'];

const SSP_SECTION_LABELS = {
  system_info: 'System Information', authorization_boundary: 'Authorization Boundary',
  data_flow: 'Data Flow', network_architecture: 'Network Architecture',
  system_interconnections: 'System Interconnections', personnel: 'Personnel & Roles',
  control_implementations: 'Control Implementations', contingency_plan: 'Contingency Plan Summary',
  incident_response: 'Incident Response Summary', continuous_monitoring: 'Continuous Monitoring Strategy',
};

const SSP_SECTION_PROMPTS = {
  authorization_boundary: {
    system: 'You are a senior cybersecurity architect writing formal System Security Plan documentation for a U.S. federal information system. Write in professional third-person prose.',
    user: 'Write the Authorization Boundary section for "{{system_name}}" ({{impact_level}} impact, {{framework_name}} framework). Describe what components, services, and data are within the authorization boundary, what is explicitly excluded, and any shared services. Organization: {{org_name}}. Write 200-400 words.',
  },
  data_flow: {
    system: 'You are a senior cybersecurity architect writing formal System Security Plan documentation. Write in professional third-person prose.',
    user: 'Write the Data Flow section for "{{system_name}}" ({{impact_level}} impact). Describe how data enters, is processed within, and exits the system. Include data at rest and in transit, encryption requirements, and data classification handling. Organization: {{org_name}}. Write 200-400 words.',
  },
  network_architecture: {
    system: 'You are a senior cybersecurity architect writing formal System Security Plan documentation. Write in professional third-person prose.',
    user: 'Write the Network Architecture section for "{{system_name}}" ({{impact_level}} impact). Describe network zones, segmentation, firewalls, DMZs, and connectivity. Organization: {{org_name}}. Write 200-400 words.',
  },
  system_interconnections: {
    system: 'You are a senior cybersecurity architect writing formal System Security Plan documentation. Write in professional third-person prose.',
    user: 'Write the System Interconnections section for "{{system_name}}" ({{impact_level}} impact). Describe external connections, ISAs, MOUs, APIs, and third-party integrations. Organization: {{org_name}}. Write 150-300 words.',
  },
  personnel: {
    system: 'You are a senior cybersecurity architect writing formal System Security Plan documentation. Write in professional third-person prose.',
    user: 'Write the Personnel & Roles section for "{{system_name}}" ({{impact_level}} impact). Describe the System Owner, ISSO, Authorizing Official, system administrators, and other key security roles with their responsibilities. Organization: {{org_name}}. Write 200-300 words.',
  },
  contingency_plan: {
    system: 'You are a senior cybersecurity architect writing formal System Security Plan documentation. Write in professional third-person prose.',
    user: 'Write the Contingency Plan Summary section for "{{system_name}}" ({{impact_level}} impact). Summarize the BC/DR strategy including RTO/RPO, backup procedures, alternate processing sites, and recovery priorities. Organization: {{org_name}}. Write 200-400 words.',
  },
  incident_response: {
    system: 'You are a senior cybersecurity architect writing formal System Security Plan documentation. Write in professional third-person prose.',
    user: 'Write the Incident Response Summary section for "{{system_name}}" ({{impact_level}} impact). Describe the IR process including detection, analysis, containment, eradication, recovery, and post-incident activities. Include reporting requirements and escalation procedures. Organization: {{org_name}}. Write 200-400 words.',
  },
  continuous_monitoring: {
    system: 'You are a senior cybersecurity architect writing formal System Security Plan documentation. Write in professional third-person prose.',
    user: 'Write the Continuous Monitoring Strategy section for "{{system_name}}" ({{impact_level}} impact, {{framework_name}} framework). Describe ongoing assessment activities, automated scanning, POA&M management, and how the security posture is continuously evaluated. Organization: {{org_name}}. Write 200-400 words.',
  },
};

function buildEmptyAuthoring(userId) {
  const sections = {};
  for (const key of SSP_SECTION_KEYS) {
    sections[key] = { content: '', status: 'empty', ai_generated: false, last_edited_by: userId, last_edited_at: new Date().toISOString() };
  }
  return { sections };
}

async function handleGenerateSSP(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { system_id, framework_id } = await request.json();
  if (!system_id || !framework_id) return jsonResponse({ error: 'system_id and framework_id required' }, 400);

  const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(system_id, org.id).first();
  if (!system) return jsonResponse({ error: 'System not found' }, 404);

  const framework = await env.DB.prepare('SELECT * FROM compliance_frameworks WHERE id = ?').bind(framework_id).first();
  if (!framework) return jsonResponse({ error: 'Framework not found' }, 404);

  const { results: implementations } = await env.DB.prepare(
    `SELECT ci.*, sc.title as control_title, sc.family, sc.description as control_description
     FROM control_implementations ci
     LEFT JOIN security_controls sc ON sc.framework_id = ci.framework_id AND sc.control_id = ci.control_id
     WHERE ci.system_id = ? AND ci.framework_id = ?
     ORDER BY sc.sort_order`
  ).bind(system_id, framework_id).all();

  // Generate OSCAL SSP JSON
  const oscalSSP = {
    'system-security-plan': {
      uuid: crypto.randomUUID(),
      metadata: {
        title: `System Security Plan - ${system.name}`,
        'last-modified': new Date().toISOString(),
        version: '1.0',
        'oscal-version': '1.1.2',
        roles: [
          { id: 'system-owner', title: 'System Owner' },
          { id: 'authorizing-official', title: 'Authorizing Official' },
          { id: 'information-system-security-officer', title: 'ISSO' },
        ],
      },
      'import-profile': {
        href: `#${framework_id}`,
      },
      'system-characteristics': {
        'system-name': system.name,
        'system-name-short': system.acronym || '',
        description: system.description || '',
        'security-sensitivity-level': system.impact_level,
        'system-information': {
          'information-types': [{
            title: 'System Information',
            categorizations: [{
              system: 'https://doi.org/10.6028/NIST.SP.800-60v2r1',
              'information-type-ids': ['C.2.8.12'],
            }],
            'confidentiality-impact': { base: system.impact_level },
            'integrity-impact': { base: system.impact_level },
            'availability-impact': { base: system.impact_level },
          }],
        },
        'security-impact-level': {
          'security-objective-confidentiality': system.impact_level,
          'security-objective-integrity': system.impact_level,
          'security-objective-availability': system.impact_level,
        },
        status: { state: system.status === 'authorized' ? 'operational' : 'under-development' },
        'authorization-boundary': { description: system.boundary_description || 'To be defined' },
      },
      'control-implementation': {
        description: `Control implementation details for ${system.name}`,
        'implemented-requirements': implementations.map((impl) => ({
          uuid: crypto.randomUUID(),
          'control-id': impl.control_id,
          'by-components': [{
            'component-uuid': crypto.randomUUID(),
            description: impl.implementation_description || 'Implementation pending',
            'implementation-status': { state: impl.status.replace('_', '-') },
          }],
        })),
      },
    },
  };

  // Build authoring sections
  const authoring = buildEmptyAuthoring(user.id);
  authoring.sections.system_info = {
    content: `System Name: ${system.name}\nAcronym: ${system.acronym || 'N/A'}\nDescription: ${system.description || 'To be defined'}\nImpact Level: ${system.impact_level}\nDeployment Model: ${system.deployment_model || 'On-Premises'}\nStatus: ${system.status}`,
    status: 'draft', ai_generated: false, last_edited_by: user.id, last_edited_at: new Date().toISOString(),
  };
  authoring.sections.control_implementations = {
    content: `${implementations.length} controls mapped to ${system.name} under ${framework.name}. See OSCAL control-implementation section for detailed per-control narratives.`,
    status: 'draft', ai_generated: false, last_edited_by: user.id, last_edited_at: new Date().toISOString(),
  };
  if (system.boundary_description) {
    authoring.sections.authorization_boundary = {
      content: system.boundary_description, status: 'draft', ai_generated: false, last_edited_by: user.id, last_edited_at: new Date().toISOString(),
    };
  }
  oscalSSP._authoring = authoring;

  const initMetadata = JSON.stringify({ versions: [{ version: '1.0', created_at: new Date().toISOString(), created_by: user.id, summary: 'Initial generation' }], workflow: {} });

  // Save SSP document
  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO ssp_documents (id, org_id, system_id, framework_id, title, oscal_json, generated_by, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, system_id, framework_id, `SSP - ${system.name} - ${framework.name}`, JSON.stringify(oscalSSP), user.id, initMetadata).run();

  await auditLog(env, org.id, user.id, 'generate', 'ssp', id, { system_id, framework_id });
  return jsonResponse({ ssp: { id, oscal: oscalSSP } }, 201);
}

async function handleListSSPs(env, org) {
  const { results } = await env.DB.prepare(
    `SELECT sd.id, sd.system_id, sd.framework_id, sd.title, sd.version, sd.status, sd.created_at, sd.updated_at,
            s.name as system_name, cf.name as framework_name
     FROM ssp_documents sd
     LEFT JOIN systems s ON s.id = sd.system_id
     LEFT JOIN compliance_frameworks cf ON cf.id = sd.framework_id
     WHERE sd.org_id = ?
     ORDER BY sd.created_at DESC`
  ).bind(org.id).all();
  return jsonResponse({ documents: results });
}

async function handleGetSSP(env, org, sspId) {
  const doc = await env.DB.prepare(
    `SELECT sd.*, s.name as system_name, s.acronym as system_acronym, s.impact_level, s.description as system_description,
            cf.name as framework_name, u1.name as generated_by_name, u2.name as approved_by_name
     FROM ssp_documents sd
     LEFT JOIN systems s ON s.id = sd.system_id
     LEFT JOIN compliance_frameworks cf ON cf.id = sd.framework_id
     LEFT JOIN users u1 ON u1.id = sd.generated_by
     LEFT JOIN users u2 ON u2.id = sd.approved_by
     WHERE sd.id = ? AND sd.org_id = ?`
  ).bind(sspId, org.id).first();
  if (!doc) return jsonResponse({ error: 'SSP not found' }, 404);
  try { doc.oscal_json = JSON.parse(doc.oscal_json || '{}'); } catch { doc.oscal_json = {}; }
  try { doc.metadata = JSON.parse(doc.metadata || '{}'); } catch { doc.metadata = {}; }
  // Ensure _authoring exists for older docs
  if (!doc.oscal_json._authoring) doc.oscal_json._authoring = buildEmptyAuthoring(doc.generated_by);
  return jsonResponse({ document: doc });
}

async function handleUpdateSSPSection(request, env, org, user, sspId, sectionKey) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  if (!SSP_SECTION_KEYS.includes(sectionKey)) return jsonResponse({ error: 'Invalid section key' }, 400);

  const doc = await env.DB.prepare('SELECT id, oscal_json FROM ssp_documents WHERE id = ? AND org_id = ?').bind(sspId, org.id).first();
  if (!doc) return jsonResponse({ error: 'SSP not found' }, 404);

  const { content } = await request.json();
  if (content === undefined) return jsonResponse({ error: 'content required' }, 400);

  let oscal; try { oscal = JSON.parse(doc.oscal_json || '{}'); } catch { oscal = {}; }
  if (!oscal._authoring) oscal._authoring = buildEmptyAuthoring(user.id);
  oscal._authoring.sections[sectionKey] = {
    content, status: content.trim() ? 'draft' : 'empty', ai_generated: false,
    last_edited_by: user.id, last_edited_at: new Date().toISOString(),
  };

  await env.DB.prepare('UPDATE ssp_documents SET oscal_json = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(JSON.stringify(oscal), sspId).run();
  await auditLog(env, org.id, user.id, 'update', 'ssp_section', sspId, { section: sectionKey });
  return jsonResponse({ section: oscal._authoring.sections[sectionKey] });
}

async function handleAIPopulateSSP(request, env, org, user, sspId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const doc = await env.DB.prepare(
    `SELECT sd.*, s.name as system_name, s.acronym as system_acronym, s.impact_level, s.description as system_description,
            cf.name as framework_name
     FROM ssp_documents sd
     LEFT JOIN systems s ON s.id = sd.system_id
     LEFT JOIN compliance_frameworks cf ON cf.id = sd.framework_id
     WHERE sd.id = ? AND sd.org_id = ?`
  ).bind(sspId, org.id).first();
  if (!doc) return jsonResponse({ error: 'SSP not found' }, 404);

  const body = await request.json().catch(() => ({}));
  let oscal; try { oscal = JSON.parse(doc.oscal_json || '{}'); } catch { oscal = {}; }
  if (!oscal._authoring) oscal._authoring = buildEmptyAuthoring(user.id);

  const orgRow = await env.DB.prepare('SELECT name FROM organizations WHERE id = ?').bind(org.id).first();
  const orgName = orgRow?.name || 'Organization';

  const vars = {
    system_name: doc.system_name || 'System', impact_level: doc.impact_level || 'moderate',
    framework_name: doc.framework_name || 'Framework', org_name: orgName,
  };

  // Determine which sections to populate
  let targetSections = body.sections;
  if (!targetSections || !Array.isArray(targetSections) || targetSections.length === 0) {
    targetSections = SSP_SECTION_KEYS.filter(k => SSP_SECTION_PROMPTS[k] && (!oscal._authoring.sections[k]?.content?.trim() || oscal._authoring.sections[k]?.status === 'empty'));
  }

  const results = {};
  for (const key of targetSections) {
    const prompts = SSP_SECTION_PROMPTS[key];
    if (!prompts) continue;
    try {
      const userPrompt = substituteVariables(prompts.user, vars);
      const content = await runAI(env, prompts.system, userPrompt);
      oscal._authoring.sections[key] = {
        content: content || '', status: content ? 'draft' : 'empty', ai_generated: true,
        last_edited_by: user.id, last_edited_at: new Date().toISOString(),
      };
      results[key] = 'success';
    } catch (e) {
      results[key] = 'error: ' + (e.message || 'AI generation failed');
    }
  }

  await env.DB.prepare('UPDATE ssp_documents SET oscal_json = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(JSON.stringify(oscal), sspId).run();
  await auditLog(env, org.id, user.id, 'ai_populate', 'ssp', sspId, { sections: Object.keys(results) });
  return jsonResponse({ results, sections: oscal._authoring.sections });
}

async function handleAIRefineSSP(request, env, org, user, sspId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const doc = await env.DB.prepare(
    `SELECT sd.*, s.name as system_name, s.impact_level, cf.name as framework_name
     FROM ssp_documents sd LEFT JOIN systems s ON s.id = sd.system_id
     LEFT JOIN compliance_frameworks cf ON cf.id = sd.framework_id
     WHERE sd.id = ? AND sd.org_id = ?`
  ).bind(sspId, org.id).first();
  if (!doc) return jsonResponse({ error: 'SSP not found' }, 404);

  const { section_key, instructions } = await request.json();
  if (!section_key || !SSP_SECTION_KEYS.includes(section_key)) return jsonResponse({ error: 'Invalid section_key' }, 400);

  let oscal; try { oscal = JSON.parse(doc.oscal_json || '{}'); } catch { oscal = {}; }
  if (!oscal._authoring) oscal._authoring = buildEmptyAuthoring(user.id);
  const currentContent = oscal._authoring.sections[section_key]?.content || '';

  const sysPrompt = 'You are a senior cybersecurity compliance consultant. Refine and improve the following System Security Plan section. Maintain a professional, formal tone appropriate for federal compliance documentation.';
  const userPrompt = `System: ${doc.system_name || 'System'} (${doc.impact_level || 'moderate'} impact, ${doc.framework_name || 'Framework'})\n\nSection: ${SSP_SECTION_LABELS[section_key]}\n\nCurrent content:\n${currentContent}\n\n${instructions ? 'Refinement instructions: ' + instructions + '\n\n' : ''}Please improve this section. Maintain accuracy, add detail where appropriate, and ensure compliance language is used. Write 200-400 words.`;

  const refined = await runAI(env, sysPrompt, userPrompt);
  oscal._authoring.sections[section_key] = {
    content: refined || currentContent, status: 'draft', ai_generated: true,
    last_edited_by: user.id, last_edited_at: new Date().toISOString(),
  };

  await env.DB.prepare('UPDATE ssp_documents SET oscal_json = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(JSON.stringify(oscal), sspId).run();
  await auditLog(env, org.id, user.id, 'ai_refine', 'ssp_section', sspId, { section: section_key });
  return jsonResponse({ section: oscal._authoring.sections[section_key] });
}

async function handleUpdateSSPStatus(request, env, org, user, sspId) {
  const doc = await env.DB.prepare('SELECT id, status, oscal_json FROM ssp_documents WHERE id = ? AND org_id = ?').bind(sspId, org.id).first();
  if (!doc) return jsonResponse({ error: 'SSP not found' }, 404);

  const { status: newStatus } = await request.json();
  const transitions = {
    draft: { in_review: 'analyst' },
    in_review: { approved: 'manager', draft: 'manager' },
    approved: { published: 'admin', draft: 'admin' },
    published: { archived: 'admin' },
  };

  const allowed = transitions[doc.status];
  if (!allowed || !allowed[newStatus]) return jsonResponse({ error: `Cannot transition from ${doc.status} to ${newStatus}` }, 400);
  if (!requireRole(user, allowed[newStatus])) return jsonResponse({ error: 'Insufficient role for this transition' }, 403);

  const updates = ['status = ?', 'updated_at = datetime(\'now\')'];
  const values = [newStatus];

  if (newStatus === 'approved') { updates.push('approved_by = ?', 'approved_at = datetime(\'now\')'); values.push(user.id); }
  if (newStatus === 'published') { updates.push('published_at = datetime(\'now\')'); }
  if (newStatus === 'draft' && (doc.status === 'in_review' || doc.status === 'approved')) { updates.push('approved_by = NULL', 'approved_at = NULL'); }

  values.push(sspId);
  await env.DB.prepare(`UPDATE ssp_documents SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  await auditLog(env, org.id, user.id, 'status_change', 'ssp', sspId, { from: doc.status, to: newStatus });
  notifyOrgRole(env, org.id, user.id, 'manager', 'ssp_status', 'SSP Status Changed', `SSP moved to ${newStatus}`, 'ssp', sspId).catch(() => {});
  return jsonResponse({ status: newStatus });
}

async function handleCreateSSPVersion(request, env, org, user, sspId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const doc = await env.DB.prepare('SELECT id, version, metadata FROM ssp_documents WHERE id = ? AND org_id = ?').bind(sspId, org.id).first();
  if (!doc) return jsonResponse({ error: 'SSP not found' }, 404);

  const { summary } = await request.json();
  let meta; try { meta = JSON.parse(doc.metadata || '{}'); } catch { meta = {}; }
  if (!meta.versions) meta.versions = [];

  // Increment version: 1.0 -> 1.1 -> 1.2 etc.
  const current = parseFloat(doc.version || '1.0');
  const newVersion = (current + 0.1).toFixed(1);

  meta.versions.push({ version: newVersion, created_at: new Date().toISOString(), created_by: user.id, summary: summary || `Version ${newVersion}` });

  await env.DB.prepare('UPDATE ssp_documents SET version = ?, metadata = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(newVersion, JSON.stringify(meta), sspId).run();
  await auditLog(env, org.id, user.id, 'version', 'ssp', sspId, { version: newVersion });
  return jsonResponse({ version: newVersion, versions: meta.versions });
}

// ============================================================================
// RISKS (RiskForge ERM)
// ============================================================================

async function handleListRisks(request, env, org) {
  const url = new URL(request.url);
  const systemId = url.searchParams.get('system_id');
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const riskLevel = url.searchParams.get('risk_level');
  const search = url.searchParams.get('search');
  const likelihood = url.searchParams.get('likelihood');
  const impact = url.searchParams.get('impact');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let where = ' WHERE r.org_id = ?';
  const params = [org.id];

  if (systemId) { where += ' AND r.system_id = ?'; params.push(systemId); }
  if (status) { where += ' AND r.status = ?'; params.push(status); }
  if (category) { where += ' AND r.category = ?'; params.push(category); }
  if (riskLevel) { where += ' AND r.risk_level = ?'; params.push(riskLevel); }
  if (likelihood) { where += ' AND r.likelihood = ?'; params.push(likelihood); }
  if (impact) { where += ' AND r.impact = ?'; params.push(impact); }
  if (search) { where += ' AND (r.title LIKE ? OR r.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM risks r' + where).bind(...params).first();
  const total = countResult?.total || 0;

  const sql = 'SELECT r.*, s.name as system_name FROM risks r LEFT JOIN systems s ON s.id = r.system_id' + where + ' ORDER BY r.risk_score DESC, r.created_at DESC LIMIT ? OFFSET ?';
  const { results } = await env.DB.prepare(sql).bind(...params, limit, offset).all();
  return jsonResponse({ risks: results, total, page, limit });
}

async function handleCreateRisk(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, title, description, category, likelihood, impact, treatment, treatment_plan, treatment_due_date, owner, related_controls } = body;

  const valErrors = validateBody(body, {
    title: { required: true, type: 'string', maxLength: 500 },
    risk_level: { enum: ['low', 'moderate', 'high', 'critical'] },
    likelihood: { type: 'number', min: 1, max: 5 },
    impact: { type: 'number', min: 1, max: 5 },
    category: { type: 'string', maxLength: 200 },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  const id = generateId();
  const riskId = `RISK-${Date.now().toString(36).toUpperCase()}`;
  const l = likelihood || 3, i = impact || 3;
  const score = l * i;
  const riskLevel = score >= 15 ? 'critical' : score >= 10 ? 'high' : score >= 5 ? 'moderate' : 'low';

  await env.DB.prepare(
    `INSERT INTO risks (id, org_id, system_id, risk_id, title, description, category, likelihood, impact, risk_level, treatment, treatment_plan, treatment_due_date, owner, related_controls)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, system_id || null, riskId, title, description || null, category || 'technical', l, i, riskLevel, treatment || 'mitigate', treatment_plan || null, treatment_due_date || null, owner || null, related_controls ? JSON.stringify(related_controls) : '[]').run();

  await auditLog(env, org.id, user.id, 'create', 'risk', id, { title, risk_level: riskLevel });
  if (['high', 'critical'].includes(riskLevel)) await notifyOrgRole(env, org.id, user.id, 'manager', 'risk_alert', 'High Risk Created', 'Risk "' + title + '" rated ' + riskLevel, 'risk', id, { risk_level: riskLevel });
  const risk = await env.DB.prepare('SELECT r.*, s.name as system_name FROM risks r LEFT JOIN systems s ON s.id = r.system_id WHERE r.id = ?').bind(id).first();
  return jsonResponse({ risk }, 201);
}

async function handleUpdateRisk(request, env, org, user, riskId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const risk = await env.DB.prepare('SELECT * FROM risks WHERE id = ? AND org_id = ?').bind(riskId, org.id).first();
  if (!risk) return jsonResponse({ error: 'Risk not found' }, 404);

  // Auto-recalculate risk_level when likelihood or impact change
  if ((body.likelihood !== undefined || body.impact !== undefined) && body.risk_level === undefined) {
    const l = body.likelihood !== undefined ? body.likelihood : risk.likelihood;
    const i = body.impact !== undefined ? body.impact : risk.impact;
    const score = l * i;
    body.risk_level = score >= 15 ? 'critical' : score >= 10 ? 'high' : score >= 5 ? 'moderate' : 'low';
  }

  // Serialize related_controls if it's an array
  if (Array.isArray(body.related_controls)) {
    body.related_controls = JSON.stringify(body.related_controls);
  }

  const fields = ['title', 'description', 'category', 'likelihood', 'impact', 'risk_level', 'treatment', 'treatment_plan', 'treatment_due_date', 'owner', 'status', 'related_controls'];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (body[field] !== undefined) { updates.push(`${field} = ?`); values.push(body[field]); }
  }

  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(riskId);

  await env.DB.prepare(`UPDATE risks SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  const riskChanges = computeDiff(risk, body, ['title', 'description', 'category', 'likelihood', 'impact', 'risk_level', 'treatment', 'treatment_plan', 'treatment_due_date', 'owner', 'status', 'related_controls']);
  await auditLog(env, org.id, user.id, 'update', 'risk', riskId, { ...body, _changes: riskChanges });
  if (body.risk_level && ['high', 'critical'].includes(body.risk_level)) await notifyOrgRole(env, org.id, user.id, 'manager', 'risk_alert', 'Risk Escalated', 'Risk escalated to ' + body.risk_level, 'risk', riskId, { risk_level: body.risk_level });

  const updated = await env.DB.prepare('SELECT r.*, s.name as system_name FROM risks r LEFT JOIN systems s ON s.id = r.system_id WHERE r.id = ?').bind(riskId).first();
  return jsonResponse({ risk: updated });
}

async function handleGetRisk(env, org, riskId) {
  const risk = await env.DB.prepare(
    'SELECT r.*, s.name as system_name FROM risks r LEFT JOIN systems s ON s.id = r.system_id WHERE r.id = ? AND r.org_id = ?'
  ).bind(riskId, org.id).first();
  if (!risk) return jsonResponse({ error: 'Risk not found' }, 404);
  return jsonResponse({ risk });
}

async function handleDeleteRisk(env, org, user, riskId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const risk = await env.DB.prepare('SELECT * FROM risks WHERE id = ? AND org_id = ?').bind(riskId, org.id).first();
  if (!risk) return jsonResponse({ error: 'Risk not found' }, 404);
  await env.DB.prepare('DELETE FROM risks WHERE id = ?').bind(riskId).run();
  await auditLog(env, org.id, user.id, 'delete', 'risk', riskId, { title: risk.title });
  return jsonResponse({ success: true });
}

async function handleRiskStats(env, org) {
  const [totals, byLevel, byTreatment, byCategory] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as total, AVG(risk_score) as avg_score, SUM(CASE WHEN status != 'closed' THEN 1 ELSE 0 END) as open_count, SUM(CASE WHEN treatment_plan IS NOT NULL AND treatment_plan != '' THEN 1 ELSE 0 END) as with_treatment FROM risks WHERE org_id = ?").bind(org.id).first(),
    env.DB.prepare("SELECT risk_level, COUNT(*) as count FROM risks WHERE org_id = ? AND status != 'closed' GROUP BY risk_level").bind(org.id).all(),
    env.DB.prepare("SELECT treatment, COUNT(*) as count FROM risks WHERE org_id = ? AND status != 'closed' GROUP BY treatment").bind(org.id).all(),
    env.DB.prepare("SELECT category, COUNT(*) as count FROM risks WHERE org_id = ? AND status != 'closed' GROUP BY category").bind(org.id).all(),
  ]);
  const by_level = {};
  for (const r of byLevel.results) by_level[r.risk_level] = r.count;
  const by_treatment = {};
  for (const r of byTreatment.results) by_treatment[r.treatment] = r.count;
  const by_category = {};
  for (const r of byCategory.results) by_category[r.category] = r.count;
  return jsonResponse({ stats: { total: totals.total, open_count: totals.open_count, avg_score: Math.round((totals.avg_score || 0) * 10) / 10, with_treatment: totals.with_treatment, by_level, by_treatment, by_category } });
}

// ============================================================================
// VENDORS (VendorGuard TPRM)
// ============================================================================

async function handleListVendors(env, org, url) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search');
  const criticality = url.searchParams.get('criticality');
  const status = url.searchParams.get('status');
  const tier = url.searchParams.get('tier');
  const classification = url.searchParams.get('data_classification');

  let where = ' WHERE org_id = ?';
  const params = [org.id];
  if (search) { where += ' AND (name LIKE ? OR category LIKE ? OR contact_name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
  if (criticality) { where += ' AND criticality = ?'; params.push(criticality); }
  if (status) { where += ' AND status = ?'; params.push(status); }
  if (tier) { where += ' AND risk_tier = ?'; params.push(tier); }
  if (classification) { where += ' AND data_classification = ?'; params.push(classification); }

  const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM vendors' + where).bind(...params).first();
  const total = countResult?.total || 0;

  const { results } = await env.DB.prepare(
    'SELECT * FROM vendors' + where + ' ORDER BY criticality DESC, name LIMIT ? OFFSET ?'
  ).bind(...params, limit, offset).all();
  return jsonResponse({ vendors: results, total, page, limit });
}

async function handleCreateVendor(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { name, description, category, criticality, contact_name, contact_email, contract_start, contract_end, data_classification, has_baa } = body;

  const valErrors = validateBody(body, {
    name: { required: true, type: 'string', maxLength: 500 },
    criticality: { enum: ['low', 'medium', 'high', 'critical'] },
    status: { enum: ['active', 'under_review', 'suspended', 'offboarded'] },
    contact_email: { type: 'string', maxLength: 500 },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO vendors (id, org_id, name, description, category, criticality, contact_name, contact_email, contract_start, contract_end, data_classification, has_baa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, name, description || null, category || null, criticality || 'medium', contact_name || null, contact_email || null, contract_start || null, contract_end || null, data_classification || null, has_baa || 0).run();

  await auditLog(env, org.id, user.id, 'create', 'vendor', id, { name });
  const vendor = await env.DB.prepare('SELECT * FROM vendors WHERE id = ?').bind(id).first();
  return jsonResponse({ vendor }, 201);
}

async function handleUpdateVendor(request, env, org, user, vendorId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const vendor = await env.DB.prepare('SELECT * FROM vendors WHERE id = ? AND org_id = ?').bind(vendorId, org.id).first();
  if (!vendor) return jsonResponse({ error: 'Vendor not found' }, 404);

  const fields = ['name', 'description', 'category', 'criticality', 'risk_tier', 'status', 'contact_name', 'contact_email', 'contract_start', 'contract_end', 'overall_risk_score', 'data_classification', 'has_baa'];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (body[field] !== undefined) { updates.push(`${field} = ?`); values.push(body[field]); }
  }
  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(vendorId);

  await env.DB.prepare(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  await auditLog(env, org.id, user.id, 'update', 'vendor', vendorId, body);

  const updated = await env.DB.prepare('SELECT * FROM vendors WHERE id = ?').bind(vendorId).first();
  return jsonResponse({ vendor: updated });
}

async function handleGetVendor(env, org, vendorId) {
  const vendor = await env.DB.prepare('SELECT * FROM vendors WHERE id = ? AND org_id = ?').bind(vendorId, org.id).first();
  if (!vendor) return jsonResponse({ error: 'Vendor not found' }, 404);
  return jsonResponse({ vendor });
}

async function handleDeleteVendor(env, org, user, vendorId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const vendor = await env.DB.prepare('SELECT * FROM vendors WHERE id = ? AND org_id = ?').bind(vendorId, org.id).first();
  if (!vendor) return jsonResponse({ error: 'Vendor not found' }, 404);
  await env.DB.prepare('DELETE FROM vendors WHERE id = ?').bind(vendorId).run();
  await auditLog(env, org.id, user.id, 'delete', 'vendor', vendorId, { name: vendor.name });
  return jsonResponse({ success: true });
}

async function handleVendorStats(env, org) {
  const now = new Date().toISOString().split('T')[0];
  const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const [totals, byCriticality, byStatus, byTier] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) as total, AVG(overall_risk_score) as avg_score,
       SUM(CASE WHEN next_assessment_date IS NOT NULL AND next_assessment_date < ? THEN 1 ELSE 0 END) as overdue_assessments,
       SUM(CASE WHEN contract_end IS NOT NULL AND contract_end <= ? AND contract_end >= ? THEN 1 ELSE 0 END) as expiring_contracts,
       SUM(CASE WHEN criticality IN ('critical', 'high') THEN 1 ELSE 0 END) as critical_high
       FROM vendors WHERE org_id = ?`
    ).bind(now, thirtyDaysOut, now, org.id).first(),
    env.DB.prepare("SELECT criticality, COUNT(*) as count FROM vendors WHERE org_id = ? GROUP BY criticality").bind(org.id).all(),
    env.DB.prepare("SELECT status, COUNT(*) as count FROM vendors WHERE org_id = ? GROUP BY status").bind(org.id).all(),
    env.DB.prepare("SELECT risk_tier, COUNT(*) as count FROM vendors WHERE org_id = ? GROUP BY risk_tier").bind(org.id).all(),
  ]);
  const by_criticality = {}; for (const r of byCriticality.results) by_criticality[r.criticality] = r.count;
  const by_status = {}; for (const r of byStatus.results) by_status[r.status] = r.count;
  const by_tier = {}; for (const r of byTier.results) by_tier[r.risk_tier] = r.count;
  return jsonResponse({ stats: { total: totals.total, avg_score: Math.round((totals.avg_score || 0) * 10) / 10, overdue_assessments: totals.overdue_assessments || 0, expiring_contracts: totals.expiring_contracts || 0, critical_high: totals.critical_high || 0, by_criticality, by_status, by_tier } });
}

async function handleAssessVendor(request, env, org, user, vendorId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const vendor = await env.DB.prepare('SELECT * FROM vendors WHERE id = ? AND org_id = ?').bind(vendorId, org.id).first();
  if (!vendor) return jsonResponse({ error: 'Vendor not found' }, 404);

  const body = await request.json();
  const { security_posture, data_handling, compliance_status, incident_history, financial_stability } = body;
  const scores = [security_posture, data_handling, compliance_status, incident_history, financial_stability];
  if (scores.some(s => s === undefined || s < 1 || s > 5)) return jsonResponse({ error: 'All 5 assessment scores (1-5) required' }, 400);

  const overall = scores.reduce((a, b) => a + b, 0);
  const risk_tier = overall >= 21 ? 1 : overall >= 16 ? 2 : overall >= 11 ? 3 : 4;

  const now = new Date();
  const last_assessment_date = now.toISOString();
  const intervalDays = risk_tier === 1 ? 90 : risk_tier === 2 ? 180 : risk_tier === 3 ? 365 : 730;
  const next_assessment_date = new Date(now.getTime() + intervalDays * 86400000).toISOString();

  let meta = {}; try { meta = JSON.parse(vendor.metadata || '{}'); } catch {}
  const assessments = meta.assessments || [];
  assessments.push({ date: last_assessment_date, assessor: user.name || user.email, scores: { security_posture, data_handling, compliance_status, incident_history, financial_stability }, overall_score: overall, risk_tier });
  meta.assessments = assessments;

  await env.DB.prepare(
    'UPDATE vendors SET overall_risk_score = ?, risk_tier = ?, last_assessment_date = ?, next_assessment_date = ?, metadata = ?, updated_at = ? WHERE id = ?'
  ).bind(overall, risk_tier, last_assessment_date, next_assessment_date, JSON.stringify(meta), last_assessment_date, vendorId).run();

  await auditLog(env, org.id, user.id, 'assess', 'vendor', vendorId, { overall_score: overall, risk_tier });
  await notifyOrgRole(env, org.id, user.id, 'manager', 'vendor_assessment', 'Vendor Assessment Completed', `${vendor.name} assessed: score ${overall}/25, tier ${risk_tier}`, 'vendor', vendorId, { overall_score: overall, risk_tier });

  const updated = await env.DB.prepare('SELECT * FROM vendors WHERE id = ?').bind(vendorId).first();
  return jsonResponse({ vendor: updated });
}

// ============================================================================
// MONITORING (ControlPulse CCM)
// ============================================================================

async function handleListMonitoringChecks(env, org) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM monitoring_checks WHERE org_id = ? ORDER BY last_run_at DESC'
  ).bind(org.id).all();
  return jsonResponse({ checks: results });
}

async function handleMonitoringDashboard(env, org) {
  try {
    const { results: checks } = await env.DB.prepare(
      'SELECT last_result, COUNT(*) as count FROM monitoring_checks WHERE org_id = ? AND is_active = 1 GROUP BY last_result'
    ).bind(org.id).all();

    const stats = { pass: 0, fail: 0, warning: 0, error: 0, not_run: 0, total: 0 };
    for (const row of checks) {
      stats[row.last_result || 'not_run'] = row.count;
      stats.total += row.count;
    }
    stats.health_score = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;

    return jsonResponse({ monitoring: stats });
  } catch (err) {
    console.error('[handleMonitoringDashboard]', err.message);
    return jsonResponse({ error: 'Failed to load monitoring data' }, 500);
  }
}

// ============================================================================
// USER / ONBOARDING
// ============================================================================

async function handleCompleteOnboarding(request, env, user) {
  await env.DB.prepare('UPDATE users SET onboarding_completed = 1, updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), user.id).run();
  return jsonResponse({ message: 'Onboarding completed' });
}

// ============================================================================
// SUBSCRIPTION
// ============================================================================

async function handleGetSubscription(env, org) {
  const { results: addons } = await env.DB.prepare(
    `SELECT am.*, oa.enabled, oa.enabled_at
     FROM organization_addons oa
     JOIN addon_modules am ON am.id = oa.addon_id
     WHERE oa.org_id = ?`
  ).bind(org.id).all();

  const { count: frameworkCount } = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM organization_frameworks WHERE org_id = ? AND enabled = 1'
  ).bind(org.id).first();

  const { count: systemCount } = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM systems WHERE org_id = ?'
  ).bind(org.id).first();

  const { count: userCount } = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM users WHERE org_id = ?'
  ).bind(org.id).first();

  return jsonResponse({
    subscription: {
      tier: org.subscription_tier,
      status: org.subscription_status,
      trial_ends_at: org.trial_ends_at,
      limits: { max_frameworks: org.max_frameworks, max_systems: org.max_systems, max_users: org.max_users },
      usage: { frameworks: frameworkCount, systems: systemCount, users: userCount },
      addons,
    },
  });
}

// ============================================================================
// DASHBOARD
// ============================================================================

async function handleDashboardStats(env, org) {
  try {
    const [systems, implementations, poams, evidence, risks, policyTotal, policyReviewDue, policyPendingAttestations] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM systems WHERE org_id = ?').bind(org.id).first(),
      env.DB.prepare(
        `SELECT status, COUNT(*) as count FROM control_implementations WHERE org_id = ? GROUP BY status`
      ).bind(org.id).all(),
      env.DB.prepare(
        `SELECT status, COUNT(*) as count FROM poams WHERE org_id = ? GROUP BY status`
      ).bind(org.id).all(),
      env.DB.prepare('SELECT COUNT(*) as count FROM evidence WHERE org_id = ?').bind(org.id).first(),
      env.DB.prepare(
        `SELECT risk_level, COUNT(*) as count FROM risks WHERE org_id = ? AND status != 'closed' GROUP BY risk_level`
      ).bind(org.id).all(),
      env.DB.prepare('SELECT COUNT(*) as count FROM policies WHERE org_id = ?').bind(org.id).first().catch(() => ({ count: 0 })),
      env.DB.prepare("SELECT COUNT(*) as count FROM policies WHERE org_id = ? AND review_date <= date('now', '+30 days') AND status = 'published'").bind(org.id).first().catch(() => ({ count: 0 })),
      env.DB.prepare("SELECT COUNT(*) as count FROM policy_attestations pa JOIN policies p ON p.id = pa.policy_id WHERE p.org_id = ? AND pa.status = 'pending'").bind(org.id).first().catch(() => ({ count: 0 })),
    ]);

    const implStats = { implemented: 0, partially_implemented: 0, planned: 0, not_implemented: 0, not_applicable: 0, alternative: 0, total: 0 };
    for (const row of implementations.results) { implStats[row.status] = row.count; implStats.total += row.count; }

    const poamStats = { open: 0, in_progress: 0, completed: 0, total: 0 };
    for (const row of poams.results) { poamStats[row.status] = (poamStats[row.status] || 0) + row.count; poamStats.total += row.count; }

    const riskStats = { low: 0, moderate: 0, high: 0, critical: 0 };
    for (const row of risks.results) { riskStats[row.risk_level] = row.count; }

    return jsonResponse({
      stats: {
        systems: systems.count,
        controls: implStats,
        compliance_percentage: implStats.total > 0 ? Math.round(((implStats.implemented + implStats.not_applicable) / implStats.total) * 100) : 0,
        poams: poamStats,
        evidence_count: evidence.count,
        risks: riskStats,
        policies: { total: policyTotal?.count || 0, due_for_review: policyReviewDue?.count || 0, pending_attestations: policyPendingAttestations?.count || 0 },
      },
    });
  } catch (err) {
    console.error('[handleDashboardStats]', err.message);
    return jsonResponse({ error: 'Failed to load dashboard stats' }, 500);
  }
}

// ============================================================================
// ASSET SUMMARY (for dashboard widget)
// ============================================================================

async function handleAssetSummary(env, org) {
  try {
    // Core asset queries (don't depend on vulnerability_findings table)
    let totalAssets = { count: 0 };
    let assetsBySystem = { results: [] };
    let assetsByEnvironment = { results: [] };
    let recentlyDiscovered = { results: [] };
    let topRiskAssets = { results: [] };

    // These may fail if assets table doesn't exist yet
    try {
      [totalAssets, assetsBySystem, assetsByEnvironment, recentlyDiscovered] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM assets WHERE org_id = ?').bind(org.id).first(),
        env.DB.prepare(`
          SELECT s.name as system_name, s.id as system_id, COUNT(a.id) as count
          FROM assets a
          LEFT JOIN systems s ON s.id = a.system_id
          WHERE a.org_id = ?
          GROUP BY a.system_id
          ORDER BY count DESC
          LIMIT 5
        `).bind(org.id).all(),
        env.DB.prepare(`
          SELECT environment, COUNT(*) as count
          FROM assets WHERE org_id = ?
          GROUP BY environment
          ORDER BY count DESC
        `).bind(org.id).all(),
        env.DB.prepare(`
          SELECT id, hostname, ip_address, discovery_source, first_seen_at, risk_score
          FROM assets
          WHERE org_id = ? AND first_seen_at >= datetime('now', '-7 days')
          ORDER BY first_seen_at DESC
          LIMIT 5
        `).bind(org.id).all()
      ]);
    } catch (assetErr) {
      console.log('[handleAssetSummary] Assets query failed (table may not exist):', assetErr.message);
    }

    // Top risk assets (without vulnerability subqueries to avoid dependency)
    try {
      topRiskAssets = await env.DB.prepare(`
        SELECT a.id, a.hostname, a.ip_address, a.risk_score, a.environment, s.name as system_name
        FROM assets a
        LEFT JOIN systems s ON s.id = a.system_id
        WHERE a.org_id = ? AND a.risk_score > 0
        ORDER BY a.risk_score DESC
        LIMIT 5
      `).bind(org.id).all();
    } catch (riskErr) {
      console.log('[handleAssetSummary] Top risk assets query failed:', riskErr.message);
    }

    // Vulnerability summary - may fail if table doesn't exist
    let vulnSummary = null;
    try {
      vulnSummary = await env.DB.prepare(`
        SELECT
          COUNT(DISTINCT CASE WHEN vf.severity = 'critical' THEN a.id END) as assets_with_critical,
          COUNT(DISTINCT CASE WHEN vf.severity = 'high' THEN a.id END) as assets_with_high,
          SUM(CASE WHEN vf.severity = 'critical' THEN 1 ELSE 0 END) as total_critical,
          SUM(CASE WHEN vf.severity = 'high' THEN 1 ELSE 0 END) as total_high,
          SUM(CASE WHEN vf.severity = 'medium' THEN 1 ELSE 0 END) as total_medium,
          SUM(CASE WHEN vf.severity = 'low' THEN 1 ELSE 0 END) as total_low
        FROM assets a
        LEFT JOIN vulnerability_findings vf ON vf.asset_id = a.id AND vf.status = 'open'
        WHERE a.org_id = ?
      `).bind(org.id).first();
    } catch (vulnErr) {
      console.log('[handleAssetSummary] Vulnerability summary query failed (table may not exist):', vulnErr.message);
    }

    return jsonResponse({
      summary: {
        total_assets: totalAssets?.count || 0,
        assets_with_critical: vulnSummary?.assets_with_critical || 0,
        assets_with_high: vulnSummary?.assets_with_high || 0,
        recently_discovered: recentlyDiscovered?.results?.length || 0,
        vulnerabilities: {
          critical: vulnSummary?.total_critical || 0,
          high: vulnSummary?.total_high || 0,
          medium: vulnSummary?.total_medium || 0,
          low: vulnSummary?.total_low || 0
        }
      },
      by_system: assetsBySystem?.results || [],
      by_environment: assetsByEnvironment?.results || [],
      recently_discovered: recentlyDiscovered?.results || [],
      top_risk_assets: topRiskAssets?.results || []
    });
  } catch (err) {
    console.error('[handleAssetSummary]', err.message);
    return jsonResponse({ error: 'Failed to load asset summary' }, 500);
  }
}

// ============================================================================
// MY WORK (role-based personal dashboard data)
// ============================================================================

async function handleMyWork(env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  try {
    const today = new Date().toISOString().split('T')[0];

    const [myPoams, myPoamCount, overduePoams, mySchedules, mySchedulesDue, myTasks, myTaskCount] = await Promise.all([
      env.DB.prepare(
        `SELECT id, weakness_name AS title, status, scheduled_completion FROM poams
         WHERE org_id = ? AND assigned_to = ? AND status NOT IN ('completed','accepted')
         ORDER BY scheduled_completion ASC LIMIT 5`
      ).bind(org.id, user.id).all(),
      env.DB.prepare(
        `SELECT COUNT(*) as count FROM poams
         WHERE org_id = ? AND assigned_to = ? AND status NOT IN ('completed','accepted')`
      ).bind(org.id, user.id).first(),
      env.DB.prepare(
        `SELECT COUNT(*) as count FROM poams
         WHERE org_id = ? AND assigned_to = ? AND status NOT IN ('completed','accepted','deferred')
         AND scheduled_completion < ?`
      ).bind(org.id, user.id, today).first(),
      env.DB.prepare(
        `SELECT id, title, next_due_date, cadence FROM evidence_schedules
         WHERE org_id = ? AND owner_user_id = ? AND is_active = 1
         ORDER BY next_due_date ASC LIMIT 5`
      ).bind(org.id, user.id).all(),
      env.DB.prepare(
        `SELECT COUNT(*) as count FROM evidence_schedules
         WHERE org_id = ? AND owner_user_id = ? AND is_active = 1 AND next_due_date <= ?`
      ).bind(org.id, user.id, today).first(),
      env.DB.prepare(
        `SELECT id, title, completed, due_date FROM audit_checklist_items
         WHERE org_id = ? AND assigned_to = ? AND completed = 0
         ORDER BY due_date ASC LIMIT 5`
      ).bind(org.id, user.id).all(),
      env.DB.prepare(
        `SELECT COUNT(*) as count FROM audit_checklist_items
         WHERE org_id = ? AND assigned_to = ? AND completed = 0`
      ).bind(org.id, user.id).first(),
    ]);

    return jsonResponse({
      my_poams: myPoams.results || [],
      my_evidence_schedules: mySchedules.results || [],
      my_audit_tasks: myTasks.results || [],
      counts: {
        poams: myPoamCount?.count || 0,
        overdue_poams: overduePoams?.count || 0,
        evidence_due: mySchedulesDue?.count || 0,
        audit_tasks: myTaskCount?.count || 0,
      },
    });
  } catch (err) {
    console.error('[handleMyWork]', err.message);
    return jsonResponse({ error: 'Failed to load my work data' }, 500);
  }
}

// ============================================================================
// SYSTEM COMPARISON (cross-system compliance view)
// ============================================================================

async function handleSystemComparison(env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const today = new Date().toISOString().split('T')[0];

  const [systemsRes, controlsRes, poamsRes, overduePoamsRes, risksRes, evidenceRes, monitoringRes] = await Promise.all([
    env.DB.prepare(
      'SELECT id, name, acronym, impact_level, status, authorization_expiry, deployment_model FROM systems WHERE org_id = ? ORDER BY name'
    ).bind(org.id).all(),
    env.DB.prepare(
      'SELECT system_id, status, COUNT(*) as count FROM control_implementations WHERE org_id = ? GROUP BY system_id, status'
    ).bind(org.id).all(),
    env.DB.prepare(
      'SELECT system_id, status, COUNT(*) as count FROM poams WHERE org_id = ? GROUP BY system_id, status'
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, COUNT(*) as count FROM poams WHERE org_id = ? AND status NOT IN ('completed','accepted','deferred') AND scheduled_completion < ? GROUP BY system_id`
    ).bind(org.id, today).all(),
    env.DB.prepare(
      `SELECT system_id, risk_level, COUNT(*) as count FROM risks WHERE org_id = ? AND status != 'closed' AND system_id IS NOT NULL GROUP BY system_id, risk_level`
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT ci.system_id, COUNT(DISTINCT ecl.evidence_id) as count FROM evidence_control_links ecl JOIN control_implementations ci ON ci.id = ecl.implementation_id WHERE ci.org_id = ? GROUP BY ci.system_id`
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, last_result, COUNT(*) as count FROM monitoring_checks WHERE org_id = ? AND is_active = 1 GROUP BY system_id, last_result`
    ).bind(org.id).all(),
  ]);

  // Index results by system_id for O(1) lookup
  const controlsBySystem = {};
  for (const r of controlsRes.results) {
    if (!controlsBySystem[r.system_id]) controlsBySystem[r.system_id] = {};
    controlsBySystem[r.system_id][r.status] = r.count;
  }

  const poamsBySystem = {};
  for (const r of poamsRes.results) {
    if (!poamsBySystem[r.system_id]) poamsBySystem[r.system_id] = {};
    poamsBySystem[r.system_id][r.status] = (poamsBySystem[r.system_id][r.status] || 0) + r.count;
  }

  const overdueBySystem = {};
  for (const r of overduePoamsRes.results) {
    overdueBySystem[r.system_id] = r.count;
  }

  const risksBySystem = {};
  for (const r of risksRes.results) {
    if (!risksBySystem[r.system_id]) risksBySystem[r.system_id] = { low: 0, moderate: 0, high: 0, critical: 0 };
    risksBySystem[r.system_id][r.risk_level] = r.count;
  }

  const evidenceBySystem = {};
  for (const r of evidenceRes.results) {
    evidenceBySystem[r.system_id] = r.count;
  }

  const monitoringBySystem = {};
  for (const r of monitoringRes.results) {
    if (!monitoringBySystem[r.system_id]) monitoringBySystem[r.system_id] = { pass: 0, fail: 0, warning: 0, error: 0, not_run: 0, total: 0 };
    monitoringBySystem[r.system_id][r.last_result] = (monitoringBySystem[r.system_id][r.last_result] || 0) + r.count;
    monitoringBySystem[r.system_id].total += r.count;
  }

  const systems = systemsRes.results.map((sys) => {
    const ctrl = controlsBySystem[sys.id] || {};
    const implemented = ctrl.implemented || 0;
    const partially = ctrl.partially_implemented || 0;
    const planned = ctrl.planned || 0;
    const notImpl = ctrl.not_implemented || 0;
    const na = ctrl.not_applicable || 0;
    const total = implemented + partially + planned + notImpl + na;

    const poam = poamsBySystem[sys.id] || {};
    const poamOpen = poam.open || 0;
    const poamInProgress = poam.in_progress || 0;
    const poamCompleted = poam.completed || 0;
    const poamTotal = poamOpen + poamInProgress + poamCompleted;

    const risks = risksBySystem[sys.id] || { low: 0, moderate: 0, high: 0, critical: 0 };
    const riskTotal = risks.low + risks.moderate + risks.high + risks.critical;

    const mon = monitoringBySystem[sys.id] || { pass: 0, fail: 0, warning: 0, total: 0 };
    const healthScore = mon.total > 0 ? Math.round((mon.pass / mon.total) * 100) : null;

    return {
      id: sys.id,
      name: sys.name,
      acronym: sys.acronym,
      impact_level: sys.impact_level,
      status: sys.status,
      authorization_expiry: sys.authorization_expiry,
      deployment_model: sys.deployment_model,
      controls: { implemented, partially_implemented: partially, planned, not_implemented: notImpl, not_applicable: na, total },
      compliance_percentage: total > 0 ? Math.round(((implemented + na) / total) * 100) : 0,
      poams: { open: poamOpen, in_progress: poamInProgress, completed: poamCompleted, overdue: overdueBySystem[sys.id] || 0, total: poamTotal },
      risks: { ...risks, total: riskTotal },
      evidence_count: evidenceBySystem[sys.id] || 0,
      monitoring: { pass: mon.pass, fail: mon.fail, warning: mon.warning, total: mon.total, health_score: healthScore },
    };
  });

  return jsonResponse({ systems });
}

// ============================================================================
// AUDIT LOG
// ============================================================================

async function handleGetAuditLog(env, url, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;
  const action = url.searchParams.get('action');
  const resourceType = url.searchParams.get('resource_type');
  const userId = url.searchParams.get('user_id');
  const search = url.searchParams.get('search');
  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');

  let where = 'WHERE al.org_id = ?';
  const params = [org.id];
  const countParams = [org.id];

  if (action) { where += ' AND al.action = ?'; params.push(action); countParams.push(action); }
  if (resourceType) { where += ' AND al.resource_type = ?'; params.push(resourceType); countParams.push(resourceType); }
  if (userId) { where += ' AND al.user_id = ?'; params.push(userId); countParams.push(userId); }
  if (dateFrom) { where += ' AND al.created_at >= ?'; params.push(dateFrom); countParams.push(dateFrom); }
  if (dateTo) { where += ' AND al.created_at <= ?'; params.push(dateTo + 'T23:59:59'); countParams.push(dateTo + 'T23:59:59'); }
  if (search) {
    where += ' AND (u.name LIKE ? OR u.email LIKE ? OR al.action LIKE ? OR al.resource_type LIKE ? OR al.details LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
    countParams.push(s, s, s, s, s);
  }

  params.push(limit, offset);

  const { results } = await env.DB.prepare(
    `SELECT al.*, u.name as user_name, u.email as user_email
     FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
     ${where}
     ORDER BY al.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params).all();

  const { total } = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id ${where}`
  ).bind(...countParams).first();

  return jsonResponse({ logs: results, total, page, limit });
}

async function handleGetRecentActivity(env, url, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
  const { results } = await env.DB.prepare(
    `SELECT al.id, al.action, al.resource_type, al.resource_id, al.details, al.created_at, u.name as user_name
     FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
     WHERE al.org_id = ?
     ORDER BY al.created_at DESC LIMIT ?`
  ).bind(org.id, limit).all();
  return jsonResponse({ activities: results });
}

async function handleGetResourceActivity(env, url, org, user, resourceType, resourceId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const page = parseInt(url.searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  const { results } = await env.DB.prepare(
    `SELECT al.*, u.name as user_name, u.email as user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.org_id = ? AND al.resource_type = ? AND al.resource_id = ?
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(org.id, resourceType, resourceId, limit, offset).all();

  const { total } = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM audit_logs WHERE org_id = ? AND resource_type = ? AND resource_id = ?'
  ).bind(org.id, resourceType, resourceId).first();

  return jsonResponse({ activities: results, total, page, limit });
}

// ============================================================================
// GLOBAL SEARCH
// ============================================================================

async function handleGlobalSearch(env, url, org, user) {
  if (!requireRole(user, 'viewer')) return jsonResponse({ error: 'Forbidden' }, 403);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q || q.length < 2) return jsonResponse({ results: [] });
  const like = `%${q}%`;
  const limit = 5;

  const [systems, poams, risks, vendors, policies, evidence] = await Promise.all([
    env.DB.prepare(
      `SELECT id, name AS title, acronym AS subtitle, 'system' AS type FROM systems WHERE org_id = ? AND (name LIKE ? OR acronym LIKE ?) LIMIT ?`
    ).bind(org.id, like, like, limit).all(),
    env.DB.prepare(
      `SELECT id, weakness_name AS title, poam_id AS subtitle, 'poam' AS type FROM poams WHERE org_id = ? AND (weakness_name LIKE ? OR poam_id LIKE ?) LIMIT ?`
    ).bind(org.id, like, like, limit).all(),
    env.DB.prepare(
      `SELECT id, title, category AS subtitle, 'risk' AS type FROM risks WHERE org_id = ? AND (title LIKE ? OR description LIKE ?) LIMIT ?`
    ).bind(org.id, like, like, limit).all(),
    env.DB.prepare(
      `SELECT id, name AS title, criticality AS subtitle, 'vendor' AS type FROM vendors WHERE org_id = ? AND (name LIKE ?) LIMIT ?`
    ).bind(org.id, like, limit).all(),
    env.DB.prepare(
      `SELECT id, title, category AS subtitle, 'policy' AS type FROM policies WHERE org_id = ? AND (title LIKE ?) LIMIT ?`
    ).bind(org.id, like, limit).all(),
    env.DB.prepare(
      `SELECT id, filename AS title, 'evidence' AS type FROM evidence WHERE org_id = ? AND (filename LIKE ? OR description LIKE ?) LIMIT ?`
    ).bind(org.id, like, like, limit).all(),
  ]);

  const results = [
    ...systems.results,
    ...poams.results,
    ...risks.results,
    ...vendors.results,
    ...policies.results,
    ...evidence.results,
  ];

  return jsonResponse({ results });
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

async function handleGetNotifications(env, url, user) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;
  const type = url.searchParams.get('type');
  const unreadOnly = url.searchParams.get('unread') === 'true';

  let where = 'WHERE recipient_user_id = ?';
  const params = [user.id];
  const countParams = [user.id];

  if (type) { where += ' AND type = ?'; params.push(type); countParams.push(type); }
  if (unreadOnly) { where += ' AND is_read = 0'; }

  params.push(limit, offset);

  const { results } = await env.DB.prepare(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params).all();

  const { total } = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM notifications ${where}`
  ).bind(...countParams).first();

  return jsonResponse({ notifications: results, total, page, limit });
}

async function handleUnreadCount(env, user) {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = ? AND is_read = 0'
  ).bind(user.id).first();
  return jsonResponse({ count: row?.count || 0 });
}

async function handleNotificationPoll(env, url, user) {
  const sinceVersion = parseInt(url.searchParams.get('since_version') || '0');
  const ifNoneMatch = url.searchParams.get('etag') || '';

  // Get current notification version for this user
  const userState = await env.DB.prepare(
    'SELECT notification_version FROM users WHERE id = ?'
  ).bind(user.id).first();

  const currentVersion = userState?.notification_version || 0;
  const etag = `"${user.id}-${currentVersion}"`;

  // Return 304 if no changes (ETag matches)
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        'ETag': etag,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Update last check timestamp
  await env.DB.prepare(
    "UPDATE users SET notification_last_check = datetime('now') WHERE id = ?"
  ).bind(user.id).run();

  // Get unread count and recent notifications
  const [countResult, recentResult] = await Promise.all([
    env.DB.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = ? AND is_read = 0'
    ).bind(user.id).first(),
    env.DB.prepare(`
      SELECT id, type, title, message, priority, created_at
      FROM notifications
      WHERE recipient_user_id = ? AND is_read = 0
      ORDER BY
        CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,
        created_at DESC
      LIMIT 5
    `).bind(user.id).all()
  ]);

  const recent = recentResult?.results || [];
  const hasUrgent = recent.some(n => n.priority === 'urgent');

  return new Response(JSON.stringify({
    count: countResult?.count || 0,
    version: currentVersion,
    recent,
    has_urgent: hasUrgent
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'ETag': etag,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleMarkRead(request, env, user) {
  const { notification_ids } = await request.json();
  if (!notification_ids?.length) return jsonResponse({ error: 'notification_ids required' }, 400);
  const ids = notification_ids.slice(0, 50);
  const placeholders = ids.map(() => '?').join(',');
  await env.DB.prepare(
    `UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE id IN (${placeholders}) AND recipient_user_id = ?`
  ).bind(...ids, user.id).run();
  return jsonResponse({ message: 'Marked as read', count: ids.length });
}

async function handleMarkAllRead(env, user) {
  await env.DB.prepare(
    "UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE recipient_user_id = ? AND is_read = 0"
  ).bind(user.id).run();
  return jsonResponse({ message: 'All notifications marked as read' });
}

async function handleGetNotificationPrefs(env, user) {
  let prefs = await env.DB.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').bind(user.id).first();
  if (!prefs) {
    prefs = { poam_update: 1, risk_alert: 1, monitoring_fail: 1, control_change: 1, role_change: 1, compliance_alert: 1, evidence_upload: 1, approval_request: 1, approval_decision: 1, evidence_reminder: 1, evidence_expiry: 1, policy_update: 1, attestation_request: 1, deadline_alert: 1, email_digest: 1, weekly_digest: 1 };
  }
  return jsonResponse({ preferences: prefs });
}

async function handleUpdateNotificationPrefs(request, env, user) {
  const body = await request.json();
  const types = ['poam_update', 'risk_alert', 'monitoring_fail', 'control_change', 'role_change', 'compliance_alert', 'evidence_upload', 'approval_request', 'approval_decision', 'evidence_reminder', 'evidence_expiry', 'policy_update', 'attestation_request', 'deadline_alert', 'email_digest', 'weekly_digest'];
  const values = types.map(t => body[t] !== undefined ? (body[t] ? 1 : 0) : 1);

  await env.DB.prepare(
    `INSERT INTO notification_preferences (id, user_id, ${types.join(', ')}, updated_at)
     VALUES (?, ?, ${types.map(() => '?').join(', ')}, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET ${types.map(t => `${t} = excluded.${t}`).join(', ')}, updated_at = datetime('now')`
  ).bind(generateId(), user.id, ...values).run();

  return handleGetNotificationPrefs(env, user);
}

// ============================================================================
// FORGEML AI WRITER
// ============================================================================

async function runAI(env, systemPrompt, userPrompt) {
  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });
  return response.response;
}

function substituteVariables(template, variables) {
  let result = template;
  // Handle conditional blocks {{#var}}...{{/var}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, varName, content) => {
    return variables[varName] ? content.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), variables[varName]) : '';
  });
  // Handle simple variable substitution
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}

async function handleAIGenerate(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { template_id, system_id, variables = {}, custom_prompt } = body;

  if (!template_id && !custom_prompt) {
    return jsonResponse({ error: 'template_id or custom_prompt required' }, 400);
  }

  let systemPrompt, userPrompt, templateType, title;

  if (template_id) {
    // Load template
    const template = await env.DB.prepare(
      'SELECT * FROM ai_templates WHERE id = ? AND (org_id IS NULL OR org_id = ?)'
    ).bind(template_id, org.id).first();
    if (!template) return jsonResponse({ error: 'Template not found' }, 404);

    // Load system context if provided
    let systemContext = {};
    if (system_id) {
      const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(system_id, org.id).first();
      if (system) {
        systemContext = {
          system_name: system.name,
          system_acronym: system.acronym || '',
          impact_level: system.impact_level,
        };
      }
    }

    // Merge all variables
    const allVars = {
      org_name: org.name,
      industry: org.industry || 'General',
      ...systemContext,
      ...variables,
    };

    systemPrompt = template.system_prompt;
    userPrompt = substituteVariables(template.user_prompt_template, allVars);
    templateType = template.category;
    title = `${template.name} - ${allVars.system_name || org.name}`;
  } else {
    systemPrompt = 'You are a senior cybersecurity compliance consultant. Write professional, detailed compliance documentation. Format your output using Markdown with headings (##), tables, bold text, and bullet lists for professional readability.';
    userPrompt = custom_prompt;
    templateType = 'custom';
    title = 'Custom AI Document';
  }

  const generated = await runAI(env, systemPrompt, userPrompt);

  // Save to ai_documents
  const docId = crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare(
    `INSERT INTO ai_documents (id, org_id, system_id, template_id, template_type, title, prompt_used, generated_content, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`
  ).bind(docId, org.id, system_id || null, template_id || null, templateType, title, userPrompt, generated, user.id).run();

  await auditLog(env, org.id, user.id, 'ai_generate', 'ai_document', docId, { template_type: templateType });

  return jsonResponse({ document: { id: docId, title, template_type: templateType, generated_content: generated, status: 'draft', created_at: new Date().toISOString() } });
}

async function handleAINarrative(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, framework_id, control_id, additional_context } = body;

  if (!system_id || !framework_id || !control_id) {
    return jsonResponse({ error: 'system_id, framework_id, and control_id are required' }, 400);
  }

  // Load system
  const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(system_id, org.id).first();
  if (!system) return jsonResponse({ error: 'System not found' }, 404);

  // Load control details
  const control = await env.DB.prepare(
    'SELECT sc.*, cf.name as framework_name FROM security_controls sc JOIN compliance_frameworks cf ON cf.id = sc.framework_id WHERE sc.framework_id = ? AND sc.control_id = ?'
  ).bind(framework_id, control_id).first();
  if (!control) return jsonResponse({ error: 'Control not found' }, 404);

  // Load current implementation status
  const impl = await env.DB.prepare(
    'SELECT * FROM control_implementations WHERE system_id = ? AND framework_id = ? AND control_id = ?'
  ).bind(system_id, framework_id, control_id).first();

  const systemPrompt = 'You are a senior cybersecurity compliance consultant with 15+ years of experience writing System Security Plans (SSPs) for federal agencies and regulated industries. You write clear, specific, implementation-focused narratives that satisfy assessor expectations. Use professional third-person language. Be specific about technologies, processes, and responsible parties. Each narrative should address the WHO, WHAT, WHEN, WHERE, and HOW of control implementation. Do not use generic or vague language.';

  const userPrompt = `Write a detailed control implementation narrative for the following:

System: ${system.name} (${system.acronym || 'N/A'})
Impact Level: ${system.impact_level}
Framework: ${control.framework_name}
Control ID: ${control.control_id}
Control Title: ${control.title}
Control Description: ${control.description || 'N/A'}

Current Implementation Status: ${impl ? impl.status : 'not_implemented'}
Organization: ${org.name}
Industry: ${org.industry || 'General'}

${additional_context ? `Additional Context: ${additional_context}` : ''}

Write a professional implementation narrative (200-400 words) that describes exactly how this control is implemented. Include specific technologies, processes, roles, and frequencies where appropriate.`;

  const narrative = await runAI(env, systemPrompt, userPrompt);

  // Update control_implementations with the AI narrative
  if (impl) {
    await env.DB.prepare(
      `UPDATE control_implementations SET ai_narrative = ?, ai_narrative_generated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    ).bind(narrative, impl.id).run();
  } else {
    // Create implementation record if it doesn't exist
    const implId = crypto.randomUUID().replace(/-/g, '');
    await env.DB.prepare(
      `INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, ai_narrative, ai_narrative_generated_at)
       VALUES (?, ?, ?, ?, ?, 'not_implemented', ?, datetime('now'))`
    ).bind(implId, org.id, system_id, framework_id, control_id, narrative).run();
  }

  await auditLog(env, org.id, user.id, 'ai_narrative', 'control_implementation', `${system_id}:${control_id}`, { framework_id });

  return jsonResponse({ narrative, control_id, framework_id, system_id });
}

async function handleListAIDocuments(env, url, org) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
  const offset = (page - 1) * limit;
  const templateType = url.searchParams.get('template_type');

  let query = 'SELECT ad.*, u.name as created_by_name FROM ai_documents ad LEFT JOIN users u ON u.id = ad.created_by WHERE ad.org_id = ?';
  let countQuery = 'SELECT COUNT(*) as total FROM ai_documents WHERE org_id = ?';
  const params = [org.id];

  if (templateType) {
    query += ' AND ad.template_type = ?';
    countQuery += ' AND template_type = ?';
    params.push(templateType);
  }

  query += ' ORDER BY ad.created_at DESC LIMIT ? OFFSET ?';

  const { results } = await env.DB.prepare(query).bind(...params, limit, offset).all();
  const { total } = await env.DB.prepare(countQuery).bind(...params).first();

  return jsonResponse({ documents: results, total, page, limit });
}

async function handleGetAIDocument(env, org, id) {
  const doc = await env.DB.prepare('SELECT ad.*, u.name as created_by_name FROM ai_documents ad LEFT JOIN users u ON u.id = ad.created_by WHERE ad.id = ? AND ad.org_id = ?').bind(id, org.id).first();
  if (!doc) return jsonResponse({ error: 'Document not found' }, 404);
  return jsonResponse({ document: doc });
}

async function handleUpdateAIDocument(request, env, org, user, id) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const doc = await env.DB.prepare('SELECT id FROM ai_documents WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!doc) return jsonResponse({ error: 'Document not found' }, 404);

  const body = await request.json();
  const { generated_content, title, status } = body;

  const updates = [];
  const binds = [];

  if (generated_content !== undefined) { updates.push('generated_content = ?'); binds.push(generated_content); }
  if (title !== undefined) { updates.push('title = ?'); binds.push(title); }
  if (status !== undefined) { updates.push('status = ?'); binds.push(status); }
  updates.push("updated_at = datetime('now')");

  if (updates.length === 1) return jsonResponse({ error: 'No fields to update' }, 400);

  binds.push(id);
  await env.DB.prepare(`UPDATE ai_documents SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();

  await auditLog(env, org.id, user.id, 'update', 'ai_document', id, { title, status });
  const updated = await env.DB.prepare('SELECT ad.*, u.name as created_by_name FROM ai_documents ad LEFT JOIN users u ON u.id = ad.created_by WHERE ad.id = ?').bind(id).first();
  return jsonResponse({ document: updated });
}

async function handleDeleteAIDocument(env, org, user, id) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const doc = await env.DB.prepare('SELECT id FROM ai_documents WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!doc) return jsonResponse({ error: 'Document not found' }, 404);

  await env.DB.prepare('DELETE FROM ai_documents WHERE id = ?').bind(id).run();
  await auditLog(env, org.id, user.id, 'delete', 'ai_document', id, {});
  return jsonResponse({ success: true });
}

async function handleListAITemplates(env, org) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM ai_templates WHERE org_id IS NULL OR org_id = ? ORDER BY is_builtin DESC, name ASC'
  ).bind(org.id).all();
  return jsonResponse({ templates: results });
}

async function handleCreateAITemplate(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { name, description, category, system_prompt, user_prompt_template, variables } = body;

  if (!name || !category || !system_prompt || !user_prompt_template) {
    return jsonResponse({ error: 'name, category, system_prompt, and user_prompt_template are required' }, 400);
  }

  const id = crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare(
    `INSERT INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).bind(id, org.id, name, description || '', category, system_prompt, user_prompt_template, JSON.stringify(variables || []), user.id).run();

  await auditLog(env, org.id, user.id, 'create', 'ai_template', id, { name });

  const template = await env.DB.prepare('SELECT * FROM ai_templates WHERE id = ?').bind(id).first();
  return jsonResponse({ template }, 201);
}

// ============================================================================
// USER MANAGEMENT (Feature 1: RBAC)
// ============================================================================

async function handleListUsers(env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { results } = await env.DB.prepare(
    'SELECT id, email, name, role, status, mfa_enabled, onboarding_completed, last_login_at, created_at, failed_login_attempts, locked_until FROM users WHERE org_id = ? ORDER BY created_at'
  ).bind(org.id).all();
  const now = new Date();
  const stats = {
    total: results.length,
    active: results.filter(u => u.status !== 'deactivated').length,
    deactivated: results.filter(u => u.status === 'deactivated').length,
    admins: results.filter(u => ['admin', 'owner'].includes(u.role)).length,
    mfa_enabled: results.filter(u => u.mfa_enabled).length,
    locked: results.filter(u => u.locked_until && new Date(u.locked_until) > now).length,
  };
  return jsonResponse({ users: results, stats });
}

async function handleUpdateUserRole(request, env, org, user, targetUserId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { role } = await request.json();
  if (!['viewer', 'analyst', 'manager', 'admin'].includes(role)) return jsonResponse({ error: 'Invalid role' }, 400);
  const target = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(targetUserId, org.id).first();
  if (!target) return jsonResponse({ error: 'User not found' }, 404);
  if (target.role === 'owner') return jsonResponse({ error: 'Cannot change owner role' }, 403);
  if (role === 'admin' && user.role !== 'owner') return jsonResponse({ error: 'Only owner can assign admin role' }, 403);
  await env.DB.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").bind(role, targetUserId).run();
  await auditLog(env, org.id, user.id, 'update_role', 'user', targetUserId, { old_role: target.role, new_role: role });
  await createNotification(env, org.id, targetUserId, 'role_change', 'Your Role Was Changed', 'Your role was changed from ' + target.role + ' to ' + role, 'user', targetUserId, { old_role: target.role, new_role: role });
  return jsonResponse({ message: 'Role updated', user_id: targetUserId, role });
}

async function handleCreateUser(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { email, name, role } = await request.json();
  if (!email || !name) return jsonResponse({ error: 'Email and name are required' }, 400);
  if (!['viewer', 'analyst', 'manager', 'admin'].includes(role)) return jsonResponse({ error: 'Invalid role' }, 400);
  if (role === 'admin' && user.role !== 'owner') return jsonResponse({ error: 'Only owner can assign admin role' }, 403);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (existing) return jsonResponse({ error: 'A user with this email already exists' }, 409);

  const tempPassword = generateTempPassword();
  const salt = generateSalt();
  const passwordHash = await hashPassword(tempPassword, salt);
  const id = generateId();

  await env.DB.prepare(
    `INSERT INTO users (id, org_id, email, password_hash, salt, name, role, status, onboarding_completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0)`
  ).bind(id, org.id, email.toLowerCase(), passwordHash, salt, name, role).run();

  await auditLog(env, org.id, user.id, 'create_user', 'user', id, { email: email.toLowerCase(), role });
  return jsonResponse({ user: { id, email: email.toLowerCase(), name, role, status: 'active' }, temp_password: tempPassword }, 201);
}

async function handleUpdateUser(request, env, org, user, targetUserId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { name, email } = await request.json();
  const target = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(targetUserId, org.id).first();
  if (!target) return jsonResponse({ error: 'User not found' }, 404);
  if (target.role === 'owner' && user.role !== 'owner') return jsonResponse({ error: 'Only owner can edit owner account' }, 403);
  if (target.role === 'admin' && user.role !== 'owner') return jsonResponse({ error: 'Only owner can edit admin accounts' }, 403);

  if (email && email.toLowerCase() !== target.email) {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?').bind(email.toLowerCase(), targetUserId).first();
    if (existing) return jsonResponse({ error: 'Email already in use' }, 409);
  }

  const newName = name || target.name;
  const newEmail = email ? email.toLowerCase() : target.email;
  await env.DB.prepare("UPDATE users SET name = ?, email = ?, updated_at = datetime('now') WHERE id = ?").bind(newName, newEmail, targetUserId).run();
  await auditLog(env, org.id, user.id, 'update_user', 'user', targetUserId, { old_name: target.name, new_name: newName, old_email: target.email, new_email: newEmail });
  return jsonResponse({ message: 'User updated', user: { id: targetUserId, name: newName, email: newEmail, role: target.role } });
}

async function handleUpdateUserStatus(request, env, org, user, targetUserId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { status } = await request.json();
  if (!['active', 'deactivated'].includes(status)) return jsonResponse({ error: 'Status must be active or deactivated' }, 400);

  if (targetUserId === user.id) return jsonResponse({ error: 'Cannot change your own status' }, 400);
  const target = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(targetUserId, org.id).first();
  if (!target) return jsonResponse({ error: 'User not found' }, 404);
  if (target.role === 'owner') return jsonResponse({ error: 'Cannot deactivate owner' }, 403);
  if (target.role === 'admin' && user.role !== 'owner') return jsonResponse({ error: 'Only owner can deactivate admins' }, 403);

  await env.DB.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, targetUserId).run();

  if (status === 'deactivated') {
    await env.DB.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').bind(targetUserId).run();
  }

  await auditLog(env, org.id, user.id, status === 'deactivated' ? 'deactivate_user' : 'reactivate_user', 'user', targetUserId, { email: target.email });
  return jsonResponse({ message: `User ${status === 'deactivated' ? 'deactivated' : 'reactivated'}`, user_id: targetUserId, status });
}

async function handleResetUserPassword(request, env, org, user, targetUserId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const target = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(targetUserId, org.id).first();
  if (!target) return jsonResponse({ error: 'User not found' }, 404);
  if (target.role === 'owner' && user.role !== 'owner') return jsonResponse({ error: 'Only owner can reset owner password' }, 403);
  if (target.role === 'admin' && user.role !== 'owner') return jsonResponse({ error: 'Only owner can reset admin passwords' }, 403);

  const tempPassword = generateTempPassword();
  const salt = generateSalt();
  const passwordHash = await hashPassword(tempPassword, salt);

  await env.DB.prepare("UPDATE users SET password_hash = ?, salt = ?, updated_at = datetime('now') WHERE id = ?").bind(passwordHash, salt, targetUserId).run();
  await env.DB.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').bind(targetUserId).run();

  await auditLog(env, org.id, user.id, 'reset_password', 'user', targetUserId, { email: target.email });
  return jsonResponse({ temp_password: tempPassword, user_id: targetUserId });
}

async function handleForceDisableMFA(request, env, org, user, targetUserId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const target = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(targetUserId, org.id).first();
  if (!target) return jsonResponse({ error: 'User not found' }, 404);
  if (target.role === 'owner' && user.role !== 'owner') return jsonResponse({ error: 'Only owner can disable owner 2FA' }, 403);

  await env.DB.prepare("UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_backup_codes = NULL, updated_at = datetime('now') WHERE id = ?").bind(targetUserId).run();
  await auditLog(env, org.id, user.id, 'force_disable_mfa', 'user', targetUserId, { email: target.email });
  return jsonResponse({ message: '2FA disabled for user', user_id: targetUserId });
}

async function handleUnlockUser(request, env, org, user, targetUserId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const target = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(targetUserId, org.id).first();
  if (!target) return jsonResponse({ error: 'User not found' }, 404);

  await env.DB.prepare("UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?").bind(targetUserId).run();
  await auditLog(env, org.id, user.id, 'unlock_account', 'user', targetUserId, { email: target.email });
  return jsonResponse({ message: 'Account unlocked', user_id: targetUserId });
}

// ============================================================================
// EMERGENCY ACCESS (HIPAA Break-Glass Procedure)
// ============================================================================
// Provides emergency account recovery when all admin/owner accounts are locked
// or inaccessible. Requires EMERGENCY_ACCESS_KEY secret to be pre-configured.
// All emergency access events are prominently logged for audit.

async function handleEmergencyAccess(request, env) {
  // Rate limit: 3 attempts per hour per IP to prevent brute-force
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, `emergency:${ip}`, 3, 3600);
  if (rl.limited) return rateLimitResponse(rl.retryAfter);

  const body = await request.json();
  const { emergency_key, org_email, reason } = body;

  const valErrors = validateBody(body, {
    emergency_key: { required: true, type: 'string' },
    org_email: { required: true, type: 'string' },
    reason: { required: true, type: 'string', minLength: 10, maxLength: 1000 },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  // Verify the emergency access key is configured
  if (!env.EMERGENCY_ACCESS_KEY) {
    // Log the attempt even if the key is not configured
    console.error('EMERGENCY ACCESS ATTEMPTED but EMERGENCY_ACCESS_KEY not configured');
    return jsonResponse({ error: 'Emergency access is not configured for this deployment' }, 503);
  }

  // Timing-safe comparison of the emergency key
  if (!timingSafeEqual(emergency_key, env.EMERGENCY_ACCESS_KEY)) {
    console.error(`EMERGENCY ACCESS FAILED: Invalid key from IP ${ip}`);
    // Log failed attempt — find any org by the email to get org_id for logging
    const user = await env.DB.prepare('SELECT id, org_id FROM users WHERE email = ?').bind(org_email.toLowerCase()).first();
    if (user) {
      await auditLog(env, user.org_id, null, 'emergency_access_failed', 'system', null, {
        ip_address: ip,
        email_attempted: org_email.toLowerCase(),
        reason,
      }, request);
    }
    return jsonResponse({ error: 'Invalid emergency access credentials' }, 403);
  }

  // Find the owner/admin account by email
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(org_email.toLowerCase()).first();
  if (!user) return jsonResponse({ error: 'Account not found' }, 404);

  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(user.org_id).first();
  if (!org) return jsonResponse({ error: 'Organization not found' }, 404);

  // Only allow emergency access for admin/owner roles
  if (!['admin', 'owner'].includes(user.role)) {
    await auditLog(env, org.id, null, 'emergency_access_denied', 'user', user.id, {
      ip_address: ip,
      reason,
      denial_reason: 'Target account is not admin or owner',
    }, request);
    return jsonResponse({ error: 'Emergency access is only available for admin and owner accounts' }, 403);
  }

  // Unlock the account: reset failed attempts, clear lockout, disable MFA
  await env.DB.prepare(
    "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, status = 'active', updated_at = datetime('now') WHERE id = ?"
  ).bind(user.id).run();

  // Generate a short-lived emergency token (15 minutes)
  const accessToken = await createJWT(
    { sub: user.id, org: user.org_id, role: user.role, emergency: true },
    requireJWTSecret(env),
    15
  );

  // Revoke all existing refresh tokens for this user
  await env.DB.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').bind(user.id).run();

  // Create a new refresh token
  const refreshToken = generateId() + generateId();
  const refreshHash = await hashPassword(refreshToken, 'refresh-salt');
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), user.id, refreshHash, refreshExpiry).run();

  // Log the emergency access prominently
  await auditLog(env, org.id, user.id, 'emergency_access_granted', 'user', user.id, {
    ip_address: ip,
    reason,
    mfa_was_enabled: !!user.mfa_enabled,
    was_locked: !!user.locked_until,
    was_deactivated: user.status === 'deactivated',
    token_expires_minutes: 15,
  }, request);

  // Notify all other admins/owners in the organization
  const { results: orgAdmins } = await env.DB.prepare(
    "SELECT id, email FROM users WHERE org_id = ? AND role IN ('admin', 'owner') AND id != ?"
  ).bind(org.id, user.id).all();

  for (const admin of orgAdmins) {
    await env.DB.prepare(
      "INSERT INTO notifications (id, org_id, recipient_user_id, type, title, message, priority) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      generateId(), org.id, admin.id, 'security',
      'EMERGENCY ACCESS ACTIVATED',
      `Emergency break-glass access was used for account ${user.email} from IP ${ip}. Reason: ${reason}. Review audit logs immediately.`,
      'critical'
    ).run();
  }

  return jsonResponse({
    message: 'Emergency access granted. This session expires in 15 minutes. All activity is being logged.',
    access_token: accessToken,
    refresh_token: refreshToken,
    user: sanitizeUser({ ...user, failed_login_attempts: 0, locked_until: null, status: 'active' }),
    org,
    emergency: true,
    expires_in_minutes: 15,
  });
}

// ============================================================================
// MONITORING HANDLERS (Feature 2: ControlPulse)
// ============================================================================

async function handleCreateMonitoringCheck(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, control_id, framework_id, check_type, check_name, check_description, frequency } = body;
  if (!check_name || !check_type) return jsonResponse({ error: 'check_name and check_type required' }, 400);
  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO monitoring_checks (id, org_id, system_id, control_id, framework_id, check_type, check_name, check_description, frequency, is_active, last_result)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'not_run')`
  ).bind(id, org.id, system_id || null, control_id || null, framework_id || null, check_type, check_name, check_description || '', frequency || 'monthly').run();
  await auditLog(env, org.id, user.id, 'create', 'monitoring_check', id, { check_name });
  const check = await env.DB.prepare('SELECT * FROM monitoring_checks WHERE id = ?').bind(id).first();
  return jsonResponse({ check }, 201);
}

async function handleUpdateMonitoringCheck(request, env, org, user, checkId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const check = await env.DB.prepare('SELECT * FROM monitoring_checks WHERE id = ? AND org_id = ?').bind(checkId, org.id).first();
  if (!check) return jsonResponse({ error: 'Check not found' }, 404);
  const body = await request.json();
  const { check_name, check_description, frequency, is_active, check_type } = body;
  const updates = []; const binds = [];
  if (check_name !== undefined) { updates.push('check_name = ?'); binds.push(check_name); }
  if (check_description !== undefined) { updates.push('check_description = ?'); binds.push(check_description); }
  if (frequency !== undefined) { updates.push('frequency = ?'); binds.push(frequency); }
  if (is_active !== undefined) { updates.push('is_active = ?'); binds.push(is_active ? 1 : 0); }
  if (check_type !== undefined) { updates.push('check_type = ?'); binds.push(check_type); }
  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push("updated_at = datetime('now')");
  binds.push(checkId);
  await env.DB.prepare(`UPDATE monitoring_checks SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();
  await auditLog(env, org.id, user.id, 'update', 'monitoring_check', checkId, body);
  const updated = await env.DB.prepare('SELECT * FROM monitoring_checks WHERE id = ?').bind(checkId).first();
  return jsonResponse({ check: updated });
}

async function handleRunMonitoringCheck(request, env, org, user, checkId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const check = await env.DB.prepare('SELECT * FROM monitoring_checks WHERE id = ? AND org_id = ?').bind(checkId, org.id).first();
  if (!check) return jsonResponse({ error: 'Check not found' }, 404);
  const { result, notes } = await request.json();
  if (!['pass', 'fail', 'warning', 'error'].includes(result)) return jsonResponse({ error: 'Invalid result' }, 400);
  const resultId = generateId();
  await env.DB.prepare(
    "INSERT INTO monitoring_check_results (id, check_id, org_id, result, notes, run_by) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(resultId, checkId, org.id, result, notes || '', user.id).run();
  await env.DB.prepare(
    "UPDATE monitoring_checks SET last_result = ?, last_result_details = ?, last_run_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).bind(result, notes || '', checkId).run();
  await auditLog(env, org.id, user.id, 'run', 'monitoring_check', checkId, { result, notes });
  if (['fail', 'error'].includes(result)) await notifyOrgRole(env, org.id, user.id, 'analyst', 'monitoring_fail', 'Monitoring Check Failed', 'Check "' + check.check_name + '" result: ' + result, 'monitoring_check', checkId, { result });
  return jsonResponse({ message: 'Check result recorded', result_id: resultId, result }, 201);
}

async function handleGetCheckResults(env, org, checkId) {
  const { results } = await env.DB.prepare(
    `SELECT mcr.*, u.name as run_by_name FROM monitoring_check_results mcr
     LEFT JOIN users u ON u.id = mcr.run_by
     WHERE mcr.check_id = ? AND mcr.org_id = ? ORDER BY mcr.run_at DESC LIMIT 50`
  ).bind(checkId, org.id).all();
  return jsonResponse({ results });
}

// ============================================================================
// MONITORING — ConMon Enhancements
// ============================================================================

async function handleMonitoringDrift(env, org) {
  // Compare latest two snapshots per system+framework to find compliance drops
  const { results: snapshotDrift } = await env.DB.prepare(
    `WITH ranked AS (
       SELECT cs.*, cf.name as framework_name, s.name as system_name,
         ROW_NUMBER() OVER (PARTITION BY cs.system_id, cs.framework_id ORDER BY cs.snapshot_date DESC) as rn
       FROM compliance_snapshots cs
       LEFT JOIN compliance_frameworks cf ON cf.id = cs.framework_id
       LEFT JOIN systems s ON s.id = cs.system_id
       WHERE cs.org_id = ?
     )
     SELECT a.system_id, a.framework_id, a.framework_name, a.system_name,
       a.snapshot_date as current_date, a.compliance_percentage as current_pct,
       b.snapshot_date as previous_date, b.compliance_percentage as previous_pct,
       (a.compliance_percentage - b.compliance_percentage) as delta
     FROM ranked a JOIN ranked b ON a.system_id = b.system_id AND a.framework_id = b.framework_id AND a.rn = 1 AND b.rn = 2
     WHERE a.compliance_percentage < b.compliance_percentage`
  ).bind(org.id).all();

  // Find controls changed to non-implemented status in last 7 days
  const { results: controlDrift } = await env.DB.prepare(
    `SELECT ci.id, ci.control_id, ci.status, ci.updated_at, s.name as system_name, cf.name as framework_name
     FROM control_implementations ci
     LEFT JOIN systems s ON s.id = ci.system_id
     LEFT JOIN compliance_frameworks cf ON cf.id = ci.framework_id
     WHERE ci.org_id = ? AND ci.status IN ('not_implemented', 'planned') AND ci.updated_at >= datetime('now', '-7 days')
     ORDER BY ci.updated_at DESC LIMIT 50`
  ).bind(org.id).all();

  return jsonResponse({ drift: { snapshot_drift: snapshotDrift, control_drift: controlDrift } });
}

async function handleBulkRunChecks(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { system_id, result, notes } = await request.json();
  if (!system_id || !result) return jsonResponse({ error: 'system_id and result required' }, 400);
  if (!['pass', 'fail', 'warning', 'error'].includes(result)) return jsonResponse({ error: 'Invalid result' }, 400);

  const { results: checks } = await env.DB.prepare(
    'SELECT * FROM monitoring_checks WHERE org_id = ? AND system_id = ? AND is_active = 1'
  ).bind(org.id, system_id).all();

  if (!checks.length) return jsonResponse({ error: 'No active checks for this system' }, 404);

  for (const check of checks) {
    const resultId = generateId();
    await env.DB.prepare(
      "INSERT INTO monitoring_check_results (id, check_id, org_id, result, notes, run_by) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(resultId, check.id, org.id, result, notes || '', user.id).run();
    await env.DB.prepare(
      "UPDATE monitoring_checks SET last_result = ?, last_result_details = ?, last_run_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).bind(result, notes || '', check.id).run();
  }

  await auditLog(env, org.id, user.id, 'bulk_run', 'monitoring_check', system_id, { result, count: checks.length });
  if (['fail', 'error'].includes(result)) {
    await notifyOrgRole(env, org.id, user.id, 'analyst', 'monitoring_fail', 'Bulk Check Run Failed', `${checks.length} checks marked as ${result} for system`, 'monitoring_check', system_id, { result, count: checks.length });
  }

  return jsonResponse({ message: `Ran ${checks.length} checks`, count: checks.length }, 201);
}

async function handleMonitoringExportCSV(env, org) {
  const { results } = await env.DB.prepare(
    `SELECT mc.*, s.name as system_name, cf.name as framework_name
     FROM monitoring_checks mc
     LEFT JOIN systems s ON s.id = mc.system_id
     LEFT JOIN compliance_frameworks cf ON cf.id = mc.framework_id
     WHERE mc.org_id = ? ORDER BY mc.system_id, mc.check_name`
  ).bind(org.id).all();

  const header = 'Check ID,Check Name,Type,System,Framework,Frequency,Last Result,Last Run,Active,Description\n';
  const rows = results.map(r =>
    `"${r.id}","${(r.check_name || '').replace(/"/g, '""')}","${r.check_type}","${(r.system_name || '').replace(/"/g, '""')}","${(r.framework_name || '').replace(/"/g, '""')}","${r.frequency}","${r.last_result || 'not_run'}","${r.last_run_at || 'Never'}","${r.is_active ? 'Yes' : 'No'}","${(r.check_description || '').replace(/"/g, '""')}"`
  ).join('\n');

  return new Response(header + rows, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="monitoring_checks.csv"',
      ...corsHeaders(),
    },
  });
}

// ============================================================================
// EVIDENCE + CONTROLS (Feature 3)
// ============================================================================

async function handleGetImplementationEvidence(env, org, implementationId) {
  const impl = await env.DB.prepare(
    'SELECT * FROM control_implementations WHERE id = ? AND org_id = ?'
  ).bind(implementationId, org.id).first();
  if (!impl) return jsonResponse({ error: 'Implementation not found' }, 404);
  const { results } = await env.DB.prepare(
    `SELECT e.*, ecl.created_at as linked_at, u.name as linked_by_name
     FROM evidence_control_links ecl
     JOIN evidence e ON e.id = ecl.evidence_id
     LEFT JOIN users u ON u.id = ecl.linked_by
     WHERE ecl.implementation_id = ? ORDER BY ecl.created_at DESC`
  ).bind(implementationId).all();
  return jsonResponse({ evidence: results });
}

// ============================================================================
// BULK OPERATIONS (Feature 5)
// ============================================================================

async function handleBulkUpdateImplementations(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { system_id, framework_id, control_ids, status, responsible_role } = await request.json();
  if (!system_id || !framework_id || !control_ids?.length) return jsonResponse({ error: 'system_id, framework_id, and control_ids required' }, 400);
  if (control_ids.length > 200) return jsonResponse({ error: 'Maximum 200 controls per batch' }, 400);
  let updated = 0;
  for (const controlId of control_ids) {
    const updates = []; const values = [];
    if (status) { updates.push('status = ?'); values.push(status); }
    if (responsible_role) { updates.push('responsible_role = ?'); values.push(responsible_role); }
    if (updates.length === 0) continue;
    updates.push("updated_at = datetime('now')");
    values.push(system_id, framework_id, controlId, org.id);
    await env.DB.prepare(
      `UPDATE control_implementations SET ${updates.join(', ')} WHERE system_id = ? AND framework_id = ? AND control_id = ? AND org_id = ?`
    ).bind(...values).run();
    updated++;
  }
  await auditLog(env, org.id, user.id, 'bulk_update', 'control_implementation', framework_id, { system_id, count: updated, status, responsible_role });
  return jsonResponse({ message: `Updated ${updated} implementations`, updated });
}

async function handleBulkAINarrative(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { system_id, framework_id, control_ids } = await request.json();
  if (!system_id || !framework_id || !control_ids?.length) return jsonResponse({ error: 'Required fields missing' }, 400);
  if (control_ids.length > 20) return jsonResponse({ error: 'Maximum 20 controls per bulk AI generation' }, 400);
  const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(system_id, org.id).first();
  if (!system) return jsonResponse({ error: 'System not found' }, 404);
  const results = [];
  for (const controlId of control_ids) {
    try {
      const control = await env.DB.prepare(
        'SELECT sc.*, cf.name as framework_name FROM security_controls sc JOIN compliance_frameworks cf ON cf.id = sc.framework_id WHERE sc.framework_id = ? AND sc.control_id = ?'
      ).bind(framework_id, controlId).first();
      if (!control) { results.push({ control_id: controlId, status: 'error', error: 'Control not found' }); continue; }
      const impl = await env.DB.prepare(
        'SELECT * FROM control_implementations WHERE system_id = ? AND framework_id = ? AND control_id = ?'
      ).bind(system_id, framework_id, controlId).first();
      const systemPrompt = 'You are a senior cybersecurity compliance consultant. Write clear, specific, implementation-focused narratives for System Security Plans. Use professional third-person language. Address WHO, WHAT, WHEN, WHERE, and HOW.';
      const userPrompt = `Write an implementation narrative (200-400 words) for:\nSystem: ${system.name} (${system.acronym || 'N/A'})\nImpact: ${system.impact_level}\nFramework: ${control.framework_name}\nControl: ${control.control_id} - ${control.title}\nDescription: ${control.description || 'N/A'}\nStatus: ${impl ? impl.status : 'not_implemented'}\nOrg: ${org.name}`;
      const narrative = await runAI(env, systemPrompt, userPrompt);
      if (impl) {
        await env.DB.prepare("UPDATE control_implementations SET ai_narrative = ?, ai_narrative_generated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").bind(narrative, impl.id).run();
      } else {
        await env.DB.prepare(
          "INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, ai_narrative, ai_narrative_generated_at) VALUES (?, ?, ?, ?, ?, 'not_implemented', ?, datetime('now'))"
        ).bind(generateId(), org.id, system_id, framework_id, controlId, narrative).run();
      }
      results.push({ control_id: controlId, status: 'success' });
    } catch (err) {
      results.push({ control_id: controlId, status: 'error', error: err.message });
    }
  }
  await auditLog(env, org.id, user.id, 'bulk_ai_narrative', 'control_implementation', framework_id, { system_id, count: control_ids.length, successes: results.filter(r => r.status === 'success').length });
  return jsonResponse({ results, total: control_ids.length });
}

// ============================================================================
// CONTROL INHERITANCE
// ============================================================================

async function handleInheritImplementations(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { source_system_id, target_system_id, framework_id, control_ids } = await request.json();
  if (!source_system_id || !target_system_id || !framework_id) return jsonResponse({ error: 'source_system_id, target_system_id, and framework_id are required' }, 400);
  if (source_system_id === target_system_id) return jsonResponse({ error: 'Source and target systems must be different' }, 400);

  const source = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(source_system_id, org.id).first();
  const target = await env.DB.prepare('SELECT * FROM systems WHERE id = ? AND org_id = ?').bind(target_system_id, org.id).first();
  if (!source || !target) return jsonResponse({ error: 'System not found' }, 404);

  let query = `SELECT * FROM control_implementations WHERE system_id = ? AND framework_id = ? AND org_id = ? AND status IN ('implemented', 'partially_implemented', 'alternative')`;
  const params = [source_system_id, framework_id, org.id];
  if (control_ids?.length) {
    query += ` AND control_id IN (${control_ids.map(() => '?').join(',')})`;
    params.push(...control_ids);
  }
  const { results: sourceImpls } = await env.DB.prepare(query).bind(...params).all();

  // Get existing target implementations to skip non-inherited ones
  const { results: targetImpls } = await env.DB.prepare(
    'SELECT control_id, inherited FROM control_implementations WHERE system_id = ? AND framework_id = ? AND org_id = ?'
  ).bind(target_system_id, framework_id, org.id).all();
  const targetMap = {};
  for (const t of targetImpls) targetMap[t.control_id] = t;

  let inherited_count = 0, skipped_count = 0;
  for (const src of sourceImpls) {
    const existing = targetMap[src.control_id];
    // Skip if target has a non-inherited implementation (don't overwrite manual work)
    if (existing && !existing.inherited) { skipped_count++; continue; }

    await env.DB.prepare(
      `INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role, ai_narrative, inherited, inherited_from)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON CONFLICT(system_id, framework_id, control_id) DO UPDATE SET
         status = ?, implementation_description = ?, responsible_role = ?, ai_narrative = ?,
         inherited = 1, inherited_from = ?, updated_at = datetime('now')`
    ).bind(
      generateId(), org.id, target_system_id, framework_id, src.control_id,
      src.status, src.implementation_description, src.responsible_role, src.ai_narrative, source_system_id,
      src.status, src.implementation_description, src.responsible_role, src.ai_narrative, source_system_id
    ).run();
    inherited_count++;
  }

  await auditLog(env, org.id, user.id, 'inherit', 'control_implementation', framework_id, { source: source_system_id, target: target_system_id, count: inherited_count });
  return jsonResponse({ inherited_count, skipped_count, source_name: source.name, target_name: target.name }, 201);
}

async function handleSyncInherited(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { system_id, framework_id } = await request.json();
  if (!system_id || !framework_id) return jsonResponse({ error: 'system_id and framework_id are required' }, 400);

  const { results: inherited } = await env.DB.prepare(
    'SELECT * FROM control_implementations WHERE system_id = ? AND framework_id = ? AND org_id = ? AND inherited = 1'
  ).bind(system_id, framework_id, org.id).all();

  let synced = 0;
  for (const impl of inherited) {
    if (!impl.inherited_from) continue;
    const source = await env.DB.prepare(
      'SELECT * FROM control_implementations WHERE system_id = ? AND framework_id = ? AND control_id = ? AND org_id = ?'
    ).bind(impl.inherited_from, framework_id, impl.control_id, org.id).first();
    if (!source) continue;

    await env.DB.prepare(
      `UPDATE control_implementations SET status = ?, implementation_description = ?, responsible_role = ?, ai_narrative = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(source.status, source.implementation_description, source.responsible_role, source.ai_narrative, impl.id).run();
    synced++;
  }

  await auditLog(env, org.id, user.id, 'sync_inherited', 'control_implementation', framework_id, { system_id, count: synced });
  return jsonResponse({ synced_count: synced });
}

async function handleApplyBaseline(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { system_id, framework_id, overwrite } = await request.json();
  if (!system_id || !framework_id) return jsonResponse({ error: 'system_id and framework_id required' }, 400);

  // Get all controls for this framework
  const { results: controls } = await env.DB.prepare(
    'SELECT control_id, title, description FROM security_controls WHERE framework_id = ?'
  ).bind(framework_id).all();

  // Get existing implementations
  const { results: existing } = await env.DB.prepare(
    'SELECT control_id FROM control_implementations WHERE system_id = ? AND framework_id = ? AND org_id = ?'
  ).bind(system_id, framework_id, org.id).all();
  const existingSet = new Set(existing.map(e => e.control_id));

  let applied = 0;
  let skipped = 0;

  for (const ctrl of controls) {
    if (!overwrite && existingSet.has(ctrl.control_id)) {
      skipped++;
      continue;
    }

    // Generate a baseline description from the control's title and description
    const baselineDesc = generateBaselineDescription(ctrl);
    const id = generateId();

    if (existingSet.has(ctrl.control_id)) {
      // Update existing — only fill empty fields
      await env.DB.prepare(
        `UPDATE control_implementations SET
          implementation_description = CASE WHEN implementation_description IS NULL OR implementation_description = '' THEN ? ELSE implementation_description END,
          responsible_role = CASE WHEN responsible_role IS NULL OR responsible_role = '' THEN ? ELSE responsible_role END,
          updated_at = datetime('now')
        WHERE system_id = ? AND framework_id = ? AND control_id = ? AND org_id = ?`
      ).bind(baselineDesc, getBaselineRole(ctrl.control_id), system_id, framework_id, ctrl.control_id, org.id).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'planned', ?, ?, datetime('now'), datetime('now'))`
      ).bind(id, org.id, system_id, framework_id, ctrl.control_id, baselineDesc, getBaselineRole(ctrl.control_id)).run();
    }
    applied++;
  }

  await auditLog(env, org.id, user.id, 'create', 'baseline_import', framework_id, { applied, skipped, system_id });
  return jsonResponse({ applied, skipped, total: controls.length });
}

function generateBaselineDescription(ctrl) {
  const id = ctrl.control_id.toUpperCase();
  const title = ctrl.title || '';
  const desc = ctrl.description || '';
  // Create a professional baseline statement
  return `The organization implements ${title || id} in accordance with organizational security policies. ${desc ? 'This control addresses: ' + desc.substring(0, 200) + (desc.length > 200 ? '...' : '') : ''} Implementation details should be customized to reflect the specific system environment and operational context.`;
}

function getBaselineRole(controlId) {
  const family = controlId.split('-')[0].toLowerCase();
  const roleMap = {
    'ac': 'System Administrator',
    'at': 'Security Training Coordinator',
    'au': 'System Administrator',
    'ca': 'Information System Security Officer (ISSO)',
    'cm': 'Configuration Manager',
    'cp': 'Contingency Planning Coordinator',
    'ia': 'System Administrator',
    'ir': 'Incident Response Team',
    'ma': 'System Administrator',
    'mp': 'Physical Security Officer',
    'pe': 'Physical Security Officer',
    'pl': 'Information System Security Officer (ISSO)',
    'pm': 'Program Manager',
    'ps': 'Human Resources',
    'pt': 'Privacy Officer',
    'ra': 'Risk Assessment Team',
    'sa': 'System Developer / Architect',
    'sc': 'Network Administrator',
    'si': 'System Administrator',
    'sr': 'Supply Chain Risk Manager',
  };
  return roleMap[family] || 'Information System Security Officer (ISSO)';
}

// ============================================================================
// DASHBOARD ANALYTICS (Feature 6)
// ============================================================================

async function handleFrameworkStats(env, org) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT ci.framework_id, cf.name as framework_name, ci.status, COUNT(*) as count
       FROM control_implementations ci
       JOIN compliance_frameworks cf ON cf.id = ci.framework_id
       WHERE ci.org_id = ? GROUP BY ci.framework_id, ci.status ORDER BY cf.name, ci.status`
    ).bind(org.id).all();
    const { results: gaps } = await env.DB.prepare(
      `SELECT ci.framework_id, sc.family, COUNT(*) as gap_count
       FROM control_implementations ci
       JOIN security_controls sc ON sc.framework_id = ci.framework_id AND sc.control_id = ci.control_id
       WHERE ci.org_id = ? AND ci.status = 'not_implemented'
       GROUP BY ci.framework_id, sc.family ORDER BY gap_count DESC`
    ).bind(org.id).all();
    return jsonResponse({ framework_stats: results, gap_analysis: gaps });
  } catch (err) {
    console.error('[handleFrameworkStats]', err.message);
    return jsonResponse({ error: 'Failed to load framework stats' }, 500);
  }
}

async function handleCreateComplianceSnapshot(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const today = new Date().toISOString().split('T')[0];
  const weights = getOrgScoringWeights(org);

  // Gather all data in parallel
  const [implsRes, poamsRes, overdueRes, evidenceRes, risksRes, monitoringRes] = await Promise.all([
    env.DB.prepare(
      'SELECT system_id, framework_id, status, COUNT(*) as count FROM control_implementations WHERE org_id = ? GROUP BY system_id, framework_id, status'
    ).bind(org.id).all(),
    env.DB.prepare(
      'SELECT system_id, status, COUNT(*) as count FROM poams WHERE org_id = ? GROUP BY system_id, status'
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, COUNT(*) as count FROM poams WHERE org_id = ? AND status NOT IN ('completed','accepted','deferred') AND scheduled_completion < ? GROUP BY system_id`
    ).bind(org.id, today).all(),
    env.DB.prepare(
      `SELECT ci.system_id, ci.framework_id, COUNT(DISTINCT ecl.implementation_id) as covered, COUNT(DISTINCT ci.id) as applicable
       FROM control_implementations ci LEFT JOIN evidence_control_links ecl ON ecl.implementation_id = ci.id
       WHERE ci.org_id = ? AND ci.status != 'not_applicable' GROUP BY ci.system_id, ci.framework_id`
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, risk_level, COUNT(*) as count FROM risks WHERE org_id = ? AND status != 'closed' AND system_id IS NOT NULL GROUP BY system_id, risk_level`
    ).bind(org.id).all(),
    env.DB.prepare(
      'SELECT system_id, last_result, COUNT(*) as count FROM monitoring_checks WHERE org_id = ? AND is_active = 1 GROUP BY system_id, last_result'
    ).bind(org.id).all(),
  ]);

  // Index control implementations
  const combos = {};
  for (const row of implsRes.results) {
    const key = `${row.system_id}|${row.framework_id}`;
    if (!combos[key]) combos[key] = { system_id: row.system_id, framework_id: row.framework_id, total: 0, implemented: 0, partially_implemented: 0, planned: 0, not_applicable: 0, not_implemented: 0 };
    combos[key][row.status] = (combos[key][row.status] || 0) + row.count;
    combos[key].total += row.count;
  }

  // Index POA&Ms by system
  const poamBySys = {};
  for (const r of poamsRes.results) {
    if (!poamBySys[r.system_id]) poamBySys[r.system_id] = { open: 0, in_progress: 0, completed: 0, overdue: 0 };
    if (r.status === 'open') poamBySys[r.system_id].open += r.count;
    else if (r.status === 'in_progress') poamBySys[r.system_id].in_progress += r.count;
    else if (r.status === 'completed' || r.status === 'accepted') poamBySys[r.system_id].completed += r.count;
  }
  for (const r of overdueRes.results) {
    if (!poamBySys[r.system_id]) poamBySys[r.system_id] = { open: 0, in_progress: 0, completed: 0, overdue: 0 };
    poamBySys[r.system_id].overdue = r.count;
  }

  // Index evidence, risks, monitoring
  const evidByKey = {};
  for (const r of evidenceRes.results) evidByKey[`${r.system_id}|${r.framework_id}`] = { covered: r.covered, applicable: r.applicable };
  const riskBySys = {};
  for (const r of risksRes.results) {
    if (!riskBySys[r.system_id]) riskBySys[r.system_id] = { critical: 0, high: 0, moderate: 0, low: 0 };
    riskBySys[r.system_id][r.risk_level] = r.count;
  }
  const monBySys = {};
  for (const r of monitoringRes.results) {
    if (!monBySys[r.system_id]) monBySys[r.system_id] = { pass: 0, total: 0 };
    if (r.last_result === 'pass') monBySys[r.system_id].pass += r.count;
    monBySys[r.system_id].total += r.count;
  }

  let inserted = 0;
  for (const c of Object.values(combos)) {
    const pct = c.total > 0 ? Math.round(((c.implemented + c.not_applicable) / c.total) * 100) : 0;
    const key = `${c.system_id}|${c.framework_id}`;
    const poam = poamBySys[c.system_id] || { open: 0, in_progress: 0, completed: 0, overdue: 0 };
    const evid = evidByKey[key] || { covered: 0, applicable: c.total - c.not_applicable };
    const risk = riskBySys[c.system_id] || { critical: 0, high: 0, moderate: 0, low: 0 };
    const mon = monBySys[c.system_id] || { pass: 0, total: 0 };

    const scoreResult = computeComplianceScore({
      controls: { implemented: c.implemented, partially: c.partially_implemented, planned: c.planned, na: c.not_applicable, not_impl: c.not_implemented, total: c.total },
      poams: poam, evidence: evid, risks: risk, monitoring: mon,
    }, weights);

    const metadata = JSON.stringify({ score: scoreResult.score, grade: scoreResult.grade, dimensions: scoreResult.dimensions });

    await env.DB.prepare(
      `INSERT OR REPLACE INTO compliance_snapshots (id, org_id, system_id, framework_id, snapshot_date, total_controls, implemented, partially_implemented, planned, not_applicable, not_implemented, compliance_percentage, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(generateId(), org.id, c.system_id, c.framework_id, today, c.total, c.implemented, c.partially_implemented, c.planned, c.not_applicable, c.not_implemented, pct, metadata).run();
    inserted++;
  }
  await auditLog(env, org.id, user.id, 'create_snapshot', 'compliance_snapshot', today, { count: inserted });
  for (const c of Object.values(combos)) {
    const pct = c.total > 0 ? Math.round(((c.implemented + c.not_applicable) / c.total) * 100) : 0;
    if (pct < 70) await notifyOrgRole(env, org.id, user.id, 'admin', 'compliance_alert', 'Compliance Below Threshold', 'Compliance at ' + pct + '% (below 70% threshold)', 'compliance_snapshot', c.framework_id, { percentage: pct });
  }
  return jsonResponse({ message: `Created ${inserted} snapshots for ${today}` }, 201);
}

async function handleGetComplianceTrends(env, url, org) {
  try {
    const systemId = url.searchParams.get('system_id');
    const frameworkId = url.searchParams.get('framework_id');
    const days = parseInt(url.searchParams.get('days') || '30');
    let query = `SELECT cs.*, cf.name as framework_name, s.name as system_name FROM compliance_snapshots cs
      LEFT JOIN compliance_frameworks cf ON cf.id = cs.framework_id LEFT JOIN systems s ON s.id = cs.system_id
      WHERE cs.org_id = ? AND cs.snapshot_date >= date('now', ?)`;
    const params = [org.id, `-${days} days`];
    if (systemId) { query += ' AND cs.system_id = ?'; params.push(systemId); }
    if (frameworkId) { query += ' AND cs.framework_id = ?'; params.push(frameworkId); }
    query += ' ORDER BY cs.snapshot_date ASC';
    const { results } = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse({ trends: results });
  } catch (err) {
    console.error('[handleGetComplianceTrends]', err.message);
    return jsonResponse({ error: 'Failed to load compliance trends' }, 500);
  }
}

// ============================================================================
// COMPLIANCE SCORING ENDPOINTS
// ============================================================================

async function handleComplianceScores(env, url, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  try {
  const systemFilter = url.searchParams.get('system_id');
  const frameworkFilter = url.searchParams.get('framework_id');
  const weights = getOrgScoringWeights(org);
  const today = new Date().toISOString().split('T')[0];

  // Parallel queries for all scoring dimensions
  const [
    systemsRes, frameworksRes, controlsRes, poamsRes, overdueRes,
    evidenceRes, risksRes, monitoringRes, latestSnapshots
  ] = await Promise.all([
    env.DB.prepare('SELECT id, name, acronym FROM systems WHERE org_id = ? ORDER BY name').bind(org.id).all(),
    env.DB.prepare(
      `SELECT DISTINCT cf.id, cf.name FROM compliance_frameworks cf
       JOIN organization_frameworks of2 ON of2.framework_id = cf.id
       WHERE of2.org_id = ? AND of2.enabled = 1 ORDER BY cf.name`
    ).bind(org.id).all(),
    env.DB.prepare(
      'SELECT system_id, framework_id, status, COUNT(*) as count FROM control_implementations WHERE org_id = ? GROUP BY system_id, framework_id, status'
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, status, COUNT(*) as count FROM poams WHERE org_id = ? GROUP BY system_id, status`
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, COUNT(*) as count FROM poams WHERE org_id = ? AND status NOT IN ('completed','accepted','deferred') AND scheduled_completion < ? GROUP BY system_id`
    ).bind(org.id, today).all(),
    env.DB.prepare(
      `SELECT ci.system_id, ci.framework_id, COUNT(DISTINCT ecl.implementation_id) as covered,
              COUNT(DISTINCT ci.id) as applicable
       FROM control_implementations ci
       LEFT JOIN evidence_control_links ecl ON ecl.implementation_id = ci.id
       WHERE ci.org_id = ? AND ci.status != 'not_applicable'
       GROUP BY ci.system_id, ci.framework_id`
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, risk_level, COUNT(*) as count FROM risks WHERE org_id = ? AND status != 'closed' AND system_id IS NOT NULL GROUP BY system_id, risk_level`
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, last_result, COUNT(*) as count FROM monitoring_checks WHERE org_id = ? AND is_active = 1 GROUP BY system_id, last_result`
    ).bind(org.id).all(),
    env.DB.prepare(
      `SELECT system_id, framework_id, metadata FROM compliance_snapshots WHERE org_id = ? AND snapshot_date = (SELECT MAX(snapshot_date) FROM compliance_snapshots WHERE org_id = ?)`
    ).bind(org.id, org.id).all(),
  ]);

  // Index all data by system_id (and framework_id where applicable)
  const ctrlByKey = {};
  for (const r of controlsRes.results) {
    const key = `${r.system_id}|${r.framework_id}`;
    if (!ctrlByKey[key]) ctrlByKey[key] = { implemented: 0, partially: 0, planned: 0, na: 0, not_impl: 0, total: 0 };
    const s = ctrlByKey[key];
    if (r.status === 'implemented') s.implemented += r.count;
    else if (r.status === 'partially_implemented') s.partially += r.count;
    else if (r.status === 'planned') s.planned += r.count;
    else if (r.status === 'not_applicable') s.na += r.count;
    else if (r.status === 'not_implemented') s.not_impl += r.count;
    else if (r.status === 'alternative') s.implemented += r.count; // treat alternative as implemented
    s.total += r.count;
  }

  const poamBySys = {};
  for (const r of poamsRes.results) {
    if (!poamBySys[r.system_id]) poamBySys[r.system_id] = { open: 0, in_progress: 0, completed: 0, overdue: 0 };
    const p = poamBySys[r.system_id];
    if (r.status === 'open') p.open += r.count;
    else if (r.status === 'in_progress') p.in_progress += r.count;
    else if (r.status === 'completed' || r.status === 'accepted') p.completed += r.count;
  }
  for (const r of overdueRes.results) {
    if (poamBySys[r.system_id]) poamBySys[r.system_id].overdue = r.count;
    else poamBySys[r.system_id] = { open: 0, in_progress: 0, completed: 0, overdue: r.count };
  }

  const evidByKey = {};
  for (const r of evidenceRes.results) {
    evidByKey[`${r.system_id}|${r.framework_id}`] = { covered: r.covered, applicable: r.applicable };
  }

  const riskBySys = {};
  for (const r of risksRes.results) {
    if (!riskBySys[r.system_id]) riskBySys[r.system_id] = { critical: 0, high: 0, moderate: 0, low: 0 };
    riskBySys[r.system_id][r.risk_level] = r.count;
  }

  const monBySys = {};
  for (const r of monitoringRes.results) {
    if (!monBySys[r.system_id]) monBySys[r.system_id] = { pass: 0, total: 0 };
    if (r.last_result === 'pass') monBySys[r.system_id].pass += r.count;
    monBySys[r.system_id].total += r.count;
  }

  const prevByKey = {};
  for (const r of latestSnapshots.results) {
    try {
      const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {});
      if (meta.score != null) prevByKey[`${r.system_id}|${r.framework_id}`] = meta.score;
    } catch {}
  }

  const systemMap = {};
  for (const s of systemsRes.results) systemMap[s.id] = s;
  const fwMap = {};
  for (const f of frameworksRes.results) fwMap[f.id] = f;

  // Compute per system×framework scores
  const scores = [];
  const orgTotals = { controls: { implemented: 0, partially: 0, planned: 0, na: 0, not_impl: 0, total: 0 },
    poams: { open: 0, in_progress: 0, completed: 0, overdue: 0 },
    evidence: { covered: 0, applicable: 0 },
    risks: { critical: 0, high: 0, moderate: 0, low: 0 },
    monitoring: { pass: 0, total: 0 } };

  for (const sys of systemsRes.results) {
    if (systemFilter && sys.id !== systemFilter) continue;
    for (const fw of frameworksRes.results) {
      if (frameworkFilter && fw.id !== frameworkFilter) continue;
      const key = `${sys.id}|${fw.id}`;
      const ctrl = ctrlByKey[key] || { implemented: 0, partially: 0, planned: 0, na: 0, not_impl: 0, total: 0 };
      if (ctrl.total === 0) continue; // skip combos with no controls

      const poam = poamBySys[sys.id] || { open: 0, in_progress: 0, completed: 0, overdue: 0 };
      const evid = evidByKey[key] || { covered: 0, applicable: ctrl.total - ctrl.na };
      const risk = riskBySys[sys.id] || { critical: 0, high: 0, moderate: 0, low: 0 };
      const mon = monBySys[sys.id] || { pass: 0, total: 0 };

      const result = computeComplianceScore({ controls: ctrl, poams: poam, evidence: evid, risks: risk, monitoring: mon }, weights);

      scores.push({
        system_id: sys.id, system_name: sys.name, system_acronym: sys.acronym,
        framework_id: fw.id, framework_name: fw.name,
        score: result.score, grade: result.grade, dimensions: result.dimensions,
        previous_score: prevByKey[key] ?? null,
      });

      // Accumulate org totals
      orgTotals.controls.implemented += ctrl.implemented;
      orgTotals.controls.partially += ctrl.partially;
      orgTotals.controls.planned += ctrl.planned;
      orgTotals.controls.na += ctrl.na;
      orgTotals.controls.not_impl += ctrl.not_impl;
      orgTotals.controls.total += ctrl.total;
      orgTotals.poams.open += poam.open;
      orgTotals.poams.in_progress += poam.in_progress;
      orgTotals.poams.completed += poam.completed;
      orgTotals.poams.overdue += poam.overdue;
      orgTotals.evidence.covered += evid.covered;
      orgTotals.evidence.applicable += evid.applicable;
      orgTotals.risks.critical += risk.critical;
      orgTotals.risks.high += risk.high;
      orgTotals.risks.moderate += risk.moderate;
      orgTotals.risks.low += risk.low;
      orgTotals.monitoring.pass += mon.pass;
      orgTotals.monitoring.total += mon.total;
    }
  }

  // Deduplicate org risk/poam/monitoring (they're per-system, not per-system×framework)
  // Use system-level for org aggregate
  const seenSystems = new Set();
  const orgDedupe = { poams: { open: 0, in_progress: 0, completed: 0, overdue: 0 },
    risks: { critical: 0, high: 0, moderate: 0, low: 0 }, monitoring: { pass: 0, total: 0 } };
  for (const sys of systemsRes.results) {
    if (systemFilter && sys.id !== systemFilter) continue;
    if (seenSystems.has(sys.id)) continue;
    seenSystems.add(sys.id);
    const poam = poamBySys[sys.id] || { open: 0, in_progress: 0, completed: 0, overdue: 0 };
    orgDedupe.poams.open += poam.open;
    orgDedupe.poams.in_progress += poam.in_progress;
    orgDedupe.poams.completed += poam.completed;
    orgDedupe.poams.overdue += poam.overdue;
    const risk = riskBySys[sys.id] || { critical: 0, high: 0, moderate: 0, low: 0 };
    orgDedupe.risks.critical += risk.critical;
    orgDedupe.risks.high += risk.high;
    orgDedupe.risks.moderate += risk.moderate;
    orgDedupe.risks.low += risk.low;
    const mon = monBySys[sys.id] || { pass: 0, total: 0 };
    orgDedupe.monitoring.pass += mon.pass;
    orgDedupe.monitoring.total += mon.total;
  }

  const orgScore = computeComplianceScore({
    controls: orgTotals.controls,
    poams: orgDedupe.poams,
    evidence: orgTotals.evidence,
    risks: orgDedupe.risks,
    monitoring: orgDedupe.monitoring,
  }, weights);

  return jsonResponse({ scores, org_score: orgScore, weights });
  } catch (err) {
    console.error('[handleComplianceScores]', err.message);
    return jsonResponse({ error: 'Failed to load compliance scores' }, 500);
  }
}

async function handleGetScoreConfig(env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const weights = getOrgScoringWeights(org);
  return jsonResponse({ weights, defaults: DEFAULT_SCORE_WEIGHTS });
}

async function handleUpdateScoreConfig(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { weights } = body;
  if (!weights || typeof weights !== 'object') return jsonResponse({ error: 'weights object required' }, 400);

  const required = ['control', 'poam', 'evidence', 'risk', 'monitoring'];
  for (const k of required) {
    if (typeof weights[k] !== 'number' || weights[k] < 0 || weights[k] > 1) {
      return jsonResponse({ error: `Invalid weight for ${k}: must be a number between 0 and 1` }, 400);
    }
  }

  const sum = required.reduce((s, k) => s + weights[k], 0);
  if (Math.abs(sum - 1.0) > 0.02) {
    return jsonResponse({ error: `Weights must sum to 1.0 (currently ${sum.toFixed(2)})` }, 400);
  }

  // Normalize to exactly 1.0
  const normalized = {};
  for (const k of required) normalized[k] = Math.round((weights[k] / sum) * 100) / 100;
  const normSum = required.reduce((s, k) => s + normalized[k], 0);
  if (normSum !== 1.0) normalized[required[0]] += Math.round((1.0 - normSum) * 100) / 100;

  // Save to org metadata
  let meta = {};
  try { meta = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {}); } catch {}
  meta.scoring_weights = normalized;

  await env.DB.prepare('UPDATE organizations SET settings = ? WHERE id = ?')
    .bind(JSON.stringify(meta), org.id).run();

  await auditLog(env, org.id, user.id, 'update_score_config', 'organization', org.id, { weights: normalized });

  return jsonResponse({ weights: normalized, message: 'Scoring weights updated' });
}

// ============================================================================
// COMPLIANCE CALENDAR
// ============================================================================

async function handleCalendarEvents(env, url, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
  defaultStart.setDate(defaultStart.getDate() - 7);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  defaultEnd.setDate(defaultEnd.getDate() + 14);

  const start = url.searchParams.get('start') || defaultStart.toISOString().split('T')[0];
  const end = url.searchParams.get('end') || defaultEnd.toISOString().split('T')[0];

  const [poams, evidenceSchedules, auditTasks, systems, vendorAssessments, vendorContracts, risks] = await Promise.all([
    env.DB.prepare(
      `SELECT id, weakness_name AS title, scheduled_completion, status, risk_level, system_id
       FROM poams WHERE org_id = ? AND scheduled_completion BETWEEN ? AND ?
       AND status NOT IN ('completed','accepted')`
    ).bind(org.id, start, end).all(),
    env.DB.prepare(
      `SELECT id, title, next_due_date, cadence, owner_user_id
       FROM evidence_schedules WHERE org_id = ? AND next_due_date BETWEEN ? AND ?
       AND is_active = 1`
    ).bind(org.id, start, end).all(),
    env.DB.prepare(
      `SELECT id, title, due_date, category
       FROM audit_checklist_items WHERE org_id = ? AND due_date BETWEEN ? AND ?
       AND completed = 0`
    ).bind(org.id, start, end).all(),
    env.DB.prepare(
      `SELECT id, name, authorization_expiry, status, acronym
       FROM systems WHERE org_id = ? AND authorization_expiry BETWEEN ? AND ?`
    ).bind(org.id, start, end).all(),
    env.DB.prepare(
      `SELECT id, name, next_assessment_date, criticality, risk_tier
       FROM vendors WHERE org_id = ? AND next_assessment_date BETWEEN ? AND ?
       AND status = 'active'`
    ).bind(org.id, start, end).all(),
    env.DB.prepare(
      `SELECT id, name, contract_end, criticality
       FROM vendors WHERE org_id = ? AND contract_end BETWEEN ? AND ?
       AND status = 'active'`
    ).bind(org.id, start, end).all(),
    env.DB.prepare(
      `SELECT id, title, treatment_due_date, risk_level, status
       FROM risks WHERE org_id = ? AND treatment_due_date BETWEEN ? AND ?
       AND status NOT IN ('closed','accepted')`
    ).bind(org.id, start, end).all(),
  ]);

  const events = [];

  for (const r of poams.results) {
    events.push({ id: r.id, type: 'poam', name: r.title, date: r.scheduled_completion,
      meta: { status: r.status, risk_level: r.risk_level, system_id: r.system_id } });
  }
  for (const r of evidenceSchedules.results) {
    events.push({ id: r.id, type: 'evidence_schedule', name: r.title, date: r.next_due_date,
      meta: { cadence: r.cadence, owner_user_id: r.owner_user_id } });
  }
  for (const r of auditTasks.results) {
    events.push({ id: r.id, type: 'audit_task', name: r.title, date: r.due_date,
      meta: { category: r.category } });
  }
  for (const r of systems.results) {
    events.push({ id: r.id, type: 'ato_expiry', name: r.acronym ? `${r.name} (${r.acronym})` : r.name, date: r.authorization_expiry,
      meta: { status: r.status } });
  }
  for (const r of vendorAssessments.results) {
    events.push({ id: r.id, type: 'vendor_assessment', name: r.name, date: r.next_assessment_date,
      meta: { criticality: r.criticality, risk_tier: r.risk_tier } });
  }
  for (const r of vendorContracts.results) {
    events.push({ id: `${r.id}_contract`, type: 'vendor_contract', name: r.name, date: r.contract_end,
      meta: { criticality: r.criticality } });
  }
  for (const r of risks.results) {
    events.push({ id: r.id, type: 'risk_treatment', name: r.title, date: r.treatment_due_date,
      meta: { risk_level: r.risk_level, status: r.status } });
  }

  // Policy review dates
  try {
    const policyReviews = await env.DB.prepare(
      "SELECT id, title, review_date, category FROM policies WHERE org_id = ? AND status = 'published' AND review_date BETWEEN ? AND ?"
    ).bind(org.id, start, end).all();
    for (const r of policyReviews.results) {
      events.push({ id: `policy-${r.id}`, type: 'policy_review', name: r.title, date: r.review_date,
        meta: { category: r.category } });
    }
  } catch (e) { /* policies table may not exist yet */ }

  events.sort((a, b) => a.date.localeCompare(b.date));

  return jsonResponse({ events });
}

// ============================================================================
// BULK IMPORT
// ============================================================================

async function handleBulkImportSystems(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { rows } = await request.json();
  if (!Array.isArray(rows) || rows.length === 0) return jsonResponse({ error: 'rows array is required' }, 400);
  if (rows.length > 200) return jsonResponse({ error: 'Maximum 200 rows per import' }, 400);

  const { count } = await env.DB.prepare('SELECT COUNT(*) as count FROM systems WHERE org_id = ?').bind(org.id).first();
  if (count + rows.length > (org.max_systems || 50)) {
    return jsonResponse({ error: `Would exceed system limit (${org.max_systems || 50}). Current: ${count}, importing: ${rows.length}` }, 400);
  }

  const validImpact = ['low', 'moderate', 'high'];
  const validDeploy = ['cloud', 'on_premises', 'hybrid', 'government_cloud'];
  const validService = ['iaas', 'paas', 'saas', 'other'];
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.name || !r.name.trim()) throw new Error('Name is required');
      const il = (r.impact_level || 'moderate').toLowerCase();
      if (!validImpact.includes(il)) throw new Error(`Invalid impact_level: ${r.impact_level}`);
      if (r.deployment_model && !validDeploy.includes(r.deployment_model.toLowerCase())) throw new Error(`Invalid deployment_model: ${r.deployment_model}`);
      if (r.service_model && !validService.includes(r.service_model.toLowerCase())) throw new Error(`Invalid service_model: ${r.service_model}`);
      const id = generateId();
      await env.DB.prepare(
        'INSERT INTO systems (id, org_id, name, acronym, description, impact_level, deployment_model, service_model) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, org.id, r.name.trim(), r.acronym || null, r.description || null, il, r.deployment_model ? r.deployment_model.toLowerCase() : null, r.service_model ? r.service_model.toUpperCase() : null).run();
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'system', null, { count: results.success, failed: results.failed });
  return jsonResponse(results, 201);
}

async function handleBulkImportRisks(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { rows } = await request.json();
  if (!Array.isArray(rows) || rows.length === 0) return jsonResponse({ error: 'rows array is required' }, 400);
  if (rows.length > 200) return jsonResponse({ error: 'Maximum 200 rows per import' }, 400);

  const { results: allSystems } = await env.DB.prepare('SELECT id, name FROM systems WHERE org_id = ?').bind(org.id).all();
  const systemMap = new Map(allSystems.map(s => [s.name.toLowerCase(), s.id]));

  const validCat = ['technical', 'operational', 'compliance', 'financial', 'reputational', 'strategic'];
  const validTreatment = ['accept', 'mitigate', 'transfer', 'avoid'];
  const results = { success: 0, failed: 0, errors: [] };
  const baseTime = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.title || !r.title.trim()) throw new Error('Title is required');
      const likelihood = parseInt(r.likelihood) || 3;
      const impact = parseInt(r.impact) || 3;
      if (likelihood < 1 || likelihood > 5) throw new Error('Likelihood must be 1-5');
      if (impact < 1 || impact > 5) throw new Error('Impact must be 1-5');
      if (r.category && !validCat.includes(r.category.toLowerCase())) throw new Error(`Invalid category: ${r.category}`);
      if (r.treatment && !validTreatment.includes(r.treatment.toLowerCase())) throw new Error(`Invalid treatment: ${r.treatment}`);

      let systemId = null;
      if (r.system && r.system.trim()) {
        systemId = systemMap.get(r.system.trim().toLowerCase());
        if (!systemId) throw new Error(`System not found: "${r.system}"`);
      }

      const score = likelihood * impact;
      const level = score >= 15 ? 'critical' : score >= 10 ? 'high' : score >= 5 ? 'moderate' : 'low';
      const riskId = 'RISK-' + (baseTime + i).toString(36).toUpperCase();
      let relatedControls = null;
      if (r.related_controls && r.related_controls.trim()) {
        relatedControls = JSON.stringify(r.related_controls.split(';').map(s => s.trim()).filter(Boolean));
      }

      const id = generateId();
      await env.DB.prepare(
        'INSERT INTO risks (id, org_id, system_id, risk_id, title, description, category, likelihood, impact, risk_level, treatment, treatment_plan, treatment_due_date, owner, related_controls) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, org.id, systemId, riskId, r.title.trim(), r.description || null, r.category ? r.category.toLowerCase() : null, likelihood, impact, level, r.treatment ? r.treatment.toLowerCase() : 'mitigate', r.treatment_plan || null, r.treatment_due_date || null, r.owner || null, relatedControls).run();
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'risk', null, { count: results.success, failed: results.failed });
  return jsonResponse(results, 201);
}

async function handleBulkImportVendors(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { rows } = await request.json();
  if (!Array.isArray(rows) || rows.length === 0) return jsonResponse({ error: 'rows array is required' }, 400);
  if (rows.length > 200) return jsonResponse({ error: 'Maximum 200 rows per import' }, 400);

  const validCrit = ['low', 'medium', 'high', 'critical'];
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.name || !r.name.trim()) throw new Error('Name is required');
      if (r.criticality && !validCrit.includes(r.criticality.toLowerCase())) throw new Error(`Invalid criticality: ${r.criticality}`);
      const hasBaa = r.has_baa && (r.has_baa.toLowerCase() === 'yes' || r.has_baa === '1') ? 1 : 0;
      const id = generateId();
      await env.DB.prepare(
        'INSERT INTO vendors (id, org_id, name, description, category, criticality, contact_name, contact_email, contract_start, contract_end, data_classification, has_baa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, org.id, r.name.trim(), r.description || null, r.category || null, r.criticality ? r.criticality.toLowerCase() : 'medium', r.contact_name || null, r.contact_email || null, r.contract_start || null, r.contract_end || null, r.data_classification || null, hasBaa).run();
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'vendor', null, { count: results.success, failed: results.failed });
  return jsonResponse(results, 201);
}

async function handleBulkImportPoams(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { rows } = await request.json();
  if (!Array.isArray(rows) || rows.length === 0) return jsonResponse({ error: 'rows array is required' }, 400);
  if (rows.length > 200) return jsonResponse({ error: 'Maximum 200 rows per import' }, 400);

  const { results: allSystems } = await env.DB.prepare('SELECT id, name FROM systems WHERE org_id = ?').bind(org.id).all();
  const systemMap = new Map(allSystems.map(s => [s.name.toLowerCase(), s.id]));
  const { results: allUsers } = await env.DB.prepare('SELECT id, name FROM users WHERE org_id = ?').bind(org.id).all();
  const userMap = new Map(allUsers.map(u => [u.name.toLowerCase(), u.id]));

  const validRisk = ['low', 'moderate', 'high', 'critical'];
  const results = { success: 0, failed: 0, errors: [] };
  const baseTime = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.weakness_name || !r.weakness_name.trim()) throw new Error('Weakness Name is required');
      if (!r.system || !r.system.trim()) throw new Error('System is required');
      const systemId = systemMap.get(r.system.trim().toLowerCase());
      if (!systemId) throw new Error(`System not found: "${r.system}"`);
      if (r.risk_level && !validRisk.includes(r.risk_level.toLowerCase())) throw new Error(`Invalid risk_level: ${r.risk_level}`);

      let assignedTo = null;
      if (r.assigned_to && r.assigned_to.trim()) {
        assignedTo = userMap.get(r.assigned_to.trim().toLowerCase());
        // Don't throw if user not found, just leave null
      }

      const poamId = 'POAM-' + (baseTime + i).toString(36).toUpperCase();
      const id = generateId();
      await env.DB.prepare(
        'INSERT INTO poams (id, org_id, system_id, poam_id, weakness_name, weakness_description, risk_level, status, scheduled_completion, responsible_party, assigned_to, cost_estimate, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, org.id, systemId, poamId, r.weakness_name.trim(), r.weakness_description || null, r.risk_level ? r.risk_level.toLowerCase() : 'moderate', 'draft', r.scheduled_completion || null, r.responsible_party || null, assignedTo, r.cost_estimate ? parseFloat(r.cost_estimate) || null : null, user.id).run();
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'poam', null, { count: results.success, failed: results.failed });
  return jsonResponse(results, 201);
}

async function handleBulkImportImplementations(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { rows, system_id, framework_id } = await request.json();
  if (!system_id || !framework_id) return jsonResponse({ error: 'system_id and framework_id are required' }, 400);
  if (!Array.isArray(rows) || rows.length === 0) return jsonResponse({ error: 'rows array is required' }, 400);
  if (rows.length > 500) return jsonResponse({ error: 'Maximum 500 rows per import' }, 400);

  // Verify system and framework exist
  const sys = await env.DB.prepare('SELECT id FROM systems WHERE id = ? AND org_id = ?').bind(system_id, org.id).first();
  if (!sys) return jsonResponse({ error: 'System not found' }, 404);

  const validStatus = ['implemented', 'partially_implemented', 'planned', 'alternative', 'not_applicable', 'not_implemented'];
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.control_id || !r.control_id.trim()) throw new Error('Control ID is required');
      const status = r.status ? r.status.toLowerCase() : 'not_implemented';
      if (!validStatus.includes(status)) throw new Error(`Invalid status: ${r.status}`);

      const id = generateId();
      await env.DB.prepare(
        `INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role, ai_narrative)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(system_id, framework_id, control_id) DO UPDATE SET
           status = ?, implementation_description = COALESCE(?, implementation_description),
           responsible_role = COALESCE(?, responsible_role), ai_narrative = COALESCE(?, ai_narrative), updated_at = datetime('now')`
      ).bind(id, org.id, system_id, framework_id, r.control_id.trim(), status, r.implementation_description || null, r.responsible_role || null, r.ai_narrative || null,
             status, r.implementation_description || null, r.responsible_role || null, r.ai_narrative || null).run();
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'implementation', null, { system_id, framework_id, count: results.success, failed: results.failed });
  return jsonResponse(results, 201);
}

// ============================================================================
// OSCAL SSP IMPORT
// ============================================================================

async function handleBulkImportOscalSSP(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { system, implementations, framework_id, import_options } = await request.json();
  if (!framework_id) return jsonResponse({ error: 'framework_id is required' }, 400);
  if (!implementations || !Array.isArray(implementations)) return jsonResponse({ error: 'implementations array is required' }, 400);
  if (implementations.length > 1000) return jsonResponse({ error: 'Maximum 1000 implementations per import' }, 400);

  let systemId;
  let systemCreated = false;

  if (import_options?.create_system && system) {
    // Create new system from OSCAL data
    const serviceModelMap = { iaas: 'IaaS', paas: 'PaaS', saas: 'SaaS', other: 'other' };
    systemId = generateId();
    await env.DB.prepare(
      'INSERT INTO systems (id, org_id, name, acronym, description, impact_level, deployment_model, service_model, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      systemId, org.id,
      system.name || 'Imported System',
      system.acronym || null,
      system.description || null,
      system.impact_level || 'moderate',
      system.deployment_model || 'cloud',
      serviceModelMap[(system.service_model || 'saas').toLowerCase()] || 'SaaS',
      'active'
    ).run();
    systemCreated = true;
  } else if (import_options?.existing_system_id) {
    const sys = await env.DB.prepare('SELECT id FROM systems WHERE id = ? AND org_id = ?').bind(import_options.existing_system_id, org.id).first();
    if (!sys) return jsonResponse({ error: 'System not found' }, 404);
    systemId = sys.id;
  } else {
    return jsonResponse({ error: 'Either create_system with system data or existing_system_id is required' }, 400);
  }

  const validStatus = ['implemented', 'partially_implemented', 'planned', 'alternative', 'not_applicable', 'not_implemented'];
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < implementations.length; i++) {
    const r = implementations[i];
    try {
      if (!r.control_id || !r.control_id.trim()) throw new Error('Control ID is required');
      const status = r.status ? r.status.toLowerCase() : 'not_implemented';
      if (!validStatus.includes(status)) throw new Error(`Invalid status: ${r.status}`);

      const id = generateId();
      await env.DB.prepare(
        `INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(system_id, framework_id, control_id) DO UPDATE SET
           status = ?, implementation_description = COALESCE(?, implementation_description),
           responsible_role = COALESCE(?, responsible_role), updated_at = datetime('now')`
      ).bind(
        id, org.id, systemId, framework_id, r.control_id.trim(), status,
        r.implementation_description || null, r.responsible_role || null,
        status, r.implementation_description || null, r.responsible_role || null
      ).run();
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'oscal_ssp', null, { system_id: systemId, system_created: systemCreated, framework_id, count: results.success, failed: results.failed });
  return jsonResponse({ system_created: systemCreated, system_id: systemId, implementations: results }, 201);
}

// ============================================================================
// OSCAL CATALOG IMPORT
// ============================================================================

async function handleBulkImportOscalCatalog(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { framework, controls, import_options } = await request.json();
  if (!controls || !Array.isArray(controls)) return jsonResponse({ error: 'controls array is required' }, 400);
  if (controls.length > 2000) return jsonResponse({ error: 'Maximum 2000 controls per import' }, 400);

  let frameworkId;
  let frameworkCreated = false;

  if (import_options?.create_framework && framework) {
    // Create new framework
    const category = import_options.category || 'federal';
    frameworkId = (framework.name || 'imported').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    // Check if ID already exists
    const existing = await env.DB.prepare('SELECT id FROM compliance_frameworks WHERE id = ?').bind(frameworkId).first();
    if (existing) {
      frameworkId = frameworkId + '-' + Date.now().toString(36);
    }
    await env.DB.prepare(
      'INSERT INTO compliance_frameworks (id, name, version, category, description, control_count) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(frameworkId, framework.name || 'Imported Catalog', framework.version || '1.0', category, `Imported from OSCAL Catalog`, controls.length).run();

    // Enable for org
    await env.DB.prepare(
      'INSERT OR IGNORE INTO organization_frameworks (id, org_id, framework_id, enabled) VALUES (?, ?, ?, 1)'
    ).bind(generateId(), org.id, frameworkId).run();
    frameworkCreated = true;
  } else if (import_options?.existing_framework_id) {
    const fw = await env.DB.prepare('SELECT id FROM compliance_frameworks WHERE id = ?').bind(import_options.existing_framework_id).first();
    if (!fw) return jsonResponse({ error: 'Framework not found' }, 404);
    frameworkId = fw.id;
  } else {
    return jsonResponse({ error: 'Either create_framework with framework data or existing_framework_id is required' }, 400);
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < controls.length; i++) {
    const c = controls[i];
    try {
      if (!c.control_id || !c.control_id.trim()) throw new Error('control_id is required');
      if (!c.title || !c.title.trim()) throw new Error('title is required');

      const id = generateId();
      await env.DB.prepare(
        `INSERT INTO security_controls (id, framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, is_enhancement, parent_control_id, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(framework_id, control_id) DO UPDATE SET
           family = ?, title = ?, description = COALESCE(?, description),
           priority = COALESCE(?, priority), is_enhancement = ?, parent_control_id = ?, sort_order = ?`
      ).bind(
        id, frameworkId, c.control_id.trim(),
        c.family || c.control_id.replace(/-\d+.*$/, ''),
        c.title.trim(), c.description || null,
        c.priority || 'P1',
        c.baseline_low || 0, c.baseline_moderate || 0, c.baseline_high || 0,
        c.is_enhancement || 0, c.parent_control_id || null, c.sort_order || i + 1,
        // ON CONFLICT values
        c.family || c.control_id.replace(/-\d+.*$/, ''),
        c.title.trim(), c.description || null,
        c.priority || 'P1', c.is_enhancement || 0, c.parent_control_id || null, c.sort_order || i + 1
      ).run();
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  // Update control_count
  if (results.success > 0) {
    const { count } = await env.DB.prepare('SELECT COUNT(*) as count FROM security_controls WHERE framework_id = ?').bind(frameworkId).first();
    await env.DB.prepare('UPDATE compliance_frameworks SET control_count = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(count, frameworkId).run();
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'oscal_catalog', null, { framework_id: frameworkId, framework_created: frameworkCreated, count: results.success, failed: results.failed });
  return jsonResponse({ framework_id: frameworkId, framework_created: frameworkCreated, controls: results }, 201);
}

// ============================================================================
// NIST 800-53 CONTROLS CSV IMPORT
// ============================================================================

async function handleBulkImportControls(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { rows, framework_id, system_id, conflict_strategy } = await request.json();
  if (!framework_id) return jsonResponse({ error: 'framework_id is required' }, 400);
  if (!Array.isArray(rows) || rows.length === 0) return jsonResponse({ error: 'rows array is required' }, 400);
  if (rows.length > 500) return jsonResponse({ error: 'Maximum 500 rows per import' }, 400);

  // Verify framework exists
  const fw = await env.DB.prepare('SELECT id FROM compliance_frameworks WHERE id = ?').bind(framework_id).first();
  if (!fw) return jsonResponse({ error: 'Framework not found' }, 404);

  // Optionally verify system
  if (system_id) {
    const sys = await env.DB.prepare('SELECT id FROM systems WHERE id = ? AND org_id = ?').bind(system_id, org.id).first();
    if (!sys) return jsonResponse({ error: 'System not found' }, 404);
  }

  const validStatus = ['implemented', 'partially_implemented', 'planned', 'alternative', 'not_applicable', 'not_implemented'];
  const validPriority = ['p0', 'p1', 'p2', 'p3'];
  const controlResults = { success: 0, failed: 0, errors: [] };
  const implResults = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.control_id || !r.control_id.trim()) throw new Error('Control ID is required');
      if (!r.title || !r.title.trim()) throw new Error('Title is required');
      const priority = r.priority ? r.priority.toUpperCase() : 'P1';
      if (r.priority && !validPriority.includes(r.priority.toLowerCase())) throw new Error(`Invalid priority: ${r.priority}`);

      const controlId = r.control_id.trim().toUpperCase();
      const family = r.family || controlId.replace(/-\d+.*$/, '');
      const isEnhancement = controlId.includes('(') ? 1 : 0;
      const parentId = isEnhancement ? controlId.replace(/\(.*\)/, '').trim() : null;

      const id = generateId();
      await env.DB.prepare(
        `INSERT INTO security_controls (id, framework_id, control_id, family, title, description, priority, is_enhancement, parent_control_id, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(framework_id, control_id) DO UPDATE SET
           family = ?, title = ?, description = COALESCE(?, description), priority = ?, is_enhancement = ?, parent_control_id = ?`
      ).bind(
        id, framework_id, controlId, family, r.title.trim(), r.description || null, priority, isEnhancement, parentId, i + 1,
        family, r.title.trim(), r.description || null, priority, isEnhancement, parentId
      ).run();
      controlResults.success++;

      // If system_id and status provided, also upsert implementation
      if (system_id && r.status) {
        const status = r.status.toLowerCase();
        if (!validStatus.includes(status)) {
          implResults.failed++;
          implResults.errors.push({ row: i + 1, error: `Invalid implementation status: ${r.status}` });
        } else {
          try {
            const implId = generateId();
            await env.DB.prepare(
              `INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(system_id, framework_id, control_id) DO UPDATE SET
                 status = ?, implementation_description = COALESCE(?, implementation_description),
                 responsible_role = COALESCE(?, responsible_role), updated_at = datetime('now')`
            ).bind(
              implId, org.id, system_id, framework_id, controlId, status,
              r.implementation_description || null, r.responsible_role || null,
              status, r.implementation_description || null, r.responsible_role || null
            ).run();
            implResults.success++;
          } catch (implErr) {
            implResults.failed++;
            implResults.errors.push({ row: i + 1, error: implErr.message });
          }
        }
      }
    } catch (err) {
      controlResults.failed++;
      controlResults.errors.push({ row: i + 1, error: err.message });
    }
  }

  // Update control_count
  if (controlResults.success > 0) {
    const { count } = await env.DB.prepare('SELECT COUNT(*) as count FROM security_controls WHERE framework_id = ?').bind(framework_id).first();
    await env.DB.prepare('UPDATE compliance_frameworks SET control_count = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(count, framework_id).run();
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'controls', null, { framework_id, controls: controlResults.success, implementations: implResults.success });
  const response = { controls: controlResults };
  if (system_id) response.implementations = implResults;
  return jsonResponse(response, 201);
}

// ============================================================================
// FEDRAMP / DOD ENHANCED POA&M IMPORT
// ============================================================================

async function handleBulkImportPoamsEnhanced(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { rows } = await request.json();
  if (!Array.isArray(rows) || rows.length === 0) return jsonResponse({ error: 'rows array is required' }, 400);
  if (rows.length > 200) return jsonResponse({ error: 'Maximum 200 rows per import' }, 400);

  const { results: allSystems } = await env.DB.prepare('SELECT id, name FROM systems WHERE org_id = ?').bind(org.id).all();
  const systemMap = new Map(allSystems.map(s => [s.name.toLowerCase(), s.id]));

  const validRisk = ['low', 'moderate', 'high', 'critical', 'very high'];
  const validStatus = ['draft', 'open', 'in_progress', 'verification', 'completed', 'accepted', 'deferred'];
  const results = { success: 0, failed: 0, errors: [] };
  const baseTime = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.weakness_name || !r.weakness_name.trim()) throw new Error('Weakness Name is required');
      if (!r.system || !r.system.trim()) throw new Error('System is required');
      const systemId = systemMap.get(r.system.trim().toLowerCase());
      if (!systemId) throw new Error(`System not found: "${r.system}"`);
      if (r.risk_level && !['low', 'moderate', 'high', 'critical'].includes(r.risk_level.toLowerCase())) throw new Error(`Invalid risk_level: ${r.risk_level}`);
      if (r.original_risk_rating && !validRisk.includes(r.original_risk_rating.toLowerCase())) throw new Error(`Invalid original_risk_rating: ${r.original_risk_rating}`);
      if (r.status && !validStatus.includes(r.status.toLowerCase())) throw new Error(`Invalid status: ${r.status}`);

      const poamId = r.poam_id || ('POAM-' + (baseTime + i).toString(36).toUpperCase());
      const id = generateId();
      await env.DB.prepare(
        'INSERT INTO poams (id, org_id, system_id, poam_id, weakness_name, weakness_description, risk_level, status, scheduled_completion, responsible_party, cost_estimate, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, org.id, systemId, poamId,
        r.weakness_name.trim(),
        r.weakness_description || null,
        r.risk_level ? r.risk_level.toLowerCase() : 'moderate',
        r.status ? r.status.toLowerCase() : 'draft',
        r.scheduled_completion || null,
        r.responsible_party || null,
        r.cost_estimate ? parseFloat(r.cost_estimate) || null : null,
        user.id
      ).run();

      // Insert milestones
      const milestones = r.milestones || [];
      for (const ms of milestones) {
        if (ms.title && ms.title.trim()) {
          await env.DB.prepare(
            'INSERT INTO poam_milestones (id, poam_id, title, target_date) VALUES (?, ?, ?, ?)'
          ).bind(generateId(), id, ms.title.trim(), ms.target_date || null).run();
        }
      }

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_import', 'poam_enhanced', null, { count: results.success, failed: results.failed });
  return jsonResponse(results, 201);
}

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

async function handleCreateApproval(request, env, org, user) {
  const { request_type, resource_id, justification } = await request.json();

  const typeConfig = {
    poam_closure:    { resource_type: 'poam', minRequester: 'analyst', minApprover: 'manager', targetStatuses: ['completed', 'accepted'] },
    risk_acceptance: { resource_type: 'risk', minRequester: 'manager', minApprover: 'admin',  targetStatuses: ['accepted'] },
    ssp_publication: { resource_type: 'ssp',  minRequester: 'manager', minApprover: 'admin',  targetStatuses: ['published'] },
    policy_publication: { resource_type: 'policy', minRequester: 'manager', minApprover: 'admin', targetStatuses: ['published'] },
  };

  const config = typeConfig[request_type];
  if (!config) return jsonResponse({ error: 'Invalid request_type' }, 400);
  if (!resource_id) return jsonResponse({ error: 'resource_id required' }, 400);
  if (!justification || justification.trim().length === 0) return jsonResponse({ error: 'Justification required' }, 400);
  if (!requireRole(user, config.minRequester)) return jsonResponse({ error: 'Forbidden' }, 403);

  let snapshot, target_status;
  if (request_type === 'poam_closure') {
    const resource = await env.DB.prepare('SELECT p.*, s.name as system_name FROM poams p LEFT JOIN systems s ON s.id = p.system_id WHERE p.id = ? AND p.org_id = ?').bind(resource_id, org.id).first();
    if (!resource) return jsonResponse({ error: 'POA&M not found' }, 404);
    if (['completed', 'accepted'].includes(resource.status)) return jsonResponse({ error: 'POA&M is already closed' }, 400);
    snapshot = { poam_id: resource.poam_id, weakness_name: resource.weakness_name, risk_level: resource.risk_level, system_name: resource.system_name, current_status: resource.status };
    target_status = 'completed';
  } else if (request_type === 'risk_acceptance') {
    const resource = await env.DB.prepare('SELECT r.*, s.name as system_name FROM risks r LEFT JOIN systems s ON s.id = r.system_id WHERE r.id = ? AND r.org_id = ?').bind(resource_id, org.id).first();
    if (!resource) return jsonResponse({ error: 'Risk not found' }, 404);
    if (resource.status === 'accepted') return jsonResponse({ error: 'Risk is already accepted' }, 400);
    snapshot = { risk_id: resource.risk_id, title: resource.title, risk_level: resource.risk_level, risk_score: resource.risk_score, system_name: resource.system_name, current_status: resource.status };
    target_status = 'accepted';
  } else if (request_type === 'ssp_publication') {
    const resource = await env.DB.prepare('SELECT d.*, s.name as system_name FROM ssp_documents d LEFT JOIN systems s ON s.id = d.system_id WHERE d.id = ? AND d.org_id = ?').bind(resource_id, org.id).first();
    if (!resource) return jsonResponse({ error: 'SSP not found' }, 404);
    if (resource.status !== 'approved') return jsonResponse({ error: 'SSP must be in approved status to request publication' }, 400);
    snapshot = { title: resource.title, version: resource.version, system_name: resource.system_name, current_status: resource.status };
    target_status = 'published';
  } else if (request_type === 'policy_publication') {
    const resource = await env.DB.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').bind(resource_id, org.id).first();
    if (!resource) return jsonResponse({ error: 'Policy not found' }, 404);
    if (resource.status !== 'approved') return jsonResponse({ error: 'Policy must be in approved status to request publication' }, 400);
    snapshot = { title: resource.title, category: resource.category, version: resource.version, current_status: resource.status };
    target_status = 'published';
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM approval_requests WHERE org_id = ? AND resource_type = ? AND resource_id = ? AND status = 'pending'"
  ).bind(org.id, config.resource_type, resource_id).first();
  if (existing) return jsonResponse({ error: 'A pending approval request already exists for this item' }, 409);

  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO approval_requests (id, org_id, request_type, resource_type, resource_id, requested_by, justification, target_status, snapshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, request_type, config.resource_type, resource_id, user.id, justification.trim(), target_status, JSON.stringify(snapshot)).run();

  await auditLog(env, org.id, user.id, 'create', 'approval_request', id, { request_type, resource_id, target_status }, request);

  const snapshotName = snapshot.weakness_name || snapshot.title || resource_id;
  await notifyOrgRole(env, org.id, user.id, config.minApprover, 'approval_request',
    'Approval Requested',
    `${user.name} requests approval: ${request_type.replace(/_/g, ' ')} for "${snapshotName}"`,
    'approval_request', id, { request_type, resource_id }
  );

  const approval = await env.DB.prepare('SELECT * FROM approval_requests WHERE id = ?').bind(id).first();
  return jsonResponse({ approval: { ...approval, snapshot: JSON.parse(approval.snapshot || '{}') } }, 201);
}

async function handleListApprovals(env, url, org, user) {
  const status = url.searchParams.get('status');
  const requestType = url.searchParams.get('request_type');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  let sql = `SELECT ar.*, u.name as requested_by_name, u.email as requested_by_email, rv.name as reviewer_name
             FROM approval_requests ar
             LEFT JOIN users u ON u.id = ar.requested_by
             LEFT JOIN users rv ON rv.id = ar.reviewer_id
             WHERE ar.org_id = ?`;
  const params = [org.id];

  if (status) { sql += ' AND ar.status = ?'; params.push(status); }
  if (requestType) { sql += ' AND ar.request_type = ?'; params.push(requestType); }

  const countSql = sql.replace(/SELECT ar\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const totalResult = await env.DB.prepare(countSql).bind(...params).first();

  sql += ' ORDER BY ar.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  const approvals = results.map(r => ({ ...r, snapshot: JSON.parse(r.snapshot || '{}') }));

  return jsonResponse({ approvals, total: totalResult?.total || 0, page, limit });
}

async function handlePendingApprovalCount(env, org, user) {
  try {
    let sql = "SELECT COUNT(*) as count FROM approval_requests WHERE org_id = ? AND status = 'pending'";
    const params = [org.id];

    if (requireRole(user, 'admin')) {
      // Admin+ sees all pending
    } else if (requireRole(user, 'manager')) {
      sql += " AND request_type = 'poam_closure'";
    } else {
      return jsonResponse({ count: 0 });
    }

    const result = await env.DB.prepare(sql).bind(...params).first();
    return jsonResponse({ count: result?.count || 0 });
  } catch (err) {
    console.error('[handlePendingApprovalCount]', err.message);
    return jsonResponse({ error: 'Failed to load approval count' }, 500);
  }
}

async function handleApproveRequest(request, env, org, user, approvalId) {
  const approval = await env.DB.prepare('SELECT * FROM approval_requests WHERE id = ? AND org_id = ?').bind(approvalId, org.id).first();
  if (!approval) return jsonResponse({ error: 'Approval request not found' }, 404);
  if (approval.status !== 'pending') return jsonResponse({ error: 'Request is no longer pending' }, 400);
  if (approval.requested_by === user.id) return jsonResponse({ error: 'Cannot approve your own request' }, 403);

  const approverRole = { poam_closure: 'manager', risk_acceptance: 'admin', ssp_publication: 'admin', policy_publication: 'admin' };
  if (!requireRole(user, approverRole[approval.request_type])) return jsonResponse({ error: 'Insufficient role to approve' }, 403);

  const { comment } = await request.json();

  // Auto-execute the underlying action
  if (approval.request_type === 'poam_closure') {
    await env.DB.prepare("UPDATE poams SET status = ?, actual_completion = datetime('now'), updated_at = datetime('now') WHERE id = ? AND org_id = ?")
      .bind(approval.target_status, approval.resource_id, org.id).run();
    await auditLog(env, org.id, user.id, 'status_change', 'poam', approval.resource_id, { from: 'pending_approval', to: approval.target_status, approval_id: approvalId });
  } else if (approval.request_type === 'risk_acceptance') {
    await env.DB.prepare("UPDATE risks SET treatment = 'accept', status = 'accepted', updated_at = datetime('now') WHERE id = ? AND org_id = ?")
      .bind(approval.resource_id, org.id).run();
    await auditLog(env, org.id, user.id, 'status_change', 'risk', approval.resource_id, { from: 'pending_approval', to: 'accepted', approval_id: approvalId });
  } else if (approval.request_type === 'ssp_publication') {
    await env.DB.prepare("UPDATE ssp_documents SET status = 'published', published_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND org_id = ?")
      .bind(approval.resource_id, org.id).run();
    await auditLog(env, org.id, user.id, 'status_change', 'ssp', approval.resource_id, { from: 'approved', to: 'published', approval_id: approvalId });
  } else if (approval.request_type === 'policy_publication') {
    await env.DB.prepare("UPDATE policies SET status = 'published', effective_date = date('now'), updated_at = datetime('now') WHERE id = ? AND org_id = ?")
      .bind(approval.resource_id, org.id).run();
    await auditLog(env, org.id, user.id, 'status_change', 'policy', approval.resource_id, { from: 'approved', to: 'published', approval_id: approvalId });
  }

  await env.DB.prepare(
    "UPDATE approval_requests SET status = 'approved', reviewer_id = ?, reviewed_at = datetime('now'), reviewer_comment = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(user.id, comment || null, approvalId).run();

  await auditLog(env, org.id, user.id, 'approve', 'approval_request', approvalId, { request_type: approval.request_type, resource_id: approval.resource_id }, request);

  const snapshot = JSON.parse(approval.snapshot || '{}');
  await createNotification(env, org.id, approval.requested_by, 'approval_decision',
    'Request Approved',
    `Your ${approval.request_type.replace(/_/g, ' ')} request for "${snapshot.weakness_name || snapshot.title || ''}" was approved by ${user.name}${comment ? ': ' + comment : ''}`,
    'approval_request', approvalId, { decision: 'approved', request_type: approval.request_type, resource_id: approval.resource_id }
  );

  const updated = await env.DB.prepare('SELECT * FROM approval_requests WHERE id = ?').bind(approvalId).first();
  return jsonResponse({ approval: { ...updated, snapshot: JSON.parse(updated.snapshot || '{}') } });
}

async function handleRejectRequest(request, env, org, user, approvalId) {
  const approval = await env.DB.prepare('SELECT * FROM approval_requests WHERE id = ? AND org_id = ?').bind(approvalId, org.id).first();
  if (!approval) return jsonResponse({ error: 'Approval request not found' }, 404);
  if (approval.status !== 'pending') return jsonResponse({ error: 'Request is no longer pending' }, 400);

  const approverRole = { poam_closure: 'manager', risk_acceptance: 'admin', ssp_publication: 'admin', policy_publication: 'admin' };
  if (!requireRole(user, approverRole[approval.request_type])) return jsonResponse({ error: 'Insufficient role to reject' }, 403);

  const { comment } = await request.json();
  if (!comment || comment.trim().length === 0) return jsonResponse({ error: 'Comment is required when rejecting' }, 400);

  await env.DB.prepare(
    "UPDATE approval_requests SET status = 'rejected', reviewer_id = ?, reviewed_at = datetime('now'), reviewer_comment = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(user.id, comment.trim(), approvalId).run();

  await auditLog(env, org.id, user.id, 'reject', 'approval_request', approvalId, { request_type: approval.request_type, resource_id: approval.resource_id, comment: comment.trim() }, request);

  const snapshot = JSON.parse(approval.snapshot || '{}');
  await createNotification(env, org.id, approval.requested_by, 'approval_decision',
    'Request Rejected',
    `Your ${approval.request_type.replace(/_/g, ' ')} request for "${snapshot.weakness_name || snapshot.title || ''}" was rejected by ${user.name}: ${comment.trim()}`,
    'approval_request', approvalId, { decision: 'rejected', request_type: approval.request_type, resource_id: approval.resource_id }
  );

  const updated = await env.DB.prepare('SELECT * FROM approval_requests WHERE id = ?').bind(approvalId).first();
  return jsonResponse({ approval: { ...updated, snapshot: JSON.parse(updated.snapshot || '{}') } });
}

// ============================================================================
// EVIDENCE SCHEDULING & REMINDERS
// ============================================================================

function calculateNextDueDate(cadence, customIntervalDays, fromDate = null) {
  const base = fromDate ? new Date(fromDate) : new Date();
  const next = new Date(base);
  switch (cadence) {
    case 'weekly': next.setDate(base.getDate() + 7); break;
    case 'monthly': next.setMonth(base.getMonth() + 1); break;
    case 'quarterly': next.setMonth(base.getMonth() + 3); break;
    case 'annually': next.setFullYear(base.getFullYear() + 1); break;
    case 'custom':
      if (customIntervalDays) next.setDate(base.getDate() + customIntervalDays);
      break;
  }
  return next.toISOString().split('T')[0];
}

async function handleListEvidenceSchedules(env, org, url) {
  const params = new URL(url).searchParams;
  const owner = params.get('owner');
  const active = params.get('active');

  let query = `SELECT es.*, u.name as owner_name, u.email as owner_email, cu.name as created_by_name
    FROM evidence_schedules es
    LEFT JOIN users u ON u.id = es.owner_user_id
    LEFT JOIN users cu ON cu.id = es.created_by
    WHERE es.org_id = ?`;
  const bindings = [org.id];

  if (owner) { query += ' AND es.owner_user_id = ?'; bindings.push(owner); }
  if (active !== null && active !== undefined && active !== '') { query += ' AND es.is_active = ?'; bindings.push(active === 'true' ? 1 : 0); }

  query += ' ORDER BY es.next_due_date ASC, es.created_at DESC';
  const { results } = await env.DB.prepare(query).bind(...bindings).all();
  for (const s of results) { try { s.control_ids = JSON.parse(s.control_ids || '[]'); } catch { s.control_ids = []; } }
  return jsonResponse({ schedules: results });
}

async function handleCreateEvidenceSchedule(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { title, description, cadence, custom_interval_days, owner_user_id, control_ids } = await request.json();
  if (!title || !cadence || !owner_user_id) return jsonResponse({ error: 'title, cadence, and owner_user_id required' }, 400);
  if (cadence === 'custom' && (!custom_interval_days || custom_interval_days < 1)) return jsonResponse({ error: 'custom_interval_days required for custom cadence' }, 400);

  const nextDueDate = calculateNextDueDate(cadence, custom_interval_days);
  const id = generateId();

  await env.DB.prepare(
    `INSERT INTO evidence_schedules (id, org_id, title, description, cadence, custom_interval_days, owner_user_id, control_ids, next_due_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, title, description || null, cadence, custom_interval_days || null, owner_user_id, JSON.stringify(control_ids || []), nextDueDate, user.id).run();

  await auditLog(env, org.id, user.id, 'create', 'evidence_schedule', id, { title, cadence });

  if (owner_user_id !== user.id) {
    await createNotification(env, org.id, owner_user_id, 'evidence_reminder', 'Evidence Schedule Assigned',
      `You were assigned evidence schedule "${title}" (${cadence})`, 'evidence_schedule', id, {});
  }

  const schedule = await env.DB.prepare('SELECT * FROM evidence_schedules WHERE id = ?').bind(id).first();
  if (schedule) { try { schedule.control_ids = JSON.parse(schedule.control_ids || '[]'); } catch { schedule.control_ids = []; } }
  return jsonResponse({ schedule }, 201);
}

async function handleGetEvidenceSchedule(env, org, scheduleId) {
  const schedule = await env.DB.prepare(
    `SELECT es.*, u.name as owner_name, u.email as owner_email
     FROM evidence_schedules es LEFT JOIN users u ON u.id = es.owner_user_id
     WHERE es.id = ? AND es.org_id = ?`
  ).bind(scheduleId, org.id).first();
  if (!schedule) return jsonResponse({ error: 'Schedule not found' }, 404);
  try { schedule.control_ids = JSON.parse(schedule.control_ids || '[]'); } catch { schedule.control_ids = []; }
  return jsonResponse({ schedule });
}

async function handleUpdateEvidenceSchedule(request, env, org, user, scheduleId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const schedule = await env.DB.prepare('SELECT * FROM evidence_schedules WHERE id = ? AND org_id = ?').bind(scheduleId, org.id).first();
  if (!schedule) return jsonResponse({ error: 'Schedule not found' }, 404);

  const body = await request.json();
  const fields = ['title', 'description', 'cadence', 'custom_interval_days', 'owner_user_id', 'control_ids', 'is_active'];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(field === 'control_ids' ? JSON.stringify(body[field]) : body[field]);
    }
  }

  if (body.cadence || body.custom_interval_days) {
    const newCadence = body.cadence || schedule.cadence;
    const newInterval = body.custom_interval_days || schedule.custom_interval_days;
    updates.push('next_due_date = ?');
    values.push(calculateNextDueDate(newCadence, newInterval));
  }

  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push("updated_at = datetime('now')");
  values.push(scheduleId);

  await env.DB.prepare(`UPDATE evidence_schedules SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  await auditLog(env, org.id, user.id, 'update', 'evidence_schedule', scheduleId, body);

  const updated = await env.DB.prepare('SELECT * FROM evidence_schedules WHERE id = ?').bind(scheduleId).first();
  if (updated) { try { updated.control_ids = JSON.parse(updated.control_ids || '[]'); } catch { updated.control_ids = []; } }
  return jsonResponse({ schedule: updated });
}

async function handleDeleteEvidenceSchedule(env, org, user, scheduleId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const schedule = await env.DB.prepare('SELECT * FROM evidence_schedules WHERE id = ? AND org_id = ?').bind(scheduleId, org.id).first();
  if (!schedule) return jsonResponse({ error: 'Schedule not found' }, 404);
  await env.DB.prepare('DELETE FROM evidence_schedules WHERE id = ?').bind(scheduleId).run();
  await auditLog(env, org.id, user.id, 'delete', 'evidence_schedule', scheduleId, { title: schedule.title });
  return jsonResponse({ message: 'Schedule deleted' });
}

async function handleCompleteEvidenceSchedule(request, env, org, user, scheduleId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const schedule = await env.DB.prepare('SELECT * FROM evidence_schedules WHERE id = ? AND org_id = ?').bind(scheduleId, org.id).first();
  if (!schedule) return jsonResponse({ error: 'Schedule not found' }, 404);

  const body = await request.json().catch(() => ({}));
  const nextDueDate = calculateNextDueDate(schedule.cadence, schedule.custom_interval_days);

  await env.DB.prepare(
    "UPDATE evidence_schedules SET last_completed_date = datetime('now'), next_due_date = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(nextDueDate, scheduleId).run();

  await auditLog(env, org.id, user.id, 'complete', 'evidence_schedule', scheduleId, { evidence_id: body.evidence_id || null, next_due_date: nextDueDate });

  const updated = await env.DB.prepare('SELECT * FROM evidence_schedules WHERE id = ?').bind(scheduleId).first();
  if (updated) { try { updated.control_ids = JSON.parse(updated.control_ids || '[]'); } catch { updated.control_ids = []; } }
  return jsonResponse({ schedule: updated });
}

async function handleEvidenceScheduleStats(env, org) {
  try {
    const { results: schedules } = await env.DB.prepare(
      'SELECT next_due_date FROM evidence_schedules WHERE org_id = ? AND is_active = 1'
    ).bind(org.id).all();

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    let overdue = 0, dueThisWeek = 0, dueThisMonth = 0;
    for (const s of schedules) {
      if (s.next_due_date < today) overdue++;
      else if (s.next_due_date <= nextWeekStr) dueThisWeek++;
      else if (s.next_due_date <= nextMonthStr) dueThisMonth++;
    }

    return jsonResponse({ stats: { total: schedules.length, overdue, due_this_week: dueThisWeek, due_this_month: dueThisMonth } });
  } catch (err) {
    console.error('[handleEvidenceScheduleStats]', err.message);
    return jsonResponse({ error: 'Failed to load schedule stats' }, 500);
  }
}

// ============================================================================
// SCHEDULED WORKER - DAILY EVIDENCE CHECKS
// ============================================================================

async function handleScheduledEvidenceChecks(env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const warningDate = new Date(); warningDate.setDate(warningDate.getDate() + 14);
    const warningDateStr = warningDate.toISOString().split('T')[0];

    console.log('[CRON] Running evidence checks for:', today);

    // 1. Due evidence schedules → notify owner + managers
    const { results: dueSchedules } = await env.DB.prepare(
      `SELECT es.*, u.name as owner_name FROM evidence_schedules es
       LEFT JOIN users u ON u.id = es.owner_user_id
       WHERE es.is_active = 1 AND es.next_due_date <= ?`
    ).bind(today).all();

    console.log(`[CRON] ${dueSchedules.length} due evidence schedules`);

    for (const s of dueSchedules) {
      await createNotification(env, s.org_id, s.owner_user_id, 'evidence_reminder',
        'Evidence Collection Due',
        `Evidence schedule "${s.title}" is due for collection`,
        'evidence_schedule', s.id, { next_due_date: s.next_due_date });

      await notifyOrgRole(env, s.org_id, null, 'manager', 'evidence_reminder',
        'Evidence Collection Due',
        `Evidence schedule "${s.title}" is due (owner: ${s.owner_name || 'Unknown'})`,
        'evidence_schedule', s.id, { next_due_date: s.next_due_date });
    }

    // 2. Expired evidence → mark expired + notify managers
    const { results: expiredEvidence } = await env.DB.prepare(
      `SELECT * FROM evidence WHERE status = 'active' AND expiry_date IS NOT NULL AND expiry_date <= ?`
    ).bind(today).all();

    console.log(`[CRON] ${expiredEvidence.length} expired evidence items`);

    for (const ev of expiredEvidence) {
      await env.DB.prepare("UPDATE evidence SET status = 'expired', updated_at = datetime('now') WHERE id = ?").bind(ev.id).run();
      await notifyOrgRole(env, ev.org_id, null, 'manager', 'evidence_expiry',
        'Evidence Expired',
        `Evidence "${ev.title}" has expired`,
        'evidence', ev.id, { expiry_date: ev.expiry_date });
    }

    // 3. Evidence expiring within 14 days → warn managers
    const { results: expiringEvidence } = await env.DB.prepare(
      `SELECT * FROM evidence WHERE status = 'active' AND expiry_date IS NOT NULL AND expiry_date > ? AND expiry_date <= ?`
    ).bind(today, warningDateStr).all();

    console.log(`[CRON] ${expiringEvidence.length} evidence items expiring soon`);

    for (const ev of expiringEvidence) {
      const daysLeft = Math.ceil((new Date(ev.expiry_date) - new Date(today)) / (1000 * 60 * 60 * 24));
      await notifyOrgRole(env, ev.org_id, null, 'manager', 'evidence_expiry',
        'Evidence Expiring Soon',
        `Evidence "${ev.title}" expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${ev.expiry_date})`,
        'evidence', ev.id, { expiry_date: ev.expiry_date, days_remaining: daysLeft });
    }

    console.log('[CRON] Evidence checks completed');
  } catch (error) {
    console.error('[CRON] Evidence check error:', error);
  }
}

// ============================================================================
// SCHEDULED WORKER - AUTOMATED COMPLIANCE ALERTS
// ============================================================================

const DEFAULT_ALERT_THRESHOLDS = {
  poam_upcoming_days: 7,
  ato_expiry_days: 30,
  vendor_assessment_days: 14,
  vendor_contract_days: 30,
  policy_review_days: 30,
  enabled: true,
};

function getOrgAlertThresholds(org) {
  try {
    const meta = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {});
    if (meta.alert_thresholds) return { ...DEFAULT_ALERT_THRESHOLDS, ...meta.alert_thresholds };
  } catch {}
  return { ...DEFAULT_ALERT_THRESHOLDS };
}

async function handleScheduledComplianceAlerts(env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('[CRON] Running compliance alerts for:', today);

    const { results: orgs } = await env.DB.prepare('SELECT * FROM organizations').all();
    let totalAlerts = 0;

    for (const org of orgs) {
      const thresholds = getOrgAlertThresholds(org);
      if (!thresholds.enabled) { console.log(`[CRON] Alerts disabled for org ${org.id}`); continue; }

      const poamUpcomingDate = new Date(); poamUpcomingDate.setDate(poamUpcomingDate.getDate() + thresholds.poam_upcoming_days);
      const atoDate = new Date(); atoDate.setDate(atoDate.getDate() + thresholds.ato_expiry_days);
      const vendorAssessDate = new Date(); vendorAssessDate.setDate(vendorAssessDate.getDate() + thresholds.vendor_assessment_days);
      const vendorContractDate = new Date(); vendorContractDate.setDate(vendorContractDate.getDate() + thresholds.vendor_contract_days);
      const policyDate = new Date(); policyDate.setDate(policyDate.getDate() + thresholds.policy_review_days);

      const [overduePoams, upcomingPoams, atoExpiring, vendorAssessments, vendorContracts, overdueRisks, policyReviews] = await Promise.all([
        env.DB.prepare(
          `SELECT id, weakness_name AS title, scheduled_completion, assigned_to FROM poams WHERE org_id = ? AND scheduled_completion < ? AND status NOT IN ('completed','accepted','deferred')`
        ).bind(org.id, today).all(),
        env.DB.prepare(
          `SELECT id, weakness_name AS title, scheduled_completion, assigned_to FROM poams WHERE org_id = ? AND scheduled_completion BETWEEN ? AND ? AND status NOT IN ('completed','accepted','deferred')`
        ).bind(org.id, today, poamUpcomingDate.toISOString().split('T')[0]).all(),
        env.DB.prepare(
          `SELECT id, name, acronym, authorization_expiry FROM systems WHERE org_id = ? AND authorization_expiry BETWEEN ? AND ?`
        ).bind(org.id, today, atoDate.toISOString().split('T')[0]).all(),
        env.DB.prepare(
          `SELECT id, name, next_assessment_date, criticality FROM vendors WHERE org_id = ? AND next_assessment_date BETWEEN ? AND ? AND status = 'active'`
        ).bind(org.id, today, vendorAssessDate.toISOString().split('T')[0]).all(),
        env.DB.prepare(
          `SELECT id, name, contract_end, criticality FROM vendors WHERE org_id = ? AND contract_end BETWEEN ? AND ? AND status = 'active'`
        ).bind(org.id, today, vendorContractDate.toISOString().split('T')[0]).all(),
        env.DB.prepare(
          `SELECT id, title, treatment_due_date FROM risks WHERE org_id = ? AND treatment_due_date < ? AND status NOT IN ('closed','accepted')`
        ).bind(org.id, today).all(),
        env.DB.prepare(
          `SELECT id, title, review_date, owner_id FROM policies WHERE org_id = ? AND review_date BETWEEN ? AND ? AND status = 'published'`
        ).bind(org.id, today, policyDate.toISOString().split('T')[0]).all().catch(() => ({ results: [] })),
      ]);

      // Helper: check if already alerted in last 24h
      async function alreadyAlerted(resourceType, resourceId) {
        const existing = await env.DB.prepare(
          "SELECT id FROM notifications WHERE org_id = ? AND resource_type = ? AND resource_id = ? AND type = 'deadline_alert' AND created_at > datetime('now', '-1 day')"
        ).bind(org.id, resourceType, resourceId).first();
        return !!existing;
      }

      // 1. Overdue POA&Ms → assigned_to + managers
      for (const p of overduePoams.results) {
        if (await alreadyAlerted('poam', p.id)) continue;
        const daysOverdue = Math.ceil((new Date(today) - new Date(p.scheduled_completion)) / 86400000);
        const msg = `POA&M "${p.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue (due ${p.scheduled_completion})`;
        if (p.assigned_to) await createNotification(env, org.id, p.assigned_to, 'deadline_alert', 'POA&M Overdue', msg, 'poam', p.id, { days_overdue: daysOverdue });
        await notifyOrgRole(env, org.id, p.assigned_to, 'manager', 'deadline_alert', 'POA&M Overdue', msg, 'poam', p.id, { days_overdue: daysOverdue });
        totalAlerts++;
      }

      // 2. Upcoming POA&Ms → assigned_to
      for (const p of upcomingPoams.results) {
        if (await alreadyAlerted('poam', p.id)) continue;
        const daysLeft = Math.ceil((new Date(p.scheduled_completion) - new Date(today)) / 86400000);
        if (p.assigned_to) {
          await createNotification(env, org.id, p.assigned_to, 'deadline_alert', 'POA&M Due Soon',
            `POA&M "${p.title}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${p.scheduled_completion})`,
            'poam', p.id, { days_remaining: daysLeft });
          totalAlerts++;
        }
      }

      // 3. ATO expiring → managers
      for (const s of atoExpiring.results) {
        if (await alreadyAlerted('system', s.id)) continue;
        const daysLeft = Math.ceil((new Date(s.authorization_expiry) - new Date(today)) / 86400000);
        const name = s.acronym ? `${s.name} (${s.acronym})` : s.name;
        await notifyOrgRole(env, org.id, null, 'manager', 'deadline_alert', 'ATO Expiring',
          `System "${name}" ATO expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${s.authorization_expiry})`,
          'system', s.id, { days_remaining: daysLeft });
        totalAlerts++;
      }

      // 4. Vendor assessments due → managers
      for (const v of vendorAssessments.results) {
        if (await alreadyAlerted('vendor', v.id)) continue;
        const daysLeft = Math.ceil((new Date(v.next_assessment_date) - new Date(today)) / 86400000);
        await notifyOrgRole(env, org.id, null, 'manager', 'deadline_alert', 'Vendor Assessment Due',
          `Vendor "${v.name}" assessment due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${v.next_assessment_date})`,
          'vendor', v.id, { days_remaining: daysLeft, criticality: v.criticality });
        totalAlerts++;
      }

      // 5. Vendor contracts ending → managers
      for (const v of vendorContracts.results) {
        if (await alreadyAlerted('vendor_contract', `${v.id}_contract`)) continue;
        const daysLeft = Math.ceil((new Date(v.contract_end) - new Date(today)) / 86400000);
        await notifyOrgRole(env, org.id, null, 'manager', 'deadline_alert', 'Vendor Contract Ending',
          `Vendor "${v.name}" contract ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${v.contract_end})`,
          'vendor_contract', `${v.id}_contract`, { days_remaining: daysLeft, criticality: v.criticality });
        totalAlerts++;
      }

      // 6. Risk treatment overdue → managers
      for (const r of overdueRisks.results) {
        if (await alreadyAlerted('risk', r.id)) continue;
        const daysOverdue = Math.ceil((new Date(today) - new Date(r.treatment_due_date)) / 86400000);
        await notifyOrgRole(env, org.id, null, 'manager', 'deadline_alert', 'Risk Treatment Overdue',
          `Risk "${r.title}" treatment is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue (due ${r.treatment_due_date})`,
          'risk', r.id, { days_overdue: daysOverdue });
        totalAlerts++;
      }

      // 7. Policy review due → owner + managers
      for (const p of policyReviews.results) {
        if (await alreadyAlerted('policy', p.id)) continue;
        const daysLeft = Math.ceil((new Date(p.review_date) - new Date(today)) / 86400000);
        const msg = `Policy "${p.title}" review due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${p.review_date})`;
        if (p.owner_id) await createNotification(env, org.id, p.owner_id, 'deadline_alert', 'Policy Review Due', msg, 'policy', p.id, { days_remaining: daysLeft });
        await notifyOrgRole(env, org.id, p.owner_id, 'manager', 'deadline_alert', 'Policy Review Due', msg, 'policy', p.id, { days_remaining: daysLeft });
        totalAlerts++;
      }
    }

    console.log(`[CRON] Compliance alerts completed: ${totalAlerts} alerts generated`);
  } catch (error) {
    console.error('[CRON] Compliance alerts error:', error);
  }
}

// ============================================================================
// COMPLIANCE ALERT SETTINGS & SUMMARY
// ============================================================================

async function handleGetAlertSettings(env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const thresholds = getOrgAlertThresholds(org);
  return jsonResponse({ thresholds });
}

async function handleUpdateAlertSettings(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  let meta; try { meta = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {}); } catch { meta = {}; }

  const current = meta.alert_thresholds || { ...DEFAULT_ALERT_THRESHOLDS };
  const validFields = ['poam_upcoming_days', 'ato_expiry_days', 'vendor_assessment_days', 'vendor_contract_days', 'policy_review_days', 'enabled'];
  for (const field of validFields) {
    if (body[field] !== undefined) {
      if (field === 'enabled') { current[field] = !!body[field]; }
      else { const v = parseInt(body[field]); if (!isNaN(v) && v >= 0 && v <= 365) current[field] = v; }
    }
  }
  meta.alert_thresholds = current;

  await env.DB.prepare("UPDATE organizations SET settings = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(JSON.stringify(meta), org.id).run();
  return jsonResponse({ thresholds: current });
}

async function handleAlertSummary(env, url, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  try {
    const today = new Date().toISOString().split('T')[0];
    const thresholds = getOrgAlertThresholds(org);

    const poamUpcomingDate = new Date(); poamUpcomingDate.setDate(poamUpcomingDate.getDate() + thresholds.poam_upcoming_days);
    const atoDate = new Date(); atoDate.setDate(atoDate.getDate() + thresholds.ato_expiry_days);
    const vendorAssessDate = new Date(); vendorAssessDate.setDate(vendorAssessDate.getDate() + thresholds.vendor_assessment_days);
    const vendorContractDate = new Date(); vendorContractDate.setDate(vendorContractDate.getDate() + thresholds.vendor_contract_days);
    const policyDate = new Date(); policyDate.setDate(policyDate.getDate() + thresholds.policy_review_days);
    const thirtyDaysOut = new Date(); thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    const thirtyDaysOutStr = thirtyDaysOut.toISOString().split('T')[0];

    const [poamsOverdue, poamsUpcoming, atoExpiring, vendorAssessments, vendorContracts, risksOverdue, policiesReview, evidenceExpired, evidenceExpiring] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) as count FROM poams WHERE org_id = ? AND scheduled_completion < ? AND status NOT IN ('completed','accepted','deferred')").bind(org.id, today).first(),
      env.DB.prepare("SELECT COUNT(*) as count FROM poams WHERE org_id = ? AND scheduled_completion BETWEEN ? AND ? AND status NOT IN ('completed','accepted','deferred')").bind(org.id, today, poamUpcomingDate.toISOString().split('T')[0]).first(),
      env.DB.prepare("SELECT COUNT(*) as count FROM systems WHERE org_id = ? AND authorization_expiry BETWEEN ? AND ?").bind(org.id, today, atoDate.toISOString().split('T')[0]).first(),
      env.DB.prepare("SELECT COUNT(*) as count FROM vendors WHERE org_id = ? AND next_assessment_date BETWEEN ? AND ? AND status = 'active'").bind(org.id, today, vendorAssessDate.toISOString().split('T')[0]).first(),
      env.DB.prepare("SELECT COUNT(*) as count FROM vendors WHERE org_id = ? AND contract_end BETWEEN ? AND ? AND status = 'active'").bind(org.id, today, vendorContractDate.toISOString().split('T')[0]).first(),
      env.DB.prepare("SELECT COUNT(*) as count FROM risks WHERE org_id = ? AND treatment_due_date < ? AND status NOT IN ('closed','accepted')").bind(org.id, today).first(),
      env.DB.prepare("SELECT COUNT(*) as count FROM policies WHERE org_id = ? AND review_date BETWEEN ? AND ? AND status = 'published'").bind(org.id, today, policyDate.toISOString().split('T')[0]).first().catch(() => ({ count: 0 })),
      env.DB.prepare("SELECT COUNT(*) as count FROM evidence WHERE org_id = ? AND status = 'active' AND expiry_date IS NOT NULL AND expiry_date <= ?").bind(org.id, today).first().catch(() => ({ count: 0 })),
      env.DB.prepare("SELECT COUNT(*) as count FROM evidence WHERE org_id = ? AND status = 'active' AND expiry_date IS NOT NULL AND expiry_date > ? AND expiry_date <= ?").bind(org.id, today, thirtyDaysOutStr).first().catch(() => ({ count: 0 })),
    ]);

    const summary = {
      poams_overdue: poamsOverdue.count,
      poams_upcoming: poamsUpcoming.count,
      ato_expiring: atoExpiring.count,
      vendor_assessments_due: vendorAssessments.count,
      vendor_contracts_ending: vendorContracts.count,
      risks_overdue: risksOverdue.count,
      policies_review_due: policiesReview?.count || 0,
      evidence_expired: evidenceExpired?.count || 0,
      evidence_expiring: evidenceExpiring?.count || 0,
    };
    summary.total = Object.values(summary).reduce((a, b) => a + b, 0);

    return jsonResponse(summary);
  } catch (err) {
    console.error('[handleAlertSummary]', err.message);
    return jsonResponse({ error: 'Failed to load alert summary' }, 500);
  }
}

// ============================================================================
// SCHEDULED WORKER - SECURITY INCIDENT DETECTION (TAC-006 / NIST IR)
// Detects anomalous patterns and creates security incidents automatically.
// TAC 202 requires reporting to DIR within 48 hours.
// ============================================================================

async function handleSecurityIncidentDetection(env) {
  try {
    console.log('[CRON] Running security incident detection...');
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

    const { results: orgs } = await env.DB.prepare('SELECT id, name FROM organizations').all();
    let totalIncidents = 0;

    for (const org of orgs) {
      // Detection 1: Brute-force attacks — 10+ failed logins per user in 1 hour
      const { results: bruteForce } = await env.DB.prepare(
        `SELECT u.id, u.email, COUNT(*) as attempts FROM audit_logs a
         JOIN users u ON a.user_id = u.id
         WHERE a.org_id = ? AND a.action = 'login' AND a.details LIKE '%Invalid%'
         AND a.created_at > ? GROUP BY u.id HAVING attempts >= 10`
      ).bind(org.id, oneHourAgo).all();

      for (const bf of bruteForce) {
        const existing = await env.DB.prepare(
          "SELECT id FROM security_incidents WHERE org_id = ? AND incident_type = 'brute_force' AND affected_user_id = ? AND status IN ('open', 'investigating') AND detected_at > ?"
        ).bind(org.id, bf.id, oneDayAgo).first();
        if (!existing) {
          const incidentId = generateId();
          const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
          await env.DB.prepare(
            `INSERT INTO security_incidents (id, org_id, incident_type, severity, title, description, affected_user_id, dir_notification_deadline, details)
             VALUES (?, ?, 'brute_force', 'high', ?, ?, ?, ?, ?)`
          ).bind(incidentId, org.id, `Brute-force attack detected: ${bf.email}`,
            `${bf.attempts} failed login attempts detected for ${bf.email} within the last hour.`,
            bf.id, deadline, JSON.stringify({ attempts: bf.attempts, email: bf.email })).run();
          await notifyOrgAdmins(env, org.id, 'security', 'SECURITY INCIDENT: Brute-Force Attack',
            `${bf.attempts} failed login attempts detected for ${bf.email}. Review security incidents immediately.`, 'urgent');
          totalIncidents++;
        }
      }

      // Detection 2: Account lockout spike — 3+ accounts locked in 1 hour
      const lockouts = await env.DB.prepare(
        "SELECT COUNT(DISTINCT user_id) as cnt FROM audit_logs WHERE org_id = ? AND action = 'login' AND details LIKE '%locked%' AND created_at > ?"
      ).bind(org.id, oneHourAgo).first();
      if (lockouts && lockouts.cnt >= 3) {
        const existing = await env.DB.prepare(
          "SELECT id FROM security_incidents WHERE org_id = ? AND incident_type = 'mass_lockout' AND status IN ('open', 'investigating') AND detected_at > ?"
        ).bind(org.id, oneDayAgo).first();
        if (!existing) {
          const incidentId = generateId();
          const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
          await env.DB.prepare(
            `INSERT INTO security_incidents (id, org_id, incident_type, severity, title, description, dir_notification_deadline, details)
             VALUES (?, ?, 'mass_lockout', 'critical', ?, ?, ?, ?)`
          ).bind(incidentId, org.id, `Mass account lockout: ${lockouts.cnt} accounts`,
            `${lockouts.cnt} accounts were locked within the last hour, suggesting a coordinated attack.`,
            deadline, JSON.stringify({ locked_accounts: lockouts.cnt })).run();
          await notifyOrgAdmins(env, org.id, 'security', 'CRITICAL: Mass Account Lockout',
            `${lockouts.cnt} accounts locked in the last hour. Possible coordinated attack. Review immediately.`, 'urgent');
          totalIncidents++;
        }
      }

      // Detection 3: Privilege escalation — role changes to admin/owner in last 24h
      const { results: escalations } = await env.DB.prepare(
        "SELECT * FROM audit_logs WHERE org_id = ? AND action = 'update' AND resource_type = 'user' AND details LIKE '%role%' AND details LIKE '%admin%' AND created_at > ?"
      ).bind(org.id, oneDayAgo).all();
      for (const esc of escalations) {
        let details;
        try { details = JSON.parse(esc.details); } catch { continue; }
        if (details?.role?.to === 'admin' || details?.role?.to === 'owner') {
          const existing = await env.DB.prepare(
            "SELECT id FROM security_incidents WHERE org_id = ? AND incident_type = 'privilege_escalation' AND details LIKE ? AND detected_at > ?"
          ).bind(org.id, `%${esc.resource_id}%`, oneDayAgo).first();
          if (!existing) {
            const incidentId = generateId();
            await env.DB.prepare(
              `INSERT INTO security_incidents (id, org_id, incident_type, severity, title, description, affected_user_id, details)
               VALUES (?, ?, 'privilege_escalation', 'medium', ?, ?, ?, ?)`
            ).bind(incidentId, org.id, `Privilege escalation: user promoted to ${details.role.to}`,
              `User ${esc.resource_id} role changed from ${details.role.from || 'unknown'} to ${details.role.to} by user ${esc.user_id}.`,
              esc.resource_id, JSON.stringify({ changed_by: esc.user_id, from: details.role.from, to: details.role.to })).run();
            totalIncidents++;
          }
        }
      }

      // Detection 4: Emergency access usage in last 24h
      const { results: emergencyUses } = await env.DB.prepare(
        "SELECT * FROM audit_logs WHERE org_id = ? AND action = 'emergency_access_granted' AND created_at > ?"
      ).bind(org.id, oneDayAgo).all();
      for (const ea of emergencyUses) {
        const existing = await env.DB.prepare(
          "SELECT id FROM security_incidents WHERE org_id = ? AND incident_type = 'emergency_access' AND detected_at > ? AND details LIKE ?"
        ).bind(org.id, oneDayAgo, `%${ea.id}%`).first();
        if (!existing) {
          const incidentId = generateId();
          const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
          await env.DB.prepare(
            `INSERT INTO security_incidents (id, org_id, incident_type, severity, title, description, affected_user_id, dir_notification_deadline, details)
             VALUES (?, ?, 'emergency_access', 'high', ?, ?, ?, ?, ?)`
          ).bind(incidentId, org.id, 'Emergency break-glass access used',
            `Emergency access procedure was activated. Review audit logs for details.`,
            ea.user_id, deadline, JSON.stringify({ audit_log_id: ea.id })).run();
          totalIncidents++;
        }
      }
    }

    console.log(`[CRON] Security incident detection complete: ${totalIncidents} new incident(s)`);
  } catch (e) {
    console.error('[CRON] Security incident detection error:', e.message);
  }
}

async function notifyOrgAdmins(env, orgId, type, title, message, priority = 'high') {
  try {
    const { results: admins } = await env.DB.prepare(
      "SELECT id FROM users WHERE org_id = ? AND role IN ('admin', 'owner') AND status != 'deactivated'"
    ).bind(orgId).all();
    for (const admin of admins) {
      await env.DB.prepare(
        'INSERT INTO notifications (id, org_id, recipient_user_id, type, title, message, priority) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(generateId(), orgId, admin.id, type, title, message, priority).run();
    }
  } catch (e) {
    console.error('notifyOrgAdmins error:', e.message);
  }
}

// ============================================================================
// SCHEDULED WORKER - AUDIT LOG RETENTION (TAC-002 / NIST AU-11)
// Enforces retention policy. Default: 6 years (HIPAA minimum).
// Logs older than retention period are archived/purged.
// ============================================================================

async function handleAuditLogRetention(env) {
  try {
    console.log('[CRON] Running audit log retention check...');
    // Default retention: 2190 days (6 years per HIPAA)
    const retentionDays = 2190;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    // Count records beyond retention
    const count = await env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM audit_logs WHERE created_at < ?'
    ).bind(cutoffDate).first();

    if (count && count.cnt > 0) {
      // Archive to KV before deletion (if KV binding available)
      try {
        const archiveKey = `audit-archive-${new Date().toISOString().split('T')[0]}`;
        const { results: oldLogs } = await env.DB.prepare(
          'SELECT * FROM audit_logs WHERE created_at < ? LIMIT 10000'
        ).bind(cutoffDate).all();
        if (oldLogs.length > 0 && env.KV) {
          await env.KV.put(archiveKey, JSON.stringify(oldLogs), { expirationTtl: 365 * 24 * 60 * 60 });
          console.log(`[CRON] Archived ${oldLogs.length} audit logs to KV key: ${archiveKey}`);
        }
      } catch (e) {
        console.error('[CRON] Audit archive error (non-fatal):', e.message);
      }

      // Purge expired logs
      await env.DB.prepare('DELETE FROM audit_logs WHERE created_at < ?').bind(cutoffDate).run();
      console.log(`[CRON] Purged ${count.cnt} audit log records older than ${retentionDays} days`);
    } else {
      console.log('[CRON] No audit logs beyond retention period');
    }

    // Also clean up expired refresh tokens
    await env.DB.prepare("DELETE FROM refresh_tokens WHERE (revoked = 1 OR expires_at < datetime('now')) AND created_at < datetime('now', '-30 days')").run();

    // Clean up resolved security incidents older than 1 year (keep for reporting)
    const incidentCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(
      "DELETE FROM security_incidents WHERE status = 'closed' AND resolved_at < ?"
    ).bind(incidentCutoff).run();

    console.log('[CRON] Audit log retention complete');
  } catch (e) {
    console.error('[CRON] Audit log retention error:', e.message);
  }
}

// ============================================================================
// SCHEDULED WORKER - DAILY EMAIL DIGEST
// ============================================================================

async function handleEmailDigest(env) {
  try {
    console.log('[CRON] Starting email digest...');

    const { results: users } = await env.DB.prepare(
      `SELECT u.id, u.email, u.name
       FROM users u
       LEFT JOIN notification_preferences np ON np.user_id = u.id
       WHERE np.email_digest = 1 OR np.email_digest IS NULL`
    ).all();

    console.log(`[CRON] ${users.length} users eligible for email digest`);

    let sentCount = 0;
    for (const user of users) {
      if (!user.email) continue;

      const { results: notifications } = await env.DB.prepare(
        `SELECT id, type, title, message, created_at
         FROM notifications
         WHERE recipient_user_id = ? AND email_sent = 0 AND created_at >= datetime('now', '-24 hours')
         ORDER BY created_at DESC`
      ).bind(user.id).all();

      if (notifications.length === 0) continue;

      const html = buildDigestEmailHtml(user.name, notifications);
      const result = await sendEmail(
        env, user.email,
        `[ForgeComply 360] ${notifications.length} notification${notifications.length !== 1 ? 's' : ''} - Daily Digest`,
        html
      );

      if (result) {
        const ids = notifications.map(n => n.id);
        const placeholders = ids.map(() => '?').join(',');
        await env.DB.prepare(
          `UPDATE notifications SET email_sent = 1 WHERE id IN (${placeholders})`
        ).bind(...ids).run();

        await env.DB.prepare(
          `INSERT INTO notification_preferences (id, user_id, last_digest_sent_at) VALUES (?, ?, datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET last_digest_sent_at = datetime('now')`
        ).bind(generateId(), user.id).run();

        sentCount++;
      }
    }

    console.log(`[CRON] Email digest complete. Sent ${sentCount} digests.`);
  } catch (error) {
    console.error('[CRON] Email digest error:', error);
  }
}

// ============================================================================
// AUDIT PREPARATION CHECKLIST
// ============================================================================

async function handleAuditReadiness(env, org) {
  try {
  const today = new Date().toISOString().split('T')[0];

  // Run parallel queries for all auto-computed checks
  const [
    controlStats,
    highRiskControls,
    overduePoams,
    poamsWithoutMilestones,
    highCritPoamsOverdue,
    overdueSchedules,
    expiredEvidence,
    implementedWithoutEvidence,
    sspDocs,
    monitoringChecks,
    failedChecks,
    pendingApprovals,
    systems,
    customItems,
  ] = await Promise.all([
    // Controls: total, implemented, not_assessed
    env.DB.prepare(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('implemented','not_applicable') THEN 1 ELSE 0 END) as compliant,
      SUM(CASE WHEN assessment_result = 'not_assessed' AND status = 'not_implemented' THEN 1 ELSE 0 END) as unassessed
      FROM control_implementations WHERE org_id = ?`).bind(org.id).first(),
    // Controls: high/critical risk unresolved
    env.DB.prepare(`SELECT COUNT(*) as count FROM control_implementations
      WHERE org_id = ? AND risk_level IN ('critical','high') AND status NOT IN ('implemented','not_applicable')`).bind(org.id).first(),
    // POA&Ms: overdue
    env.DB.prepare(`SELECT COUNT(*) as count FROM poams
      WHERE org_id = ? AND scheduled_completion < ? AND status NOT IN ('completed','accepted','deferred')`).bind(org.id, today).first(),
    // POA&Ms: without milestones
    env.DB.prepare(`SELECT COUNT(*) as count FROM poams p
      WHERE p.org_id = ? AND p.status NOT IN ('completed','accepted','deferred')
      AND NOT EXISTS (SELECT 1 FROM poam_milestones m WHERE m.poam_id = p.id)`).bind(org.id).first(),
    // POA&Ms: high/critical overdue
    env.DB.prepare(`SELECT COUNT(*) as count FROM poams
      WHERE org_id = ? AND risk_level IN ('critical','high') AND scheduled_completion < ? AND status NOT IN ('completed','accepted','deferred')`).bind(org.id, today).first(),
    // Evidence: overdue schedules
    env.DB.prepare(`SELECT COUNT(*) as count FROM evidence_schedules
      WHERE org_id = ? AND is_active = 1 AND next_due_date < ?`).bind(org.id, today).first(),
    // Evidence: expired
    env.DB.prepare(`SELECT COUNT(*) as count FROM evidence WHERE org_id = ? AND status = 'expired'`).bind(org.id).first(),
    // Evidence: implemented controls without linked evidence
    env.DB.prepare(`SELECT COUNT(*) as count FROM control_implementations ci
      WHERE ci.org_id = ? AND ci.status = 'implemented'
      AND NOT EXISTS (SELECT 1 FROM evidence_control_links ecl WHERE ecl.implementation_id = ci.id)`).bind(org.id).first(),
    // SSP: published docs
    env.DB.prepare(`SELECT id, status, oscal_json FROM ssp_documents WHERE org_id = ? ORDER BY created_at DESC LIMIT 5`).bind(org.id).all(),
    // Monitoring: active checks
    env.DB.prepare(`SELECT COUNT(*) as count FROM monitoring_checks WHERE org_id = ? AND is_active = 1`).bind(org.id).first(),
    // Monitoring: failed checks
    env.DB.prepare(`SELECT COUNT(*) as count FROM monitoring_checks WHERE org_id = ? AND is_active = 1 AND last_result = 'fail'`).bind(org.id).first(),
    // Approvals: pending
    env.DB.prepare(`SELECT COUNT(*) as count FROM approval_requests WHERE org_id = ? AND status = 'pending'`).bind(org.id).first(),
    // Systems: authorization status
    env.DB.prepare(`SELECT authorization_expiry FROM systems WHERE org_id = ? AND status = 'active' LIMIT 1`).bind(org.id).first(),
    // Custom checklist items
    env.DB.prepare(`SELECT ci.*, u.name as assigned_to_name, cu.name as completed_by_name
      FROM audit_checklist_items ci
      LEFT JOIN users u ON u.id = ci.assigned_to
      LEFT JOIN users cu ON cu.id = ci.completed_by
      WHERE ci.org_id = ? ORDER BY ci.sort_order, ci.created_at`).bind(org.id).all(),
  ]);

  const total = controlStats?.total || 0;
  const compliant = controlStats?.compliant || 0;
  const compliancePct = total > 0 ? Math.round((compliant / total) * 100) : 0;

  // Check if SSP is published and sections complete
  const sspResults = sspDocs?.results || [];
  const publishedSSP = sspResults.find(s => s.status === 'published');
  let sspSectionsComplete = false;
  if (publishedSSP && publishedSSP.oscal_json) {
    try {
      const oscal = JSON.parse(publishedSSP.oscal_json);
      const sections = oscal?._authoring?.sections || {};
      const sectionValues = Object.values(sections);
      sspSectionsComplete = sectionValues.length >= 8 && sectionValues.every(v => v && String(v).trim().length > 10);
    } catch { sspSectionsComplete = false; }
  }

  // Build auto-computed items
  const categories = {
    controls: {
      items: [
        { key: 'controls_assessed', label: 'All controls assessed', description: 'No unassessed controls remain', passed: (controlStats?.unassessed || 0) === 0, value: `${controlStats?.unassessed || 0} unassessed`, target: '0', link: '/controls' },
        { key: 'high_risk_resolved', label: 'High/critical risk controls resolved', description: 'No high or critical risk controls left unresolved', passed: (highRiskControls?.count || 0) === 0, value: `${highRiskControls?.count || 0} unresolved`, target: '0', link: '/controls' },
        { key: 'compliance_80', label: 'Compliance above 80%', description: 'Overall compliance percentage meets threshold', passed: compliancePct >= 80, value: `${compliancePct}%`, target: '80%', link: '/' },
      ],
    },
    poams: {
      items: [
        { key: 'no_overdue_poams', label: 'No overdue POA&Ms', description: 'All POA&Ms within scheduled completion date', passed: (overduePoams?.count || 0) === 0, value: `${overduePoams?.count || 0} overdue`, target: '0', link: '/poams' },
        { key: 'poams_have_milestones', label: 'All open POA&Ms have milestones', description: 'Every active POA&M includes at least one milestone', passed: (poamsWithoutMilestones?.count || 0) === 0, value: `${poamsWithoutMilestones?.count || 0} without milestones`, target: '0', link: '/poams' },
        { key: 'high_crit_poams_on_track', label: 'High/critical POA&Ms on track', description: 'No high or critical POA&Ms past their due date', passed: (highCritPoamsOverdue?.count || 0) === 0, value: `${highCritPoamsOverdue?.count || 0} overdue`, target: '0', link: '/poams' },
      ],
    },
    evidence: {
      items: [
        { key: 'no_overdue_schedules', label: 'No overdue evidence schedules', description: 'All recurring evidence collection is current', passed: (overdueSchedules?.count || 0) === 0, value: `${overdueSchedules?.count || 0} overdue`, target: '0', link: '/evidence/schedules' },
        { key: 'no_expired_evidence', label: 'No expired evidence', description: 'All evidence files are within their validity period', passed: (expiredEvidence?.count || 0) === 0, value: `${expiredEvidence?.count || 0} expired`, target: '0', link: '/evidence' },
        { key: 'controls_have_evidence', label: 'Implemented controls have evidence', description: 'All implemented controls are backed by evidence', passed: (implementedWithoutEvidence?.count || 0) === 0, value: `${implementedWithoutEvidence?.count || 0} without evidence`, target: '0', link: '/controls' },
      ],
    },
    ssp: {
      items: [
        { key: 'ssp_published', label: 'SSP published', description: 'At least one System Security Plan is published', passed: !!publishedSSP, value: publishedSSP ? 'Published' : 'Not published', target: 'Published', link: '/ssp' },
        { key: 'ssp_sections_complete', label: 'SSP sections complete', description: 'All SSP sections have substantive content', passed: sspSectionsComplete, value: sspSectionsComplete ? 'Complete' : 'Incomplete', target: 'Complete', link: '/ssp' },
      ],
    },
    monitoring: {
      items: [
        { key: 'monitoring_active', label: 'Continuous monitoring active', description: 'At least one monitoring check is configured and active', passed: (monitoringChecks?.count || 0) > 0, value: `${monitoringChecks?.count || 0} active`, target: '1+', link: '/monitoring' },
        { key: 'no_failed_checks', label: 'No failed monitoring checks', description: 'All active monitoring checks are passing', passed: (failedChecks?.count || 0) === 0, value: `${failedChecks?.count || 0} failed`, target: '0', link: '/monitoring' },
      ],
    },
    approvals: {
      items: [
        { key: 'no_pending_approvals', label: 'No pending approvals', description: 'All approval requests have been reviewed', passed: (pendingApprovals?.count || 0) === 0, value: `${pendingApprovals?.count || 0} pending`, target: '0', link: '/approvals' },
      ],
    },
    system: {
      items: [
        { key: 'auth_current', label: 'System authorization current', description: 'Authorization has not expired', passed: !systems?.authorization_expiry || systems.authorization_expiry >= today, value: systems?.authorization_expiry ? (systems.authorization_expiry >= today ? `Expires ${systems.authorization_expiry}` : 'Expired') : 'No expiry set', target: 'Current', link: '/systems' },
      ],
    },
    custom: {
      items: (customItems?.results || []).map(ci => ({
        id: ci.id, title: ci.title, description: ci.description, completed: !!ci.completed,
        completed_at: ci.completed_at, completed_by_name: ci.completed_by_name,
        assigned_to: ci.assigned_to, assigned_to_name: ci.assigned_to_name,
        due_date: ci.due_date, sort_order: ci.sort_order,
      })),
    },
  };

  // Calculate totals
  let totalChecks = 0, passedChecks = 0;
  for (const [catKey, cat] of Object.entries(categories)) {
    const items = cat.items || [];
    if (catKey === 'custom') {
      totalChecks += items.length;
      passedChecks += items.filter(i => i.completed).length;
      cat.total = items.length;
      cat.passed = items.filter(i => i.completed).length;
    } else {
      totalChecks += items.length;
      passedChecks += items.filter(i => i.passed).length;
      cat.total = items.length;
      cat.passed = items.filter(i => i.passed).length;
    }
  }

  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  return jsonResponse({
    readiness: { score, total_checks: totalChecks, passed_checks: passedChecks, categories },
  });
  } catch (err) {
    console.error('[handleAuditReadiness]', err.message);
    return jsonResponse({ error: 'Failed to load audit readiness' }, 500);
  }
}

async function handleListAuditItems(env, org) {
  const { results } = await env.DB.prepare(
    `SELECT ci.*, u.name as assigned_to_name, cu.name as completed_by_name
     FROM audit_checklist_items ci
     LEFT JOIN users u ON u.id = ci.assigned_to
     LEFT JOIN users cu ON cu.id = ci.completed_by
     WHERE ci.org_id = ? ORDER BY ci.sort_order, ci.created_at`
  ).bind(org.id).all();
  return jsonResponse({ items: results });
}

async function handleCreateAuditItem(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { title, description, assigned_to, due_date } = await request.json();
  if (!title) return jsonResponse({ error: 'title required' }, 400);

  const id = generateId();
  const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) as m FROM audit_checklist_items WHERE org_id = ?').bind(org.id).first();
  const sortOrder = (maxOrder?.m || 0) + 1;

  await env.DB.prepare(
    `INSERT INTO audit_checklist_items (id, org_id, title, description, assigned_to, due_date, sort_order, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, title, description || null, assigned_to || null, due_date || null, sortOrder, user.id).run();

  await auditLog(env, org.id, user.id, 'create', 'audit_checklist_item', id, { title });

  const item = await env.DB.prepare('SELECT * FROM audit_checklist_items WHERE id = ?').bind(id).first();
  return jsonResponse({ item }, 201);
}

async function handleUpdateAuditItem(request, env, org, user, itemId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const item = await env.DB.prepare('SELECT * FROM audit_checklist_items WHERE id = ? AND org_id = ?').bind(itemId, org.id).first();
  if (!item) return jsonResponse({ error: 'Item not found' }, 404);

  const body = await request.json();
  const updates = [];
  const values = [];

  if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
  if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
  if (body.assigned_to !== undefined) { updates.push('assigned_to = ?'); values.push(body.assigned_to || null); }
  if (body.due_date !== undefined) { updates.push('due_date = ?'); values.push(body.due_date || null); }
  if (body.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(body.sort_order); }

  if (body.completed !== undefined) {
    updates.push('completed = ?');
    values.push(body.completed ? 1 : 0);
    if (body.completed) {
      updates.push("completed_at = datetime('now')");
      updates.push('completed_by = ?');
      values.push(user.id);
    } else {
      updates.push('completed_at = NULL');
      updates.push('completed_by = NULL');
    }
  }

  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push("updated_at = datetime('now')");
  values.push(itemId);

  await env.DB.prepare(`UPDATE audit_checklist_items SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  await auditLog(env, org.id, user.id, 'update', 'audit_checklist_item', itemId, body);

  const updated = await env.DB.prepare(
    `SELECT ci.*, u.name as assigned_to_name, cu.name as completed_by_name
     FROM audit_checklist_items ci LEFT JOIN users u ON u.id = ci.assigned_to LEFT JOIN users cu ON cu.id = ci.completed_by
     WHERE ci.id = ?`
  ).bind(itemId).first();
  return jsonResponse({ item: updated });
}

async function handleDeleteAuditItem(env, org, user, itemId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const item = await env.DB.prepare('SELECT * FROM audit_checklist_items WHERE id = ? AND org_id = ?').bind(itemId, org.id).first();
  if (!item) return jsonResponse({ error: 'Item not found' }, 404);
  await env.DB.prepare('DELETE FROM audit_checklist_items WHERE id = ?').bind(itemId).run();
  await auditLog(env, org.id, user.id, 'delete', 'audit_checklist_item', itemId, { title: item.title });
  return jsonResponse({ message: 'Item deleted' });
}

// ============================================================================
// POLICY & PROCEDURE LIBRARY
// ============================================================================

async function handleListPolicies(env, url, org) {
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  let where = 'WHERE p.org_id = ?';
  const params = [org.id];
  if (status) { where += ' AND p.status = ?'; params.push(status); }
  if (category) { where += ' AND p.category = ?'; params.push(category); }
  if (search) { where += ' AND (p.title LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM policies p ${where}`).bind(...params).first();

  const { results } = await env.DB.prepare(
    `SELECT p.*, u.name as owner_name, cu.name as created_by_name FROM policies p LEFT JOIN users u ON u.id = p.owner_id LEFT JOIN users cu ON cu.id = p.created_by ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return jsonResponse({ policies: results, total: countResult.total, page, limit });
}

async function handleCreatePolicy(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { title, category, description, content, owner_id, review_date } = await request.json();
  if (!title || !title.trim()) return jsonResponse({ error: 'Title is required' }, 400);
  const validCategories = ['security', 'privacy', 'acceptable_use', 'incident_response', 'access_control', 'business_continuity', 'data_management', 'custom'];
  if (!category || !validCategories.includes(category)) return jsonResponse({ error: 'Valid category is required' }, 400);

  const id = generateId();
  const metadata = JSON.stringify({ versions: [{ version: '1.0', created_at: new Date().toISOString(), created_by: user.id, summary: 'Initial version' }] });

  await env.DB.prepare(
    `INSERT INTO policies (id, org_id, title, category, description, content, status, version, review_date, owner_id, metadata, created_by) VALUES (?, ?, ?, ?, ?, ?, 'draft', '1.0', ?, ?, ?, ?)`
  ).bind(id, org.id, title.trim(), category, description || null, content || null, review_date || null, owner_id || user.id, metadata, user.id).run();

  await auditLog(env, org.id, user.id, 'create', 'policy', id, { title: title.trim(), category }, request);
  const policy = await env.DB.prepare('SELECT p.*, u.name as owner_name FROM policies p LEFT JOIN users u ON u.id = p.owner_id WHERE p.id = ?').bind(id).first();
  return jsonResponse({ policy }, 201);
}

async function handleGetPolicy(env, org, policyId) {
  const policy = await env.DB.prepare(
    'SELECT p.*, u.name as owner_name, cu.name as created_by_name FROM policies p LEFT JOIN users u ON u.id = p.owner_id LEFT JOIN users cu ON cu.id = p.created_by WHERE p.id = ? AND p.org_id = ?'
  ).bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);
  policy.metadata = JSON.parse(policy.metadata || '{}');
  return jsonResponse({ policy });
}

async function handleUpdatePolicy(request, env, org, user, policyId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const policy = await env.DB.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);
  if (policy.status === 'published') return jsonResponse({ error: 'Published policies cannot be edited. Create a new version first.' }, 400);

  const body = await request.json();
  const trackedFields = ['title', 'category', 'description', 'content', 'owner_id', 'review_date'];
  const changes = computeDiff(policy, body, trackedFields);

  const updates = [];
  const values = [];
  for (const field of trackedFields) {
    if (body[field] !== undefined) { updates.push(`${field} = ?`); values.push(body[field]); }
  }
  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push("updated_at = datetime('now')");
  values.push(policyId, org.id);

  await env.DB.prepare(`UPDATE policies SET ${updates.join(', ')} WHERE id = ? AND org_id = ?`).bind(...values).run();
  await auditLog(env, org.id, user.id, 'update', 'policy', policyId, { ...body, _changes: changes }, request);

  const updated = await env.DB.prepare('SELECT p.*, u.name as owner_name FROM policies p LEFT JOIN users u ON u.id = p.owner_id WHERE p.id = ?').bind(policyId).first();
  updated.metadata = JSON.parse(updated.metadata || '{}');
  return jsonResponse({ policy: updated });
}

async function handleDeletePolicy(env, org, user, policyId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const policy = await env.DB.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);
  if (!['draft', 'archived'].includes(policy.status)) return jsonResponse({ error: 'Only draft or archived policies can be deleted' }, 400);

  await env.DB.prepare('DELETE FROM policies WHERE id = ?').bind(policyId).run();
  await auditLog(env, org.id, user.id, 'delete', 'policy', policyId, { title: policy.title });
  return jsonResponse({ message: 'Policy deleted' });
}

async function handleUpdatePolicyStatus(request, env, org, user, policyId) {
  const policy = await env.DB.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);

  const { status } = await request.json();
  const validTransitions = {
    draft: ['in_review'],
    in_review: ['approved', 'draft'],
    approved: ['archived'],
    published: ['archived', 'expired'],
    archived: [],
    expired: [],
  };

  if (!validTransitions[policy.status]?.includes(status)) {
    return jsonResponse({ error: `Cannot transition from ${policy.status} to ${status}` }, 400);
  }

  if (['in_review'].includes(status) && !requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  if (['approved'].includes(status) && !requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  if (['archived', 'expired'].includes(status) && !requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  await env.DB.prepare("UPDATE policies SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, policyId).run();
  await auditLog(env, org.id, user.id, 'status_change', 'policy', policyId, { from: policy.status, to: status }, request);

  if (status === 'published') {
    await notifyOrgRole(env, org.id, user.id, 'viewer', 'policy_update', 'Policy Published', `"${policy.title}" (v${policy.version}) has been published.`, 'policy', policyId, {});
  }

  const updated = await env.DB.prepare('SELECT p.*, u.name as owner_name FROM policies p LEFT JOIN users u ON u.id = p.owner_id WHERE p.id = ?').bind(policyId).first();
  updated.metadata = JSON.parse(updated.metadata || '{}');
  return jsonResponse({ policy: updated });
}

async function handleCreatePolicyVersion(request, env, org, user, policyId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const policy = await env.DB.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);
  if (!['published', 'archived', 'expired'].includes(policy.status)) return jsonResponse({ error: 'Can only create new versions from published/archived/expired policies' }, 400);

  const { summary } = await request.json();
  let meta; try { meta = JSON.parse(policy.metadata || '{}'); } catch { meta = {}; }
  if (!meta.versions) meta.versions = [];

  const current = parseFloat(policy.version || '1.0');
  const newVersion = (current + 0.1).toFixed(1);

  meta.versions.push({ version: newVersion, created_at: new Date().toISOString(), created_by: user.id, summary: summary || `Version ${newVersion}` });

  await env.DB.prepare("UPDATE policies SET version = ?, status = 'draft', metadata = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(newVersion, JSON.stringify(meta), policyId).run();
  await auditLog(env, org.id, user.id, 'version', 'policy', policyId, { version: newVersion });

  const updated = await env.DB.prepare('SELECT p.*, u.name as owner_name FROM policies p LEFT JOIN users u ON u.id = p.owner_id WHERE p.id = ?').bind(policyId).first();
  updated.metadata = JSON.parse(updated.metadata || '{}');
  return jsonResponse({ policy: updated });
}

async function handleGetPolicyControls(env, org, policyId) {
  const policy = await env.DB.prepare('SELECT id FROM policies WHERE id = ? AND org_id = ?').bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);

  const { results } = await env.DB.prepare(
    `SELECT pcl.id as link_id, pcl.created_at as linked_at, ci.id as implementation_id, ci.status,
            c.control_id, c.title as control_title, c.family, f.name as framework_name, s.name as system_name
     FROM policy_control_links pcl
     JOIN control_implementations ci ON ci.id = pcl.implementation_id
     JOIN controls c ON c.id = ci.control_id
     JOIN compliance_frameworks f ON f.id = ci.framework_id
     JOIN systems s ON s.id = ci.system_id
     WHERE pcl.policy_id = ?`
  ).bind(policyId).all();

  return jsonResponse({ controls: results });
}

async function handleLinkPolicyControl(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { policy_id, implementation_id } = await request.json();
  if (!policy_id || !implementation_id) return jsonResponse({ error: 'policy_id and implementation_id required' }, 400);

  const policy = await env.DB.prepare('SELECT id FROM policies WHERE id = ? AND org_id = ?').bind(policy_id, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);

  const id = generateId();
  await env.DB.prepare('INSERT OR IGNORE INTO policy_control_links (id, policy_id, implementation_id, linked_by) VALUES (?, ?, ?, ?)').bind(id, policy_id, implementation_id, user.id).run();
  await auditLog(env, org.id, user.id, 'link', 'policy', policy_id, { implementation_id });
  return jsonResponse({ success: true });
}

async function handleUnlinkPolicyControl(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { policy_id, implementation_id } = await request.json();
  if (!policy_id || !implementation_id) return jsonResponse({ error: 'policy_id and implementation_id required' }, 400);

  await env.DB.prepare('DELETE FROM policy_control_links WHERE policy_id = ? AND implementation_id = ?').bind(policy_id, implementation_id).run();
  await auditLog(env, org.id, user.id, 'unlink', 'policy', policy_id, { implementation_id });
  return jsonResponse({ success: true });
}

async function handleGetPolicyAttestations(env, org, policyId) {
  const policy = await env.DB.prepare('SELECT id FROM policies WHERE id = ? AND org_id = ?').bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);

  const { results } = await env.DB.prepare(
    `SELECT pa.*, u.name as user_name, u.email as user_email, u.role as user_role, ru.name as requested_by_name
     FROM policy_attestations pa JOIN users u ON u.id = pa.user_id LEFT JOIN users ru ON ru.id = pa.requested_by
     WHERE pa.policy_id = ? ORDER BY pa.status ASC, pa.requested_at DESC`
  ).bind(policyId).all();

  const total = results.length;
  const attested = results.filter(r => r.status === 'attested').length;
  return jsonResponse({ attestations: results, total, attested });
}

async function handleRequestAttestations(request, env, org, user, policyId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const policy = await env.DB.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);
  if (policy.status !== 'published') return jsonResponse({ error: 'Policy must be published' }, 400);

  const { role, due_date } = await request.json();
  const minLevel = ROLE_HIERARCHY[role] ?? 0;
  const { results: users } = await env.DB.prepare('SELECT id, name, role FROM users WHERE org_id = ?').bind(org.id).all();
  const targets = users.filter(u => (ROLE_HIERARCHY[u.role] ?? 0) >= minLevel);

  let count = 0;
  for (const target of targets) {
    try {
      await env.DB.prepare(
        'INSERT INTO policy_attestations (id, policy_id, user_id, policy_version, status, due_date, requested_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(generateId(), policyId, target.id, policy.version, 'pending', due_date || null, user.id).run();
      count++;
      await createNotification(env, org.id, target.id, 'attestation_request',
        'Policy Attestation Required',
        `You are required to review and acknowledge "${policy.title}" (v${policy.version})${due_date ? ` by ${due_date}` : ''}.`,
        'policy', policyId, { policy_version: policy.version, due_date }
      );
    } catch { /* UNIQUE conflict = already requested */ }
  }

  await auditLog(env, org.id, user.id, 'request_attestation', 'policy', policyId, { role, due_date, count });
  return jsonResponse({ success: true, attestations_created: count });
}

async function handleAttestPolicy(request, env, org, user, policyId) {
  const policy = await env.DB.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').bind(policyId, org.id).first();
  if (!policy) return jsonResponse({ error: 'Policy not found' }, 404);

  const attestation = await env.DB.prepare(
    "SELECT * FROM policy_attestations WHERE policy_id = ? AND user_id = ? AND policy_version = ? AND status = 'pending'"
  ).bind(policyId, user.id, policy.version).first();
  if (!attestation) return jsonResponse({ error: 'No pending attestation found for this policy version' }, 404);

  await env.DB.prepare(
    "UPDATE policy_attestations SET status = 'attested', attested_at = datetime('now') WHERE id = ?"
  ).bind(attestation.id).run();

  await auditLog(env, org.id, user.id, 'attest', 'policy', policyId, { version: policy.version });
  return jsonResponse({ success: true });
}

async function handleMyAttestations(env, org, user) {
  const { results } = await env.DB.prepare(
    `SELECT pa.*, p.title as policy_title, p.category, p.status as policy_status
     FROM policy_attestations pa JOIN policies p ON p.id = pa.policy_id
     WHERE pa.user_id = ? AND p.org_id = ? ORDER BY pa.status ASC, pa.due_date ASC`
  ).bind(user.id, org.id).all();
  return jsonResponse({ attestations: results });
}

async function handlePolicyStats(env, org) {
  const [total, byStatus, dueForReview, pendingAttestations] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM policies WHERE org_id = ?').bind(org.id).first(),
    env.DB.prepare('SELECT status, COUNT(*) as count FROM policies WHERE org_id = ? GROUP BY status').bind(org.id).all(),
    env.DB.prepare("SELECT COUNT(*) as count FROM policies WHERE org_id = ? AND review_date <= date('now', '+30 days') AND status = 'published'").bind(org.id).first(),
    env.DB.prepare("SELECT COUNT(*) as count FROM policy_attestations pa JOIN policies p ON p.id = pa.policy_id WHERE p.org_id = ? AND pa.status = 'pending'").bind(org.id).first(),
  ]);
  return jsonResponse({ total: total.count, by_status: byStatus.results, due_for_review: dueForReview.count, pending_attestations: pendingAttestations.count });
}

// ============================================================================
// NESSUS SCANNER INTEGRATION - Parser & Constants
// ============================================================================

const SEVERITY_MAP = {
  0: 'info',
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'critical'
};

const SEVERITY_PRIORITY = {
  'critical': 5,
  'high': 4,
  'medium': 3,
  'low': 2,
  'info': 1
};

const REMEDIATION_DAYS = {
  'critical': 15,
  'high': 30,
  'medium': 90,
  'low': 180,
  'info': 365
};

async function parseNessusXML(xmlContent) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (name) => ['ReportHost', 'ReportItem', 'tag', 'cve', 'preference'].includes(name)
  });

  let doc;
  try {
    doc = parser.parse(xmlContent);
  } catch (e) {
    throw new Error('Invalid Nessus XML file: ' + e.message);
  }

  if (!doc.NessusClientData_v2) {
    throw new Error('Invalid Nessus XML file: missing NessusClientData_v2 root element');
  }

  const report = doc.NessusClientData_v2.Report;
  const policy = doc.NessusClientData_v2.Policy;

  const scanData = {
    scanName: report?.['@_name'] || 'Unknown Scan',
    scannerVersion: extractNessusPreference(policy, 'sc_version') || 'Unknown',
    hosts: [],
    findings: [],
    summary: {
      hostsScanned: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      total: 0
    }
  };

  const reportHosts = report?.ReportHost || [];
  scanData.summary.hostsScanned = reportHosts.length;

  for (const hostNode of reportHosts) {
    const host = parseNessusReportHost(hostNode);
    scanData.hosts.push(host);

    const reportItems = hostNode.ReportItem || [];
    for (const itemNode of reportItems) {
      const finding = parseNessusReportItem(itemNode, host);
      scanData.findings.push(finding);
      scanData.summary[finding.severity]++;
      scanData.summary.total++;
    }
  }

  return scanData;
}

function parseNessusReportHost(hostNode) {
  const hostName = hostNode['@_name'];
  const properties = {};

  const hostProps = hostNode.HostProperties?.tag || [];
  for (const prop of hostProps) {
    const name = prop['@_name'];
    const value = prop['#text'] || '';
    properties[name] = value;
  }

  return {
    ipAddress: hostName,
    hostname: properties['host-fqdn'] || properties['hostname'] || hostName,
    fqdn: properties['host-fqdn'] || null,
    netbiosName: properties['netbios-name'] || null,
    macAddress: properties['mac-address'] || null,
    osType: properties['operating-system'] || null,
    scanStarted: properties['HOST_START'] || null,
    scanEnded: properties['HOST_END'] || null,
    credentialed: properties['Credentialed_Scan'] === 'true'
  };
}

function parseNessusReportItem(itemNode, host) {
  const severityNum = parseInt(itemNode['@_severity'] || '0', 10);

  const cves = [];
  const cveNodes = itemNode.cve || [];
  for (const cve of cveNodes) {
    const cveText = typeof cve === 'string' ? cve : cve['#text'];
    if (cveText) cves.push(cveText);
  }

  const seeAlso = [];
  const seeAlsoText = getNessusElementText(itemNode, 'see_also');
  if (seeAlsoText) {
    seeAlso.push(...seeAlsoText.split('\n').filter(url => url.trim()));
  }

  const cvss3Vector = getNessusElementText(itemNode, 'cvss3_vector');
  let attackVector = null;
  if (cvss3Vector) {
    const avMatch = cvss3Vector.match(/AV:([A-Z])/);
    if (avMatch) {
      const avMap = { 'N': 'NETWORK', 'A': 'ADJACENT_NETWORK', 'L': 'LOCAL', 'P': 'PHYSICAL' };
      attackVector = avMap[avMatch[1]] || null;
    }
  }

  return {
    pluginId: itemNode['@_pluginID'],
    pluginName: itemNode['@_pluginName'],
    pluginFamily: itemNode['@_pluginFamily'],
    port: parseInt(itemNode['@_port'] || '0', 10),
    protocol: itemNode['@_protocol'] || 'tcp',
    severity: SEVERITY_MAP[severityNum] || 'info',
    severityNum,
    hostIp: host.ipAddress,
    hostFqdn: host.fqdn,
    title: itemNode['@_pluginName'],
    description: getNessusElementText(itemNode, 'description'),
    synopsis: getNessusElementText(itemNode, 'synopsis'),
    solution: getNessusElementText(itemNode, 'solution'),
    pluginOutput: getNessusElementText(itemNode, 'plugin_output'),
    cvssScore: parseFloat(getNessusElementText(itemNode, 'cvss_base_score')) || null,
    cvss3Score: parseFloat(getNessusElementText(itemNode, 'cvss3_base_score')) || null,
    cvss3Vector,
    attackVector,
    cves,
    seeAlso,
    exploitAvailable: getNessusElementText(itemNode, 'exploit_available') === 'true',
    exploitabilityEase: getNessusElementText(itemNode, 'exploitability_ease'),
    patchPublished: getNessusElementText(itemNode, 'patch_publication_date'),
    vulnPublished: getNessusElementText(itemNode, 'vuln_publication_date')
  };
}

function getNessusElementText(parent, tagName) {
  const el = parent[tagName];
  if (!el) return null;
  if (typeof el === 'string') return el;
  return el['#text'] || null;
}

function extractNessusPreference(policy, name) {
  if (!policy) return null;
  const prefs = policy.Preferences?.ServerPreferences?.preference || [];
  for (const pref of prefs) {
    const prefName = pref.name;
    const prefNameText = typeof prefName === 'string' ? prefName : prefName?.['#text'];
    if (prefNameText === name) {
      const prefValue = pref.value;
      return typeof prefValue === 'string' ? prefValue : prefValue?.['#text'] || null;
    }
  }
  return null;
}

function generateFindingKey(finding, assetId) {
  return [finding.pluginId, assetId, finding.port.toString(), finding.protocol].join('|');
}

// ============================================================================
// QUALYS CSV PARSER
// Parses Qualys VM exported CSV files
// Expected columns: IP, DNS, QID, Title, Severity, CVE ID, CVSS, CVSS3.1, Solution, Results, etc.
// ============================================================================

function parseQualysCSV(csvContent) {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    throw new Error('Invalid Qualys CSV: file is empty or has no data rows');
  }

  // Find header row (Qualys CSVs sometimes have metadata rows before headers)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].toLowerCase().includes('ip') && lines[i].toLowerCase().includes('qid')) {
      headerIndex = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerIndex]);
  const headerMap = {};
  headers.forEach((h, idx) => {
    headerMap[h.toLowerCase().trim()] = idx;
  });

  // Required columns
  const requiredCols = ['ip', 'qid', 'title', 'severity'];
  for (const col of requiredCols) {
    if (headerMap[col] === undefined) {
      throw new Error(`Invalid Qualys CSV: missing required column "${col}"`);
    }
  }

  const hostMap = new Map();
  const findings = [];
  const summary = { hostsScanned: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const ip = values[headerMap['ip']]?.trim();
    const qid = values[headerMap['qid']]?.trim();
    const title = values[headerMap['title']]?.trim();
    const severityRaw = values[headerMap['severity']]?.trim();

    if (!ip || !qid) continue;

    // Track unique hosts
    if (!hostMap.has(ip)) {
      hostMap.set(ip, {
        ipAddress: ip,
        hostname: values[headerMap['dns']]?.trim() || values[headerMap['hostname']]?.trim() || ip,
        fqdn: values[headerMap['dns']]?.trim() || null,
        netbiosName: values[headerMap['netbios']]?.trim() || null,
        macAddress: null,
        osType: values[headerMap['os']]?.trim() || null,
        credentialed: false
      });
    }

    // Map Qualys severity (1-5) to standard
    const severity = mapQualysSeverity(severityRaw);

    // Extract CVEs
    const cveRaw = values[headerMap['cve id']] || values[headerMap['cve']] || '';
    const cves = cveRaw.split(/[,;\s]+/).filter(c => c.match(/CVE-\d{4}-\d+/i));

    // Extract port
    const portRaw = values[headerMap['port']] || values[headerMap['service']] || '';
    const portMatch = portRaw.match(/(\d+)/);
    const port = portMatch ? parseInt(portMatch[1], 10) : 0;

    findings.push({
      pluginId: `QID-${qid}`,
      pluginName: title,
      pluginFamily: values[headerMap['category']]?.trim() || values[headerMap['type']]?.trim() || 'Qualys',
      port,
      protocol: values[headerMap['protocol']]?.trim()?.toLowerCase() || 'tcp',
      severity,
      severityNum: getSeverityNum(severity),
      hostIp: ip,
      hostFqdn: hostMap.get(ip)?.fqdn || null,
      title,
      description: values[headerMap['threat']]?.trim() || values[headerMap['description']]?.trim() || '',
      synopsis: values[headerMap['impact']]?.trim() || '',
      solution: values[headerMap['solution']]?.trim() || '',
      pluginOutput: values[headerMap['results']]?.trim() || values[headerMap['result']]?.trim() || '',
      cvssScore: parseFloat(values[headerMap['cvss']] || values[headerMap['cvss base']]) || null,
      cvss3Score: parseFloat(values[headerMap['cvss3'] || headerMap['cvss3.1'] || headerMap['cvss v3']]) || null,
      cvss3Vector: values[headerMap['cvss3 vector']]?.trim() || null,
      attackVector: null,
      cves,
      seeAlso: [],
      exploitAvailable: (values[headerMap['exploitability']] || '').toLowerCase().includes('yes'),
      exploitabilityEase: null,
      patchPublished: values[headerMap['patch available']]?.trim() || null,
      vulnPublished: values[headerMap['first detected']]?.trim() || null
    });

    summary[severity]++;
    summary.total++;
  }

  summary.hostsScanned = hostMap.size;

  return {
    scanName: 'Qualys VM Scan',
    scannerVersion: 'Qualys',
    hosts: Array.from(hostMap.values()),
    findings,
    summary
  };
}

function mapQualysSeverity(raw) {
  const num = parseInt(raw, 10);
  if (num >= 5) return 'critical';
  if (num === 4) return 'high';
  if (num === 3) return 'medium';
  if (num === 2) return 'low';
  return 'info';
}

// ============================================================================
// TENABLE.IO CSV PARSER
// Parses Tenable.io/Nessus exported CSV files
// Expected columns: Plugin ID, CVE, CVSS, Risk, Host, Protocol, Port, Name, Synopsis, Description, Solution, etc.
// ============================================================================

function parseTenableCSV(csvContent) {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    throw new Error('Invalid Tenable CSV: file is empty or has no data rows');
  }

  // Find header row
  let headerIndex = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('plugin id') || lower.includes('plugin') && lower.includes('host')) {
      headerIndex = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerIndex]);
  const headerMap = {};
  headers.forEach((h, idx) => {
    headerMap[h.toLowerCase().trim().replace(/\s+/g, ' ')] = idx;
  });

  // Required columns
  const pluginIdKey = Object.keys(headerMap).find(k => k.includes('plugin') && k.includes('id')) || 'plugin id';
  const hostKey = Object.keys(headerMap).find(k => k === 'host' || k === 'ip' || k === 'ip address') || 'host';

  if (headerMap[pluginIdKey] === undefined || headerMap[hostKey] === undefined) {
    throw new Error('Invalid Tenable CSV: missing required columns (Plugin ID, Host)');
  }

  const hostMap = new Map();
  const findings = [];
  const summary = { hostsScanned: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const pluginId = values[headerMap[pluginIdKey]]?.trim();
    const host = values[headerMap[hostKey]]?.trim();

    if (!pluginId || !host) continue;

    // Track unique hosts
    if (!hostMap.has(host)) {
      const dnsKey = Object.keys(headerMap).find(k => k.includes('dns') || k.includes('fqdn'));
      const netbiosKey = Object.keys(headerMap).find(k => k.includes('netbios'));
      const osKey = Object.keys(headerMap).find(k => k.includes('operating system') || k === 'os');
      const macKey = Object.keys(headerMap).find(k => k.includes('mac'));

      hostMap.set(host, {
        ipAddress: host,
        hostname: dnsKey ? values[headerMap[dnsKey]]?.trim() || host : host,
        fqdn: dnsKey ? values[headerMap[dnsKey]]?.trim() || null : null,
        netbiosName: netbiosKey ? values[headerMap[netbiosKey]]?.trim() || null : null,
        macAddress: macKey ? values[headerMap[macKey]]?.trim() || null : null,
        osType: osKey ? values[headerMap[osKey]]?.trim() || null : null,
        credentialed: false
      });
    }

    // Map Risk/Severity
    const riskKey = Object.keys(headerMap).find(k => k === 'risk' || k === 'severity' || k.includes('risk'));
    const severityRaw = riskKey ? values[headerMap[riskKey]]?.trim()?.toLowerCase() : 'info';
    const severity = mapTenableSeverity(severityRaw);

    // Extract CVEs
    const cveKey = Object.keys(headerMap).find(k => k === 'cve' || k.includes('cve'));
    const cveRaw = cveKey ? values[headerMap[cveKey]] || '' : '';
    const cves = cveRaw.split(/[,;\s]+/).filter(c => c.match(/CVE-\d{4}-\d+/i));

    // Find column keys
    const nameKey = Object.keys(headerMap).find(k => k === 'name' || k === 'plugin name');
    const familyKey = Object.keys(headerMap).find(k => k.includes('family') || k.includes('plugin family'));
    const portKey = Object.keys(headerMap).find(k => k === 'port');
    const protocolKey = Object.keys(headerMap).find(k => k === 'protocol');
    const synopsisKey = Object.keys(headerMap).find(k => k === 'synopsis');
    const descKey = Object.keys(headerMap).find(k => k === 'description');
    const solutionKey = Object.keys(headerMap).find(k => k === 'solution');
    const outputKey = Object.keys(headerMap).find(k => k.includes('plugin output') || k.includes('output'));
    const cvssKey = Object.keys(headerMap).find(k => k === 'cvss' || k.includes('cvss base') || k.includes('cvss v2'));
    const cvss3Key = Object.keys(headerMap).find(k => k.includes('cvss v3') || k.includes('cvss3'));
    const exploitKey = Object.keys(headerMap).find(k => k.includes('exploit'));

    const title = nameKey ? values[headerMap[nameKey]]?.trim() || `Plugin ${pluginId}` : `Plugin ${pluginId}`;

    findings.push({
      pluginId,
      pluginName: title,
      pluginFamily: familyKey ? values[headerMap[familyKey]]?.trim() || 'Tenable' : 'Tenable',
      port: portKey ? parseInt(values[headerMap[portKey]] || '0', 10) : 0,
      protocol: protocolKey ? values[headerMap[protocolKey]]?.trim()?.toLowerCase() || 'tcp' : 'tcp',
      severity,
      severityNum: getSeverityNum(severity),
      hostIp: host,
      hostFqdn: hostMap.get(host)?.fqdn || null,
      title,
      description: descKey ? values[headerMap[descKey]]?.trim() || '' : '',
      synopsis: synopsisKey ? values[headerMap[synopsisKey]]?.trim() || '' : '',
      solution: solutionKey ? values[headerMap[solutionKey]]?.trim() || '' : '',
      pluginOutput: outputKey ? values[headerMap[outputKey]]?.trim() || '' : '',
      cvssScore: cvssKey ? parseFloat(values[headerMap[cvssKey]]) || null : null,
      cvss3Score: cvss3Key ? parseFloat(values[headerMap[cvss3Key]]) || null : null,
      cvss3Vector: null,
      attackVector: null,
      cves,
      seeAlso: [],
      exploitAvailable: exploitKey ? (values[headerMap[exploitKey]] || '').toLowerCase().includes('true') : false,
      exploitabilityEase: null,
      patchPublished: null,
      vulnPublished: null
    });

    summary[severity]++;
    summary.total++;
  }

  summary.hostsScanned = hostMap.size;

  return {
    scanName: 'Tenable.io Scan',
    scannerVersion: 'Tenable.io',
    hosts: Array.from(hostMap.values()),
    findings,
    summary
  };
}

function mapTenableSeverity(raw) {
  const lower = raw?.toLowerCase() || '';
  if (lower === 'critical' || lower === '4') return 'critical';
  if (lower === 'high' || lower === '3') return 'high';
  if (lower === 'medium' || lower === '2') return 'medium';
  if (lower === 'low' || lower === '1') return 'low';
  return 'info';
}

function getSeverityNum(severity) {
  const map = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'info': 0 };
  return map[severity] || 0;
}

// ============================================================================
// CSV PARSING HELPER
// Handles quoted fields, escaped quotes, commas within quotes
// ============================================================================

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

async function mapFindingToControls(db, finding) {
  const controls = new Set();

  if (finding.pluginFamily) {
    const familyMappings = await db.prepare(
      `SELECT control_id FROM vulnerability_control_mappings WHERE plugin_family = ? AND confidence IN ('high', 'medium')`
    ).bind(finding.pluginFamily).all();
    for (const row of familyMappings.results) {
      controls.add(row.control_id);
    }
  }

  if (finding.attackVector) {
    const vectorMappings = await db.prepare(
      `SELECT control_id FROM vulnerability_control_mappings WHERE cvss_attack_vector = ?`
    ).bind(finding.attackVector).all();
    for (const row of vectorMappings.results) {
      controls.add(row.control_id);
    }
  }

  controls.add('RA-5');

  if (finding.patchPublished) {
    controls.add('SI-2');
  }

  return Array.from(controls);
}

function generateScanPOAM(findings, options = {}) {
  const { groupBy = 'plugin_id', defaultOwnerId = null, systemId, orgId } = options;

  const groups = new Map();
  for (const finding of findings) {
    let key;
    switch (groupBy) {
      case 'plugin_id': key = finding.plugin_id || finding.pluginId; break;
      case 'asset': key = finding.asset_id || finding.assetId; break;
      case 'cve': key = (finding.cves ? JSON.parse(finding.cves || '[]')[0] : null) || finding.plugin_id || finding.pluginId; break;
      default: key = finding.id;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(finding);
  }

  const poams = [];
  let poamCounter = 1;

  for (const [key, groupFindings] of groups) {
    const maxSeverity = groupFindings.reduce((max, f) => {
      return SEVERITY_PRIORITY[f.severity] > SEVERITY_PRIORITY[max] ? f.severity : max;
    }, 'info');

    const representative = groupFindings[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + REMEDIATION_DAYS[maxSeverity]);

    const affectedAssets = [...new Set(groupFindings.map(f => f.asset_id))];

    const poam = {
      id: generateId(),
      orgId,
      systemId,
      poamId: `POAM-SCAN-${Date.now()}-${poamCounter++}`,
      weaknessName: representative.plugin_name || representative.title,
      weaknessDescription: buildScanWeaknessDescription(representative, affectedAssets.length),
      source: 'scan',
      sourceReference: `Nessus Plugin ${representative.plugin_id || representative.pluginId}`,
      riskLevel: maxSeverity === 'info' ? 'low' : maxSeverity,
      assignedTo: defaultOwnerId,
      remediationPlan: representative.remediation_guidance || representative.solution || 'Remediation plan to be developed.',
      milestones: JSON.stringify(generateScanMilestones(maxSeverity)),
      scheduledCompletion: dueDate.toISOString().split('T')[0],
      status: 'open',
      findingIds: groupFindings.map(f => f.id),
      controlMappings: representative.control_mappings ? (typeof representative.control_mappings === 'string' ? JSON.parse(representative.control_mappings) : representative.control_mappings) : []
    };

    poams.push(poam);
  }

  return poams;
}

function buildScanWeaknessDescription(finding, assetCount) {
  let desc = finding.description || finding.synopsis || 'Vulnerability detected by automated scan.';

  if (assetCount > 1) {
    desc += `\n\nAffected Assets: ${assetCount} systems identified with this vulnerability.`;
  }

  const cves = finding.cves ? (typeof finding.cves === 'string' ? JSON.parse(finding.cves) : finding.cves) : [];
  if (cves.length > 0) {
    desc += `\n\nCVE References: ${cves.join(', ')}`;
  }

  if (finding.cvss3_score) {
    desc += `\n\nCVSS v3.x Score: ${finding.cvss3_score}`;
  }

  return desc;
}

function generateScanMilestones(severity) {
  const today = new Date();
  const milestones = [];

  const ack = new Date(today);
  ack.setDate(ack.getDate() + 3);
  milestones.push({ id: 1, description: 'Review and acknowledge finding validity', dueDate: ack.toISOString().split('T')[0], status: 'pending' });

  const plan = new Date(today);
  plan.setDate(plan.getDate() + 7);
  milestones.push({ id: 2, description: 'Develop remediation plan', dueDate: plan.toISOString().split('T')[0], status: 'pending' });

  const implement = new Date(today);
  implement.setDate(implement.getDate() + REMEDIATION_DAYS[severity] - 5);
  milestones.push({ id: 3, description: 'Implement remediation', dueDate: implement.toISOString().split('T')[0], status: 'pending' });

  const verify = new Date(today);
  verify.setDate(verify.getDate() + REMEDIATION_DAYS[severity] - 2);
  milestones.push({ id: 4, description: 'Verify remediation through rescan', dueDate: verify.toISOString().split('T')[0], status: 'pending' });

  const close = new Date(today);
  close.setDate(close.getDate() + REMEDIATION_DAYS[severity]);
  milestones.push({ id: 5, description: 'Document completion and close POA&M', dueDate: close.toISOString().split('T')[0], status: 'pending' });

  return milestones;
}

// ============================================================================
// NESSUS SCANNER INTEGRATION - API Route Handlers
// ============================================================================

async function computeSHA256(data) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleScanImport(request, env, org, user, ctx) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Insufficient permissions' }, 403);

  // Rate limit scan imports: 10 per hour per organization (expensive operation)
  const scanRl = await checkRateLimit(env, `scan:${org.id}`, 10, 3600);
  if (scanRl.limited) return rateLimitResponse(scanRl.retryAfter);

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const systemId = formData.get('system_id');
    const scannerType = formData.get('scanner_type') || 'auto'; // auto, nessus, qualys, tenable
    const autoCreateAssets = formData.get('auto_create_assets') !== 'false';
    const autoMapControls = formData.get('auto_map_controls') !== 'false';
    const minSeverity = formData.get('min_severity') || 'low';

    if (!file) return jsonResponse({ error: 'No file provided' }, 400);
    if (!systemId) return jsonResponse({ error: 'system_id is required' }, 400);

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();

    // Determine scanner type from file extension or explicit parameter
    let detectedType = scannerType;
    if (scannerType === 'auto') {
      if (lowerName.endsWith('.nessus')) {
        detectedType = 'nessus';
      } else if (lowerName.endsWith('.csv')) {
        // Will be determined during parsing by examining headers
        detectedType = 'csv';
      } else {
        return jsonResponse({ error: 'Unsupported file type. Supported: .nessus, .csv (Qualys/Tenable)' }, 400);
      }
    }

    // Validate explicit scanner type matches file
    if (detectedType === 'nessus' && !lowerName.endsWith('.nessus')) {
      return jsonResponse({ error: 'File must be a .nessus file for Nessus scanner type' }, 400);
    }
    if ((detectedType === 'qualys' || detectedType === 'tenable') && !lowerName.endsWith('.csv')) {
      return jsonResponse({ error: 'File must be a .csv file for Qualys/Tenable scanner type' }, 400);
    }

    const fileBuffer = await file.arrayBuffer();
    const fileHash = await computeSHA256(fileBuffer);

    const existing = await env.DB.prepare(
      `SELECT id, status FROM scan_imports WHERE organization_id = ? AND file_hash = ?`
    ).bind(org.id, fileHash).first();

    if (existing) {
      return jsonResponse({
        error: 'This scan file has already been imported',
        existing_import_id: existing.id,
        status: existing.status
      }, 409);
    }

    const scanImportId = generateId();
    const r2Path = `scans/${org.id}/${scanImportId}/${fileName}`;

    // For CSV files, determine type from content if auto-detect
    let finalScannerType = detectedType;
    if (detectedType === 'csv') {
      // Peek at CSV headers to determine scanner
      const decoder = new TextDecoder('utf-8');
      const csvContent = decoder.decode(fileBuffer);
      const firstLines = csvContent.substring(0, 2000).toLowerCase();

      if (firstLines.includes('qid') && (firstLines.includes('qualys') || firstLines.includes('ip') && firstLines.includes('dns'))) {
        finalScannerType = 'qualys';
      } else if (firstLines.includes('plugin id') || firstLines.includes('plugin') && firstLines.includes('risk')) {
        finalScannerType = 'tenable';
      } else {
        return jsonResponse({ error: 'Unable to detect CSV format. Please specify scanner_type as "qualys" or "tenable".' }, 400);
      }
    }

    await env.DB.prepare(`
      INSERT INTO scan_imports (
        id, organization_id, system_id, scanner_type, file_name,
        file_hash, file_path, status, imported_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(scanImportId, org.id, systemId, finalScannerType, fileName, fileHash, r2Path, user.id).run();

    await env.EVIDENCE_VAULT.put(r2Path, fileBuffer, {
      customMetadata: {
        organization_id: org.id,
        scan_import_id: scanImportId,
        uploaded_by: user.id,
        scanner_type: finalScannerType
      }
    });

    // Process based on scanner type
    ctx.waitUntil(processScanFile(env, {
      scanImportId,
      orgId: org.id,
      systemId,
      r2Path,
      autoCreateAssets,
      autoMapControls,
      minSeverity,
      fileBuffer,
      scannerType: finalScannerType,
      importedBy: user.id
    }));

    await auditLog(env, org.id, user.id, 'import', 'scan', scanImportId, { file_name: fileName, system_id: systemId, scanner_type: finalScannerType }, request);

    return jsonResponse({
      scan_import_id: scanImportId,
      status: 'processing',
      scanner_type: finalScannerType,
      file_name: fileName,
      file_hash: `sha256:${fileHash}`,
      message: 'Scan file queued for processing'
    }, 202);

  } catch (error) {
    console.error('Scan import error:', error);
    return jsonResponse({ error: 'Failed to import scan file' }, 500);
  }
}

async function handleGetScanImport(env, org, scanImportId) {
  const scanImport = await env.DB.prepare(
    `SELECT * FROM scan_imports WHERE id = ? AND organization_id = ?`
  ).bind(scanImportId, org.id).first();

  if (!scanImport) return jsonResponse({ error: 'Scan import not found' }, 404);

  const counts = await env.DB.prepare(`
    SELECT
      COUNT(CASE WHEN first_seen_at = last_seen_at THEN 1 END) as new_findings,
      COUNT(CASE WHEN first_seen_at != last_seen_at THEN 1 END) as updated_findings
    FROM vulnerability_findings
    WHERE scan_import_id = ?
  `).bind(scanImportId).first();

  return jsonResponse({
    ...scanImport,
    new_findings: counts?.new_findings || 0,
    updated_findings: counts?.updated_findings || 0
  });
}

async function handleListScanImports(env, url, org) {
  const systemId = url.searchParams.get('system_id');
  const scannerType = url.searchParams.get('scanner_type');
  const status = url.searchParams.get('status');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20', 10), 100);

  let query = `SELECT si.*, s.name as system_name FROM scan_imports si LEFT JOIN systems s ON s.id = si.system_id WHERE si.organization_id = ?`;
  const params = [org.id];

  if (systemId) { query += ` AND si.system_id = ?`; params.push(systemId); }
  if (scannerType) { query += ` AND si.scanner_type = ?`; params.push(scannerType); }
  if (status) { query += ` AND si.status = ?`; params.push(status); }

  const countQuery = query.replace('SELECT si.*, s.name as system_name', 'SELECT COUNT(*) as total');
  const countResult = await env.DB.prepare(countQuery).bind(...params).first();
  const total = countResult?.total || 0;

  query += ` ORDER BY si.created_at DESC LIMIT ? OFFSET ?`;
  params.push(perPage, (page - 1) * perPage);

  const result = await env.DB.prepare(query).bind(...params).all();

  return jsonResponse({
    data: result.results,
    pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) }
  });
}

async function handleGenerateScanPOAMs(request, env, org, user, scanImportId) {
  try {
    if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Insufficient permissions' }, 403);

    const scanImport = await env.DB.prepare(
      `SELECT * FROM scan_imports WHERE id = ? AND organization_id = ? AND status = 'completed'`
    ).bind(scanImportId, org.id).first();

    if (!scanImport) return jsonResponse({ error: 'Scan import not found or not completed' }, 404);

    const body = await request.json();
    const {
      min_severity = 'high',
      exclude_accepted = true,
      exclude_false_positive = true,
      group_by = 'plugin_id',
      default_owner_id = null
    } = body;

    let findingsQuery = `
      SELECT vf.*, a.id as asset_id
      FROM vulnerability_findings vf
      JOIN assets a ON vf.asset_id = a.id
      WHERE vf.scan_import_id = ? AND vf.org_id = ?
    `;
    const params = [scanImportId, org.id];

    const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
    const minIndex = severityOrder.indexOf(min_severity);
    if (minIndex > 0) {
      const allowedSeverities = severityOrder.slice(minIndex);
      findingsQuery += ` AND vf.severity IN (${allowedSeverities.map(() => '?').join(',')})`;
      params.push(...allowedSeverities);
    }

    if (exclude_accepted) findingsQuery += ` AND vf.status != 'accepted'`;
    if (exclude_false_positive) findingsQuery += ` AND vf.status != 'false_positive'`;
    findingsQuery += ` AND vf.related_poam_id IS NULL`;

    const findingsResult = await env.DB.prepare(findingsQuery).bind(...params).all();
    const findings = findingsResult.results;

    if (findings.length === 0) {
      return jsonResponse({ poams_created: 0, findings_linked: 0, message: 'No eligible findings for POA&M generation' });
    }

    const poams = generateScanPOAM(findings, {
      groupBy: group_by,
      defaultOwnerId: default_owner_id,
      systemId: scanImport.system_id,
      orgId: org.id
    });

    const poamIds = [];
    let findingsLinked = 0;

    for (const poam of poams) {
      // Build description with source reference info
      const fullDescription = `${poam.weaknessDescription}\n\nSource: ${poam.source} - ${poam.sourceReference}`;

      await env.DB.prepare(`
        INSERT INTO poams (
          id, org_id, system_id, poam_id, weakness_name, weakness_description,
          risk_level, assigned_to, resources_required, milestones,
          scheduled_completion, status, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        poam.id, poam.orgId, poam.systemId, poam.poamId,
        poam.weaknessName, fullDescription,
        poam.riskLevel, poam.assignedTo, poam.remediationPlan,
        poam.milestones, poam.scheduledCompletion, poam.status,
        `Generated from vulnerability scan: ${poam.sourceReference}`
      ).run();

      poamIds.push(poam.id);

      for (const findingId of poam.findingIds) {
        await env.DB.prepare(
          `UPDATE vulnerability_findings SET related_poam_id = ? WHERE id = ?`
        ).bind(poam.id, findingId).run();
        findingsLinked++;
      }
    }

    await auditLog(env, org.id, user.id, 'generate_poams', 'scan', scanImportId, { poams_created: poams.length, findings_linked: findingsLinked }, request);

    return jsonResponse({ poams_created: poams.length, findings_linked: findingsLinked, poam_ids: poamIds }, 201);
  } catch (error) {
    console.error('POA&M generation error:', error);
    return jsonResponse({ error: error.message || 'Failed to generate POA&Ms' }, 500);
  }
}

async function handleDeleteScanImport(env, org, user, importId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const scanImport = await env.DB.prepare(
    'SELECT * FROM scan_imports WHERE id = ? AND organization_id = ?'
  ).bind(importId, org.id).first();

  if (!scanImport) return jsonResponse({ error: 'Scan import not found' }, 404);

  // Delete related vulnerability findings first (cascade)
  await env.DB.prepare(
    'DELETE FROM vulnerability_findings WHERE scan_import_id = ?'
  ).bind(importId).run();

  // Delete the scan import record
  await env.DB.prepare(
    'DELETE FROM scan_imports WHERE id = ?'
  ).bind(importId).run();

  await auditLog(env, org.id, user.id, 'delete', 'scan_import', importId, {
    file_name: scanImport.file_name,
    scan_name: scanImport.scan_name,
    system_id: scanImport.system_id,
    findings_total: scanImport.findings_total
  });

  return jsonResponse({ message: 'Scan import deleted successfully' });
}

// ============================================
// Asset Inventory Management Handlers
// ============================================

async function handleListAssets(env, url, org) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  const search = url.searchParams.get('search') || '';
  const systemId = url.searchParams.get('system_id') || '';
  const osType = url.searchParams.get('os_type') || '';
  const discoverySource = url.searchParams.get('discovery_source') || '';

  let whereClause = 'WHERE a.org_id = ?';
  const params = [org.id];

  if (search) {
    whereClause += ` AND (a.hostname LIKE ? OR a.ip_address LIKE ? OR a.fqdn LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  if (systemId) {
    whereClause += ' AND a.system_id = ?';
    params.push(systemId);
  }
  if (osType) {
    whereClause += ' AND a.os_type = ?';
    params.push(osType);
  }
  if (discoverySource) {
    whereClause += ' AND a.discovery_source = ?';
    params.push(discoverySource);
  }

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM assets a ${whereClause}`
  ).bind(...params).first();

  const assets = await env.DB.prepare(`
    SELECT
      a.*,
      s.name as system_name,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'critical') as critical_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'high') as high_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'medium') as medium_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'low') as low_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open') as total_findings
    FROM assets a
    LEFT JOIN systems s ON a.system_id = s.id
    ${whereClause}
    ORDER BY a.last_seen_at DESC NULLS LAST, a.hostname ASC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return jsonResponse({
    assets: assets.results,
    total: countResult?.total || 0,
    page,
    limit,
    total_pages: Math.ceil((countResult?.total || 0) / limit)
  });
}

async function handleGetAsset(env, org, assetId) {
  const asset = await env.DB.prepare(`
    SELECT
      a.*,
      s.name as system_name,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'critical') as critical_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'high') as high_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'medium') as medium_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'low') as low_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open') as total_findings
    FROM assets a
    LEFT JOIN systems s ON a.system_id = s.id
    WHERE a.id = ? AND a.org_id = ?
  `).bind(assetId, org.id).first();

  if (!asset) return jsonResponse({ error: 'Asset not found' }, 404);

  const findings = await env.DB.prepare(`
    SELECT id, title, severity, status, first_seen_at, last_seen_at
    FROM vulnerability_findings
    WHERE asset_id = ? AND org_id = ?
    ORDER BY
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      last_seen_at DESC
    LIMIT 20
  `).bind(assetId, org.id).all();

  return jsonResponse({ ...asset, recent_findings: findings.results });
}

async function handleCreateAsset(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Permission denied' }, 403);

  const body = await request.json();

  if (!body.hostname && !body.ip_address) {
    return jsonResponse({ error: 'Either hostname or ip_address is required' }, 400);
  }

  if (body.ip_address || body.hostname) {
    const existing = await env.DB.prepare(`
      SELECT id FROM assets
      WHERE org_id = ? AND (ip_address = ? OR hostname = ?)
    `).bind(org.id, body.ip_address || '', body.hostname || '').first();

    if (existing) {
      return jsonResponse({ error: 'Asset with this IP or hostname already exists' }, 409);
    }
  }

  const assetId = generateId();

  await env.DB.prepare(`
    INSERT INTO assets (
      id, org_id, system_id, hostname, ip_address, mac_address,
      fqdn, netbios_name, os_type, asset_type, discovery_source,
      scan_credentialed, open_ports, environment, boundary_id, data_zone,
      last_seen_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 0, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
  `).bind(
    assetId, org.id, body.system_id || null, body.hostname || null,
    body.ip_address || null, body.mac_address || null, body.fqdn || null,
    body.netbios_name || null, body.os_type || null, body.asset_type || 'server',
    body.open_ports || null, body.environment || 'production', body.boundary_id || null, body.data_zone || null
  ).run();

  await auditLog(env, org.id, user.id, 'create', 'asset', assetId,
    { hostname: body.hostname, ip_address: body.ip_address, environment: body.environment });

  return jsonResponse({ id: assetId, message: 'Asset created' }, 201);
}

async function handleUpdateAsset(request, env, org, user, assetId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Permission denied' }, 403);

  const existing = await env.DB.prepare(
    'SELECT id FROM assets WHERE id = ? AND org_id = ?'
  ).bind(assetId, org.id).first();

  if (!existing) return jsonResponse({ error: 'Asset not found' }, 404);

  const body = await request.json();

  await env.DB.prepare(`
    UPDATE assets SET
      system_id = COALESCE(?, system_id),
      hostname = COALESCE(?, hostname),
      ip_address = COALESCE(?, ip_address),
      mac_address = COALESCE(?, mac_address),
      fqdn = COALESCE(?, fqdn),
      netbios_name = COALESCE(?, netbios_name),
      os_type = COALESCE(?, os_type),
      asset_type = COALESCE(?, asset_type),
      open_ports = COALESCE(?, open_ports),
      environment = COALESCE(?, environment),
      boundary_id = COALESCE(?, boundary_id),
      data_zone = COALESCE(?, data_zone),
      updated_at = datetime('now')
    WHERE id = ? AND org_id = ?
  `).bind(
    body.system_id, body.hostname, body.ip_address, body.mac_address,
    body.fqdn, body.netbios_name, body.os_type, body.asset_type, body.open_ports,
    body.environment, body.boundary_id, body.data_zone,
    assetId, org.id
  ).run();

  await auditLog(env, org.id, user.id, 'update', 'asset', assetId, body);

  return jsonResponse({ message: 'Asset updated' });
}

async function handleDeleteAsset(env, org, user, assetId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Permission denied. Manager role required.' }, 403);

  const existing = await env.DB.prepare(
    'SELECT hostname, ip_address FROM assets WHERE id = ? AND org_id = ?'
  ).bind(assetId, org.id).first();

  if (!existing) return jsonResponse({ error: 'Asset not found' }, 404);

  await env.DB.prepare(
    'DELETE FROM vulnerability_findings WHERE asset_id = ? AND org_id = ?'
  ).bind(assetId, org.id).run();

  await env.DB.prepare(
    'DELETE FROM assets WHERE id = ? AND org_id = ?'
  ).bind(assetId, org.id).run();

  await auditLog(env, org.id, user.id, 'delete', 'asset', assetId,
    { hostname: existing.hostname, ip_address: existing.ip_address });

  return jsonResponse({ message: 'Asset deleted' });
}

// ============================================================================
// ASSET BULK OPERATIONS & ENHANCEMENTS
// ============================================================================

async function handleGetAssetScanHistory(env, org, assetId) {
  const asset = await env.DB.prepare(
    'SELECT id FROM assets WHERE id = ? AND org_id = ?'
  ).bind(assetId, org.id).first();
  if (!asset) return jsonResponse({ error: 'Asset not found' }, 404);

  const { results } = await env.DB.prepare(`
    SELECT ash.*, si.file_name, si.scan_name, si.scanner_type, si.scan_completed_at
    FROM asset_scan_history ash
    JOIN scan_imports si ON si.id = ash.scan_import_id
    WHERE ash.asset_id = ?
    ORDER BY ash.seen_at DESC
    LIMIT 50
  `).bind(assetId).all();

  return jsonResponse({ scan_history: results });
}

function calculateAssetRiskScore(asset) {
  // Base weights per severity (CVSS-aligned)
  const weights = { critical: 40, high: 25, medium: 10, low: 3 };

  // Calculate raw score
  let rawScore =
    (asset.critical_count || 0) * weights.critical +
    (asset.high_count || 0) * weights.high +
    (asset.medium_count || 0) * weights.medium +
    (asset.low_count || 0) * weights.low;

  // Apply environment multiplier
  const envMultiplier = {
    production: 1.5, govcloud: 1.5, enclave: 1.5,
    staging: 1.0, shared: 1.0, commercial: 1.0,
    development: 0.7
  };
  rawScore *= envMultiplier[asset.environment] || 1.0;

  // Apply data zone multiplier
  const dataMultiplier = {
    cui: 2.0, classified: 2.0,
    pii: 1.5, phi: 1.5, pci: 1.5,
    internal: 1.0, public: 0.8
  };
  rawScore *= dataMultiplier[asset.data_zone] || 1.0;

  // Credentialed scan bonus (reduce score by 10%)
  if (asset.scan_credentialed) {
    rawScore *= 0.9;
  }

  // Cap at 100 and round
  return Math.min(100, Math.round(rawScore));
}

async function handleRecalculateRiskScores(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Permission denied. Manager role required.' }, 403);

  const { results: assets } = await env.DB.prepare(`
    SELECT a.id, a.environment, a.data_zone, a.scan_credentialed,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'critical') as critical_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'high') as high_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'medium') as medium_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'low') as low_count
    FROM assets a WHERE a.org_id = ?
  `).bind(org.id).all();

  let updated = 0;
  for (const asset of assets) {
    const score = calculateAssetRiskScore(asset);
    await env.DB.prepare(
      `UPDATE assets SET risk_score = ?, risk_score_updated_at = datetime('now') WHERE id = ?`
    ).bind(score, asset.id).run();
    updated++;
  }

  await auditLog(env, org.id, user.id, 'recalculate_risk_scores', 'asset', null, { count: updated });

  return jsonResponse({ message: `Updated ${updated} asset risk scores`, updated });
}

async function handleBulkUpdateAssets(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Permission denied. Analyst role required.' }, 403);

  // Rate limit bulk operations: 30 per hour per organization
  const bulkRl = await checkRateLimit(env, `bulk:${org.id}`, 30, 3600);
  if (bulkRl.limited) return rateLimitResponse(bulkRl.retryAfter);

  const { asset_ids, system_id, environment, data_zone, boundary_id } = await request.json();

  if (!asset_ids?.length) return jsonResponse({ error: 'asset_ids required' }, 400);
  if (asset_ids.length > 200) return jsonResponse({ error: 'Maximum 200 assets per batch' }, 400);

  // Build update fields
  const updates = [];
  const values = [];
  if (system_id !== undefined) { updates.push('system_id = ?'); values.push(system_id || null); }
  if (environment) { updates.push('environment = ?'); values.push(environment); }
  if (data_zone !== undefined) { updates.push('data_zone = ?'); values.push(data_zone || null); }
  if (boundary_id !== undefined) { updates.push('boundary_id = ?'); values.push(boundary_id || null); }

  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push("updated_at = datetime('now')");

  let updated = 0;
  for (const assetId of asset_ids) {
    const asset = await env.DB.prepare(
      'SELECT id FROM assets WHERE id = ? AND org_id = ?'
    ).bind(assetId, org.id).first();

    if (asset) {
      await env.DB.prepare(
        `UPDATE assets SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values, assetId).run();
      updated++;
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_update', 'asset', null, {
    count: updated, system_id, environment, data_zone
  });

  return jsonResponse({ message: `Updated ${updated} assets`, updated });
}

async function handleBulkDeleteAssets(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Permission denied. Manager role required.' }, 403);

  const { asset_ids, confirm_delete_findings } = await request.json();

  if (!asset_ids?.length) return jsonResponse({ error: 'asset_ids required' }, 400);
  if (asset_ids.length > 100) return jsonResponse({ error: 'Maximum 100 assets per batch' }, 400);

  // Count associated findings
  const placeholders = asset_ids.map(() => '?').join(',');
  const findingsCount = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM vulnerability_findings
     WHERE asset_id IN (${placeholders}) AND org_id = ?`
  ).bind(...asset_ids, org.id).first();

  if (findingsCount?.count > 0 && !confirm_delete_findings) {
    return jsonResponse({
      error: 'Assets have associated findings',
      findings_count: findingsCount.count,
      message: 'Set confirm_delete_findings=true to delete assets and their findings'
    }, 400);
  }

  let deleted = 0;
  for (const assetId of asset_ids) {
    const asset = await env.DB.prepare(
      'SELECT id, hostname, ip_address FROM assets WHERE id = ? AND org_id = ?'
    ).bind(assetId, org.id).first();

    if (asset) {
      // Delete findings first (cascade)
      await env.DB.prepare('DELETE FROM vulnerability_findings WHERE asset_id = ?').bind(assetId).run();
      await env.DB.prepare('DELETE FROM asset_scan_history WHERE asset_id = ?').bind(assetId).run();
      await env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(assetId).run();
      deleted++;
    }
  }

  await auditLog(env, org.id, user.id, 'bulk_delete', 'asset', null, {
    count: deleted,
    findings_deleted: findingsCount?.count || 0
  });

  return jsonResponse({ message: `Deleted ${deleted} assets`, deleted });
}

async function handleExportAssetsCSV(env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Permission denied' }, 403);

  // Rate limit exports: 20 per hour per organization
  const exportRl = await checkRateLimit(env, `export:${org.id}`, 20, 3600);
  if (exportRl.limited) return rateLimitResponse(exportRl.retryAfter);

  const assets = await env.DB.prepare(`
    SELECT
      a.*,
      s.name as system_name,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'critical') as critical_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'high') as high_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'medium') as medium_count,
      (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'low') as low_count
    FROM assets a
    LEFT JOIN systems s ON a.system_id = s.id
    WHERE a.org_id = ?
    ORDER BY a.hostname ASC
  `).bind(org.id).all();

  const csvEscape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = ['Hostname', 'IP Address', 'FQDN', 'MAC Address', 'OS Type',
    'System Name', 'Asset Type', 'Discovery Source', 'Last Seen',
    'Critical Count', 'High Count', 'Medium Count', 'Low Count'];

  const rows = assets.results.map(a => [
    csvEscape(a.hostname), csvEscape(a.ip_address), csvEscape(a.fqdn),
    csvEscape(a.mac_address), csvEscape(a.os_type), csvEscape(a.system_name),
    csvEscape(a.asset_type), csvEscape(a.discovery_source), csvEscape(a.last_seen_at),
    a.critical_count || 0, a.high_count || 0, a.medium_count || 0, a.low_count || 0
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\r\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="assets_export_${new Date().toISOString().split('T')[0]}.csv"`,
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleImportAssetsCSV(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Permission denied. Manager role required.' }, 403);

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) return jsonResponse({ error: 'No file provided' }, 400);

  const content = await file.text();
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    return jsonResponse({ error: 'CSV must have header row and at least one data row' }, 400);
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const hostnameIdx = header.findIndex(h => h === 'hostname');
  const ipIdx = header.findIndex(h => h === 'ip_address' || h === 'ip');
  const fqdnIdx = header.findIndex(h => h === 'fqdn');
  const macIdx = header.findIndex(h => h === 'mac_address' || h === 'mac');
  const osIdx = header.findIndex(h => h === 'os_type' || h === 'os');
  const typeIdx = header.findIndex(h => h === 'asset_type' || h === 'type');

  const systemId = formData.get('system_id') || null;

  let created = 0, updated = 0, skipped = 0;
  const errors = [];

  for (let i = 1; i < lines.length && i < 1001; i++) {
    const values = parseCSVLine(lines[i]);
    const hostname = hostnameIdx >= 0 ? values[hostnameIdx]?.trim() : null;
    const ip = ipIdx >= 0 ? values[ipIdx]?.trim() : null;

    if (!hostname && !ip) {
      skipped++;
      continue;
    }

    try {
      const existing = await env.DB.prepare(`
        SELECT id FROM assets WHERE org_id = ? AND (ip_address = ? OR hostname = ?)
      `).bind(org.id, ip || '', hostname || '').first();

      if (existing) {
        await env.DB.prepare(`
          UPDATE assets SET
            fqdn = COALESCE(?, fqdn),
            mac_address = COALESCE(?, mac_address),
            os_type = COALESCE(?, os_type),
            asset_type = COALESCE(?, asset_type),
            system_id = COALESCE(?, system_id),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          fqdnIdx >= 0 ? values[fqdnIdx]?.trim() || null : null,
          macIdx >= 0 ? values[macIdx]?.trim() || null : null,
          osIdx >= 0 ? values[osIdx]?.trim() || null : null,
          typeIdx >= 0 ? values[typeIdx]?.trim() || null : null,
          systemId,
          existing.id
        ).run();
        updated++;
      } else {
        const assetId = generateId();
        await env.DB.prepare(`
          INSERT INTO assets (
            id, org_id, system_id, hostname, ip_address, mac_address,
            fqdn, os_type, asset_type, discovery_source, scan_credentialed,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'csv_import', 0, datetime('now'), datetime('now'))
        `).bind(
          assetId, org.id, systemId, hostname, ip,
          macIdx >= 0 ? values[macIdx]?.trim() || null : null,
          fqdnIdx >= 0 ? values[fqdnIdx]?.trim() || null : null,
          osIdx >= 0 ? values[osIdx]?.trim() || null : null,
          typeIdx >= 0 ? values[typeIdx]?.trim() || 'server' : 'server'
        ).run();
        created++;
      }
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
      skipped++;
    }
  }

  await auditLog(env, org.id, user.id, 'import', 'assets', null,
    { created, updated, skipped, errors_count: errors.length });

  return jsonResponse({
    message: 'Import completed',
    summary: { created, updated, skipped, errors: errors.slice(0, 10) }
  });
}

// ============================================================================
// UNIFIED SCAN PROCESSOR
// Routes to appropriate parser based on scanner type
// ============================================================================

async function processScanFile(env, options) {
  const { scanImportId, orgId, systemId, scannerType, fileBuffer, autoCreateAssets, autoMapControls, minSeverity, importedBy } = options;

  try {
    await env.DB.prepare(`UPDATE scan_imports SET status = 'processing' WHERE id = ?`).bind(scanImportId).run();

    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(fileBuffer);

    let scanData;
    let discoverySource;

    switch (scannerType) {
      case 'nessus':
        scanData = await parseNessusXML(content);
        discoverySource = 'nessus_scan';
        break;
      case 'qualys':
        scanData = parseQualysCSV(content);
        discoverySource = 'qualys_scan';
        break;
      case 'tenable':
        scanData = parseTenableCSV(content);
        discoverySource = 'tenable_scan';
        break;
      default:
        throw new Error(`Unsupported scanner type: ${scannerType}`);
    }

    // Update scan import metadata
    await env.DB.prepare(`
      UPDATE scan_imports SET scanner_version = ?, scan_name = ?, hosts_scanned = ? WHERE id = ?
    `).bind(scanData.scannerVersion, scanData.scanName, scanData.summary.hostsScanned, scanImportId).run();

    // Process hosts and findings using common logic
    await processScannedData(env, {
      scanImportId,
      orgId,
      systemId,
      scanData,
      discoverySource,
      autoCreateAssets,
      autoMapControls,
      minSeverity,
      importedBy
    });

  } catch (error) {
    console.error('Scan processing error:', error);
    await env.DB.prepare(
      `UPDATE scan_imports SET status = 'failed', error_message = ? WHERE id = ?`
    ).bind(error.message, scanImportId).run();
  }
}

// Common processing logic for all scanner types
async function processScannedData(env, options) {
  const { scanImportId, orgId, systemId, scanData, discoverySource, autoCreateAssets, autoMapControls, minSeverity, importedBy } = options;

  const assetMap = new Map();

  // Process hosts
  for (const host of scanData.hosts) {
    let asset = await env.DB.prepare(
      `SELECT id FROM assets WHERE org_id = ? AND (ip_address = ? OR hostname = ?)`
    ).bind(orgId, host.ipAddress, host.hostname).first();

    if (!asset && autoCreateAssets) {
      const assetId = generateId();
      await env.DB.prepare(`
        INSERT INTO assets (
          id, org_id, system_id, hostname, ip_address, mac_address,
          fqdn, netbios_name, os_type, asset_type, discovery_source,
          scan_credentialed, last_seen_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'server', ?, ?, datetime('now'))
      `).bind(
        assetId, orgId, systemId, host.hostname, host.ipAddress,
        host.macAddress, host.fqdn, host.netbiosName, host.osType,
        discoverySource, host.credentialed ? 1 : 0
      ).run();
      asset = { id: assetId };
    } else if (asset) {
      await env.DB.prepare(`
        UPDATE assets SET
          fqdn = COALESCE(?, fqdn), netbios_name = COALESCE(?, netbios_name),
          os_type = COALESCE(?, os_type), scan_credentialed = ?, last_seen_at = datetime('now')
        WHERE id = ?
      `).bind(host.fqdn, host.netbiosName, host.osType, host.credentialed ? 1 : 0, asset.id).run();
    }

    if (asset) assetMap.set(host.ipAddress, asset.id);
  }

  // Process findings
  const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
  const minIndex = severityOrder.indexOf(minSeverity);
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };

  for (const finding of scanData.findings) {
    const findingSeverityIndex = severityOrder.indexOf(finding.severity);
    if (findingSeverityIndex < minIndex) continue;

    const assetId = assetMap.get(finding.hostIp);
    if (!assetId) continue;

    const existing = await env.DB.prepare(
      `SELECT id, first_seen_at FROM vulnerability_findings WHERE org_id = ? AND asset_id = ? AND plugin_id = ? AND port = ? AND protocol = ?`
    ).bind(orgId, assetId, finding.pluginId, finding.port, finding.protocol).first();

    let controlMappings = [];
    if (autoMapControls) {
      controlMappings = await mapFindingToControls(env.DB, finding);
    }

    if (existing) {
      await env.DB.prepare(`
        UPDATE vulnerability_findings SET
          scan_import_id = ?, title = ?, description = ?, severity = ?,
          cvss_score = ?, cvss3_score = ?, cvss3_vector = ?,
          remediation_guidance = ?, plugin_output = ?, exploit_available = ?,
          see_also = ?, control_mappings = ?,
          last_seen_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        scanImportId, finding.title, finding.description, finding.severity,
        finding.cvssScore, finding.cvss3Score, finding.cvss3Vector,
        finding.solution, finding.pluginOutput, finding.exploitAvailable ? 1 : 0,
        JSON.stringify(finding.seeAlso), JSON.stringify(controlMappings),
        existing.id
      ).run();
    } else {
      const findingId = generateId();
      await env.DB.prepare(`
        INSERT INTO vulnerability_findings (
          id, org_id, asset_id, scan_import_id, scan_id,
          plugin_id, plugin_name, plugin_family, port, protocol,
          title, description, severity, cvss_score, cvss3_score, cvss3_vector,
          affected_component, remediation_guidance, plugin_output,
          exploit_available, see_also, control_mappings,
          first_seen_at, last_seen_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'open')
      `).bind(
        findingId, orgId, assetId, scanImportId, scanImportId,
        finding.pluginId, finding.pluginName, finding.pluginFamily,
        finding.port, finding.protocol, finding.title, finding.description,
        finding.severity, finding.cvssScore, finding.cvss3Score, finding.cvss3Vector,
        `${finding.hostIp}:${finding.port}`, finding.solution, finding.pluginOutput,
        finding.exploitAvailable ? 1 : 0, JSON.stringify(finding.seeAlso),
        JSON.stringify(controlMappings)
      ).run();
    }

    counts[finding.severity]++;
    counts.total++;
  }

  // Update scan import with results
  await env.DB.prepare(`
    UPDATE scan_imports SET
      status = 'completed', findings_total = ?, findings_critical = ?,
      findings_high = ?, findings_medium = ?, findings_low = ?
    WHERE id = ?
  `).bind(counts.total, counts.critical, counts.high, counts.medium, counts.low, scanImportId).run();

  // Record scan history and update risk scores
  const assetFindingCounts = new Map();
  for (const finding of scanData.findings) {
    const assetId = assetMap.get(finding.hostIp);
    if (!assetId) continue;

    if (!assetFindingCounts.has(assetId)) {
      assetFindingCounts.set(assetId, { total: 0, critical: 0, high: 0, medium: 0, low: 0, credentialed: 0 });
    }
    const c = assetFindingCounts.get(assetId);
    c.total++;
    if (finding.severity === 'critical') c.critical++;
    else if (finding.severity === 'high') c.high++;
    else if (finding.severity === 'medium') c.medium++;
    else if (finding.severity === 'low') c.low++;
  }

  for (const [ip, assetId] of assetMap.entries()) {
    const host = scanData.hosts.find(h => h.ipAddress === ip);
    const assetCounts = assetFindingCounts.get(assetId) || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

    await env.DB.prepare(`
      INSERT INTO asset_scan_history (id, asset_id, scan_import_id, findings_count, critical_count, high_count, medium_count, low_count, credentialed, seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(asset_id, scan_import_id) DO UPDATE SET
        findings_count = excluded.findings_count, critical_count = excluded.critical_count,
        high_count = excluded.high_count, medium_count = excluded.medium_count,
        low_count = excluded.low_count, credentialed = excluded.credentialed, seen_at = excluded.seen_at
    `).bind(generateId(), assetId, scanImportId, assetCounts.total, assetCounts.critical, assetCounts.high, assetCounts.medium, assetCounts.low, host?.credentialed ? 1 : 0).run();

    await env.DB.prepare(`
      UPDATE assets SET first_seen_at = COALESCE(first_seen_at, datetime('now')) WHERE id = ?
    `).bind(assetId).run();

    const assetData = await env.DB.prepare(`
      SELECT a.environment, a.data_zone, a.scan_credentialed,
        (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'critical') as critical_count,
        (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'high') as high_count,
        (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'medium') as medium_count,
        (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'low') as low_count
      FROM assets a WHERE a.id = ?
    `).bind(assetId).first();

    if (assetData) {
      const riskScore = calculateAssetRiskScore(assetData);
      await env.DB.prepare(`
        UPDATE assets SET risk_score = ?, risk_score_updated_at = datetime('now') WHERE id = ?
      `).bind(riskScore, assetId).run();
    }
  }

  // Send notifications
  if (importedBy) {
    const scanImport = await env.DB.prepare('SELECT file_name, scan_name FROM scan_imports WHERE id = ?').bind(scanImportId).first();
    const scanName = scanImport?.scan_name || scanImport?.file_name || 'Scan';
    const priority = counts.critical > 0 ? 'urgent' : (counts.high > 0 ? 'high' : 'normal');

    await createNotification(
      env, orgId, importedBy, 'scan_complete',
      'Scan Processing Complete',
      `${scanName} completed: ${counts.total} findings (${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low).`,
      'scan_import', scanImportId,
      { findings_total: counts.total, findings_critical: counts.critical, findings_high: counts.high },
      priority
    );

    if (counts.critical > 0) {
      await notifyOrgRole(
        env, orgId, importedBy, 'manager',
        'scan_complete',
        'Critical Vulnerabilities Detected',
        `Scan "${scanName}" found ${counts.critical} critical vulnerabilities requiring immediate attention.`,
        'scan_import', scanImportId,
        { findings_critical: counts.critical }
      );
    }
  }
}

async function processNessusScan(env, options) {
  const { scanImportId, orgId, systemId, r2Path, autoCreateAssets, autoMapControls, minSeverity, fileBuffer } = options;

  try {
    await env.DB.prepare(`UPDATE scan_imports SET status = 'processing' WHERE id = ?`).bind(scanImportId).run();

    const decoder = new TextDecoder('utf-8');
    const xmlContent = decoder.decode(fileBuffer);
    const scanData = await parseNessusXML(xmlContent);

    await env.DB.prepare(`
      UPDATE scan_imports SET scanner_version = ?, scan_name = ?, hosts_scanned = ? WHERE id = ?
    `).bind(scanData.scannerVersion, scanData.scanName, scanData.summary.hostsScanned, scanImportId).run();

    const assetMap = new Map();

    for (const host of scanData.hosts) {
      let asset = await env.DB.prepare(
        `SELECT id FROM assets WHERE org_id = ? AND (ip_address = ? OR hostname = ?)`
      ).bind(orgId, host.ipAddress, host.hostname).first();

      if (!asset && autoCreateAssets) {
        const assetId = generateId();
        await env.DB.prepare(`
          INSERT INTO assets (
            id, org_id, system_id, hostname, ip_address, mac_address,
            fqdn, netbios_name, os_type, asset_type, discovery_source,
            scan_credentialed, last_seen_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'server', 'nessus_scan', ?, datetime('now'))
        `).bind(
          assetId, orgId, systemId, host.hostname, host.ipAddress,
          host.macAddress, host.fqdn, host.netbiosName, host.osType,
          host.credentialed ? 1 : 0
        ).run();
        asset = { id: assetId };
      } else if (asset) {
        await env.DB.prepare(`
          UPDATE assets SET
            fqdn = COALESCE(?, fqdn), netbios_name = COALESCE(?, netbios_name),
            os_type = COALESCE(?, os_type), scan_credentialed = ?, last_seen_at = datetime('now')
          WHERE id = ?
        `).bind(host.fqdn, host.netbiosName, host.osType, host.credentialed ? 1 : 0, asset.id).run();
      }

      if (asset) assetMap.set(host.ipAddress, asset.id);
    }

    const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
    const minIndex = severityOrder.indexOf(minSeverity);
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };

    for (const finding of scanData.findings) {
      const findingSeverityIndex = severityOrder.indexOf(finding.severity);
      if (findingSeverityIndex < minIndex) continue;

      const assetId = assetMap.get(finding.hostIp);
      if (!assetId) continue;

      const existing = await env.DB.prepare(
        `SELECT id, first_seen_at FROM vulnerability_findings WHERE org_id = ? AND asset_id = ? AND plugin_id = ? AND port = ? AND protocol = ?`
      ).bind(orgId, assetId, finding.pluginId, finding.port, finding.protocol).first();

      let controlMappings = [];
      if (autoMapControls) {
        controlMappings = await mapFindingToControls(env.DB, finding);
      }

      if (existing) {
        await env.DB.prepare(`
          UPDATE vulnerability_findings SET
            scan_import_id = ?, title = ?, description = ?, severity = ?,
            cvss_score = ?, cvss3_score = ?, cvss3_vector = ?,
            remediation_guidance = ?, plugin_output = ?, exploit_available = ?,
            see_also = ?, control_mappings = ?,
            last_seen_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          scanImportId, finding.title, finding.description, finding.severity,
          finding.cvssScore, finding.cvss3Score, finding.cvss3Vector,
          finding.solution, finding.pluginOutput, finding.exploitAvailable ? 1 : 0,
          JSON.stringify(finding.seeAlso), JSON.stringify(controlMappings),
          existing.id
        ).run();
      } else {
        const findingId = generateId();
        await env.DB.prepare(`
          INSERT INTO vulnerability_findings (
            id, org_id, asset_id, scan_import_id, scan_id,
            plugin_id, plugin_name, plugin_family, port, protocol,
            title, description, severity, cvss_score, cvss3_score, cvss3_vector,
            affected_component, remediation_guidance, plugin_output,
            exploit_available, see_also, control_mappings,
            first_seen_at, last_seen_at, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'open')
        `).bind(
          findingId, orgId, assetId, scanImportId, scanImportId,
          finding.pluginId, finding.pluginName, finding.pluginFamily,
          finding.port, finding.protocol, finding.title, finding.description,
          finding.severity, finding.cvssScore, finding.cvss3Score, finding.cvss3Vector,
          `${finding.hostIp}:${finding.port}`, finding.solution, finding.pluginOutput,
          finding.exploitAvailable ? 1 : 0, JSON.stringify(finding.seeAlso),
          JSON.stringify(controlMappings)
        ).run();
      }

      counts[finding.severity]++;
      counts.total++;
    }

    await env.DB.prepare(`
      UPDATE scan_imports SET
        status = 'completed', findings_total = ?, findings_critical = ?,
        findings_high = ?, findings_medium = ?, findings_low = ?
      WHERE id = ?
    `).bind(counts.total, counts.critical, counts.high, counts.medium, counts.low, scanImportId).run();

    // ============================================================================
    // RECORD SCAN HISTORY AND UPDATE RISK SCORES
    // ============================================================================

    // Build per-asset finding counts
    const assetFindingCounts = new Map();
    for (const finding of scanData.findings) {
      const assetId = assetMap.get(finding.hostIp);
      if (!assetId) continue;

      if (!assetFindingCounts.has(assetId)) {
        assetFindingCounts.set(assetId, { total: 0, critical: 0, high: 0, medium: 0, low: 0, credentialed: 0 });
      }
      const c = assetFindingCounts.get(assetId);
      c.total++;
      if (finding.severity === 'critical') c.critical++;
      else if (finding.severity === 'high') c.high++;
      else if (finding.severity === 'medium') c.medium++;
      else if (finding.severity === 'low') c.low++;
    }

    // Record scan history and update risk scores for each asset
    for (const [ip, assetId] of assetMap.entries()) {
      const host = scanData.hosts.find(h => h.ipAddress === ip);
      const counts = assetFindingCounts.get(assetId) || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

      // Insert/update scan history
      await env.DB.prepare(`
        INSERT INTO asset_scan_history (id, asset_id, scan_import_id, findings_count, critical_count, high_count, medium_count, low_count, credentialed, seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(asset_id, scan_import_id) DO UPDATE SET
          findings_count = excluded.findings_count, critical_count = excluded.critical_count,
          high_count = excluded.high_count, medium_count = excluded.medium_count,
          low_count = excluded.low_count, credentialed = excluded.credentialed, seen_at = excluded.seen_at
      `).bind(generateId(), assetId, scanImportId, counts.total, counts.critical, counts.high, counts.medium, counts.low, host?.credentialed ? 1 : 0).run();

      // Set first_seen_at if not already set
      await env.DB.prepare(`
        UPDATE assets SET first_seen_at = COALESCE(first_seen_at, datetime('now')) WHERE id = ?
      `).bind(assetId).run();

      // Calculate and update risk score
      const assetData = await env.DB.prepare(`
        SELECT a.environment, a.data_zone, a.scan_credentialed,
          (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'critical') as critical_count,
          (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'high') as high_count,
          (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'medium') as medium_count,
          (SELECT COUNT(*) FROM vulnerability_findings vf WHERE vf.asset_id = a.id AND vf.status = 'open' AND vf.severity = 'low') as low_count
        FROM assets a WHERE a.id = ?
      `).bind(assetId).first();

      if (assetData) {
        const riskScore = calculateAssetRiskScore(assetData);
        await env.DB.prepare(`
          UPDATE assets SET risk_score = ?, risk_score_updated_at = datetime('now') WHERE id = ?
        `).bind(riskScore, assetId).run();
      }
    }

    // Send scan completion notification
    if (options.importedBy) {
      const scanImport = await env.DB.prepare('SELECT file_name, scan_name FROM scan_imports WHERE id = ?').bind(scanImportId).first();
      const scanName = scanImport?.scan_name || scanImport?.file_name || 'Nessus scan';
      const priority = counts.critical > 0 ? 'urgent' : (counts.high > 0 ? 'high' : 'normal');

      await createNotification(
        env, orgId, options.importedBy, 'scan_complete',
        'Scan Processing Complete',
        `${scanName} completed: ${counts.total} findings (${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low).`,
        'scan_import', scanImportId,
        { findings_total: counts.total, findings_critical: counts.critical, findings_high: counts.high },
        priority
      );

      // Notify managers if critical vulnerabilities found
      if (counts.critical > 0) {
        await notifyOrgRole(
          env, orgId, options.importedBy, 'manager',
          'scan_complete',
          'Critical Vulnerabilities Detected',
          `Scan "${scanName}" found ${counts.critical} critical vulnerabilities requiring immediate attention.`,
          'scan_import', scanImportId,
          { findings_critical: counts.critical }
        );
      }
    }

  } catch (error) {
    console.error('Scan processing error:', error);
    await env.DB.prepare(
      `UPDATE scan_imports SET status = 'failed', error_message = ? WHERE id = ?`
    ).bind(error.message, scanImportId).run();
  }
}

// ─── Weekly Digest ───────────────────────────────────────────────────────────

async function handleWeeklyDigest(env) {
  try {
    console.log('[CRON] Starting weekly digest...');

    // Get all orgs
    const { results: orgs } = await env.DB.prepare('SELECT id, name, settings FROM organizations').all();
    let sentCount = 0;

    for (const org of orgs) {
      // Get managers/admins with weekly_digest enabled
      const { results: users } = await env.DB.prepare(
        `SELECT u.id, u.email, u.name, u.role
         FROM users u
         LEFT JOIN notification_preferences np ON np.user_id = u.id
         WHERE u.org_id = ? AND u.role IN ('manager', 'admin', 'owner')
         AND (np.weekly_digest = 1 OR np.weekly_digest IS NULL)`
      ).bind(org.id).all();

      if (users.length === 0) continue;

      // Get current compliance data
      const weights = getOrgScoringWeights(org);
      const [controlStats, poamStats, evidenceStats, riskStats, monitoringStats] = await Promise.all([
        env.DB.prepare(`SELECT
          COUNT(*) as total,
          SUM(CASE WHEN ci.status = 'implemented' THEN 1 ELSE 0 END) as implemented,
          SUM(CASE WHEN ci.status = 'partially_implemented' THEN 1 ELSE 0 END) as partially,
          SUM(CASE WHEN ci.status = 'planned' THEN 1 ELSE 0 END) as planned,
          SUM(CASE WHEN ci.status = 'not_applicable' THEN 1 ELSE 0 END) as na
         FROM control_implementations ci JOIN systems s ON ci.system_id = s.id WHERE s.org_id = ?`).bind(org.id).first(),
        env.DB.prepare(`SELECT
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status != 'completed' AND scheduled_completion < date('now') THEN 1 ELSE 0 END) as overdue
         FROM poams WHERE org_id = ?`).bind(org.id).first(),
        env.DB.prepare(`SELECT COUNT(DISTINCT ci.control_id) as applicable, COUNT(DISTINCT e.control_id) as covered
         FROM control_implementations ci LEFT JOIN evidence e ON ci.control_id = e.control_id AND e.org_id = ci.system_id
         JOIN systems s ON ci.system_id = s.id WHERE s.org_id = ?`).bind(org.id).first(),
        env.DB.prepare(`SELECT
          SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN risk_level = 'moderate' THEN 1 ELSE 0 END) as moderate,
          SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low
         FROM risks WHERE org_id = ?`).bind(org.id).first(),
        env.DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN last_result = 'pass' THEN 1 ELSE 0 END) as pass
         FROM monitoring_checks WHERE org_id = ?`).bind(org.id).first(),
      ]);

      const scoreData = {
        controls: { total: controlStats?.total || 0, implemented: controlStats?.implemented || 0, partially: controlStats?.partially || 0, planned: controlStats?.planned || 0, na: controlStats?.na || 0 },
        poams: { open: poamStats?.open || 0, in_progress: poamStats?.in_progress || 0, completed: poamStats?.completed || 0, overdue: poamStats?.overdue || 0 },
        evidence: { applicable: evidenceStats?.applicable || 0, covered: evidenceStats?.covered || 0 },
        risks: { critical: riskStats?.critical || 0, high: riskStats?.high || 0, moderate: riskStats?.moderate || 0, low: riskStats?.low || 0 },
        monitoring: { total: monitoringStats?.total || 0, pass: monitoringStats?.pass || 0 },
      };
      const current = computeComplianceScore(scoreData, weights);

      // Week's activity
      const weekPoams = await env.DB.prepare(
        `SELECT
          SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as new_count,
          SUM(CASE WHEN status = 'completed' AND updated_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as closed_count
         FROM poams WHERE org_id = ?`
      ).bind(org.id).first();

      // Upcoming deadlines (next 7 days)
      const { results: deadlines } = await env.DB.prepare(
        `SELECT 'POA&M' as type, poam_id as ref, weakness_name as name, scheduled_completion as due_date
         FROM poams WHERE org_id = ? AND status != 'completed' AND scheduled_completion BETWEEN date('now') AND date('now', '+7 days')
         ORDER BY scheduled_completion LIMIT 10`
      ).bind(org.id).all();

      // Week's alert count
      const alertCount = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM notifications WHERE org_id = ? AND created_at >= datetime('now', '-7 days')`
      ).bind(org.id).first();

      for (const user of users) {
        if (!user.email) continue;
        const html = buildWeeklyDigestHtml(user.name, {
          orgName: org.name,
          score: current.score,
          grade: current.grade,
          dimensions: current.dimensions,
          newPoams: weekPoams?.new_count || 0,
          closedPoams: weekPoams?.closed_count || 0,
          overduePoams: poamStats?.overdue || 0,
          deadlines,
          alertCount: alertCount?.cnt || 0,
        });
        await sendEmail(env, user.email, `[ForgeComply 360] Weekly Compliance Digest — Score: ${current.score}% (${current.grade})`, html);
        sentCount++;
      }
    }

    console.log(`[CRON] Weekly digest complete. Sent ${sentCount} emails.`);
  } catch (error) {
    console.error('[CRON] Weekly digest error:', error);
  }
}

function buildWeeklyDigestHtml(userName, data) {
  const scoreColor = data.score >= 80 ? '#059669' : data.score >= 60 ? '#d97706' : '#dc2626';
  const deadlineRows = (data.deadlines || []).map(d =>
    `<tr><td style="padding:8px 12px;font-size:13px;color:#374151">${d.type}</td><td style="padding:8px 12px;font-size:13px;color:#374151">${d.name || d.ref}</td><td style="padding:8px 12px;font-size:13px;color:#374151">${d.due_date}</td></tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
<tr><td style="background:#1e40af;padding:24px 32px"><h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">ForgeComply 360</h1><p style="margin:4px 0 0;color:#93c5fd;font-size:13px">Weekly Compliance Digest — ${data.orgName || 'Your Organization'}</p></td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 20px;color:#374151;font-size:15px">Hi ${userName || 'there'},</p>
<div style="text-align:center;margin:0 0 24px">
  <div style="display:inline-block;background:#f0f9ff;border:2px solid ${scoreColor};border-radius:16px;padding:20px 40px">
    <div style="font-size:48px;font-weight:800;color:${scoreColor}">${data.score}%</div>
    <div style="font-size:14px;color:#6b7280;margin-top:4px">Compliance Score (${data.grade})</div>
  </div>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
<tr style="background:#f9fafb"><td style="padding:12px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb" width="25%">New POA&Ms</td><td style="padding:12px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb" width="25%">Closed</td><td style="padding:12px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb" width="25%">Overdue</td><td style="padding:12px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb" width="25%">Alerts</td></tr>
<tr><td style="padding:12px;font-size:18px;font-weight:700;color:#1f2937">${data.newPoams}</td><td style="padding:12px;font-size:18px;font-weight:700;color:#059669">${data.closedPoams}</td><td style="padding:12px;font-size:18px;font-weight:700;color:${data.overduePoams > 0 ? '#dc2626' : '#6b7280'}">${data.overduePoams}</td><td style="padding:12px;font-size:18px;font-weight:700;color:#6b7280">${data.alertCount}</td></tr>
</table>
${deadlineRows ? `<h3 style="margin:0 0 8px;font-size:14px;color:#374151">Upcoming Deadlines (Next 7 Days)</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
<tr style="background:#f9fafb"><th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb">Type</th><th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb">Item</th><th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:left;border-bottom:1px solid #e5e7eb">Due</th></tr>
${deadlineRows}</table>` : ''}
<div style="text-align:center;margin:24px 0 0">
<a href="https://forgecomply360.pages.dev" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View Dashboard</a>
</div>
</td></tr>
<tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
<p style="margin:0;color:#9ca3af;font-size:12px">Weekly digest from ForgeComply 360. Manage in <a href="https://forgecomply360.pages.dev/settings" style="color:#3b82f6">Settings</a>.</p>
</td></tr></table></td></tr></table></body></html>`;
}

// ─── BACKUP & RESTORE ─────────────────────────────────────────────────────────

const BACKUP_TABLES = [
  'organizations', 'users', 'refresh_tokens',
  'systems', 'control_implementations', 'organization_frameworks',
  'evidence', 'evidence_control_links', 'evidence_schedules',
  'poams', 'poam_milestones', 'poam_comments', 'poam_affected_assets',
  'risks', 'vendors', 'policies', 'policy_attestations', 'policy_control_links',
  'ssp_documents', 'monitoring_checks', 'monitoring_check_results',
  'approval_requests', 'notifications', 'notification_preferences',
  'audit_logs', 'audit_checklist_items',
  'experience_configs', 'ai_templates', 'ai_documents',
  'compliance_snapshots', 'addon_modules', 'organization_addons',
  'scan_imports', 'vulnerability_findings', 'assets', 'asset_scan_history',
  'questionnaires', 'questionnaire_responses'
];

async function handleScheduledBackup(env) {
  console.log('[CRON] Starting scheduled backup...');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;

    // 1. Export all database tables
    const dbBackup = {};
    let totalRows = 0;

    for (const table of BACKUP_TABLES) {
      try {
        const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all();
        dbBackup[table] = results || [];
        totalRows += (results?.length || 0);
        console.log(`[BACKUP] ${table}: ${results?.length || 0} rows`);
      } catch (err) {
        console.log(`[BACKUP] Skipping ${table}: ${err.message}`);
        dbBackup[table] = [];
      }
    }

    // 2. Create backup manifest
    const manifest = {
      id: backupId,
      created_at: new Date().toISOString(),
      type: 'scheduled',
      tables: Object.keys(dbBackup).length,
      total_rows: totalRows,
      evidence_files: 0
    };

    // 3. Save database backup to R2
    await env.BACKUP_BUCKET.put(
      `${backupId}/database.json`,
      JSON.stringify(dbBackup, null, 2),
      { customMetadata: { created: manifest.created_at, type: 'database' } }
    );

    // 4. Copy evidence files from EVIDENCE_VAULT to BACKUP_BUCKET
    let evidenceCount = 0;
    try {
      const evidenceList = await env.EVIDENCE_VAULT.list({ limit: 1000 });
      for (const obj of evidenceList.objects || []) {
        const file = await env.EVIDENCE_VAULT.get(obj.key);
        if (file) {
          await env.BACKUP_BUCKET.put(
            `${backupId}/evidence/${obj.key}`,
            file.body,
            { customMetadata: obj.customMetadata || {} }
          );
          evidenceCount++;
        }
      }
      manifest.evidence_files = evidenceCount;
    } catch (err) {
      console.log(`[BACKUP] Evidence copy error: ${err.message}`);
    }

    // 5. Save manifest
    await env.BACKUP_BUCKET.put(
      `${backupId}/manifest.json`,
      JSON.stringify(manifest, null, 2),
      { customMetadata: { created: manifest.created_at, type: 'manifest' } }
    );

    // 6. Clean up old backups (keep last 30 days)
    await cleanupOldBackups(env, 30);

    console.log(`[CRON] Backup complete: ${backupId} (${totalRows} rows, ${evidenceCount} files)`);
    return { success: true, backupId, manifest };

  } catch (error) {
    console.error('[CRON] Backup failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function cleanupOldBackups(env, retentionDays) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const list = await env.BACKUP_BUCKET.list({ prefix: 'backup-' });
    const backupDirs = new Set();

    for (const obj of list.objects || []) {
      const backupDir = obj.key.split('/')[0];
      backupDirs.add(backupDir);
    }

    for (const dir of backupDirs) {
      // Parse date from backup-YYYY-MM-DDTHH-MM-SS-XXXZ
      const dateMatch = dir.match(/backup-(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const backupDate = new Date(dateMatch[1]);
        if (backupDate < cutoff) {
          // Delete all files in this backup
          const files = await env.BACKUP_BUCKET.list({ prefix: `${dir}/` });
          for (const file of files.objects || []) {
            await env.BACKUP_BUCKET.delete(file.key);
          }
          console.log(`[BACKUP] Deleted old backup: ${dir}`);
        }
      }
    }
  } catch (err) {
    console.log(`[BACKUP] Cleanup error: ${err.message}`);
  }
}

// API Handlers for Backup Management

async function handleListBackups(env, org, user) {
  if (!requireRole(user, 'admin')) {
    return jsonResponse({ error: 'Admin access required' }, 403);
  }

  try {
    const list = await env.BACKUP_BUCKET.list({ prefix: 'backup-' });
    const backups = new Map();

    for (const obj of list.objects || []) {
      const parts = obj.key.split('/');
      const backupId = parts[0];

      if (!backups.has(backupId)) {
        backups.set(backupId, { id: backupId, files: [], size: 0 });
      }

      const backup = backups.get(backupId);
      backup.files.push(obj.key);
      backup.size += obj.size || 0;

      if (parts[1] === 'manifest.json') {
        // Load manifest for metadata
        const manifest = await env.BACKUP_BUCKET.get(obj.key);
        if (manifest) {
          const data = await manifest.json();
          backup.created_at = data.created_at;
          backup.type = data.type;
          backup.tables = data.tables;
          backup.total_rows = data.total_rows;
          backup.evidence_files = data.evidence_files;
        }
      }
    }

    const backupList = Array.from(backups.values())
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 50);

    return jsonResponse({ backups: backupList });
  } catch (err) {
    return jsonResponse({ error: 'Failed to list backups: ' + err.message }, 500);
  }
}

async function handleTriggerBackup(env, org, user) {
  if (!requireRole(user, 'admin')) {
    return jsonResponse({ error: 'Admin access required' }, 403);
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;

    // Export database
    const dbBackup = {};
    let totalRows = 0;

    for (const table of BACKUP_TABLES) {
      try {
        const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all();
        dbBackup[table] = results || [];
        totalRows += (results?.length || 0);
      } catch {
        dbBackup[table] = [];
      }
    }

    // Create manifest
    const manifest = {
      id: backupId,
      created_at: new Date().toISOString(),
      type: 'manual',
      triggered_by: user.id,
      triggered_by_name: user.name,
      tables: Object.keys(dbBackup).length,
      total_rows: totalRows,
      evidence_files: 0
    };

    // Save database backup
    await env.BACKUP_BUCKET.put(
      `${backupId}/database.json`,
      JSON.stringify(dbBackup, null, 2),
      { customMetadata: { created: manifest.created_at, type: 'database' } }
    );

    // Copy evidence files
    let evidenceCount = 0;
    try {
      const evidenceList = await env.EVIDENCE_VAULT.list({ limit: 1000 });
      for (const obj of evidenceList.objects || []) {
        const file = await env.EVIDENCE_VAULT.get(obj.key);
        if (file) {
          await env.BACKUP_BUCKET.put(
            `${backupId}/evidence/${obj.key}`,
            file.body,
            { customMetadata: obj.customMetadata || {} }
          );
          evidenceCount++;
        }
      }
      manifest.evidence_files = evidenceCount;
    } catch {}

    // Save manifest
    await env.BACKUP_BUCKET.put(
      `${backupId}/manifest.json`,
      JSON.stringify(manifest, null, 2)
    );

    await auditLog(env, org.id, user.id, 'create', 'backup', backupId, { type: 'manual', rows: totalRows, files: evidenceCount });

    return jsonResponse({ success: true, backup: manifest });
  } catch (err) {
    return jsonResponse({ error: 'Backup failed: ' + err.message }, 500);
  }
}

async function handleGetBackup(env, org, user, backupId) {
  if (!requireRole(user, 'admin')) {
    return jsonResponse({ error: 'Admin access required' }, 403);
  }

  try {
    const manifest = await env.BACKUP_BUCKET.get(`${backupId}/manifest.json`);
    if (!manifest) {
      return jsonResponse({ error: 'Backup not found' }, 404);
    }

    const data = await manifest.json();

    // Get file list
    const files = await env.BACKUP_BUCKET.list({ prefix: `${backupId}/` });
    data.files = (files.objects || []).map(f => ({
      key: f.key,
      size: f.size,
      uploaded: f.uploaded
    }));

    return jsonResponse({ backup: data });
  } catch (err) {
    return jsonResponse({ error: 'Failed to get backup: ' + err.message }, 500);
  }
}

async function handleDeleteBackup(env, org, user, backupId) {
  if (!requireRole(user, 'owner')) {
    return jsonResponse({ error: 'Owner access required' }, 403);
  }

  try {
    const files = await env.BACKUP_BUCKET.list({ prefix: `${backupId}/` });
    let deleted = 0;

    for (const file of files.objects || []) {
      await env.BACKUP_BUCKET.delete(file.key);
      deleted++;
    }

    await auditLog(env, org.id, user.id, 'delete', 'backup', backupId, { files_deleted: deleted });

    return jsonResponse({ success: true, deleted });
  } catch (err) {
    return jsonResponse({ error: 'Failed to delete backup: ' + err.message }, 500);
  }
}

async function handleRestoreBackup(request, env, org, user, backupId) {
  if (!requireRole(user, 'owner')) {
    return jsonResponse({ error: 'Owner access required for restore' }, 403);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { confirm, restore_evidence = false } = body;

    if (confirm !== 'RESTORE') {
      return jsonResponse({
        error: 'Restore requires confirmation. Send { "confirm": "RESTORE" } to proceed.',
        warning: 'This will OVERWRITE all current data. This action cannot be undone.'
      }, 400);
    }

    // Load database backup
    const dbFile = await env.BACKUP_BUCKET.get(`${backupId}/database.json`);
    if (!dbFile) {
      return jsonResponse({ error: 'Database backup not found' }, 404);
    }

    const dbBackup = await dbFile.json();
    let restoredRows = 0;
    const errors = [];

    // Restore tables in order (respecting foreign keys)
    const restoreOrder = [
      'organizations', 'users', 'refresh_tokens',
      'systems', 'organization_frameworks',
      'control_implementations',
      'evidence', 'evidence_control_links', 'evidence_schedules',
      'poams', 'poam_milestones', 'poam_comments', 'poam_affected_assets',
      'risks', 'vendors', 'policies', 'policy_attestations', 'policy_control_links',
      'ssp_documents', 'monitoring_checks', 'monitoring_check_results',
      'approval_requests', 'notifications', 'notification_preferences',
      'audit_logs', 'audit_checklist_items',
      'experience_configs', 'ai_templates', 'ai_documents',
      'compliance_snapshots', 'addon_modules', 'organization_addons',
      'scan_imports', 'assets', 'vulnerability_findings', 'asset_scan_history',
      'questionnaires', 'questionnaire_responses'
    ];

    for (const table of restoreOrder) {
      const rows = dbBackup[table];
      if (!rows || rows.length === 0) continue;

      try {
        // Clear existing data
        await env.DB.prepare(`DELETE FROM ${table}`).run();

        // Insert backup data
        for (const row of rows) {
          const columns = Object.keys(row);
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map(c => row[c]);

          await env.DB.prepare(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
          ).bind(...values).run();
          restoredRows++;
        }
      } catch (err) {
        errors.push({ table, error: err.message });
      }
    }

    // Restore evidence files if requested
    let restoredFiles = 0;
    if (restore_evidence) {
      try {
        const evidenceList = await env.BACKUP_BUCKET.list({ prefix: `${backupId}/evidence/` });
        for (const obj of evidenceList.objects || []) {
          const file = await env.BACKUP_BUCKET.get(obj.key);
          if (file) {
            const originalKey = obj.key.replace(`${backupId}/evidence/`, '');
            await env.EVIDENCE_VAULT.put(originalKey, file.body, {
              customMetadata: obj.customMetadata || {}
            });
            restoredFiles++;
          }
        }
      } catch (err) {
        errors.push({ component: 'evidence', error: err.message });
      }
    }

    await auditLog(env, org.id, user.id, 'restore', 'backup', backupId, {
      restored_rows: restoredRows,
      restored_files: restoredFiles,
      errors: errors.length
    });

    return jsonResponse({
      success: true,
      restored_rows: restoredRows,
      restored_files: restoredFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    return jsonResponse({ error: 'Restore failed: ' + err.message }, 500);
  }
}

// ─── AI Risk Scoring & Recommendations ───────────────────────────────────────

async function computeAIRiskScore(env, org, risk) {
  // Factor 1: Control Gap (40%)
  let controlGap = 0.5;
  try {
    const relControls = JSON.parse(risk.related_controls || '[]');
    if (relControls.length > 0) {
      const placeholders = relControls.map(() => '?').join(',');
      const { results: impls } = await env.DB.prepare(
        `SELECT status FROM control_implementations WHERE control_id IN (${placeholders})`
      ).bind(...relControls).all();
      if (impls.length > 0) {
        const implemented = impls.filter(i => i.status === 'implemented' || i.status === 'not_applicable').length;
        const partial = impls.filter(i => i.status === 'partially_implemented').length;
        controlGap = 1 - ((implemented + partial * 0.5) / impls.length);
      }
    }
  } catch {}

  // Factor 2: POA&M Aging (25%)
  let poamAging = 0;
  try {
    const poamResult = await env.DB.prepare(
      `SELECT AVG(CASE WHEN scheduled_completion < date('now') THEN julianday('now') - julianday(scheduled_completion) ELSE 0 END) as avg_overdue
       FROM poams WHERE org_id = ? AND status != 'completed' AND risk_level IN ('high', 'critical')`
    ).bind(org.id).first();
    poamAging = Math.min(1, (poamResult?.avg_overdue || 0) / 90);
  } catch {}

  // Factor 3: Evidence Staleness (25%)
  let evidenceStale = 0.5;
  try {
    const relControls = JSON.parse(risk.related_controls || '[]');
    if (relControls.length > 0) {
      const placeholders = relControls.map(() => '?').join(',');
      const evResult = await env.DB.prepare(
        `SELECT COUNT(DISTINCT control_id) as with_evidence FROM evidence WHERE control_id IN (${placeholders}) AND uploaded_at >= datetime('now', '-90 days')`
      ).bind(...relControls).first();
      evidenceStale = 1 - ((evResult?.with_evidence || 0) / relControls.length);
    }
  } catch {}

  // Factor 4: Base Severity (10%)
  const baseSeverity = Math.min(1, (risk.risk_score || 0) / 25);

  // Composite
  const aiScore = Math.round(100 - (controlGap * 40 + poamAging * 25 + evidenceStale * 25 + baseSeverity * 10));
  const clampedScore = Math.max(0, Math.min(100, aiScore));

  // AI recommendation
  let recommendation = '';
  try {
    recommendation = await runAI(env,
      'You are a cybersecurity risk advisor for FedRAMP/NIST 800-53 compliance. Provide a concise, actionable recommendation (2-3 sentences) for mitigating this risk based on the context provided.',
      `Risk: "${risk.title}" (${risk.category}, score ${risk.risk_score}/25, level: ${risk.risk_level})
Description: ${risk.description || 'None'}
Current treatment: ${risk.treatment} — ${risk.treatment_plan || 'No plan'}
AI Health Score: ${clampedScore}/100 (control gap: ${Math.round(controlGap*100)}%, evidence staleness: ${Math.round(evidenceStale*100)}%, POA&M aging: ${Math.round(poamAging*100)}%)
Related controls: ${risk.related_controls || 'none'}
Provide a specific recommendation to improve this risk's health score.`
    );
  } catch (e) {
    recommendation = 'AI recommendation unavailable.';
  }

  // Update DB
  await env.DB.prepare(
    `UPDATE risks SET ai_risk_score = ?, ai_recommendation = ?, ai_scored_at = datetime('now') WHERE id = ?`
  ).bind(clampedScore, recommendation, risk.id).run();

  return { ai_risk_score: clampedScore, ai_recommendation: recommendation, ai_scored_at: new Date().toISOString() };
}

async function handleAIScoreRisk(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const body = await request.json();

  if (body.score_all) {
    const { results: risks } = await env.DB.prepare(
      'SELECT * FROM risks WHERE org_id = ? LIMIT 20'
    ).bind(org.id).all();

    const results = [];
    for (const risk of risks) {
      const scored = await computeAIRiskScore(env, org, risk);
      results.push({ risk_id: risk.id, ...scored });
    }

    await auditLog(env, org.id, user.id, 'ai_score_risks', 'risk', null, { count: risks.length }, request);
    return jsonResponse({ scored: results });
  }

  if (!body.risk_id) return jsonResponse({ error: 'risk_id required' }, 400);

  const risk = await env.DB.prepare('SELECT * FROM risks WHERE id = ? AND org_id = ?').bind(body.risk_id, org.id).first();
  if (!risk) return jsonResponse({ error: 'Risk not found' }, 404);

  const result = await computeAIRiskScore(env, org, risk);
  await auditLog(env, org.id, user.id, 'ai_score_risk', 'risk', risk.id, { score: result.ai_risk_score }, request);
  return jsonResponse({ risk_id: risk.id, ...result });
}

async function handleRiskRecommendations(env, org) {
  const { results } = await env.DB.prepare(
    `SELECT id, risk_id, title, risk_score, risk_level, ai_risk_score, ai_recommendation, ai_scored_at
     FROM risks WHERE org_id = ? AND ai_recommendation IS NOT NULL
     ORDER BY ai_risk_score ASC LIMIT 20`
  ).bind(org.id).all();
  return jsonResponse({ recommendations: results });
}

// ─── SSP Comparison ──────────────────────────────────────────────────────────

async function handleCompareSSPs(env, org, url) {
  const sspIds = url.searchParams.get('ssp_ids');
  if (!sspIds) return jsonResponse({ error: 'ssp_ids required (comma-separated)' }, 400);

  const ids = sspIds.split(',').map(s => s.trim()).filter(Boolean);
  if (ids.length < 2 || ids.length > 4) return jsonResponse({ error: 'Provide 2-4 SSP IDs' }, 400);

  const placeholders = ids.map(() => '?').join(',');
  const { results: docs } = await env.DB.prepare(
    `SELECT sp.*, s.name as system_name, f.name as framework_name
     FROM ssp_documents sp
     JOIN systems s ON sp.system_id = s.id
     JOIN frameworks f ON sp.framework_id = f.id
     WHERE sp.id IN (${placeholders}) AND sp.org_id = ?`
  ).bind(...ids, org.id).all();

  if (docs.length < 2) return jsonResponse({ error: 'At least 2 valid SSPs required' }, 400);

  const sectionKeys = ['system_info', 'authorization_boundary', 'data_flow', 'network_architecture', 'system_interconnections', 'personnel', 'control_implementations', 'contingency_plan', 'incident_response', 'continuous_monitoring'];
  const sectionLabels = { system_info: 'System Information', authorization_boundary: 'Authorization Boundary', data_flow: 'Data Flow', network_architecture: 'Network Architecture', system_interconnections: 'System Interconnections', personnel: 'Personnel & Roles', control_implementations: 'Control Implementations', contingency_plan: 'Contingency Plan', incident_response: 'Incident Response', continuous_monitoring: 'Continuous Monitoring' };

  const documents = docs.map(d => {
    let oscal = {};
    try { oscal = JSON.parse(d.oscal_json || '{}'); } catch {}
    const sections = oscal._authoring?.sections || {};
    return {
      id: d.id,
      system_name: d.system_name,
      framework_name: d.framework_name,
      status: d.status,
      completion: d.completion_pct || 0,
      sections,
    };
  });

  const sections = sectionKeys.map(key => {
    const perDoc = documents.map(doc => {
      const sec = doc.sections[key] || {};
      const content = sec.content || '';
      return {
        doc_id: doc.id,
        system_name: doc.system_name,
        content: content.substring(0, 500),
        full_length: content.length,
        word_count: content ? content.split(/\s+/).filter(Boolean).length : 0,
        status: sec.status || 'empty',
        ai_generated: sec.ai_generated || false,
        last_edited_at: sec.last_edited_at || null,
      };
    });

    const hasContent = perDoc.filter(p => p.word_count > 0);
    const allHave = hasContent.length === documents.length;
    const noneHave = hasContent.length === 0;

    return {
      key,
      label: sectionLabels[key] || key,
      consistency: noneHave ? 'none' : allHave ? 'complete' : 'partial',
      documents: perDoc,
    };
  });

  const summary = {
    total_sections: sectionKeys.length,
    complete: sections.filter(s => s.consistency === 'complete').length,
    partial: sections.filter(s => s.consistency === 'partial').length,
    missing: sections.filter(s => s.consistency === 'none').length,
  };

  return jsonResponse({ documents, sections, summary });
}

// ─── Control Inheritance Map ─────────────────────────────────────────────────

async function handleInheritanceMap(env, org, url) {
  const frameworkId = url.searchParams.get('framework_id');

  // Get all systems
  const { results: systems } = await env.DB.prepare(
    'SELECT id, name, system_type, authorization_status FROM systems WHERE org_id = ?'
  ).bind(org.id).all();

  // Get inherited implementations
  let query = `SELECT ci.system_id, ci.control_id, ci.status, ci.inheritance_type, ci.inherited_from_system_id, c.family
    FROM control_implementations ci
    JOIN controls c ON ci.control_id = c.control_id
    JOIN systems s ON ci.system_id = s.id
    WHERE s.org_id = ? AND ci.inheritance_type IN ('inherited', 'hybrid')`;
  const params = [org.id];
  if (frameworkId) { query += ' AND c.framework_id = ?'; params.push(frameworkId); }

  const { results: inherited } = await env.DB.prepare(query).bind(...params).all();

  // Build edges: source_system -> target_system
  const edgeMap = {};
  for (const impl of inherited) {
    if (!impl.inherited_from_system_id) continue;
    const key = `${impl.inherited_from_system_id}→${impl.system_id}`;
    if (!edgeMap[key]) {
      edgeMap[key] = { source: impl.inherited_from_system_id, target: impl.system_id, controls: [], families: new Set(), statuses: {} };
    }
    edgeMap[key].controls.push(impl.control_id);
    if (impl.family) edgeMap[key].families.add(impl.family);
    edgeMap[key].statuses[impl.status] = (edgeMap[key].statuses[impl.status] || 0) + 1;
  }

  const edges = Object.values(edgeMap).map(e => ({
    source: e.source,
    target: e.target,
    control_count: e.controls.length,
    families: [...e.families],
    statuses: e.statuses,
    controls: e.controls,
  }));

  // Classify nodes
  const providers = new Set(edges.map(e => e.source));
  const consumers = new Set(edges.map(e => e.target));

  // Count native controls per system
  const nativeCounts = {};
  const { results: nativeData } = await env.DB.prepare(
    `SELECT ci.system_id, COUNT(*) as cnt FROM control_implementations ci
     JOIN systems s ON ci.system_id = s.id
     WHERE s.org_id = ? AND (ci.inheritance_type IS NULL OR ci.inheritance_type = 'native' OR ci.inheritance_type = '')`
  ).bind(org.id).all();
  for (const r of nativeData) { nativeCounts[r.system_id] = r.cnt; }

  const nodes = systems.map(s => ({
    id: s.id,
    name: s.name,
    type: providers.has(s.id) && consumers.has(s.id) ? 'both' : providers.has(s.id) ? 'provider' : consumers.has(s.id) ? 'consumer' : 'standalone',
    native_controls: nativeCounts[s.id] || 0,
    inherited_controls: inherited.filter(i => i.system_id === s.id).length,
    provided_controls: inherited.filter(i => i.inherited_from_system_id === s.id).length,
    system_type: s.system_type,
    authorization_status: s.authorization_status,
  }));

  const summary = {
    total_systems: systems.length,
    providers: nodes.filter(n => n.type === 'provider' || n.type === 'both').length,
    consumers: nodes.filter(n => n.type === 'consumer' || n.type === 'both').length,
    total_inherited: inherited.length,
    total_edges: edges.length,
  };

  return jsonResponse({ nodes, edges, summary });
}

// ============================================================================
// SECURITY SETTINGS HANDLERS
// ============================================================================

async function handleGetSecuritySettings(env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const meta = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {});
  return jsonResponse({ session_timeout_minutes: meta.session_timeout_minutes || 30 });
}

async function handleUpdateSecuritySettings(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const validTimeouts = [15, 30, 60];
  if (!validTimeouts.includes(body.session_timeout_minutes)) {
    return jsonResponse({ error: 'session_timeout_minutes must be 15, 30, or 60' }, 400);
  }
  const meta = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {});
  meta.session_timeout_minutes = body.session_timeout_minutes;
  await env.DB.prepare('UPDATE organizations SET settings = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(JSON.stringify(meta), org.id).run();
  await auditLog(env, org.id, user.id, 'update', 'organization', org.id, { action: 'security_settings_change', session_timeout_minutes: body.session_timeout_minutes }, request);
  return jsonResponse({ session_timeout_minutes: body.session_timeout_minutes });
}

// ============================================================================
// ORG EXPORT HANDLER
// ============================================================================

async function handleOrgExport(env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  try {
    const [systems, controlImpls, poams, milestones, evidenceItems, risks, vendors, vendorAssessments,
      monitoringChecks, policies, policyVersions, sspDocuments, auditLogs, orgUsers] = await Promise.all([
      env.DB.prepare('SELECT * FROM systems WHERE org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM control_implementations ci JOIN systems s ON ci.system_id = s.id WHERE s.org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM poams WHERE org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT m.* FROM milestones m JOIN poams p ON m.poam_id = p.id WHERE p.org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT id, org_id, title, description, file_name, file_size, file_type, sha256_hash, uploaded_by, collection_date, expiry_date, status, metadata, created_at, updated_at FROM evidence WHERE org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM risks WHERE org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM vendors WHERE org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT va.* FROM vendor_assessments va JOIN vendors v ON va.vendor_id = v.id WHERE v.org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM monitoring_checks WHERE org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM policies WHERE org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT pv.* FROM policy_versions pv JOIN policies p ON pv.policy_id = p.id WHERE p.org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM ssp_documents WHERE org_id = ?').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM audit_logs WHERE org_id = ? ORDER BY created_at DESC LIMIT 5000').bind(org.id).all(),
      env.DB.prepare('SELECT * FROM users WHERE org_id = ?').bind(org.id).all(),
    ]);

    const exportData = {
      export_meta: {
        org_name: org.name,
        org_id: org.id,
        exported_at: new Date().toISOString(),
        schema_version: '1.0',
      },
      systems: systems.results,
      control_implementations: controlImpls.results,
      poams: poams.results,
      milestones: milestones.results,
      evidence: evidenceItems.results,
      risks: risks.results,
      vendors: vendors.results,
      vendor_assessments: vendorAssessments.results,
      monitoring_checks: monitoringChecks.results,
      policies: policies.results,
      policy_versions: policyVersions.results,
      ssp_documents: sspDocuments.results,
      audit_logs: auditLogs.results,
      users: orgUsers.results.map(u => sanitizeUser(u)),
    };

    await auditLog(env, org.id, user.id, 'export', 'organization', org.id, { tables_exported: 14 }, null);
    return jsonResponse(exportData);
  } catch (e) {
    console.error('Org export error:', e);
    return jsonResponse({ error: 'Export failed: ' + e.message }, 500);
  }
}

// ============================================================================
// EXECUTIVE SUMMARY HANDLER
// ============================================================================

async function handleExecutiveSummary(env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  try {
    // Current compliance score
    const weights = getOrgScoringWeights(org);
    const [controlStats, poamStats, evidenceStats, riskStats, monitoringStats] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN ci.status = 'implemented' THEN 1 ELSE 0 END) as implemented, SUM(CASE WHEN ci.status = 'partially_implemented' THEN 1 ELSE 0 END) as partially, SUM(CASE WHEN ci.status = 'planned' THEN 1 ELSE 0 END) as planned, SUM(CASE WHEN ci.status = 'not_applicable' THEN 1 ELSE 0 END) as na FROM control_implementations ci JOIN systems s ON ci.system_id = s.id WHERE s.org_id = ?`).bind(org.id).first(),
      env.DB.prepare(`SELECT SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open, SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status != 'completed' AND scheduled_completion < date('now') THEN 1 ELSE 0 END) as overdue FROM poams WHERE org_id = ?`).bind(org.id).first(),
      env.DB.prepare(`SELECT COUNT(DISTINCT ci.id) as applicable, COUNT(DISTINCT ecl.implementation_id) as covered FROM control_implementations ci LEFT JOIN evidence_control_links ecl ON ci.id = ecl.implementation_id JOIN systems s ON ci.system_id = s.id WHERE s.org_id = ?`).bind(org.id).first(),
      env.DB.prepare(`SELECT SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical, SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high, SUM(CASE WHEN risk_level = 'moderate' THEN 1 ELSE 0 END) as moderate, SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low FROM risks WHERE org_id = ?`).bind(org.id).first(),
      env.DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN last_result = 'pass' THEN 1 ELSE 0 END) as pass FROM monitoring_checks WHERE org_id = ?`).bind(org.id).first(),
    ]);

    const scoreData = {
      controls: { total: controlStats?.total || 0, implemented: controlStats?.implemented || 0, partially: controlStats?.partially || 0, planned: controlStats?.planned || 0, na: controlStats?.na || 0 },
      poams: { open: poamStats?.open || 0, in_progress: poamStats?.in_progress || 0, completed: poamStats?.completed || 0, overdue: poamStats?.overdue || 0 },
      evidence: { applicable: evidenceStats?.applicable || 0, covered: evidenceStats?.covered || 0 },
      risks: { critical: riskStats?.critical || 0, high: riskStats?.high || 0, moderate: riskStats?.moderate || 0, low: riskStats?.low || 0 },
      monitoring: { total: monitoringStats?.total || 0, pass: monitoringStats?.pass || 0 },
    };
    const currentScore = computeComplianceScore(scoreData, weights);

    // Previous snapshot for delta
    const prevSnapshot = await env.DB.prepare(
      `SELECT metadata FROM compliance_snapshots WHERE org_id = ? AND snapshot_date <= date('now', '-7 days') ORDER BY snapshot_date DESC LIMIT 1`
    ).bind(org.id).first();
    let previousScore = 0;
    if (prevSnapshot && prevSnapshot.metadata) {
      try {
        const meta = JSON.parse(prevSnapshot.metadata);
        previousScore = meta.score || 0;
      } catch {}
    }
    const scoreDelta = currentScore.score - previousScore;

    // Week's activity
    const [poamsClosed, newRisks, evidenceUploaded] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as cnt FROM poams WHERE org_id = ? AND status = 'completed' AND updated_at >= datetime('now', '-7 days')`).bind(org.id).first(),
      env.DB.prepare(`SELECT COUNT(*) as cnt FROM risks WHERE org_id = ? AND created_at >= datetime('now', '-7 days')`).bind(org.id).first(),
      env.DB.prepare(`SELECT COUNT(*) as cnt FROM evidence WHERE org_id = ? AND created_at >= datetime('now', '-7 days')`).bind(org.id).first(),
    ]);

    // Team activity
    const { results: teamActivity } = await env.DB.prepare(
      `SELECT a.user_id, u.name, COUNT(*) as actions_count
       FROM audit_logs a JOIN users u ON a.user_id = u.id
       WHERE a.org_id = ? AND a.created_at >= datetime('now', '-7 days')
       GROUP BY a.user_id ORDER BY actions_count DESC LIMIT 10`
    ).bind(org.id).all();

    return jsonResponse({
      current_score: currentScore.score,
      current_grade: currentScore.grade,
      score_delta: scoreDelta,
      poams_closed: poamsClosed?.cnt || 0,
      new_risks: newRisks?.cnt || 0,
      evidence_uploaded: evidenceUploaded?.cnt || 0,
      team_activity: teamActivity,
    });
  } catch (e) {
    console.error('Executive summary error:', e.message, e.stack);
    return jsonResponse({ error: 'Failed to compute executive summary', details: e.message }, 500);
  }
}

// ============================================================================
// WEBHOOK HANDLERS + FIRE WEBHOOKS
// ============================================================================

const WEBHOOK_EVENT_TYPES = [
  'poam_update', 'risk_alert', 'monitoring_fail', 'control_change', 'role_change',
  'compliance_alert', 'evidence_upload', 'approval_request', 'approval_decision',
  'evidence_reminder', 'evidence_expiry', 'policy_update', 'attestation_request', 'deadline_alert', '*'
];

async function handleListWebhooks(env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const { results } = await env.DB.prepare('SELECT id, org_id, name, url, events, active, created_at, updated_at FROM webhooks WHERE org_id = ? ORDER BY created_at DESC').bind(org.id).all();
  return jsonResponse({ webhooks: results.map(w => ({ ...w, events: JSON.parse(w.events || '[]') })) });
}

async function handleCreateWebhook(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  if (!body.name || !body.url) return jsonResponse({ error: 'name and url required' }, 400);
  if (!body.url.startsWith('https://')) return jsonResponse({ error: 'URL must start with https://' }, 400);
  const events = Array.isArray(body.events) ? body.events.filter(e => WEBHOOK_EVENT_TYPES.includes(e)) : ['*'];
  if (events.length === 0) return jsonResponse({ error: 'At least one valid event type required' }, 400);

  const id = generateId();
  const secret = generateId() + generateId();

  await env.DB.prepare(
    'INSERT INTO webhooks (id, org_id, name, url, secret, events, active) VALUES (?, ?, ?, ?, ?, ?, 1)'
  ).bind(id, org.id, body.name, body.url, secret, JSON.stringify(events)).run();

  await auditLog(env, org.id, user.id, 'create', 'webhook', id, { name: body.name, url: body.url }, request);
  return jsonResponse({ webhook: { id, name: body.name, url: body.url, secret, events, active: 1 } }, 201);
}

async function handleUpdateWebhook(request, env, org, user, webhookId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const webhook = await env.DB.prepare('SELECT * FROM webhooks WHERE id = ? AND org_id = ?').bind(webhookId, org.id).first();
  if (!webhook) return jsonResponse({ error: 'Webhook not found' }, 404);

  const body = await request.json();
  const name = body.name || webhook.name;
  const url = body.url || webhook.url;
  const active = body.active !== undefined ? (body.active ? 1 : 0) : webhook.active;
  const events = Array.isArray(body.events) ? body.events.filter(e => WEBHOOK_EVENT_TYPES.includes(e)) : JSON.parse(webhook.events || '[]');

  if (body.url && !body.url.startsWith('https://')) return jsonResponse({ error: 'URL must start with https://' }, 400);

  await env.DB.prepare(
    'UPDATE webhooks SET name = ?, url = ?, events = ?, active = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(name, url, JSON.stringify(events), active, webhookId).run();

  await auditLog(env, org.id, user.id, 'update', 'webhook', webhookId, { name, active }, request);
  return jsonResponse({ webhook: { id: webhookId, name, url, events, active } });
}

async function handleDeleteWebhook(env, org, user, webhookId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const webhook = await env.DB.prepare('SELECT * FROM webhooks WHERE id = ? AND org_id = ?').bind(webhookId, org.id).first();
  if (!webhook) return jsonResponse({ error: 'Webhook not found' }, 404);

  await env.DB.prepare('DELETE FROM webhook_deliveries WHERE webhook_id = ?').bind(webhookId).run();
  await env.DB.prepare('DELETE FROM webhooks WHERE id = ?').bind(webhookId).run();
  await auditLog(env, org.id, user.id, 'delete', 'webhook', webhookId, { name: webhook.name }, null);
  return jsonResponse({ message: 'Webhook deleted' });
}

async function handleWebhookDeliveries(env, org, user, webhookId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const webhook = await env.DB.prepare('SELECT * FROM webhooks WHERE id = ? AND org_id = ?').bind(webhookId, org.id).first();
  if (!webhook) return jsonResponse({ error: 'Webhook not found' }, 404);

  const { results } = await env.DB.prepare(
    'SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY delivered_at DESC LIMIT 50'
  ).bind(webhookId).all();
  return jsonResponse({ deliveries: results });
}

async function handleTestWebhook(env, org, user, webhookId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);
  const webhook = await env.DB.prepare('SELECT * FROM webhooks WHERE id = ? AND org_id = ?').bind(webhookId, org.id).first();
  if (!webhook) return jsonResponse({ error: 'Webhook not found' }, 404);

  const testPayload = {
    event: 'test.ping',
    timestamp: new Date().toISOString(),
    data: { message: 'Test webhook delivery from ForgeComply 360', org_name: org.name },
  };

  const deliveryId = generateId();
  const payloadStr = JSON.stringify(testPayload);

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(webhook.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
    const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forge-Signature': 'sha256=' + sigHex,
        'X-Forge-Event': 'test.ping',
        'X-Forge-Delivery': deliveryId,
      },
      body: payloadStr,
    });

    const resBody = await res.text().catch(() => '');
    await env.DB.prepare(
      'INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, response_status, response_body) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(deliveryId, webhookId, 'test.ping', payloadStr, res.status, resBody.substring(0, 500)).run();

    return jsonResponse({ success: true, status: res.status, delivery_id: deliveryId });
  } catch (e) {
    await env.DB.prepare(
      'INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, response_status, response_body) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(deliveryId, webhookId, 'test.ping', payloadStr, 0, e.message).run();
    return jsonResponse({ success: false, error: e.message, delivery_id: deliveryId });
  }
}

async function fireWebhooks(env, orgId, eventType, payload) {
  try {
    const { results: webhooks } = await env.DB.prepare(
      'SELECT * FROM webhooks WHERE org_id = ? AND active = 1'
    ).bind(orgId).all();

    for (const webhook of webhooks) {
      const events = JSON.parse(webhook.events || '[]');
      if (!events.includes(eventType) && !events.includes('*')) continue;

      const deliveryId = generateId();
      const fullPayload = { event: eventType, timestamp: new Date().toISOString(), data: payload };
      const payloadStr = JSON.stringify(fullPayload);

      try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(webhook.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
        const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forge-Signature': 'sha256=' + sigHex,
            'X-Forge-Event': eventType,
            'X-Forge-Delivery': deliveryId,
          },
          body: payloadStr,
        });

        const resBody = await res.text().catch(() => '');
        await env.DB.prepare(
          'INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, response_status, response_body) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(deliveryId, webhook.id, eventType, payloadStr, res.status, resBody.substring(0, 500)).run();
      } catch (e) {
        await env.DB.prepare(
          'INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, response_status, response_body) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(deliveryId, webhook.id, eventType, payloadStr, 0, e.message).run();
        console.error('[WEBHOOK] Delivery failed:', webhook.name, e.message);
      }
    }
  } catch (e) {
    console.error('[WEBHOOK] fireWebhooks error:', e);
  }
}

// ============================================================================
// COMPLIANCE BADGES (Feature 9)
// ============================================================================

async function handleListBadges(env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const { results } = await env.DB.prepare(
    'SELECT * FROM compliance_badges WHERE org_id = ? ORDER BY issued_at DESC'
  ).bind(org.id).all();

  return jsonResponse({ badges: results });
}

async function handleCreateBadge(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const body = await request.json();
  const { badge_type, framework_id, expires_months } = body;

  // Calculate compliance score for the badge
  const [ctrlStats, poamStats, evidenceStats, riskStats, monitoringStats] = await Promise.all([
    env.DB.prepare(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'implemented' THEN 1 ELSE 0 END) as implemented,
      SUM(CASE WHEN status = 'partially_implemented' THEN 1 ELSE 0 END) as partially,
      SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned,
      SUM(CASE WHEN status = 'not_applicable' THEN 1 ELSE 0 END) as na
    FROM control_implementations WHERE org_id = ?`).bind(org.id).first(),
    env.DB.prepare(`SELECT
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status != 'completed' AND scheduled_completion < datetime('now') THEN 1 ELSE 0 END) as overdue
    FROM poams WHERE org_id = ?`).bind(org.id).first(),
    env.DB.prepare(`SELECT
      COUNT(DISTINCT ci.control_id) as covered,
      (SELECT COUNT(*) FROM control_implementations WHERE org_id = ? AND status != 'not_applicable') as applicable
    FROM evidence_control_links ecl
    JOIN evidence e ON e.id = ecl.evidence_id
    JOIN control_implementations ci ON ci.control_id = ecl.control_id AND ci.org_id = ?
    WHERE e.org_id = ?`).bind(org.id, org.id, org.id).first(),
    env.DB.prepare(`SELECT
      SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high,
      SUM(CASE WHEN risk_level = 'moderate' THEN 1 ELSE 0 END) as moderate,
      SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low
    FROM risks WHERE org_id = ? AND status = 'open'`).bind(org.id).first(),
    env.DB.prepare(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN last_status = 'pass' THEN 1 ELSE 0 END) as pass
    FROM monitoring_checks WHERE org_id = ?`).bind(org.id).first(),
  ]);

  const scoreData = {
    controls: { total: ctrlStats?.total || 0, implemented: ctrlStats?.implemented || 0, partially: ctrlStats?.partially || 0, planned: ctrlStats?.planned || 0, na: ctrlStats?.na || 0 },
    poams: { open: poamStats?.open || 0, in_progress: poamStats?.in_progress || 0, completed: poamStats?.completed || 0, overdue: poamStats?.overdue || 0 },
    evidence: { covered: evidenceStats?.covered || 0, applicable: evidenceStats?.applicable || 1 },
    risks: { critical: riskStats?.critical || 0, high: riskStats?.high || 0, moderate: riskStats?.moderate || 0, low: riskStats?.low || 0 },
    monitoring: { total: monitoringStats?.total || 0, pass: monitoringStats?.pass || 0 },
  };

  const weights = getOrgScoringWeights(org);
  const result = computeComplianceScore(scoreData, weights);

  // Get enabled frameworks
  const { results: frameworks } = await env.DB.prepare(
    'SELECT cf.name FROM organization_frameworks of JOIN compliance_frameworks cf ON cf.id = of.framework_id WHERE of.org_id = ?'
  ).bind(org.id).all();

  const badgeId = generateId();
  const verificationCode = generateId() + generateId();
  const expiresAt = expires_months
    ? new Date(Date.now() + expires_months * 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const metadata = JSON.stringify({
    frameworks: frameworks.map(f => f.name),
    issued_by: user.name,
  });

  await env.DB.prepare(
    'INSERT INTO compliance_badges (id, org_id, badge_type, framework_id, verification_code, grade, score, metadata, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(badgeId, org.id, badge_type || 'org', framework_id || null, verificationCode, result.grade, result.score, metadata, expiresAt).run();

  await auditLog(env, org.id, user.id, 'create_badge', 'compliance_badge', badgeId, { grade: result.grade, score: result.score });
  fireWebhooks(env, org.id, 'badge_issued', { badge_id: badgeId, grade: result.grade, score: result.score });

  const badge = await env.DB.prepare('SELECT * FROM compliance_badges WHERE id = ?').bind(badgeId).first();

  return jsonResponse({
    badge,
    verification_url: `https://forgecomply360.pages.dev/verify/${verificationCode}`,
    secret_note: 'This verification code will not be shown again. Save it now.'
  }, 201);
}

async function handleRevokeBadge(env, org, user, badgeId) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const badge = await env.DB.prepare('SELECT * FROM compliance_badges WHERE id = ? AND org_id = ?').bind(badgeId, org.id).first();
  if (!badge) return jsonResponse({ error: 'Badge not found' }, 404);

  await env.DB.prepare('UPDATE compliance_badges SET revoked = 1 WHERE id = ?').bind(badgeId).run();
  await auditLog(env, org.id, user.id, 'revoke_badge', 'compliance_badge', badgeId, {});

  return jsonResponse({ success: true });
}

async function handleVerifyBadge(request, env, code) {
  const badge = await env.DB.prepare(
    'SELECT cb.*, o.name as org_name FROM compliance_badges cb JOIN organizations o ON o.id = cb.org_id WHERE cb.verification_code = ?'
  ).bind(code).first();

  if (!badge) {
    return jsonResponse({ valid: false, error: 'Badge not found' });
  }

  if (badge.revoked) {
    return jsonResponse({ valid: false, error: 'Badge has been revoked' });
  }

  if (badge.expires_at && new Date(badge.expires_at) < new Date()) {
    return jsonResponse({ valid: false, error: 'Badge has expired' });
  }

  const metadata = JSON.parse(badge.metadata || '{}');

  return jsonResponse({
    valid: true,
    org_name: badge.org_name,
    grade: badge.grade,
    score: badge.score,
    frameworks: metadata.frameworks || [],
    issued_at: badge.issued_at,
    expires_at: badge.expires_at,
  });
}

// ============================================================================
// PDF REPORT GENERATION (Feature 9)
// ============================================================================

async function handleGeneratePDF(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const body = await request.json();
  const { report_type, include_badge, systems, frameworks } = body;

  // Fetch dashboard stats
  const [ctrlStats, poamStats, riskStats, monitoringStats] = await Promise.all([
    env.DB.prepare(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'implemented' THEN 1 ELSE 0 END) as implemented,
      SUM(CASE WHEN status = 'partially_implemented' THEN 1 ELSE 0 END) as partially,
      SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned,
      SUM(CASE WHEN status = 'not_applicable' THEN 1 ELSE 0 END) as na,
      SUM(CASE WHEN status = 'not_implemented' THEN 1 ELSE 0 END) as not_implemented
    FROM control_implementations WHERE org_id = ?`).bind(org.id).first(),
    env.DB.prepare(`SELECT
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status != 'completed' AND scheduled_completion < datetime('now') THEN 1 ELSE 0 END) as overdue
    FROM poams WHERE org_id = ?`).bind(org.id).first(),
    env.DB.prepare(`SELECT
      SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high,
      SUM(CASE WHEN risk_level = 'moderate' THEN 1 ELSE 0 END) as moderate,
      SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low
    FROM risks WHERE org_id = ? AND status = 'open'`).bind(org.id).first(),
    env.DB.prepare(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN last_status = 'pass' THEN 1 ELSE 0 END) as pass,
      SUM(CASE WHEN last_status = 'fail' THEN 1 ELSE 0 END) as fail
    FROM monitoring_checks WHERE org_id = ?`).bind(org.id).first(),
  ]);

  // Calculate compliance score
  const scoreData = {
    controls: { total: ctrlStats?.total || 0, implemented: ctrlStats?.implemented || 0, partially: ctrlStats?.partially || 0, planned: ctrlStats?.planned || 0, na: ctrlStats?.na || 0 },
    poams: { open: poamStats?.open || 0, in_progress: poamStats?.in_progress || 0, completed: poamStats?.completed || 0, overdue: poamStats?.overdue || 0 },
    evidence: { covered: 0, applicable: 1 },
    risks: { critical: riskStats?.critical || 0, high: riskStats?.high || 0, moderate: riskStats?.moderate || 0, low: riskStats?.low || 0 },
    monitoring: { total: monitoringStats?.total || 0, pass: monitoringStats?.pass || 0 },
  };
  const weights = getOrgScoringWeights(org);
  const complianceResult = computeComplianceScore(scoreData, weights);

  // Get enabled frameworks
  const { results: enabledFrameworks } = await env.DB.prepare(
    'SELECT cf.name, cf.id FROM organization_frameworks of JOIN compliance_frameworks cf ON cf.id = of.framework_id WHERE of.org_id = ?'
  ).bind(org.id).all();

  // Generate HTML report
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const gradeColor = complianceResult.grade === 'A' ? '#22c55e' : complianceResult.grade === 'B' ? '#3b82f6' : complianceResult.grade === 'C' ? '#f59e0b' : '#ef4444';

  let badgeHtml = '';
  if (include_badge) {
    badgeHtml = `
      <div style="margin-top:24px;padding:16px;border:2px solid ${gradeColor};border-radius:12px;text-align:center;">
        <div style="font-size:48px;font-weight:bold;color:${gradeColor};">${complianceResult.grade}</div>
        <div style="font-size:24px;color:#374151;">${complianceResult.score}% Compliant</div>
        <div style="margin-top:8px;font-size:12px;color:#9ca3af;">Verified by ForgeComply 360</div>
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${org.name} - Compliance Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1f2937; }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; }
    h2 { color: #374151; margin-top: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: #1e40af; }
    .date { color: #6b7280; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .summary-card { padding: 16px; border-radius: 8px; text-align: center; }
    .summary-card.green { background: #dcfce7; }
    .summary-card.blue { background: #dbeafe; }
    .summary-card.amber { background: #fef3c7; }
    .summary-card.red { background: #fee2e2; }
    .summary-value { font-size: 32px; font-weight: bold; }
    .summary-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ForgeComply 360</div>
    <div class="date">Report Generated: ${reportDate}</div>
  </div>

  <h1>${org.name} - Compliance Report</h1>

  <div class="summary-grid">
    <div class="summary-card ${complianceResult.score >= 70 ? 'green' : complianceResult.score >= 50 ? 'amber' : 'red'}">
      <div class="summary-value" style="color:${gradeColor}">${complianceResult.grade}</div>
      <div class="summary-label">Compliance Grade</div>
    </div>
    <div class="summary-card blue">
      <div class="summary-value">${complianceResult.score}%</div>
      <div class="summary-label">Overall Score</div>
    </div>
    <div class="summary-card green">
      <div class="summary-value">${ctrlStats?.implemented || 0}</div>
      <div class="summary-label">Controls Implemented</div>
    </div>
    <div class="summary-card ${(poamStats?.overdue || 0) > 0 ? 'red' : 'green'}">
      <div class="summary-value">${poamStats?.overdue || 0}</div>
      <div class="summary-label">Overdue POA&Ms</div>
    </div>
  </div>

  <h2>Frameworks</h2>
  <ul>
    ${enabledFrameworks.map(f => `<li>${f.name}</li>`).join('')}
  </ul>

  <h2>Control Implementation Status</h2>
  <table>
    <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
    <tr><td>Implemented</td><td>${ctrlStats?.implemented || 0}</td><td>${ctrlStats?.total ? Math.round((ctrlStats.implemented / ctrlStats.total) * 100) : 0}%</td></tr>
    <tr><td>Partially Implemented</td><td>${ctrlStats?.partially || 0}</td><td>${ctrlStats?.total ? Math.round((ctrlStats.partially / ctrlStats.total) * 100) : 0}%</td></tr>
    <tr><td>Planned</td><td>${ctrlStats?.planned || 0}</td><td>${ctrlStats?.total ? Math.round((ctrlStats.planned / ctrlStats.total) * 100) : 0}%</td></tr>
    <tr><td>Not Implemented</td><td>${ctrlStats?.not_implemented || 0}</td><td>${ctrlStats?.total ? Math.round((ctrlStats.not_implemented / ctrlStats.total) * 100) : 0}%</td></tr>
    <tr><td>Not Applicable</td><td>${ctrlStats?.na || 0}</td><td>${ctrlStats?.total ? Math.round((ctrlStats.na / ctrlStats.total) * 100) : 0}%</td></tr>
  </table>

  <h2>POA&M Summary</h2>
  <table>
    <tr><th>Status</th><th>Count</th></tr>
    <tr><td>Open</td><td>${poamStats?.open || 0}</td></tr>
    <tr><td>In Progress</td><td>${poamStats?.in_progress || 0}</td></tr>
    <tr><td>Completed</td><td>${poamStats?.completed || 0}</td></tr>
    <tr><td><span class="badge badge-red">Overdue</span></td><td>${poamStats?.overdue || 0}</td></tr>
  </table>

  <h2>Risk Summary</h2>
  <table>
    <tr><th>Level</th><th>Open Risks</th></tr>
    <tr><td><span class="badge badge-red">Critical</span></td><td>${riskStats?.critical || 0}</td></tr>
    <tr><td><span class="badge badge-amber">High</span></td><td>${riskStats?.high || 0}</td></tr>
    <tr><td><span class="badge badge-amber">Moderate</span></td><td>${riskStats?.moderate || 0}</td></tr>
    <tr><td><span class="badge badge-green">Low</span></td><td>${riskStats?.low || 0}</td></tr>
  </table>

  <h2>Monitoring Health</h2>
  <p>
    <strong>${monitoringStats?.pass || 0}</strong> of <strong>${monitoringStats?.total || 0}</strong> checks passing
    (${monitoringStats?.total ? Math.round((monitoringStats.pass / monitoringStats.total) * 100) : 100}%)
  </p>

  ${badgeHtml}

  <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;">
    <p>This report was generated by ForgeComply 360 on ${reportDate}.</p>
    <p>© ${new Date().getFullYear()} Forge Cyber Defense, LLC. All rights reserved.</p>
  </div>
</body>
</html>`;

  await auditLog(env, org.id, user.id, 'generate_pdf_report', 'report', null, { report_type, include_badge });

  // Return HTML that can be printed to PDF
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_compliance_report_${new Date().toISOString().split('T')[0]}.html"`,
    },
  });
}

// ============================================================================
// QUESTIONNAIRES (Feature 10)
// ============================================================================

async function handleListQuestionnaires(env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const { results } = await env.DB.prepare(`
    SELECT q.*,
      (SELECT COUNT(*) FROM questionnaire_responses WHERE questionnaire_id = q.id) as response_count,
      (SELECT AVG(score) FROM questionnaire_responses WHERE questionnaire_id = q.id) as avg_score
    FROM questionnaires q
    WHERE q.org_id = ?
    ORDER BY q.created_at DESC
  `).bind(org.id).all();

  return jsonResponse({ questionnaires: results });
}

async function handleCreateQuestionnaire(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const body = await request.json();
  const { title, description, category, questions, scoring_config } = body;

  const valErrors = validateBody(body, {
    title: { required: true, type: 'string', maxLength: 255 },
    description: { type: 'string', maxLength: 2000 },
    category: { type: 'string', enum: ['vendor', 'system', 'security', 'custom'] },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  const id = generateId();
  const shareToken = generateId() + generateId();

  await env.DB.prepare(
    'INSERT INTO questionnaires (id, org_id, title, description, category, questions, scoring_config, share_token, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, org.id, title, description || null, category || 'custom', JSON.stringify(questions || []), JSON.stringify(scoring_config || { pass_threshold: 70 }), shareToken, user.id).run();

  await auditLog(env, org.id, user.id, 'create_questionnaire', 'questionnaire', id, { title });

  const questionnaire = await env.DB.prepare('SELECT * FROM questionnaires WHERE id = ?').bind(id).first();

  return jsonResponse({
    questionnaire,
    share_url: `https://forgecomply360.pages.dev/q/${shareToken}`
  }, 201);
}

async function handleGetQuestionnaire(env, org, user, id) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const questionnaire = await env.DB.prepare('SELECT * FROM questionnaires WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!questionnaire) return jsonResponse({ error: 'Questionnaire not found' }, 404);

  return jsonResponse({ questionnaire });
}

async function handleUpdateQuestionnaire(request, env, org, user, id) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const questionnaire = await env.DB.prepare('SELECT * FROM questionnaires WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!questionnaire) return jsonResponse({ error: 'Questionnaire not found' }, 404);

  const body = await request.json();
  const { title, description, category, questions, scoring_config, status } = body;

  await env.DB.prepare(`
    UPDATE questionnaires
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        questions = COALESCE(?, questions),
        scoring_config = COALESCE(?, scoring_config),
        status = COALESCE(?, status),
        version = version + 1,
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    title || null,
    description || null,
    category || null,
    questions ? JSON.stringify(questions) : null,
    scoring_config ? JSON.stringify(scoring_config) : null,
    status || null,
    id
  ).run();

  await auditLog(env, org.id, user.id, 'update_questionnaire', 'questionnaire', id, { title, status });

  const updated = await env.DB.prepare('SELECT * FROM questionnaires WHERE id = ?').bind(id).first();
  return jsonResponse({ questionnaire: updated });
}

async function handleDeleteQuestionnaire(env, org, user, id) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const questionnaire = await env.DB.prepare('SELECT * FROM questionnaires WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!questionnaire) return jsonResponse({ error: 'Questionnaire not found' }, 404);

  await env.DB.prepare('DELETE FROM questionnaire_responses WHERE questionnaire_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM questionnaires WHERE id = ?').bind(id).run();

  await auditLog(env, org.id, user.id, 'delete_questionnaire', 'questionnaire', id, { title: questionnaire.title });

  return jsonResponse({ success: true });
}

async function handleListQuestionnaireResponses(env, org, user, questionnaireId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const questionnaire = await env.DB.prepare('SELECT * FROM questionnaires WHERE id = ? AND org_id = ?').bind(questionnaireId, org.id).first();
  if (!questionnaire) return jsonResponse({ error: 'Questionnaire not found' }, 404);

  const { results } = await env.DB.prepare(
    'SELECT * FROM questionnaire_responses WHERE questionnaire_id = ? ORDER BY submitted_at DESC'
  ).bind(questionnaireId).all();

  return jsonResponse({ responses: results });
}

async function handleAnalyzeQuestionnaireResponses(request, env, org, user, questionnaireId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const questionnaire = await env.DB.prepare('SELECT * FROM questionnaires WHERE id = ? AND org_id = ?').bind(questionnaireId, org.id).first();
  if (!questionnaire) return jsonResponse({ error: 'Questionnaire not found' }, 404);

  const { results: responses } = await env.DB.prepare(
    'SELECT * FROM questionnaire_responses WHERE questionnaire_id = ? ORDER BY submitted_at DESC LIMIT 50'
  ).bind(questionnaireId).all();

  if (responses.length === 0) {
    return jsonResponse({ analysis: 'No responses to analyze yet.' });
  }

  const questions = JSON.parse(questionnaire.questions || '[]');
  const avgScore = responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length;
  const passRate = responses.filter(r => r.pass).length / responses.length * 100;

  // Build analysis context
  const analysisContext = `
Questionnaire: ${questionnaire.title}
Category: ${questionnaire.category}
Total Responses: ${responses.length}
Average Score: ${avgScore.toFixed(1)}%
Pass Rate: ${passRate.toFixed(1)}%
Questions: ${questions.length}

Sample responses:
${responses.slice(0, 5).map(r => `- ${r.respondent_organization || 'Anonymous'}: Score ${r.score}%, ${r.pass ? 'PASS' : 'FAIL'}`).join('\n')}
`;

  try {
    const aiResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a compliance analyst. Provide a brief analysis (3-5 bullet points) of questionnaire response patterns, identifying common gaps and recommendations.' },
        { role: 'user', content: analysisContext }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    return jsonResponse({
      analysis: aiResult.response,
      stats: { total: responses.length, avg_score: avgScore, pass_rate: passRate }
    });
  } catch (e) {
    return jsonResponse({
      analysis: `Analysis based on ${responses.length} responses:\n- Average score: ${avgScore.toFixed(1)}%\n- Pass rate: ${passRate.toFixed(1)}%`,
      stats: { total: responses.length, avg_score: avgScore, pass_rate: passRate }
    });
  }
}

async function handlePublicQuestionnaire(env, token) {
  const questionnaire = await env.DB.prepare(
    'SELECT q.*, o.name as org_name FROM questionnaires q JOIN organizations o ON o.id = q.org_id WHERE q.share_token = ? AND q.status = ?'
  ).bind(token, 'active').first();

  if (!questionnaire) {
    return jsonResponse({ error: 'Questionnaire not found or not active' }, 404);
  }

  // Return sanitized questionnaire (no org_id, share_token)
  return jsonResponse({
    questionnaire: {
      id: questionnaire.id,
      title: questionnaire.title,
      description: questionnaire.description,
      category: questionnaire.category,
      questions: JSON.parse(questionnaire.questions || '[]'),
      org_name: questionnaire.org_name,
    }
  });
}

async function handleSubmitQuestionnaireResponse(request, env, token) {
  const questionnaire = await env.DB.prepare(
    'SELECT * FROM questionnaires WHERE share_token = ? AND status = ?'
  ).bind(token, 'active').first();

  if (!questionnaire) {
    return jsonResponse({ error: 'Questionnaire not found or not active' }, 404);
  }

  const body = await request.json();
  const { respondent_name, respondent_email, respondent_organization, answers } = body;

  const questions = JSON.parse(questionnaire.questions || '[]');
  const scoringConfig = JSON.parse(questionnaire.scoring_config || '{}');

  // Validate required answers
  for (const q of questions) {
    if (q.required && (!answers || answers[q.id] === undefined || answers[q.id] === '')) {
      return jsonResponse({ error: `Answer required for question: ${q.text}` }, 400);
    }
  }

  // Calculate score
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const q of questions) {
    if (q.score_weights && answers[q.id] !== undefined) {
      const weight = q.score_weights[answers[q.id]] ?? 0;
      const maxWeight = Math.max(...Object.values(q.score_weights));
      totalPoints += maxWeight;
      earnedPoints += weight;
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
  const passThreshold = scoringConfig.pass_threshold || 70;
  const pass = score >= passThreshold;
  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical';

  const responseId = generateId();
  const metadata = JSON.stringify({
    ip: request.headers.get('CF-Connecting-IP'),
    user_agent: request.headers.get('User-Agent'),
    submitted_at: new Date().toISOString(),
  });

  await env.DB.prepare(
    'INSERT INTO questionnaire_responses (id, questionnaire_id, questionnaire_version, respondent_name, respondent_email, respondent_organization, answers, score, pass, risk_level, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    responseId,
    questionnaire.id,
    questionnaire.version,
    respondent_name || null,
    respondent_email || null,
    respondent_organization || null,
    JSON.stringify(answers),
    score,
    pass ? 1 : 0,
    riskLevel,
    metadata
  ).run();

  // Notify org admins
  notifyOrgRole(env, questionnaire.org_id, null, 'manager', 'questionnaire_response',
    `New ${questionnaire.title} Response`,
    `${respondent_organization || 'Anonymous'} submitted a response with score ${score}% (${pass ? 'PASS' : 'FAIL'})`,
    'questionnaire', questionnaire.id, { score, pass, respondent_organization });

  // Fire webhook
  fireWebhooks(env, questionnaire.org_id, 'questionnaire_response', {
    questionnaire_id: questionnaire.id,
    questionnaire_title: questionnaire.title,
    response_id: responseId,
    score,
    pass,
    risk_level: riskLevel,
    respondent_organization,
  });

  return jsonResponse({
    success: true,
    score,
    pass,
    message: pass ? 'Thank you! Your response has been submitted successfully.' : 'Thank you for your response. Some areas may need attention.'
  }, 201);
}

// ============================================================================
// AUDITOR PORTALS (Feature 12)
// ============================================================================

async function handleListPortals(env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const { results } = await env.DB.prepare(`
    SELECT ap.*,
      (SELECT COUNT(*) FROM auditor_portal_activity WHERE portal_id = ap.id AND action = 'view') as view_count,
      (SELECT COUNT(*) FROM auditor_portal_activity WHERE portal_id = ap.id AND action = 'download') as download_count,
      (SELECT COUNT(*) FROM auditor_portal_activity WHERE portal_id = ap.id AND action = 'comment') as comment_count
    FROM auditor_portals ap
    WHERE ap.org_id = ?
    ORDER BY ap.created_at DESC
  `).bind(org.id).all();

  // Don't expose access tokens
  const portals = results.map(p => {
    const { access_token, ...rest } = p;
    return rest;
  });

  return jsonResponse({ portals });
}

async function handleCreatePortal(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const body = await request.json();
  const { name, description, auditor_name, auditor_email, shared_items, expires_days } = body;

  const valErrors = validateBody(body, {
    name: { required: true, type: 'string', maxLength: 255 },
    auditor_name: { type: 'string', maxLength: 255 },
    auditor_email: { type: 'string', maxLength: 255 },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  const id = generateId();
  const accessToken = generateId() + generateId() + generateId();
  const expiresAt = expires_days
    ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days

  await env.DB.prepare(
    'INSERT INTO auditor_portals (id, org_id, name, description, auditor_name, auditor_email, access_token, shared_items, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, org.id, name, description || null, auditor_name || null, auditor_email || null, accessToken, JSON.stringify(shared_items || {}), expiresAt, user.id).run();

  await auditLog(env, org.id, user.id, 'create_portal', 'auditor_portal', id, { name, auditor_email });

  // Send email to auditor if email provided
  if (auditor_email) {
    const portalUrl = `https://forgecomply360.pages.dev/portal/${accessToken}`;
    await sendEmail(env, auditor_email, `${org.name} has shared compliance documents with you`,
      `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:24px;background:#f4f5f7;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color:#1e40af;margin:0 0 16px;">Compliance Documents Shared</h1>
        <p style="color:#374151;">Hi ${auditor_name || 'there'},</p>
        <p style="color:#374151;"><strong>${org.name}</strong> has shared compliance documents with you via ForgeComply 360.</p>
        <p style="color:#374151;">Click the button below to access the secure portal:</p>
        <a href="${portalUrl}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Access Portal</a>
        <p style="color:#6b7280;font-size:14px;">This link will expire on ${new Date(expiresAt).toLocaleDateString()}.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:12px;">If you did not expect this email, please ignore it.</p>
      </div></body></html>`);
  }

  const portal = await env.DB.prepare('SELECT * FROM auditor_portals WHERE id = ?').bind(id).first();

  return jsonResponse({
    portal: { ...portal, access_token: undefined },
    access_url: `https://forgecomply360.pages.dev/portal/${accessToken}`,
    access_token: accessToken,
    note: 'Save this access URL. The token will not be shown again.'
  }, 201);
}

async function handleGetPortal(env, org, user, id) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const portal = await env.DB.prepare('SELECT * FROM auditor_portals WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!portal) return jsonResponse({ error: 'Portal not found' }, 404);

  const { access_token, ...sanitized } = portal;
  return jsonResponse({ portal: sanitized });
}

async function handleUpdatePortal(request, env, org, user, id) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const portal = await env.DB.prepare('SELECT * FROM auditor_portals WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!portal) return jsonResponse({ error: 'Portal not found' }, 404);

  const body = await request.json();
  const { name, description, shared_items, status } = body;

  await env.DB.prepare(`
    UPDATE auditor_portals
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        shared_items = COALESCE(?, shared_items),
        status = COALESCE(?, status)
    WHERE id = ?
  `).bind(name || null, description || null, shared_items ? JSON.stringify(shared_items) : null, status || null, id).run();

  await auditLog(env, org.id, user.id, 'update_portal', 'auditor_portal', id, { name, status });

  const updated = await env.DB.prepare('SELECT * FROM auditor_portals WHERE id = ?').bind(id).first();
  const { access_token, ...sanitized } = updated;
  return jsonResponse({ portal: sanitized });
}

async function handleDeletePortal(env, org, user, id) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const portal = await env.DB.prepare('SELECT * FROM auditor_portals WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!portal) return jsonResponse({ error: 'Portal not found' }, 404);

  await env.DB.prepare('DELETE FROM auditor_portal_activity WHERE portal_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM auditor_portals WHERE id = ?').bind(id).run();

  await auditLog(env, org.id, user.id, 'delete_portal', 'auditor_portal', id, { name: portal.name });

  return jsonResponse({ success: true });
}

async function handlePortalActivity(env, org, user, id) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const portal = await env.DB.prepare('SELECT * FROM auditor_portals WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!portal) return jsonResponse({ error: 'Portal not found' }, 404);

  const { results } = await env.DB.prepare(
    'SELECT * FROM auditor_portal_activity WHERE portal_id = ? ORDER BY created_at DESC LIMIT 200'
  ).bind(id).all();

  return jsonResponse({ activity: results });
}

async function handlePublicPortalAccess(request, env, token) {
  const portal = await env.DB.prepare(
    'SELECT ap.*, o.name as org_name, o.experience_type FROM auditor_portals ap JOIN organizations o ON o.id = ap.org_id WHERE ap.access_token = ?'
  ).bind(token).first();

  if (!portal) {
    return jsonResponse({ error: 'Portal not found' }, 404);
  }

  if (portal.status === 'revoked') {
    return jsonResponse({ error: 'This portal has been revoked' }, 403);
  }

  if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
    return jsonResponse({ error: 'This portal has expired' }, 403);
  }

  // Update last accessed
  await env.DB.prepare('UPDATE auditor_portals SET last_accessed_at = datetime(\'now\') WHERE id = ?').bind(portal.id).run();

  // Log activity
  await env.DB.prepare(
    'INSERT INTO auditor_portal_activity (id, portal_id, action, item_type, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(generateId(), portal.id, 'view', 'portal', request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent')).run();

  const sharedItems = JSON.parse(portal.shared_items || '{}');
  const data = {
    portal: {
      name: portal.name,
      description: portal.description,
      org_name: portal.org_name,
      expires_at: portal.expires_at,
    },
    systems: [],
    controls: [],
    evidence: [],
    policies: [],
  };

  // Fetch shared systems
  if (sharedItems.systems?.length > 0) {
    const placeholders = sharedItems.systems.map(() => '?').join(',');
    const { results } = await env.DB.prepare(`SELECT id, name, type, status FROM systems WHERE id IN (${placeholders}) AND org_id = ?`)
      .bind(...sharedItems.systems, portal.org_id).all();
    data.systems = results;
  }

  // Fetch shared controls
  if (sharedItems.controls?.length > 0) {
    const placeholders = sharedItems.controls.map(() => '?').join(',');
    const { results } = await env.DB.prepare(`
      SELECT ci.id, ci.control_id, ci.status, ci.narrative, sc.name as control_name, sc.family
      FROM control_implementations ci
      JOIN security_controls sc ON sc.id = ci.control_id
      WHERE ci.id IN (${placeholders}) AND ci.org_id = ?
    `).bind(...sharedItems.controls, portal.org_id).all();
    data.controls = results;
  }

  // Fetch shared evidence (metadata only)
  if (sharedItems.evidence?.length > 0) {
    const placeholders = sharedItems.evidence.map(() => '?').join(',');
    const { results } = await env.DB.prepare(`SELECT id, name, description, type, status, created_at FROM evidence WHERE id IN (${placeholders}) AND org_id = ?`)
      .bind(...sharedItems.evidence, portal.org_id).all();
    data.evidence = results;
  }

  // Fetch shared policies
  if (sharedItems.policies?.length > 0) {
    const placeholders = sharedItems.policies.map(() => '?').join(',');
    const { results } = await env.DB.prepare(`SELECT id, title, description, version, status, last_review_date FROM policies WHERE id IN (${placeholders}) AND org_id = ?`)
      .bind(...sharedItems.policies, portal.org_id).all();
    data.policies = results;
  }

  return jsonResponse(data);
}

async function handlePortalEvidenceDownload(request, env, token, evidenceId) {
  const portal = await env.DB.prepare('SELECT * FROM auditor_portals WHERE access_token = ?').bind(token).first();

  if (!portal) return jsonResponse({ error: 'Portal not found' }, 404);
  if (portal.status === 'revoked') return jsonResponse({ error: 'Portal revoked' }, 403);
  if (portal.expires_at && new Date(portal.expires_at) < new Date()) return jsonResponse({ error: 'Portal expired' }, 403);

  const sharedItems = JSON.parse(portal.shared_items || '{}');
  if (!sharedItems.evidence?.includes(evidenceId)) {
    return jsonResponse({ error: 'Evidence not shared in this portal' }, 403);
  }

  const evidence = await env.DB.prepare('SELECT * FROM evidence WHERE id = ? AND org_id = ?').bind(evidenceId, portal.org_id).first();
  if (!evidence) return jsonResponse({ error: 'Evidence not found' }, 404);

  // Log download activity
  await env.DB.prepare(
    'INSERT INTO auditor_portal_activity (id, portal_id, action, item_type, item_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(generateId(), portal.id, 'download', 'evidence', evidenceId, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent')).run();

  if (!evidence.file_path) {
    return jsonResponse({ error: 'No file attached to this evidence' }, 404);
  }

  try {
    const object = await env.EVIDENCE_VAULT.get(evidence.file_path);
    if (!object) return jsonResponse({ error: 'File not found in storage' }, 404);

    const filename = evidence.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    return new Response(object.body, {
      headers: {
        'Content-Type': evidence.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return jsonResponse({ error: 'Failed to retrieve file' }, 500);
  }
}

async function handlePortalComment(request, env, token) {
  const portal = await env.DB.prepare('SELECT * FROM auditor_portals WHERE access_token = ?').bind(token).first();

  if (!portal) return jsonResponse({ error: 'Portal not found' }, 404);
  if (portal.status === 'revoked') return jsonResponse({ error: 'Portal revoked' }, 403);
  if (portal.expires_at && new Date(portal.expires_at) < new Date()) return jsonResponse({ error: 'Portal expired' }, 403);

  const body = await request.json();
  const { item_type, item_id, comment } = body;

  if (!comment || !item_type || !item_id) {
    return jsonResponse({ error: 'item_type, item_id, and comment are required' }, 400);
  }

  const sharedItems = JSON.parse(portal.shared_items || '{}');
  const itemKey = item_type === 'evidence' ? 'evidence' : item_type === 'control' ? 'controls' : item_type === 'policy' ? 'policies' : 'systems';

  if (!sharedItems[itemKey]?.includes(item_id)) {
    return jsonResponse({ error: 'Item not shared in this portal' }, 403);
  }

  const activityId = generateId();
  await env.DB.prepare(
    'INSERT INTO auditor_portal_activity (id, portal_id, action, item_type, item_id, comment, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(activityId, portal.id, 'comment', item_type, item_id, comment, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent')).run();

  // Notify org admins
  notifyOrgRole(env, portal.org_id, null, 'manager', 'portal_comment',
    `Auditor Comment on ${portal.name}`,
    `${portal.auditor_name || 'Auditor'} commented on ${item_type}: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`,
    'auditor_portal', portal.id, { item_type, item_id, comment });

  // Fire webhook
  fireWebhooks(env, portal.org_id, 'portal_comment', {
    portal_id: portal.id,
    portal_name: portal.name,
    auditor_name: portal.auditor_name,
    item_type,
    item_id,
    comment,
  });

  return jsonResponse({ success: true, activity_id: activityId });
}

// ============================================================================
// API CONNECTORS (Feature 11)
// ============================================================================

async function handleListConnectors(env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const { results } = await env.DB.prepare(
    'SELECT id, org_id, provider, name, status, last_test_at, last_test_status, created_by, created_at FROM api_connectors WHERE org_id = ? ORDER BY created_at DESC'
  ).bind(org.id).all();

  return jsonResponse({ connectors: results });
}

async function handleCreateConnector(request, env, org, user) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const body = await request.json();
  const { provider, name, credentials } = body;

  const valErrors = validateBody(body, {
    provider: { required: true, type: 'string', enum: ['aws', 'azure', 'github', 'okta', 'jira', 'custom'] },
    name: { required: true, type: 'string', maxLength: 255 },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  const id = generateId();
  const encodedCreds = credentials ? btoa(JSON.stringify(credentials)) : null;

  await env.DB.prepare(
    'INSERT INTO api_connectors (id, org_id, provider, name, credentials, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, org.id, provider, name, encodedCreds, user.id).run();

  await auditLog(env, org.id, user.id, 'create_connector', 'api_connector', id, { provider, name });

  const connector = await env.DB.prepare(
    'SELECT id, org_id, provider, name, status, last_test_at, last_test_status, created_by, created_at FROM api_connectors WHERE id = ?'
  ).bind(id).first();

  return jsonResponse({ connector }, 201);
}

async function handleUpdateConnector(request, env, org, user, id) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const connector = await env.DB.prepare('SELECT * FROM api_connectors WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!connector) return jsonResponse({ error: 'Connector not found' }, 404);

  const body = await request.json();
  const { name, credentials, status } = body;

  const encodedCreds = credentials ? btoa(JSON.stringify(credentials)) : null;

  await env.DB.prepare(`
    UPDATE api_connectors
    SET name = COALESCE(?, name),
        credentials = COALESCE(?, credentials),
        status = COALESCE(?, status)
    WHERE id = ?
  `).bind(name || null, encodedCreds, status || null, id).run();

  await auditLog(env, org.id, user.id, 'update_connector', 'api_connector', id, { name, status });

  const updated = await env.DB.prepare(
    'SELECT id, org_id, provider, name, status, last_test_at, last_test_status, created_by, created_at FROM api_connectors WHERE id = ?'
  ).bind(id).first();

  return jsonResponse({ connector: updated });
}

async function handleDeleteConnector(env, org, user, id) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const connector = await env.DB.prepare('SELECT * FROM api_connectors WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!connector) return jsonResponse({ error: 'Connector not found' }, 404);

  const testCount = await env.DB.prepare('SELECT COUNT(*) as count FROM evidence_tests WHERE connector_id = ?').bind(id).first();
  if (testCount?.count > 0) {
    return jsonResponse({ error: 'Cannot delete connector with associated tests' }, 400);
  }

  await env.DB.prepare('DELETE FROM api_connectors WHERE id = ?').bind(id).run();
  await auditLog(env, org.id, user.id, 'delete_connector', 'api_connector', id, { provider: connector.provider, name: connector.name });

  return jsonResponse({ success: true });
}

async function handleTestConnector(env, org, user, id) {
  if (!requireRole(user, 'admin')) return jsonResponse({ error: 'Forbidden' }, 403);

  const connector = await env.DB.prepare('SELECT * FROM api_connectors WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!connector) return jsonResponse({ error: 'Connector not found' }, 404);

  let success = false;
  let message = '';

  try {
    const creds = connector.credentials ? JSON.parse(atob(connector.credentials)) : {};

    switch (connector.provider) {
      case 'github': {
        const res = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${creds.token}`, 'User-Agent': 'ForgeComply360' }
        });
        success = res.ok;
        message = success ? 'GitHub connection successful' : `GitHub API error: ${res.status}`;
        break;
      }
      case 'aws':
        success = !!(creds.access_key_id && creds.secret_access_key);
        message = success ? 'AWS credentials format valid' : 'Missing AWS credentials';
        break;
      case 'azure':
        success = !!(creds.tenant_id && creds.client_id && creds.client_secret);
        message = success ? 'Azure credentials format valid' : 'Missing Azure credentials';
        break;
      case 'okta': {
        const res = await fetch(`${creds.domain}/api/v1/users/me`, {
          headers: { 'Authorization': `SSWS ${creds.token}` }
        });
        success = res.ok;
        message = success ? 'Okta connection successful' : `Okta API error: ${res.status}`;
        break;
      }
      case 'jira': {
        const auth = btoa(`${creds.email}:${creds.api_token}`);
        const res = await fetch(`${creds.domain}/rest/api/3/myself`, {
          headers: { 'Authorization': `Basic ${auth}` }
        });
        success = res.ok;
        message = success ? 'Jira connection successful' : `Jira API error: ${res.status}`;
        break;
      }
      case 'custom':
        success = !!(creds.base_url);
        message = success ? 'Custom connector configured' : 'Missing base_url';
        break;
      default:
        message = 'Unknown provider';
    }
  } catch (e) {
    message = `Connection error: ${e.message}`;
  }

  await env.DB.prepare(
    "UPDATE api_connectors SET last_test_at = datetime('now'), last_test_status = ?, status = ? WHERE id = ?"
  ).bind(success ? 'pass' : 'fail', success ? 'active' : 'error', id).run();

  return jsonResponse({ success, message });
}

// ============================================================================
// EVIDENCE AUTOMATION TESTS (Feature 11)
// ============================================================================

async function handleListEvidenceTests(env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const { results } = await env.DB.prepare(`
    SELECT et.*, s.name as system_name, ac.name as connector_name
    FROM evidence_tests et
    LEFT JOIN systems s ON s.id = et.system_id
    LEFT JOIN api_connectors ac ON ac.id = et.connector_id
    WHERE et.org_id = ?
    ORDER BY et.created_at DESC
  `).bind(org.id).all();

  return jsonResponse({ tests: results });
}

async function handleCreateEvidenceTest(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const body = await request.json();
  const { system_id, control_id, framework_id, test_name, test_type, connector_id, test_script, pass_criteria, schedule, alert_on_fail } = body;

  const valErrors = validateBody(body, {
    system_id: { required: true, type: 'string' },
    control_id: { required: true, type: 'string' },
    framework_id: { required: true, type: 'string' },
    test_name: { required: true, type: 'string', maxLength: 255 },
    test_type: { required: true, type: 'string', enum: ['api', 'manual'] },
    schedule: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'manual'] },
  });
  if (valErrors) return validationErrorResponse(valErrors);

  if (test_type === 'api' && connector_id) {
    const connector = await env.DB.prepare('SELECT id FROM api_connectors WHERE id = ? AND org_id = ?').bind(connector_id, org.id).first();
    if (!connector) return jsonResponse({ error: 'Connector not found' }, 400);
  }

  const id = generateId();

  await env.DB.prepare(
    'INSERT INTO evidence_tests (id, org_id, system_id, control_id, framework_id, test_name, test_type, connector_id, test_script, pass_criteria, schedule, alert_on_fail, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, org.id, system_id, control_id, framework_id, test_name, test_type, connector_id || null, JSON.stringify(test_script || {}), JSON.stringify(pass_criteria || {}), schedule || 'manual', alert_on_fail !== false ? 1 : 0, user.id).run();

  await auditLog(env, org.id, user.id, 'create_evidence_test', 'evidence_test', id, { test_name, test_type, schedule });

  const test = await env.DB.prepare('SELECT * FROM evidence_tests WHERE id = ?').bind(id).first();
  return jsonResponse({ test }, 201);
}

async function handleGetEvidenceTest(env, org, user, id) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const test = await env.DB.prepare(`
    SELECT et.*, s.name as system_name, ac.name as connector_name
    FROM evidence_tests et
    LEFT JOIN systems s ON s.id = et.system_id
    LEFT JOIN api_connectors ac ON ac.id = et.connector_id
    WHERE et.id = ? AND et.org_id = ?
  `).bind(id, org.id).first();

  if (!test) return jsonResponse({ error: 'Test not found' }, 404);

  return jsonResponse({ test });
}

async function handleUpdateEvidenceTest(request, env, org, user, id) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const test = await env.DB.prepare('SELECT * FROM evidence_tests WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!test) return jsonResponse({ error: 'Test not found' }, 404);

  const body = await request.json();
  const { test_name, test_script, pass_criteria, schedule, alert_on_fail, enabled } = body;

  await env.DB.prepare(`
    UPDATE evidence_tests
    SET test_name = COALESCE(?, test_name),
        test_script = COALESCE(?, test_script),
        pass_criteria = COALESCE(?, pass_criteria),
        schedule = COALESCE(?, schedule),
        alert_on_fail = COALESCE(?, alert_on_fail),
        enabled = COALESCE(?, enabled)
    WHERE id = ?
  `).bind(
    test_name || null,
    test_script ? JSON.stringify(test_script) : null,
    pass_criteria ? JSON.stringify(pass_criteria) : null,
    schedule || null,
    alert_on_fail !== undefined ? (alert_on_fail ? 1 : 0) : null,
    enabled !== undefined ? (enabled ? 1 : 0) : null,
    id
  ).run();

  await auditLog(env, org.id, user.id, 'update_evidence_test', 'evidence_test', id, { test_name, schedule, enabled });

  const updated = await env.DB.prepare('SELECT * FROM evidence_tests WHERE id = ?').bind(id).first();
  return jsonResponse({ test: updated });
}

async function handleDeleteEvidenceTest(env, org, user, id) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);

  const test = await env.DB.prepare('SELECT * FROM evidence_tests WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!test) return jsonResponse({ error: 'Test not found' }, 404);

  await env.DB.prepare('DELETE FROM evidence_test_results WHERE test_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM evidence_tests WHERE id = ?').bind(id).run();

  await auditLog(env, org.id, user.id, 'delete_evidence_test', 'evidence_test', id, { test_name: test.test_name });

  return jsonResponse({ success: true });
}

async function handleRunEvidenceTest(env, org, user, id) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const test = await env.DB.prepare('SELECT * FROM evidence_tests WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!test) return jsonResponse({ error: 'Test not found' }, 404);

  const startTime = Date.now();
  const resultId = generateId();
  let status = 'pass';
  let resultData = {};
  let errorMessage = null;
  let evidenceId = null;

  try {
    const testScript = JSON.parse(test.test_script || '{}');
    const passCriteria = JSON.parse(test.pass_criteria || '{}');

    if (test.test_type === 'api' && test.connector_id) {
      const connector = await env.DB.prepare('SELECT * FROM api_connectors WHERE id = ?').bind(test.connector_id).first();
      if (!connector) throw new Error('Connector not found');

      const creds = connector.credentials ? JSON.parse(atob(connector.credentials)) : {};
      const url = testScript.endpoint?.startsWith('http') ? testScript.endpoint : `${creds.base_url || ''}${testScript.endpoint || ''}`;
      const headers = { ...testScript.headers };

      if (connector.provider === 'github') {
        headers['Authorization'] = `token ${creds.token}`;
        headers['User-Agent'] = 'ForgeComply360';
      } else if (connector.provider === 'okta') {
        headers['Authorization'] = `SSWS ${creds.token}`;
      } else if (connector.provider === 'jira') {
        headers['Authorization'] = `Basic ${btoa(`${creds.email}:${creds.api_token}`)}`;
      }

      const res = await fetch(url, {
        method: testScript.method || 'GET',
        headers,
        body: testScript.body ? JSON.stringify(testScript.body) : undefined,
      });

      const responseText = await res.text();
      let responseJson;
      try { responseJson = JSON.parse(responseText); } catch { responseJson = responseText; }

      resultData = { status_code: res.status, response: responseJson };

      let extractedValue = responseJson;
      if (testScript.response_path) {
        const parts = testScript.response_path.split('.');
        for (const part of parts) {
          if (extractedValue && typeof extractedValue === 'object') extractedValue = extractedValue[part];
        }
      }
      resultData.extracted_value = extractedValue;

      const { operator, expected, threshold } = passCriteria;
      switch (operator) {
        case 'equals': status = extractedValue === expected ? 'pass' : 'fail'; break;
        case 'contains': status = String(extractedValue).includes(expected) ? 'pass' : 'fail'; break;
        case 'greater_than': status = Number(extractedValue) > Number(threshold) ? 'pass' : 'fail'; break;
        case 'exists': status = extractedValue !== undefined && extractedValue !== null ? 'pass' : 'fail'; break;
        case 'status_code': status = res.status === Number(expected) ? 'pass' : 'fail'; break;
        default: status = res.ok ? 'pass' : 'fail';
      }
    } else {
      resultData = { note: 'Manual test execution recorded' };
    }

    evidenceId = generateId();
    const evidenceName = `Auto: ${test.test_name} - ${new Date().toISOString().split('T')[0]}`;
    await env.DB.prepare(
      'INSERT INTO evidence (id, org_id, name, description, type, status, source) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(evidenceId, org.id, evidenceName, `Automated test result for ${test.test_name}`, 'automated_test', 'active', 'automation').run();

    await env.DB.prepare(
      'INSERT OR IGNORE INTO evidence_control_links (id, evidence_id, control_id, system_id) VALUES (?, ?, ?, ?)'
    ).bind(generateId(), evidenceId, test.control_id, test.system_id).run();

  } catch (e) {
    status = 'error';
    errorMessage = e.message;
    resultData = { error: e.message };
  }

  const durationMs = Date.now() - startTime;

  await env.DB.prepare(
    'INSERT INTO evidence_test_results (id, test_id, status, result_data, evidence_id, duration_ms, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(resultId, id, status, JSON.stringify(resultData), evidenceId, durationMs, errorMessage).run();

  await env.DB.prepare("UPDATE evidence_tests SET last_run_at = datetime('now'), last_status = ? WHERE id = ?").bind(status, id).run();

  if (status === 'fail' && test.alert_on_fail) {
    notifyOrgRole(env, org.id, user.id, 'manager', 'evidence_test_fail',
      `Evidence Test Failed: ${test.test_name}`,
      `Automated test "${test.test_name}" failed during execution.`,
      'evidence_test', id, { status, error: errorMessage });

    fireWebhooks(env, org.id, 'evidence_test_fail', { test_id: id, test_name: test.test_name, status, error: errorMessage });
  }

  await auditLog(env, org.id, user.id, 'run_evidence_test', 'evidence_test', id, { status, duration_ms: durationMs });

  return jsonResponse({ result: { id: resultId, status, result_data: resultData, duration_ms: durationMs, evidence_id: evidenceId, error_message: errorMessage } });
}

async function handleEvidenceTestResults(env, org, user, id) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const test = await env.DB.prepare('SELECT * FROM evidence_tests WHERE id = ? AND org_id = ?').bind(id, org.id).first();
  if (!test) return jsonResponse({ error: 'Test not found' }, 404);

  const { results } = await env.DB.prepare(
    'SELECT * FROM evidence_test_results WHERE test_id = ? ORDER BY run_at DESC LIMIT 100'
  ).bind(id).all();

  return jsonResponse({ results });
}

async function handleAutomationStats(env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const [totalTests, passRate, todayRuns, failedTests] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM evidence_tests WHERE org_id = ?').bind(org.id).first(),
    env.DB.prepare(`
      SELECT COUNT(CASE WHEN status = 'pass' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as rate
      FROM evidence_test_results etr
      JOIN evidence_tests et ON et.id = etr.test_id
      WHERE et.org_id = ? AND etr.run_at >= datetime('now', '-24 hours')
    `).bind(org.id).first(),
    env.DB.prepare(`
      SELECT COUNT(*) as count FROM evidence_test_results etr
      JOIN evidence_tests et ON et.id = etr.test_id
      WHERE et.org_id = ? AND etr.run_at >= datetime('now', '-24 hours')
    `).bind(org.id).first(),
    env.DB.prepare("SELECT COUNT(*) as count FROM evidence_tests WHERE org_id = ? AND last_status = 'fail'").bind(org.id).first(),
  ]);

  return jsonResponse({
    stats: {
      total_tests: totalTests?.count || 0,
      pass_rate_24h: Math.round(passRate?.rate || 100),
      runs_today: todayRuns?.count || 0,
      failed_tests: failedTests?.count || 0,
    }
  });
}
