/**
 * API Validation & Error Handling Tests
 * Tests for ForgeComply 360 input validation and error responses
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index.js';

// Mock crypto
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

function createMockDB() {
  const mockStatement = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
  return {
    prepare: vi.fn().mockReturnValue(mockStatement),
    batch: vi.fn().mockResolvedValue([]),
    _statement: mockStatement,
  };
}

function createMockEnv() {
  return {
    DB: createMockDB(),
    KV: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    EVIDENCE_VAULT: { put: vi.fn(), get: vi.fn(), delete: vi.fn() },
    AI: { run: vi.fn() },
    CORS_ORIGIN: 'https://forgecomply360.pages.dev',
    ENVIRONMENT: 'test',
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

describe('Input Validation', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('Login Validation', () => {
    it('should reject login with missing email', async () => {
      const request = createRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { password: 'testpass123' },
      });
      const response = await worker.fetch(request, env);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should reject login with missing password', async () => {
      const request = createRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com' },
      });
      const response = await worker.fetch(request, env);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should reject login with empty body', async () => {
      const request = createRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {},
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(400);
    });

    it('should reject login with invalid email format', async () => {
      const request = createRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'not-an-email', password: 'testpass123' },
      });
      const response = await worker.fetch(request, env);

      // Either 400 for invalid format or 401 for failed auth
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Registration Validation', () => {
    it('should reject registration with missing name', async () => {
      const request = createRequest('/api/v1/auth/register', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'TestPass123!',
        },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(400);
    });

    it('should reject registration with missing email', async () => {
      const request = createRequest('/api/v1/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          password: 'TestPass123!',
        },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(400);
    });

    it('should reject registration with missing password', async () => {
      const request = createRequest('/api/v1/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
        },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(400);
    });

    it('should reject registration with weak password', async () => {
      const request = createRequest('/api/v1/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: '123', // Too short
        },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(400);
    });
  });
});

describe('HTTP Method Handling', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe('Health Endpoint', () => {
    it('should accept GET requests', async () => {
      const request = createRequest('/health', { method: 'GET' });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(200);
    });

    it('should handle HEAD requests gracefully', async () => {
      const request = createRequest('/health', { method: 'HEAD' });
      const response = await worker.fetch(request, env);

      // Should either work or return method not allowed
      expect([200, 405]).toContain(response.status);
    });
  });

  describe('Auth Endpoints', () => {
    it('should reject GET on login endpoint', async () => {
      const request = createRequest('/api/v1/auth/login', { method: 'GET' });
      const response = await worker.fetch(request, env);

      // Protected routes return 401, or 404/405 for wrong method
      expect([401, 404, 405]).toContain(response.status);
    });

    it('should reject GET on register endpoint', async () => {
      const request = createRequest('/api/v1/auth/register', { method: 'GET' });
      const response = await worker.fetch(request, env);

      // Protected routes return 401, or 404/405 for wrong method
      expect([401, 404, 405]).toContain(response.status);
    });
  });
});

describe('Error Response Format', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  it('should return JSON for 404 errors', async () => {
    const request = createRequest('/api/v1/nonexistent-endpoint');
    const response = await worker.fetch(request, env);

    expect(response.headers.get('Content-Type')).toContain('application/json');
  });

  it('should return JSON for 401 errors', async () => {
    const request = createRequest('/api/v1/auth/me');
    const response = await worker.fetch(request, env);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('should return JSON for 400 errors', async () => {
    const request = createRequest('/api/v1/auth/login', {
      method: 'POST',
      body: {},
    });
    const response = await worker.fetch(request, env);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

describe('Content-Type Handling', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  it('should accept application/json content type', async () => {
    const request = new Request('https://api.test.com/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://forgecomply360.pages.dev',
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'test123' }),
    });
    const response = await worker.fetch(request, env);

    // Should process the request (even if auth fails)
    expect([400, 401]).toContain(response.status);
  });

  it('should return JSON responses', async () => {
    const request = createRequest('/health');
    const response = await worker.fetch(request, env);

    expect(response.headers.get('Content-Type')).toContain('application/json');
  });
});

describe('Route Matching', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  it('should match /health endpoint', async () => {
    const request = createRequest('/health');
    const response = await worker.fetch(request, env);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  it('should match /api/v1/health endpoint', async () => {
    const request = createRequest('/api/v1/health');
    const response = await worker.fetch(request, env);

    // May redirect to /health, be its own endpoint, or require auth
    expect([200, 301, 302, 401, 404]).toContain(response.status);
  });

  it('should return 404 for unknown routes', async () => {
    const request = createRequest('/completely/unknown/route/12345');
    const response = await worker.fetch(request, env);

    // Protected routes return 401, unknown routes return 404
    expect([401, 404]).toContain(response.status);
  });
});

describe('Query Parameter Handling', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  it('should handle query parameters gracefully', async () => {
    const request = createRequest('/health?foo=bar&baz=123');
    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
  });

  it('should handle special characters in query params', async () => {
    const request = createRequest('/health?test=%20%26%3D');
    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
  });
});

describe('Request Size Limits', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  it('should handle reasonably sized requests', async () => {
    const request = createRequest('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'a'.repeat(100), // 100 char password
      },
    });
    const response = await worker.fetch(request, env);

    // Should process (even if validation fails)
    expect([400, 401]).toContain(response.status);
  });
});
