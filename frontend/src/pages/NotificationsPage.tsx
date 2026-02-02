import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const TYPE_COLORS: Record<string, string> = {
  poam_update: 'bg-blue-100 text-blue-700',
  risk_alert: 'bg-red-100 text-red-700',
  monitoring_fail: 'bg-orange-100 text-orange-700',
  control_change: 'bg-yellow-100 text-yellow-700',
  role_change: 'bg-purple-100 text-purple-700',
  compliance_alert: 'bg-red-100 text-red-700',
  evidence_upload: 'bg-green-100 text-green-700',
  approval_request: 'bg-amber-100 text-amber-700',
  approval_decision: 'bg-indigo-100 text-indigo-700',
};

const TYPE_LABELS: Record<string, string> = {
  poam_update: 'POA&M',
  risk_alert: 'Risk',
  monitoring_fail: 'Monitoring',
  control_change: 'Control',
  role_change: 'Role',
  compliance_alert: 'Compliance',
  evidence_upload: 'Evidence',
  approval_request: 'Approval',
  approval_decision: 'Decision',
};

const RESOURCE_ROUTES: Record<string, string> = {
  poam: '/poams',
  risk: '/risks',
  monitoring_check: '/monitoring',
  control_implementation: '/controls',
  evidence: '/evidence',
  user: '/users',
  compliance_snapshot: '/',
  approval_request: '/approvals',
};

const ALL_TYPES = Object.keys(TYPE_LABELS);

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

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const limit = 30;

  const loadNotifications = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (typeFilter) params.set('type', typeFilter);
    if (unreadOnly) params.set('unread', 'true');

    api(`/api/v1/notifications?${params.toString()}`)
      .then((d) => {
        setNotifications(d.notifications || []);
        setTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, typeFilter, unreadOnly]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api('/api/v1/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ notification_ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch {}
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api('/api/v1/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {} finally {
      setMarkingAll(false);
    }
  };

  const handleClick = (n: any) => {
    if (!n.is_read) markAsRead(n.id);
    const route = RESOURCE_ROUTES[n.resource_type];
    if (route) navigate(route);
  };

  const totalPages = Math.ceil(total / limit);
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">Stay updated on compliance events and changes</p>
        </div>
        {hasUnread && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {markingAll ? 'Marking...' : 'Mark All as Read'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Unread only
          </label>
          <span className="text-sm text-gray-400 ml-auto">{total} notification{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                n.is_read ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Unread dot */}
                <div className="pt-1.5">
                  {!n.is_read ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    <span className="text-xs text-gray-400" title={new Date(n.created_at + (n.created_at.endsWith('Z') ? '' : 'Z')).toLocaleString()}>
                      {relativeTime(n.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm ${n.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>

                {/* Mark as read button */}
                {!n.is_read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                    className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap px-2 py-1"
                    title="Mark as read"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
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
