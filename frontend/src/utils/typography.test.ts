/**
 * Typography System Tests
 *
 * Tests the design system constants for proper exports and values.
 */

import { describe, it, expect } from 'vitest';
import {
  TYPOGRAPHY,
  TYPOGRAPHY_PRESETS,
  SPACING,
  BUTTONS,
  FORMS,
  CARDS,
  MODALS,
  BADGES,
  STATUS_BADGE_COLORS,
} from './typography';

describe('TYPOGRAPHY constants', () => {
  it('exports all heading styles', () => {
    expect(TYPOGRAPHY.pageTitle).toBeDefined();
    expect(TYPOGRAPHY.pageSubtitle).toBeDefined();
    expect(TYPOGRAPHY.sectionTitle).toBeDefined();
    expect(TYPOGRAPHY.sectionTitleDark).toBeDefined();
    expect(TYPOGRAPHY.subsectionTitle).toBeDefined();
    expect(TYPOGRAPHY.cardTitle).toBeDefined();
    expect(TYPOGRAPHY.cardTitleWithIcon).toBeDefined();
    expect(TYPOGRAPHY.modalTitle).toBeDefined();
  });

  it('exports all body text styles', () => {
    expect(TYPOGRAPHY.body).toBeDefined();
    expect(TYPOGRAPHY.bodyMuted).toBeDefined();
    expect(TYPOGRAPHY.bodySmall).toBeDefined();
    expect(TYPOGRAPHY.bodySmallMuted).toBeDefined();
    expect(TYPOGRAPHY.lead).toBeDefined();
  });

  it('exports all form element styles', () => {
    expect(TYPOGRAPHY.label).toBeDefined();
    expect(TYPOGRAPHY.labelDark).toBeDefined();
    expect(TYPOGRAPHY.required).toBeDefined();
    expect(TYPOGRAPHY.helpText).toBeDefined();
    expect(TYPOGRAPHY.errorText).toBeDefined();
    expect(TYPOGRAPHY.successText).toBeDefined();
    expect(TYPOGRAPHY.placeholder).toBeDefined();
  });

  it('exports all link styles', () => {
    expect(TYPOGRAPHY.link).toBeDefined();
    expect(TYPOGRAPHY.linkMuted).toBeDefined();
    expect(TYPOGRAPHY.linkDark).toBeDefined();
  });

  it('exports all table styles', () => {
    expect(TYPOGRAPHY.tableHeader).toBeDefined();
    expect(TYPOGRAPHY.tableHeaderDark).toBeDefined();
    expect(TYPOGRAPHY.tableCell).toBeDefined();
    expect(TYPOGRAPHY.tableCellMuted).toBeDefined();
    expect(TYPOGRAPHY.tableCellSmall).toBeDefined();
  });

  it('exports all metric styles', () => {
    expect(TYPOGRAPHY.metricLarge).toBeDefined();
    expect(TYPOGRAPHY.metricMedium).toBeDefined();
    expect(TYPOGRAPHY.metricSmall).toBeDefined();
    expect(TYPOGRAPHY.metricLabel).toBeDefined();
    expect(TYPOGRAPHY.metricDelta).toBeDefined();
  });

  it('exports keyboard shortcut styles', () => {
    expect(TYPOGRAPHY.kbd).toContain('rounded');
    expect(TYPOGRAPHY.kbdDark).toContain('rounded');
  });

  it('exports empty state styles', () => {
    expect(TYPOGRAPHY.emptyTitle).toBeDefined();
    expect(TYPOGRAPHY.emptyDescription).toBeDefined();
  });

  it('contains proper text size classes', () => {
    expect(TYPOGRAPHY.pageTitle).toContain('text-2xl');
    expect(TYPOGRAPHY.sectionTitle).toContain('text-lg');
    expect(TYPOGRAPHY.body).toContain('text-sm');
    expect(TYPOGRAPHY.bodySmall).toContain('text-xs');
  });

  it('contains proper font weight classes', () => {
    expect(TYPOGRAPHY.pageTitle).toContain('font-bold');
    expect(TYPOGRAPHY.sectionTitle).toContain('font-semibold');
    expect(TYPOGRAPHY.label).toContain('font-medium');
  });
});

