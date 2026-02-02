import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

const CADENCE_LABELS: Record<string, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually', custom: 'Custom',
};
const CADENCE_COLORS: Record<string, string> = {
  weekly: 'bg-blue-100 text-blue-700', monthly: 'bg-purple-100 text-purple-700',
  quarterly: 'bg-teal-100 text-teal-700', annually: 'bg-amber-100 text-amber-700',
  custom: 'bg-gray-100 text-gray-700',
};

function getDueStatus(nextDue: string): { label: string; color: string } {
  const today = new Date().toISOString().split('T')[0];
  const week = new Date(); week.setDate(week.getDate() + 7);
  const weekStr = week.toISOString().split('T')[0];
  if (nextDue < today) return { label: 'Overdue', color: 'text-red-600 font-semibold' };
  if (nextDue <= weekStr) return { label: 'Due Soon', color: 'text-amber-600 font-medium' };
  return { label: '', color: 'text-gray-600' };
}

export function EvidenceSchedulesPage() {
  const { t, nav } = useExperience();
  const { canEdit, user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterOwner, setFilterOwner] = useState('');
  const [filterActive, setFilterActive] = useState('true');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCadence, setFormCadence] = useState('monthly');
  const [formCustomDays, setFormCustomDays] = useState(30);
  const [formOwner, setFormOwner] = useState('');
  const [formActive, setFormActive] = useState(true);

  const load = () => {
    const params = new URLSearchParams();
    if (filterOwner) params.set('owner', filterOwner);
    if (filterActive) params.set('active', filterActive);
    Promise.all([
      api(`/api/v1/evidence/schedules?${params}`),
      api('/api/v1/evidence/schedules/stats'),
      api('/api/v1/users'),
    ]).then(([schedData, statsData, usersData]) => {
      setSchedules(schedData.schedules || []);
      setStats(statsData.stats || null);
      setUsers(usersData.users || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [filterOwner, filterActive]);

  const openCreate = () => {
    setEditId(null);
    setFormTitle(''); setFormDescription(''); setFormCadence('monthly');
    setFormCustomDays(30); setFormOwner(user?.id || ''); setFormActive(true);
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setFormTitle(s.title); setFormDescription(s.description || '');
    setFormCadence(s.cadence); setFormCustomDays(s.custom_interval_days || 30);
    setFormOwner(s.owner_user_id); setFormActive(!!s.is_active);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: formTitle, description: formDescription, cadence: formCadence,
        owner_user_id: formOwner, is_active: formActive ? 1 : 0, control_ids: [],
      };
      if (formCadence === 'custom') payload.custom_interval_days = formCustomDays;

      if (editId) {
        await api(`/api/v1/evidence/schedules/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/api/v1/evidence/schedules', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      load();
    } catch { } finally { setSaving(false); }
  };

  const handleComplete = async (id: string) => {
    setCompleting(id);
    try {
      await api(`/api/v1/evidence/schedules/${id}/complete`, { method: 'POST', body: JSON.stringify({}) });
      load();
    } catch { } finally { setCompleting(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this evidence schedule? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api(`/api/v1/evidence/schedules/${id}`, { method: 'DELETE' });
      load();
    } catch { } finally { setDeleting(null); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence Schedules</h1>
          <p className="text-gray-500 text-sm mt-1">Manage recurring evidence collection tasks and reminders</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/evidence" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">← Evidence Vault</Link>
          {canEdit && (
            <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              + New Schedule
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Active</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <p className="text-xs text-red-500 uppercase tracking-wide">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <p className="text-xs text-amber-500 uppercase tracking-wide">Due This Week</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.due_this_week}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-blue-500 uppercase tracking-wide">Due This Month</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.due_this_month}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Owners</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {/* Schedule Table */}
      {schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="text-gray-500">No evidence schedules yet.</p>
          {canEdit && <button onClick={openCreate} className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-800">Create your first schedule →</button>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cadence</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Next Due</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Last Completed</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((s) => {
                const due = getDueStatus(s.next_due_date);
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 ${due.label === 'Overdue' ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.title}</p>
                      {s.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${CADENCE_COLORS[s.cadence] || 'bg-gray-100 text-gray-700'}`}>
                        {CADENCE_LABELS[s.cadence] || s.cadence}
                        {s.cadence === 'custom' && s.custom_interval_days ? ` (${s.custom_interval_days}d)` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.owner_name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className={due.color}>{new Date(s.next_due_date + 'T00:00:00').toLocaleDateString()}</span>
                      {due.label && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded ${due.label === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{due.label}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.last_completed_date ? new Date(s.last_completed_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => handleComplete(s.id)}
                            disabled={completing === s.id}
                            className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                          >
                            {completing === s.id ? '...' : '✓ Complete'}
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={deleting === s.id}
                            className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                          >
                            {deleting === s.id ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editId ? 'Edit Schedule' : 'New Evidence Schedule'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Monthly Access Review Screenshot"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What evidence needs to be collected and how..."
                  rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cadence *</label>
                  <select value={formCadence} onChange={(e) => setFormCadence(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {formCadence === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interval (days) *</label>
                    <input type="number" min={1} max={365} value={formCustomDays} onChange={(e) => setFormCustomDays(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                <select required value={formOwner} onChange={(e) => setFormOwner(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                  <option value="">Select owner...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              {editId && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active-toggle" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="rounded" />
                  <label htmlFor="active-toggle" className="text-sm text-gray-700">Active (receives reminders)</label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editId ? 'Update Schedule' : 'Create Schedule'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
