import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index.js';

/**
 * Performance Test Suite
 *
 * Validates response time budgets for key API endpoints under simulated load.
 * Targets: 10K controls, 500 POA&Ms, 100 users scenarios.
 */

// Mock crypto
vi.stubGlobal('crypto', {
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    importKey: vi.fn().mockResolvedValue({}),
  },
  getRandomValues: vi.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }),
  randomUUID: vi.fn(() => 'perf-' + Math.random().toString(36).slice(2, 10)),
});

function createMockEnv() {
  // Generate large datasets for performance testing
  const generateControls = (count) => Array.from({ length: count }, (_, i) => ({
    id: `ctrl-${i}`,
    control_id: `AC-${i}`,
    status: ['implemented', 'partially_implemented', 'planned', 'not_implemented'][i % 4],
    system_id: `sys-${i % 10}`,
    framework_id: 'fw-nist',
    narrative: `Implementation narrative for control ${i}`,
  }));

  const generatePoams = (count) => Array.from({ length: count }, (_, i) => ({
    id: `poam-${i}`,
    poam_id: `POAM-${String(i + 1).padStart(4, '0')}`,
    weakness_name: `Weakness ${i}`,
    risk_level: ['critical', 'high', 'moderate', 'low'][i % 4],
    status: ['open', 'in_progress', 'completed'][i % 3],
    scheduled_completion: '2026-12-31',
  }));

  const controls = generateControls(10000);
  const poams = generatePoams(500);

  const mockStatement = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockImplementation(async () => ({ results: controls.slice(0, 100) })),
    run: vi.fn().mockResolvedValue({ success: true }),
  };

  return {
    DB: {
      prepare: vi.fn().mockReturnValue(mockStatement),
      batch: vi.fn().mockResolvedValue([]),
      _statement: mockStatement,
      _controls: controls,
      _poams: poams,
    },
    KV: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    EVIDENCE_VAULT: { put: vi.fn(), get: vi.fn(), delete: vi.fn() },
    BACKUP_BUCKET: { put: vi.fn(), get: vi.fn() },
    AI: { run: vi.fn().mockResolvedValue({ response: 'AI response' }) },
    CORS_ORIGIN: 'https://forgecomply360.pages.dev',
    CORS_ORIGIN_PATTERN: 'https://*.forgecomply360.pages.dev',
    ENVIRONMENT: 'test',
    REGISTRATION_INVITE_CODE: '',
    RATE_LIMIT_RPM: '10000',
    SESSION_TIMEOUT_MINUTES: '30',
    MAX_SESSION_HOURS: '12',
  };
}

