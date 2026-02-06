import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface Activity {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
}

interface FieldChange {
  from: any;
  to: any;
}

const FIELD_LABELS: Record<string, string> = {
  weakness_name: 'Weakness Name',
  weakness_description: 'Description',
  risk_level: 'Risk Level',
  status: 'Status',
  scheduled_completion: 'Due Date',
  actual_completion: 'Completion Date',
  responsible_party: 'Responsible Party',
  resources_required: 'Resources Required',
  cost_estimate: 'Cost Estimate',
  assigned_to: 'Assigned To',
  vendor_dependency: 'Vendor Dependency',
  name: 'Name',
  acronym: 'Acronym',
  description: 'Description',
  impact_level: 'Impact Level',
  system_owner: 'System Owner',
  authorizing_official: 'Authorizing Official',
  security_officer: 'Security Officer',
  boundary_description: 'Boundary Description',
  deployment_model: 'Deployment Model',
  service_model: 'Service Model',
  implementation_description: 'Implementation Description',
  responsible_role: 'Responsible Role',
  ai_narrative: 'ForgeML Writer',
  title: 'Title',
  category: 'Category',
  likelihood: 'Likelihood',
  impact: 'Impact',
  treatment: 'Treatment',
  treatment_plan: 'Treatment Plan',
  treatment_due_date: 'Treatment Due Date',
  owner: 'Owner',
  related_controls: 'Related Controls',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  upsert: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  bulk_import: 'bg-purple-100 text-purple-700',
  bulk_update: 'bg-purple-100 text-purple-700',
  ai_narrative: 'bg-amber-100 text-amber-700',
  ai_generate: 'bg-amber-100 text-amber-700',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'created',
  update: 'updated',
  upsert: 'updated',
  delete: 'deleted',
  bulk_import: 'imported',
  bulk_update: 'bulk updated',
  ai_narrative: 'generated ForgeML narrative for',
  ai_generate: 'ForgeML generated',
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z')).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

function formatValue(val: any): string {
  if (val === null || val === undefined || val === '') return '(empty)';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export function ActivityTimeline({ resourceType, resourceId }: { resourceType: string; resourceId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resourceId) return;
    setLoading(true);
    api<{ activities: Activity[] }>(`/api/v1/activity/${resourceType}/${resourceId}?limit=30`)
      .then(d => setActivities(d.activities || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [resourceType, resourceId]);

  if (loading) {
    return (
      <div className="py-4 flex justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-400">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Activity
      </h4>
      <div className="max-h-64 overflow-y-auto space-y-0 relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

        {activities.map((a) => {
          let changes: Record<string, FieldChange> | null = null;
          try {
            const details = typeof a.details === 'string' ? JSON.parse(a.details) : a.details;
            if (details?._changes) changes = details._changes;
          } catch { /* ignore */ }

          const actionLabel = ACTION_LABELS[a.action] || a.action;
          const actionColor = ACTION_COLORS[a.action] || 'bg-gray-100 text-gray-700';
          const userName = a.user_name || a.user_email || 'System';

          return (
            <div key={a.id} className="relative pl-9 pb-4">
              {/* Dot */}
              <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${a.action === 'create' ? 'bg-green-400' : a.action === 'delete' ? 'bg-red-400' : 'bg-blue-400'}`} />

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                      {getInitials(a.user_name, a.user_email)}
                    </span>
                    <span className="text-xs font-medium text-gray-800">{userName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${actionColor}`}>{actionLabel}</span>
                    <span className="text-xs text-gray-500">this record</span>
                  </div>

                  {changes && Object.keys(changes).length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {Object.entries(changes).map(([field, change]) => (
                        <div key={field} className="text-xs text-gray-500 pl-6">
                          <span className="font-medium text-gray-600">{FIELD_LABELS[field] || field}</span>
                          {' '}changed from{' '}
                          <span className="text-red-600 line-through">{formatValue(change.from)}</span>
                          {' '}to{' '}
                          <span className="text-green-700 font-medium">{formatValue(change.to)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{relativeTime(a.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
