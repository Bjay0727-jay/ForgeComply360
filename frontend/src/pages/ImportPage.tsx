import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { parseCSV, matchColumns, validateRow, type ColumnMatchResult } from '../utils/csvParser';
import { IMPORT_CONFIGS, downloadTemplate, type ImportEntityConfig } from '../utils/importTemplates';

type Step = 'select' | 'upload' | 'preview' | 'importing' | 'results';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export function ImportPage() {
  const { canManage } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [entityType, setEntityType] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMatch, setColumnMatch] = useState<ColumnMatchResult | null>(null);
  const [validRows, setValidRows] = useState<Record<string, any>[]>([]);
  const [rowErrors, setRowErrors] = useState<{ row: number; errors: string[] }[]>([]);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Context selectors for implementations
  const [systems, setSystems] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');

  const config = entityType ? IMPORT_CONFIGS[entityType] : null;

  useEffect(() => {
    if (entityType === 'implementations') {
      api<any>('/api/v1/systems').then(r => setSystems(r.systems || [])).catch(() => {});
      api<any>('/api/v1/frameworks/enabled').then(r => setFrameworks(r.frameworks || [])).catch(() => {});
    }
  }, [entityType]);

  const reset = useCallback(() => {
    setStep('select');
    setEntityType(null);
    setCsvText('');
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMatch(null);
    setValidRows([]);
    setRowErrors([]);
    setResult(null);
    setError(null);
    setShowErrors(false);
    setSelectedSystem('');
    setSelectedFramework('');
  }, []);

  const handleSelectEntity = (key: string) => {
    setEntityType(key);
    setStep('upload');
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const match = matchColumns(headers, config.columns);
      setColumnMatch(match);
    };
    reader.readAsText(file);
  };

  const canProceedToPreview = useMemo(() => {
    if (!columnMatch) return false;
    if (columnMatch.missing.length > 0) return false;
    if (csvRows.length === 0) return false;
    if (config?.needsContext && (!selectedSystem || !selectedFramework)) return false;
    return true;
  }, [columnMatch, csvRows, config, selectedSystem, selectedFramework]);

  const handleProceedToPreview = () => {
    if (!config || !columnMatch) return;
    const valid: Record<string, any>[] = [];
    const errors: { row: number; errors: string[] }[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const { data, errors: rowErrs } = validateRow(csvRows[i], columnMatch.matched, config.validators);
      if (rowErrs.length > 0) {
        errors.push({ row: i + 1, errors: rowErrs });
      } else {
        valid.push(data);
      }
    }

    setValidRows(valid);
    setRowErrors(errors);
    setStep('preview');
  };

  const handleStartImport = async () => {
    if (!config) return;
    setStep('importing');
    setError(null);

    try {
      const rowsToImport = skipInvalid ? validRows : validRows;
      const body: any = { rows: rowsToImport };
      if (config.needsContext) {
        body.system_id = selectedSystem;
        body.framework_id = selectedFramework;
      }

      const res = await api<ImportResult>(config.endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResult(res);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Import failed');
      setStep('preview');
    }
  };

  if (!canManage) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Bulk import is available to managers, admins, and owners only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Bulk Import</h1>
        <p className="text-gray-500 text-sm">Import data from CSV files into ForgeComply 360.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {['Select Type', 'Upload CSV', 'Preview', 'Import'].map((label, i) => {
          const steps: Step[] = ['select', 'upload', 'preview', 'importing'];
          const stepIndex = steps.indexOf(step === 'results' ? 'importing' : step);
          const isActive = i === stepIndex;
          const isDone = i < stepIndex || step === 'results';
          return (
            <React.Fragment key={label}>
              {i > 0 && <div className={`h-px flex-1 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-blue-100 text-blue-700' : isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {isDone && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                {label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Step 1: Select Entity */}
      {step === 'select' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(IMPORT_CONFIGS).map((cfg) => {
            const colors: Record<string, string> = {
              blue: 'border-blue-200 hover:border-blue-400',
              orange: 'border-orange-200 hover:border-orange-400',
              green: 'border-green-200 hover:border-green-400',
              purple: 'border-purple-200 hover:border-purple-400',
              indigo: 'border-indigo-200 hover:border-indigo-400',
            };
            const iconColors: Record<string, string> = {
              blue: 'bg-blue-100 text-blue-600',
              orange: 'bg-orange-100 text-orange-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              indigo: 'bg-indigo-100 text-indigo-600',
            };
            return (
              <div key={cfg.key} className={`bg-white rounded-xl border-2 ${colors[cfg.color] || 'border-gray-200'} p-5 cursor-pointer transition-all hover:shadow-md`} onClick={() => handleSelectEntity(cfg.key)}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${iconColors[cfg.color] || 'bg-gray-100 text-gray-600'} flex items-center justify-center`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} /></svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">{cfg.label}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">{cfg.description}</p>
                <button onClick={(e) => { e.stopPropagation(); downloadTemplate(cfg.key); }} className="text-xs text-blue-600 hover:text-blue-800 underline">
                  Download Template
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 2: Upload CSV */}
      {step === 'upload' && config && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upload {config.label} CSV</h2>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
          </div>

          {/* Context selectors for implementations */}
          {config.needsContext && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target System</label>
                <select value={selectedSystem} onChange={e => setSelectedSystem(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select system...</option>
                  {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Framework</label>
                <select value={selectedFramework} onChange={e => setSelectedFramework(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select framework...</option>
                  {frameworks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* File input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-800 font-medium">Choose a CSV file</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <p className="text-xs text-gray-400 mt-2">or <button onClick={() => downloadTemplate(config.key)} className="text-blue-500 underline">download the template</button> first</p>
          </div>

          {/* Column mapping */}
          {columnMatch && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Column Mapping ({csvRows.length} rows found)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {columnMatch.matched.map(m => (
                  <div key={m.fieldName} className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded px-3 py-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-green-700">{m.csvName} → {m.fieldName}{m.required ? ' *' : ''}</span>
                  </div>
                ))}
                {columnMatch.unmatched.map(u => (
                  <div key={u} className="flex items-center gap-2 text-xs bg-yellow-50 border border-yellow-200 rounded px-3 py-1.5">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                    <span className="text-yellow-700">{u} (ignored)</span>
                  </div>
                ))}
                {columnMatch.missing.map(m => (
                  <div key={m} className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 rounded px-3 py-1.5">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="text-red-700">{m} (required, missing)</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleProceedToPreview}
                disabled={!canProceedToPreview}
                className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Preview
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && config && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Preview Import</h2>
            <button onClick={() => setStep('upload')} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
          </div>

          {/* Summary */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-700">{validRows.length} valid rows</span>
            </div>
            {rowErrors.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-700">{rowErrors.length} rows with errors</span>
                <button onClick={() => setShowErrors(!showErrors)} className="text-blue-600 text-xs underline">{showErrors ? 'Hide' : 'Show'}</button>
              </div>
            )}
          </div>

          {/* Errors list */}
          {showErrors && rowErrors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              {rowErrors.map(re => (
                <div key={re.row} className="text-xs text-red-700 mb-1">
                  <span className="font-medium">Row {re.row}:</span> {re.errors.join('; ')}
                </div>
              ))}
            </div>
          )}

          {/* Preview table */}
          {validRows.length > 0 && (
            <div className="overflow-x-auto mb-4 border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                    {columnMatch?.matched.map(m => (
                      <th key={m.fieldName} className="px-3 py-2 text-left text-gray-500 font-medium">{m.csvName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      {columnMatch?.matched.map(m => (
                        <td key={m.fieldName} className="px-3 py-1.5 text-gray-700 max-w-[200px] truncate">{row[m.fieldName] || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 10 && <p className="text-xs text-gray-400 p-2 text-center">Showing 10 of {validRows.length} rows</p>}
            </div>
          )}

          {/* Skip invalid toggle */}
          {rowErrors.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <input type="checkbox" checked={skipInvalid} onChange={e => setSkipInvalid(e.target.checked)} className="rounded" />
              Skip invalid rows and import only valid ones
            </label>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleStartImport}
              disabled={validRows.length === 0}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {validRows.length} Rows
            </button>
            <button onClick={reset} className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {step === 'importing' && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Importing {validRows.length} {config?.label || 'records'}...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a moment.</p>
        </div>
      )}

      {/* Step 5: Results */}
      {step === 'results' && result && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Complete</h2>

          <div className="flex gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                <p className="text-xs text-gray-500">Imported</p>
              </div>
            </div>
            {result.failed > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
              </div>
            )}
          </div>

          {/* Backend errors */}
          {result.errors && result.errors.length > 0 && (
            <div className="mb-4">
              <button onClick={() => setShowErrors(!showErrors)} className="text-sm text-blue-600 underline mb-2">{showErrors ? 'Hide' : 'Show'} error details</button>
              {showErrors && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs text-red-700 mb-1">
                      <span className="font-medium">Row {e.row}:</span> {e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Import More</button>
            {config && (
              <a href={config.pageLink} className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1">
                Go to {config.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
