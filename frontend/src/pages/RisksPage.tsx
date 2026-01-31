import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

export function RisksPage() {
  const { t, nav } = useExperience();
  const [risks, setRisks] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', system_id: '', category: 'technical', likelihood: 3, impact: 3, treatment: 'mitigate', owner: '' });
  const [saving, setSaving] = useState(false);

  const load = () => { Promise.all([api('/api/v1/risks'), api('/api/v1/systems')]).then(([r, s]) => { setRisks(r.risks); setSystems(s.systems); }).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api('/api/v1/risks', { method: 'POST', body: JSON.stringify(form) }); setShowCreate(false); load(); } catch { } finally { setSaving(false); }
  };

  const riskColor = (score: number) => score >= 15 ? 'bg-red-100 text-red-700 border-red-200' : score >= 10 ? 'bg-orange-100 text-orange-700 border-orange-200' : score >= 5 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200';

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">{nav('risks')} (RiskForge ERM)</h1><p className="text-gray-500 text-sm mt-1">Identify, assess, and manage organizational {t('risk').toLowerCase()}s</p></div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New {t('risk')}</button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" placeholder={`${t('risk')} Title *`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select value={form.system_id} onChange={(e) => setForm({ ...form, system_id: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                <option value="">All Systems</option>{systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                {['technical', 'operational', 'compliance', 'financial', 'reputational', 'strategic'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <div><label className="text-xs text-gray-500">Likelihood (1-5)</label><input type="number" min={1} max={5} value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: +e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="text-xs text-gray-500">Impact (1-5)</label><input type="number" min={1} max={5} value={form.impact} onChange={(e) => setForm({ ...form, impact: +e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                <option value="mitigate">Mitigate</option><option value="accept">Accept</option><option value="transfer">Transfer</option><option value="avoid">Avoid</option>
              </select>
              <input type="text" placeholder="Risk Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {risks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><p className="text-gray-500">No {t('risk').toLowerCase()}s recorded yet.</p></div>
      ) : (
        <div className="space-y-3">
          {risks.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">{r.risk_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${riskColor(r.risk_score)}`}>Score: {r.risk_score}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{r.category}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{r.title}</h3>
                  {r.description && <p className="text-xs text-gray-500 mt-1">{r.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>L:{r.likelihood} x I:{r.impact}</span>
                    <span className="capitalize">Treatment: {r.treatment}</span>
                    {r.owner && <span>Owner: {r.owner}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium capitalize ${r.status === 'closed' ? 'bg-green-100 text-green-700' : r.status === 'in_treatment' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
