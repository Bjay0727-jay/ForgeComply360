import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @sentry/react before importing sentry.ts
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import * as Sentry from '@sentry/react';
import { setUserContext, clearUserContext, captureException, captureMessage, initSentry } from './sentry';

describe('sentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initSentry', () => {
    // Note: Testing initSentry's conditional logic based on import.meta.env is complex
    // because Vitest evaluates import.meta.env at build time. These tests verify
    // the function exists and doesn't throw.
    it('is defined as a function', () => {
      expect(typeof initSentry).toBe('function');
    });

    it('does not throw when called', () => {
      expect(() => initSentry()).not.toThrow();
    });

    it('does not initialize in test environment (PROD is false)', () => {
      // In test environment, PROD is false so Sentry.init should not be called
      initSentry();
      // Since we're in test mode (not production), init should not be called
      expect(Sentry.init).not.toHaveBeenCalled();
    });
  });

  describe('setUserContext', () => {
    it('calls Sentry.setUser with id and email', () => {
      setUserContext({ id: 'user-123', email: 'test@example.com', orgId: 'org-456' });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('calls Sentry.setTag with org_id', () => {
      setUserContext({ id: 'user-123', email: 'test@example.com', orgId: 'org-456' });

      expect(Sentry.setTag).toHaveBeenCalledWith('org_id', 'org-456');
    });
  });

  describe('clearUserContext', () => {
    it('calls Sentry.setUser with null', () => {
      clearUserContext();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('captureException', () => {
    it('converts string to Error', () => {
      captureException('Something went wrong');

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ level: 'error' })
      );
      // Verify the error message
      const call = vi.mocked(Sentry.captureException).mock.calls[0];
      expect((call[0] as Error).message).toBe('Something went wrong');
    });

    it('passes Error directly', () => {
      const error = new Error('Test error');

      captureException(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ level: 'error' })
      );
    });

    it('includes tags, extra, and level in context', () => {
      captureException(new Error('Test'), {
        tags: { endpoint: '/api/test', status: '500' },
        extra: { response: 'error data' },
        level: 'warning',
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          tags: { endpoint: '/api/test', status: '500' },
          extra: { response: 'error data' },
          level: 'warning',
        }
      );
    });

    it('defaults to error level when no level specified', () => {
      captureException(new Error('Test'));

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ level: 'error' })
      );
    });
  });

  describe('captureMessage', () => {
    it('sends message with specified level', () => {
      captureMessage('User clicked button', 'info');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('User clicked button', 'info');
    });

    it('sends message with warning level', () => {
      captureMessage('Something unusual', 'warning');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Something unusual', 'warning');
    });

    it('defaults to info level', () => {
      captureMessage('Test message');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });
  });
});
