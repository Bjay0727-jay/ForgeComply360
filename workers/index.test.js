import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index.js';

// Mock crypto.subtle for password hashing
const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32));
const mockDeriveBits = vi.fn().mockResolvedValue(new ArrayBuffer(32));
const mockImportKey = vi.fn().mockResolvedValue({});

vi.stubGlobal('crypto', {
  subtle: {
    digest: mockDigest,
    deriveBits: mockDeriveBits,
    importKey: mockImportKey,
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
      ...(options.headers || {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

describe('Worker API', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
    vi.restoreAllMocks();
  });

  describe('CORS', () => {
    it('handles OPTIONS preflight request', async () => {
      const request = createRequest('/api/v1/health', { method: 'OPTIONS' });
      const response = await worker.fetch(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://forgecomply360.pages.dev');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('adds CORS headers to all responses', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://forgecomply360.pages.dev');
    });
  });

  describe('Security Headers', () => {
    it('adds security headers to responses', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=');
    });
  });

  describe('Health Check', () => {
    it('returns health status', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.version).toBe('5.0.0');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('returns 401 for protected routes without token', async () => {
      const request = createRequest('/api/v1/auth/me');
      const response = await worker.fetch(request, env);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('rejects login with missing credentials', async () => {
      const request = createRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'test@test.com' },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(400);
    });

    it('rejects login with invalid credentials (user not found)', async () => {
      env.DB._statement.first.mockResolvedValue(null);

      const request = createRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'nonexistent@test.com', password: 'wrong' },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(401);
    });

    it('rejects registration with missing fields', async () => {
      const request = createRequest('/api/v1/auth/register', {
        method: 'POST',
        body: { email: 'test@test.com' },
      });
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(400);
    });
  });
});
