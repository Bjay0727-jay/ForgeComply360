import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { exportAuditLogCSV } from '../utils/exportHelpers';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { TYPOGRAPHY } from '../utils/typography';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  register: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  upsert: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  upload: 'bg-purple-100 text-purple-700',
  link: 'bg-purple-100 text-purple-700',
  generate: 'bg-yellow-100 text-yellow-700',
  ai_generate: 'bg-yellow-100 text-yellow-700',
  ai_narrative: 'bg-yellow-100 text-yellow-700',
  bulk_update: 'bg-indigo-100 text-indigo-700',
  bulk_init: 'bg-indigo-100 text-indigo-700',
  bulk_ai_narrative: 'bg-indigo-100 text-indigo-700',
  login: 'bg-gray-100 text-gray-600',
  run: 'bg-cyan-100 text-cyan-700',
  enable_framework: 'bg-teal-100 text-teal-700',
  disable_framework: 'bg-orange-100 text-orange-700',
  update_experience: 'bg-blue-100 text-blue-700',
  update_role: 'bg-amber-100 text-amber-700',
  create_snapshot: 'bg-teal-100 text-teal-700',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  upsert: 'Saved',
  upload: 'Uploaded',
  link: 'Linked',
  generate: 'Generated',
  ai_generate: 'AI Generated',
  ai_narrative: 'ForgeML Writer',
  bulk_init: 'Bulk Init',
  bulk_update: 'Bulk Updated',
  bulk_ai_narrative: 'Bulk ForgeML Writer',
  login: 'Logged In',
  register: 'Registered',
  enable_framework: 'Enabled Framework',
  disable_framework: 'Disabled Framework',
  update_experience: 'Changed Experience',
  update_role: 'Changed Role',
  run: 'Ran Check',
  create_snapshot: 'Snapshot',
};

const RESOURCE_LABELS: Record<string, string> = {
  system: 'System',
  poam: 'POA&M',
  evidence: 'Evidence',
  control_implementation: 'Control',
  ssp: 'SSP',
  risk: 'Risk',
  vendor: 'Vendor',
  user: 'User',
  organization: 'Organization',
  framework: 'Framework',
  monitoring_check: 'Monitoring Check',
  ai_document: 'AI Document',
  ai_template: 'AI Template',
  compliance_snapshot: 'Snapshot',
};

const ACTIONS = Object.keys(ACTION_LABELS);
const RESOURCE_TYPES = Object.keys(RESOURCE_LABELS);

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}

function summarizeDetails(details: string): string {
  try {
    const obj = typeof details === 'string' ? JSON.parse(details) : details;
    if (!obj || typeof obj !== 'object') return '';
    const parts: string[] = [];
    if (obj.name) parts.push(`name: ${obj.name}`);
    if (obj.title) parts.push(`title: ${obj.title}`);
    if (obj.status) parts.push(`status: ${obj.status}`);
    if (obj.email) parts.push(`email: ${obj.email}`);
    if (obj.old_role && obj.new_role) parts.push(`${obj.old_role} → ${obj.new_role}`);
    if (obj.risk_level) parts.push(`risk: ${obj.risk_level}`);
    if (obj.count !== undefined) parts.push(`count: ${obj.count}`);
    if (obj.file_name) parts.push(`file: ${obj.file_name}`);
    if (obj.check_name) parts.push(`check: ${obj.check_name}`);
    if (obj.result) parts.push(`result: ${obj.result}`);
    if (obj.framework_id) parts.push(`fw: ${obj.framework_id.slice(0, 8)}...`);
    if (obj.system_id && !obj.name) parts.push(`sys: ${obj.system_id.slice(0, 8)}...`);
    if (parts.length === 0 && Object.keys(obj).length > 0) {
      return Object.keys(obj).slice(0, 3).join(', ');
    }
    return parts.slice(0, 3).join(' | ');
  } catch {
    return '';
  }
}

