import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

export function SystemsPage() {
  const { t, nav } = useExperience();
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', acronym: '', description: '', impact_level: 'moderate', deployment_model: '', service_model: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api('/api/v1/systems').then((d) => setSystems(d.systems)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/v1/systems', { method: 'POST', body: JSON.stringify(form) });
      setShowCreate(false);
      setForm({ name: '', acronym: '', description: '', impact_level: 'moderate', deployment_model: '', service_model: '' });
      load();
    } catch { } finally { setSaving(false); }
  };

  const impactColor = (level: string) => level === 'high' ? 'bg-red-100 text-red-700' : level === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
  const statusColor = (s: string) => s === 'authorized' ? 'bg-green-100 text-green-700' : s === 'denied' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{nav('systems')}</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your {t('system').toLowerCase()}s</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + New {t('system')}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create {t('system')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="System Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Acronym" value={form.acronym} onChange={(e) => setForm({ ...form, acronym: e.target.value.toUpperCase() })} maxLength={10} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={form.impact_level} onChange={(e) => setForm({ ...form, impact_level: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg">
                <option value="low">Low Impact</option>
                <option value="moderate">Moderate Impact</option>
                <option value="high">High Impact</option>
              </select>
              <select value={form.deployment_model} onChange={(e) => setForm({ ...form, deployment_model: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg">
                <option value="">Deployment Model</option>
                <option value="cloud">Cloud</option>
                <option value="on_premises">On-Premises</option>
                <option value="hybrid">Hybrid</option>
                <option value="government_cloud">Government Cloud</option>
              </select>
              <select value={form.service_model} onChange={(e) => setForm({ ...form, service_model: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg">
                <option value="">Service Model</option>
                <option value="IaaS">IaaS</option>
                <option value="PaaS">PaaS</option>
                <option value="SaaS">SaaS</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : systems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No {t('system').toLowerCase()}s yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((sys) => (
            <div key={sys.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{sys.name}</h3>
                  {sys.acronym && <p className="text-xs text-gray-500">{sys.acronym}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(sys.status)}`}>{sys.status}</span>
              </div>
              {sys.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{sys.description}</p>}
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${impactColor(sys.impact_level)}`}>{sys.impact_level}</span>
                {sys.deployment_model && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{sys.deployment_model}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
