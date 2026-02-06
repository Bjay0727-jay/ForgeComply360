import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, FORMS, MODALS, BUTTONS, BADGES, CARDS } from '../utils/typography';

interface Connector {
  id: string;
  name: string;
  provider: 'aws' | 'azure' | 'github' | 'okta' | 'jira' | 'custom';
  status: 'active' | 'error';
  last_tested?: string;
  credentials: Record<string, string>;
}

const providerConfig: Record<string, { label: string; color: string; fields: { key: string; label: string; type?: string }[] }> = {
  aws: { label: 'AWS', color: 'bg-orange-500', fields: [{ key: 'access_key_id', label: 'Access Key ID' }, { key: 'secret_access_key', label: 'Secret Access Key', type: 'password' }, { key: 'region', label: 'Region' }] },
  azure: { label: 'Azure', color: 'bg-blue-500', fields: [{ key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password' }, { key: 'tenant_id', label: 'Tenant ID' }] },
  github: { label: 'GitHub', color: 'bg-gray-600', fields: [{ key: 'token', label: 'Personal Access Token', type: 'password' }] },
  okta: { label: 'Okta', color: 'bg-blue-600', fields: [{ key: 'domain', label: 'Okta Domain' }, { key: 'api_token', label: 'API Token', type: 'password' }] },
  jira: { label: 'Jira', color: 'bg-blue-700', fields: [{ key: 'domain', label: 'Jira Domain' }, { key: 'email', label: 'Email' }, { key: 'api_token', label: 'API Token', type: 'password' }] },
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

  if (!isAdmin) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Admin access required</div>;

  const currentFields = providerConfig[form.provider]?.fields || [];

  return (
    <div className="p-6">
      <PageHeader title="API Connectors" subtitle="Manage external integrations and data sources">
        <button onClick={openAddModal} className={BUTTONS.primary}>Add Connector</button>
      </PageHeader>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map(c => (
            <div key={c.id} className={`${CARDS.elevated} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`${providerConfig[c.provider]?.color || 'bg-gray-500'} text-white text-xs font-bold px-2 py-1 rounded`}>{providerConfig[c.provider]?.label || c.provider}</span>
                  <span className={`${BADGES.pill} ${c.status === 'active' ? BADGES.success : BADGES.error}`}>{c.status}</span>
                </div>
              </div>
              <h3 className={TYPOGRAPHY.cardTitle}>{c.name}</h3>
              {c.last_tested && <p className={`${TYPOGRAPHY.timestamp} mb-4`}>Last tested: {new Date(c.last_tested).toLocaleString()}</p>}
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <button onClick={() => handleTest(c.id)} disabled={testing === c.id} className={`${BUTTONS.ghost} ${BUTTONS.sm}`}>
                  {testing === c.id ? 'Testing...' : 'Test'}
                </button>
                <button onClick={() => openEditModal(c)} className={`${BUTTONS.sm} px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100`}>Edit</button>
                <button onClick={() => handleDelete(c.id)} className={`${BUTTONS.sm} px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100`}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <input type={f.type || 'text'} value={form.credentials[f.key] || ''} onChange={e => setForm({ ...form, credentials: { ...form.credentials, [f.key]: e.target.value } })} className={FORMS.input} />
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
    </div>
  );
}
