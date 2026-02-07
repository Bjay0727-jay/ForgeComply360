import { useState, useEffect, useCallback, Fragment } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { api, getAccessToken } from '../utils/api';
import { TYPOGRAPHY, BUTTONS } from '../utils/typography';

interface Asset {
  id: string;
  hostname: string | null;
  ip_address: string | null;
  fqdn: string | null;
  mac_address: string | null;
  netbios_name: string | null;
  os_type: string | null;
  asset_type: string;
  discovery_source: string;
  scan_credentialed: number;
  open_ports: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
  system_id: string | null;
  system_name: string | null;
  environment: string | null;
  boundary_id: string | null;
  data_zone: string | null;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_findings: number;
  recent_findings?: { id: string; title: string; severity: string; status: string }[];
}

const ENVIRONMENT_LABELS: Record<string, string> = {
  production: 'Production', staging: 'Staging', development: 'Development',
  govcloud: 'GovCloud', commercial: 'Commercial', shared: 'Shared', enclave: 'Enclave'
};
const ENVIRONMENT_COLORS: Record<string, string> = {
  production: 'bg-red-100 text-red-700', staging: 'bg-yellow-100 text-yellow-700',
  development: 'bg-gray-100 text-gray-600', govcloud: 'bg-blue-100 text-blue-700',
  commercial: 'bg-green-100 text-green-700', shared: 'bg-purple-100 text-purple-700',
  enclave: 'bg-orange-100 text-orange-700'
};
const DATA_ZONE_LABELS: Record<string, string> = {
  cui: 'CUI', pii: 'PII', phi: 'PHI', pci: 'PCI', public: 'Public', internal: 'Internal', classified: 'Classified'
};
const DATA_ZONE_COLORS: Record<string, string> = {
  cui: 'bg-orange-100 text-orange-700', pii: 'bg-yellow-100 text-yellow-700',
  phi: 'bg-red-100 text-red-700', pci: 'bg-purple-100 text-purple-700',
  public: 'bg-gray-100 text-gray-600', internal: 'bg-blue-100 text-blue-700',
  classified: 'bg-red-200 text-red-800'
};

interface System {
  id: string;
  name: string;
}

