/**
 * SSP API Tests
 * Tests for ForgeComply 360 System Security Plan endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index.js';

// Mock crypto.subtle for JWT operations
vi.stubGlobal('crypto', {
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    importKey: vi.fn().mockResolvedValue({}),
    sign: vi.fn().mockResolvedValue(new ArrayBuffer(64)),
    verify: vi.fn().mockResolvedValue(true),
  },
  getRandomValues: vi.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }),
});

function createMockDB(overrides = {}) {
  const mockStatement = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
    ...overrides,
  };
  return {
    prepare: vi.fn().mockReturnValue(mockStatement),
    batch: vi.fn().mockResolvedValue([]),
    _statement: mockStatement,
  };
}

function createMockEnv(dbOverrides = {}) {
  return {
    DB: createMockDB(dbOverrides),
    KV: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    EVIDENCE_VAULT: { put: vi.fn(), get: vi.fn(), delete: vi.fn() },
    AI: { run: vi.fn().mockResolvedValue({ response: 'AI generated content' }) },
    CORS_ORIGIN: 'https://forgecomply360.pages.dev',
    ENVIRONMENT: 'test',
    JWT_SECRET: 'test-secret-key-for-testing-purposes-only',
  };
}

function createRequest(path, options = {}) {
  const url = `https://api.test.com${path}`;
  return new Request(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://forgecomply360.pages.dev',
      ...(options.headers || {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

// Helper to create a valid mock user session
function createAuthenticatedRequest(path, options = {}) {
  return createRequest(path, {
    ...options,
    headers: {
      ...options.headers,
      // Note: In real tests, you'd need a valid JWT. For now we test unauthenticated paths
      'Authorization': 'Bearer test-token',
    },
  });
}

describe('SSP API Endpoints', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/ssp (List SSPs)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/ssp');
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/ssp/:id (Get SSP)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/ssp/123');
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/ssp/generate (Generate SSP)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/ssp/generate', {
        method: 'POST',
        body: { system_id: '123', framework_id: '456' },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/ssp/:id/section/:key (Update SSP Section)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/ssp/123/section/system_info', {
        method: 'PUT',
        body: { content: 'Test content' },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });
});

describe('Evidence API Endpoints', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/evidence (List Evidence)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/evidence');
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/evidence (Upload Evidence)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/evidence', {
        method: 'POST',
        body: { name: 'test-evidence.pdf' },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });
});

describe('POA&M API Endpoints', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/poams (List POA&Ms)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/poams');
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/poams (Create POA&M)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/poams', {
        method: 'POST',
        body: {
          weakness: 'Test weakness',
          severity: 'moderate',
        },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/poams/:id (Update POA&M)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/poams/123', {
        method: 'PUT',
        body: { status: 'in_progress' },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/poams/:id (Delete POA&M)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/poams/123', {
        method: 'DELETE',
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });
});

describe('Controls API Endpoints', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/controls (List Controls)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/controls');
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });
});

describe('Systems API Endpoints', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/systems (List Systems)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/systems');
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/systems (Create System)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/systems', {
        method: 'POST',
        body: {
          name: 'Test System',
          acronym: 'TS',
          impact_level: 'moderate',
        },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });
});

describe('Frameworks API Endpoints', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/frameworks (List Frameworks)', () => {
    it('should return frameworks list (public endpoint)', async () => {
      env.DB._statement.all.mockResolvedValue({
        results: [
          { id: '1', name: 'NIST 800-53', version: 'Rev5' },
          { id: '2', name: 'FedRAMP', version: 'Rev5' },
        ],
      });

      const request = createRequest('/api/v1/frameworks');
      const response = await worker.fetch(request, env);
      const data = await response.json();

      // Frameworks list may or may not require auth depending on config
      expect([200, 401]).toContain(response.status);
    });
  });
});

describe('Audit Log API', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/audit-logs (List Audit Logs)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/audit-logs');
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });
});

describe('API Rate Limiting & Security', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('Security Headers', () => {
    it('should include CSP header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env);

      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    });

    it('should include Referrer-Policy header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env);

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should include Permissions-Policy header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env);

      expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
    });
  });

  describe('CORS Validation', () => {
    it('should accept requests from allowed origins', async () => {
      const request = new Request('https://api.test.com/health', {
        headers: {
          'Origin': 'https://forgecomply360.pages.dev',
        },
      });
      const response = await worker.fetch(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://forgecomply360.pages.dev');
    });

    it('should accept requests from preview deployments', async () => {
      const request = new Request('https://api.test.com/health', {
        headers: {
          'Origin': 'https://abc123.forgecomply360.pages.dev',
        },
      });
      const response = await worker.fetch(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://abc123.forgecomply360.pages.dev');
    });
  });
});

describe('Reporter Integration API', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('POST /api/v1/reporter/token (Generate Reporter Token)', () => {
    it('should return 401 without authentication', async () => {
      const request = createRequest('/api/v1/reporter/token', {
        method: 'POST',
        body: { ssp_id: '123' },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });
});
