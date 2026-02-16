/**
 * Sync Hook Tests
 * Tests for ForgeComply 360 Reporter sync status display
 */
import { describe, it, expect } from 'vitest';
import { getSyncStatusDisplay, type SyncStatus } from './useSync';

describe('getSyncStatusDisplay', () => {
  describe('Offline Status', () => {
    it('should return correct display for offline status', () => {
      const result = getSyncStatusDisplay('offline');

      expect(result.icon).toBe('📴');
      expect(result.label).toBe('Offline');
      expect(result.color).toBe('#64748b');
    });
  });

  describe('Idle Status', () => {
    it('should return correct display for idle status', () => {
      const result = getSyncStatusDisplay('idle');

      expect(result.icon).toBe('☁️');
      expect(result.label).toBe('Connected');
      expect(result.color).toBe('#0ea5e9');
    });
  });

  describe('Syncing Status', () => {
    it('should return correct display for syncing status', () => {
      const result = getSyncStatusDisplay('syncing');

      expect(result.icon).toBe('🔄');
      expect(result.label).toBe('Syncing...');
      expect(result.color).toBe('#f59e0b');
    });
  });

  describe('Synced Status', () => {
    it('should return correct display for synced status', () => {
      const result = getSyncStatusDisplay('synced');

      expect(result.icon).toBe('✓');
      expect(result.label).toBe('Synced');
      expect(result.color).toBe('#22c55e');
    });
  });

  describe('Dirty Status', () => {
    it('should return correct display for dirty status', () => {
      const result = getSyncStatusDisplay('dirty');

      expect(result.icon).toBe('⚠️');
      expect(result.label).toBe('Unsaved');
      expect(result.color).toBe('#f59e0b');
    });
  });

  describe('Error Status', () => {
    it('should return correct display for error status', () => {
      const result = getSyncStatusDisplay('error');

      expect(result.icon).toBe('❌');
      expect(result.label).toBe('Error');
      expect(result.color).toBe('#ef4444');
    });
  });

  describe('Color Consistency', () => {
    it('should use warning color for both syncing and dirty states', () => {
      const syncing = getSyncStatusDisplay('syncing');
      const dirty = getSyncStatusDisplay('dirty');

      expect(syncing.color).toBe(dirty.color);
      expect(syncing.color).toBe('#f59e0b');
    });

    it('should use distinct colors for success and error states', () => {
      const synced = getSyncStatusDisplay('synced');
      const error = getSyncStatusDisplay('error');

      expect(synced.color).not.toBe(error.color);
      expect(synced.color).toBe('#22c55e'); // Green
      expect(error.color).toBe('#ef4444'); // Red
    });
  });

  describe('All Statuses Coverage', () => {
    it('should handle all valid sync statuses', () => {
      const allStatuses: SyncStatus[] = ['offline', 'idle', 'syncing', 'synced', 'dirty', 'error'];

      allStatuses.forEach((status) => {
        const result = getSyncStatusDisplay(status);

        expect(result).toHaveProperty('icon');
        expect(result).toHaveProperty('label');
        expect(result).toHaveProperty('color');
        expect(typeof result.icon).toBe('string');
        expect(typeof result.label).toBe('string');
        expect(result.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have unique labels for each status', () => {
      const allStatuses: SyncStatus[] = ['offline', 'idle', 'syncing', 'synced', 'dirty', 'error'];
      const labels = allStatuses.map((s) => getSyncStatusDisplay(s).label);
      const uniqueLabels = new Set(labels);

      expect(uniqueLabels.size).toBe(allStatuses.length);
    });
  });
});
