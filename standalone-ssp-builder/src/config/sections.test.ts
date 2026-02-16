/**
 * Section Configuration Tests
 * Tests for ForgeComply 360 Reporter FISMA SSP section definitions
 */
import { describe, it, expect } from 'vitest';
import {
  SECTIONS,
  SECTION_GROUPS,
  RMF_STEPS,
  type Section,
  type SectionGroup,
  type SectionTag,
  type RMFStep,
} from './sections';

describe('SECTIONS Configuration', () => {
  describe('Section Structure', () => {
    it('should have 23 sections defined', () => {
      expect(SECTIONS.length).toBe(23);
    });

    it('should have all required properties for each section', () => {
      const requiredProps: (keyof Section)[] = ['id', 'label', 'icon', 'ref', 'grp', 'tag', 'rmf'];

      SECTIONS.forEach((section) => {
        requiredProps.forEach((prop) => {
          expect(section, `Section ${section.id} missing ${prop}`).toHaveProperty(prop);
        });
      });
    });

    it('should have unique section IDs', () => {
      const ids = SECTIONS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have non-empty labels', () => {
      SECTIONS.forEach((section) => {
        expect(section.label.trim().length, `Section ${section.id} has empty label`).toBeGreaterThan(0);
      });
    });

    it('should have valid emoji icons', () => {
      SECTIONS.forEach((section) => {
        expect(section.icon.length, `Section ${section.id} has no icon`).toBeGreaterThan(0);
      });
    });
  });

  describe('Section Groups', () => {
    it('should assign valid groups to all sections', () => {
      SECTIONS.forEach((section) => {
        expect(
          SECTION_GROUPS,
          `Section ${section.id} has invalid group ${section.grp}`
        ).toContain(section.grp);
      });
    });

    it('should have sections in each group', () => {
      SECTION_GROUPS.forEach((group) => {
        const sectionsInGroup = SECTIONS.filter((s) => s.grp === group);
        expect(
          sectionsInGroup.length,
          `Group ${group} has no sections`
        ).toBeGreaterThan(0);
      });
    });

    it('should have Frontmatter sections first', () => {
      const frontmatterSections = SECTIONS.filter((s) => s.grp === 'Frontmatter');
      expect(frontmatterSections.length).toBeGreaterThan(0);

      // First section should be in Frontmatter
      expect(SECTIONS[0].grp).toBe('Frontmatter');
    });

    it('should have Post-Auth sections last', () => {
      const postAuthSections = SECTIONS.filter((s) => s.grp === 'Post-Auth');
      expect(postAuthSections.length).toBeGreaterThan(0);

      // Last sections should be Post-Auth
      const lastSection = SECTIONS[SECTIONS.length - 1];
      expect(lastSection.grp).toBe('Post-Auth');
    });
  });

  describe('Section Tags', () => {
    const validTags: SectionTag[] = ['original', 'fedramp', 'fisma'];

    it('should assign valid tags to all sections', () => {
      SECTIONS.forEach((section) => {
        expect(
          validTags,
          `Section ${section.id} has invalid tag ${section.tag}`
        ).toContain(section.tag);
      });
    });

    it('should have at least one section with each tag type', () => {
      validTags.forEach((tag) => {
        const sectionsWithTag = SECTIONS.filter((s) => s.tag === tag);
        expect(
          sectionsWithTag.length,
          `No sections with tag ${tag}`
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('RMF Steps', () => {
    it('should assign valid RMF steps to all sections', () => {
      const validSteps: RMFStep[] = [...RMF_STEPS, 'All Steps'];
      SECTIONS.forEach((section) => {
        expect(
          validSteps,
          `Section ${section.id} has invalid RMF step ${section.rmf}`
        ).toContain(section.rmf);
      });
    });

    it('should have sections for each RMF step', () => {
      RMF_STEPS.forEach((step) => {
        const sectionsForStep = SECTIONS.filter((s) => s.rmf === step || s.rmf === 'All Steps');
        expect(
          sectionsForStep.length,
          `No sections for RMF step ${step}`
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('Key Sections', () => {
    it('should have System Information section', () => {
      const sysinfo = SECTIONS.find((s) => s.id === 'sysinfo');
      expect(sysinfo).toBeDefined();
      expect(sysinfo?.label).toBe('System Information');
      expect(sysinfo?.grp).toBe('Frontmatter');
    });

    it('should have FIPS 199 section', () => {
      const fips = SECTIONS.find((s) => s.id === 'fips199');
      expect(fips).toBeDefined();
      expect(fips?.label).toBe('FIPS 199 Categorization');
      expect(fips?.rmf).toBe('Categorize');
    });

    it('should have Control Baseline section', () => {
      const baseline = SECTIONS.find((s) => s.id === 'baseline');
      expect(baseline).toBeDefined();
      expect(baseline?.rmf).toBe('Select');
    });

    it('should have POA&M section', () => {
      const poam = SECTIONS.find((s) => s.id === 'poam');
      expect(poam).toBeDefined();
      expect(poam?.grp).toBe('Post-Auth');
      expect(poam?.rmf).toBe('Monitor');
    });

    it('should have Continuous Monitoring section', () => {
      const conmon = SECTIONS.find((s) => s.id === 'conmon');
      expect(conmon).toBeDefined();
      expect(conmon?.rmf).toBe('Monitor');
    });
  });

  describe('Banner Text', () => {
    it('should have banner text on select sections', () => {
      const sectionsWithBanners = SECTIONS.filter((s) => s.bannerText);
      expect(sectionsWithBanners.length).toBeGreaterThan(0);
    });

    it('should have non-empty banner text when present', () => {
      SECTIONS.forEach((section) => {
        if (section.bannerText) {
          expect(
            section.bannerText.trim().length,
            `Section ${section.id} has empty banner text`
          ).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('References', () => {
    it('should have non-empty references', () => {
      SECTIONS.forEach((section) => {
        expect(
          section.ref.trim().length,
          `Section ${section.id} has empty reference`
        ).toBeGreaterThan(0);
      });
    });

    it('should reference NIST publications or SSP sections', () => {
      SECTIONS.forEach((section) => {
        const hasValidRef =
          section.ref.includes('SP ') ||
          section.ref.includes('SSP') ||
          section.ref.includes('Appendix') ||
          section.ref.includes('FIPS') ||
          section.ref.includes('E-Gov') ||
          section.ref.includes('Family') ||
          section.ref.includes('AC-') ||
          section.ref.includes('RMF');

        expect(hasValidRef, `Section ${section.id} has unusual reference: ${section.ref}`).toBe(true);
      });
    });
  });
});

describe('SECTION_GROUPS', () => {
  it('should have 6 groups', () => {
    expect(SECTION_GROUPS.length).toBe(6);
  });

  it('should have groups in correct order', () => {
    expect(SECTION_GROUPS[0]).toBe('Frontmatter');
    expect(SECTION_GROUPS[1]).toBe('Architecture');
    expect(SECTION_GROUPS[2]).toBe('Personnel');
    expect(SECTION_GROUPS[3]).toBe('Controls');
    expect(SECTION_GROUPS[4]).toBe('Plans');
    expect(SECTION_GROUPS[5]).toBe('Post-Auth');
  });
});

describe('RMF_STEPS', () => {
  it('should have 7 RMF steps', () => {
    expect(RMF_STEPS.length).toBe(7);
  });

  it('should have steps in RMF lifecycle order', () => {
    expect(RMF_STEPS[0]).toBe('Prepare');
    expect(RMF_STEPS[1]).toBe('Categorize');
    expect(RMF_STEPS[2]).toBe('Select');
    expect(RMF_STEPS[3]).toBe('Implement');
    expect(RMF_STEPS[4]).toBe('Assess');
    expect(RMF_STEPS[5]).toBe('Authorize');
    expect(RMF_STEPS[6]).toBe('Monitor');
  });
});

describe('Section Distribution', () => {
  it('should have appropriate number of sections per group', () => {
    const groupCounts: Record<SectionGroup, number> = {
      Frontmatter: 0,
      Architecture: 0,
      Personnel: 0,
      Controls: 0,
      Plans: 0,
      'Post-Auth': 0,
    };

    SECTIONS.forEach((s) => {
      groupCounts[s.grp]++;
    });

    // Frontmatter should have several foundational sections
    expect(groupCounts.Frontmatter).toBeGreaterThanOrEqual(4);

    // Architecture should cover system topology
    expect(groupCounts.Architecture).toBeGreaterThanOrEqual(5);

    // Personnel should cover roles and identity
    expect(groupCounts.Personnel).toBeGreaterThanOrEqual(2);

    // Controls should cover main security areas
    expect(groupCounts.Controls).toBeGreaterThanOrEqual(3);

    // Plans should cover contingency and response
    expect(groupCounts.Plans).toBeGreaterThanOrEqual(3);

    // Post-Auth should cover ongoing monitoring
    expect(groupCounts['Post-Auth']).toBeGreaterThanOrEqual(2);
  });
});
