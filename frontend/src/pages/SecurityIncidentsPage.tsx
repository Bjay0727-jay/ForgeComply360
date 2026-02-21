import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, CARDS, BUTTONS, BADGES } from '../utils/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  source_ip: string | null;
  affected_user_id: string | null;
  affected_user_name: string | null;
  affected_user_email: string | null;
  detected_at: string;
  resolved_at: string | null;
  dir_notified: number;
  dir_notification_deadline: string | null;
  details: Record<string, unknown> & { notes?: Note[] };
  created_at: string;
  updated_at: string;
}

interface Note {
  author: string;
  author_id: string;
  text: string;
  timestamp: string;
}

interface Stats {
  open: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  dir_pending: number;
  avg_resolution_hours: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  investigating: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  contained: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const STATUS_FLOW = ['open', 'investigating', 'contained', 'resolved', 'closed'];

const TYPE_LABELS: Record<string, string> = {
  brute_force: 'Brute Force',
  mass_lockout: 'Mass Lockout',
  privilege_escalation: 'Privilege Escalation',
  emergency_access: 'Emergency Access',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SecurityIncidentsPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  // Data
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Incident | null>(null);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ---------- Fetch ----------

  const fetchIncidents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterStatus) params.set('status', filterStatus);
      if (filterSeverity) params.set('severity', filterSeverity);
      if (filterType) params.set('type', filterType);
      const data = await api(`/api/v1/incidents?${params}`);
      setIncidents(data.incidents);
      setTotal(data.total);
    } catch {
      addToast('Failed to load incidents', 'error');
    }
  }, [page, filterStatus, filterSeverity, filterType, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api('/api/v1/incidents/stats');
      setStats(data.stats);
    } catch { /* stats are non-critical */ }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const data = await api(`/api/v1/incidents/${id}`);
      setDetail(data.incident);
    } catch {
      addToast('Failed to load incident details', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchIncidents(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchIncidents, fetchStats]);

  // ---------- Actions ----------

  const handleStatusChange = async (id: string, newStatus: string) => {
    setSubmitting(true);
    try {
      const data = await api(`/api/v1/incidents/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      setDetail(data.incident);
      await Promise.all([fetchIncidents(), fetchStats()]);
      addToast(`Status updated to ${newStatus}`, 'success');
    } catch {
      addToast('Failed to update status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (id: string) => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      await api(`/api/v1/incidents/${id}/notes`, { method: 'POST', body: JSON.stringify({ text: noteText }) });
      setNoteText('');
      await fetchDetail(id);
      addToast('Note added', 'success');
    } catch {
      addToast('Failed to add note', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDIRNotify = async (id: string) => {
    setSubmitting(true);
    try {
      await api(`/api/v1/incidents/${id}/dir-notify`, { method: 'POST' });
      await Promise.all([fetchDetail(id), fetchStats()]);
      addToast('DIR notification recorded', 'success');
    } catch (e: any) {
      addToast(e?.message || 'Failed to mark DIR notified', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = await api('/api/v1/incidents/export');
      const rows = data.incidents as Record<string, unknown>[];
      if (!rows.length) { addToast('No incidents to export', 'info'); return; }
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('Failed to export incidents', 'error');
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
    } else {
      setExpandedId(id);
      fetchDetail(id);
    }
    setNoteText('');
  };

  const totalPages = Math.ceil(total / limit);

  // ---------- Helpers ----------

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleString() : '—';

  const deadlineUrgency = (deadline: string | null) => {
    if (!deadline) return null;
    const hoursLeft = (new Date(deadline).getTime() - Date.now()) / 3600000;
    if (hoursLeft < 0) return 'overdue';
    if (hoursLeft < 12) return 'urgent';
    if (hoursLeft < 24) return 'warning';
    return 'ok';
  };

  // ---------- Render ----------

  return (
    <div>
      <PageHeader title="Security Incidents" subtitle="Monitor and respond to detected security events">
        <button onClick={handleExportCSV} className={`${BUTTONS.secondary} text-sm flex items-center gap-1.5`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${CARDS.elevated} p-4`}>
            <p className={TYPOGRAPHY.label}>Open Incidents</p>
            <p className="text-2xl font-bold mt-1">{stats.open}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.entries(stats.by_severity).map(([sev, cnt]) => (
                <span key={sev} className={`text-xs px-1.5 py-0.5 rounded font-medium ${SEVERITY_COLORS[sev] || BADGES.neutral}`}>
                  {sev}: {cnt}
                </span>
              ))}
            </div>
          </div>
          <div className={`${CARDS.elevated} p-4`}>
            <p className={TYPOGRAPHY.label}>Critical / High</p>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {(stats.by_severity.critical || 0) + (stats.by_severity.high || 0)}
            </p>
          </div>
          <div className={`${CARDS.elevated} p-4`}>
            <p className={TYPOGRAPHY.label}>DIR Notifications Pending</p>
            <p className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">{stats.dir_pending}</p>
            <p className="text-xs text-gray-500 mt-1">TAC-202 48h deadline</p>
          </div>
          <div className={`${CARDS.elevated} p-4`}>
            <p className={TYPOGRAPHY.label}>Avg Resolution Time</p>
            <p className="text-2xl font-bold mt-1">
              {stats.avg_resolution_hours != null ? `${stats.avg_resolution_hours.toFixed(1)}h` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`${CARDS.elevated} p-4 mb-6 flex flex-wrap items-center gap-3`}>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="text-sm border rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600">
          <option value="">All Statuses</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filterSeverity} onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
          className="text-sm border rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600">
          <option value="">All Severities</option>
          {['critical', 'high', 'medium', 'low'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="text-sm border rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600">
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className={`ml-auto text-sm ${TYPOGRAPHY.bodyMuted}`}>{total} incident{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className={`${CARDS.elevated} p-12 text-center`}>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className={TYPOGRAPHY.bodyMuted}>Loading incidents...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className={`${CARDS.elevated} p-12 text-center`}>
          <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <p className={TYPOGRAPHY.bodyMuted}>No security incidents found. The system is continuously monitoring for threats.</p>
        </div>
      ) : (
        <div className={`${CARDS.elevated} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium">Severity</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Detected</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">DIR Deadline</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <React.Fragment key={inc.id}>
                  <tr
                    onClick={() => toggleExpand(inc.id)}
                    className="border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_COLORS[inc.severity] || BADGES.neutral}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{inc.title}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${BADGES.neutral}`}>{TYPE_LABELS[inc.incident_type] || inc.incident_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[inc.status] || BADGES.neutral}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(inc.detected_at)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {inc.dir_notification_deadline ? (
                        <span className={`text-xs font-medium ${
                          inc.dir_notified ? 'text-green-600' :
                          deadlineUrgency(inc.dir_notification_deadline) === 'overdue' ? 'text-red-600' :
                          deadlineUrgency(inc.dir_notification_deadline) === 'urgent' ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {inc.dir_notified ? 'Notified' : formatDate(inc.dir_notification_deadline)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {expandedId === inc.id && detail && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-gray-50/50 dark:bg-gray-800/20 border-b">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left: Info */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <p className={TYPOGRAPHY.label}>Description</p>
                              <p className="text-sm mt-1">{detail.description || 'No description'}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                              {detail.affected_user_name && (
                                <div>
                                  <span className={TYPOGRAPHY.label}>Affected User: </span>
                                  <span>{detail.affected_user_name} ({detail.affected_user_email})</span>
                                </div>
                              )}
                              {detail.source_ip && (
                                <div>
                                  <span className={TYPOGRAPHY.label}>Source IP: </span>
                                  <span className="font-mono">{detail.source_ip}</span>
                                </div>
                              )}
                            </div>

                            {/* Status Workflow */}
                            <div>
                              <p className={`${TYPOGRAPHY.label} mb-2`}>Status Workflow</p>
                              <div className="flex items-center gap-1 flex-wrap">
                                {STATUS_FLOW.map((step, idx) => {
                                  const currentIdx = STATUS_FLOW.indexOf(detail.status);
                                  const isCompleted = idx <= currentIdx;
                                  const isNext = idx === currentIdx + 1;
                                  return (
                                    <React.Fragment key={step}>
                                      {idx > 0 && (
                                        <svg className={`w-4 h-4 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      )}
                                      <button
                                        disabled={!isNext || submitting}
                                        onClick={() => isNext && handleStatusChange(detail.id, step)}
                                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                                          isCompleted
                                            ? STATUS_COLORS[step]
                                            : isNext
                                              ? 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600'
                                              : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                        }`}
                                      >
                                        {step}
                                      </button>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                              {detail.resolved_at && (
                                <p className="text-xs text-gray-500 mt-1">Resolved: {formatDate(detail.resolved_at)}</p>
                              )}
                            </div>

                            {/* DIR Notification */}
                            {detail.dir_notification_deadline && (
                              <div className={`p-3 rounded border ${detail.dir_notified ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {detail.dir_notified ? 'DIR Notification Sent' : 'DIR Notification Required (TAC-202)'}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                      Deadline: {formatDate(detail.dir_notification_deadline)}
                                      {!detail.dir_notified && deadlineUrgency(detail.dir_notification_deadline) === 'overdue' && (
                                        <span className="text-red-600 font-bold ml-2">OVERDUE</span>
                                      )}
                                    </p>
                                  </div>
                                  {!detail.dir_notified && (
                                    <button
                                      onClick={() => handleDIRNotify(detail.id)}
                                      disabled={submitting}
                                      className={`${BUTTONS.primary} text-xs`}
                                    >
                                      Mark as Notified
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: Investigation Notes */}
                          <div>
                            <p className={`${TYPOGRAPHY.label} mb-2`}>Investigation Notes</p>
                            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                              {(detail.details?.notes && detail.details.notes.length > 0) ? (
                                detail.details.notes.map((note, i) => (
                                  <div key={i} className="p-2 bg-white dark:bg-gray-800 rounded border text-xs">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                      <span className="font-medium">{note.author}</span>
                                      <span>{new Date(note.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p>{note.text}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-400 italic">No notes yet</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNote(detail.id)}
                                placeholder="Add investigation note..."
                                className="flex-1 text-xs border rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600"
                              />
                              <button
                                onClick={() => handleAddNote(detail.id)}
                                disabled={submitting || !noteText.trim()}
                                className={`${BUTTONS.primary} text-xs px-3`}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                  className={`${BUTTONS.secondary} text-xs px-2 py-1`}>Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                  className={`${BUTTONS.secondary} text-xs px-2 py-1`}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
