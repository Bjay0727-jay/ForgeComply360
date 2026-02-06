import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';

interface Portal {
  id: string;
  name: string;
  auditor_name: string;
  auditor_email: string;
  auditor_company: string;
}

interface Activity {
  id: string;
  action: 'view' | 'download' | 'comment';
  item_name?: string;
  comment?: string;
  ip_address: string;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  view: {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    label: 'View',
  },
  download: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    label: 'Download',
  },
  comment: {
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    label: 'Comment',
  },
};

function maskIP(ip: string): string {
  if (!ip) return '---';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
  return ip.slice(0, 8) + '***';
}

function formatTime(iso: string): string {
  const date = new Date(iso + (iso.endsWith('Z') ? '' : 'Z'));
  return date.toLocaleString();
}

export function PortalActivityPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { isFederal } = useExperience();
  const { addToast } = useToast();

  const [portal, setPortal] = useState<Portal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api<Portal>(`/api/v1/portals/${id}`),
      api<{ activities: Activity[] }>(`/api/v1/portals/${id}/activity`),
    ])
      .then(([portalData, activityData]) => {
        setPortal(portalData);
        setActivities(activityData.activities || []);
      })
      .catch(() => addToast({ type: 'error', title: 'Failed to load portal activity' }))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter((a) => a.action === filter);

  const exportCSV = () => {
    setExporting(true);
    const headers = ['Timestamp', 'Action', 'Item', 'IP Address', 'Comment'];
    const rows = filteredActivities.map((a) => [
      formatTime(a.created_at),
      ACTION_CONFIG[a.action]?.label || a.action,
      a.item_name || '',
      maskIP(a.ip_address),
      a.comment || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portal-activity-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    addToast({ type: 'success', title: 'Activity log exported' });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  if (!portal) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Portal not found</div>;
  }

  return (
    <div>
      <PageHeader title={`${portal.name} - Activity`} subtitle={`Auditor: ${portal.auditor_name} (${portal.auditor_company})`}>
        <Link to={`/portals/${id}`} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium">
          Back to Portal
        </Link>
        <button onClick={exportCSV} disabled={exporting} className="px-4 py-2 bg-white text-gray-900 hover:bg-white/90 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </PageHeader>

      <div className="mb-6">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white">
          <option value="all">All Actions</option>
          <option value="view">Views</option>
          <option value="download">Downloads</option>
          <option value="comment">Comments</option>
        </select>
        <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">{filteredActivities.length} event{filteredActivities.length !== 1 ? 's' : ''}</span>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No activity recorded yet</div>
      ) : (
        <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
          {filteredActivities.map((activity) => {
            const cfg = ACTION_CONFIG[activity.action] || ACTION_CONFIG.view;
            return (
              <div key={activity.id} className="relative">
                <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} /></svg>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ml-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.color}`}>{cfg.label}</span>
                    {activity.item_name && <span className="text-sm font-medium text-gray-900 dark:text-white">{activity.item_name}</span>}
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{formatTime(activity.created_at)}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">IP: {maskIP(activity.ip_address)}</div>
                  {activity.comment && <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded p-2">{activity.comment}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
