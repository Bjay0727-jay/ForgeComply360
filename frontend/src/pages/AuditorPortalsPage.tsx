import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, MODALS, BUTTONS, BADGES, CARDS } from '../utils/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditorPortal {
  id: string;
  name: string;
  auditor_name: string;
  auditor_email: string;
  access_token: string;
  shared_items: string; // JSON string
  status: 'active' | 'expired' | 'revoked';
  last_accessed_at: string | null;
  expires_at: string;
  view_count: number;
  download_count: number;
  created_at: string;
}

interface PortalStats {
  active: number;
  total_views: number;
  downloads_this_month: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  active: BADGES.success,
  expired: BADGES.warning,
  revoked: BADGES.error,
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function parseSharedItems(json: string): number {
  try {
    const items = JSON.parse(json);
    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Confirm Revoke Modal
// ---------------------------------------------------------------------------

function ConfirmRevokeModal({
  portal,
  loading,
  onConfirm,
  onCancel,
}: {
  portal: AuditorPortal;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={MODALS.backdrop} onClick={onCancel}>
      <div className={MODALS.container} onClick={(e) => e.stopPropagation()}>
        <div className={MODALS.header}>
          <h3 className={TYPOGRAPHY.modalTitle}>Revoke Portal Access</h3>
        </div>
        <div className={MODALS.body}>
          <p className={TYPOGRAPHY.bodyMuted}>
            Are you sure you want to revoke access to <span className="font-medium">{portal.name}</span>?
            The auditor <span className="font-medium">{portal.auditor_name}</span> will no longer be able to access shared materials.
          </p>
        </div>
        <div className={MODALS.footer}>
          <button onClick={onCancel} className={BUTTONS.secondary}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={BUTTONS.danger}>
            {loading ? 'Revoking...' : 'Revoke Access'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function AuditorPortalsPage() {
  const { isAdmin } = useAuth();
  const { isFederal } = useExperience();
  const { addToast } = useToast();

  const [portals, setPortals] = useState<AuditorPortal[]>([]);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState<AuditorPortal | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      api<{ portals: AuditorPortal[]; stats: PortalStats }>('/api/v1/portals')
        .then((d) => {
          setPortals(d.portals || []);
          setStats(d.stats || null);
        })
        .catch(() => {
          addToast({ type: 'error', title: 'Failed to load portals' });
        })
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  const handleCopyLink = (portal: AuditorPortal) => {
    const url = `https://forgecomply360.pages.dev/portal/${portal.access_token}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast({ type: 'success', title: 'Link copied to clipboard' });
    }).catch(() => {
      addToast({ type: 'error', title: 'Failed to copy link' });
    });
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api(`/api/v1/portals/${revokeTarget.id}`, { method: 'DELETE' });
      setPortals((prev) => prev.map((p) => (p.id === revokeTarget.id ? { ...p, status: 'revoked' as const } : p)));
      if (stats) {
        setStats({ ...stats, active: Math.max(0, stats.active - 1) });
      }
      addToast({ type: 'success', title: 'Portal access revoked' });
    } catch {
      addToast({ type: 'error', title: 'Failed to revoke portal' });
    } finally {
      setRevoking(false);
      setRevokeTarget(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Admin access required</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Auditor Portals" subtitle="Manage secure document sharing portals for external auditors">
        <Link to="/portals/new" className={BUTTONS.primary}>
          + Create Portal
        </Link>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`${CARDS.base} p-4`}>
            <p className={TYPOGRAPHY.metaLabel}>Active Portals</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
          </div>
          <div className={`${CARDS.base} p-4`}>
            <p className={TYPOGRAPHY.metaLabel}>Total Views</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total_views}</p>
          </div>
          <div className={`${CARDS.base} p-4`}>
            <p className={TYPOGRAPHY.metaLabel}>Downloads This Month</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.downloads_this_month}</p>
          </div>
        </div>
      )}

      {/* Portal List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : portals.length === 0 ? (
        <div className={`${CARDS.base} p-12 text-center`}>
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <h3 className={TYPOGRAPHY.emptyTitle}>No Portals Created</h3>
          <p className={`${TYPOGRAPHY.emptyDescription} mb-4`}>
            Create a secure portal to share {isFederal ? 'compliance documentation' : 'audit materials'} with external auditors.
          </p>
          <Link to="/portals/new" className={BUTTONS.primary}>
            + Create First Portal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portals.map((portal) => (
            <div key={portal.id} className={`${CARDS.base} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className={TYPOGRAPHY.cardTitle}>{portal.name}</h3>
                  <p className={TYPOGRAPHY.bodySmallMuted}>{portal.auditor_name}</p>
                  <p className={TYPOGRAPHY.timestamp}>{portal.auditor_email}</p>
                </div>
                <span className={`${BADGES.pill} ${STATUS_COLORS[portal.status]}`}>
                  {portal.status.charAt(0).toUpperCase() + portal.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Items Shared</span>
                  <p className="font-medium text-gray-900 dark:text-white">{parseSharedItems(portal.shared_items)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Last Accessed</span>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(portal.last_accessed_at)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Expires</span>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(portal.expires_at)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Views / Downloads</span>
                  <p className="font-medium text-gray-900 dark:text-white">{portal.view_count} / {portal.download_count}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleCopyLink(portal)}
                  disabled={portal.status !== 'active'}
                  className={`${BUTTONS.sm} px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Copy Link
                </button>
                <Link to={`/portals/${portal.id}/activity`} className={`${BUTTONS.sm} ${BUTTONS.ghost}`}>
                  View Activity
                </Link>
                <Link to={`/portals/${portal.id}/edit`} className={`${BUTTONS.sm} ${BUTTONS.ghost}`}>
                  Edit
                </Link>
                {portal.status === 'active' && (
                  <button
                    onClick={() => setRevokeTarget(portal)}
                    className={`${BUTTONS.sm} px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100`}
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeTarget && (
        <ConfirmRevokeModal
          portal={revokeTarget}
          loading={revoking}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
