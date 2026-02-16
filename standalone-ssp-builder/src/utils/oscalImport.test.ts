/**
 * OSCAL Import Tests
 * Tests for OSCAL SSP parsing and validation
 */
import { describe, it, expect } from 'vitest';
import {
  importOscalSSP,
  isValidOscalFile,
} from './oscalImport';

// Helper to create a mock File object
function createMockFile(content: string, name: string, type: string): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

describe('OSCAL Import', () => {
  // Sample OSCAL SSP JSON document
  const sampleOscalJson = {
    'system-security-plan': {
      uuid: '12345678-1234-4123-8123-123456789012',
      metadata: {
        title: 'Test System SSP',
        'last-modified': '2024-01-15T10:00:00Z',
        version: '1.0',
        'oscal-version': '1.1.2',
        roles: [
          { id: 'system-owner', title: 'System Owner' },
          { id: 'authorizing-official', title: 'Authorizing Official' },
        ],
        parties: [
          {
            uuid: 'party-001',
            type: 'person',
            name: 'Jane Smith',
            'email-addresses': ['jane.smith@example.gov'],
          },
          {
            uuid: 'party-002',
            type: 'person',
            name: 'John Doe',
            'email-addresses': ['john.doe@example.gov'],
          },
        ],
        'responsible-parties': [
          { 'role-id': 'system-owner', 'party-uuids': ['party-001'] },
          { 'role-id': 'authorizing-official', 'party-uuids': ['party-002'] },
        ],
      },
      'import-profile': {
        href: '#nist-sp-800-53-rev5-moderate',
      },
      'system-characteristics': {
        'system-ids': [
          { 'identifier-type': 'https://fedramp.gov', id: 'FISMA-2024-001' },
        ],
        'system-name': 'Enterprise Test System',
        'system-name-short': 'ETS',
        description: 'An enterprise test system for compliance testing.',
        props: [
          { name: 'cloud-service-model', value: 'SaaS' },
          { name: 'cloud-deployment-model', value: 'public' },
        ],
        'security-sensitivity-level': 'moderate',
        'system-information': {
          'information-types': [
            {
              uuid: 'info-001',
              title: 'Personnel Information',
              description: 'Employee personal information',
              categorizations: [
                {
                  system: 'https://doi.org/10.6028/NIST.SP.800-60v2r1',
                  'information-type-ids': ['C.3.5.1'],
                },
              ],
              'confidentiality-impact': { base: 'moderate' },
              'integrity-impact': { base: 'moderate' },
              'availability-impact': { base: 'low' },
            },
          ],
        },
        'security-impact-level': {
          'security-objective-confidentiality': 'moderate',
          'security-objective-integrity': 'moderate',
          'security-objective-availability': 'low',
        },
        status: { state: 'operational' },
        'authorization-boundary': {
          description: 'The system boundary includes all cloud infrastructure.',
        },
        'network-architecture': {
          description: 'Three-tier network architecture.',
        },
        'data-flow': {
          description: 'Data flows from users to application to database.',
        },
      },
      'system-implementation': {
        users: [
          {
            uuid: 'user-001',
            title: 'System Administrator',
            description: 'Manages system configuration',
            'authorized-privileges': [
              {
                title: 'Admin Access',
                'functions-performed': ['System configuration', 'User management'],
              },
            ],
          },
        ],
        components: [
          {
            uuid: 'comp-001',
            type: 'this-system',
            title: 'Enterprise Test System',
            description: 'The primary system',
            status: { state: 'operational' },
          },
          {
            uuid: 'comp-002',
            type: 'software',
            title: 'Web Application',
            description: 'Frontend web application',
            status: { state: 'operational' },
            props: [{ name: 'security-zone', value: 'DMZ' }],
          },
        ],
      },
      'control-implementation': {
        description: 'Control implementation for the system',
        'implemented-requirements': [
          {
            uuid: 'req-001',
            'control-id': 'ac-1',
            'by-components': [
              {
                'component-uuid': 'comp-001',
                uuid: 'bc-001',
                description: 'Access control policy is documented.',
                'implementation-status': { state: 'implemented' },
              },
            ],
          },
          {
            uuid: 'req-002',
            'control-id': 'ac-2',
            'by-components': [
              {
                'component-uuid': 'comp-001',
                uuid: 'bc-002',
                description: 'Account management procedures.',
                'implementation-status': { state: 'partial' },
              },
            ],
          },
        ],
      },
    },
  };

  describe('isValidOscalFile', () => {
    it('should accept JSON files', () => {
      const file = createMockFile('{}', 'test.json', 'application/json');
      expect(isValidOscalFile(file)).toBe(true);
    });

    it('should accept XML files', () => {
      const file = createMockFile('<root/>', 'test.xml', 'application/xml');
      expect(isValidOscalFile(file)).toBe(true);
    });

    it('should accept text/xml files', () => {
      const file = createMockFile('<root/>', 'test.xml', 'text/xml');
      expect(isValidOscalFile(file)).toBe(true);
    });

    it('should accept .oscal extension', () => {
      const file = createMockFile('{}', 'test.oscal', '');
      expect(isValidOscalFile(file)).toBe(true);
    });

    it('should reject other file types', () => {
      const file = createMockFile('test', 'test.txt', 'text/plain');
      expect(isValidOscalFile(file)).toBe(false);
    });

    it('should reject PDF files', () => {
      const file = createMockFile('%PDF', 'test.pdf', 'application/pdf');
      expect(isValidOscalFile(file)).toBe(false);
    });
  });

  describe('importOscalSSP - JSON', () => {
    it('should import valid OSCAL JSON', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.success).toBe(true);
      expect(result.sourceFormat).toBe('json');
      expect(result.data).toBeDefined();
    });

    it('should extract system name and description', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.data?.sysName).toBe('Enterprise Test System');
      expect(result.data?.sysAcronym).toBe('ETS');
      expect(result.data?.sysDesc).toContain('enterprise test system');
    });

    it('should extract impact levels', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.data?.conf).toBe('moderate');
      expect(result.data?.integ).toBe('moderate');
      expect(result.data?.avail).toBe('low');
    });

    it('should extract FedRAMP ID from fedramp identifier-type', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      // The sample has identifier-type 'https://fedramp.gov', so it extracts as fedrampId
      expect(result.data?.fedrampId).toBe('FISMA-2024-001');
    });

    it('should extract information types', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.data?.infoTypes).toBeInstanceOf(Array);
      expect(result.data?.infoTypes?.length).toBe(1);
      expect(result.data?.infoTypes?.[0].name).toBe('Personnel Information');
      expect(result.data?.infoTypes?.[0].nistId).toBe('C.3.5.1');
    });

    it('should extract boundary/network/dataflow narratives', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.data?.bndNarr).toContain('cloud infrastructure');
      expect(result.data?.netNarr).toContain('Three-tier');
      expect(result.data?.dfNarr).toContain('Data flows');
    });

    it('should extract personnel from parties', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.data?.soName).toBe('Jane Smith');
      expect(result.data?.soEmail).toBe('jane.smith@example.gov');
      expect(result.data?.aoName).toBe('John Doe');
      expect(result.data?.aoEmail).toBe('john.doe@example.gov');
    });

    it('should extract control implementations', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.data?.ctrlData).toBeDefined();
      expect(result.data?.ctrlData?.['AC-1']).toBeDefined();
      expect(result.data?.ctrlData?.['AC-1'].status).toBe('implemented');
      expect(result.data?.ctrlData?.['AC-2'].status).toBe('partial');
    });

    it('should extract separation of duties from users', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.data?.sepDutyMatrix).toBeInstanceOf(Array);
      expect(result.data?.sepDutyMatrix?.length).toBe(1);
      expect(result.data?.sepDutyMatrix?.[0].role).toBe('System Administrator');
    });

    it('should extract boundary components', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.data?.bndComps).toBeInstanceOf(Array);
      // Should have at least the non-this-system component
      const webApp = result.data?.bndComps?.find(c => c.name === 'Web Application');
      expect(webApp).toBeDefined();
      expect(webApp?.zone).toBe('DMZ');
    });

    it('should include document info', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'test.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.documentInfo.title).toBe('Test System SSP');
      expect(result.documentInfo.version).toBe('1.0');
      expect(result.documentInfo.oscalVersion).toBe('1.1.2');
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalOscal = {
        'system-security-plan': {
          uuid: '12345678-1234-4123-8123-123456789012',
          metadata: {
            title: 'Minimal SSP',
            'last-modified': '2024-01-15T10:00:00Z',
            version: '1.0',
            'oscal-version': '1.1.2',
          },
          'import-profile': { href: '#profile' },
          'system-characteristics': {
            'system-ids': [{ id: 'MIN-001' }],
            'system-name': 'Minimal System',
            description: 'Minimal description',
            'security-impact-level': {
              'security-objective-confidentiality': 'low',
              'security-objective-integrity': 'low',
              'security-objective-availability': 'low',
            },
            status: { state: 'under-development' },
            'authorization-boundary': { description: 'TBD' },
          },
          'system-implementation': {
            users: [],
            components: [],
          },
          'control-implementation': {
            description: 'TBD',
            'implemented-requirements': [],
          },
        },
      };

      const jsonString = JSON.stringify(minimalOscal);
      const file = createMockFile(jsonString, 'minimal.json', 'application/json');

      const result = await importOscalSSP(file);

      expect(result.success).toBe(true);
      expect(result.data?.sysName).toBe('Minimal System');
      expect(result.data?.conf).toBe('low');
    });

    it('should reject invalid JSON', async () => {
      const file = createMockFile('not valid json {{{', 'bad.json', 'application/json');

      await expect(importOscalSSP(file)).rejects.toThrow();
    });

    it('should reject JSON without system-security-plan', async () => {
      const invalidOscal = { 'some-other-key': {} };
      const jsonString = JSON.stringify(invalidOscal);
      const file = createMockFile(jsonString, 'invalid.json', 'application/json');

      await expect(importOscalSSP(file)).rejects.toThrow('system-security-plan');
    });
  });

  // Note: parseOscalXml is an internal function, tested via importOscalSSP with XML files);

  describe('importOscalSSP - XML', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<system-security-plan xmlns="http://csrc.nist.gov/ns/oscal/1.0" uuid="12345678-1234-4123-8123-123456789012">
  <metadata>
    <title>XML Import Test</title>
    <last-modified>2024-01-15T10:00:00Z</last-modified>
    <version>1.0</version>
    <oscal-version>1.1.2</oscal-version>
  </metadata>
  <import-profile href="#profile"/>
  <system-characteristics>
    <system-id>XML-FISMA-001</system-id>
    <system-name>XML Import System</system-name>
    <system-name-short>XIS</system-name-short>
    <description>A system imported from XML format</description>
    <security-impact-level>
      <security-objective-confidentiality>high</security-objective-confidentiality>
      <security-objective-integrity>moderate</security-objective-integrity>
      <security-objective-availability>moderate</security-objective-availability>
    </security-impact-level>
    <status state="operational"/>
    <authorization-boundary>
      <description>The boundary includes all cloud resources.</description>
    </authorization-boundary>
  </system-characteristics>
  <system-implementation>
    <user uuid="u1"><title>Admin</title></user>
    <component uuid="c1" type="this-system">
      <title>Main System</title>
      <description>The system</description>
      <status state="operational"/>
    </component>
  </system-implementation>
  <control-implementation>
    <description>Controls</description>
    <implemented-requirement uuid="r1" control-id="ac-1"/>
  </control-implementation>
</system-security-plan>`;

    it('should import valid OSCAL XML', async () => {
      const file = createMockFile(sampleXml, 'test.xml', 'application/xml');

      const result = await importOscalSSP(file);

      expect(result.success).toBe(true);
      expect(result.sourceFormat).toBe('xml');
      expect(result.data).toBeDefined();
    });

    it('should extract system info from XML', async () => {
      const file = createMockFile(sampleXml, 'test.xml', 'application/xml');

      const result = await importOscalSSP(file);

      expect(result.data?.sysName).toBe('XML Import System');
      expect(result.data?.sysAcronym).toBe('XIS');
    });

    it('should extract impact levels from XML', async () => {
      const file = createMockFile(sampleXml, 'test.xml', 'application/xml');

      const result = await importOscalSSP(file);

      expect(result.data?.conf).toBe('high');
      expect(result.data?.integ).toBe('moderate');
      expect(result.data?.avail).toBe('moderate');
    });
  });

  describe('Round-trip Import/Export', () => {
    // This test imports, then would need export to complete the round-trip
    // We're testing just the import side here
    it('should preserve data through import', async () => {
      const jsonString = JSON.stringify(sampleOscalJson);
      const file = createMockFile(jsonString, 'roundtrip.json', 'application/json');

      const result = await importOscalSSP(file);

      // Key fields should be preserved
      expect(result.data?.sysName).toBe('Enterprise Test System');
      expect(result.data?.conf).toBe('moderate');
      expect(result.data?.bndNarr).toContain('cloud infrastructure');
      expect(result.data?.ctrlData?.['AC-1']).toBeDefined();
    });
  });
});
