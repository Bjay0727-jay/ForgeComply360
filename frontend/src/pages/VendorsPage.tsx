import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

export function VendorsPage() {
  const { t, nav, isHealthcare } = useExperience();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', criticality: 'medium', contact_name: '', contact_email: '', data_classification: '', has_baa: 0 });
  const [saving, setSaving] = useState(false);

  const load = () => { api('/api/v1/vendors').then((d) => setVendors(d.vendors)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api('/api/v1/vendors', { method: 'POST', body: JSON.stringify(form) }); setShowCreate(false); load(); } catch { } finally { setSaving(false); }
  };

  const critColor = (c: string) => c === 'critical' ? 'bg-red-100 text-red-700' : c === 'high' ? 'bg-orange-100 text-orange-700' : c === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">{nav('vendors')} (VendorGuard TPRM)</h1><p className="text-gray-500 text-sm mt-1">Manage {t('vendor').toLowerCase()} risk and compliance</p></div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New {t('vendor')}</button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder={`${t('vendor')} Name *`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-4 py-2.5 border border-gray-300 rounded-lg" />
              <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
              <input type="text" placeholder="Contact Name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
              <input type="email" placeholder="Contact Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
              <select value={form.data_classification} onChange={(e) => setForm({ ...form, data_classification: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                <option value="">Data Classification</option><option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="restricted">Restricted</option>
              </select>
            </div>
            {isHealthcare && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.has_baa === 1} onChange={(e) => setForm({ ...form, has_baa: e.target.checked ? 1 : 0 })} className="rounded" /> Business Associate Agreement (BAA) in place</label>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><p className="text-gray-500">No {t('vendor').toLowerCase()}s added yet.</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Criticality</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              {isHealthcare && <th className="text-left px-4 py-3 font-medium text-gray-500">BAA</th>}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                  <td className="px-4 py-3 text-gray-600">{v.category || '-'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${critColor(v.criticality)}`}>{v.criticality}</span></td>
                  <td className="px-4 py-3 text-gray-500">{v.contact_name || '-'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${v.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{v.status}</span></td>
                  {isHealthcare && <td className="px-4 py-3">{v.has_baa ? <span className="text-green-600">Yes</span> : <span className="text-red-500">No</span>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
