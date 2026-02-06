import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';

interface System { id: string; name: string; acronym?: string; }
interface Control { id: string; control_id: string; title: string; family?: string; }
interface Evidence { id: string; title: string; file_name?: string; }
interface Policy { id: string; title: string; status?: string; }

interface PortalData {
  id?: string;
  name: string;
  auditor_name: string;
  auditor_email: string;
  description: string;
  shared_systems: string[];
  shared_controls: string[];
  shared_evidence: string[];
  shared_policies: string[];
  expires_at: string | null;
  share_link?: string;
}

const STEPS = ['Basic Info', 'Select Items', 'Set Expiry', 'Preview & Create'];

export function PortalBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const { config } = useExperience();
  const { addToast } = useToast();

  const isEditMode = Boolean(id);
  const primaryColor = config?.theme_overrides?.primaryColor || 'blue';

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form data
  const [form, setForm] = useState<PortalData>({
    name: '',
    auditor_name: '',
    auditor_email: '',
    description: '',
    shared_systems: [],
    shared_controls: [],
    shared_evidence: [],
    shared_policies: [],
    expires_at: null,
  });

  // Available items for selection
  const [systems, setSystems] = useState<System[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  // Search filters
  const [systemSearch, setSystemSearch] = useState('');
  const [controlSearch, setControlSearch] = useState('');
  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [policySearch, setPolicySearch] = useState('');

  // Expiry options
  const [expiryOption, setExpiryOption] = useState<'30' | '60' | '90' | 'custom' | 'never'>('30');
  const [customDate, setCustomDate] = useState('');

  // Created portal link
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Load existing portal if editing
  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      api<{ portal: PortalData }>(`/api/v1/portals/${id}`)
        .then(({ portal }) => {
          setForm(portal);
          if (portal.expires_at) {
            const expiresDate = new Date(portal.expires_at);
            const daysFromNow = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysFromNow === 30) setExpiryOption('30');
            else if (daysFromNow === 60) setExpiryOption('60');
            else if (daysFromNow === 90) setExpiryOption('90');
            else {
              setExpiryOption('custom');
              setCustomDate(portal.expires_at.split('T')[0]);
            }
          } else {
            setExpiryOption('never');
          }
        })
        .catch(() => addToast({ type: 'error', title: 'Failed to load portal' }))
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode, addToast]);

  // Load selectable items
  useEffect(() => {
    Promise.all([
      api<{ systems: System[] }>('/api/v1/systems'),
      api<{ controls: Control[] }>('/api/v1/controls'),
      api<{ evidence: Evidence[] }>('/api/v1/evidence'),
      api<{ policies: Policy[] }>('/api/v1/policies'),
    ]).then(([sysRes, ctrlRes, evRes, polRes]) => {
      setSystems(sysRes.systems || []);
      setControls(ctrlRes.controls || []);
      setEvidence(evRes.evidence || []);
      setPolicies(polRes.policies || []);
    }).catch(() => {});
  }, []);

  const update = <K extends keyof PortalData>(key: K, value: PortalData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleItem = (list: string[], setList: (v: string[]) => void, itemId: string) => {
    if (list.includes(itemId)) {
      setList(list.filter((i) => i !== itemId));
    } else {
      setList([...list, itemId]);
    }
  };

  const getExpiryDate = (): string | null => {
    if (expiryOption === 'never') return null;
    if (expiryOption === 'custom') return customDate ? `${customDate}T23:59:59Z` : null;
    const days = parseInt(expiryOption, 10);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, expires_at: getExpiryDate() };
      if (isEditMode && id) {
        await api(`/api/v1/portals/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        addToast({ type: 'success', title: 'Portal updated successfully' });
        navigate('/portals');
      } else {
        const { portal } = await api<{ portal: PortalData }>('/api/v1/portals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setCreatedLink(portal.share_link || `${window.location.origin}/portal/${portal.id}`);
        setStep(4); // Move to success step
        addToast({ type: 'success', title: 'Auditor portal created' });
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Failed to save portal', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canProceed = (currentStep: number): boolean => {
    if (currentStep === 0) {
      return form.name.trim() !== '' && form.auditor_name.trim() !== '' && form.auditor_email.trim() !== '';
    }
    if (currentStep === 1) {
      return form.shared_systems.length > 0 || form.shared_controls.length > 0 || form.shared_evidence.length > 0 || form.shared_policies.length > 0;
    }
    return true;
  };

  // Filtered items
  const filteredSystems = systems.filter((s) => s.name.toLowerCase().includes(systemSearch.toLowerCase()));
  const filteredControls = controls.filter((c) => c.control_id.toLowerCase().includes(controlSearch.toLowerCase()) || c.title.toLowerCase().includes(controlSearch.toLowerCase()));
  const filteredEvidence = evidence.filter((e) => e.title.toLowerCase().includes(evidenceSearch.toLowerCase()));
  const filteredPolicies = policies.filter((p) => p.title.toLowerCase().includes(policySearch.toLowerCase()));

  const totalSelected = form.shared_systems.length + form.shared_controls.length + form.shared_evidence.length + form.shared_policies.length;

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditMode ? 'Edit Auditor Portal' : 'Create Auditor Portal'}
        subtitle="Configure a secure portal for external auditors to access compliance artifacts"
      />

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                i < step
                  ? `bg-${primaryColor}-600 text-white cursor-pointer hover:bg-${primaryColor}-700`
                  : i === step
                  ? `bg-${primaryColor}-600 text-white`
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {i < step ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 ${i < step ? `bg-${primaryColor}-600` : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 text-sm">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portal Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g., FY2024 SOC 2 Audit"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auditor Name *</label>
                <input
                  type="text"
                  value={form.auditor_name}
                  onChange={(e) => update('auditor_name', e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auditor Email *</label>
                <input
                  type="email"
                  value={form.auditor_email}
                  onChange={(e) => update('auditor_email', e.target.value)}
                  placeholder="e.g., auditor@firm.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="Optional notes about this audit portal"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Select Items */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select the items you want to share with the auditor. Selected: <span className="font-semibold">{totalSelected}</span> items
            </p>

            {/* Systems */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Systems ({form.shared_systems.length})</h3>
                <input
                  type="text"
                  placeholder="Search systems..."
                  value={systemSearch}
                  onChange={(e) => setSystemSearch(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                {filteredSystems.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2 text-center">No systems found</p>
                ) : (
                  filteredSystems.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.shared_systems.includes(s.id)}
                        onChange={() => toggleItem(form.shared_systems, (v) => update('shared_systems', v), s.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{s.name}</span>
                      {s.acronym && <span className="text-xs text-gray-500">({s.acronym})</span>}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Controls */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Controls ({form.shared_controls.length})</h3>
                <input
                  type="text"
                  placeholder="Search controls..."
                  value={controlSearch}
                  onChange={(e) => setControlSearch(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                {filteredControls.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2 text-center">No controls found</p>
                ) : (
                  filteredControls.slice(0, 100).map((c) => (
                    <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.shared_controls.includes(c.id)}
                        onChange={() => toggleItem(form.shared_controls, (v) => update('shared_controls', v), c.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{c.control_id}</span>
                      <span className="text-sm text-gray-900 dark:text-white truncate">{c.title}</span>
                    </label>
                  ))
                )}
                {filteredControls.length > 100 && (
                  <p className="text-xs text-gray-400 text-center py-1">Showing 100 of {filteredControls.length} controls</p>
                )}
              </div>
            </div>

            {/* Evidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Evidence ({form.shared_evidence.length})</h3>
                <input
                  type="text"
                  placeholder="Search evidence..."
                  value={evidenceSearch}
                  onChange={(e) => setEvidenceSearch(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                {filteredEvidence.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2 text-center">No evidence found</p>
                ) : (
                  filteredEvidence.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.shared_evidence.includes(e.id)}
                        onChange={() => toggleItem(form.shared_evidence, (v) => update('shared_evidence', v), e.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{e.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Policies */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Policies ({form.shared_policies.length})</h3>
                <input
                  type="text"
                  placeholder="Search policies..."
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                {filteredPolicies.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2 text-center">No policies found</p>
                ) : (
                  filteredPolicies.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.shared_policies.includes(p.id)}
                        onChange={() => toggleItem(form.shared_policies, (v) => update('shared_policies', v), p.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{p.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Set Expiry */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Portal Expiration</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(['30', '60', '90', 'custom', 'never'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setExpiryOption(opt)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      expiryOption === opt
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {opt === 'never' ? 'No Expiry' : opt === 'custom' ? 'Custom' : `${opt} Days`}
                  </button>
                ))}
              </div>
            </div>

            {expiryOption === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Expiration Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {expiryOption === 'never'
                  ? 'This portal will not expire automatically. You can revoke access at any time.'
                  : expiryOption === 'custom' && customDate
                  ? `Portal access will expire on ${new Date(customDate).toLocaleDateString()}.`
                  : `Portal access will expire in ${expiryOption} days.`}
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 3 && !createdLink && (
          <div className="space-y-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Portal Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Portal Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{form.name}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Auditor</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{form.auditor_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{form.auditor_email}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Shared Items</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{form.shared_systems.length}</p>
                  <p className="text-xs text-gray-500">Systems</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{form.shared_controls.length}</p>
                  <p className="text-xs text-gray-500">Controls</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{form.shared_evidence.length}</p>
                  <p className="text-xs text-gray-500">Evidence</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{form.shared_policies.length}</p>
                  <p className="text-xs text-gray-500">Policies</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expiration</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {expiryOption === 'never'
                  ? 'No expiration'
                  : expiryOption === 'custom'
                  ? `Expires ${new Date(customDate).toLocaleDateString()}`
                  : `Expires in ${expiryOption} days`}
              </p>
            </div>
          </div>
        )}

        {/* Success: Show Link */}
        {step === 4 && createdLink && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Portal Created Successfully</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Share the link below with your auditor to grant access.</p>

            <div className="flex items-center gap-2 max-w-xl mx-auto">
              <input
                type="text"
                readOnly
                value={createdLink}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => navigate('/portals')}
              className="mt-8 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Portals
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : navigate('/portals')}
              className="px-6 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed(step)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isEditMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update Portal' : 'Create Portal'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
