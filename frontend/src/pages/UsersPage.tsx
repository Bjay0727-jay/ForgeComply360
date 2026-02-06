import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { SkeletonTable } from '../components/Skeleton';
import { TYPOGRAPHY, BUTTONS, FORMS, MODALS, BADGES } from '../utils/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  mfa_enabled: number;
  onboarding_completed: number;
  last_login_at: string | null;
  created_at: string;
  failed_login_attempts: number;
  locked_until: string | null;
}

interface UserStats {
  total: number;
  active: number;
  deactivated: number;
  admins: number;
  mfa_enabled: number;
  locked: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  analyst: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  deactivated: 'bg-red-100 text-red-700',
};

const ASSIGNABLE_ROLES = ['viewer', 'analyst', 'manager', 'admin'];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function isLocked(u: OrgUser): boolean {
  return !!(u.locked_until && new Date(u.locked_until) > new Date());
}

// ---------------------------------------------------------------------------
// Modal: Confirm Action
// ---------------------------------------------------------------------------

function ConfirmActionModal({ title, message, confirmLabel, variant = 'danger', loading, onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning';
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={MODALS.backdrop} onClick={onCancel}>
      <div className={`${MODALS.container} max-w-md`} onClick={(e) => e.stopPropagation()}>
        <div className={MODALS.body}>
          <h3 className={`${TYPOGRAPHY.modalTitle} mb-2`}>{title}</h3>
          <p className={`${TYPOGRAPHY.bodyMuted} mb-6`}>{message}</p>
        </div>
        <div className={MODALS.footer}>
          <button onClick={onCancel} className={BUTTONS.secondary}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'danger' ? BUTTONS.danger : BUTTONS.primary}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: Temp Password
// ---------------------------------------------------------------------------

function TempPasswordModal({ password, userName, onClose }: { password: string; userName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={MODALS.backdrop} onClick={onClose}>
      <div className={`${MODALS.container} max-w-md`} onClick={(e) => e.stopPropagation()}>
        <div className={MODALS.body}>
          <h3 className={`${TYPOGRAPHY.modalTitle} mb-2`}>Temporary Password</h3>
          <p className={`${TYPOGRAPHY.bodyMuted} mb-4`}>
            Provide this temporary password to <span className="font-medium">{userName}</span>. They will need to change it after logging in.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              readOnly
              value={password}
              className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm select-all"
            />
          <button
              onClick={handleCopy}
              className={BUTTONS.primary}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className={`${BADGES.base} ${BADGES.warning} p-3 mb-4`}>
            <p className="text-xs text-amber-800 font-medium">This password will not be shown again. Save it now.</p>
          </div>
        </div>
        <div className={MODALS.footer}>
          <button onClick={onClose} className={BUTTONS.secondary}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: Invite User
// ---------------------------------------------------------------------------

function InviteUserModal({ isOwner, onSuccess, onClose }: {
  isOwner: boolean;
  onSuccess: (user: OrgUser, tempPassword: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = isOwner ? ASSIGNABLE_ROLES : ASSIGNABLE_ROLES.filter((r) => r !== 'admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api<{ user: OrgUser; temp_password: string }>('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email, name, role }),
      });
      onSuccess(result.user, result.temp_password);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite New User</h3>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="jane@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name || !email}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: Edit User
// ---------------------------------------------------------------------------

function EditUserModal({ target, onSuccess, onClose }: {
  target: OrgUser;
  onSuccess: (updated: { id: string; name: string; email: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(target.name);
  const [email, setEmail] = useState(target.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api<{ user: { id: string; name: string; email: string } }>(`/api/v1/users/${target.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });
      onSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name || !email}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions Dropdown
// ---------------------------------------------------------------------------

function UserActionsDropdown({ target, currentUser, isOwner, onAction }: {
  target: OrgUser;
  currentUser: { id: string; role: string } | null;
  isOwner: boolean;
  onAction: (action: string, user: OrgUser) => void;
}) {
  const [open, setOpen] = useState(false);

  const isSelf = target.id === currentUser?.id;
  const isTargetOwner = target.role === 'owner';
  const isTargetAdmin = target.role === 'admin';
  const canModify = !isSelf && (!isTargetOwner || isOwner) && (!isTargetAdmin || isOwner);

  if (isSelf) return <span className="text-xs text-gray-400">—</span>;

  const actions: { key: string; label: string; show: boolean }[] = [
    { key: 'send-email', label: 'Send Email', show: true },
    { key: 'edit', label: 'Edit Details', show: canModify },
    { key: 'reset-password', label: 'Reset Password', show: canModify },
    { key: 'disable-mfa', label: 'Disable 2FA', show: canModify && target.mfa_enabled === 1 },
    { key: 'unlock', label: 'Unlock Account', show: isLocked(target) },
    { key: 'toggle-status', label: target.status === 'deactivated' ? 'Reactivate' : 'Deactivate', show: canModify },
  ];

  const visibleActions = actions.filter((a) => a.show);
  if (visibleActions.length === 0) return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-48 bg-white border border-blue-200 rounded-lg shadow-lg py-1">
            {visibleActions.map((a) => (
              <button
                key={a.key}
                onClick={() => { setOpen(false); onAction(a.key, target); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  a.key === 'toggle-status' && target.status !== 'deactivated' ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals
  const [showInvite, setShowInvite] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgUser | null>(null);
  const [tempPwModal, setTempPwModal] = useState<{ password: string; userName: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string; message: string; confirmLabel: string; variant: 'danger' | 'warning'; onConfirm: () => Promise<void>;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isOwner = currentUser?.role === 'owner';

  const load = () => {
    api<{ users: OrgUser[]; stats: UserStats }>('/api/v1/users')
      .then((d) => { setUsers(d.users); setStats(d.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, search, statusFilter, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await api(`/api/v1/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setToast({ message: 'Role updated', type: 'success' });
    } catch {
      load();
      setToast({ message: 'Failed to update role', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAction = (action: string, target: OrgUser) => {
    if (action === 'send-email') {
      window.location.href = `mailto:${target.email}`;
      return;
    }

    if (action === 'edit') {
      setEditTarget(target);
      return;
    }

    if (action === 'reset-password') {
      setConfirmAction({
        title: 'Reset Password',
        message: `Generate a new temporary password for ${target.name} (${target.email})? Their current sessions will be invalidated.`,
        confirmLabel: 'Reset Password',
        variant: 'warning',
        onConfirm: async () => {
          const result = await api<{ temp_password: string }>(`/api/v1/users/${target.id}/reset-password`, { method: 'POST' });
          setTempPwModal({ password: result.temp_password, userName: target.name });
        },
      });
      return;
    }

    if (action === 'disable-mfa') {
      setConfirmAction({
        title: 'Disable Two-Factor Authentication',
        message: `Disable 2FA for ${target.name}? They will be able to log in without an authenticator code.`,
        confirmLabel: 'Disable 2FA',
        variant: 'warning',
        onConfirm: async () => {
          await api(`/api/v1/users/${target.id}/disable-mfa`, { method: 'POST' });
          setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, mfa_enabled: 0 } : u)));
          setToast({ message: '2FA disabled', type: 'success' });
        },
      });
      return;
    }

    if (action === 'unlock') {
      setConfirmAction({
        title: 'Unlock Account',
        message: `Unlock ${target.name}'s account? This clears failed login attempts and removes the lockout.`,
        confirmLabel: 'Unlock',
        variant: 'warning',
        onConfirm: async () => {
          await api(`/api/v1/users/${target.id}/unlock`, { method: 'POST' });
          setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, failed_login_attempts: 0, locked_until: null } : u)));
          setToast({ message: 'Account unlocked', type: 'success' });
        },
      });
      return;
    }

    if (action === 'toggle-status') {
      const newStatus = target.status === 'deactivated' ? 'active' : 'deactivated';
      setConfirmAction({
        title: newStatus === 'deactivated' ? 'Deactivate User' : 'Reactivate User',
        message: newStatus === 'deactivated'
          ? `Deactivate ${target.name} (${target.email})? They will be unable to log in and their sessions will be terminated.`
          : `Reactivate ${target.name} (${target.email})? They will be able to log in again.`,
        confirmLabel: newStatus === 'deactivated' ? 'Deactivate' : 'Reactivate',
        variant: newStatus === 'deactivated' ? 'danger' : 'warning',
        onConfirm: async () => {
          await api(`/api/v1/users/${target.id}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
          setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, status: newStatus } : u)));
          if (stats) {
            setStats({
              ...stats,
              active: stats.active + (newStatus === 'active' ? 1 : -1),
              deactivated: stats.deactivated + (newStatus === 'deactivated' ? 1 : -1),
            });
          }
          setToast({ message: `User ${newStatus === 'deactivated' ? 'deactivated' : 'reactivated'}`, type: 'success' });
        },
      });
      return;
    }
  };

  const executeConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await confirmAction.onConfirm();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage organization members, roles, and access">
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90"
        >
          + Invite User
        </button>
      </PageHeader>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Deactivated</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.deactivated}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Admins & Owners</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.admins}</p>
            {stats.locked > 0 && (
              <p className="text-xs text-red-600 font-medium mt-1">{stats.locked} locked</p>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="analyst">Analyst</option>
          <option value="viewer">Viewer</option>
        </select>
        {(search || statusFilter !== 'all' || roleFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setRoleFilter('all'); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Users Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" subtitle="Adjust filters or invite team members" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      ) : (
        <div className="bg-white rounded-xl border border-blue-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Name</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Email</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Role</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Status</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>2FA</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Last Login</th>
                <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Joined</th>
                <th className={`text-right px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => {
                const isOwnerRow = u.role === 'owner';
                const dropdownDisabled = isOwnerRow || updatingId === u.id || (!isOwner && u.role === 'admin');

                return (
                  <tr key={u.id} className={`hover:bg-gray-50 ${u.status === 'deactivated' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.name}
                      {u.id === currentUser?.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      {isLocked(u) && (
                        <span className="ml-2 text-xs text-red-600 font-medium">Locked</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      {isOwnerRow ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                          {u.role}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={dropdownDisabled}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-lg border border-blue-200 font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.viewer} disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {updatingId === u.id && (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[u.status] || STATUS_COLORS.active}`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.mfa_enabled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          On
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Off</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.last_login_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <UserActionsDropdown
                        target={u}
                        currentUser={currentUser}
                        isOwner={isOwner}
                        onAction={handleAction}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showInvite && (
        <InviteUserModal
          isOwner={isOwner}
          onSuccess={(newUser, tempPassword) => {
            setShowInvite(false);
            setUsers((prev) => [...prev, { ...newUser, mfa_enabled: 0, onboarding_completed: 0, last_login_at: null, created_at: new Date().toISOString(), failed_login_attempts: 0, locked_until: null }]);
            if (stats) setStats({ ...stats, total: stats.total + 1, active: stats.active + 1 });
            setTempPwModal({ password: tempPassword, userName: newUser.name });
          }}
          onClose={() => setShowInvite(false)}
        />
      )}

      {editTarget && (
        <EditUserModal
          target={editTarget}
          onSuccess={(updated) => {
            setEditTarget(null);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, name: updated.name, email: updated.email } : u)));
            setToast({ message: 'User updated', type: 'success' });
          }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {tempPwModal && (
        <TempPasswordModal
          password={tempPwModal.password}
          userName={tempPwModal.userName}
          onClose={() => setTempPwModal(null)}
        />
      )}

      {confirmAction && (
        <ConfirmActionModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          variant={confirmAction.variant}
          loading={actionLoading}
          onConfirm={executeConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