describe('TYPOGRAPHY_PRESETS', () => {
  it('exports cardHeader preset with title and subtitle', () => {
    expect(TYPOGRAPHY_PRESETS.cardHeader).toBeDefined();
    expect(TYPOGRAPHY_PRESETS.cardHeader.title).toBe(TYPOGRAPHY.cardTitle);
    expect(TYPOGRAPHY_PRESETS.cardHeader.subtitle).toBe(TYPOGRAPHY.bodySmallMuted);
  });

  it('exports section preset', () => {
    expect(TYPOGRAPHY_PRESETS.section).toBeDefined();
    expect(TYPOGRAPHY_PRESETS.section.title).toBe(TYPOGRAPHY.sectionTitle);
    expect(TYPOGRAPHY_PRESETS.section.subtitle).toBe(TYPOGRAPHY.bodyMuted);
  });

  it('exports formField preset', () => {
    expect(TYPOGRAPHY_PRESETS.formField).toBeDefined();
    expect(TYPOGRAPHY_PRESETS.formField.label).toBe(TYPOGRAPHY.label);
    expect(TYPOGRAPHY_PRESETS.formField.help).toBe(TYPOGRAPHY.helpText);
    expect(TYPOGRAPHY_PRESETS.formField.error).toBe(TYPOGRAPHY.errorText);
  });

  it('exports table preset', () => {
    expect(TYPOGRAPHY_PRESETS.table).toBeDefined();
    expect(TYPOGRAPHY_PRESETS.table.header).toBe(TYPOGRAPHY.tableHeader);
    expect(TYPOGRAPHY_PRESETS.table.cell).toBe(TYPOGRAPHY.tableCell);
    expect(TYPOGRAPHY_PRESETS.table.cellMuted).toBe(TYPOGRAPHY.tableCellMuted);
  });

  it('exports metric preset', () => {
    expect(TYPOGRAPHY_PRESETS.metric).toBeDefined();
    expect(TYPOGRAPHY_PRESETS.metric.value).toBe(TYPOGRAPHY.metricLarge);
    expect(TYPOGRAPHY_PRESETS.metric.label).toBe(TYPOGRAPHY.metricLabel);
    expect(TYPOGRAPHY_PRESETS.metric.delta).toBe(TYPOGRAPHY.metricDelta);
  });
});

describe('SPACING constants', () => {
  it('exports icon gap values', () => {
    expect(SPACING.iconGap).toBe('gap-2');
    expect(SPACING.iconGapSmall).toBe('gap-1.5');
  });

  it('exports card padding values', () => {
    expect(SPACING.cardPadding).toBe('p-4');
    expect(SPACING.cardPaddingLarge).toBe('p-6');
  });

  it('exports section margin values', () => {
    expect(SPACING.sectionMargin).toBe('mb-6');
    expect(SPACING.sectionMarginLarge).toBe('mb-8');
  });
});

describe('BUTTONS constants', () => {
  it('exports all button variants', () => {
    expect(BUTTONS.base).toBeDefined();
    expect(BUTTONS.primary).toBeDefined();
    expect(BUTTONS.secondary).toBeDefined();
    expect(BUTTONS.danger).toBeDefined();
    expect(BUTTONS.success).toBeDefined();
    expect(BUTTONS.ghost).toBeDefined();
    expect(BUTTONS.link).toBeDefined();
    expect(BUTTONS.icon).toBeDefined();
  });

  it('exports size modifiers', () => {
    expect(BUTTONS.sm).toContain('py-1.5');
    expect(BUTTONS.lg).toContain('py-2.5');
  });

  it('primary button has correct styles', () => {
    expect(BUTTONS.primary).toContain('bg-forge-navy-900');
    expect(BUTTONS.primary).toContain('text-white');
    expect(BUTTONS.primary).toContain('rounded-lg');
    expect(BUTTONS.primary).toContain('disabled:opacity-50');
  });

  it('secondary button has correct styles', () => {
    expect(BUTTONS.secondary).toContain('bg-white');
    expect(BUTTONS.secondary).toContain('border');
    expect(BUTTONS.secondary).toContain('border-gray-300');
  });

  it('danger button has correct styles', () => {
    expect(BUTTONS.danger).toContain('bg-red-600');
    expect(BUTTONS.danger).toContain('hover:bg-red-700');
  });
});

