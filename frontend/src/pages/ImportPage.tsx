import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { parseCSV, matchColumns, validateRow, type ColumnMatchResult } from '../utils/csvParser';
import { IMPORT_CONFIGS, SPECIALIZED_IMPORT_KEYS, downloadTemplate, type ImportEntityConfig } from '../utils/importTemplates';
import { parseOscalSSP, parseOscalCatalog, type OscalSSPResult, type OscalCatalogResult } from '../utils/oscalParser';
import { PageHeader } from '../components/PageHeader';
import { SkeletonCard } from '../components/Skeleton';
import { ProgressBar } from '../components/ProgressBar';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, BUTTONS, CARDS, FORMS, BADGES } from '../utils/typography';

type Step = 'select' | 'upload' | 'preview' | 'importing' | 'results';
type ImportFormat = 'csv' | 'oscal_ssp' | 'oscal_catalog';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
  // OSCAL SSP results
  system_created?: boolean;
  system_id?: string;
  implementations?: { success: number; failed: number; errors: { row: number; error: string }[] };
  // OSCAL Catalog results
  framework_id?: string;
  controls?: { success: number; failed: number; errors: { row: number; error: string }[] };
}

// Standard CSV import configs (exclude specialized ones from main grid)
const STANDARD_CONFIGS = Object.fromEntries(
  Object.entries(IMPORT_CONFIGS).filter(([k]) => !SPECIALIZED_IMPORT_KEYS.includes(k))
);
const SPECIALIZED_CONFIGS = Object.fromEntries(
  Object.entries(IMPORT_CONFIGS).filter(([k]) => SPECIALIZED_IMPORT_KEYS.includes(k))
);

