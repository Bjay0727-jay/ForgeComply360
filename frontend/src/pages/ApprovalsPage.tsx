import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  poam_closure:    { label: 'POA&M Closure',    color: 'bg-blue-100 text-blue-700',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  risk_acceptance: { label: 'Risk Acceptance',   color: 'bg-red-100 text-red-700',      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ssp_publication: { label: 'SSP Publication',   color: 'bg-emerald-100 text-emerald-700', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const APPROVER_ROLES: Record<string, string> = {
  poam_closure: 'manager',
  risk_acceptance: 'admin',
  ssp_publication: 'admin',
};

const ROLE_HIERARCHY: Record<string, number> = { viewer: 0, analyst: 1, manager: 2, admin: 3, owner: 4 };

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z')).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}

interface Approval {
  id: string;
  request_type: string;
  resource_type: string;
  resource_id: string;
  requested_by: string;
  requested_by_name: string;
  requested_by_email: string;
  requested_at: string;
  status: string;
  justification: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  reviewer_comment: string | null;
  target_status: string;
  snapshot: Record<string, any>;
  created_at: string;
}

export function ApprovalsPage() {
  const { user, canManage, isAdmin } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const [actionModal, setActionModal] = useState<'approve' | 'reject' | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('request_type', typeFilter);
      const data = await api<any>(`/api/v1/approvals?${params}`);
      setApprovals(data.approvals || []);
      setTotal(data.total || 0);
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { loadApprovals(); }, [loadApprovals]);

  const userRole = user?.role || 'viewer';
  const userRoleLevel = ROLE_HIERARCHY[userRole] ?? 0;

  const canApprove = (a: Approval) => {
    if (a.status !== 'pending') return false;
    if (a.requested_by === user?.id) return false;
    const minLevel = ROLE_HIERARCHY[APPROVER_ROLES[a.request_type] || 'owner'] ?? 99;
    return userRoleLevel >= minLevel;
  };

  const openAction = (a: Approval, action: 'approve' | 'reject') => {
    setSelectedApproval(a);
    setActionModal(action);
    setComment('');
    setError(null);
  };

  const handleAction = async () => {
    if (!selectedApproval || !actionModal) return;
    if (actionModal === 'reject' && !comment.trim()) {
      setError('Comment is required when rejecting');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api(`/api/v1/approvals/${selectedApproval.id}/${actionModal}`, {
        method: 'PUT',
        body: JSON.stringify({ comment: comment.trim() || undefined }),
      });
      setActionModal(null);
      setSelectedApproval(null);
      setComment('');
      loadApprovals();
    } catch (e: any) {
      setError(e.message || `Failed to ${actionModal} request`);
    } finally {
      setSubmitting(false);
    }
  };

  const snapshotName = (a: Approval) => a.snapshot?.weakness_name || a.snapshot?.title || a.resource_id;
  const totalPages = Math.ceil(total / limit);
  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader title="Approvals" subtitle="Review and act on approval requests for sensitive operations." />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[{ key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }].map(f => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
        >
          <option value="">All Types</option>
          <option value="poam_closure">POA&M Closure</option>
          <option value="risk_acceptance">Risk Acceptance</option>
          <option value="ssp_publication">SSP Publication</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{total} total</span>
      </div>

      {/* Loading */}
      {loading ? (
        <SkeletonListItem />
      ) : approvals.length === 0 ? (
        <EmptyState title="No pending approvals" subtitle="All items have been reviewed" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ) : (
        <div className="space-y-3">
          {approvals.map(a => {
            const tc = TYPE_CONFIG[a.request_type] || { label: a.request_type, color: 'bg-gray-100 text-gray-600', icon: '' };
            return (
              <div key={a.id} className="bg-white rounded-xl border border-blue-200 p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tc.color}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tc.icon} />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tc.color}`}>{tc.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{snapshotName(a)}</h3>
                    {a.snapshot?.system_name && (
                      <p className="text-xs text-gray-400 mt-0.5">System: {a.snapshot.system_name}</p>
                    )}
                    {a.snapshot?.risk_level && (
                      <p className="text-xs text-gray-400">Risk Level: <span className="capitalize">{a.snapshot.risk_level}</span>{a.snapshot.risk_score ? ` (Score: ${a.snapshot.risk_score})` : ''}</p>
                    )}

                    {/* Justification */}
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{a.justification}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Requested by <span className="font-medium text-gray-500">{a.requested_by_name}</span></span>
                      <span>{relativeTime(a.requested_at || a.created_at)}</span>
                    </div>

                    {/* Reviewer info */}
                    {a.reviewer_name && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">{a.status === 'approved' ? 'Approved' : 'Rejected'} by {a.reviewer_name}</span>
                          {a.reviewed_at && <span>{relativeTime(a.reviewed_at)}</span>}
                        </div>
                        {a.reviewer_comment && (
                          <p className="text-sm text-gray-600 mt-1">{a.reviewer_comment}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canApprove(a) && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openAction(a, 'approve')}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openAction(a, 'reject')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {actionModal && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {actionModal === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {actionModal === 'approve'
                ? 'This will execute the requested action immediately.'
                : 'A comment explaining the rejection is required.'}
            </p>

            {/* Snapshot details */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_CONFIG[selectedApproval.request_type]?.color || 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_CONFIG[selectedApproval.request_type]?.label || selectedApproval.request_type}
                </span>
              </div>
              <p className="font-medium text-gray-900 text-sm">{snapshotName(selectedApproval)}</p>
              {selectedApproval.snapshot?.system_name && (
                <p className="text-xs text-gray-400 mt-0.5">System: {selectedApproval.snapshot.system_name}</p>
              )}
              <p className="text-sm text-gray-600 mt-2">{selectedApproval.justification}</p>
              <p className="text-xs text-gray-400 mt-1">Requested by {selectedApproval.requested_by_name}</p>
            </div>

            {/* Comment */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment {actionModal === 'reject' ? '(required)' : '(optional)'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder={actionModal === 'reject' ? 'Explain why this request is being rejected...' : 'Add a comment (optional)...'}
            />

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => { setActionModal(null); setSelectedApproval(null); setComment(''); setError(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting || (actionModal === 'reject' && !comment.trim())}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  actionModal === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? 'Processing...' : actionModal === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
