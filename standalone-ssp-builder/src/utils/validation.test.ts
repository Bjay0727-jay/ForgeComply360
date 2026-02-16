/**
 * Validation Utility Tests
 * Tests for ForgeComply 360 Reporter SSP validation
 */
import { describe, it, expect } from 'vitest';
import {
  REQUIRED_FIELDS,
  FIELD_LABELS,
  validateSSP,
  getSectionErrors,
  hasFieldError,
  getFieldError,
  formatValidationSummary,
} from './validation';
import type { SSPData } from '../types';

describe('REQUIRED_FIELDS Configuration', () => {
  it('should define required fields for key sections', () => {
    expect(REQUIRED_FIELDS).toHaveProperty('system_info');
    expect(REQUIRED_FIELDS).toHaveProperty('fips_199');
    expect(REQUIRED_FIELDS).toHaveProperty('control_baseline');
    expect(REQUIRED_FIELDS).toHaveProperty('personnel');
  });

  it('should require system name and acronym', () => {
    const systemInfo = REQUIRED_FIELDS.system_info;
    const fields = systemInfo.map((f) => f.field);

    expect(fields).toContain('sysName');
    expect(fields).toContain('sysAcronym');
    expect(fields).toContain('owningAgency');
  });

  it('should require FIPS 199 categorization levels', () => {
    const fips199 = REQUIRED_FIELDS.fips_199;
    const fields = fips199.map((f) => f.field);

    expect(fields).toContain('conf');
    expect(fields).toContain('integ');
    expect(fields).toContain('avail');
  });

  it('should have labels for all required fields', () => {
    for (const fields of Object.values(REQUIRED_FIELDS)) {
      for (const { label } of fields) {
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('FIELD_LABELS', () => {
  it('should have labels for key fields', () => {
    expect(FIELD_LABELS.sysName).toBe('System Name');
    expect(FIELD_LABELS.sysAcronym).toBe('System Acronym');
    expect(FIELD_LABELS.conf).toBe('Confidentiality');
    expect(FIELD_LABELS.integ).toBe('Integrity');
    expect(FIELD_LABELS.avail).toBe('Availability');
  });

  it('should have labels for personnel fields', () => {
    expect(FIELD_LABELS.soName).toBe('System Owner Name');
    expect(FIELD_LABELS.aoName).toBe('Authorizing Official Name');
    expect(FIELD_LABELS.issoName).toBe('ISSO Name');
  });
});

describe('validateSSP', () => {
  describe('Empty Data', () => {
    it('should return errors for empty SSP data', () => {
      const emptyData: SSPData = {};
      const result = validateSSP(emptyData);

      expect(result.isValid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);
    });

    it('should identify missing required fields', () => {
      const emptyData: SSPData = {};
      const result = validateSSP(emptyData);

      // Should have errors for system_info required fields
      const sysNameError = result.errors.find((e) => e.field === 'sysName');
      expect(sysNameError).toBeDefined();
      expect(sysNameError?.message).toContain('required');
    });
  });

  describe('Partial Data', () => {
    it('should validate partial data correctly', () => {
      const partialData: SSPData = {
        sysName: 'Test System',
        sysAcronym: 'TS',
        owningAgency: 'Test Agency',
        sysDesc: 'A test system',
        authType: 'Agency',
      };
      const result = validateSSP(partialData);

      // System info should be complete
      const sysNameError = result.errors.find((e) => e.field === 'sysName');
      expect(sysNameError).toBeUndefined();

      // But FIPS 199 fields should still be missing
      const confError = result.errors.find((e) => e.field === 'conf');
      expect(confError).toBeDefined();
    });

    it('should not flag empty string as valid', () => {
      const dataWithEmpty: SSPData = {
        sysName: '',
      };
      const result = validateSSP(dataWithEmpty);

      const sysNameError = result.errors.find((e) => e.field === 'sysName');
      expect(sysNameError).toBeDefined();
    });
  });

  describe('Complete Data', () => {
    it('should pass validation for complete required data', () => {
      const completeData: SSPData = {
        // System Info
        sysName: 'Complete System',
        sysAcronym: 'CS',
        owningAgency: 'Agency',
        sysDesc: 'Description',
        authType: 'Agency ATO',
        // FIPS 199
        conf: 'Moderate',
        integ: 'Moderate',
        avail: 'Low',
        // Control Baseline
        ctrlBaseline: 'Moderate',
        // RMF
        rmfCurrentStep: 'Implement',
        // Boundary
        bndNarr: 'System boundary description',
        // Data Flow
        dfNarr: 'Data flows through the system',
        // Network
        netNarr: 'Network architecture description',
        // Personnel
        soName: 'John Doe',
        aoName: 'Jane Smith',
        issoName: 'Bob Wilson',
        // Digital Identity
        ial: 'IAL2',
        aal: 'AAL2',
        // Contingency
        rto: '24 hours',
        rpo: '4 hours',
        // IR
        irPurpose: 'Handle incidents',
        // ConMon
        iscmType: 'Continuous',
      };
      const result = validateSSP(completeData);

      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('Section Errors', () => {
    it('should track errors by section', () => {
      const emptyData: SSPData = {};
      const result = validateSSP(emptyData);

      expect(result.sectionErrors).toHaveProperty('system_info');
      expect(result.sectionErrors.system_info).toBeGreaterThan(0);
    });

    it('should not include sections with no errors', () => {
      const dataWithSystemInfo: SSPData = {
        sysName: 'Test System',
        sysAcronym: 'TS',
        owningAgency: 'Test Agency',
        sysDesc: 'Description',
        authType: 'Agency',
      };
      const result = validateSSP(dataWithSystemInfo);

      expect(result.sectionErrors).not.toHaveProperty('system_info');
    });
  });
});

describe('getSectionErrors', () => {
  it('should return errors for a specific section', () => {
    const emptyData: SSPData = {};
    const result = validateSSP(emptyData);

    const systemInfoErrors = getSectionErrors(result, 'system_info');
    expect(systemInfoErrors.length).toBeGreaterThan(0);
    expect(systemInfoErrors.every((e) => e.section === 'system_info')).toBe(true);
  });

  it('should return empty array for section with no errors', () => {
    const completeSystemInfo: SSPData = {
      sysName: 'Test',
      sysAcronym: 'T',
      owningAgency: 'Agency',
      sysDesc: 'Desc',
      authType: 'ATO',
    };
    const result = validateSSP(completeSystemInfo);

    const systemInfoErrors = getSectionErrors(result, 'system_info');
    expect(systemInfoErrors.length).toBe(0);
  });

  it('should return empty array for non-existent section', () => {
    const emptyData: SSPData = {};
    const result = validateSSP(emptyData);

    const fakeErrors = getSectionErrors(result, 'fake_section');
    expect(fakeErrors.length).toBe(0);
  });
});

describe('hasFieldError', () => {
  it('should return true for missing required field', () => {
    const emptyData: SSPData = {};
    const result = validateSSP(emptyData);

    expect(hasFieldError(result, 'sysName')).toBe(true);
  });

  it('should return false for present required field', () => {
    const dataWithName: SSPData = { sysName: 'Test' };
    const result = validateSSP(dataWithName);

    expect(hasFieldError(result, 'sysName')).toBe(false);
  });

  it('should return false for non-required field', () => {
    const emptyData: SSPData = {};
    const result = validateSSP(emptyData);

    expect(hasFieldError(result, 'fismaId')).toBe(false);
  });
});

describe('getFieldError', () => {
  it('should return error message for missing field', () => {
    const emptyData: SSPData = {};
    const result = validateSSP(emptyData);

    const error = getFieldError(result, 'sysName');
    expect(error).toBe('System Name is required');
  });

  it('should return undefined for field without error', () => {
    const dataWithName: SSPData = { sysName: 'Test' };
    const result = validateSSP(dataWithName);

    const error = getFieldError(result, 'sysName');
    expect(error).toBeUndefined();
  });
});

describe('formatValidationSummary', () => {
  it('should return success message for valid data', () => {
    const completeData: SSPData = {
      sysName: 'Complete System',
      sysAcronym: 'CS',
      owningAgency: 'Agency',
      sysDesc: 'Description',
      authType: 'Agency ATO',
      conf: 'Moderate',
      integ: 'Moderate',
      avail: 'Low',
      ctrlBaseline: 'Moderate',
      rmfCurrentStep: 'Implement',
      bndNarr: 'Boundary',
      dfNarr: 'Data flow',
      netNarr: 'Network',
      soName: 'Owner',
      aoName: 'AO',
      issoName: 'ISSO',
      ial: 'IAL2',
      aal: 'AAL2',
      rto: '24h',
      rpo: '4h',
      irPurpose: 'IR',
      iscmType: 'ISCM',
    };
    const result = validateSSP(completeData);
    const summary = formatValidationSummary(result);

    expect(summary).toBe('All required fields are complete.');
  });

  it('should return error count for invalid data', () => {
    const emptyData: SSPData = {};
    const result = validateSSP(emptyData);
    const summary = formatValidationSummary(result);

    expect(summary).toContain('required field');
    expect(summary).toContain('missing');
  });

  it('should handle singular field correctly', () => {
    // Create data missing only one field
    const almostComplete: SSPData = {
      sysName: 'System',
      sysAcronym: 'S',
      owningAgency: 'Agency',
      sysDesc: 'Desc',
      authType: 'ATO',
      conf: 'Moderate',
      integ: 'Moderate',
      avail: 'Low',
      ctrlBaseline: 'Moderate',
      rmfCurrentStep: 'Implement',
      bndNarr: 'Boundary',
      dfNarr: 'Data',
      netNarr: 'Network',
      soName: 'Owner',
      aoName: 'AO',
      issoName: 'ISSO',
      ial: 'IAL2',
      aal: 'AAL2',
      rto: '24h',
      rpo: '4h',
      // Missing irPurpose
      iscmType: 'ISCM',
    };
    const result = validateSSP(almostComplete);
    const summary = formatValidationSummary(result);

    expect(summary).toContain('1 required field');
    expect(summary).toContain('1 section');
  });
});

describe('Required Field Coverage', () => {
  it('should validate all documented sections', () => {
    const expectedSections = [
      'system_info',
      'fips_199',
      'control_baseline',
      'rmf_lifecycle',
      'authorization_boundary',
      'data_flow',
      'network_architecture',
      'personnel',
      'digital_identity',
      'contingency_plan',
      'incident_response',
      'continuous_monitoring',
    ];

    expectedSections.forEach((section) => {
      expect(REQUIRED_FIELDS, `Missing section: ${section}`).toHaveProperty(section);
    });
  });

  it('should have reasonable number of required fields per section', () => {
    for (const [section, fields] of Object.entries(REQUIRED_FIELDS)) {
      // Each section should have at least 1 required field but not too many
      expect(fields.length, `Section ${section} has no required fields`).toBeGreaterThan(0);
      expect(fields.length, `Section ${section} has too many required fields`).toBeLessThanOrEqual(5);
    }
  });
});