export function AuditLogPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Filters
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 30;

  const buildParams = useCallback((pg: number, lim?: number) => {
    const p = new URLSearchParams();
    p.set('page', String(pg));
    p.set('limit', String(lim || limit));
    if (action) p.set('action', action);
    if (resourceType) p.set('resource_type', resourceType);
    if (userId) p.set('user_id', userId);
    if (search) p.set('search', search);
    if (dateFrom) p.set('date_from', dateFrom);
    if (dateTo) p.set('date_to', dateTo);
    return p.toString();
  }, [action, resourceType, userId, search, dateFrom, dateTo]);

  const loadLogs = useCallback(() => {
    setLoading(true);
    api(`/api/v1/audit-log?${buildParams(page)}`)
      .then((d) => { setLogs(d.logs); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, buildParams]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  useEffect(() => {
    api('/api/v1/users').then((d) => setUsers(d.users || [])).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setAction(''); setResourceType(''); setUserId('');
    setSearch(''); setSearchInput('');
    setDateFrom(''); setDateTo('');
    setPage(1);
  };

  const hasFilters = action || resourceType || userId || search || dateFrom || dateTo;

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api(`/api/v1/audit-log?${buildParams(1, 1000)}`);
      exportAuditLogCSV(data.logs);
    } catch {} finally { setExporting(false); }
  };

  const totalPages = Math.ceil(total / limit);

  if (!isAdmin) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <PageHeader title="Activity Log" subtitle="Track all user actions and system changes">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 bg-white text-gray-900 hover:bg-white/90 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-blue-200 p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <select value={action} onChange={handleFilterChange(setAction)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
          </select>
          <select value={resourceType} onChange={handleFilterChange(setResourceType)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Resources</option>
            {RESOURCE_TYPES.map((r) => <option key={r} value={r}>{RESOURCE_LABELS[r]}</option>)}
          </select>
          <select value={userId} onChange={handleFilterChange(setUserId)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Users</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={handleFilterChange(setDateFrom)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="From" />
          <input type="date" value={dateTo} onChange={handleFilterChange(setDateTo)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="To" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium">Clear</button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{total.toLocaleString()} event{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Activity table */}
      {loading ? (
        <SkeletonTable />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit log entries" subtitle="Activity will appear here as actions are taken" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      ) : (
        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Time</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>User</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Action</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Resource</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Details</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap" title={new Date(log.created_at + (log.created_at.endsWith('Z') ? '' : 'Z')).toLocaleString()}>
                      {relativeTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-xs">{log.user_name || 'System'}</div>
                      {log.user_email && <div className="text-xs text-gray-400">{log.user_email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900 text-xs font-medium">{RESOURCE_LABELS[log.resource_type] || log.resource_type}</span>
                      {log.resource_id && <span className="text-gray-400 text-xs ml-1">({log.resource_id.length > 12 ? log.resource_id.slice(0, 12) + '...' : log.resource_id})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                      {summarizeDetails(log.details)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{log.ip_address || '—'}</td>
                  </tr>
                  {expandedId === log.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 bg-gray-50">
                        <div className="text-xs space-y-1">
                          <div><span className="font-medium text-gray-600">Full Timestamp:</span> {new Date(log.created_at + (log.created_at.endsWith('Z') ? '' : 'Z')).toLocaleString()}</div>
                          <div><span className="font-medium text-gray-600">Action:</span> {log.action}</div>
                          <div><span className="font-medium text-gray-600">Resource Type:</span> {log.resource_type}</div>
                          <div><span className="font-medium text-gray-600">Resource ID:</span> {log.resource_id || 'N/A'}</div>
                          <div><span className="font-medium text-gray-600">User Agent:</span> <span className="text-gray-400">{log.user_agent ? (log.user_agent.length > 80 ? log.user_agent.slice(0, 80) + '...' : log.user_agent) : '—'}</span></div>
                          <div>
                            <span className="font-medium text-gray-600">Details:</span>
                            <pre className="mt-1 bg-gray-900 text-green-400 rounded p-2 text-xs overflow-auto max-h-32 font-mono">
                              {(() => { try { return JSON.stringify(JSON.parse(log.details), null, 2); } catch { return log.details || '{}'; } })()}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            {/* Show a few page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 border rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
