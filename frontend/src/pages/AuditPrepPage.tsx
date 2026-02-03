import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  controls: { label: 'Controls', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'blue' },
  poams: { label: 'POA&Ms', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'amber' },
  evidence: { label: 'Evidence', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', color: 'purple' },
  ssp: { label: 'SSP / Documentation', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'teal' },
  monitoring: { label: 'Continuous Monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'indigo' },
  approvals: { label: 'Approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'green' },
  system: { label: 'System Authorization', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'gray' },
};

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBg(score: number): string {
  if (score >= 90) return 'bg-green-100 border-green-300';
  if (score >= 70) return 'bg-amber-100 border-amber-300';
  return 'bg-red-100 border-red-300';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Audit Ready';
  if (score >= 70) return 'Needs Attention';
  return 'Not Ready';
}

export function AuditPrepPage() {
  const { canEdit, canManage, user } = useAuth();
  const [readiness, setReadiness] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      api('/api/v1/audit-prep/readiness'),
      api('/api/v1/users').catch(() => ({ users: [] })),
    ]).then(([r, u]) => {
      setReadiness(r.readiness);
      setUsers(u.users || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleCollapse = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSaving(true);
    try {
      await api('/api/v1/audit-prep/items', {
        method: 'POST',
        body: JSON.stringify({ title: taskTitle, assigned_to: taskAssignee || null, due_date: taskDueDate || null }),
      });
      setTaskTitle(''); setTaskAssignee(''); setTaskDueDate(''); setShowAddTask(false);
      load();
    } catch { } finally { setSaving(false); }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    setToggling(id);
    try {
      await api(`/api/v1/audit-prep/items/${id}`, {
        method: 'PUT', body: JSON.stringify({ completed: !completed }),
      });
      load();
    } catch { } finally { setToggling(null); }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api(`/api/v1/audit-prep/items/${id}`, { method: 'DELETE' });
      load();
    } catch { }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (!readiness) return <div className="text-center py-12 text-gray-500">Unable to load audit readiness data.</div>;

  const { score, total_checks, passed_checks, categories } = readiness;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Preparation Checklist</h1>
          <p className="text-gray-500 text-sm mt-1">Track audit readiness across controls, POA&Ms, evidence, SSP, and monitoring</p>
        </div>
        <Link to="/reports" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">Reports &rarr;</Link>
      </div>

      {/* Readiness Score */}
      <div className={`rounded-xl border-2 p-6 mb-6 ${scoreBg(score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Audit Readiness Score</p>
            <div className="flex items-baseline gap-3 mt-1">
              <span className={`text-5xl font-bold ${scoreColor(score)}`}>{score}%</span>
              <span className={`text-lg font-semibold ${scoreColor(score)}`}>{scoreLabel(score)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{passed_checks} of {total_checks} checks passed</p>
          </div>
          {/* Progress ring */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={score >= 90 ? '#16a34a' : score >= 70 ? '#d97706' : '#dc2626'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${score * 2.64} ${264 - score * 2.64}`} />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${scoreColor(score)}`}>{passed_checks}/{total_checks}</span>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-4">
        {Object.entries(categories).filter(([k]) => k !== 'custom').map(([catKey, cat]: [string, any]) => {
          const meta = CATEGORY_META[catKey];
          if (!meta) return null;
          const isCollapsed = collapsed[catKey];
          const allPassed = cat.passed === cat.total;

          return (
            <div key={catKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <button onClick={() => toggleCollapse(catKey)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${allPassed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} /></svg>
                  </div>
                  <span className="font-semibold text-gray-900">{meta.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${allPassed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {cat.passed}/{cat.total}
                  </span>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Category Items */}
              {!isCollapsed && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {(cat.items || []).map((item: any) => (
                    <div key={item.key} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {item.passed ? (
                          <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${item.passed ? 'text-gray-700' : 'text-gray-900'}`}>{item.label}</p>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${item.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {item.value}
                        </span>
                        <Link to={item.link} className="text-xs text-blue-600 hover:text-blue-800 font-medium">View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Tasks Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <span className="font-semibold text-gray-900">Custom Tasks</span>
              {categories.custom && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${categories.custom.passed === categories.custom.total && categories.custom.total > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {categories.custom.passed}/{categories.custom.total}
                </span>
              )}
            </div>
            {canEdit && (
              <button onClick={() => setShowAddTask(!showAddTask)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                {showAddTask ? 'Cancel' : '+ Add Task'}
              </button>
            )}
          </div>

          {/* Add Task Form */}
          {showAddTask && (
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <form onSubmit={handleAddTask} className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-gray-500 mb-1">Task *</label>
                  <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g., Schedule assessor interviews"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="w-40">
                  <label className="block text-xs text-gray-500 mb-1">Assignee</label>
                  <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Unassigned</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="w-40">
                  <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                  <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? '...' : 'Add'}
                </button>
              </form>
            </div>
          )}

          {/* Custom Task List */}
          <div className="border-t border-gray-100 divide-y divide-gray-50">
            {(categories.custom?.items || []).length === 0 && !showAddTask && (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">No custom tasks yet. Add tasks like "Schedule interviews", "Reserve conference room", etc.</div>
            )}
            {(categories.custom?.items || []).map((task: any) => {
              const overdue = task.due_date && !task.completed && task.due_date < new Date().toISOString().split('T')[0];
              return (
                <div key={task.id} className={`flex items-center gap-3 px-4 py-3 ${task.completed ? 'bg-gray-50/50' : overdue ? 'bg-red-50/30' : ''}`}>
                  <button
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    disabled={toggling === task.id}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'}`}
                  >
                    {task.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.assigned_to_name && <span className="text-xs text-gray-500">{task.assigned_to_name}</span>}
                      {task.due_date && (
                        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                        </span>
                      )}
                      {task.completed && task.completed_at && (
                        <span className="text-xs text-green-600">Completed {new Date(task.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">Delete</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
