import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';

export function SettingsPage() {
  const { user, org, refreshUser, isAdmin, canManage } = useAuth();
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
  });

  // Scoring weights state (admin+)
  const [scoreWeights, setScoreWeights] = useState<Record<string, number>>({ control: 40, poam: 20, evidence: 15, risk: 15, monitoring: 10 });
  const [scoreWeightsLoading, setScoreWeightsLoading] = useState(false);
  const [scoreWeightsMsg, setScoreWeightsMsg] = useState('');

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
    }
  }, [isAdmin]);

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

        {/* Email Digest */}
        <div className="border-t border-gray-200 mt-5 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Email Digest</h3>
          <p className="text-xs text-gray-500 mb-3">Receive a daily email summary of your notifications at 6 AM UTC. Critical alerts (monitoring failures, approval requests, evidence expiry) are sent immediately.</p>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">Daily Email Digest</p>
              <p className="text-xs text-gray-500">Batched summary of all non-critical notifications</p>
            </div>
            <button
              onClick={() => toggleNotifPref('email_digest')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifPrefs.email_digest ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifPrefs.email_digest ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Scoring Weights — admin+ */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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
                  <div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{scoreWeights[key]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={scoreWeights[key]}
                  onChange={(e) => setScoreWeights((prev) => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${scoreWeightsValid ? 'text-green-600' : 'text-red-600'}`}>
                Total: {scoreWeightsSum}%
              </span>
              {!scoreWeightsValid && <span className="text-xs text-red-500">(must equal 100%)</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetScoreWeights}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset Defaults
              </button>
              <button
                onClick={saveScoreWeights}
                disabled={!scoreWeightsValid || scoreWeightsLoading}
                className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {scoreWeightsLoading ? 'Saving...' : 'Save Weights'}
              </button>
            </div>
          </div>
          {scoreWeightsMsg && (
            <p className={`text-xs mt-2 ${scoreWeightsMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {scoreWeightsMsg}
            </p>
          )}
        </div>
      )}

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.mfa_enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
            <svg className={`w-4 h-4 ${user?.mfa_enabled ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Two-Factor Authentication</h2>
            {user?.mfa_enabled ? (
              <span className="text-xs text-green-600 font-medium">Enabled</span>
            ) : (
              <span className="text-xs text-gray-500">Not enabled</span>
            )}
          </div>
        </div>

        {mfaError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">{mfaError}</div>
        )}

        {/* Backup codes display (shown after setup or regen) */}
        {backupCodes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-amber-800 text-sm mb-1">Save Your Backup Codes</h3>
            <p className="text-xs text-amber-700 mb-3">
              Store these codes safely. Each can be used once if you lose access to your authenticator.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="bg-white px-3 py-1.5 rounded border border-amber-200 text-sm font-mono text-center text-gray-900">{code}</code>
              ))}
            </div>
            <button onClick={() => setBackupCodes(null)} className="mt-3 text-xs text-amber-700 underline hover:text-amber-800">
              I've saved my codes
            </button>
          </div>
        )}

        {/* Setup flow */}
        {!user?.mfa_enabled && !mfaSetup && !backupCodes && (
          <div>
            <p className="text-sm text-gray-500 mb-3">Add an extra layer of security by requiring a code from your authenticator app when signing in.</p>
            <button onClick={startMfaSetup} disabled={mfaLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {mfaLoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}

        {mfaSetup && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
            <div className="flex justify-center py-2">
              <QRCodeSVG value={mfaSetup.uri} size={200} />
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Or enter this key manually:</p>
              <code className="text-sm font-mono text-gray-900 break-all select-all">{mfaSetup.secret}</code>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Enter the 6-digit code to verify:</label>
              <input
                type="text"
                placeholder="000000"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={completeMfaSetup} disabled={mfaLoading || setupCode.length < 6} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
              <button onClick={() => { setMfaSetup(null); setSetupCode(''); setMfaError(''); }} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Enabled state — manage */}
        {user?.mfa_enabled && !backupCodes && (
          <div className="space-y-3 mt-3">
            {/* Regenerate Backup Codes */}
            {showRegen ? (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2">Enter your current TOTP code to regenerate backup codes:</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="000000" value={regenCode} onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono tracking-widest text-sm focus:ring-2 focus:ring-blue-500" />
                  <button onClick={regenerateBackupCodes} disabled={mfaLoading || regenCode.length < 6} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                    {mfaLoading ? '...' : 'Regenerate'}
                  </button>
                  <button onClick={() => { setShowRegen(false); setRegenCode(''); setMfaError(''); }} className="px-3 py-2 text-gray-500 text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setShowRegen(true); setShowDisable(false); setMfaError(''); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Regenerate Backup Codes
              </button>
            )}

            {/* Disable 2FA */}
            {showDisable ? (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-700 mb-2">Enter your current TOTP code or a backup code to disable 2FA:</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="000000" value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 9))} className="flex-1 px-3 py-2 border border-red-300 rounded-lg text-center font-mono tracking-widest text-sm focus:ring-2 focus:ring-red-500" />
                  <button onClick={disableMfa} disabled={mfaLoading || disableCode.length < 6} className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50">
                    {mfaLoading ? '...' : 'Disable'}
                  </button>
                  <button onClick={() => { setShowDisable(false); setDisableCode(''); setMfaError(''); }} className="px-3 py-2 text-gray-500 text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setShowDisable(true); setShowRegen(false); setMfaError(''); }} className="text-sm text-red-500 hover:text-red-600 font-medium">
                Disable Two-Factor Authentication
              </button>
            )}
          </div>
        )}
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
