import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, FORMS, MODALS, BUTTONS, BADGES, CARDS } from '../utils/typography';

interface Connector {
  id: string;
  name: string;
  provider: 'aws' | 'azure' | 'github' | 'okta' | 'jira' | 'servicenow' | 'custom';
  status: 'active' | 'error' | 'disabled';
  last_tested?: string;
  credentials: Record<string, string>;
}

const providerConfig: Record<string, { label: string; color: string; fields: { key: string; label: string; type?: string; placeholder?: string }[] }> = {
  aws: { label: 'AWS', color: 'bg-orange-500', fields: [{ key: 'access_key_id', label: 'Access Key ID' }, { key: 'secret_access_key', label: 'Secret Access Key', type: 'password' }, { key: 'region', label: 'Region' }] },
  azure: { label: 'Azure', color: 'bg-blue-500', fields: [{ key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password' }, { key: 'tenant_id', label: 'Tenant ID' }] },
  github: { label: 'GitHub', color: 'bg-gray-600', fields: [{ key: 'token', label: 'Personal Access Token', type: 'password' }] },
  okta: { label: 'Okta', color: 'bg-blue-600', fields: [{ key: 'domain', label: 'Okta Domain' }, { key: 'api_token', label: 'API Token', type: 'password' }] },
  jira: { label: 'Jira', color: 'bg-blue-700', fields: [{ key: 'domain', label: 'Jira Domain' }, { key: 'email', label: 'Email' }, { key: 'api_token', label: 'API Token', type: 'password' }] },
  servicenow: { label: 'ServiceNow CMDB', color: 'bg-green-600', fields: [{ key: 'instance_url', label: 'Instance URL', placeholder: 'https://your-instance.service-now.com' }, { key: 'client_id', label: 'OAuth Client ID' }, { key: 'client_secret', label: 'OAuth Client Secret', type: 'password' }] },
  custom: { label: 'Custom API', color: 'bg-purple-600', fields: [{ key: 'base_url', label: 'Base URL' }, { key: 'api_key', label: 'API Key', type: 'password' }, { key: 'headers', label: 'Headers (JSON)' }] },
};

export function ConnectorsPage() {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Connector | null>(null);
  const [form, setForm] = useState<{ name: string; provider: string; credentials: Record<string, string> }>({ name: '', provider: 'aws', credentials: {} });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'testing' | 'deleting' | 'toggling' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { if (isAdmin) fetchConnectors(); }, [isAdmin]);

  const fetchConnectors = async () => {
    setLoading(true);
    try {
      const data = await api('/api/v1/connectors');
      setConnectors(data.connectors || []);
    } catch { addToast({ type: 'error', title: 'Failed to load connectors' }); }
    finally { setLoading(false); }
  };

  const openAddModal = () => { setEditing(null); setForm({ name: '', provider: 'aws', credentials: {} }); setShowModal(true); };
  const openEditModal = (c: Connector) => { setEditing(c); setForm({ name: c.name, provider: c.provider, credentials: { ...c.credentials } }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast({ type: 'error', title: 'Name is required' }); return; }
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/v1/connectors/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
        addToast({ type: 'success', title: 'Connector updated' });
      } else {
        await api('/api/v1/connectors', { method: 'POST', body: JSON.stringify(form) });
        addToast({ type: 'success', title: 'Connector created' });
      }
      setShowModal(false);
      fetchConnectors();
    } catch (e: any) { addToast({ type: 'error', title: e.message || 'Failed to save connector' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this connector?')) return;
    try {
      await api(`/api/v1/connectors/${id}`, { method: 'DELETE' });
      addToast({ type: 'success', title: 'Connector deleted' });
      fetchConnectors();
    } catch { addToast({ type: 'error', title: 'Failed to delete connector' }); }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const res = await api(`/api/v1/connectors/${id}/test`, { method: 'POST' });
      if (res.success) addToast({ type: 'success', title: 'Connection successful' });
      else addToast({ type: 'error', title: 'Connection failed', message: res.error });
      fetchConnectors();
    } catch (e: any) { addToast({ type: 'error', title: 'Test failed', message: e.message }); }
    finally { setTesting(null); }
  };

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === connectors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(connectors.map(c => c.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk actions
  const handleBulkTest = async () => {
    if (selectedIds.size === 0) return;
    setBulkAction('testing');
    try {
      const res = await api('/api/v1/connectors/bulk-test', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      addToast({
        type: res.failed > 0 ? 'warning' : 'success',
        title: `Tested ${res.success + res.failed} connectors`,
        message: res.failed > 0 ? `${res.success} passed, ${res.failed} failed` : `All ${res.success} passed`
      });
      fetchConnectors();
      clearSelection();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Bulk test failed', message: e.message });
    }
    finally { setBulkAction(null); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkAction('deleting');
    try {
      const res = await api('/api/v1/connectors/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      addToast({
        type: 'success',
        title: `Deleted ${res.success} connector${res.success !== 1 ? 's' : ''}`,
        message: res.failed > 0 ? `${res.failed} failed to delete` : undefined
      });
      fetchConnectors();
      clearSelection();
      setShowDeleteConfirm(false);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Bulk delete failed', message: e.message });
    }
    finally { setBulkAction(null); }
  };

  const handleBulkToggleStatus = async (newStatus: 'active' | 'disabled') => {
    if (selectedIds.size === 0) return;
    setBulkAction('toggling');
    try {
      const res = await api('/api/v1/connectors/bulk-status', {
        method: 'PATCH',
        body: JSON.stringify({ ids: Array.from(selectedIds), status: newStatus })
      });
      addToast({
        type: 'success',
        title: `${newStatus === 'active' ? 'Enabled' : 'Disabled'} ${res.success} connector${res.success !== 1 ? 's' : ''}`
      });
      fetchConnectors();
      clearSelection();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Status update failed', message: e.message });
    }
    finally { setBulkAction(null); }
  };

  if (!isAdmin) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Admin access required</div>;

  const currentFields = providerConfig[form.provider]?.fields || [];
  const hasSelection = selectedIds.size > 0;
  const allSelected = connectors.length > 0 && selectedIds.size === connectors.length;

  return (
    <div className="p-6">
      <PageHeader title="API Connectors" subtitle="Manage external integrations and data sources">
        <button onClick={openAddModal} className={BUTTONS.primary}>Add Connector</button>
      </PageHeader>

      {/* Bulk Action Toolbar */}
      {hasSelection && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between animate-fade-slide-in">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.size} selected
            </span>
            <button onClick={clearSelection} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkTest}
              disabled={bulkAction !== null}
              className={`${BUTTONS.sm} px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50`}
            >
              {bulkAction === 'testing' ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  Testing...
                </span>
              ) : 'Test Selected'}
            </button>
            <button
              onClick={() => handleBulkToggleStatus('active')}
              disabled={bulkAction !== null}
              className={`${BUTTONS.sm} px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50`}
            >
              Enable
            </button>
            <button
              onClick={() => handleBulkToggleStatus('disabled')}
              disabled={bulkAction !== null}
              className={`${BUTTONS.sm} px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50`}
            >
              Disable
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={bulkAction !== null}
              className={`${BUTTONS.sm} px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50`}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
      ) : connectors.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No connectors configured</p>
          <p className="text-sm">Add a connector to integrate with external services</p>
        </div>
      ) : (
        <>
          {/* Select All Header */}
          <div className="flex items-center gap-3 mb-4 px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {allSelected ? 'Deselect all' : 'Select all'}
              </span>
            </label>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              ({connectors.length} connector{connectors.length !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map(c => (
              <div
                key={c.id}
                className={`${CARDS.elevated} p-5 transition-all duration-200 ${selectedIds.has(c.id) ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`${providerConfig[c.provider]?.color || 'bg-gray-500'} text-white text-xs font-bold px-2 py-1 rounded`}>{providerConfig[c.provider]?.label || c.provider}</span>
                    <span className={`${BADGES.pill} ${c.status === 'active' ? BADGES.success : c.status === 'disabled' ? BADGES.neutral : BADGES.error}`}>{c.status}</span>
                  </div>
                </div>
                <h3 className={TYPOGRAPHY.cardTitle}>{c.name}</h3>
                {c.last_tested && <p className={`${TYPOGRAPHY.timestamp} mb-4`}>Last tested: {new Date(c.last_tested).toLocaleString()}</p>}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => handleTest(c.id)} disabled={testing === c.id || c.status === 'disabled'} className={`${BUTTONS.ghost} ${BUTTONS.sm} disabled:opacity-50`}>
                    {testing === c.id ? 'Testing...' : 'Test'}
                  </button>
                  <button onClick={() => openEditModal(c)} className={`${BUTTONS.sm} px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30`}>Edit</button>
                  <button onClick={() => handleDelete(c.id)} className={`${BUTTONS.sm} px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30`}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={MODALS.backdrop}>
          <div className={MODALS.container}>
            <div className={MODALS.header}>
              <h2 className={TYPOGRAPHY.modalTitle}>{editing ? 'Edit Connector' : 'Add Connector'}</h2>
            </div>
            <div className={`${MODALS.body} space-y-4`}>
              <div>
                <label className={FORMS.label}>Provider</label>
                <select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value, credentials: {} })} disabled={!!editing} className={FORMS.select}>
                  {Object.entries(providerConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className={FORMS.label}>Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Production AWS" className={FORMS.input} />
              </div>
              {currentFields.map(f => (
                <div key={f.key}>
                  <label className={FORMS.label}>{f.label}</label>
                  <input type={f.type || 'text'} value={form.credentials[f.key] || ''} onChange={e => setForm({ ...form, credentials: { ...form.credentials, [f.key]: e.target.value } })} placeholder={f.placeholder} className={FORMS.input} />
                </div>
              ))}
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setShowModal(false)} className={BUTTONS.secondary}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className={BUTTONS.primary}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={MODALS.backdrop}>
          <div className={`${MODALS.container} max-w-md`}>
            <div className={MODALS.header}>
              <h2 className={TYPOGRAPHY.modalTitle}>Delete Connectors</h2>
            </div>
            <div className={MODALS.body}>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <strong>{selectedIds.size}</strong> connector{selectedIds.size !== 1 ? 's' : ''}?
                This action cannot be undone.
              </p>
            </div>
            <div className={MODALS.footer}>
              <button onClick={() => setShowDeleteConfirm(false)} className={BUTTONS.secondary} disabled={bulkAction === 'deleting'}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={bulkAction === 'deleting'} className={`${BUTTONS.primary} bg-red-600 hover:bg-red-700`}>
                {bulkAction === 'deleting' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