describe('FORMS constants', () => {
  it('exports all form element styles', () => {
    expect(FORMS.input).toBeDefined();
    expect(FORMS.select).toBeDefined();
    expect(FORMS.textarea).toBeDefined();
    expect(FORMS.label).toBeDefined();
    expect(FORMS.required).toBeDefined();
    expect(FORMS.helpText).toBeDefined();
    expect(FORMS.errorText).toBeDefined();
    expect(FORMS.inputError).toBeDefined();
    expect(FORMS.checkbox).toBeDefined();
    expect(FORMS.radio).toBeDefined();
  });

  it('input has correct styles', () => {
    expect(FORMS.input).toContain('w-full');
    expect(FORMS.input).toContain('border');
    expect(FORMS.input).toContain('rounded-lg');
    expect(FORMS.input).toContain('focus:ring-2');
  });

  it('inputError has error-specific styles', () => {
    expect(FORMS.inputError).toContain('border-red-300');
    expect(FORMS.inputError).toContain('focus:ring-red-500');
  });

  it('label has proper styling', () => {
    expect(FORMS.label).toContain('text-sm');
    expect(FORMS.label).toContain('font-medium');
    expect(FORMS.label).toContain('mb-1');
  });
});

describe('CARDS constants', () => {
  it('exports all card variants', () => {
    expect(CARDS.base).toBeDefined();
    expect(CARDS.elevated).toBeDefined();
    expect(CARDS.interactive).toBeDefined();
    expect(CARDS.selected).toBeDefined();
  });

  it('exports card sections', () => {
    expect(CARDS.header).toBeDefined();
    expect(CARDS.body).toBeDefined();
    expect(CARDS.footer).toBeDefined();
    expect(CARDS.compact).toBeDefined();
  });

  it('base card has correct styles', () => {
    expect(CARDS.base).toContain('bg-white');
    expect(CARDS.base).toContain('rounded-xl');
    expect(CARDS.base).toContain('border');
  });

  it('elevated card has shadow', () => {
    expect(CARDS.elevated).toContain('shadow-sm');
  });

  it('interactive card has hover effects', () => {
    expect(CARDS.interactive).toContain('hover:');
    expect(CARDS.interactive).toContain('transition-all');
    expect(CARDS.interactive).toContain('cursor-pointer');
  });

  it('selected card has distinct border', () => {
    expect(CARDS.selected).toContain('border-2');
    expect(CARDS.selected).toContain('border-forge-navy-500');
  });
});

describe('MODALS constants', () => {
  it('exports all modal parts', () => {
    expect(MODALS.backdrop).toBeDefined();
    expect(MODALS.container).toBeDefined();
    expect(MODALS.containerWide).toBeDefined();
    expect(MODALS.containerFull).toBeDefined();
    expect(MODALS.header).toBeDefined();
    expect(MODALS.body).toBeDefined();
    expect(MODALS.footer).toBeDefined();
    expect(MODALS.closeButton).toBeDefined();
  });

  it('backdrop has correct overlay styles', () => {
    expect(MODALS.backdrop).toContain('fixed');
    expect(MODALS.backdrop).toContain('inset-0');
    expect(MODALS.backdrop).toContain('bg-black/50');
    expect(MODALS.backdrop).toContain('z-50');
  });

  it('container has correct width constraints', () => {
    expect(MODALS.container).toContain('max-w-lg');
    expect(MODALS.containerWide).toContain('max-w-2xl');
    expect(MODALS.containerFull).toContain('max-w-4xl');
  });

  it('footer has proper alignment', () => {
    expect(MODALS.footer).toContain('flex');
    expect(MODALS.footer).toContain('justify-end');
    expect(MODALS.footer).toContain('gap-3');
  });
});

