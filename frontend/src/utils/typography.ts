/**
 * Typography System - ForgeComply 360
 *
 * Centralized typography constants for consistent styling across the portal.
 * Based on Tailwind CSS classes with accessibility (WCAG 2.1 AA) compliance.
 *
 * Usage:
 *   import { TYPOGRAPHY } from '../utils/typography';
 *   <h1 className={TYPOGRAPHY.pageTitle}>Dashboard</h1>
 */

// =============================================================================
// TYPOGRAPHY SCALE
// =============================================================================
//
// Display:     30px (text-3xl)  - Hero sections, very rare
// Page Title:  24px (text-2xl)  - PageHeader component
// Section H2:  18px (text-lg)   - Major section headings
// Section H3:  16px (text-base) - Subsection headings
// Body:        14px (text-sm)   - Default body text
// Caption:     12px (text-xs)   - Helper text, timestamps
// Micro:       11px (text-[11px]) - Badges, chips, kbd hints
// Mini:        10px (text-[10px]) - Very small labels
//
// =============================================================================

export const TYPOGRAPHY = {
  // ---------------------------------------------------------------------------
  // HEADINGS
  // ---------------------------------------------------------------------------

  /** Page title - used in PageHeader component (24px bold) */
  pageTitle: 'text-2xl font-bold',

  /** Page subtitle - used below page titles (14px, muted) */
  pageSubtitle: 'text-sm text-white/70',

  /** Section title - major sections within a page (18px semibold) */
  sectionTitle: 'text-lg font-semibold text-gray-900',

  /** Section title dark - for dark backgrounds */
  sectionTitleDark: 'text-lg font-semibold text-white',

  /** Subsection title - nested sections (16px medium) */
  subsectionTitle: 'text-base font-medium text-gray-800',

  /** Card title - titles within cards/panels (14px semibold) */
  cardTitle: 'text-sm font-semibold text-gray-900',

  /** Card title with icon - includes flex alignment */
  cardTitleWithIcon: 'text-sm font-semibold text-gray-900 flex items-center gap-2',

  /** Modal title - dialog/modal headings (18px semibold) */
  modalTitle: 'text-lg font-semibold text-gray-900',

  // ---------------------------------------------------------------------------
  // BODY TEXT
  // ---------------------------------------------------------------------------

  /** Default body text (14px) */
  body: 'text-sm text-gray-900',

  /** Muted body text - secondary information */
  bodyMuted: 'text-sm text-gray-500',

  /** Small body text (12px) */
  bodySmall: 'text-xs text-gray-700',

  /** Small muted text */
  bodySmallMuted: 'text-xs text-gray-500',

  /** Lead text - intro paragraphs (16px) */
  lead: 'text-base text-gray-600',

  // ---------------------------------------------------------------------------
  // FORM ELEMENTS
  // ---------------------------------------------------------------------------

  /** Form label */
  label: 'text-sm font-medium text-gray-700',

  /** Form label dark - for dark backgrounds */
  labelDark: 'text-sm font-medium text-white',

  /** Required asterisk */
  required: 'text-red-500',

  /** Help text below inputs */
  helpText: 'text-xs text-gray-500 mt-1',

  /** Error text */
  errorText: 'text-xs text-red-600 mt-1',

  /** Success text */
  successText: 'text-xs text-green-600 mt-1',

  /** Placeholder styling guidance (use in className) */
  placeholder: 'placeholder-gray-400',

  // ---------------------------------------------------------------------------
  // BUTTONS
  // ---------------------------------------------------------------------------

  /** Primary button text */
  buttonPrimary: 'text-sm font-medium',

  /** Small button text */
  buttonSmall: 'text-xs font-medium',

  /** Large button text */
  buttonLarge: 'text-base font-medium',

  // ---------------------------------------------------------------------------
  // LINKS
  // ---------------------------------------------------------------------------

  /** Standard link */
  link: 'text-sm text-blue-600 hover:text-blue-800 hover:underline',

  /** Muted link */
  linkMuted: 'text-sm text-gray-500 hover:text-gray-700 hover:underline',

  /** Link in dark context */
  linkDark: 'text-sm text-blue-400 hover:text-blue-300',

  // ---------------------------------------------------------------------------
  // DATA DISPLAY
  // ---------------------------------------------------------------------------

  /** Table header */
  tableHeader: 'text-xs font-semibold uppercase tracking-wider text-gray-500',

  /** Table header dark */
  tableHeaderDark: 'text-xs font-semibold uppercase tracking-wider text-white',

  /** Table cell */
  tableCell: 'text-sm text-gray-900',

  /** Table cell muted */
  tableCellMuted: 'text-sm text-gray-500',

  /** Table cell small */
  tableCellSmall: 'text-xs text-gray-700',

  // ---------------------------------------------------------------------------
  // BADGES & CHIPS
  // ---------------------------------------------------------------------------

  /** Standard badge */
  badge: 'text-xs font-medium',

  /** Small badge/chip */
  chip: 'text-[11px] font-medium',

  /** Micro badge (notification counts) */
  microBadge: 'text-[10px] font-bold',

  /** Status badge - standard pill style */
  statusBadge: 'text-xs font-medium px-2.5 py-1 rounded-full',

  // ---------------------------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------------------------

  /** Navigation group header */
  navGroup: 'text-xs font-bold uppercase tracking-wider',

  /** Navigation item */
  navItem: 'text-sm',

  /** Navigation item active */
  navItemActive: 'text-sm font-medium',

  /** Breadcrumb text */
  breadcrumb: 'text-sm text-gray-500',

  /** Breadcrumb separator */
  breadcrumbSeparator: 'text-gray-400',

  /** Breadcrumb current page */
  breadcrumbCurrent: 'text-sm font-medium text-gray-900',

  // ---------------------------------------------------------------------------
  // METRICS & STATS
  // ---------------------------------------------------------------------------

  /** Large metric value (dashboard cards) */
  metricLarge: 'text-3xl font-bold',

  /** Medium metric value */
  metricMedium: 'text-2xl font-bold',

  /** Small metric value */
  metricSmall: 'text-xl font-semibold',

  /** Metric label */
  metricLabel: 'text-xs text-gray-500 uppercase tracking-wide',

  /** Metric change/delta */
  metricDelta: 'text-xs font-semibold',

  // ---------------------------------------------------------------------------
  // TIMESTAMPS & METADATA
  // ---------------------------------------------------------------------------

  /** Timestamp */
  timestamp: 'text-xs text-gray-400',

  /** Metadata label */
  metaLabel: 'text-xs font-medium text-gray-500',

  /** Metadata value */
  metaValue: 'text-xs text-gray-700',

  // ---------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // ---------------------------------------------------------------------------

  /** Keyboard shortcut hint */
  kbd: 'text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200',

  /** Keyboard shortcut dark mode */
  kbdDark: 'text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-white/40',

  // ---------------------------------------------------------------------------
  // ALERTS & NOTIFICATIONS
  // ---------------------------------------------------------------------------

  /** Alert title */
  alertTitle: 'text-sm font-semibold',

  /** Alert body */
  alertBody: 'text-sm',

  /** Alert action link */
  alertAction: 'text-xs font-medium',

  /** Toast message */
  toast: 'text-sm',

  // ---------------------------------------------------------------------------
  // CODE & TECHNICAL
  // ---------------------------------------------------------------------------

  /** Code/monospace text */
  code: 'text-sm font-mono',

  /** Code small */
  codeSmall: 'text-xs font-mono',

  /** Control ID (e.g., AC-1, AU-2) */
  controlId: 'text-sm font-mono font-medium',

  // ---------------------------------------------------------------------------
  // EMPTY STATES
  // ---------------------------------------------------------------------------

  /** Empty state title */
  emptyTitle: 'text-lg font-medium text-gray-900',

  /** Empty state description */
  emptyDescription: 'text-sm text-gray-500',

} as const;

