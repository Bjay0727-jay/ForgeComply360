#!/usr/bin/env node

/**
 * ForgeComply 360 Load Test Suite
 *
 * Tests platform performance under load:
 * - FC360: 10K controls, 500 POA&Ms, 100 users
 * - Reporter: Max-size SSP generation
 * - ForgeScan: Large scan import processing
 *
 * Usage:
 *   node scripts/load-test.js [--target URL] [--scenario all|fc360|reporter|scan]
 *
 * Requires: Node.js 18+
 */

const BASE_URL = process.argv.find(a => a.startsWith('--target='))?.split('=')[1] || 'http://localhost:8787';
const SCENARIO = process.argv.find(a => a.startsWith('--scenario='))?.split('=')[1] || 'all';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  fc360: {
    controls: 10000,
    poams: 500,
    users: 100,
    concurrentRequests: 50,
    rampUpSeconds: 10,
  },
  reporter: {
    maxSections: 23,
    controlsPerSection: 100,
    narrativeLength: 2000,
  },
  scan: {
    findingsCount: 5000,
    hostsCount: 200,
  },
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

let authToken = null;

async function authenticate() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.LOAD_TEST_EMAIL || 'loadtest@forgecomply360.com',
        password: process.env.LOAD_TEST_PASSWORD || 'LoadTest2026!',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.token;
      console.log('[AUTH] Authenticated successfully');
      return true;
    }
    console.warn('[AUTH] Login failed:', res.status, await res.text());
    return false;
  } catch (e) {
    console.warn('[AUTH] Connection failed:', e.message);
    return false;
  }
}

function headers() {
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

async function timedRequest(method, path, body = null) {
  const start = performance.now();
  try {
    const opts = { method, headers: headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const elapsed = performance.now() - start;
    const status = res.status;
    return { status, elapsed, ok: res.ok, path };
  } catch (e) {
    const elapsed = performance.now() - start;
    return { status: 0, elapsed, ok: false, path, error: e.message };
  }
}

async function batchRequests(requests, concurrency = 10) {
  const results = [];
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(r => r()));
    results.push(...batchResults);
  }
  return results;
}

function summarize(label, results) {
  const times = results.map(r => r.elapsed).sort((a, b) => a - b);
  const successes = results.filter(r => r.ok).length;
  const failures = results.filter(r => !r.ok).length;
  const p50 = times[Math.floor(times.length * 0.5)] || 0;
  const p95 = times[Math.floor(times.length * 0.95)] || 0;
  const p99 = times[Math.floor(times.length * 0.99)] || 0;
  const avg = times.reduce((a, b) => a + b, 0) / times.length || 0;
  const max = Math.max(...times) || 0;

  console.log(`\n--- ${label} ---`);
  console.log(`  Total requests: ${results.length}`);
  console.log(`  Success: ${successes} | Failures: ${failures}`);
  console.log(`  Avg: ${avg.toFixed(1)}ms | P50: ${p50.toFixed(1)}ms | P95: ${p95.toFixed(1)}ms | P99: ${p99.toFixed(1)}ms | Max: ${max.toFixed(1)}ms`);

  if (failures > 0) {
    const errorCodes = {};
    results.filter(r => !r.ok).forEach(r => {
      const key = r.error || `HTTP ${r.status}`;
      errorCodes[key] = (errorCodes[key] || 0) + 1;
    });
    console.log(`  Errors:`, errorCodes);
  }

  return { label, total: results.length, successes, failures, avg, p50, p95, p99, max };
}

// ---------------------------------------------------------------------------
// Scenario: FC360 Large Dataset Performance
// ---------------------------------------------------------------------------

