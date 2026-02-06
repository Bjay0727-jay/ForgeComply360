/**
 * Centralized Color System
 *
 * This file provides consistent color constants for domain-specific UI elements
 * like calendar events, monitoring checks, frequencies, and risk levels.
 *
 * For basic badge colors, use BADGES from typography.ts
 * For chart colors (hex values), use chartTheme.ts
 */

// =============================================================================
// Multi-Property Color Palettes
// =============================================================================

export interface ColorPalette {
  bg: string;           // Primary background (e.g., bg-orange-500)
  bgLight: string;      // Light background (e.g., bg-orange-50)
  dotColor: string;     // Dot/indicator background (e.g., bg-orange-400)
  textColor: string;    // Text color (e.g., text-orange-700)
  borderColor: string;  // Border color (e.g., border-orange-400)
}

export const COLOR_PALETTES = {
  orange: {
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    dotColor: 'bg-orange-400',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-400',
  },
  purple: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    dotColor: 'bg-purple-400',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-400',
  },
  blue: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    dotColor: 'bg-blue-400',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-400',
  },
  amber: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    dotColor: 'bg-amber-400',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-400',
  },
  teal: {
    bg: 'bg-teal-500',
    bgLight: 'bg-teal-50',
    dotColor: 'bg-teal-400',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-400',
  },
  tealLight: {
    bg: 'bg-teal-500',
    bgLight: 'bg-teal-50',
    dotColor: 'bg-teal-300',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-300',
  },
  rose: {
    bg: 'bg-rose-500',
    bgLight: 'bg-rose-50',
    dotColor: 'bg-rose-400',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-400',
  },
} as const;

// =============================================================================
// Calendar Event Type Colors
// =============================================================================

export const CALENDAR_EVENT_COLORS: Record<string, ColorPalette> = {
  poam: COLOR_PALETTES.orange,
  evidence_schedule: COLOR_PALETTES.purple,
  audit_task: COLOR_PALETTES.blue,
  ato_expiry: COLOR_PALETTES.amber,
  vendor_assessment: COLOR_PALETTES.teal,
  vendor_contract: COLOR_PALETTES.tealLight,
  risk_treatment: COLOR_PALETTES.rose,
};

// =============================================================================
// Monitoring Check Colors
// =============================================================================

/** Check type badge colors (automated, manual, hybrid) */
export const CHECK_TYPE_COLORS: Record<string, string> = {
  automated: 'bg-purple-100 text-purple-700',
  manual: 'bg-blue-100 text-blue-700',
  hybrid: 'bg-indigo-100 text-indigo-700',
};

/** Frequency badge colors */
export const FREQUENCY_COLORS: Record<string, string> = {
  continuous: 'bg-green-100 text-green-700',
  daily: 'bg-teal-100 text-teal-700',
  weekly: 'bg-blue-100 text-blue-700',
  monthly: 'bg-indigo-100 text-indigo-700',
  quarterly: 'bg-purple-100 text-purple-700',
  annually: 'bg-gray-100 text-gray-600',
};

/** Result indicator dot colors */
export const RESULT_DOTS: Record<string, string> = {
  pass: 'bg-green-500',
  fail: 'bg-red-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-400',
};

// =============================================================================
// Risk Level Colors
// =============================================================================

/** Risk level badge colors (reusable across pages) */
export const RISK_LEVEL_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get badge class based on score percentage
 * @param score - Score value (0-100)
 * @returns Tailwind classes for badge styling
 */
export function getScoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

/**
 * Get risk level color by level name
 * @param level - Risk level (critical, high, moderate, low)
 * @returns Tailwind classes for badge styling
 */
export function getRiskLevelColor(level: string): string {
  return RISK_LEVEL_COLORS[level.toLowerCase()] || 'bg-gray-100 text-gray-600';
}
