/**
 * OSCAL Export Tests
 * Tests for OSCAL SSP generation and validation
 */
import { describe, it, expect } from 'vitest';
import {
  generateOscalSSP,
  generateValidatedOscalSSP,
  oscalToJson,
  oscalToXml,
} from './oscalExport';
import type { SSPData } from '../types';

describe('OSCAL Export', () => {
  // Minimal valid SSP data
  const minimalSSPData: SSPData = {
    sysName: 'Test System',
    sysAcronym: 'TSYS',
    sysDesc: 'A test system for unit testing',
    conf: 'moderate',
    integ: 'moderate',
    avail: 'low',
  };

  // Complete SSP data for comprehensive tests
  const completeSSPData: SSPData = {
    sysName: 'Enterprise Resource Planning System',
    sysAcronym: 'ERPS',
    sysDesc: 'Enterprise resource planning system for agency operations',
    fismaId: 'FISMA-2024-001',
    fedrampId: 'FR-2024-0001',
    owningAgency: 'Department of Testing',
    agencyComp: 'DOT',
    conf: 'moderate',
    integ: 'moderate',
    avail: 'moderate',
    authType: 'ATO',
    authDuration: '3 years',
    cloudModel: 'IaaS',
    deployModel: 'hybrid',
    opDate: '2024-01-15',
    soName: 'Jane Smith',
    soEmail: 'jane.smith@example.gov',
    aoName: 'John Doe',
    aoEmail: 'john.doe@example.gov',
    issoName: 'Bob Wilson',
    issoEmail: 'bob.wilson@example.gov',
    bndNarr: 'The system boundary includes all cloud infrastructure and on-premise servers.',
    netNarr: 'Three-tier architecture with DMZ, application, and database tiers.',
    dfNarr: 'Data flows from users through load balancers to application servers.',
    infoTypes: [
      { name: 'PII', nistId: 'C.3.5.1', c: 'moderate', i: 'moderate', a: 'low' },
      { name: 'Financial Data', nistId: 'D.4.1', c: 'high', i: 'moderate', a: 'moderate' },
    ],
    bndComps: [
      { name: 'Web Server', type: 'software', purpose: 'Serves web application', zone: 'DMZ' },
      { name: 'Database Server', type: 'software', purpose: 'Stores application data', zone: 'Internal' },
    ],
    sepDutyMatrix: [
      { role: 'System Administrator', access: 'Full system access', justification: 'Required for system maintenance' },
      { role: 'Database Administrator', access: 'Database access only', justification: 'Required for database management' },
    ],
    ctrlData: {
      'AC-1': { status: 'implemented', implementation: 'Access control policy is documented and reviewed annually.' },
      'AC-2': { status: 'partial', implementation: 'Account management procedures are in place.' },
      'AU-1': { status: 'planned', implementation: 'Audit policy will be implemented in Q2.' },
    },
  };

  describe('generateOscalSSP', () => {
    it('should generate valid OSCAL SSP structure with minimal data', () => {
      const result = generateOscalSSP({ data: minimalSSPData });

      // Check top-level structure
      expect(result).toHaveProperty('system-security-plan');
      const ssp = result['system-security-plan'];

      // Check required components
      expect(ssp).toHaveProperty('uuid');
      expect(ssp).toHaveProperty('metadata');
      expect(ssp).toHaveProperty('import-profile');
      expect(ssp).toHaveProperty('system-characteristics');
      expect(ssp).toHaveProperty('system-implementation');
      expect(ssp).toHaveProperty('control-implementation');
    });

    it('should include correct metadata', () => {
      const result = generateOscalSSP({
        data: completeSSPData,
        documentTitle: 'Test SSP',
        orgName: 'Test Org',
        version: '2.0',
      });

      const metadata = result['system-security-plan'].metadata;

      expect(metadata.title).toBe('Test SSP');
      expect(metadata.version).toBe('2.0');
      expect(metadata['oscal-version']).toBe('1.1.2');
      expect(metadata).toHaveProperty('last-modified');
      expect(metadata.roles).toBeInstanceOf(Array);
      expect(metadata.roles!.length).toBeGreaterThan(0);
    });

    it('should include system characteristics with correct impact levels', () => {
      const result = generateOscalSSP({ data: completeSSPData });
      const sysChars = result['system-security-plan']['system-characteristics'];

      expect(sysChars['system-name']).toBe('Enterprise Resource Planning System');
      expect(sysChars['system-name-short']).toBe('ERPS');
      expect(sysChars.description).toContain('Enterprise resource planning');
      expect(sysChars['security-sensitivity-level']).toBe('moderate');

      // Check security impact level
      const impactLevel = sysChars['security-impact-level'];
      expect(impactLevel['security-objective-confidentiality']).toBe('moderate');
      expect(impactLevel['security-objective-integrity']).toBe('moderate');
      expect(impactLevel['security-objective-availability']).toBe('moderate');
    });

    it('should include information types', () => {
      const result = generateOscalSSP({ data: completeSSPData });
      const sysInfo = result['system-security-plan']['system-characteristics']['system-information'];
      const infoTypes = sysInfo['information-types'];

      expect(infoTypes).toBeInstanceOf(Array);
      expect(infoTypes.length).toBe(2);
      expect(infoTypes[0].title).toBe('PII');
      expect(infoTypes[1].title).toBe('Financial Data');
    });

    it('should include system IDs', () => {
      const result = generateOscalSSP({ data: completeSSPData });
      const systemIds = result['system-security-plan']['system-characteristics']['system-ids'];

      expect(systemIds).toBeInstanceOf(Array);
      expect(systemIds!.length).toBeGreaterThan(0);
      expect(systemIds![0].id).toBe('FISMA-2024-001');
    });

    it('should generate UUID for system ID when not provided', () => {
      const result = generateOscalSSP({ data: minimalSSPData });
      const systemIds = result['system-security-plan']['system-characteristics']['system-ids'];

      expect(systemIds).toBeInstanceOf(Array);
      expect(systemIds!.length).toBe(1);
      // Should be a UUID format
      expect(systemIds![0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should include control implementations', () => {
      const result = generateOscalSSP({ data: completeSSPData });
      const ctrlImpl = result['system-security-plan']['control-implementation'];

      expect(ctrlImpl).toHaveProperty('description');
      expect(ctrlImpl).toHaveProperty('implemented-requirements');
      expect(ctrlImpl['implemented-requirements']).toBeInstanceOf(Array);
      expect(ctrlImpl['implemented-requirements'].length).toBe(3);
    });

    it('should map control statuses correctly', () => {
      const result = generateOscalSSP({ data: completeSSPData });
      const requirements = result['system-security-plan']['control-implementation']['implemented-requirements'];

      // Find AC-1 (implemented)
      const ac1 = requirements.find(r => r['control-id'] === 'ac-1');
      expect(ac1).toBeDefined();
      expect(ac1!['by-components']?.[0]['implementation-status']?.state).toBe('implemented');

      // Find AC-2 (partial)
      const ac2 = requirements.find(r => r['control-id'] === 'ac-2');
      expect(ac2).toBeDefined();
      expect(ac2!['by-components']?.[0]['implementation-status']?.state).toBe('partial');

      // Find AU-1 (planned)
      const au1 = requirements.find(r => r['control-id'] === 'au-1');
      expect(au1).toBeDefined();
      expect(au1!['by-components']?.[0]['implementation-status']?.state).toBe('planned');
    });

    it('should include personnel parties', () => {
      const result = generateOscalSSP({ data: completeSSPData });
      const parties = result['system-security-plan'].metadata.parties;

      expect(parties).toBeInstanceOf(Array);
      // Should have org + SO + AO + ISSO
      expect(parties!.length).toBeGreaterThanOrEqual(4);

      // Check for specific people
      const soParty = parties!.find(p => p.name === 'Jane Smith');
      expect(soParty).toBeDefined();
      expect(soParty!.type).toBe('person');
      expect(soParty!['email-addresses']).toContain('jane.smith@example.gov');
    });

    it('should include components from boundary', () => {
      const result = generateOscalSSP({ data: completeSSPData });
      const components = result['system-security-plan']['system-implementation'].components;

      expect(components).toBeInstanceOf(Array);
      // Should have this-system + 2 boundary components
      expect(components.length).toBeGreaterThanOrEqual(3);

      const webServer = components.find(c => c.title === 'Web Server');
      expect(webServer).toBeDefined();
      expect(webServer!.type).toBe('software');
    });
  });

  describe('generateValidatedOscalSSP', () => {
    it('should return success for valid SSP', () => {
      const result = generateValidatedOscalSSP({ data: completeSSPData });

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.validation.valid).toBe(true);
      expect(result.validation.errors).toHaveLength(0);
    });

    it('should return success for minimal SSP', () => {
      const result = generateValidatedOscalSSP({ data: minimalSSPData });

      // Even minimal data should produce valid OSCAL
      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
    });

    it('should include formatted errors and warnings', () => {
      const result = generateValidatedOscalSSP({ data: completeSSPData });

      expect(result).toHaveProperty('formattedErrors');
      expect(result).toHaveProperty('formattedWarnings');
      expect(result).toHaveProperty('summary');
      expect(result.formattedErrors).toBeInstanceOf(Array);
      expect(result.formattedWarnings).toBeInstanceOf(Array);
    });

    it('should handle empty SSP data', () => {
      const result = generateValidatedOscalSSP({ data: {} });

      // Should still produce a document (with defaults)
      expect(result.document).toBeDefined();
      expect(result.document['system-security-plan']).toBeDefined();
    });
  });

  describe('oscalToJson', () => {
    it('should convert OSCAL document to formatted JSON string', () => {
      const doc = generateOscalSSP({ data: minimalSSPData });
      const json = oscalToJson(doc);

      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('system-security-plan');
    });

    it('should produce valid indented JSON', () => {
      const doc = generateOscalSSP({ data: minimalSSPData });
      const json = oscalToJson(doc);

      // Should be indented (multi-line)
      expect(json).toContain('\n');
      expect(json.split('\n').length).toBeGreaterThan(10);
    });
  });

  describe('oscalToXml', () => {
    it('should convert OSCAL document to XML string', () => {
      const doc = generateOscalSSP({ data: minimalSSPData });
      const xml = oscalToXml(doc);

      expect(typeof xml).toBe('string');
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('encoding="UTF-8"');
      expect(xml).toContain('<system-security-plan');
      expect(xml).toContain('xmlns="http://csrc.nist.gov/ns/oscal/1.0"');
    });

    it('should include UUID as attribute', () => {
      const doc = generateOscalSSP({ data: minimalSSPData });
      const xml = oscalToXml(doc);

      // UUID should be an attribute on the root element
      expect(xml).toMatch(/<system-security-plan[^>]+uuid="/);
    });

    it('should include all major sections', () => {
      const doc = generateOscalSSP({ data: completeSSPData });
      const xml = oscalToXml(doc);

      expect(xml).toContain('<metadata>');
      expect(xml).toContain('<import-profile');
      expect(xml).toContain('<system-characteristics>');
      expect(xml).toContain('<system-implementation>');
      expect(xml).toContain('<control-implementation>');
    });

    it('should convert array elements to singular names', () => {
      const doc = generateOscalSSP({ data: completeSSPData });
      const xml = oscalToXml(doc);

      // Arrays should use singular element names
      expect(xml).toContain('<role');
      expect(xml).toContain('<party');
      expect(xml).toContain('<component');
      expect(xml).toContain('<implemented-requirement');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in text fields', () => {
      const dataWithSpecialChars: SSPData = {
        sysName: 'Test & Dev <System>',
        sysDesc: 'Description with "quotes" and \'apostrophes\'',
        conf: 'moderate',
        integ: 'moderate',
        avail: 'moderate',
      };

      const result = generateOscalSSP({ data: dataWithSpecialChars });
      expect(result['system-security-plan']['system-characteristics']['system-name']).toBe('Test & Dev <System>');

      // XML should escape special characters (ampersand and less-than at minimum)
      const xml = oscalToXml(result);
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      // Note: > doesn't always need escaping in XML content, so we don't test for &gt;
    });

    it('should handle very long descriptions', () => {
      const longDesc = 'A'.repeat(10000);
      const dataWithLongDesc: SSPData = {
        sysName: 'Long Description System',
        sysDesc: longDesc,
        conf: 'low',
        integ: 'low',
        avail: 'low',
      };

      const result = generateOscalSSP({ data: dataWithLongDesc });
      expect(result['system-security-plan']['system-characteristics'].description.length).toBe(10000);
    });

    it('should handle unicode characters', () => {
      const dataWithUnicode: SSPData = {
        sysName: 'Sistema de Prueba \u2013 Test',
        sysDesc: 'Description with emojis and unicode',
        soName: 'Jose Garcia',
        conf: 'moderate',
        integ: 'moderate',
        avail: 'moderate',
      };

      const result = generateOscalSSP({ data: dataWithUnicode });
      expect(result['system-security-plan']['system-characteristics']['system-name']).toContain('\u2013');
    });
  });
});