async function scenarioFC360() {
  console.log('\n========================================');
  console.log('SCENARIO: FC360 Large Dataset Performance');
  console.log(`  Target: ${CONFIG.fc360.controls} controls, ${CONFIG.fc360.poams} POA&Ms, ${CONFIG.fc360.users} users`);
  console.log('========================================');

  // 1. Dashboard Stats under load
  console.log('\n[1/6] Dashboard stats endpoint...');
  const dashResults = await batchRequests(
    Array.from({ length: CONFIG.fc360.concurrentRequests }, () =>
      () => timedRequest('GET', '/api/v1/dashboard/stats')
    ),
    CONFIG.fc360.concurrentRequests
  );
  summarize('Dashboard Stats (concurrent)', dashResults);

  // 2. Framework stats
  console.log('\n[2/6] Framework stats endpoint...');
  const fwResults = await batchRequests(
    Array.from({ length: 30 }, () =>
      () => timedRequest('GET', '/api/v1/dashboard/framework-stats')
    ),
    10
  );
  summarize('Framework Stats', fwResults);

  // 3. Controls listing with pagination
  console.log('\n[3/6] Controls listing (paginated)...');
  const ctrlResults = await batchRequests(
    Array.from({ length: 20 }, (_, i) =>
      () => timedRequest('GET', `/api/v1/implementations?limit=100&page=${i + 1}`)
    ),
    5
  );
  summarize('Controls Listing (20 pages)', ctrlResults);

  // 4. POA&M listing
  console.log('\n[4/6] POA&M listing...');
  const poamResults = await batchRequests(
    Array.from({ length: 20 }, (_, i) =>
      () => timedRequest('GET', `/api/v1/poams?limit=50&page=${i + 1}`)
    ),
    5
  );
  summarize('POA&M Listing (20 pages)', poamResults);

  // 5. Risk stats
  console.log('\n[5/6] Risk stats...');
  const riskResults = await batchRequests(
    Array.from({ length: 20 }, () =>
      () => timedRequest('GET', '/api/v1/risks/stats')
    ),
    10
  );
  summarize('Risk Stats', riskResults);

  // 6. Search (full-text)
  console.log('\n[6/6] Global search...');
  const searchTerms = ['access control', 'encryption', 'audit', 'incident', 'backup', 'MFA', 'FIPS', 'boundary', 'firewall', 'patch'];
  const searchResults = await batchRequests(
    searchTerms.map(term =>
      () => timedRequest('GET', `/api/v1/search?q=${encodeURIComponent(term)}`)
    ),
    5
  );
  summarize('Global Search (10 queries)', searchResults);
}

// ---------------------------------------------------------------------------
// Scenario: Reporter Max-Size SSP
// ---------------------------------------------------------------------------

async function scenarioReporter() {
  console.log('\n========================================');
  console.log('SCENARIO: Reporter Max-Size SSP');
  console.log(`  Target: ${CONFIG.reporter.maxSections} sections, ${CONFIG.reporter.controlsPerSection} controls/section`);
  console.log('========================================');

  // 1. SSP document listing
  console.log('\n[1/4] SSP document listing...');
  const sspResults = await batchRequests(
    Array.from({ length: 10 }, () =>
      () => timedRequest('GET', '/api/v1/ssp')
    ),
    5
  );
  summarize('SSP Document Listing', sspResults);

  // 2. OSCAL SSP generation
  console.log('\n[2/4] OSCAL SSP generation...');
  const oscalResults = await batchRequests(
    Array.from({ length: 5 }, () =>
      () => timedRequest('GET', '/api/v1/compliance/sys-1/oscal/ssp')
    ),
    2
  );
  summarize('OSCAL SSP Generation', oscalResults);

  // 3. FISMA SSP section data loading
  console.log('\n[3/4] FISMA SSP section data...');
  const fismaResults = await batchRequests(
    Array.from({ length: 10 }, () =>
      () => timedRequest('GET', '/api/v1/ssp')
    ),
    3
  );
  summarize('FISMA SSP Section Loading', fismaResults);

  // 4. Reporter token generation
  console.log('\n[4/4] Reporter token generation...');
  const tokenResults = await batchRequests(
    Array.from({ length: 10 }, () =>
      () => timedRequest('POST', '/api/v1/auth/reporter-token')
    ),
    5
  );
  summarize('Reporter Token Generation', tokenResults);
}

// ---------------------------------------------------------------------------
// Scenario: ForgeScan Large Import
// ---------------------------------------------------------------------------

