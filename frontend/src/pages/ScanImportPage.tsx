import { useState, useEffect, useCallback, Fragment } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { api, getAccessToken } from '../utils/api';
import { TYPOGRAPHY, BUTTONS, FORMS, CARDS, BADGES } from '../utils/typography';

interface ScanImport {
  id: string;
  scanner_type: string;
  scanner_version: string;
  scan_name: string;
  system_id: string;
  system_name?: string;
  file_name: string;
  hosts_scanned: number;
  findings_total: number;
  findings_critical: number;
  findings_high: number;
  findings_medium: number;
  findings_low: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  new_findings?: number;
  updated_findings?: number;
  created_at: string;
}

interface System {
  id: string;
  name: string;
}

interface OrgMember {
  id: string;
  name: string;
  email: string;
}

export function ScanImportPage() {
  const { t, nav } = useExperience();
  const { canEdit } = useAuth();
  const { addToast } = useToast();

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [systemId, setSystemId] = useState('');
  const [autoCreateAssets, setAutoCreateAssets] = useState(true);
  const [autoMapControls, setAutoMapControls] = useState(true);
  const [minSeverity, setMinSeverity] = useState('low');
  const [uploading, setUploading] = useState(false);

  // Data state
  const [systems, setSystems] = useState<System[]>([]);
  const [imports, setImports] = useState<ScanImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<ScanImport | null>(null);

  // POA&M modal state
  const [poamModal, setPoamModal] = useState<{ scanImportId: string; scanName: string } | null>(null);
  const [poamGroupBy, setPoamGroupBy] = useState('plugin_id');
  const [poamMinSeverity, setPoamMinSeverity] = useState('high');
  const [poamExcludeAccepted, setPoamExcludeAccepted] = useState(true);
  const [poamExcludeFP, setPoamExcludeFP] = useState(true);
  const [poamOwnerId, setPoamOwnerId] = useState('');
  const [generatingPoams, setGeneratingPoams] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);

  const loadImports = useCallback(async () => {
    try {
      const res = await api('/api/v1/scans/imports');
      setImports(res.data || []);
    } catch (err) {
      console.error('Failed to load scan imports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadSystems = async () => {
      try {
        const res = await api('/api/v1/systems');
        setSystems(res.systems || []);
      } catch (err) {
        console.error('Failed to load systems:', err);
      }
    };
    loadSystems();
    loadImports();
  }, [loadImports]);

  // Poll while processing
  useEffect(() => {
    const hasProcessing = imports.some(i => i.status === 'processing' || i.status === 'pending');
    if (!hasProcessing) return;

    const interval = setInterval(loadImports, 5000);
    return () => clearInterval(interval);
  }, [imports, loadImports]);

  const handleUpload = async () => {
    if (!file || !systemId) {
      addToast({ type: 'error', title: 'Please select a file and system' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('system_id', systemId);
      formData.append('auto_create_assets', String(autoCreateAssets));
      formData.append('auto_map_controls', String(autoMapControls));
      formData.append('min_severity', minSeverity);

      const token = getAccessToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/scans/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({ type: 'error', title: data.error || 'Upload failed' });
        return;
      }

      addToast({ type: 'success', title: 'Scan file uploaded — processing started' });
      setFile(null);
      const fileInput = document.getElementById('scan-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      loadImports();
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to upload scan file' });
    } finally {
      setUploading(false);
    }
  };

  const handleExpandRow = async (scanImport: ScanImport) => {
    if (expandedId === scanImport.id) {
      setExpandedId(null);
      setExpandedDetails(null);
      return;
    }
    setExpandedId(scanImport.id);
    try {
      const details = await api(`/api/v1/scans/import/${scanImport.id}`);
      setExpandedDetails(details);
    } catch {
      setExpandedDetails(scanImport);
    }
  };

  const openPoamModal = async (scanImportId: string, scanName: string) => {
    setPoamModal({ scanImportId, scanName });
    try {
      const res = await api('/api/v1/org-members');
      setOrgMembers(res.members || []);
    } catch {}
  };

  const handleGeneratePoams = async () => {
    if (!poamModal) return;
    setGeneratingPoams(true);
    try {
      const res = await api(`/api/v1/scans/import/${poamModal.scanImportId}/generate-poams`, {
        method: 'POST',
        body: JSON.stringify({
          min_severity: poamMinSeverity,
          exclude_accepted: poamExcludeAccepted,
          exclude_false_positive: poamExcludeFP,
          group_by: poamGroupBy,
          default_owner_id: poamOwnerId || null,
        }),
      });
      addToast({ type: 'success', title: `Created ${res.poams_created} POA&Ms from ${res.findings_linked} findings` });
      setPoamModal(null);
    } catch (err: any) {
      addToast({ type: 'error', title: err?.message || 'Failed to generate POA&Ms' });
    } finally {
      setGeneratingPoams(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 animate-pulse',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const severityBadge = (label: string, count: number, color: string) => {
    if (count === 0) return null;
    return (
      <span key={label} className={`px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
        {count} {label[0].toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vulnerability Scans"
        subtitle="Import vulnerability scan results and generate POA&Ms"
      />

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Scan File</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Scan File (.nessus)
            </label>
            <input
              id="scan-file-input"
              type="file"
              accept=".nessus"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('system')}
            </label>
            <select
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="">Select system...</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Severity
            </label>
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="info">Info</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoCreateAssets}
              onChange={(e) => setAutoCreateAssets(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Auto-create assets
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoMapControls}
              onChange={(e) => setAutoMapControls(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Auto-map NIST controls
          </label>
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !systemId}
            className={`${BUTTONS.primary} ml-auto flex items-center gap-2`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload & Process
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import History</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : imports.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <p className="font-medium">No scan imports yet</p>
            <p className="text-sm mt-1">Upload a .nessus file above to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Scan Name</th>
                  <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>System</th>
                  <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Date</th>
                  <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Hosts</th>
                  <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Findings</th>
                  <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {imports.map((scan) => (
                  <Fragment key={scan.id}>
                    <tr
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => handleExpandRow(scan)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {scan.scan_name || scan.file_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{scan.file_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {scan.system_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {scan.hosts_scanned || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {severityBadge('Critical', scan.findings_critical, 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300')}
                          {severityBadge('High', scan.findings_high, 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300')}
                          {severityBadge('Medium', scan.findings_medium, 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300')}
                          {severityBadge('Low', scan.findings_low, 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300')}
                          {scan.findings_total === 0 && scan.status === 'completed' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{statusBadge(scan.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === scan.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    {expandedId === scan.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Scanner:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{scan.scanner_type} {scan.scanner_version || ''}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Total Findings:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{scan.findings_total || 0}</span>
                            </div>
                            {expandedDetails && (
                              <>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">New:</span>
                                  <span className="ml-2 text-green-600 dark:text-green-400 font-medium">{expandedDetails.new_findings || 0}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">{expandedDetails.updated_findings || 0}</span>
                                </div>
                              </>
                            )}
                          </div>
                          {scan.status === 'failed' && scan.error_message && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
                              <strong>Error:</strong> {scan.error_message}
                            </div>
                          )}
                          {scan.status === 'completed' && (
                            <div className="mt-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); openPoamModal(scan.id, scan.scan_name || scan.file_name); }}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Generate POA&Ms
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POA&M Generation Modal */}
      {poamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPoamModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Generate POA&Ms</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">From: {poamModal.scanName}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
                <select
                  value={poamGroupBy}
                  onChange={(e) => setPoamGroupBy(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value="plugin_id">Plugin (one POA&M per vulnerability)</option>
                  <option value="asset">Asset (one POA&M per host)</option>
                  <option value="cve">CVE (one POA&M per CVE)</option>
                  <option value="individual">Individual (one POA&M per finding)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Severity</label>
                <select
                  value={poamMinSeverity}
                  onChange={(e) => setPoamMinSeverity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value="info">Info+</option>
                  <option value="low">Low+</option>
                  <option value="medium">Medium+</option>
                  <option value="high">High+</option>
                  <option value="critical">Critical only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Owner</label>
                <select
                  value={poamOwnerId}
                  onChange={(e) => setPoamOwnerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value="">No default owner</option>
                  {orgMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name || m.email}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={poamExcludeAccepted} onChange={(e) => setPoamExcludeAccepted(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
                  Exclude accepted risks
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={poamExcludeFP} onChange={(e) => setPoamExcludeFP(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
                  Exclude false positives
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPoamModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePoams}
                disabled={generatingPoams}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generatingPoams ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : 'Generate POA&Ms'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
