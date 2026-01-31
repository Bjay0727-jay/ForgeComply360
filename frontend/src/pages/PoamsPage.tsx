import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

export function PoamsPage() {
  const { t, nav, isFederal } = useExperience();
  const { canEdit } = useAuth();
  const [poams, setPoams] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ system_id: '', weakness_name: '', weakness_description: '', risk_level: 'moderate', scheduled_completion: '', responsible_party: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api('/api/v1/poams'), api('/api/v1/systems')])
      .then(([p, s]) => { setPoams(p.poams); setSystems(s.systems); if (s.systems.length > 0 && !form.system_id) setForm((f) => ({ ...f, system_id: s.systems[0].id })); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api('/api/v1/poams', { method: 'POST', body: JSON.stringify(form) }); setShowCreate(false); load(); } catch { } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await api(`/api/v1/poams/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };

  const riskColor = (r: string) => r === 'critical' ? 'bg-red-100 text-red-700' : r === 'high' ? 'bg-orange-100 text-orange-700' : r === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
  const statusColor = (s: string) => s === 'completed' ? 'bg-green-100 text-green-700' : s === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : s === 'open' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600';
  const title = isFederal ? 'POA&M Tracker' : nav('poams');

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">{title}</h1><p className="text-gray-500 text-sm mt-1">Track {isFederal ? 'weaknesses and milestones' : 'findings and remediation'}</p></div>
        {canEdit && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New {t('milestone')}</button>}
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={form.system_id} onChange={(e) => setForm({ ...form, system_id: e.target.value })} required className="px-4 py-2.5 border border-gray-300 rounded-lg">
                {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg">
                <option value="low">Low Risk</option><option value="moderate">Moderate Risk</option><option value="high">High Risk</option><option value="critical">Critical Risk</option>
              </select>
            </div>
            <input type="text" placeholder={`${t('finding')} Name *`} value={form.weakness_name} onChange={(e) => setForm({ ...form, weakness_name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <textarea placeholder="Description" value={form.weakness_description} onChange={(e) => setForm({ ...form, weakness_description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={form.scheduled_completion} onChange={(e) => setForm({ ...form, scheduled_completion: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" placeholder="Target Date" />
              <input type="text" placeholder="Responsible Party" value={form.responsible_party} onChange={(e) => setForm({ ...form, responsible_party: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {poams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><p className="text-gray-500">No {t('milestone').toLowerCase()}s yet.</p></div>
      ) : (
        <div className="space-y-3">
          {poams.map((p) => (
            <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">{p.poam_id}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${riskColor(p.risk_level)}`}>{p.risk_level}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{p.weakness_name}</h3>
                  {p.weakness_description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.weakness_description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    {p.scheduled_completion && <span>Due: {p.scheduled_completion}</span>}
                    {p.responsible_party && <span>Owner: {p.responsible_party}</span>}
                  </div>
                </div>
                {canEdit ? (
                  <select value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)} className={`text-xs px-2 py-1.5 rounded-lg border font-medium ${statusColor(p.status)}`}>
                    <option value="open">Open</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="accepted">Accepted</option><option value="deferred">Deferred</option>
                  </select>
                ) : (
                  <span className={`text-xs px-2 py-1.5 rounded-lg border font-medium ${statusColor(p.status)}`}>{p.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