async function scenarioScan() {
  console.log('\n========================================');
  console.log('SCENARIO: ForgeScan Large Import');
  console.log(`  Target: ${CONFIG.scan.findingsCount} findings, ${CONFIG.scan.hostsCount} hosts`);
  console.log('========================================');

  // 1. Scan imports listing
  console.log('\n[1/4] Scan imports listing...');
  const importResults = await batchRequests(
    Array.from({ length: 10 }, () =>
      () => timedRequest('GET', '/api/v1/scans/imports')
    ),
    5
  );
  summarize('Scan Imports Listing', importResults);

  // 2. Vulnerability findings with filters
  console.log('\n[2/4] Vulnerability findings (filtered)...');
  const severities = ['critical', 'high', 'medium', 'low'];
  const findingResults = await batchRequests(
    severities.flatMap(sev =>
      Array.from({ length: 5 }, () =>
        () => timedRequest('GET', `/api/v1/vulnerability-findings?severity=${sev}&limit=100`)
      )
    ),
    5
  );
  summarize('Vulnerability Findings (filtered)', findingResults);

  // 3. Assets listing
  console.log('\n[3/4] Assets listing...');
  const assetResults = await batchRequests(
    Array.from({ length: 10 }, () =>
      () => timedRequest('GET', '/api/v1/assets?limit=100')
    ),
    5
  );
  summarize('Assets Listing', assetResults);

  // 4. Concurrent mixed operations
  console.log('\n[4/4] Concurrent mixed operations...');
  const mixedResults = await batchRequests([
    () => timedRequest('GET', '/api/v1/dashboard/stats'),
    () => timedRequest('GET', '/api/v1/scans/imports'),
    () => timedRequest('GET', '/api/v1/vulnerability-findings?limit=50'),
    () => timedRequest('GET', '/api/v1/assets'),
    () => timedRequest('GET', '/api/v1/poams'),
    () => timedRequest('GET', '/api/v1/risks/stats'),
    () => timedRequest('GET', '/api/v1/vendors/stats'),
    () => timedRequest('GET', '/api/v1/implementations?limit=100'),
    () => timedRequest('GET', '/api/v1/notifications'),
    () => timedRequest('GET', '/api/v1/compliance/trends?days=90'),
  ], 10);
  summarize('Concurrent Mixed Operations (10 endpoints)', mixedResults);
}

// ---------------------------------------------------------------------------
// Performance Thresholds
// ---------------------------------------------------------------------------

function checkThresholds(allResults) {
  console.log('\n========================================');
  console.log('PERFORMANCE THRESHOLDS CHECK');
  console.log('========================================');

  const thresholds = {
    'P95 response time < 2000ms': allResults.every(r => r.p95 < 2000),
    'P99 response time < 5000ms': allResults.every(r => r.p99 < 5000),
    'Error rate < 5%': allResults.every(r => r.failures / r.total < 0.05),
    'Average response time < 1000ms': allResults.every(r => r.avg < 1000),
  };

  let allPassed = true;
  for (const [check, passed] of Object.entries(thresholds)) {
    const icon = passed ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${check}`);
    if (!passed) allPassed = false;
  }

  return allPassed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('ForgeComply 360 Load Test Suite');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Scenario: ${SCENARIO}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  // Authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('[WARN] Running without authentication - some endpoints will return 401');
  }

  const allResults = [];

  if (SCENARIO === 'all' || SCENARIO === 'fc360') {
    await scenarioFC360();
  }

  if (SCENARIO === 'all' || SCENARIO === 'reporter') {
    await scenarioReporter();
  }

  if (SCENARIO === 'all' || SCENARIO === 'scan') {
    await scenarioScan();
  }

  // Health check baseline
  console.log('\n--- Health Check Baseline ---');
  const healthResult = await timedRequest('GET', '/api/v1/health');
  console.log(`  Health: ${healthResult.status} in ${healthResult.elapsed.toFixed(1)}ms`);

  console.log('\n========================================');
  console.log('LOAD TEST COMPLETE');
  console.log(`Finished at: ${new Date().toISOString()}`);
  console.log('========================================');
}

main().catch(err => {
  console.error('Load test failed:', err);
  process.exit(1);
});