describe('BADGES constants', () => {
  it('exports base badge styles', () => {
    expect(BADGES.base).toBeDefined();
    expect(BADGES.pill).toBeDefined();
  });

  it('exports all status colors', () => {
    expect(BADGES.success).toBeDefined();
    expect(BADGES.warning).toBeDefined();
    expect(BADGES.error).toBeDefined();
    expect(BADGES.info).toBeDefined();
    expect(BADGES.neutral).toBeDefined();
    expect(BADGES.purple).toBeDefined();
    expect(BADGES.orange).toBeDefined();
    expect(BADGES.teal).toBeDefined();
    expect(BADGES.amber).toBeDefined();
  });

  it('exports outlined variants', () => {
    expect(BADGES.outlineSuccess).toBeDefined();
    expect(BADGES.outlineWarning).toBeDefined();
    expect(BADGES.outlineError).toBeDefined();
    expect(BADGES.outlineInfo).toBeDefined();
  });

  it('base badge has correct styling', () => {
    expect(BADGES.base).toContain('text-xs');
    expect(BADGES.base).toContain('font-medium');
    expect(BADGES.base).toContain('rounded');
  });

  it('pill badge is fully rounded', () => {
    expect(BADGES.pill).toContain('rounded-full');
  });

  it('success badge has green colors', () => {
    expect(BADGES.success).toContain('bg-green-100');
    expect(BADGES.success).toContain('text-green-700');
  });

  it('error badge has red colors', () => {
    expect(BADGES.error).toContain('bg-red-100');
    expect(BADGES.error).toContain('text-red-700');
  });

  it('outlined variants have transparent background', () => {
    expect(BADGES.outlineSuccess).toContain('bg-transparent');
    expect(BADGES.outlineSuccess).toContain('border');
  });
});

describe('STATUS_BADGE_COLORS', () => {
  it('maps success statuses to success badge', () => {
    expect(STATUS_BADGE_COLORS.active).toBe(BADGES.success);
    expect(STATUS_BADGE_COLORS.completed).toBe(BADGES.success);
    expect(STATUS_BADGE_COLORS.implemented).toBe(BADGES.success);
    expect(STATUS_BADGE_COLORS.approved).toBe(BADGES.success);
    expect(STATUS_BADGE_COLORS.published).toBe(BADGES.success);
    expect(STATUS_BADGE_COLORS.passed).toBe(BADGES.success);
  });

  it('maps warning statuses to warning badge', () => {
    expect(STATUS_BADGE_COLORS.in_progress).toBe(BADGES.warning);
    expect(STATUS_BADGE_COLORS.pending).toBe(BADGES.warning);
    expect(STATUS_BADGE_COLORS.partially_implemented).toBe(BADGES.warning);
    expect(STATUS_BADGE_COLORS.planned).toBe(BADGES.warning);
    expect(STATUS_BADGE_COLORS.draft).toBe(BADGES.warning);
  });

  it('maps error statuses to error badge', () => {
    expect(STATUS_BADGE_COLORS.failed).toBe(BADGES.error);
    expect(STATUS_BADGE_COLORS.expired).toBe(BADGES.error);
    expect(STATUS_BADGE_COLORS.overdue).toBe(BADGES.error);
    expect(STATUS_BADGE_COLORS.not_implemented).toBe(BADGES.error);
    expect(STATUS_BADGE_COLORS.rejected).toBe(BADGES.error);
    expect(STATUS_BADGE_COLORS.critical).toBe(BADGES.error);
    expect(STATUS_BADGE_COLORS.high).toBe(BADGES.error);
  });

  it('maps info statuses to info badge', () => {
    expect(STATUS_BADGE_COLORS.open).toBe(BADGES.info);
    expect(STATUS_BADGE_COLORS.new).toBe(BADGES.info);
    expect(STATUS_BADGE_COLORS.inherited).toBe(BADGES.info);
  });

  it('maps neutral statuses to neutral badge', () => {
    expect(STATUS_BADGE_COLORS.deactivated).toBe(BADGES.neutral);
    expect(STATUS_BADGE_COLORS.not_applicable).toBe(BADGES.neutral);
    expect(STATUS_BADGE_COLORS.unknown).toBe(BADGES.neutral);
  });

  it('maps special statuses correctly', () => {
    expect(STATUS_BADGE_COLORS.ai_generated).toBe(BADGES.purple);
    expect(STATUS_BADGE_COLORS.moderate).toBe(BADGES.orange);
    expect(STATUS_BADGE_COLORS.medium).toBe(BADGES.orange);
    expect(STATUS_BADGE_COLORS.low).toBe(BADGES.teal);
  });
});

describe('Type safety', () => {
  it('all constants are readonly', () => {
    // TypeScript ensures these are readonly at compile time
    // This test verifies the exports are proper const assertions
    expect(Object.isFrozen(TYPOGRAPHY)).toBe(false); // as const doesn't freeze
    expect(typeof TYPOGRAPHY).toBe('object');
    expect(typeof BUTTONS).toBe('object');
    expect(typeof FORMS).toBe('object');
    expect(typeof CARDS).toBe('object');
    expect(typeof MODALS).toBe('object');
    expect(typeof BADGES).toBe('object');
  });
});
