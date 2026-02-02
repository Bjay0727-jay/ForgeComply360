import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

export function SettingsPage() {
  const { org, refreshUser, isAdmin, canManage } = useAuth();
  const { config, isFederal, isHealthcare, isEnterprise } = useExperience();
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [enabledFrameworks, setEnabledFrameworks] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [experienceType, setExperienceType] = useState(org?.experience_type || 'enterprise');
  const [notifPrefs, setNotifPrefs] = useState<Record<string, number>>({
    poam_update: 1, risk_alert: 1, monitoring_fail: 1, control_change: 1,
    role_change: 1, compliance_alert: 1, evidence_upload: 1,
    approval_request: 1, approval_decision: 1,
    evidence_reminder: 1, evidence_expiry: 1,
  });

  const load = () => {
    Promise.all([
      api('/api/v1/frameworks'),
      api('/api/v1/frameworks/enabled'),
      api('/api/v1/subscription'),
    ]).then(([all, enabled, sub]) => {
      setFrameworks(all.frameworks);
      setEnabledFrameworks(enabled.frameworks);
      setSubscription(sub.subscription);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    api('/api/v1/notification-preferences')
      .then((d) => { if (d.preferences) setNotifPrefs(d.preferences); })
      .catch(() => {});
  }, []);

  const toggleNotifPref = async (key: string) => {
    const newVal = notifPrefs[key] ? 0 : 1;
    setNotifPrefs((prev) => ({ ...prev, [key]: newVal }));
    try {
      await api('/api/v1/notification-preferences', {
        method: 'PUT',
        body: JSON.stringify({ [key]: newVal }),
      });
    } catch {
      setNotifPrefs((prev) => ({ ...prev, [key]: newVal ? 0 : 1 }));
    }
  };

  const enableFramework = async (fwId: string) => {
    try {
      await api('/api/v1/frameworks/enable', { method: 'POST', body: JSON.stringify({ framework_id: fwId }) });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const disableFramework = async (fwId: string) => {
    try {
      await api('/api/v1/frameworks/disable', { method: 'POST', body: JSON.stringify({ framework_id: fwId }) });
      load();
    } catch { }
  };

  const updateExperience = async (type: string) => {
    setExperienceType(type);
    await api('/api/v1/experience', { method: 'PUT', body: JSON.stringify({ experience_type: type }) });
    window.location.reload();
  };

  const enabledIds = new Set(enabledFrameworks.map((f) => f.id));
  const categories = [...new Set(frameworks.map((f) => f.category))];

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your organization, frameworks, and subscription</p>
      </div>

      {/* Experience Type */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Experience Type</h2>
          <p className="text-sm text-gray-500 mb-4">This controls your terminology, workflows, dashboards, and document templates.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { type: 'federal', name: 'Federal', desc: 'ATO, RMF, POA&M terminology. For FedRAMP, CMMC, FISMA.', color: 'blue' },
              { type: 'enterprise', name: 'Enterprise', desc: 'Audit, compliance terminology. For SOC 2, ISO, PCI DSS.', color: 'indigo' },
              { type: 'healthcare', name: 'Healthcare', desc: 'PHI, safeguard terminology. For HIPAA, HITRUST.', color: 'purple' },
            ].map((exp) => (
              <button key={exp.type} onClick={() => updateExperience(exp.type)} className={`p-4 rounded-lg border text-left transition-all ${experienceType === exp.type ? `border-${exp.color}-600 bg-${exp.color}-50 ring-2 ring-${exp.color}-600` : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="font-medium text-gray-900">{exp.name}</p>
                <p className="text-xs text-gray-500 mt-1">{exp.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subscription */}
      {subscription && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Subscription</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-gray-500">Plan</p><p className="font-medium text-gray-900 capitalize">{subscription.tier}</p></div>
            <div><p className="text-xs text-gray-500">Status</p><p className="font-medium capitalize">{subscription.status}</p></div>
            <div><p className="text-xs text-gray-500">Frameworks</p><p className="font-medium">{subscription.usage.frameworks} / {subscription.limits.max_frameworks}</p></div>
            <div><p className="text-xs text-gray-500">Systems</p><p className="font-medium">{subscription.usage.systems} / {subscription.limits.max_systems}</p></div>
          </div>
          {subscription.status === 'trial' && subscription.trial_ends_at && (
            <p className="text-xs text-orange-600 mt-3">Trial expires: {new Date(subscription.trial_ends_at || '').toLocaleDateString()}</p>
          )}
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Notification Preferences</h2>
        <p className="text-sm text-gray-500 mb-4">Choose which notifications you receive.</p>
        <div className="space-y-3">
          {[
            { key: 'poam_update', label: 'POA&M Updates', desc: 'When POA&Ms are created or their status changes' },
            { key: 'risk_alert', label: 'Risk Alerts', desc: 'When high or critical risks are created or escalated' },
            { key: 'monitoring_fail', label: 'Monitoring Failures', desc: 'When monitoring checks fail or error' },
            { key: 'control_change', label: 'Control Changes', desc: 'When controls are set to not implemented' },
            { key: 'role_change', label: 'Role Changes', desc: 'When your user role is changed' },
            { key: 'compliance_alert', label: 'Compliance Alerts', desc: 'When compliance drops below 70% threshold' },
            { key: 'evidence_upload', label: 'Evidence Uploads', desc: 'When new evidence files are uploaded' },
            { key: 'approval_request', label: 'Approval Requests', desc: 'When someone requests your approval for a sensitive action' },
            { key: 'approval_decision', label: 'Approval Decisions', desc: 'When your approval request is approved or rejected' },
            { key: 'evidence_reminder', label: 'Evidence Reminders', desc: 'When evidence schedules are due or overdue' },
            { key: 'evidence_expiry', label: 'Evidence Expiry Alerts', desc: 'When evidence files expire or are expiring soon' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleNotifPref(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifPrefs[item.key] ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifPrefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Frameworks */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Compliance Frameworks</h2>
        <p className="text-sm text-gray-500 mb-4">Enable frameworks for your organization. Your plan allows {subscription?.limits.max_frameworks || 1} framework(s).</p>

        {categories.map((cat) => (
          <div key={cat} className="mb-6 last:mb-0">
            <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">{cat}</h3>
            <div className="space-y-2">
              {frameworks.filter((f) => f.category === cat).map((fw) => {
                const enabled = enabledIds.has(fw.id);
                return (
                  <div key={fw.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{fw.name} <span className="text-xs text-gray-400">v{fw.version}</span></p>
                      <p className="text-xs text-gray-500">{fw.description} {fw.control_count > 0 && `(${fw.control_count} controls)`}</p>
                    </div>
                    {canManage ? (
                      <button onClick={() => enabled ? disableFramework(fw.id) : enableFramework(fw.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${enabled ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'}`}>
                        {enabled ? 'Enabled' : 'Enable'}
                      </button>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
