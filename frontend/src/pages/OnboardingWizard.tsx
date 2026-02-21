import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

const FRAMEWORKS = [
  { id: 'nist-800-53-r5', name: 'NIST 800-53 Rev 5', category: 'Federal', description: '1,189 security controls for federal systems' },
  { id: 'fedramp-moderate', name: 'FedRAMP Moderate', category: 'Federal', description: 'Cloud security for federal agencies' },
  { id: 'fedramp-high', name: 'FedRAMP High', category: 'Federal', description: 'High-impact cloud systems' },
  { id: 'cmmc-l2', name: 'CMMC Level 2', category: 'Defense', description: 'Defense contractor cybersecurity (110 controls)' },
  { id: 'cmmc-l3', name: 'CMMC Level 3', category: 'Defense', description: 'Advanced defense contractor requirements' },
  { id: 'cnsa-2', name: 'CNSA 2.0 (NSA)', category: 'Defense', description: 'Quantum-resistant crypto standards (16 controls)' },
  { id: 'nist-800-171-r3', name: 'NIST 800-171 Rev 3', category: 'Defense', description: 'CUI protection for contractors' },
  { id: 'hipaa', name: 'HIPAA Security Rule', category: 'Healthcare', description: 'Healthcare data protection (75 safeguards)' },
  { id: 'hitrust-csf', name: 'HITRUST CSF', category: 'Healthcare', description: 'Healthcare trust framework' },
  { id: 'soc2-type2', name: 'SOC 2 Type II', category: 'Commercial', description: 'Trust service criteria (64 controls)' },
  { id: 'iso-27001', name: 'ISO 27001:2022', category: 'Commercial', description: 'Information security management (114 controls)' },
  { id: 'pci-dss-v4', name: 'PCI DSS v4.0.1', category: 'Commercial', description: 'Payment card security (264 controls)' },
  { id: 'nist-csf-2', name: 'NIST CSF 2.0', category: 'Commercial', description: 'Cybersecurity framework' },
  { id: 'ffiec-it', name: 'FFIEC IT Handbook', category: 'Financial', description: 'Bank examination handbook (90 controls)' },
  { id: 'csa-ccm-v4', name: 'CSA CCM v4', category: 'Cloud', description: 'Cloud security controls (197 controls)' },
  { id: 'nerc-cip', name: 'NERC CIP', category: 'Critical Infrastructure', description: 'Bulk electric system protection (47 controls)' },
];

const STEPS = ['Welcome', 'Organization', 'Framework', 'System', 'Complete'];