export function ImportPage() {
  const { canManage } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>('select');
  const [entityType, setEntityType] = useState<string | null>(null);
  const [importFormat, setImportFormat] = useState<ImportFormat>('csv');

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMatch, setColumnMatch] = useState<ColumnMatchResult | null>(null);
  const [validRows, setValidRows] = useState<Record<string, any>[]>([]);
  const [rowErrors, setRowErrors] = useState<{ row: number; errors: string[] }[]>([]);
  const [skipInvalid, setSkipInvalid] = useState(true);

  // OSCAL state
  const [oscalSSP, setOscalSSP] = useState<OscalSSPResult | null>(null);
  const [oscalCatalog, setOscalCatalog] = useState<OscalCatalogResult | null>(null);
  const [oscalPreviewTab, setOscalPreviewTab] = useState<'system' | 'implementations' | 'framework' | 'controls'>('system');
  const [oscalCreateNew, setOscalCreateNew] = useState(true);
  const [oscalCategory, setOscalCategory] = useState('federal');

  // Common state
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Context selectors
  const [systems, setSystems] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');

  const config = entityType ? IMPORT_CONFIGS[entityType] : null;

  useEffect(() => {
    if (entityType === 'implementations' || entityType === 'nist_controls' || importFormat === 'oscal_ssp') {
      api<any>('/api/v1/systems').then(r => setSystems(r.systems || [])).catch(() => {});
      api<any>('/api/v1/frameworks/enabled').then(r => setFrameworks(r.frameworks || [])).catch(() => {});
    }
  }, [entityType, importFormat]);

  const reset = useCallback(() => {
    setStep('select');
    setEntityType(null);
    setImportFormat('csv');
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
    setOscalSSP(null);
    setOscalCatalog(null);
    setOscalPreviewTab('system');
    setOscalCreateNew(true);
    setOscalCategory('federal');
  }, []);

  const handleSelectEntity = (key: string, format: ImportFormat = 'csv') => {
    setEntityType(key);
    setImportFormat(format);
    setStep('upload');
    setError(null);
  };

  const handleSelectOscal = (format: 'oscal_ssp' | 'oscal_catalog') => {
    setEntityType(null);
    setImportFormat(format);
    setStep('upload');
    setError(null);
    if (format === 'oscal_ssp') setOscalPreviewTab('system');
    if (format === 'oscal_catalog') setOscalPreviewTab('framework');
  };

  // ---- File Upload Handlers ----

  const handleCSVUpload = (file: File) => {
    if (!config) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      setColumnMatch(matchColumns(headers, config.columns));
    };
    reader.readAsText(file);
  };

  const handleJSONUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (importFormat === 'oscal_ssp') {
          const result = parseOscalSSP(json);
          setOscalSSP(result);
          if (result.errors.length > 0 && result.implementations.length === 0) {
            setError(result.errors.join('; '));
          }
        } else if (importFormat === 'oscal_catalog') {
          const result = parseOscalCatalog(json);
          setOscalCatalog(result);
          if (result.errors.length > 0 && result.controls.length === 0) {
            setError(result.errors.join('; '));
          }
        }
      } catch {
        setError('Invalid JSON file. Please upload a valid OSCAL JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (importFormat === 'oscal_ssp' || importFormat === 'oscal_catalog') {
      handleJSONUpload(file);
    } else {
      handleCSVUpload(file);
    }
  };

  // ---- Preview Logic ----

  const canProceedToPreview = useMemo(() => {
    if (importFormat === 'oscal_ssp') return !!oscalSSP && oscalSSP.implementations.length > 0 && !!selectedFramework;
    if (importFormat === 'oscal_catalog') return !!oscalCatalog && oscalCatalog.controls.length > 0;
    if (!columnMatch) return false;
    if (columnMatch.missing.length > 0) return false;
    if (csvRows.length === 0) return false;
    if (config?.needsContext && (!selectedSystem || !selectedFramework)) return false;
    return true;
  }, [columnMatch, csvRows, config, selectedSystem, selectedFramework, importFormat, oscalSSP, oscalCatalog]);

  const handleProceedToPreview = () => {
    if (importFormat === 'oscal_ssp' || importFormat === 'oscal_catalog') {
      setStep('preview');
      return;
    }
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

  // ---- Import Execution ----

  const handleStartImport = async () => {
    setStep('importing');
    setError(null);

    try {
      if (importFormat === 'oscal_ssp' && oscalSSP) {
        const body = {
          system: oscalSSP.system,
          implementations: oscalSSP.implementations,
          framework_id: selectedFramework,
          import_options: {
            create_system: oscalCreateNew,
            existing_system_id: oscalCreateNew ? null : selectedSystem,
          },
        };
        const res = await api<ImportResult>('/api/v1/import/oscal-ssp', { method: 'POST', body: JSON.stringify(body) });
        setResult(res);
        setStep('results');
      } else if (importFormat === 'oscal_catalog' && oscalCatalog) {
        const body = {
          framework: { ...oscalCatalog.framework, category: oscalCategory },
          controls: oscalCatalog.controls,
          import_options: {
            create_framework: oscalCreateNew,
            existing_framework_id: oscalCreateNew ? null : selectedFramework,
            category: oscalCategory,
          },
        };
        const res = await api<ImportResult>('/api/v1/import/oscal-catalog', { method: 'POST', body: JSON.stringify(body) });
        setResult(res);
        setStep('results');
      } else if (config) {
        const rowsToImport = skipInvalid ? validRows : validRows;
        const body: any = { rows: rowsToImport };
        if (config.needsContext) {
          body.system_id = selectedSystem;
          body.framework_id = selectedFramework;
        }
        // For enhanced POA&M, collect milestones into array per row
        if (entityType === 'poams_fedramp') {
          body.rows = rowsToImport.map(row => ({
            ...row,
            milestones: collectMilestones(row),
          }));
        }
        const res = await api<ImportResult>(config.endpoint, { method: 'POST', body: JSON.stringify(body) });
        setResult(res);
        setStep('results');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Import failed';
      setError(errorMsg);
      addToast({ type: 'error', title: 'Import failed', message: errorMsg });
      setStep('preview');
    }
  };

  if (!canManage) {
    return (
      <div className={`${CARDS.elevated} p-12 text-center max-w-md mx-auto mt-12`}>
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className={TYPOGRAPHY.sectionTitle}>Access Restricted</h2>
        <p className={`${TYPOGRAPHY.bodyMuted} mt-2`}>Bulk import is available to managers, admins, and owners only.</p>
      </div>
    );
  }

  const stepLabels = importFormat.startsWith('oscal') ? ['Select Type', 'Upload JSON', 'Preview', 'Import'] : ['Select Type', 'Upload CSV', 'Preview', 'Import'];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader title="Compliance Imports" subtitle="Import data from CSV, OSCAL JSON, or compliance tool exports into Forge Cyber Defense." />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {stepLabels.map((label, i) => {
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

      {/* ================================================================== */}
      {/* Step 1: Select Entity / Format */}
      {/* ================================================================== */}
      {step === 'select' && (
        <div className="space-y-8">
          {/* Standard CSV Imports */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Standard CSV Import</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(STANDARD_CONFIGS).map((cfg) => (
                <ImportCard key={cfg.key} cfg={cfg} onClick={() => handleSelectEntity(cfg.key)} showTemplate />
              ))}
            </div>
          </div>

          {/* Specialized Formats */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Specialized Formats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* OSCAL SSP */}
              <div className="bg-white rounded-xl border-2 border-teal-200 hover:border-teal-400 p-5 cursor-pointer transition-all hover:shadow-md" onClick={() => handleSelectOscal('oscal_ssp')}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">OSCAL SSP Import</h3>
                    <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">JSON</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">Import system info and control implementations from an OSCAL System Security Plan JSON file.</p>
              </div>

              {/* OSCAL Catalog */}
              <div className="bg-white rounded-xl border-2 border-cyan-200 hover:border-cyan-400 p-5 cursor-pointer transition-all hover:shadow-md" onClick={() => handleSelectOscal('oscal_catalog')}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">OSCAL Catalog Import</h3>
                    <span className="text-[10px] bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded font-medium">JSON</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">Import a security control catalog from an OSCAL Catalog JSON file to create a custom framework.</p>
              </div>

              {/* NIST 800-53 Controls CSV */}
              {Object.values(SPECIALIZED_CONFIGS).map((cfg) => (
                <ImportCard key={cfg.key} cfg={cfg} onClick={() => handleSelectEntity(cfg.key)} showTemplate />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Step 2: Upload File */}
      {/* ================================================================== */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {importFormat === 'oscal_ssp' ? 'Upload OSCAL SSP JSON' :
               importFormat === 'oscal_catalog' ? 'Upload OSCAL Catalog JSON' :
               `Upload ${config?.label || ''} CSV`}
            </h2>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
          </div>

          {/* Context selectors for CSV formats that need them */}
          {importFormat === 'csv' && config?.needsContext && (
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

          {/* OSCAL SSP context selectors */}
          {importFormat === 'oscal_ssp' && (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Handling</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="oscal_system" checked={oscalCreateNew} onChange={() => setOscalCreateNew(true)} className="text-blue-600" />
                    Create new system from SSP
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="oscal_system" checked={!oscalCreateNew} onChange={() => setOscalCreateNew(false)} className="text-blue-600" />
                    Map to existing system
                  </label>
                </div>
                {!oscalCreateNew && (
                  <select value={selectedSystem} onChange={e => setSelectedSystem(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select system...</option>
                    {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
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

          {/* OSCAL Catalog context selectors */}
          {importFormat === 'oscal_catalog' && (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Framework Handling</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="oscal_fw" checked={oscalCreateNew} onChange={() => setOscalCreateNew(true)} className="text-blue-600" />
                    Create new framework
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="oscal_fw" checked={!oscalCreateNew} onChange={() => setOscalCreateNew(false)} className="text-blue-600" />
                    Add to existing framework
                  </label>
                </div>
                {!oscalCreateNew && (
                  <select value={selectedFramework} onChange={e => setSelectedFramework(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select framework...</option>
                    {frameworks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                )}
              </div>
              {oscalCreateNew && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Framework Category</label>
                  <select value={oscalCategory} onChange={e => setOscalCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="federal">Federal</option>
                    <option value="defense">Defense</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="commercial">Commercial</option>
                    <option value="privacy">Privacy</option>
                    <option value="critical_infrastructure">Critical Infrastructure</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* File input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-800 font-medium">
                Choose a {importFormat.startsWith('oscal') ? 'JSON' : 'CSV'} file
              </span>
              <input
                type="file"
                accept={importFormat.startsWith('oscal') ? '.json' : '.csv'}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {config && importFormat === 'csv' && (
              <p className="text-xs text-gray-400 mt-2">or <button onClick={() => downloadTemplate(config.key)} className="text-blue-500 underline">download the template</button> first</p>
            )}
          </div>

          {/* OSCAL SSP Parse Results */}
          {importFormat === 'oscal_ssp' && oscalSSP && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Parsed OSCAL SSP</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-green-50 border border-green-200 rounded px-3 py-1.5 text-green-700">System: {oscalSSP.system.name || '(unnamed)'}</div>
                <div className="bg-green-50 border border-green-200 rounded px-3 py-1.5 text-green-700">{oscalSSP.implementations.length} implementations</div>
                {oscalSSP.errors.length > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-1.5 text-yellow-700">{oscalSSP.errors.length} warnings</div>}
              </div>
              <button onClick={handleProceedToPreview} disabled={!canProceedToPreview} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Continue to Preview
              </button>
            </div>
          )}

          {/* OSCAL Catalog Parse Results */}
          {importFormat === 'oscal_catalog' && oscalCatalog && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Parsed OSCAL Catalog</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-green-50 border border-green-200 rounded px-3 py-1.5 text-green-700">Framework: {oscalCatalog.framework.name}</div>
                <div className="bg-green-50 border border-green-200 rounded px-3 py-1.5 text-green-700">{oscalCatalog.controls.length} controls</div>
                {oscalCatalog.errors.length > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-1.5 text-yellow-700">{oscalCatalog.errors.length} warnings</div>}
              </div>
              <button onClick={handleProceedToPreview} disabled={!canProceedToPreview} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Continue to Preview
              </button>
            </div>
          )}

          {/* CSV Column mapping */}
          {importFormat === 'csv' && columnMatch && (
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

      {/* ================================================================== */}
      {/* Step 3: Preview */}
      {/* ================================================================== */}
      {step === 'preview' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Preview Import</h2>
            <button onClick={() => setStep('upload')} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
          </div>

          {/* OSCAL SSP Preview */}
          {importFormat === 'oscal_ssp' && oscalSSP && (
            <>
              <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setOscalPreviewTab('system')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${oscalPreviewTab === 'system' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  System Info
                </button>
                <button onClick={() => setOscalPreviewTab('implementations')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${oscalPreviewTab === 'implementations' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  Implementations ({oscalSSP.implementations.length})
                </button>
              </div>

              {oscalPreviewTab === 'system' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    ['Name', oscalSSP.system.name],
                    ['Acronym', oscalSSP.system.acronym],
                    ['Impact Level', oscalSSP.system.impact_level],
                    ['Deployment', oscalSSP.system.deployment_model],
                    ['Service Model', oscalSSP.system.service_model],
                    ['Status', oscalSSP.system.status],
                  ].map(([label, value]) => (
                    <div key={label} className="text-xs">
                      <span className="text-gray-500">{label}:</span>{' '}
                      <span className="text-gray-900 font-medium">{value || '—'}</span>
                    </div>
                  ))}
                  {oscalSSP.system.description && (
                    <div className="col-span-2 text-xs">
                      <span className="text-gray-500">Description:</span>{' '}
                      <span className="text-gray-700">{oscalSSP.system.description.slice(0, 200)}{oscalSSP.system.description.length > 200 ? '...' : ''}</span>
                    </div>
                  )}
                </div>
              )}

              {oscalPreviewTab === 'implementations' && (
                <div className="overflow-x-auto mb-4 border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>#</th>
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>Control ID</th>
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>Status</th>
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>Role</th>
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oscalSSP.implementations.slice(0, 15).map((impl, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-1.5 text-gray-900 font-mono">{impl.control_id}</td>
                          <td className="px-3 py-1.5"><StatusBadge status={impl.status} /></td>
                          <td className="px-3 py-1.5 text-gray-700">{impl.responsible_role || '—'}</td>
                          <td className="px-3 py-1.5 text-gray-700 max-w-[300px] truncate">{impl.implementation_description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {oscalSSP.implementations.length > 15 && <p className="text-xs text-gray-400 p-2 text-center">Showing 15 of {oscalSSP.implementations.length}</p>}
                </div>
              )}

              {oscalSSP.errors.length > 0 && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 font-medium mb-1">Parser Warnings:</p>
                  {oscalSSP.errors.map((e, i) => <p key={i} className="text-xs text-yellow-600">{e}</p>)}
                </div>
              )}
            </>
          )}

          {/* OSCAL Catalog Preview */}
          {importFormat === 'oscal_catalog' && oscalCatalog && (
            <>
              <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setOscalPreviewTab('framework')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${oscalPreviewTab === 'framework' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  Framework Info
                </button>
                <button onClick={() => setOscalPreviewTab('controls')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${oscalPreviewTab === 'controls' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  Controls ({oscalCatalog.controls.length})
                </button>
              </div>

              {oscalPreviewTab === 'framework' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-xs"><span className="text-gray-500">Name:</span> <span className="text-gray-900 font-medium">{oscalCatalog.framework.name}</span></div>
                  <div className="text-xs"><span className="text-gray-500">Version:</span> <span className="text-gray-900 font-medium">{oscalCatalog.framework.version}</span></div>
                  <div className="text-xs"><span className="text-gray-500">Controls:</span> <span className="text-gray-900 font-medium">{oscalCatalog.controls.length}</span></div>
                  <div className="text-xs"><span className="text-gray-500">Enhancements:</span> <span className="text-gray-900 font-medium">{oscalCatalog.controls.filter(c => c.is_enhancement).length}</span></div>
                </div>
              )}

              {oscalPreviewTab === 'controls' && (
                <div className="overflow-x-auto mb-4 border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>Control ID</th>
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>Family</th>
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>Title</th>
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oscalCatalog.controls.slice(0, 20).map((ctrl, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5 text-gray-900 font-mono">{ctrl.control_id}</td>
                          <td className="px-3 py-1.5 text-gray-700">{ctrl.family}</td>
                          <td className="px-3 py-1.5 text-gray-700 max-w-[300px] truncate">{ctrl.title}</td>
                          <td className="px-3 py-1.5">{ctrl.is_enhancement ? <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Enhancement</span> : <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Control</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {oscalCatalog.controls.length > 20 && <p className="text-xs text-gray-400 p-2 text-center">Showing 20 of {oscalCatalog.controls.length}</p>}
                </div>
              )}
            </>
          )}

          {/* Standard CSV Preview */}
          {importFormat === 'csv' && config && (
            <>
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

              {showErrors && rowErrors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {rowErrors.map(re => (
                    <div key={re.row} className="text-xs text-red-700 mb-1">
                      <span className="font-medium">Row {re.row}:</span> {re.errors.join('; ')}
                    </div>
                  ))}
                </div>
              )}

              {validRows.length > 0 && (
                <div className="overflow-x-auto mb-4 border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>#</th>
                        {columnMatch?.matched.map(m => (
                          <th key={m.fieldName} className={`px-3 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>{m.csvName}</th>
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

              {rowErrors.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <input type="checkbox" checked={skipInvalid} onChange={e => setSkipInvalid(e.target.checked)} className="rounded" />
                  Skip invalid rows and import only valid ones
                </label>
              )}
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleStartImport}
              disabled={importFormat === 'csv' ? validRows.length === 0 : false}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importFormat === 'oscal_ssp' ? `Import System + ${oscalSSP?.implementations.length || 0} Implementations` :
               importFormat === 'oscal_catalog' ? `Import ${oscalCatalog?.controls.length || 0} Controls` :
               `Import ${validRows.length} Rows`}
            </button>
            <button onClick={reset} className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Step 4: Importing */}
      {/* ================================================================== */}
      {step === 'importing' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              {importFormat === 'oscal_ssp' ? 'Importing OSCAL SSP data...' :
               importFormat === 'oscal_catalog' ? 'Importing OSCAL Catalog...' :
               `Importing ${validRows.length} ${config?.label || 'records'}...`}
            </p>
            <p className="text-sm text-gray-400 mt-1 mb-4">This may take a moment.</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Step 5: Results */}
      {/* ================================================================== */}
      {step === 'results' && result && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Complete</h2>

          {/* OSCAL SSP Results */}
          {importFormat === 'oscal_ssp' && (
            <div className="space-y-4 mb-6">
              {result.system_created && (
                <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-green-700">System created: <strong>{oscalSSP?.system.name}</strong></span>
                </div>
              )}
              {result.implementations && (
                <div className="flex gap-6">
                  <ResultStat value={result.implementations.success} label="Implementations" color="green" />
                  {result.implementations.failed > 0 && <ResultStat value={result.implementations.failed} label="Failed" color="red" />}
                </div>
              )}
            </div>
          )}

          {/* OSCAL Catalog Results */}
          {importFormat === 'oscal_catalog' && result.controls && (
            <div className="space-y-4 mb-6">
              {result.framework_id && (
                <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-green-700">Framework: <strong>{oscalCatalog?.framework.name}</strong></span>
                </div>
              )}
              <div className="flex gap-6">
                <ResultStat value={result.controls.success} label="Controls" color="green" />
                {result.controls.failed > 0 && <ResultStat value={result.controls.failed} label="Failed" color="red" />}
              </div>
            </div>
          )}

          {/* Standard CSV Results */}
          {importFormat === 'csv' && (
            <div className="flex gap-6 mb-6">
              <ResultStat value={result.success} label="Imported" color="green" />
              {result.failed > 0 && <ResultStat value={result.failed} label="Failed" color="red" />}
            </div>
          )}

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
            {importFormat === 'oscal_ssp' && (
              <a href="/systems" className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1">
                Go to Systems <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            )}
            {importFormat === 'oscal_catalog' && (
              <a href="/controls" className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1">
                Go to Controls <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            )}
            {importFormat === 'csv' && config && (
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

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ImportCard({ cfg, onClick, showTemplate }: { cfg: ImportEntityConfig; onClick: () => void; showTemplate?: boolean }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 hover:border-blue-400',
    orange: 'border-orange-200 hover:border-orange-400',
    green: 'border-green-200 hover:border-green-400',
    purple: 'border-purple-200 hover:border-purple-400',
    indigo: 'border-indigo-200 hover:border-indigo-400',
    teal: 'border-teal-200 hover:border-teal-400',
    rose: 'border-rose-200 hover:border-rose-400',
  };
  const iconColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    teal: 'bg-teal-100 text-teal-600',
    rose: 'bg-rose-100 text-rose-600',
  };
  return (
    <div className={`bg-white rounded-xl border-2 ${colors[cfg.color] || 'border-blue-200'} p-5 cursor-pointer transition-all hover:shadow-md`} onClick={onClick}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconColors[cfg.color] || 'bg-gray-100 text-gray-600'} flex items-center justify-center`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} /></svg>
        </div>
        <h3 className="font-semibold text-gray-900">{cfg.label}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{cfg.description}</p>
      {showTemplate && (
        <button onClick={(e) => { e.stopPropagation(); downloadTemplate(cfg.key); }} className="text-xs text-blue-600 hover:text-blue-800 underline">
          Download Template
        </button>
      )}
    </div>
  );
}

function ResultStat({ value, label, color }: { value: number; label: string; color: 'green' | 'red' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 ${color === 'green' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
        {color === 'green'
          ? <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          : <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        }
      </div>
      <div>
        <p className={`text-2xl font-bold ${color === 'green' ? 'text-green-600' : 'text-red-600'}`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    implemented: 'bg-green-100 text-green-700',
    partially_implemented: 'bg-yellow-100 text-yellow-700',
    planned: 'bg-blue-100 text-blue-700',
    alternative: 'bg-purple-100 text-purple-700',
    not_applicable: 'bg-gray-100 text-gray-600',
    not_implemented: 'bg-red-100 text-red-700',
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status.replace(/_/g, ' ')}</span>;
}

// Collect milestone columns into array for FedRAMP POA&M import
function collectMilestones(row: Record<string, any>): { title: string; target_date: string | null; status: string }[] {
  const milestones = [];
  for (let i = 1; i <= 3; i++) {
    const desc = row[`milestone_${i}`];
    const date = row[`milestone_${i}_date`];
    if (desc && desc.trim()) {
      milestones.push({ title: desc.trim(), target_date: date || null, status: 'pending' });
    }
  }
  return milestones;
}
