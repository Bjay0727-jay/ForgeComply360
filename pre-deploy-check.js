#!/usr/bin/env node
/**
 * ForgeComply 360 — Pre-Deploy Validation
 * 
 * Runs before every deployment to catch configuration issues.
 * Addresses: Critical (DB ID), H-3 (registration), H-5 (CORS), M-1 (OSCAL)
 *
 * Usage:
 *   node scripts/pre-deploy-check.js                  # defaults to production
 *   node scripts/pre-deploy-check.js --env staging
 *   node scripts/pre-deploy-check.js --env production --strict
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Expected values (single source of truth)
// ============================================================================

const EXPECTED = {
  production: {
    database_id: '73faffec-f001-44bc-880e-62bd932c25b1',
    database_name: 'forge-comply360-db',
    stale_db_ids: ['fe250bed-40a9-443a-a6c7-4b59bf8a0dac'],
    cors_must_not_contain: 'forgecomply360.pages.dev',
  },
  staging: {
    database_id: '094aa4dd-5c79-456e-a2cb-d43f08f677e5',
    database_name: 'forge-comply360-db-demo',
    stale_db_ids: ['fe250bed-40a9-443a-a6c7-4b59bf8a0dac'],
  },
};

// ============================================================================
// Parse args
// ============================================================================

const args = process.argv.slice(2);
let envName = 'production';
let strict = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--env' && args[i + 1]) { envName = args[i + 1]; i++; }
  if (args[i] === '--strict') strict = true;
}

const expected = EXPECTED[envName];
if (!expected) {
  console.error(`Unknown environment: ${envName}`);
  process.exit(1);
}

// ============================================================================
// Checks
// ============================================================================

let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, condition, isWarning = false) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else if (isWarning) {
    console.log(`  ⚠️  ${name}`);
    warnings++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

console.log(`ForgeComply 360 — Pre-Deploy Check (${envName})`);
console.log('='.repeat(55));
console.log('');

// ---------- 1. wrangler.toml exists ----------
console.log('📄 Configuration Files:');

const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
const wranglerExists = fs.existsSync(wranglerPath);
check('wrangler.toml exists', wranglerExists);

if (wranglerExists) {
  const wrangler = fs.readFileSync(wranglerPath, 'utf8');

  // ---------- 2. Database ID ----------
  console.log('');
  console.log('🗄️  Database Configuration:');

  check(`Database ID matches ${envName} (${expected.database_id.slice(0, 8)}...)`,
    wrangler.includes(expected.database_id));

  for (const staleId of expected.stale_db_ids) {
    check(`No stale DB reference (${staleId.slice(0, 8)}...)`,
      !wrangler.includes(staleId));
  }

  // ---------- 3. CORS ----------
  console.log('');
  console.log('🌐 CORS Configuration:');

  if (envName === 'production' && expected.cors_must_not_contain) {
    const corsLine = wrangler.split('\n').find(l =>
      l.includes('CORS_ORIGIN') && !l.includes('PATTERN') && !l.startsWith('#'));
    if (corsLine) {
      check('CORS_ORIGIN not set to Pages default domain (H-5)',
        !corsLine.includes(expected.cors_must_not_contain), !strict);
    } else {
      check('CORS_ORIGIN is defined', false, true);
    }
  } else {
    check('CORS check (skipped for non-production)', true);
  }

  // ---------- 4. Registration gate ----------
  console.log('');
  console.log('🔐 Security Configuration:');

  const hasInviteCode = wrangler.includes('REGISTRATION_INVITE_CODE');
  check('Registration invite code configured (H-3)', hasInviteCode);

  if (hasInviteCode && envName === 'production') {
    const inviteLine = wrangler.split('\n').find(l =>
      l.includes('REGISTRATION_INVITE_CODE') && !l.startsWith('#'));
    const isEmpty = inviteLine && (inviteLine.includes('""') || inviteLine.includes("''"));
    check('Invite code is NOT empty in production', !isEmpty);
  }
}

// ---------- 5. Source files ----------
console.log('');
console.log('📦 Source Files:');

const workerEntry = ['src/index.js', 'src/index.ts', 'workers/index.js']
  .find(f => fs.existsSync(path.join(process.cwd(), f)));
check('Worker entry point found', !!workerEntry);
if (workerEntry) {
  const workerSize = fs.statSync(path.join(process.cwd(), workerEntry)).size;
  const lines = fs.readFileSync(path.join(process.cwd(), workerEntry), 'utf8').split('\n').length;
  check(`Worker file size reasonable (${lines} lines)`, lines < 20000, lines > 10000);
}

// Check OSCAL validator is present
const validatorPaths = ['workers/oscal-validator.js', 'src/oscal-validator.js', 'src/utils/oscal-validator.js'];
const hasValidator = validatorPaths.some(p => fs.existsSync(path.join(process.cwd(), p)));
check('OSCAL validator module present (M-1)', hasValidator, true);

// ---------- 6. Package.json checks ----------
console.log('');
console.log('📋 Package Configuration:');

const pkgPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  check('package.json has test script', !!pkg.scripts?.test, true);
  check('package.json has deploy script', !!pkg.scripts?.deploy, true);

  // Check for wrangler in devDependencies
  const hasWrangler = pkg.devDependencies?.wrangler || pkg.dependencies?.wrangler;
  check('wrangler is in dependencies', !!hasWrangler, true);
} else {
  check('package.json exists', false, true);
}

// ---------- 7. GitHub Actions ----------
console.log('');
console.log('🔄 CI/CD Pipeline:');

const ghWorkflowDir = path.join(process.cwd(), '.github', 'workflows');
const hasWorkflows = fs.existsSync(ghWorkflowDir);
check('GitHub Actions workflows directory exists', hasWorkflows, true);

if (hasWorkflows) {
  const workflows = fs.readdirSync(ghWorkflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  check(`Workflow files found (${workflows.length})`, workflows.length > 0, true);

  // Check if any workflow has npm audit
  for (const wf of workflows) {
    const content = fs.readFileSync(path.join(ghWorkflowDir, wf), 'utf8');
    if (content.includes('npm audit')) {
      check('npm audit step in CI (H-4)', true);
      break;
    }
  }
}

// ---------- 8. Migration files ----------
console.log('');
console.log('📊 Database Migrations:');

const migrationsDir = path.join(process.cwd(), 'database');
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => f.startsWith('migrate-') && f.endsWith('.sql'));
  check(`Migration files found (${migrations.length})`, migrations.length > 0, true);

  // Check for semicolons in string literals (Wrangler bug #2366)
  let semicolonIssues = 0;
  for (const mf of migrations) {
    const content = fs.readFileSync(path.join(migrationsDir, mf), 'utf8');
    const values = content.match(/VALUES \([^)]+\)/g) || [];
    for (const v of values) {
      const strings = v.match(/'[^']*'/g) || [];
      for (const s of strings) {
        if (s.includes(';')) semicolonIssues++;
      }
    }
  }
  check('No semicolons in migration string literals', semicolonIssues === 0);
} else {
  check('database/ directory exists', false, true);
}

// ---------- Summary ----------
console.log('');
console.log('='.repeat(55));
console.log(`Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
console.log('');

if (failed > 0) {
  console.log('❌ Pre-deploy check FAILED — do not deploy until issues are resolved.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Pre-deploy check PASSED with warnings — review before deploying.');
  process.exit(strict ? 1 : 0);
} else {
  console.log('✅ All pre-deploy checks passed.');
  process.exit(0);
}
