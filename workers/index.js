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

  // All routes below require auth
  const auth = await authenticateRequest(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, org } = auth;

  // Auth
  if (path === '/api/v1/auth/me' && method === 'GET') return jsonResponse({ user, org });
  if (path === '/api/v1/auth/logout' && method === 'POST') return handleLogout(request, env, user);

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
  if (path === '/api/v1/implementations/stats' && method === 'GET') return handleImplementationStats(env, url, org);
  if (path.match(/^\/api\/v1\/implementations\/[\w-]+\/evidence$/) && method === 'GET') return handleGetImplementationEvidence(env, org, path.split('/')[4]);

  // POA&Ms
  if (path === '/api/v1/poams' && method === 'GET') return handleListPoams(env, url, org);
  if (path === '/api/v1/poams' && method === 'POST') return handleCreatePoam(request, env, org, user);
  if (path.match(/^\/api\/v1\/poams\/[\w-]+$/) && method === 'PUT') return handleUpdatePoam(request, env, org, user, path.split('/').pop());

  // Evidence
  if (path === '/api/v1/evidence' && method === 'GET') return handleListEvidence(env, org);
  if (path === '/api/v1/evidence' && method === 'POST') return handleUploadEvidence(request, env, org, user);
  if (path.match(/^\/api\/v1\/evidence\/[\w-]+\/download$/) && method === 'GET') {
    const id = path.split('/')[4];
    return handleDownloadEvidence(env, org, id);
  }
  if (path === '/api/v1/evidence/link' && method === 'POST') return handleLinkEvidence(request, env, org, user);

  // SSP / OSCAL
  if (path === '/api/v1/ssp/generate' && method === 'POST') return handleGenerateSSP(request, env, org, user);
  if (path === '/api/v1/ssp' && method === 'GET') return handleListSSPs(env, org);

  // Risks (RiskForge)
  if (path === '/api/v1/risks' && method === 'GET') return handleListRisks(env, org);
  if (path === '/api/v1/risks' && method === 'POST') return handleCreateRisk(request, env, org, user);
  if (path.match(/^\/api\/v1\/risks\/[\w-]+$/) && method === 'PUT') return handleUpdateRisk(request, env, org, user, path.split('/').pop());

  // Vendors (VendorGuard)
  if (path === '/api/v1/vendors' && method === 'GET') return handleListVendors(env, org);
  if (path === '/api/v1/vendors' && method === 'POST') return handleCreateVendor(request, env, org, user);
  if (path.match(/^\/api\/v1\/vendors\/[\w-]+$/) && method === 'PUT') return handleUpdateVendor(request, env, org, user, path.split('/').pop());

  // Monitoring (ControlPulse CCM)
  if (path === '/api/v1/monitoring/checks' && method === 'GET') return handleListMonitoringChecks(env, org);
  if (path === '/api/v1/monitoring/checks' && method === 'POST') return handleCreateMonitoringCheck(request, env, org, user);
  if (path.match(/^\/api\/v1\/monitoring\/checks\/[\w-]+$/) && method === 'PUT') return handleUpdateMonitoringCheck(request, env, org, user, path.split('/').pop());
  if (path.match(/^\/api\/v1\/monitoring\/checks\/[\w-]+\/run$/) && method === 'POST') return handleRunMonitoringCheck(request, env, org, user, path.split('/')[5]);
  if (path.match(/^\/api\/v1\/monitoring\/checks\/[\w-]+\/results$/) && method === 'GET') return handleGetCheckResults(env, org, path.split('/')[5]);
  if (path === '/api/v1/monitoring/dashboard' && method === 'GET') return handleMonitoringDashboard(env, org);

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
  if (path === '/api/v1/compliance/snapshot' && method === 'POST') return handleCreateComplianceSnapshot(request, env, org, user);
  if (path === '/api/v1/compliance/trends' && method === 'GET') return handleGetComplianceTrends(env, url, org);

  // Audit log
  if (path === '/api/v1/audit-log' && method === 'GET') return handleGetAuditLog(env, url, org);

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
  await auditLog(env, org.id, user.id, 'update', 'system', systemId, body);

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

  let query = 'SELECT ci.*, sc.title as control_title, sc.family, sc.description as control_description FROM control_implementations ci LEFT JOIN security_controls sc ON sc.framework_id = ci.framework_id AND sc.control_id = ci.control_id WHERE ci.org_id = ?';
  const params = [org.id];

  if (systemId) { query += ' AND ci.system_id = ?'; params.push(systemId); }
  if (frameworkId) { query += ' AND ci.framework_id = ?'; params.push(frameworkId); }
  if (status) { query += ' AND ci.status = ?'; params.push(status); }

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

  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role, ai_narrative)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(system_id, framework_id, control_id) DO UPDATE SET
       status = COALESCE(?, status),
       implementation_description = COALESCE(?, implementation_description),
       responsible_role = COALESCE(?, responsible_role),
       ai_narrative = COALESCE(?, ai_narrative),
       updated_at = datetime('now')`
  ).bind(
    id, org.id, system_id, framework_id, control_id, status || 'not_implemented', implementation_description || null, responsible_role || null, ai_narrative || null,
    status || null, implementation_description || null, responsible_role || null, ai_narrative || null
  ).run();

  // Return the full implementation record
  const impl = await env.DB.prepare(
    'SELECT * FROM control_implementations WHERE system_id = ? AND framework_id = ? AND control_id = ?'
  ).bind(system_id, framework_id, control_id).first();

  await auditLog(env, org.id, user.id, 'upsert', 'control_implementation', control_id, { system_id, framework_id, status });
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

  let query = 'SELECT * FROM poams WHERE org_id = ?';
  const params = [org.id];
  if (systemId) { query += ' AND system_id = ?'; params.push(systemId); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY CASE risk_level WHEN "critical" THEN 0 WHEN "high" THEN 1 WHEN "moderate" THEN 2 ELSE 3 END, created_at DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse({ poams: results });
}

async function handleCreatePoam(request, env, org, user) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, weakness_name, weakness_description, control_id, framework_id, risk_level, scheduled_completion, responsible_party } = body;
  if (!system_id || !weakness_name) return jsonResponse({ error: 'system_id and weakness_name required' }, 400);

  const id = generateId();
  const poamId = `POAM-${Date.now().toString(36).toUpperCase()}`;

  await env.DB.prepare(
    `INSERT INTO poams (id, org_id, system_id, poam_id, weakness_name, weakness_description, control_id, framework_id, risk_level, scheduled_completion, responsible_party, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, system_id, poamId, weakness_name, weakness_description || null, control_id || null, framework_id || null, risk_level || 'moderate', scheduled_completion || null, responsible_party || null, user.id).run();

  await auditLog(env, org.id, user.id, 'create', 'poam', id, { poam_id: poamId, weakness_name });
  const poam = await env.DB.prepare('SELECT * FROM poams WHERE id = ?').bind(id).first();
  return jsonResponse({ poam }, 201);
}

