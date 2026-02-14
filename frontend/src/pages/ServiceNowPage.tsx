import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, FORMS, BUTTONS, BADGES, CARDS } from '../utils/typography';

interface Connector {
  id: string;
  name: string;
  status: 'active' | 'error';
  last_test_at?: string;
  last_test_status?: string;
}

interface SyncHistory {
  id: string;
  sync_type: 'manual' | 'scheduled';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  assets_created: number;
  assets_updated: number;
  assets_skipped: number;
  assets_failed: number;
  total_cis_fetched: number;
  error_message?: string;
  triggered_by_name?: string;
}

interface Schedule {
  id: string;
  is_enabled: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  hour_utc: number;
  day_of_week?: number;
  next_sync_at?: string;
  last_sync_at?: string;
  sync_options: string;
}

interface CIClass {
  ci_class: string;
  asset_type: string;
  label: string;
}

interface System {
  id: string;
  name: string;
}

export function ServiceNowPage() {
  const { isAdmin, canManage } = useAuth();
  const { addToast } = useToast();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<string>('');
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [ciClasses, setCIClasses] = useState<CIClass[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  // Sync options
  const [selectedCIClasses, setSelectedCIClasses] = useState<string[]>(['cmdb_ci_server', 'cmdb_ci_computer']);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');

  // Schedule form
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<string>('daily');
  const [scheduleHour, setScheduleHour] = useState(2);

  useEffect(() => {
    fetchConnectors();
    fetchSystems();
  }, []);

  useEffect(() => {
    if (selectedConnector) {
      fetchSyncHistory();
      fetchSchedule();
      fetchCIClasses();
    }
  }, [selectedConnector]);

  const fetchConnectors = async () => {
    try {
      const data = await api('/api/v1/connectors');
      const snowConnectors = (data.connectors || []).filter((c: any) => c.provider === 'servicenow');
      setConnectors(snowConnectors);
      if (snowConnectors.length > 0 && !selectedConnector) {
        setSelectedConnector(snowConnectors[0].id);
      }
    } catch { addToast({ type: 'error', title: 'Failed to load connectors' }); }
    finally { setLoading(false); }
  };

  const fetchSystems = async () => {
    try {
      const data = await api('/api/v1/systems');
      setSystems(data.systems || []);
    } catch {}
  };

  const fetchSyncHistory = async () => {
    try {
      const data = await api(`/api/v1/connectors/${selectedConnector}/servicenow/sync-history?limit=10`);
      setSyncHistory(data.syncs || []);
    } catch {}
  };

  const fetchSchedule = async () => {
    try {
      const data = await api(`/api/v1/connectors/${selectedConnector}/servicenow/schedule`);
      setSchedule(data.schedule);
      if (data.schedule) {
        setScheduleEnabled(data.schedule.is_enabled === 1);
        setScheduleFrequency(data.schedule.frequency);
        setScheduleHour(data.schedule.hour_utc);
      }
    } catch {}
  };

  const fetchCIClasses = async () => {
    try {
      const data = await api(`/api/v1/connectors/${selectedConnector}/servicenow/ci-classes`);
      setCIClasses(data.ci_classes || []);
    } catch {}
  };

  const handleAuthorize = async () => {
    setAuthorizing(true);
    try {
      const data = await api(`/api/v1/connectors/${selectedConnector}/servicenow/oauth/authorize`, { method: 'POST' });
      if (data.auth_url) {
        // Store state for callback
        sessionStorage.setItem('servicenow_oauth_state', data.state);
        sessionStorage.setItem('servicenow_connector_id', selectedConnector);
        window.location.href = data.auth_url;
      }
    } catch (e: any) {
      addToast({ type: 'error', title: e.message || 'Failed to start OAuth flow' });
    }
    finally { setAuthorizing(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const data = await api(`/api/v1/connectors/${selectedConnector}/servicenow/sync`, {
        method: 'POST',
        body: JSON.stringify({
          ci_classes: selectedCIClasses,
          system_id: selectedSystemId || null,
        })
      });
      addToast({ type: 'success', title: 'Sync started', message: `Sync ID: ${data.sync_id}` });
      setTimeout(fetchSyncHistory, 2000);
    } catch (e: any) {
      addToast({ type: 'error', title: e.message || 'Failed to start sync' });
    }
    finally { setSyncing(false); }
  };

  const handleSaveSchedule = async () => {
    try {
      await api(`/api/v1/connectors/${selectedConnector}/servicenow/schedule`, {
        method: 'PUT',
        body: JSON.stringify({
          is_enabled: scheduleEnabled,
          frequency: scheduleFrequency,
          hour_utc: scheduleHour,
          sync_options: {
            ci_classes: selectedCIClasses,
            system_id: selectedSystemId || null,
          }
        })
      });
      addToast({ type: 'success', title: 'Schedule saved' });
      fetchSchedule();
    } catch (e: any) {
      addToast({ type: 'error', title: e.message || 'Failed to save schedule' });
    }
  };

  const toggleCIClass = (ciClass: string) => {
    setSelectedCIClasses(prev =>
      prev.includes(ciClass) ? prev.filter(c => c !== ciClass) : [...prev, ciClass]
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return styles[status] || styles.pending;
  };

  const selectedConnectorData = connectors.find(c => c.id === selectedConnector);

  if (!canManage) {
    return (
      <div className="p-6">
        <p className={TYPOGRAPHY.bodyMuted}>Manager access required to view ServiceNow integration.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="ServiceNow CMDB Integration"
        subtitle="Sync Configuration Items from ServiceNow CMDB to your asset inventory"
      />

      {/* Connector Selection */}
      <div className={CARDS.base}>
        <h3 className={TYPOGRAPHY.sectionTitle}>ServiceNow Connector</h3>
        {connectors.length === 0 ? (
          <p className={TYPOGRAPHY.bodyMuted}>No ServiceNow connectors configured. Go to Settings &gt; Connectors to add one.</p>
        ) : (
          <div className="space-y-4">
            <select
              value={selectedConnector}
              onChange={e => setSelectedConnector(e.target.value)}
              className={FORMS.select}
            >
              {connectors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {selectedConnectorData && (
              <div className="flex items-center gap-4">
                <span className={`${BADGES.base} ${selectedConnectorData.status === 'active' ? BADGES.success : BADGES.error}`}>
                  {selectedConnectorData.status === 'active' ? 'Connected' : 'Not Authorized'}
                </span>
                {selectedConnectorData.last_test_at && (
                  <span className={TYPOGRAPHY.bodyMuted}>
                    Last tested: {new Date(selectedConnectorData.last_test_at).toLocaleString()}
                  </span>
                )}
                {isAdmin && selectedConnectorData.status !== 'active' && (
                  <button onClick={handleAuthorize} disabled={authorizing} className={BUTTONS.primary}>
                    {authorizing ? 'Redirecting...' : 'Authorize with ServiceNow'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedConnector && selectedConnectorData?.status === 'active' && (
        <>
          {/* Sync Configuration */}
          <div className={CARDS.base}>
            <h3 className={TYPOGRAPHY.sectionTitle}>Sync Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={TYPOGRAPHY.label}>CI Classes to Sync</label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {ciClasses.map(ci => (
                    <label key={ci.ci_class} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCIClasses.includes(ci.ci_class)}
                        onChange={() => toggleCIClass(ci.ci_class)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={TYPOGRAPHY.body}>{ci.label}</span>
                      <span className={`${BADGES.base} ${BADGES.info}`}>{ci.asset_type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={TYPOGRAPHY.label}>Assign to System (Optional)</label>
                <select
                  value={selectedSystemId}
                  onChange={e => setSelectedSystemId(e.target.value)}
                  className={`${FORMS.select} mt-2`}
                >
                  <option value="">No system assignment</option>
                  {systems.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className={`${TYPOGRAPHY.bodyMuted} mt-1`}>
                  Assets will be linked to this information system.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleSync}
                disabled={syncing || selectedCIClasses.length === 0}
                className={BUTTONS.primary}
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>

          {/* Scheduled Sync */}
          {isAdmin && (
            <div className={CARDS.base}>
              <h3 className={TYPOGRAPHY.sectionTitle}>Scheduled Sync</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={e => setScheduleEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={TYPOGRAPHY.body}>Enable automatic sync</span>
                </label>

                {scheduleEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className={TYPOGRAPHY.label}>Frequency</label>
                      <select
                        value={scheduleFrequency}
                        onChange={e => setScheduleFrequency(e.target.value)}
                        className={FORMS.select}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    {scheduleFrequency !== 'hourly' && (
                      <div>
                        <label className={TYPOGRAPHY.label}>Hour (UTC)</label>
                        <select
                          value={scheduleHour}
                          onChange={e => setScheduleHour(parseInt(e.target.value))}
                          className={FORMS.select}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00 UTC</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4">
                  <button onClick={handleSaveSchedule} className={BUTTONS.primary}>
                    Save Schedule
                  </button>
                  {schedule?.next_sync_at && (
                    <span className={TYPOGRAPHY.bodyMuted}>
                      Next sync: {new Date(schedule.next_sync_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sync History */}
          <div className={CARDS.base}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={TYPOGRAPHY.sectionTitle}>Sync History</h3>
              <button onClick={fetchSyncHistory} className={BUTTONS.secondary}>
                Refresh
              </button>
            </div>
            {syncHistory.length === 0 ? (
              <p className={TYPOGRAPHY.bodyMuted}>No sync history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Started</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CIs Fetched</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Updated</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Triggered By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {syncHistory.map(sync => (
                      <tr key={sync.id}>
                        <td className="px-4 py-3">
                          <span className={`${BADGES.base} ${getStatusBadge(sync.status)}`}>
                            {sync.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{sync.sync_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(sync.started_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{sync.total_cis_fetched}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{sync.assets_created}</td>
                        <td className="px-4 py-3 text-sm text-blue-600">{sync.assets_updated}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{sync.triggered_by_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
