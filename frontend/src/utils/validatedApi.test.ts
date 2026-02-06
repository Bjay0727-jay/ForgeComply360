import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// Mock the api module
vi.mock('./api', () => ({
  api: vi.fn(),
  onApiError: vi.fn(),
}));

import { api } from './api';
import { validatedApi, validatedApiExtract, ValidationError, isValidationError } from './validatedApi';

const mockApi = vi.mocked(api);

describe('validatedApi', () => {
  beforeEach(() => {
    mockApi.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns validated data when schema passes', async () => {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
    });
    mockApi.mockResolvedValueOnce({ id: '123', name: 'Test' });

    const result = await validatedApi('/api/test', schema);

    expect(result).toEqual({ id: '123', name: 'Test' });
    expect(mockApi).toHaveBeenCalledWith('/api/test', {});
  });

  it('applies schema defaults for missing optional fields', async () => {
    const schema = z.object({
      id: z.string(),
      count: z.number().default(0),
      active: z.boolean().default(true),
    });
    mockApi.mockResolvedValueOnce({ id: '123' });

    const result = await validatedApi('/api/test', schema);

    expect(result).toEqual({ id: '123', count: 0, active: true });
  });

  it('logs warning when validation fails but recovers with defaults', async () => {
    // Schema with required field that has wrong type, but object has default
    const schema = z.object({
      data: z.object({
        id: z.string(),
      }).default({ id: 'default' }),
    });
    // API returns data with wrong type (number instead of object)
    mockApi.mockResolvedValueOnce({ data: 123 });

    const result = await validatedApi('/api/test', schema);

    // Should log warning about validation failure
    expect(console.warn).toHaveBeenCalled();
    // Falls back to defaults
    expect(result).toEqual({ data: { id: 'default' } });
  });

  it('falls back to empty defaults when response is null', async () => {
    const schema = z.object({
      items: z.array(z.string()).default([]),
      count: z.number().default(0),
    });
    mockApi.mockResolvedValueOnce(null);

    const result = await validatedApi('/api/test', schema);

    expect(result).toEqual({ items: [], count: 0 });
    expect(console.warn).toHaveBeenCalled();
  });

  it('throws ValidationError when schema has no defaults and validation fails', async () => {
    const schema = z.object({
      id: z.string(),
      required_field: z.string(), // No default!
    });
    mockApi.mockResolvedValueOnce({ id: '123' }); // Missing required_field

    await expect(validatedApi('/api/test', schema)).rejects.toThrow(ValidationError);
  });

  it('ValidationError contains path, issues, and message', async () => {
    const schema = z.object({
      email: z.string().email(),
    });
    mockApi.mockResolvedValueOnce({ email: 'not-an-email' });

    try {
      await validatedApi('/api/test', schema);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const validationError = err as ValidationError;
      expect(validationError.path).toBe('/api/test');
      expect(validationError.issues).toBeDefined();
      expect(validationError.issues.length).toBeGreaterThan(0);
      expect(validationError.message).toContain('/api/test');
    }
  });

  it('passes RequestInit options to underlying api call', async () => {
    const schema = z.object({ success: z.boolean() });
    mockApi.mockResolvedValueOnce({ success: true });

    await validatedApi('/api/test', schema, {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    expect(mockApi).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });
  });
});

describe('validatedApiExtract', () => {
  beforeEach(() => {
    mockApi.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns nested property from response', async () => {
    const schema = z.object({
      data: z.object({
        id: z.string(),
        name: z.string(),
      }),
    });
    mockApi.mockResolvedValueOnce({ data: { id: '1', name: 'Test' } });

    const result = await validatedApiExtract('/api/test', schema, 'data');

    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('passes options through to validatedApi', async () => {
    const schema = z.object({
      result: z.string(),
    });
    mockApi.mockResolvedValueOnce({ result: 'success' });

    await validatedApiExtract('/api/test', schema, 'result', { method: 'POST' });

    expect(mockApi).toHaveBeenCalledWith('/api/test', { method: 'POST' });
  });
});

describe('isValidationError', () => {
  it('returns true for ValidationError instances', () => {
    const error = new ValidationError('test', '/api/test', []);
    expect(isValidationError(error)).toBe(true);
  });

  it('returns false for regular Error', () => {
    const error = new Error('regular error');
    expect(isValidationError(error)).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isValidationError(null)).toBe(false);
    expect(isValidationError(undefined)).toBe(false);
    expect(isValidationError('string')).toBe(false);
    expect(isValidationError({ message: 'fake error' })).toBe(false);
  });
});