export function AssetsPage() {
  const { canEdit, user } = useAuth();
  const { addToast } = useToast();

  // Data state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<Asset | null>(null);

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    hostname: '',
    ip_address: '',
    fqdn: '',
    mac_address: '',
    os_type: '',
    asset_type: 'server',
    system_id: '',
    environment: 'production',
    data_zone: '',
  });
  const [saving, setSaving] = useState(false);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSystemId, setImportSystemId] = useState('');
  const [importing, setImporting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = user?.role && ['manager', 'admin', 'owner'].includes(user.role);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      if (systemFilter) params.set('system_id', systemFilter);
      if (sourceFilter) params.set('discovery_source', sourceFilter);

      const res = await api(`/api/v1/assets?${params}`);
      setAssets(res.assets || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, systemFilter, sourceFilter]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

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
  }, []);

  const handleExpandRow = async (asset: Asset) => {
    if (expandedId === asset.id) {
      setExpandedId(null);
      setExpandedAsset(null);
      return;
    }
    setExpandedId(asset.id);
    try {
      const details = await api(`/api/v1/assets/${asset.id}`);
      setExpandedAsset(details);
    } catch {
      setExpandedAsset(asset);
    }
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setFormData({
      hostname: '',
      ip_address: '',
      fqdn: '',
      mac_address: '',
      os_type: '',
      asset_type: 'server',
      system_id: '',
      environment: 'production',
      data_zone: '',
    });
    setShowModal(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      hostname: asset.hostname || '',
      ip_address: asset.ip_address || '',
      fqdn: asset.fqdn || '',
      mac_address: asset.mac_address || '',
      os_type: asset.os_type || '',
      asset_type: asset.asset_type || 'server',
      system_id: asset.system_id || '',
      environment: asset.environment || 'production',
      data_zone: asset.data_zone || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.hostname && !formData.ip_address) {
      addToast({ type: 'error', title: 'Hostname or IP address is required' });
      return;
    }

    setSaving(true);
    try {
      if (editingAsset) {
        await api(`/api/v1/assets/${editingAsset.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        addToast({ type: 'success', title: 'Asset updated' });
      } else {
        await api('/api/v1/assets', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        addToast({ type: 'success', title: 'Asset created' });
      }
      setShowModal(false);
      loadAssets();
    } catch (err: any) {
      addToast({ type: 'error', title: err?.message || 'Failed to save asset' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to delete "${asset.hostname || asset.ip_address}"?\n\nThis will also delete all associated vulnerability findings.`)) {
      return;
    }

    setDeletingId(asset.id);
    try {
      await api(`/api/v1/assets/${asset.id}`, { method: 'DELETE' });
      addToast({ type: 'success', title: 'Asset deleted' });
      setExpandedId(null);
      setExpandedAsset(null);
      loadAssets();
    } catch (err: any) {
      addToast({ type: 'error', title: err?.message || 'Failed to delete asset' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/assets/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assets_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Export downloaded' });
    } catch (err: any) {
      addToast({ type: 'error', title: err?.message || 'Export failed' });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      addToast({ type: 'error', title: 'Please select a CSV file' });
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      if (importSystemId) formData.append('system_id', importSystemId);

      const token = getAccessToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/assets/import-csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      addToast({
        type: 'success',
        title: `Import complete: ${data.summary.created} created, ${data.summary.updated} updated, ${data.summary.skipped} skipped`,
      });
      setShowImportModal(false);
      setImportFile(null);
      loadAssets();
    } catch (err: any) {
      addToast({ type: 'error', title: err?.message || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  const sourceBadge = (source: string) => {
    const styles: Record<string, string> = {
      nessus_scan: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      manual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      csv_import: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[source] || styles.manual}`}>
        {source?.replace('_', ' ') || 'manual'}
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
        title="Asset Inventory"
        subtitle="Manage and monitor your infrastructure assets"
      />

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {canEdit && (
          <>
            <button onClick={openCreateModal} className={BUTTONS.primary}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Asset
            </button>
            <button onClick={handleExportCSV} className={BUTTONS.secondary}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </>
        )}
        {canManage && (
          <button onClick={() => setShowImportModal(true)} className={BUTTONS.secondary}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              placeholder="Hostname, IP, or FQDN..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System</label>
            <select
              value={systemFilter}
              onChange={(e) => { setSystemFilter(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="">All Systems</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discovery Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="">All Sources</option>
              <option value="nessus_scan">Nessus Scan</option>
              <option value="manual">Manual</option>
              <option value="csv_import">CSV Import</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assets ({total})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
            <p className="font-medium">No assets found</p>
            <p className="text-sm mt-1">Import a Nessus scan or create assets manually</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Hostname / IP</th>
                    <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>System</th>
                    <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>OS Type</th>
                    <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Environment</th>
                    <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Source</th>
                    <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Last Seen</th>
                    <th className={`px-6 py-3 text-left ${TYPOGRAPHY.tableHeader}`}>Findings</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {assets.map((asset) => (
                    <Fragment key={asset.id}>
                      <tr
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => handleExpandRow(asset)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {asset.hostname || asset.ip_address || '-'}
                          </div>
                          {asset.hostname && asset.ip_address && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{asset.ip_address}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {asset.system_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {asset.os_type || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {asset.environment && asset.environment !== 'production' && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ENVIRONMENT_COLORS[asset.environment] || 'bg-gray-100 text-gray-600'}`}>
                                {ENVIRONMENT_LABELS[asset.environment] || asset.environment}
                              </span>
                            )}
                            {asset.data_zone && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DATA_ZONE_COLORS[asset.data_zone] || 'bg-gray-100 text-gray-600'}`}>
                                {DATA_ZONE_LABELS[asset.data_zone] || asset.data_zone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">{sourceBadge(asset.discovery_source)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {asset.last_seen_at ? new Date(asset.last_seen_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {severityBadge('Critical', asset.critical_count, 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300')}
                            {severityBadge('High', asset.high_count, 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300')}
                            {severityBadge('Medium', asset.medium_count, 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300')}
                            {severityBadge('Low', asset.low_count, 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300')}
                            {asset.total_findings === 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === asset.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </td>
                      </tr>
                      {expandedId === asset.id && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">FQDN:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{expandedAsset?.fqdn || '-'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">MAC:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{expandedAsset?.mac_address || '-'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{expandedAsset?.asset_type || 'server'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Credentialed:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{expandedAsset?.scan_credentialed ? 'Yes' : 'No'}</span>
                              </div>
                            </div>

                            {expandedAsset?.recent_findings && expandedAsset.recent_findings.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recent Findings</h4>
                                <ul className="space-y-1">
                                  {expandedAsset.recent_findings.slice(0, 5).map((f) => (
                                    <li key={f.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        f.severity === 'critical' ? 'bg-red-500' :
                                        f.severity === 'high' ? 'bg-orange-500' :
                                        f.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                      }`} />
                                      {f.title}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex items-center gap-3">
                              {canEdit && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(asset); }}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                              )}
                              {canManage && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                                  disabled={deletingId === asset.id}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                  {deletingId === asset.id ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={assets.length}
                  limit={50}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingAsset ? 'Edit Asset' : 'Create Asset'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostname</label>
                <input
                  type="text"
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  placeholder="server01.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FQDN</label>
                <input
                  type="text"
                  value={formData.fqdn}
                  onChange={(e) => setFormData({ ...formData, fqdn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MAC Address</label>
                <input
                  type="text"
                  value={formData.mac_address}
                  onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  placeholder="00:1A:2B:3C:4D:5E"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OS Type</label>
                <input
                  type="text"
                  value={formData.os_type}
                  onChange={(e) => setFormData({ ...formData, os_type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  placeholder="Windows Server 2022"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Type</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value="server">Server</option>
                  <option value="workstation">Workstation</option>
                  <option value="network">Network Device</option>
                  <option value="database">Database</option>
                  <option value="application">Application</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System</label>
                <select
                  value={formData.system_id}
                  onChange={(e) => setFormData({ ...formData, system_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value="">No System</option>
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Environment</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                  <option value="govcloud">GovCloud</option>
                  <option value="commercial">Commercial</option>
                  <option value="shared">Shared</option>
                  <option value="enclave">Enclave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Zone</label>
                <select
                  value={formData.data_zone}
                  onChange={(e) => setFormData({ ...formData, data_zone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  <option value="cui">CUI</option>
                  <option value="pii">PII</option>
                  <option value="phi">PHI</option>
                  <option value="pci">PCI</option>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                  <option value="classified">Classified</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`${BUTTONS.primary} disabled:opacity-50`}
              >
                {saving ? 'Saving...' : editingAsset ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowImportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Import Assets from CSV</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              CSV should have columns: hostname, ip_address, fqdn, mac_address, os_type, asset_type
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to System (optional)</label>
                <select
                  value={importSystemId}
                  onChange={(e) => setImportSystemId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value="">No System</option>
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importFile}
                className={`${BUTTONS.primary} disabled:opacity-50`}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
