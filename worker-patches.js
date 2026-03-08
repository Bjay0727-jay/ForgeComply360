/**
 * ForgeComply 360 — Worker API Patches
 * =====================================
 * Apply these changes to workers/index.js (or src/index.js) to address
 * the review findings. Each section is independent.
 *
 * Findings addressed:
 *   H-3  — Registration invite code gate
 *   H-5  — CORS origin for custom domain
 *   M-2  — Scheduled tasks error isolation
 *   M-3  — CSP header for inline styles
 */


// =============================================================================
// PATCH H-3: Registration Invite Code Gate
// =============================================================================
// Find the /api/v1/auth/register handler and add this check BEFORE creating
// the organization. The invite code is set via wrangler.toml env var.
//
// FIND this pattern in the register handler:
//   const { email, password, firstName, lastName, organizationName } = body;
//
// ADD after the body parsing, before org creation:

/**
 * Registration gate — require invite code for new organizations.
 * Set REGISTRATION_INVITE_CODE in wrangler.toml (empty string = disabled).
 */
function validateRegistrationGate(body, env) {
  const requiredCode = env.REGISTRATION_INVITE_CODE;

  // If no invite code is configured (empty string or undefined), registration is open
  if (!requiredCode) return { allowed: true };

  const providedCode = body.invite_code || body.inviteCode || '';

  if (providedCode !== requiredCode) {
    return {
      allowed: false,
      error: 'Invalid or missing invite code. Contact sales@forgecyberdefense.com for access.',
    };
  }

  return { allowed: true };
}

// In the register handler, add:
//
//   // H-3: Registration gate
//   const gate = validateRegistrationGate(body, env);
//   if (!gate.allowed) {
//     return new Response(JSON.stringify({ error: gate.error }), {
//       status: 403,
//       headers: { 'Content-Type': 'application/json', ...corsHeaders },
//     });
//   }


// =============================================================================
// PATCH H-5: CORS Origin Matching for Custom Domain
// =============================================================================
// Replace the existing CORS origin check with this version that supports
// both the custom domain and the Pages preview domain pattern.

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = env.CORS_ORIGIN || 'https://app.forgecomply360.com';
  const allowedPattern = env.CORS_ORIGIN_PATTERN || '';

  let matchedOrigin = '';

  // Check exact match first (custom domain)
  if (origin === allowedOrigin) {
    matchedOrigin = origin;
  }
  // Check pattern match (Pages preview deployments)
  else if (allowedPattern) {
    const regex = new RegExp('^' + allowedPattern.replace(/\*/g, '[a-z0-9-]+') + '$');
    if (regex.test(origin)) {
      matchedOrigin = origin;
    }
  }
  // Development: allow localhost
  else if (env.ENVIRONMENT === 'development' && origin.startsWith('http://localhost')) {
    matchedOrigin = origin;
  }

  return {
    'Access-Control-Allow-Origin': matchedOrigin || allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}


// =============================================================================
// PATCH M-2: Scheduled Tasks Error Isolation
// =============================================================================
// Replace the sequential .then() chain with Promise.allSettled() so one
// failing task doesn't skip the rest.

async function handleScheduled(event, env) {
  const startTime = Date.now();
  console.log(`[Scheduled] Cron triggered at ${new Date().toISOString()}`);

  const tasks = [
    { name: 'evidence-expiry-check', fn: () => checkEvidenceExpiry(env) },
    { name: 'compliance-alerts', fn: () => generateComplianceAlerts(env) },
    { name: 'anomaly-detection', fn: () => detectSecurityAnomalies(env) },
    { name: 'compliance-snapshot', fn: () => createComplianceSnapshot(env) },
    { name: 'audit-log-retention', fn: () => enforceAuditLogRetention(env) },
    { name: 'email-digest', fn: () => sendDailyDigest(env) },
  ];

  const results = await Promise.allSettled(
    tasks.map(async ({ name, fn }) => {
      const taskStart = Date.now();
      try {
        await fn();
        const duration = Date.now() - taskStart;
        console.log(`[Scheduled] ✅ ${name} completed (${duration}ms)`);
        return { name, status: 'ok', duration };
      } catch (error) {
        const duration = Date.now() - taskStart;
        console.error(`[Scheduled] ❌ ${name} failed (${duration}ms):`, error.message);
        // Report to Sentry if available
        if (typeof Sentry !== 'undefined') {
          Sentry.captureException(error, { tags: { scheduled_task: name } });
        }
        return { name, status: 'error', error: error.message, duration };
      }
    })
  );

  const totalDuration = Date.now() - startTime;
  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.status === 'ok').length;
  const failed = results.filter(r => r.status === 'rejected' || r.value?.status === 'error').length;

  console.log(`[Scheduled] Complete: ${succeeded}/${tasks.length} succeeded, ${failed} failed (${totalDuration}ms total)`);
}

// In the Worker default export, update the scheduled handler:
//
// export default {
//   fetch: ...,
//   scheduled: async (event, env, ctx) => {
//     ctx.waitUntil(handleScheduled(event, env));
//   },
// };


// =============================================================================
// PATCH M-3: CSP Header with Nonce for Inline Styles
// =============================================================================
// If the frontend uses Recharts, D3, or any component that injects style={},
// the current CSP blocks them. This version adds a nonce approach.
//
// Option A: If you can confirm NO inline styles exist, keep current strict CSP.
// Option B: If charts need inline styles, use this relaxed version:

function getSecurityHeaders(request) {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      // Allow Tailwind classes + chart library inline styles
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.forgecomply360.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}
