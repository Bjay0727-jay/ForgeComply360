/**
 * Color System Tests
 * Tests for ForgeComply 360 Reporter color configuration
 */
import { describe, it, expect } from 'vitest';
import { C, TAG_COLORS, TAG_LABELS, TAG_BG } from './colors';

describe('Color System', () => {
  describe('Brand Colors', () => {
    it('should have primary brand colors defined', () => {
      expect(C.primary).toBe('#0ea5e9');
      expect(C.primaryDark).toBe('#0284c7');
      expect(C.primaryLight).toBe('#e0f2fe');
    });

    it('should have accent colors defined', () => {
      expect(C.accent).toBe('#14b8a6');
      expect(C.accentDark).toBe('#0d9488');
      expect(C.accentLight).toBe('#ccfbf1');
    });
  });

  describe('Background Colors', () => {
    it('should have background colors defined', () => {
      expect(C.bg).toBe('#ffffff');
      expect(C.surface).toBe('#f8fafc');
      expect(C.surfaceAlt).toBe('#f1f5f9');
      expect(C.surfaceHover).toBe('#e2e8f0');
    });

    it('should have distinct background shades', () => {
      expect(C.bg).not.toBe(C.surface);
      expect(C.surface).not.toBe(C.surfaceAlt);
      expect(C.surfaceAlt).not.toBe(C.surfaceHover);
    });
  });

  describe('Status Colors', () => {
    it('should have success colors', () => {
      expect(C.success).toBe('#22c55e');
      expect(C.successLight).toBe('#dcfce7');
    });

    it('should have warning colors', () => {
      expect(C.warning).toBe('#f59e0b');
      expect(C.warningLight).toBe('#fef3c7');
    });

    it('should have error colors', () => {
      expect(C.error).toBe('#ef4444');
      expect(C.errorLight).toBe('#fee2e2');
    });

    it('should have info colors', () => {
      expect(C.info).toBe('#3b82f6');
      expect(C.infoLight).toBe('#dbeafe');
    });

    it('should have distinct status colors', () => {
      const statusColors = [C.success, C.warning, C.error, C.info];
      const uniqueColors = new Set(statusColors);
      expect(uniqueColors.size).toBe(4);
    });
  });

  describe('Text Colors', () => {
    it('should have text color hierarchy', () => {
      expect(C.text).toBe('#0f172a');
      expect(C.textSecondary).toBe('#475569');
      expect(C.textMuted).toBe('#94a3b8');
      expect(C.textLight).toBe('#cbd5e1');
    });

    it('should have progressively lighter text colors', () => {
      // Primary text should be darkest (lowest hex value)
      const getHexValue = (hex: string) => parseInt(hex.replace('#', ''), 16);
      expect(getHexValue(C.text)).toBeLessThan(getHexValue(C.textSecondary));
      expect(getHexValue(C.textSecondary)).toBeLessThan(getHexValue(C.textMuted));
      expect(getHexValue(C.textMuted)).toBeLessThan(getHexValue(C.textLight));
    });
  });

  describe('Border Colors', () => {
    it('should have border color variants', () => {
      expect(C.border).toBe('#e2e8f0');
      expect(C.borderDark).toBe('#cbd5e1');
      expect(C.borderLight).toBe('#f1f5f9');
    });
  });

  describe('Tag Colors', () => {
    it('should have tag text colors', () => {
      expect(C.tagOriginal).toBe('#64748b');
      expect(C.tagFedramp).toBe('#3b82f6');
      expect(C.tagFisma).toBe('#f97316');
    });

    it('should have tag background colors', () => {
      expect(C.tagOriginalBg).toBe('#f1f5f9');
      expect(C.tagFedrampBg).toBe('#eff6ff');
      expect(C.tagFismaBg).toBe('#fff7ed');
    });
  });

  describe('Color Format Validation', () => {
    it('should have all colors in valid hex format', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

      Object.entries(C).forEach(([key, value]) => {
        expect(value, `Color ${key} should be valid hex`).toMatch(hexColorRegex);
      });
    });
  });
});

describe('TAG_COLORS Export', () => {
  it('should have all tag types', () => {
    expect(TAG_COLORS).toHaveProperty('original');
    expect(TAG_COLORS).toHaveProperty('fedramp');
    expect(TAG_COLORS).toHaveProperty('fisma');
  });

  it('should match C object values', () => {
    expect(TAG_COLORS.original).toBe(C.tagOriginal);
    expect(TAG_COLORS.fedramp).toBe(C.tagFedramp);
    expect(TAG_COLORS.fisma).toBe(C.tagFisma);
  });
});

describe('TAG_LABELS Export', () => {
  it('should have all tag labels', () => {
    expect(TAG_LABELS.original).toBe('ORIGINAL');
    expect(TAG_LABELS.fedramp).toBe('FEDRAMP');
    expect(TAG_LABELS.fisma).toBe('FISMA/RMF');
  });
});

describe('TAG_BG Export', () => {
  it('should have all tag background colors', () => {
    expect(TAG_BG.original).toBe(C.tagOriginalBg);
    expect(TAG_BG.fedramp).toBe(C.tagFedrampBg);
    expect(TAG_BG.fisma).toBe(C.tagFismaBg);
  });
});