// =============================================================================
// TYPOGRAPHY PRESETS (Combined classes for common patterns)
// =============================================================================

export const TYPOGRAPHY_PRESETS = {
  /** Card with title and subtitle */
  cardHeader: {
    title: TYPOGRAPHY.cardTitle,
    subtitle: TYPOGRAPHY.bodySmallMuted,
  },

  /** Section with heading */
  section: {
    title: TYPOGRAPHY.sectionTitle,
    subtitle: TYPOGRAPHY.bodyMuted,
  },

  /** Form field */
  formField: {
    label: TYPOGRAPHY.label,
    help: TYPOGRAPHY.helpText,
    error: TYPOGRAPHY.errorText,
  },

  /** Table */
  table: {
    header: TYPOGRAPHY.tableHeader,
    cell: TYPOGRAPHY.tableCell,
    cellMuted: TYPOGRAPHY.tableCellMuted,
  },

  /** Metric card */
  metric: {
    value: TYPOGRAPHY.metricLarge,
    label: TYPOGRAPHY.metricLabel,
    delta: TYPOGRAPHY.metricDelta,
  },
} as const;

// =============================================================================
// SPACING CONSTANTS (for consistency)
// =============================================================================

export const SPACING = {
  /** Standard gap between icon and text */
  iconGap: 'gap-2',

  /** Small gap */
  iconGapSmall: 'gap-1.5',

  /** Card padding */
  cardPadding: 'p-4',

  /** Card padding large */
  cardPaddingLarge: 'p-6',

  /** Section margin bottom */
  sectionMargin: 'mb-6',

  /** Section margin bottom large */
  sectionMarginLarge: 'mb-8',
} as const;

