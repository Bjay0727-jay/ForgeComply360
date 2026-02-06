import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '../components/PageHeader';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { TYPOGRAPHY, FORMS, MODALS, BUTTONS, CARDS } from '../utils/typography';
import { Link } from 'react-router-dom';

export function SettingsPage() {
  const { user, org, refreshUser, isAdmin, canManage } = useAuth();
  const { addToast } = useToast();
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
    email_digest: 1,
    weekly_digest: 1,
  });

  // Scoring weights state (admin+)
  const [scoreWeights, setScoreWeights] = useState<Record<string, number>>({ control: 40, poam: 20, evidence: 15, risk: 15, monitoring: 10 });
  const [scoreWeightsLoading, setScoreWeightsLoading] = useState(false);
  const [scoreWeightsMsg, setScoreWeightsMsg] = useState('');

  // Alert thresholds state (admin+)
  const [alertThresholds, setAlertThresholds] = useState({ poam_upcoming_days: 7, ato_expiry_days: 30, vendor_assessment_days: 14, vendor_contract_days: 30, policy_review_days: 30, enabled: true });
  const [alertThresholdsLoading, setAlertThresholdsLoading] = useState(false);
  const [alertThresholdsMsg, setAlertThresholdsMsg] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'compliance' | 'frameworks' | 'security' | 'integrations' | 'legal'>('profile');

  // Security settings (admin+)
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [savingSecuritySettings, setSavingSecuritySettings] = useState(false);

  // Data export
  const [exporting, setExporting] = useState(false);

  // Webhooks (admin+)
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: ['*'] as string[] });
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [expandedDeliveries, setExpandedDeliveries] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setPwMsg(''); setPwError('');
    if (!currentPassword || !newPassword || !confirmPassword) { setPwError('All fields are required.'); return; }
    if (newPassword.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match.'); return; }
    if (currentPassword === newPassword) { setPwError('New password must be different from current password.'); return; }
    setPwLoading(true);
    try {
      await api('/api/v1/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      setPwMsg('Password changed successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) { setPwError(err.message || 'Failed to change password.'); }
    finally { setPwLoading(false); }
  };

  // 2FA state
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [regenCode, setRegenCode] = useState('');
  const [showRegen, setShowRegen] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  const startMfaSetup = async () => {
    setMfaLoading(true); setMfaError('');
    try {
      const data = await api('/api/v1/auth/mfa/setup', { method: 'POST' });
      setMfaSetup(data);
    } catch (err: any) { setMfaError(err.message); }
    finally { setMfaLoading(false); }
  };

  const completeMfaSetup = async () => {
    setMfaLoading(true); setMfaError('');
    try {
      const data = await api('/api/v1/auth/mfa/verify-setup', { method: 'POST', body: JSON.stringify({ code: setupCode }) });
      setBackupCodes(data.backup_codes);
      setMfaSetup(null);
      setSetupCode('');
      await refreshUser();
    } catch (err: any) { setMfaError(err.message); }
    finally { setMfaLoading(false); }
  };

  const disableMfa = async () => {
    setMfaLoading(true); setMfaError('');
    try {
      await api('/api/v1/auth/mfa/disable', { method: 'POST', body: JSON.stringify({ code: disableCode }) });
      setShowDisable(false); setDisableCode('');
      await refreshUser();
    } catch (err: any) { setMfaError(err.message); }
    finally { setMfaLoading(false); }
  };

  const regenerateBackupCodes = async () => {
    setMfaLoading(true); setMfaError('');
    try {
      const data = await api('/api/v1/auth/mfa/backup-codes', { method: 'POST', body: JSON.stringify({ code: regenCode }) });
      setBackupCodes(data.backup_codes);
      setShowRegen(false); setRegenCode('');
    } catch (err: any) { setMfaError(err.message); }
    finally { setMfaLoading(false); }
  };

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
    // Load scoring weights for admin+
    if (isAdmin) {
      api<{ weights: Record<string, number> }>('/api/v1/compliance/score-config')
        .then((d) => {
          if (d.weights) {
            setScoreWeights({
              control: Math.round((d.weights.control || 0.4) * 100),
              poam: Math.round((d.weights.poam || 0.2) * 100),
              evidence: Math.round((d.weights.evidence || 0.15) * 100),
              risk: Math.round((d.weights.risk || 0.15) * 100),
              monitoring: Math.round((d.weights.monitoring || 0.1) * 100),
            });
          }
        })
        .catch(() => {});

      api<{ thresholds: any }>('/api/v1/alert-settings')
        .then((d) => { if (d.thresholds) setAlertThresholds(d.thresholds); })
        .catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'security' && isAdmin) loadSecuritySettings();
    if (activeTab === 'integrations' && isAdmin) loadWebhooks();
  }, [activeTab]);

  const saveAlertThresholds = async () => {
    setAlertThresholdsLoading(true);
    setAlertThresholdsMsg('');
    try {
      await api('/api/v1/alert-settings', { method: 'PUT', body: JSON.stringify(alertThresholds) });
      setAlertThresholdsMsg('Alert thresholds saved successfully.');
    } catch (err: any) {
      setAlertThresholdsMsg(err.message || 'Failed to save thresholds.');
    } finally { setAlertThresholdsLoading(false); }
  };

  const scoreWeightsSum = Object.values(scoreWeights).reduce((s, v) => s + v, 0);
  const scoreWeightsValid = Math.abs(scoreWeightsSum - 100) <= 2;

  const saveScoreWeights = async () => {
    if (!scoreWeightsValid) return;
    setScoreWeightsLoading(true);
    setScoreWeightsMsg('');
    try {
      const normalized: Record<string, number> = {};
      for (const [k, v] of Object.entries(scoreWeights)) normalized[k] = v / 100;
      await api('/api/v1/compliance/score-config', {
        method: 'PUT',
        body: JSON.stringify({ weights: normalized }),
      });
      setScoreWeightsMsg('Scoring weights saved successfully.');
    } catch (err: any) {
      setScoreWeightsMsg(err.message || 'Failed to save weights.');
    } finally {
      setScoreWeightsLoading(false);
    }
  };

  const resetScoreWeights = () => {
    setScoreWeights({ control: 40, poam: 20, evidence: 15, risk: 15, monitoring: 10 });
    setScoreWeightsMsg('');
  };

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
    } catch (e: any) { addToast({ type: 'error', title: 'Framework Error', message: e.message }); }
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

  const loadSecuritySettings = async () => {
    try {
      const data = await api('/api/v1/security-settings');
      setSessionTimeout(data.session_timeout_minutes || 30);
    } catch {}
  };

  const saveSecuritySettings = async () => {
    setSavingSecuritySettings(true);
    try {
      await api('/api/v1/security-settings', { method: 'PUT', body: JSON.stringify({ session_timeout_minutes: sessionTimeout }) });
      addToast({ type: 'success', title: 'Security settings saved' });
    } catch { addToast({ type: 'error', title: 'Failed to save security settings' }); }
    finally { setSavingSecuritySettings(false); }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await api('/api/v1/organization/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forgecomply360-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Organization data exported successfully' });
    } catch { addToast({ type: 'error', title: 'Failed to export data' }); }
    finally { setExporting(false); }
  };

  const loadWebhooks = async () => {
    setWebhooksLoading(true);
    try {
      const data = await api('/api/v1/webhooks');
      setWebhooks(data.webhooks || []);
    } catch {} finally { setWebhooksLoading(false); }
  };

  const saveWebhook = async () => {
    setSavingWebhook(true);
    try {
      if (editingWebhook) {
        await api(`/api/v1/webhooks/${editingWebhook.id}`, { method: 'PUT', body: JSON.stringify(webhookForm) });
        addToast({ type: 'success', title: 'Webhook updated' });
      } else {
        const data = await api('/api/v1/webhooks', { method: 'POST', body: JSON.stringify(webhookForm) });
        setWebhookSecret(data.webhook.secret);
        addToast({ type: 'success', title: 'Webhook created' });
      }
      loadWebhooks();
      if (editingWebhook) { setShowWebhookModal(false); setEditingWebhook(null); }
    } catch { addToast({ type: 'error', title: 'Failed to save webhook' }); }
    finally { setSavingWebhook(false); }
  };

  const deleteWebhook = async (id: string) => {
    try {
      await api(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
      addToast({ type: 'success', title: 'Webhook deleted' });
      loadWebhooks();
    } catch { addToast({ type: 'error', title: 'Failed to delete webhook' }); }
  };

  const toggleWebhookActive = async (webhook: any) => {
    try {
      await api(`/api/v1/webhooks/${webhook.id}`, { method: 'PUT', body: JSON.stringify({ active: !webhook.active }) });
      loadWebhooks();
    } catch {}
  };

  const loadDeliveries = async (webhookId: string) => {
    if (expandedDeliveries === webhookId) { setExpandedDeliveries(null); return; }
    setExpandedDeliveries(webhookId);
    setDeliveriesLoading(true);
    try {
      const data = await api(`/api/v1/webhooks/${webhookId}/deliveries`);
      setDeliveries(data.deliveries || []);
    } catch {} finally { setDeliveriesLoading(false); }
  };

  const testWebhook = async (webhookId: string) => {
    setTestingWebhook(webhookId);
    try {
      const data = await api(`/api/v1/webhooks/${webhookId}/test`, { method: 'POST' });
      addToast({ type: data.success ? 'success' : 'error', title: data.success ? `Test sent (HTTP ${data.status})` : `Test failed: ${data.error}` });
      if (expandedDeliveries === webhookId) loadDeliveries(webhookId);
    } catch { addToast({ type: 'error', title: 'Test webhook failed' }); }
    finally { setTestingWebhook(null); }
  };

  const WEBHOOK_EVENT_OPTIONS = [
    { group: 'Compliance', events: [{ value: 'poam_update', label: 'POA&M Updates' }, { value: 'control_change', label: 'Control Changes' }, { value: 'compliance_alert', label: 'Compliance Alerts' }] },
    { group: 'Evidence', events: [{ value: 'evidence_upload', label: 'Evidence Uploads' }, { value: 'evidence_reminder', label: 'Evidence Reminders' }, { value: 'evidence_expiry', label: 'Evidence Expiry' }] },
    { group: 'Risk & Monitoring', events: [{ value: 'risk_alert', label: 'Risk Alerts' }, { value: 'monitoring_fail', label: 'Monitoring Failures' }] },
    { group: 'Approvals', events: [{ value: 'approval_request', label: 'Approval Requests' }, { value: 'approval_decision', label: 'Approval Decisions' }] },
    { group: 'Policy', events: [{ value: 'policy_update', label: 'Policy Updates' }, { value: 'attestation_request', label: 'Attestation Requests' }] },
  ];

  const toggleWebhookEvent = (event: string) => {
    if (event === '*') {
      setWebhookForm(f => ({ ...f, events: f.events.includes('*') ? [] : ['*'] }));
      return;
    }
    setWebhookForm(f => ({
      ...f,
      events: f.events.filter(e => e !== '*').includes(event)
        ? f.events.filter(e => e !== event && e !== '*')
        : [...f.events.filter(e => e !== '*'), event],
    }));
  };

  if (loading) return <div className="space-y-6 max-w-4xl"><SkeletonCard /><SkeletonCard /></div>;

  const tabs = [
    { key: 'profile' as const, label: 'Profile & Security' },
    { key: 'notifications' as const, label: 'Notifications' },
    ...(isAdmin ? [{ key: 'security' as const, label: 'Security' }] : []),
    ...(isAdmin ? [{ key: 'compliance' as const, label: 'Compliance' }] : []),
    ...(isAdmin ? [{ key: 'integrations' as const, label: 'Integrations' }] : []),
    { key: 'frameworks' as const, label: 'Frameworks' },
    { key: 'legal' as const, label: 'Legal' },
  ];

  return (
    <div className="max-w-4xl">
      <PageHeader title="Settings" subtitle="Manage your organization, frameworks, and subscription" />

      {/* Tab Navigation */}
      <div className="border-b border-blue-200 mb-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile & Security Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6" role="tabpanel">
      {/* Change Password */}
      <div className={`${CARDS.elevated} p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className={TYPOGRAPHY.sectionTitle}>Change Password</h2>
        </div>
        <div className="space-y-3 max-w-md">
          <div>
            <label className={FORMS.label}>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className={FORMS.input}
              placeholder="Enter current password" />
          </div>
          <div>
            <label className={FORMS.label}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className={FORMS.input}
              placeholder="At least 8 characters" />
            <PasswordStrengthMeter password={newPassword} />
          </div>
          <div>
            <label className={FORMS.label}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className={FORMS.input}
              placeholder="Re-enter new password" />
          </div>
          {pwError && <p className={TYPOGRAPHY.errorText}>{pwError}</p>}
          {pwMsg && <p className={TYPOGRAPHY.successText}>{pwMsg}</p>}
          <button onClick={handleChangePassword} disabled={pwLoading} className={BUTTONS.primary}>
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className={`${CARDS.elevated} p-6`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.mfa_enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
            <svg className={`w-4 h-4 ${user?.mfa_enabled ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className={TYPOGRAPHY.sectionTitle}>Two-Factor Authentication</h2>
            {user?.mfa_enabled ? (
              <span className="text-xs text-green-600 font-medium">Enabled</span>
            ) : (
              <span className={TYPOGRAPHY.bodySmallMuted}>Not enabled</span>
            )}
          </div>
        </div>

        {mfaError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">{mfaError}</div>
        )}

        {backupCodes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-amber-800 text-sm mb-1">Save Your Backup Codes</h3>
            <p className="text-xs text-amber-700 mb-3">Store these codes safely. Each can be used once if you lose access to your authenticator.</p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="bg-white px-3 py-1.5 rounded border border-amber-200 text-sm font-mono text-center text-gray-900">{code}</code>
              ))}
            </div>
            <button onClick={() => setBackupCodes(null)} className="mt-3 text-xs text-amber-700 underline hover:text-amber-800">I've saved my codes</button>
          </div>
        )}

        {!user?.mfa_enabled && !mfaSetup && !backupCodes && (
          <div>
            <p className={`${TYPOGRAPHY.bodyMuted} mb-3`}>Add an extra layer of security by requiring a code from your authenticator app when signing in.</p>
            <button onClick={startMfaSetup} disabled={mfaLoading} className={BUTTONS.primary}>
              {mfaLoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}

        {mfaSetup && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
            <div className="flex justify-center py-2"><QRCodeSVG value={mfaSetup.uri} size={200} /></div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Or enter this key manually:</p>
              <code className="text-sm font-mono text-gray-900 break-all select-all">{mfaSetup.secret}</code>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Enter the 6-digit code to verify:</label>
              <input type="text" placeholder="000000" value={setupCode} onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={completeMfaSetup} disabled={mfaLoading || setupCode.length < 6} className={BUTTONS.primary}>
                {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
              <button onClick={() => { setMfaSetup(null); setSetupCode(''); setMfaError(''); }} className={BUTTONS.ghost}>Cancel</button>
            </div>
          </div>
        )}

        {user?.mfa_enabled && !backupCodes && (
          <div className="space-y-3 mt-3">
            {showRegen ? (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2">Enter your current TOTP code to regenerate backup codes:</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="000000" value={regenCode} onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono tracking-widest text-sm focus:ring-2 focus:ring-blue-500" />
                  <button onClick={regenerateBackupCodes} disabled={mfaLoading || regenCode.length < 6} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">{mfaLoading ? '...' : 'Regenerate'}</button>
                  <button onClick={() => { setShowRegen(false); setRegenCode(''); setMfaError(''); }} className="px-3 py-2 text-gray-500 text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setShowRegen(true); setShowDisable(false); setMfaError(''); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Regenerate Backup Codes</button>
            )}
            {showDisable ? (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-700 mb-2">Enter your current TOTP code or a backup code to disable 2FA:</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="000000" value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 9))} className="flex-1 px-3 py-2 border border-red-300 rounded-lg text-center font-mono tracking-widest text-sm focus:ring-2 focus:ring-red-500" />
                  <button onClick={disableMfa} disabled={mfaLoading || disableCode.length < 6} className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50">{mfaLoading ? '...' : 'Disable'}</button>
                  <button onClick={() => { setShowDisable(false); setDisableCode(''); setMfaError(''); }} className="px-3 py-2 text-gray-500 text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setShowDisable(true); setShowRegen(false); setMfaError(''); }} className="text-sm text-red-500 hover:text-red-600 font-medium">Disable Two-Factor Authentication</button>
            )}
          </div>
        )}
      </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6" role="tabpanel">
      <div className="bg-white rounded-xl border border-blue-200 p-6">
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
              <button onClick={() => toggleNotifPref(item.key)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifPrefs[item.key] ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifPrefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-blue-200 mt-5 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Email Digest</h3>
          <p className="text-xs text-gray-500 mb-3">Receive a daily email summary of your notifications at 6 AM UTC. Critical alerts (monitoring failures, approval requests, evidence expiry) are sent immediately.</p>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">Daily Email Digest</p>
              <p className="text-xs text-gray-500">Batched summary of all non-critical notifications</p>
            </div>
            <button onClick={() => toggleNotifPref('email_digest')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifPrefs.email_digest ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifPrefs.email_digest ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
        </div>
      )}

      {/* Compliance Tab (Admin Only) */}
      {activeTab === 'compliance' && isAdmin && (
        <div className="space-y-6" role="tabpanel">
      {/* Experience Type */}
      <div className="bg-white rounded-xl border border-blue-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Experience Type</h2>
          <p className="text-sm text-gray-500 mb-4">This controls your terminology, workflows, dashboards, and document templates.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { type: 'federal', name: 'Federal', desc: 'ATO, RMF, POA&M terminology. For FedRAMP, CMMC, FISMA.', color: 'blue' },
              { type: 'enterprise', name: 'Enterprise', desc: 'Audit, compliance terminology. For SOC 2, ISO, PCI DSS.', color: 'indigo' },
              { type: 'healthcare', name: 'Healthcare', desc: 'PHI, safeguard terminology. For HIPAA, HITRUST.', color: 'purple' },
            ].map((exp) => (
              <button key={exp.type} onClick={() => updateExperience(exp.type)} className={`p-4 rounded-lg border text-left transition-all ${experienceType === exp.type ? `border-${exp.color}-600 bg-${exp.color}-50 ring-2 ring-${exp.color}-600` : 'border-blue-200 hover:border-gray-300'}`}>
                <p className="font-medium text-gray-900">{exp.name}</p>
                <p className="text-xs text-gray-500 mt-1">{exp.desc}</p>
              </button>
            ))}
          </div>
      </div>

      {/* Compliance Scoring Weights */}
      <div className="bg-white rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Compliance Scoring Weights</h2>
              <p className="text-xs text-gray-500">Customize how your organization's compliance score is calculated</p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {[
              { key: 'control', label: 'Control Implementation', desc: 'Weight of control status in the overall score' },
              { key: 'poam', label: 'POA&M Health', desc: 'Penalty for open and overdue remediation items' },
              { key: 'evidence', label: 'Evidence Coverage', desc: 'Percentage of controls backed by evidence' },
              { key: 'risk', label: 'Risk Posture', desc: 'Impact of open risks on the compliance score' },
              { key: 'monitoring', label: 'Monitoring Health', desc: 'Contribution of continuous monitoring checks' },
            ].map(({ key, label, desc }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div><span className="text-sm font-medium text-gray-700">{label}</span><p className="text-xs text-gray-400">{desc}</p></div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{scoreWeights[key]}%</span>
                </div>
                <input type="range" min="0" max="100" step="5" value={scoreWeights[key]}
                  onChange={(e) => setScoreWeights((prev) => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${scoreWeightsValid ? 'text-green-600' : 'text-red-600'}`}>Total: {scoreWeightsSum}%</span>
              {!scoreWeightsValid && <span className="text-xs text-red-500">(must equal 100%)</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetScoreWeights} className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Reset Defaults</button>
              <button onClick={saveScoreWeights} disabled={!scoreWeightsValid || scoreWeightsLoading} className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {scoreWeightsLoading ? 'Saving...' : 'Save Weights'}
              </button>
            </div>
          </div>
          {scoreWeightsMsg && <p className={`text-xs mt-2 ${scoreWeightsMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{scoreWeightsMsg}</p>}
      </div>

      {/* Compliance Alert Thresholds */}
      <div className="bg-white rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Compliance Alert Thresholds</h2>
              <p className="text-xs text-gray-500">Configure how far in advance alerts are generated for upcoming deadlines</p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div><span className="text-sm font-medium text-gray-700">Alerts Enabled</span><p className="text-xs text-gray-400">Enable or disable automated deadline alerts</p></div>
              <button onClick={() => setAlertThresholds(t => ({ ...t, enabled: !t.enabled }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alertThresholds.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alertThresholds.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {[
              { key: 'poam_upcoming_days', label: 'POA&M Upcoming', desc: 'Days before due date to alert', unit: 'days' },
              { key: 'ato_expiry_days', label: 'ATO Expiry Warning', desc: 'Days before ATO expires to alert', unit: 'days' },
              { key: 'vendor_assessment_days', label: 'Vendor Assessment Due', desc: 'Days before vendor assessment to alert', unit: 'days' },
              { key: 'vendor_contract_days', label: 'Vendor Contract Ending', desc: 'Days before contract end to alert', unit: 'days' },
              { key: 'policy_review_days', label: 'Policy Review Due', desc: 'Days before policy review date to alert', unit: 'days' },
            ].map(({ key, label, desc, unit }) => (
              <div key={key} className="flex items-center justify-between">
                <div><span className="text-sm font-medium text-gray-700">{label}</span><p className="text-xs text-gray-400">{desc}</p></div>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" max="365" value={(alertThresholds as any)[key]}
                    onChange={(e) => setAlertThresholds(t => ({ ...t, [key]: parseInt(e.target.value) || 1 }))}
                    className="w-20 px-2 py-1.5 border rounded-lg text-sm text-right" disabled={!alertThresholds.enabled} />
                  <span className="text-xs text-gray-400 w-8">{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={saveAlertThresholds} disabled={alertThresholdsLoading} className="px-4 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {alertThresholdsLoading ? 'Saving...' : 'Save Thresholds'}
            </button>
          </div>
          {alertThresholdsMsg && <p className={`text-xs mt-2 ${alertThresholdsMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{alertThresholdsMsg}</p>}
      </div>
        </div>
      )}

      {/* Frameworks Tab */}
      {activeTab === 'frameworks' && (
        <div className="space-y-6" role="tabpanel">
      {/* Subscription */}
      {subscription && (
        <div className="bg-white rounded-xl border border-blue-200 p-6">
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

      {/* Frameworks */}
      <div className="bg-white rounded-xl border border-blue-200 p-6">
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
      )}

      {/* Security Tab (Admin Only) */}
      {activeTab === 'security' && isAdmin && (
        <div className="space-y-6">
          {/* Session Timeout */}
          <div className="bg-white rounded-xl border border-blue-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Session Timeout</h2>
            <p className="text-sm text-gray-500 mb-4">Auto-logout after inactivity. Required for FedRAMP/FISMA AC-11 compliance.</p>
            <div className="flex items-center gap-4">
              <select value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
              <button onClick={saveSecuritySettings} disabled={savingSecuritySettings} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {savingSecuritySettings ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-white rounded-xl border border-blue-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Data Export</h2>
            <p className="text-sm text-gray-500 mb-4">Download all organization data as JSON for backup or data portability. Does not include uploaded evidence files.</p>
            <button onClick={handleExportData} disabled={exporting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2">
              {exporting ? (
                <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Exporting...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export All Organization Data</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Integrations Tab (Admin Only) */}
      {activeTab === 'integrations' && isAdmin && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Outbound Webhooks</h2>
              <p className="text-sm text-gray-500">Deliver real-time event notifications to external systems (Slack, Teams, JIRA, etc.)</p>
            </div>
            <button onClick={() => { setEditingWebhook(null); setWebhookForm({ name: '', url: '', events: ['*'] }); setWebhookSecret(null); setShowWebhookModal(true); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Webhook
            </button>
          </div>

          {/* Webhook list */}
          {webhooksLoading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : webhooks.length === 0 ? (
            <div className="bg-white rounded-xl border border-blue-200 p-8 text-center">
              <p className="text-gray-500 text-sm">No webhooks configured. Add a webhook to receive real-time event notifications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${wh.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{wh.name}</p>
                      <p className="text-xs text-gray-400 truncate">{wh.url}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                      {Array.isArray(wh.events) && wh.events.includes('*') ? 'All events' : `${(wh.events || []).length} events`}
                    </span>
                    <button onClick={() => toggleWebhookActive(wh)} className={`text-xs px-2.5 py-1 rounded-full font-medium ${wh.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {wh.active ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => testWebhook(wh.id)} disabled={testingWebhook === wh.id} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded font-medium hover:bg-purple-100 disabled:opacity-50">
                      {testingWebhook === wh.id ? 'Testing...' : 'Test'}
                    </button>
                    <button onClick={() => { setEditingWebhook(wh); setWebhookForm({ name: wh.name, url: wh.url, events: wh.events || ['*'] }); setWebhookSecret(null); setShowWebhookModal(true); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    <button onClick={() => loadDeliveries(wh.id)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">{expandedDeliveries === wh.id ? 'Hide Log' : 'Log'}</button>
                    <button onClick={() => { if (confirm('Delete this webhook?')) deleteWebhook(wh.id); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </div>
                  {/* Delivery log */}
                  {expandedDeliveries === wh.id && (
                    <div className="border-t border-blue-100 bg-gray-50 px-5 py-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Recent Deliveries</p>
                      {deliveriesLoading ? (
                        <div className="text-center py-3"><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                      ) : deliveries.length === 0 ? (
                        <p className="text-xs text-gray-400">No deliveries yet</p>
                      ) : (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {deliveries.map(d => (
                            <div key={d.id} className="flex items-center gap-3 text-xs py-1">
                              <span className={`w-2 h-2 rounded-full ${d.response_status >= 200 && d.response_status < 300 ? 'bg-green-500' : d.response_status > 0 ? 'bg-red-500' : 'bg-gray-400'}`} />
                              <span className="font-mono text-gray-600">{d.event_type}</span>
                              <span className={`font-medium ${d.response_status >= 200 && d.response_status < 300 ? 'text-green-600' : 'text-red-600'}`}>{d.response_status || 'Error'}</span>
                              <span className="text-gray-400 ml-auto">{new Date(d.delivered_at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Webhook Create/Edit Modal */}
          {showWebhookModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  {webhookSecret && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Webhook Secret (save now — won't be shown again)</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-white border border-amber-300 rounded px-3 py-1.5 flex-1 font-mono break-all">{webhookSecret}</code>
                        <button onClick={() => navigator.clipboard.writeText(webhookSecret)} className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded font-medium hover:bg-amber-200">Copy</button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" value={webhookForm.name} onChange={e => setWebhookForm({ ...webhookForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Slack Notifications" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input type="url" value={webhookForm.url} onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://hooks.slack.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                      <input type="checkbox" checked={webhookForm.events.includes('*')} onChange={() => toggleWebhookEvent('*')} className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">All Events</span>
                    </label>
                    {!webhookForm.events.includes('*') && (
                      <div className="space-y-3 border-t border-gray-200 pt-3">
                        {WEBHOOK_EVENT_OPTIONS.map(group => (
                          <div key={group.group}>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{group.group}</p>
                            <div className="grid grid-cols-2 gap-1">
                              {group.events.map(evt => (
                                <label key={evt.value} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer">
                                  <input type="checkbox" checked={webhookForm.events.includes(evt.value)} onChange={() => toggleWebhookEvent(evt.value)} className="rounded border-gray-300 text-blue-600" />
                                  <span className="text-gray-700">{evt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={MODALS.footer}>
                  <button onClick={() => { setShowWebhookModal(false); setWebhookSecret(null); }} className={BUTTONS.ghost}>Cancel</button>
                  <button onClick={saveWebhook} disabled={savingWebhook || !webhookForm.name || !webhookForm.url} className={BUTTONS.primary}>
                    {savingWebhook ? 'Saving...' : editingWebhook ? 'Update Webhook' : 'Create Webhook'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legal Tab */}
      {activeTab === 'legal' && (
        <div className="space-y-6" role="tabpanel">
          <div className={`${CARDS.elevated} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className={TYPOGRAPHY.sectionTitle}>Legal Disclaimer</h2>
                <p className={TYPOGRAPHY.bodySmallMuted}>Important information about using ForgeComply 360</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className={TYPOGRAPHY.body}>
                ForgeComply 360 is a compliance management tool designed to help organizations track and manage
                their compliance activities. This software does <strong>not</strong> provide legal, regulatory,
                or professional compliance advice.
              </p>
              <p className={`${TYPOGRAPHY.body} mt-3`}>
                Use of this tool does not guarantee compliance with any federal, state, or industry
                regulatory framework including FedRAMP, NIST, HIPAA, SOC 2, ISO 27001, PCI-DSS, or others.
              </p>
              <p className={`${TYPOGRAPHY.body} mt-3`}>
                AI-generated content must be reviewed and validated by qualified personnel before use.
              </p>
              <Link to="/legal" className={`${BUTTONS.primary} inline-flex items-center gap-2 mt-4`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Read Full Legal Disclaimer
              </Link>
            </div>
          </div>

          <div className={`${CARDS.base} p-6`}>
            <h3 className={TYPOGRAPHY.sectionTitle}>Contact</h3>
            <p className={`${TYPOGRAPHY.bodyMuted} mt-2`}>
              For questions about these terms or ForgeComply 360, please contact your organization's administrator
              or reach out to our support team.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