export function OnboardingWizard() {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    organizationName: '', industry: '', size: '',
    selectedFramework: '', systemName: '', systemAcronym: '', systemDescription: '', impactLevel: 'moderate',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      await api('/api/v1/organization', { method: 'PUT', body: JSON.stringify({ name: form.organizationName, industry: form.industry, size: form.size }) });
      if (form.selectedFramework) {
        await api('/api/v1/frameworks/enable', { method: 'POST', body: JSON.stringify({ framework_id: form.selectedFramework, is_primary: true }) });
      }
      if (form.systemName) {
        const { system } = await api('/api/v1/systems', { method: 'POST', body: JSON.stringify({ name: form.systemName, acronym: form.systemAcronym, description: form.systemDescription, impact_level: form.impactLevel }) });
        if (form.selectedFramework && system?.id) {
          await api('/api/v1/implementations/bulk', { method: 'POST', body: JSON.stringify({ system_id: system.id, framework_id: form.selectedFramework }) });
        }
      }
      await api('/api/v1/user/onboarding', { method: 'POST', body: JSON.stringify({ completed: true }) });
      setStep(4);
      setTimeout(() => refreshUser(), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Federal', 'Defense', 'Healthcare', 'Commercial'];
  const filtered = filter === 'All' ? FRAMEWORKS : FRAMEWORKS.filter((f) => f.category === filter);
  const catColors: Record<string, string> = { Federal: 'bg-blue-100 text-blue-700', Defense: 'bg-green-100 text-green-700', Healthcare: 'bg-purple-100 text-purple-700', Commercial: 'bg-gray-100 text-gray-700' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i <= step ? 'bg-white text-blue-900' : 'bg-blue-700 text-blue-300'}`}>{i + 1}</div>
              {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-white' : 'bg-blue-700'}`} />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-blue-200 text-center mb-4 text-sm">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Forge Cyber Defense</h2>
              <p className="text-gray-600 mb-8 max-w-lg mx-auto">Let's configure your organization and create your first information system for compliance.</p>
              <button onClick={() => setStep(1)} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Get Started</button>
            </div>
          )}

          {/* Step 1: Organization */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about your organization</h2>
              <p className="text-gray-500 mb-6 text-sm">This determines your compliance experience (Federal, Enterprise, or Healthcare).</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                  <input type="text" value={form.organizationName} onChange={(e) => update('organizationName', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                  <select value={form.industry} onChange={(e) => update('industry', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select industry</option>
                    {['Defense & Aerospace', 'Federal Government', 'State & Local Government', 'Healthcare', 'Financial Services', 'Technology', 'Manufacturing', 'Education', 'Other'].map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Size *</label>
                  <div className="flex gap-2 flex-wrap">
                    {['1-10', '11-50', '51-200', '201-500', '501+'].map((s) => (
                      <button key={s} onClick={() => update('size', s)} className={`px-4 py-2 rounded-lg border text-sm ${form.size === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(0)} className="px-6 py-2 text-gray-500">Back</button>
                <button onClick={() => setStep(2)} disabled={!form.organizationName || !form.industry || !form.size} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {/* Step 2: Framework */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Select your primary compliance framework</h2>
              <p className="text-gray-500 mb-4 text-sm">You can add more frameworks later. Choose the one you need first.</p>
              <div className="flex gap-2 mb-4">
                {categories.map((c) => (
                  <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {filtered.map((fw) => (
                  <button key={fw.id} onClick={() => update('selectedFramework', fw.id)} className={`p-3 rounded-lg border text-left transition-all ${form.selectedFramework === fw.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' : 'border-blue-200 hover:border-gray-300'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 text-sm">{fw.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${catColors[fw.category] || ''}`}>{fw.category}</span>
                    </div>
                    <p className="text-xs text-gray-500">{fw.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="px-6 py-2 text-gray-500">Back</button>
                <button onClick={() => setStep(3)} disabled={!form.selectedFramework} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: System */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Create your first information system</h2>
              <p className="text-gray-500 mb-6 text-sm">This is the system you'll be getting authorized.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">System Name *</label>
                    <input type="text" value={form.systemName} onChange={(e) => update('systemName', e.target.value)} placeholder="e.g., Customer Portal" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acronym</label>
                    <input type="text" value={form.systemAcronym} onChange={(e) => update('systemAcronym', e.target.value.toUpperCase())} placeholder="e.g., CP" maxLength={10} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.systemDescription} onChange={(e) => update('systemDescription', e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FIPS 199 Impact Level *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ id: 'low', color: 'green' }, { id: 'moderate', color: 'yellow' }, { id: 'high', color: 'red' }].map((l) => (
                      <button key={l.id} onClick={() => update('impactLevel', l.id)} className={`p-3 rounded-lg border text-center ${form.impactLevel === l.id ? 'border-blue-600 bg-blue-50' : 'border-blue-200 hover:border-gray-300'}`}>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-${l.color}-100 text-${l.color}-700 capitalize`}>{l.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="px-6 py-2 text-gray-500">Back</button>
                <button onClick={handleComplete} disabled={!form.systemName || loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">You're all set!</h2>
              <p className="text-gray-600 mb-6">Your organization, framework, and first system are configured.</p>
              <p className="text-gray-400 text-sm">Redirecting to dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