// =============================================================================
// BUTTON STYLES
// =============================================================================

export const BUTTONS = {
  // Base button styles (add to variant)
  base: 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',

  // Primary - main actions
  primary: 'px-4 py-2 bg-forge-navy-900 text-white text-sm font-medium rounded-lg hover:bg-forge-navy-800 focus:ring-forge-navy-500 disabled:opacity-50 disabled:cursor-not-allowed',

  // Secondary - alternative actions
  secondary: 'px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed',

  // Danger - destructive actions
  danger: 'px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed',

  // Success - positive actions
  success: 'px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed',

  // Ghost - subtle actions
  ghost: 'px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',

  // Link style - inline text actions
  link: 'text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline',

  // Icon button - square with icon only
  icon: 'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg',

  // Size modifiers (combine with variant)
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-6 py-2.5 text-base',
} as const;

// =============================================================================
// FORM ELEMENT STYLES
// =============================================================================

export const FORMS = {
  // Text input
  input: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-navy focus:border-forge-navy placeholder-gray-400',

  // Select dropdown
  select: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-navy focus:border-forge-navy bg-white',

  // Textarea
  textarea: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-navy focus:border-forge-navy placeholder-gray-400',

  // Form label
  label: 'block text-sm font-medium text-gray-700 mb-1',

  // Required asterisk
  required: 'text-red-500 ml-0.5',

  // Help text
  helpText: 'text-xs text-gray-500 mt-1',

  // Error text
  errorText: 'text-xs text-red-600 mt-1',

  // Input with error state
  inputError: 'w-full px-4 py-2.5 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500',

  // Checkbox
  checkbox: 'h-4 w-4 rounded border-gray-300 text-forge-navy-600 focus:ring-forge-navy-500',

  // Radio
  radio: 'h-4 w-4 border-gray-300 text-forge-navy-600 focus:ring-forge-navy-500',
} as const;

// =============================================================================
// CARD/PANEL STYLES
// =============================================================================

export const CARDS = {
  // Base card - standard container
  base: 'bg-white rounded-xl border border-gray-200',

  // Elevated card - with shadow
  elevated: 'bg-white rounded-xl border border-gray-200 shadow-sm',

  // Interactive card - hover effects
  interactive: 'bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer',

  // Selected card state
  selected: 'bg-white rounded-xl border-2 border-forge-navy-500 shadow-sm',

  // Card header section
  header: 'px-6 py-4 border-b border-gray-200',

  // Card body section
  body: 'p-6',

  // Card footer section
  footer: 'px-6 py-4 border-t border-gray-200',

  // Compact padding
  compact: 'p-4',
} as const;

// =============================================================================
// CARD ELEVATION SYSTEM V2 (Dashboard Improvements)
// =============================================================================

export const CARDS_V2 = {
  // Primary cards - key data, require attention (highest elevation)
  primary: 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border-2 border-blue-200 dark:border-blue-700',

  // Secondary cards - supporting information (medium elevation)
  secondary: 'bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm',

  // Tertiary cards - background data, lists (lowest elevation)
  tertiary: 'bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-blue-200 dark:border-blue-700',

  // Interactive cards - clickable items with hover effects
  interactive: 'bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',

  // Hero card - main KPI/metric (gradient dark background)
  hero: 'bg-gradient-to-br from-forge-navy-900 via-forge-navy-800 to-forge-navy-700 rounded-2xl p-6 shadow-xl ring-1 ring-forge-navy-500/40',

  // Glass effect - frosted glass for supporting metrics
  glass: 'backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200',

  // Status-aware cards (use with border-l-{color})
  statusSuccess: 'bg-white dark:bg-gray-800 rounded-xl border-2 border-l-4 border-blue-200 dark:border-blue-700 border-l-green-500 p-5',
  statusWarning: 'bg-white dark:bg-gray-800 rounded-xl border-2 border-l-4 border-blue-200 dark:border-blue-700 border-l-amber-500 p-5',
  statusDanger: 'bg-white dark:bg-gray-800 rounded-xl border-2 border-l-4 border-blue-200 dark:border-blue-700 border-l-red-500 p-5',
  statusInfo: 'bg-white dark:bg-gray-800 rounded-xl border-2 border-l-4 border-blue-200 dark:border-blue-700 border-l-blue-500 p-5',

  // Alert banner - attention-grabbing
  alertBanner: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-5 shadow-sm',
} as const;