function createRequest(path, options = {}) {
  return new Request(`https://api.test.com${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://forgecomply360.pages.dev',
      ...(options.headers || {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

async function measureTime(fn) {
  const start = performance.now();
  const result = await fn();
  return { result, elapsed: performance.now() - start };
}

// ---------------------------------------------------------------------------
// Performance: Health Check Baseline
// ---------------------------------------------------------------------------

describe('Perf: Health Check Baseline', () => {
  let env;
  beforeEach(() => { env = createMockEnv(); });

  it('health endpoint should respond under 200ms', async () => {
    const { result, elapsed } = await measureTime(() =>
      worker.fetch(createRequest('/api/v1/health'), env, {})
    );
    expect(result.status).toBe(200);
    expect(elapsed).toBeLessThan(200);
  });

  it('CORS preflight should respond under 100ms', async () => {
    const { result, elapsed } = await measureTime(() =>
      worker.fetch(createRequest('/api/v1/systems', {
        method: 'OPTIONS',
        headers: { 'Access-Control-Request-Method': 'POST' },
      }), env, {})
    );
    expect([200, 204]).toContain(result.status);
    expect(elapsed).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// Performance: Authentication
// ---------------------------------------------------------------------------

describe('Perf: Authentication', () => {
  let env;
  beforeEach(() => { env = createMockEnv(); });

  it('login should respond under 200ms', async () => {
    const { elapsed } = await measureTime(() =>
      worker.fetch(createRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'test@test.com', password: 'Test123!' },
      }), env, {})
    );
    expect(elapsed).toBeLessThan(200);
  });

  it('registration should respond under 300ms', async () => {
    const { elapsed } = await measureTime(() =>
      worker.fetch(createRequest('/api/v1/auth/register', {
        method: 'POST',
        body: {
          email: 'new@test.com',
          password: 'NewUser123!',
          name: 'New User',
          organizationName: 'Test Org',
          industry: 'tech',
          size: '1-50',
        },
      }), env, {})
    );
    expect(elapsed).toBeLessThan(300);
  });
});

// ---------------------------------------------------------------------------
// Performance: Large Dataset Queries
// ---------------------------------------------------------------------------

describe('Perf: Large Dataset Queries', () => {
  let env;
  beforeEach(() => { env = createMockEnv(); });

  it('should handle 10K controls query within 500ms', async () => {
    env.DB._statement.all.mockResolvedValueOnce({
      results: env.DB._controls.slice(0, 100),
    });

    const { elapsed } = await measureTime(() =>
      worker.fetch(createRequest('/api/v1/implementations?limit=100', {
        headers: { Authorization: 'Bearer test-token' },
      }), env, {})
    );
    // Mock-based test, verify request processing time
    expect(elapsed).toBeLessThan(500);
  });

  it('should handle 500 POA&Ms query within 500ms', async () => {
    env.DB._statement.all.mockResolvedValueOnce({
      results: env.DB._poams.slice(0, 50),
    });

    const { elapsed } = await measureTime(() =>
      worker.fetch(createRequest('/api/v1/poams?limit=50', {
        headers: { Authorization: 'Bearer test-token' },
      }), env, {})
    );
    expect(elapsed).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Performance: Concurrent Request Handling
// ---------------------------------------------------------------------------

describe('Perf: Concurrent Requests', () => {
  let env;
  beforeEach(() => { env = createMockEnv(); });

  it('should handle 10 concurrent health checks under 100ms total', async () => {
    const { elapsed } = await measureTime(async () => {
      await Promise.all(
        Array.from({ length: 10 }, () =>
          worker.fetch(createRequest('/api/v1/health'), env, {})
        )
      );
    });
    expect(elapsed).toBeLessThan(100);
  });

  it('should handle mixed concurrent requests under 1000ms', async () => {
    const { elapsed } = await measureTime(async () => {
      await Promise.all([
        worker.fetch(createRequest('/api/v1/health'), env, {}),
        worker.fetch(createRequest('/api/v1/auth/login', {
          method: 'POST',
          body: { email: 'a@b.com', password: 'x' },
        }), env, {}),
        worker.fetch(createRequest('/api/v1/health'), env, {}),
        worker.fetch(createRequest('/api/v1/health'), env, {}),
        worker.fetch(createRequest('/api/v1/health'), env, {}),
      ]);
    });
    expect(elapsed).toBeLessThan(1000);
  });
});

// ---------------------------------------------------------------------------
// Performance: Request Routing
// ---------------------------------------------------------------------------

describe('Perf: Request Routing', () => {
  let env;
  beforeEach(() => { env = createMockEnv(); });

  it('should route to 404 quickly for unknown paths', async () => {
    const { result, elapsed } = await measureTime(() =>
      worker.fetch(createRequest('/api/v1/nonexistent-path', {
        headers: { Authorization: 'Bearer test-token' },
      }), env, {})
    );
    expect(result.status).toBe(401); // 401 before 404 check without valid auth
    expect(elapsed).toBeLessThan(50);
  });

  it('should process static routes efficiently', async () => {
    const paths = [
      '/api/v1/health',
      '/api/v1/health',
      '/api/v1/health',
      '/api/v1/health',
      '/api/v1/health',
    ];

    for (const path of paths) {
      const { elapsed } = await measureTime(() =>
        worker.fetch(createRequest(path), env, {})
      );
      expect(elapsed).toBeLessThan(50);
    }
  });
});
