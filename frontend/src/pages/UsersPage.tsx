import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  last_login_at: string | null;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  analyst: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

const ASSIGNABLE_ROLES = ['viewer', 'analyst', 'manager', 'admin'];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    api('/api/v1/users')
      .then((d) => setUsers(d.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await api(`/api/v1/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch {
      // revert on failure by reloading
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  const isCurrentUserOwner = currentUser?.role === 'owner';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage organization members and their roles</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Last Login</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isOwnerRow = u.role === 'owner';
                const dropdownDisabled =
                  isOwnerRow ||
                  updatingId === u.id ||
                  (!isCurrentUserOwner && u.role === 'admin');

                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      {isOwnerRow ? (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.viewer}`}
                        >
                          {u.role}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={dropdownDisabled}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-lg border border-gray-200 font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.viewer} disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          {updatingId === u.id && (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.last_login_at)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