// =============================================================================
// DASHBOARD TYPOGRAPHY (Metrics & Stats focused)
// =============================================================================

export const TYPOGRAPHY_DASHBOARD = {
  // Hero metric - large compliance score
  heroValue: 'text-5xl sm:text-6xl font-bold tracking-tight',
  heroLabel: 'text-sm font-semibold uppercase tracking-wide',
  heroSubvalue: 'text-xl sm:text-2xl font-medium',

  // Card metrics
  cardValue: 'text-2xl sm:text-3xl font-bold',
  cardLabel: 'text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400',

  // Trend/delta indicators
  trendUp: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold',
  trendDown: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold',
  trendNeutral: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-200/50 text-gray-600 dark:text-gray-400 text-xs font-semibold',

  // Section headers with icon
  sectionHeader: 'text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2',

  // Data labels in widgets
  dataLabel: 'text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide',
  dataValue: 'text-sm font-semibold text-gray-900 dark:text-white',

  // Alert titles
  alertTitle: 'font-semibold text-amber-900 dark:text-amber-100',
  alertSubtitle: 'text-sm text-amber-700 dark:text-amber-300',
} as const;

// =============================================================================
// MODAL STYLES
// =============================================================================

export const MODALS = {
  // Modal backdrop overlay
  backdrop: 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center',

  // Modal container
  container: 'bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden',

  // Modal container - wide variant
  containerWide: 'bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden',

  // Modal container - full variant
  containerFull: 'bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden',

  // Modal header
  header: 'px-6 py-4 border-b border-gray-200 flex items-center justify-between',

  // Modal body
  body: 'p-6 overflow-y-auto',

  // Modal footer
  footer: 'px-6 py-4 border-t border-gray-200 flex justify-end gap-3',

  // Close button (X icon)
  closeButton: 'p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded',
} as const;

// =============================================================================
// BADGE/STATUS STYLES
// =============================================================================

export const BADGES = {
  // Base badge styling (add color variant)
  base: 'text-xs font-medium px-2 py-0.5 rounded',

  // Pill badge (fully rounded)
  pill: 'text-xs font-medium px-2.5 py-1 rounded-full',

  // Status colors
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-amber-100 text-amber-700',

  // Outlined variants
  outlineSuccess: 'bg-transparent border border-green-300 text-green-700',
  outlineWarning: 'bg-transparent border border-yellow-300 text-yellow-700',
  outlineError: 'bg-transparent border border-red-300 text-red-700',
  outlineInfo: 'bg-transparent border border-blue-300 text-blue-700',
} as const;

// =============================================================================
// STATUS COLORS (for consistent status mapping)
// =============================================================================

export const STATUS_BADGE_COLORS = {
  // Common statuses
  active: BADGES.success,
  completed: BADGES.success,
  implemented: BADGES.success,
  approved: BADGES.success,
  published: BADGES.success,
  passed: BADGES.success,

  // Warning/In Progress
  in_progress: BADGES.warning,
  pending: BADGES.warning,
  partially_implemented: BADGES.warning,
  planned: BADGES.warning,
  draft: BADGES.warning,

  // Error/Critical
  failed: BADGES.error,
  expired: BADGES.error,
  overdue: BADGES.error,
  not_implemented: BADGES.error,
  rejected: BADGES.error,
  critical: BADGES.error,
  high: BADGES.error,

  // Info
  open: BADGES.info,
  new: BADGES.info,
  inherited: BADGES.info,

  // Neutral
  deactivated: BADGES.neutral,
  not_applicable: BADGES.neutral,
  unknown: BADGES.neutral,

  // Special
  ai_generated: BADGES.purple,
  moderate: BADGES.orange,
  medium: BADGES.orange,
  low: BADGES.teal,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type TypographyKey = keyof typeof TYPOGRAPHY;
export type TypographyPresetKey = keyof typeof TYPOGRAPHY_PRESETS;
export type SpacingKey = keyof typeof SPACING;
export type ButtonKey = keyof typeof BUTTONS;
export type FormKey = keyof typeof FORMS;
export type CardKey = keyof typeof CARDS;
export type ModalKey = keyof typeof MODALS;
export type BadgeKey = keyof typeof BADGES;
export type StatusBadgeKey = keyof typeof STATUS_BADGE_COLORS;
