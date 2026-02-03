// ============================================================================
// FORGECOMPLY 360 - CLOUDFLARE WORKERS API v5.0
// Forge Cyber Defense - Service-Disabled Veteran-Owned Small Business (SDVOSB)
// Single Engine, Multiple Experiences Architecture
// ============================================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsOrigin = env.CORS_ORIGIN || '*';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(corsOrigin),
      });
    }

    try {
      const response = await handleRequest(request, env, url);
      // Add CORS + security headers
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(corsOrigin)).forEach(([k, v]) => headers.set(k, v));
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      return new Response(response.body, { status: response.status, headers });
    } catch (err) {
      console.error('Unhandled error:', err);
      return jsonResponse({ error: 'Internal server error' }, 500, corsOrigin);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      handleScheduledEvidenceChecks(env).then(() => handleEmailDigest(env))
    );
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
// ROUTER
// ============================================================================

async function handleRequest(request, env, url) {
  const path = url.pathname;
  const method = request.method;

  // Health check
  if (path === '/health') {
    return jsonResponse({ status: 'ok', version: '5.0.0', timestamp: new Date().toISOString() });
  }

  // Public auth routes
  if (path === '/api/v1/auth/register' && method === 'POST') return handleRegister(request, env);
  if (path === '/api/v1/auth/login' && method === 'POST') return handleLogin(request, env);
  if (path === '/api/v1/auth/refresh' && method === 'POST') return handleRefreshToken(request, env);
  if (path === '/api/v1/auth/mfa/verify' && method === 'POST') return handleMFAVerify(request, env);

  // All routes below require auth
  const auth = await authenticateRequest(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, org } = auth;

  // Auth
  if (path === '/api/v1/auth/me' && method === 'GET') return jsonResponse({ user, org });
  if (path === '/api/v1/auth/logout' && method === 'POST') return handleLogout(request, env, user);
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
  if (path === '/api/v1/implementations/stats' && method === 'GET') return handleImplementationStats(env, url, org);
  if (path.match(/^\/api\/v1\/implementations\/[\w-]+\/evidence$/) && method === 'GET') return handleGetImplementationEvidence(env, org, path.split('/')[4]);

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
  if (path === '/api/v1/org-members' && method === 'GET') return handleListOrgMembers(env, org);

  // Evidence
  if (path === '/api/v1/evidence' && method === 'GET') return handleListEvidence(env, org);
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
  if (path.match(/^\/api\/v1\/risks\/[\w-]+$/) && method === 'DELETE') return handleDeleteRisk(env, org, user, path.split('/').pop());

  // Vendors (VendorGuard)
  if (path === '/api/v1/vendors' && method === 'GET') return handleListVendors(env, org);
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
  if (path.match(/^\/api\/v1\/users\/[\w-]+\/role$/) && method === 'PUT') return handleUpdateUserRole(request, env, org, user, path.split('/')[4]);

  // User / Onboarding
  if (path === '/api/v1/user/onboarding' && method === 'POST') return handleCompleteOnboarding(request, env, user);

  // Subscription
  if (path === '/api/v1/subscription' && method === 'GET') return handleGetSubscription(env, org);

  // Dashboard stats
  if (path === '/api/v1/dashboard/stats' && method === 'GET') return handleDashboardStats(env, org);
  if (path === '/api/v1/dashboard/framework-stats' && method === 'GET') return handleFrameworkStats(env, org);
  if (path === '/api/v1/dashboard/my-work' && method === 'GET') return handleMyWork(env, org, user);
  if (path === '/api/v1/dashboard/system-comparison' && method === 'GET') return handleSystemComparison(env, org, user);
  if (path === '/api/v1/compliance/snapshot' && method === 'POST') return handleCreateComplianceSnapshot(request, env, org, user);
  if (path === '/api/v1/compliance/trends' && method === 'GET') return handleGetComplianceTrends(env, url, org);

  // Audit log
  if (path === '/api/v1/audit-log' && method === 'GET') return handleGetAuditLog(env, url, org, user);
  if (path.match(/^\/api\/v1\/activity\/[\w_-]+\/[\w-]+$/) && method === 'GET') return handleGetResourceActivity(env, url, org, user, path.split('/')[4], path.split('/')[5]);

  // Notifications
  if (path === '/api/v1/notifications' && method === 'GET') return handleGetNotifications(env, url, user);
  if (path === '/api/v1/notifications/unread-count' && method === 'GET') return handleUnreadCount(env, user);
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
    const payload = await verifyJWT(token, env.JWT_SECRET || 'dev-secret-change-me');
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
// JWT HELPERS
// ============================================================================

async function createJWT(payload, secret, expiresInMinutes = 15) {
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
    await env.DB.prepare(
      'INSERT INTO audit_logs (id, org_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      generateId(),
      orgId,
      userId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      request?.headers?.get('CF-Connecting-IP') || null,
      request?.headers?.get('User-Agent') || null
    ).run();
  } catch (e) {
    console.error('Audit log error:', e);
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
// NOTIFICATION HELPERS
// ============================================================================

const INSTANT_EMAIL_TYPES = ['monitoring_fail', 'approval_request', 'evidence_expiry'];

const NOTIFICATION_TYPE_LABELS = {
  poam_update: 'POA&M Updates', risk_alert: 'Risk Alerts', monitoring_fail: 'Monitoring Failures',
  control_change: 'Control Changes', role_change: 'Role Changes', compliance_alert: 'Compliance Alerts',
  evidence_upload: 'Evidence Uploads', approval_request: 'Approval Requests', approval_decision: 'Approval Decisions',
  evidence_reminder: 'Evidence Reminders', evidence_expiry: 'Evidence Expiry',
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

async function createNotification(env, orgId, recipientUserId, type, title, message, resourceType, resourceId, details = {}) {
  try {
    const pref = await env.DB.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').bind(recipientUserId).first();
    if (pref && pref[type] === 0) return;

    const isInstantType = INSTANT_EMAIL_TYPES.includes(type);
    await env.DB.prepare(
      'INSERT INTO notifications (id, org_id, recipient_user_id, type, title, message, resource_type, resource_id, details, email_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(generateId(), orgId, recipientUserId, type, title, message, resourceType || null, resourceId || null, JSON.stringify(details), isInstantType ? 1 : 0).run();

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
  const { email, password, name, organizationName, industry, size } = await request.json();

  if (!email || !password || !name) {
    return jsonResponse({ error: 'Email, password, and name are required' }, 400);
  }
  if (password.length < 12) {
    return jsonResponse({ error: 'Password must be at least 12 characters' }, 400);
  }

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

  const accessToken = await createJWT({ sub: userId, org: orgId, role: 'owner' }, env.JWT_SECRET || 'dev-secret-change-me', 15);
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
  const { email, password } = await request.json();
  if (!email || !password) return jsonResponse({ error: 'Email and password required' }, 400);

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (!user) return jsonResponse({ error: 'Invalid credentials' }, 401);

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
    const mfaToken = await createJWT({ sub: user.id, org: user.org_id, purpose: 'mfa' }, env.JWT_SECRET || 'dev-secret-change-me', 5);
    await auditLog(env, user.org_id, user.id, 'login_mfa_pending', 'user', user.id, {}, request);
    return jsonResponse({ mfa_required: true, mfa_token: mfaToken });
  }

  const accessToken = await createJWT({ sub: user.id, org: user.org_id, role: user.role }, env.JWT_SECRET || 'dev-secret-change-me', 15);
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

  const accessToken = await createJWT({ sub: user.id, org: user.org_id, role: user.role }, env.JWT_SECRET || 'dev-secret-change-me', 15);
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

// ============================================================================
// MFA ENDPOINTS
// ============================================================================

async function handleMFASetup(request, env, user) {
  const fullUser = await env.DB.prepare('SELECT mfa_enabled FROM users WHERE id = ?').bind(user.id).first();
  if (fullUser.mfa_enabled) return jsonResponse({ error: '2FA is already enabled' }, 400);

  const { base32 } = generateMFASecret();
  const uri = buildTOTPUri(base32, user.email);
  await env.DB.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').bind(base32, user.id).run();
  return jsonResponse({ secret: base32, uri });
}

async function handleMFAVerifySetup(request, env, user) {
  const { code } = await request.json();
  if (!code) return jsonResponse({ error: 'Code required' }, 400);

  const fullUser = await env.DB.prepare('SELECT mfa_secret, mfa_enabled FROM users WHERE id = ?').bind(user.id).first();
  if (!fullUser.mfa_secret) return jsonResponse({ error: 'No MFA setup in progress' }, 400);
  if (fullUser.mfa_enabled) return jsonResponse({ error: '2FA is already enabled' }, 400);

  const secretBytes = base32Decode(fullUser.mfa_secret);
  const valid = await verifyTOTP(secretBytes, code.replace(/\s/g, ''));
  if (!valid) return jsonResponse({ error: 'Invalid code. Check your authenticator app and try again.' }, 400);

  const backupCodes = generateBackupCodes(8);
  await env.DB.prepare('UPDATE users SET mfa_enabled = 1, mfa_backup_codes = ? WHERE id = ?')
    .bind(JSON.stringify(backupCodes), user.id).run();
  await auditLog(env, user.org_id, user.id, 'mfa_enabled', 'user', user.id, {});
  return jsonResponse({ backup_codes: backupCodes });
}

async function handleMFAVerify(request, env) {
  const { mfa_token, code } = await request.json();
  if (!mfa_token || !code) return jsonResponse({ error: 'MFA token and code required' }, 400);

  let payload;
  try {
    payload = await verifyJWT(mfa_token, env.JWT_SECRET || 'dev-secret-change-me');
  } catch {
    return jsonResponse({ error: 'Invalid or expired MFA token' }, 401);
  }
  if (payload.purpose !== 'mfa') return jsonResponse({ error: 'Invalid token type' }, 401);

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first();
  if (!user || !user.mfa_enabled) return jsonResponse({ error: 'Invalid MFA state' }, 400);

  const cleanCode = code.replace(/[\s-]/g, '');
  let valid = false;

  // Try TOTP
  const secretBytes = base32Decode(user.mfa_secret);
  valid = await verifyTOTP(secretBytes, cleanCode);

  // Try backup codes if TOTP didn't match
  if (!valid && user.mfa_backup_codes) {
    const backupCodes = JSON.parse(user.mfa_backup_codes);
    const normalizedInput = cleanCode.toUpperCase();
    const matchIndex = backupCodes.findIndex(bc => bc.replace(/-/g, '') === normalizedInput);
    if (matchIndex !== -1) {
      valid = true;
      backupCodes.splice(matchIndex, 1);
      await env.DB.prepare('UPDATE users SET mfa_backup_codes = ? WHERE id = ?')
        .bind(JSON.stringify(backupCodes), user.id).run();
    }
  }

  if (!valid) return jsonResponse({ error: 'Invalid code' }, 401);

  // Issue real tokens
  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(user.org_id).first();
  const accessToken = await createJWT({ sub: user.id, org: user.org_id, role: user.role }, env.JWT_SECRET || 'dev-secret-change-me', 15);
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
  const secretBytes = base32Decode(fullUser.mfa_secret);
  let valid = await verifyTOTP(secretBytes, cleanCode);

  if (!valid && fullUser.mfa_backup_codes) {
    const backupCodes = JSON.parse(fullUser.mfa_backup_codes);
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

  const secretBytes = base32Decode(fullUser.mfa_secret);
  const valid = await verifyTOTP(secretBytes, code.replace(/\s/g, ''));
  if (!valid) return jsonResponse({ error: 'Invalid code' }, 401);

  const newCodes = generateBackupCodes(8);
  await env.DB.prepare('UPDATE users SET mfa_backup_codes = ? WHERE id = ?').bind(JSON.stringify(newCodes), user.id).run();
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

  let query = `SELECT p.*, u.name as assigned_to_name, u2.name as created_by_name, s.name as system_name
    FROM poams p LEFT JOIN users u ON p.assigned_to = u.id LEFT JOIN users u2 ON p.created_by = u2.id LEFT JOIN systems s ON s.id = p.system_id
    WHERE p.org_id = ?`;
  const params = [org.id];
  if (systemId) { query += ' AND p.system_id = ?'; params.push(systemId); }
  if (status) { query += ' AND p.status = ?'; params.push(status); }
  if (riskLevel) { query += ' AND p.risk_level = ?'; params.push(riskLevel); }
  if (overdue === '1') { query += " AND p.scheduled_completion < date('now') AND p.status NOT IN ('completed','accepted','deferred')"; }
  query += ' ORDER BY CASE p.risk_level WHEN "critical" THEN 0 WHEN "high" THEN 1 WHEN "moderate" THEN 2 ELSE 3 END, p.created_at DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();

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
  }

  return jsonResponse({ poams: results });
}

async function handleCreatePoam(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, weakness_name, weakness_description, control_id, framework_id, risk_level, scheduled_completion, responsible_party, assigned_to } = body;
  if (!system_id || !weakness_name) return jsonResponse({ error: 'system_id and weakness_name required' }, 400);

  const id = generateId();
  const poamId = `POAM-${Date.now().toString(36).toUpperCase()}`;

  await env.DB.prepare(
    `INSERT INTO poams (id, org_id, system_id, poam_id, weakness_name, weakness_description, control_id, framework_id, risk_level, status, scheduled_completion, responsible_party, assigned_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`
  ).bind(id, org.id, system_id, poamId, weakness_name, weakness_description || null, control_id || null, framework_id || null, risk_level || 'moderate', scheduled_completion || null, responsible_party || null, assigned_to || null, user.id).run();

  await auditLog(env, org.id, user.id, 'create', 'poam', id, { poam_id: poamId, weakness_name });
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

  const fields = ['weakness_name', 'weakness_description', 'risk_level', 'status', 'scheduled_completion', 'actual_completion', 'milestones', 'responsible_party', 'resources_required', 'cost_estimate', 'comments', 'assigned_to', 'vendor_dependency'];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(field === 'milestones' ? JSON.stringify(body[field]) : body[field]);
    }
  }

  if (updates.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(poamId);

  await env.DB.prepare(`UPDATE poams SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  const changes = computeDiff(poam, body, ['weakness_name', 'weakness_description', 'risk_level', 'status', 'scheduled_completion', 'actual_completion', 'responsible_party', 'resources_required', 'cost_estimate', 'assigned_to', 'vendor_dependency']);
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
  await env.DB.prepare('INSERT INTO poam_milestones (id, poam_id, title, target_date) VALUES (?, ?, ?, ?)').bind(id, poamId, body.title, body.target_date || null).run();
  await auditLog(env, org.id, user.id, 'create', 'poam_milestone', id, { poam_id: poamId, title: body.title });
  const milestone = await env.DB.prepare('SELECT * FROM poam_milestones WHERE id = ?').bind(id).first();
  return jsonResponse({ milestone }, 201);
}

async function handleUpdateMilestone(request, env, org, user, poamId, milestoneId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const poam = await env.DB.prepare('SELECT id FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);
  const body = await request.json();
  const fields = ['title', 'target_date', 'status', 'completion_date'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); values.push(body[f]); }
  }
  if (body.status === 'completed' && !body.completion_date) { updates.push('completion_date = ?'); values.push(new Date().toISOString()); }
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

// Org Members (lightweight for assignment dropdowns)
async function handleListOrgMembers(env, org) {
  const { results } = await env.DB.prepare('SELECT id, name, email FROM users WHERE org_id = ? ORDER BY name').bind(org.id).all();
  return jsonResponse({ members: results });
}

// ============================================================================
// EVIDENCE VAULT
// ============================================================================

async function handleListEvidence(env, org) {
  const { results } = await env.DB.prepare(
    'SELECT e.*, u.name as uploaded_by_name FROM evidence e LEFT JOIN users u ON u.id = e.uploaded_by WHERE e.org_id = ? ORDER BY e.created_at DESC'
  ).bind(org.id).all();
  return jsonResponse({ evidence: results });
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

  let sql = 'SELECT r.*, s.name as system_name FROM risks r LEFT JOIN systems s ON s.id = r.system_id WHERE r.org_id = ?';
  const params = [org.id];

  if (systemId) { sql += ' AND r.system_id = ?'; params.push(systemId); }
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  if (category) { sql += ' AND r.category = ?'; params.push(category); }
  if (riskLevel) { sql += ' AND r.risk_level = ?'; params.push(riskLevel); }
  if (likelihood) { sql += ' AND r.likelihood = ?'; params.push(likelihood); }
  if (impact) { sql += ' AND r.impact = ?'; params.push(impact); }
  if (search) { sql += ' AND (r.title LIKE ? OR r.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' ORDER BY r.risk_score DESC, r.created_at DESC';
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return jsonResponse({ risks: results });
}

async function handleCreateRisk(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, title, description, category, likelihood, impact, treatment, treatment_plan, treatment_due_date, owner, related_controls } = body;
  if (!title) return jsonResponse({ error: 'Title is required' }, 400);

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

async function handleListVendors(env, org) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM vendors WHERE org_id = ? ORDER BY criticality DESC, name'
  ).bind(org.id).all();
  return jsonResponse({ vendors: results });
}

async function handleCreateVendor(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { name, description, category, criticality, contact_name, contact_email, contract_start, contract_end, data_classification, has_baa } = body;
  if (!name) return jsonResponse({ error: 'Vendor name required' }, 400);

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
  const [systems, implementations, poams, evidence, risks] = await Promise.all([
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
    },
  });
}

// ============================================================================
// MY WORK (role-based personal dashboard data)
// ============================================================================

async function handleMyWork(env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);

  const today = new Date().toISOString().split('T')[0];

  const [myPoams, myPoamCount, overduePoams, mySchedules, mySchedulesDue, myTasks, myTaskCount] = await Promise.all([
    env.DB.prepare(
      `SELECT id, title, status, scheduled_completion FROM poams
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
    prefs = { poam_update: 1, risk_alert: 1, monitoring_fail: 1, control_change: 1, role_change: 1, compliance_alert: 1, evidence_upload: 1, approval_request: 1, approval_decision: 1, evidence_reminder: 1, evidence_expiry: 1, email_digest: 1 };
  }
  return jsonResponse({ preferences: prefs });
}

async function handleUpdateNotificationPrefs(request, env, user) {
  const body = await request.json();
  const types = ['poam_update', 'risk_alert', 'monitoring_fail', 'control_change', 'role_change', 'compliance_alert', 'evidence_upload', 'approval_request', 'approval_decision', 'evidence_reminder', 'evidence_expiry', 'email_digest'];
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
    max_tokens: 2048,
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
    systemPrompt = 'You are a senior cybersecurity compliance consultant. Write professional, detailed compliance documentation.';
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
    'SELECT id, email, name, role, mfa_enabled, onboarding_completed, last_login_at, created_at FROM users WHERE org_id = ? ORDER BY created_at'
  ).bind(org.id).all();
  return jsonResponse({ users: results });
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

// ============================================================================
// DASHBOARD ANALYTICS (Feature 6)
// ============================================================================

async function handleFrameworkStats(env, org) {
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
}

async function handleCreateComplianceSnapshot(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const today = new Date().toISOString().split('T')[0];
  const { results: impls } = await env.DB.prepare(
    `SELECT system_id, framework_id, status, COUNT(*) as count FROM control_implementations WHERE org_id = ? GROUP BY system_id, framework_id, status`
  ).bind(org.id).all();
  const combos = {};
  for (const row of impls) {
    const key = `${row.system_id}|${row.framework_id}`;
    if (!combos[key]) combos[key] = { system_id: row.system_id, framework_id: row.framework_id, total: 0, implemented: 0, partially_implemented: 0, planned: 0, not_applicable: 0, not_implemented: 0 };
    combos[key][row.status] = (combos[key][row.status] || 0) + row.count;
    combos[key].total += row.count;
  }
  let inserted = 0;
  for (const c of Object.values(combos)) {
    const pct = c.total > 0 ? Math.round(((c.implemented + c.not_applicable) / c.total) * 100) : 0;
    await env.DB.prepare(
      `INSERT OR REPLACE INTO compliance_snapshots (id, org_id, system_id, framework_id, snapshot_date, total_controls, implemented, partially_implemented, planned, not_applicable, not_implemented, compliance_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(generateId(), org.id, c.system_id, c.framework_id, today, c.total, c.implemented, c.partially_implemented, c.planned, c.not_applicable, c.not_implemented, pct).run();
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
}

async function handleApproveRequest(request, env, org, user, approvalId) {
  const approval = await env.DB.prepare('SELECT * FROM approval_requests WHERE id = ? AND org_id = ?').bind(approvalId, org.id).first();
  if (!approval) return jsonResponse({ error: 'Approval request not found' }, 404);
  if (approval.status !== 'pending') return jsonResponse({ error: 'Request is no longer pending' }, 400);
  if (approval.requested_by === user.id) return jsonResponse({ error: 'Cannot approve your own request' }, 403);

  const approverRole = { poam_closure: 'manager', risk_acceptance: 'admin', ssp_publication: 'admin' };
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

  const approverRole = { poam_closure: 'manager', risk_acceptance: 'admin', ssp_publication: 'admin' };
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
