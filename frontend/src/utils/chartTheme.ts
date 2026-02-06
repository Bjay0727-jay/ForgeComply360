// ============================================================================
// FORGECOMPLY 360 — CHART THEME CONFIGURATION
// Experience-aware colors, gradients, tooltips, and animation settings
// ============================================================================

import { useExperience } from '../hooks/useExperience';

// ---------------------------------------------------------------------------
// Color Palettes
// ---------------------------------------------------------------------------

export const CHART_COLORS = {
  federal: {
    primary: '#1e3a8a',      // blue-900
    primaryLight: '#3b82f6',  // blue-500
    accent: '#0ea5e9',        // sky-500
    gradient: ['#1e3a8a', '#3b82f6', '#93c5fd'],
  },
  healthcare: {
    primary: '#581c87',      // purple-900
    primaryLight: '#8b5cf6', // violet-500
    accent: '#a78bfa',       // violet-400
    gradient: ['#581c87', '#8b5cf6', '#c4b5fd'],
  },
  enterprise: {
    primary: '#111827',      // gray-900
    primaryLight: '#6b7280', // gray-500
    accent: '#3b82f6',       // blue-500
    gradient: ['#111827', '#4b5563', '#9ca3af'],
  },
} as const;

export const STATUS_COLORS = {
  success: '#16a34a',      // green-600
  successLight: '#22c55e', // green-500
  warning: '#ca8a04',      // yellow-600
  warningLight: '#eab308', // yellow-500
  danger: '#dc2626',       // red-600
  dangerLight: '#ef4444',  // red-500
  orange: '#ea580c',       // orange-600
  orangeLight: '#f97316',  // orange-500
  info: '#0284c7',         // sky-600
  infoLight: '#0ea5e9',    // sky-500
  muted: '#9ca3af',        // gray-400
  mutedLight: '#d1d5db',   // gray-300
} as const;

export const GRADE_COLORS: Record<string, string> = {
  A: '#059669', // emerald-600
  B: '#2563eb', // blue-600
  C: '#d97706', // amber-600
  D: '#ea580c', // orange-600
  F: '#dc2626', // red-600
};

// ---------------------------------------------------------------------------
// Score → Color Mapping
// ---------------------------------------------------------------------------

export function scoreToColor(score: number): string {
  if (score >= 80) return STATUS_COLORS.success;
  if (score >= 60) return STATUS_COLORS.warning;
  if (score >= 40) return STATUS_COLORS.orange;
  return STATUS_COLORS.danger;
}

export function scoreToTailwind(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function scoreToBgTailwind(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

// ---------------------------------------------------------------------------
// Experience-Aware Hook
// ---------------------------------------------------------------------------

export function useChartColors() {
  const { isFederal, isHealthcare } = useExperience();
  const theme = isFederal ? 'federal' : isHealthcare ? 'healthcare' : 'enterprise';
  return {
    ...CHART_COLORS[theme],
    theme,
    statusColors: STATUS_COLORS,
    gradeColors: GRADE_COLORS,
    scoreToColor,
    scoreToTailwind,
    scoreToBgTailwind,
  };
}

// ---------------------------------------------------------------------------
// Animation Config
// ---------------------------------------------------------------------------

export const ANIMATION = {
  duration: 800,
  easing: 'ease-in-out',
  delay: 100,
} as const;

// ---------------------------------------------------------------------------
// Chart Dimensions
// ---------------------------------------------------------------------------

export const CHART_SIZES = {
  trendHeight: 240,
  barHeight: 280,
  radialLarge: 180,
  radialMedium: 140,
  radialSmall: 80,
  heatMapSize: 340,
} as const;

// ---------------------------------------------------------------------------
// Dark Mode Chart Colors
// ---------------------------------------------------------------------------

export const CHART_MODE_COLORS = {
  light: {
    grid: '#e5e7eb',
    axisText: '#9ca3af',
    labelText: '#374151',
    tooltipBg: 'bg-gray-900/95 text-white border-gray-700',
    tooltipCursor: '#f9fafb',
    background: '#f3f4f6',
    dotStroke: '#ffffff',
  },
  dark: {
    grid: '#4b5563',
    axisText: '#d1d5db',
    labelText: '#e5e7eb',
    tooltipBg: 'bg-gray-800/95 text-white border-gray-600',
    tooltipCursor: '#374151',
    background: '#374151',
    dotStroke: '#1f2937',
  },
};

export function getChartColors(isDark: boolean) {
  return isDark ? CHART_MODE_COLORS.dark : CHART_MODE_COLORS.light;
}