async function handleUpdatePoam(request, env, org, user, poamId) {
  if (!requireRole(user, 'analyst')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const poam = await env.DB.prepare('SELECT * FROM poams WHERE id = ? AND org_id = ?').bind(poamId, org.id).first();
  if (!poam) return jsonResponse({ error: 'POA&M not found' }, 404);

  const fields = ['weakness_name', 'weakness_description', 'risk_level', 'status', 'scheduled_completion', 'actual_completion', 'milestones', 'responsible_party', 'resources_required', 'cost_estimate', 'comments'];
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
  await auditLog(env, org.id, user.id, 'update', 'poam', poamId, body);

  const updated = await env.DB.prepare('SELECT * FROM poams WHERE id = ?').bind(poamId).first();
  return jsonResponse({ poam: updated });
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
    `INSERT INTO evidence (id, org_id, title, description, file_name, file_size, file_type, r2_key, sha256_hash, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, title, description, file.name, arrayBuffer.byteLength, file.type, r2Key, sha256, user.id).run();

  await auditLog(env, org.id, user.id, 'upload', 'evidence', id, { file_name: file.name, size: arrayBuffer.byteLength });

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

  // Save SSP document
  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO ssp_documents (id, org_id, system_id, framework_id, title, oscal_json, generated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, system_id, framework_id, `SSP - ${system.name} - ${framework.name}`, JSON.stringify(oscalSSP), user.id).run();

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

// ============================================================================
// RISKS (RiskForge ERM)
// ============================================================================

async function handleListRisks(env, org) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM risks WHERE org_id = ? ORDER BY risk_score DESC, created_at DESC'
  ).bind(org.id).all();
  return jsonResponse({ risks: results });
}

async function handleCreateRisk(request, env, org, user) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const { system_id, title, description, category, likelihood, impact, treatment, treatment_plan, owner } = body;
  if (!title) return jsonResponse({ error: 'Title is required' }, 400);

  const id = generateId();
  const riskId = `RISK-${Date.now().toString(36).toUpperCase()}`;
  const riskLevel = (likelihood || 3) * (impact || 3) >= 15 ? 'critical' : (likelihood || 3) * (impact || 3) >= 10 ? 'high' : (likelihood || 3) * (impact || 3) >= 5 ? 'moderate' : 'low';

  await env.DB.prepare(
    `INSERT INTO risks (id, org_id, system_id, risk_id, title, description, category, likelihood, impact, risk_level, treatment, treatment_plan, owner)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, org.id, system_id || null, riskId, title, description || null, category || 'technical', likelihood || 3, impact || 3, riskLevel, treatment || 'mitigate', treatment_plan || null, owner || null).run();

  await auditLog(env, org.id, user.id, 'create', 'risk', id, { title, risk_level: riskLevel });
  const risk = await env.DB.prepare('SELECT * FROM risks WHERE id = ?').bind(id).first();
  return jsonResponse({ risk }, 201);
}

async function handleUpdateRisk(request, env, org, user, riskId) {
  if (!requireRole(user, 'manager')) return jsonResponse({ error: 'Forbidden' }, 403);
  const body = await request.json();
  const risk = await env.DB.prepare('SELECT * FROM risks WHERE id = ? AND org_id = ?').bind(riskId, org.id).first();
  if (!risk) return jsonResponse({ error: 'Risk not found' }, 404);

  const fields = ['title', 'description', 'category', 'likelihood', 'impact', 'risk_level', 'treatment', 'treatment_plan', 'owner', 'status'];
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
  await auditLog(env, org.id, user.id, 'update', 'risk', riskId, body);

  const updated = await env.DB.prepare('SELECT * FROM risks WHERE id = ?').bind(riskId).first();
  return jsonResponse({ risk: updated });
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
// AUDIT LOG
// ============================================================================

async function handleGetAuditLog(env, url, org) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  const { results } = await env.DB.prepare(
    `SELECT al.*, u.name as user_name, u.email as user_email
     FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
     WHERE al.org_id = ?
     ORDER BY al.created_at DESC LIMIT ? OFFSET ?`
  ).bind(org.id, limit, offset).all();

  const { total } = await env.DB.prepare('SELECT COUNT(*) as total FROM audit_logs WHERE org_id = ?').bind(org.id).first();
  return jsonResponse({ logs: results, total, page, limit });
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
    'SELECT id, email, name, role, onboarding_completed, last_login_at, created_at FROM users WHERE org_id = ? ORDER BY created_at'
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
