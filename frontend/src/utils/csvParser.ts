// csvParser.ts — Client-side CSV parsing utilities for bulk import

/**
 * Parse a CSV string into headers and row objects.
 * Handles BOM prefix, quoted fields with commas, and escaped double-quotes.
 */
export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM
  let cleaned = text.startsWith('\uFEFF') ? text.slice(1) : text;
  cleaned = cleaned.trim();
  if (!cleaned) return { headers: [], rows: [] };

  const lines = splitCSVLines(cleaned);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] || '').trim();
    }
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Split CSV text into logical lines, respecting quoted fields that span multiple lines.
 */
function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++; // skip \r\n
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Parse a single CSV line into an array of field values.
 * Handles quoted fields and escaped double-quotes ("").
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current);
  return fields;
}

export interface ColumnMapping {
  csvName: string;
  fieldName: string;
  required: boolean;
}

export interface ColumnMatchResult {
  matched: ColumnMapping[];
  unmatched: string[];
  missing: string[];
}

/**
 * Match CSV headers to expected entity columns (case-insensitive).
 */
export function matchColumns(
  csvHeaders: string[],
  expectedColumns: { csvName: string; fieldName: string; required: boolean }[],
): ColumnMatchResult {
  const matched: ColumnMapping[] = [];
  const usedCsvHeaders = new Set<string>();

  for (const col of expectedColumns) {
    const found = csvHeaders.find(
      h => h.toLowerCase().trim() === col.csvName.toLowerCase().trim() && !usedCsvHeaders.has(h),
    );
    if (found) {
      matched.push({ csvName: found, fieldName: col.fieldName, required: col.required });
      usedCsvHeaders.add(found);
    }
  }

  const unmatched = csvHeaders.filter(h => !usedCsvHeaders.has(h));
  const matchedFieldNames = new Set(matched.map(m => m.fieldName));
  const missing = expectedColumns
    .filter(c => c.required && !matchedFieldNames.has(c.fieldName))
    .map(c => c.csvName);

  return { matched, unmatched, missing };
}

/**
 * Validate and transform a single row using the column mapping and validators.
 */
export function validateRow(
  row: Record<string, string>,
  mapping: ColumnMapping[],
  validators: Record<string, (value: string) => string | null>,
): { data: Record<string, any>; errors: string[] } {
  const data: Record<string, any> = {};
  const errors: string[] = [];

  for (const col of mapping) {
    const rawValue = row[col.csvName] || '';
    const validator = validators[col.fieldName];
    if (validator) {
      const error = validator(rawValue);
      if (error) {
        errors.push(`${col.csvName}: ${error}`);
        continue;
      }
    }
    if (col.required && !rawValue.trim()) {
      errors.push(`${col.csvName} is required`);
      continue;
    }
    data[col.fieldName] = rawValue.trim();
  }

  return { data, errors };
}
