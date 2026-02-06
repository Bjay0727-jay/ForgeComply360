import { describe, it, expect } from 'vitest';
import { parseCSV, matchColumns, validateRow, ColumnMapping } from './csvParser';

describe('parseCSV', () => {
  it('parses simple CSV with headers and rows', () => {
    const csv = `name,email,age
John,john@example.com,30
Jane,jane@example.com,25`;

    const result = parseCSV(csv);

    expect(result.headers).toEqual(['name', 'email', 'age']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: 'John', email: 'john@example.com', age: '30' });
    expect(result.rows[1]).toEqual({ name: 'Jane', email: 'jane@example.com', age: '25' });
  });

  it('handles BOM prefix', () => {
    const csv = '\uFEFFname,value\nTest,123';

    const result = parseCSV(csv);

    expect(result.headers).toEqual(['name', 'value']);
    expect(result.rows[0]).toEqual({ name: 'Test', value: '123' });
  });

  it('handles quoted fields with commas', () => {
    const csv = `name,description
Product,"A product, with a comma"`;

    const result = parseCSV(csv);

    expect(result.rows[0].description).toBe('A product, with a comma');
  });

  it('handles escaped double quotes', () => {
    const csv = `name,quote
Test,"He said ""Hello"""`;

    const result = parseCSV(csv);

    expect(result.rows[0].quote).toBe('He said "Hello"');
  });

  it('handles multi-line quoted fields', () => {
    const csv = `name,notes
Item,"Line 1
Line 2
Line 3"`;

    const result = parseCSV(csv);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].notes).toBe('Line 1\nLine 2\nLine 3');
  });

  it('handles CRLF line endings', () => {
    const csv = 'name,value\r\nTest,123\r\nTest2,456';

    const result = parseCSV(csv);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: 'Test', value: '123' });
    expect(result.rows[1]).toEqual({ name: 'Test2', value: '456' });
  });

  it('returns empty arrays for empty string', () => {
    const result = parseCSV('');

    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('skips empty lines', () => {
    const csv = `name,value
Row1,1

Row2,2

Row3,3`;

    const result = parseCSV(csv);

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].name).toBe('Row1');
    expect(result.rows[1].name).toBe('Row2');
    expect(result.rows[2].name).toBe('Row3');
  });
});

describe('matchColumns', () => {
  const expectedColumns = [
    { csvName: 'Name', fieldName: 'name', required: true },
    { csvName: 'Email', fieldName: 'email', required: true },
    { csvName: 'Phone', fieldName: 'phone', required: false, aliases: ['Telephone', 'Mobile'] },
  ];

  it('matches headers case-insensitively', () => {
    const csvHeaders = ['NAME', 'EMAIL', 'phone'];

    const result = matchColumns(csvHeaders, expectedColumns);

    expect(result.matched).toHaveLength(3);
    expect(result.matched.find(m => m.fieldName === 'name')?.csvName).toBe('NAME');
    expect(result.matched.find(m => m.fieldName === 'email')?.csvName).toBe('EMAIL');
  });

  it('matches column aliases', () => {
    const csvHeaders = ['Name', 'Email', 'Mobile'];

    const result = matchColumns(csvHeaders, expectedColumns);

    expect(result.matched).toHaveLength(3);
    expect(result.matched.find(m => m.fieldName === 'phone')?.csvName).toBe('Mobile');
  });

  it('identifies unmatched CSV columns', () => {
    const csvHeaders = ['Name', 'Email', 'Phone', 'Extra', 'Unknown'];

    const result = matchColumns(csvHeaders, expectedColumns);

    expect(result.unmatched).toEqual(['Extra', 'Unknown']);
  });

  it('identifies missing required columns', () => {
    const csvHeaders = ['Name', 'Phone']; // Missing Email which is required

    const result = matchColumns(csvHeaders, expectedColumns);

    expect(result.missing).toEqual(['Email']);
  });

  it('returns empty missing array when all required present', () => {
    const csvHeaders = ['Name', 'Email'];

    const result = matchColumns(csvHeaders, expectedColumns);

    expect(result.missing).toEqual([]);
  });
});

describe('validateRow', () => {
  const mapping: ColumnMapping[] = [
    { csvName: 'Name', fieldName: 'name', required: true },
    { csvName: 'Email', fieldName: 'email', required: true },
    { csvName: 'Age', fieldName: 'age', required: false },
  ];

  it('returns data with valid row', () => {
    const row = { Name: 'John', Email: 'john@test.com', Age: '30' };
    const validators = {};

    const result = validateRow(row, mapping, validators);

    expect(result.errors).toHaveLength(0);
    expect(result.data).toEqual({ name: 'John', email: 'john@test.com', age: '30' });
  });

  it('returns errors for failed validators', () => {
    const row = { Name: 'John', Email: 'not-an-email', Age: '30' };
    const validators = {
      email: (value: string) => value.includes('@') ? null : 'Invalid email format',
    };

    const result = validateRow(row, mapping, validators);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Email');
    expect(result.errors[0]).toContain('Invalid email format');
  });

  it('returns error for missing required field', () => {
    const row = { Name: 'John', Email: '', Age: '30' }; // Email is empty
    const validators = {};

    const result = validateRow(row, mapping, validators);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Email is required');
  });

  it('allows empty optional fields', () => {
    const row = { Name: 'John', Email: 'john@test.com', Age: '' }; // Age is optional
    const validators = {};

    const result = validateRow(row, mapping, validators);

    expect(result.errors).toHaveLength(0);
    expect(result.data.age).toBe('');
  });
});
