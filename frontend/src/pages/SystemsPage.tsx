import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { PageHeader } from '../components/PageHeader';
import { SkeletonListItem } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { exportSystemsCSV } from '../utils/exportHelpers';
import { TYPOGRAPHY, BUTTONS, FORMS, CARDS, BADGES } from '../utils/typography';

export function SystemsPage() {
  const { t, nav } = useExperience();
  const { canManage } = useAuth();
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', acronym: '', description: '', impact_level: 'moderate', deployment_model: '', service_model: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api('/api/v1/systems').then((d) => setSystems(d.systems)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/v1/systems', { method: 'POST', body: JSON.stringify(form) });
      setShowCreate(false);
      setForm({ name: '', acronym: '', description: '', impact_level: 'moderate', deployment_model: '', service_model: '' });
      load();
    } catch { } finally { setSaving(false); }
  };

  const impactColor = (level: string) => level === 'high' ? BADGES.error : level === 'moderate' ? BADGES.warning : BADGES.success;
  const statusColor = (s: string) => s === 'authorized' ? BADGES.success : s === 'denied' ? BADGES.error : BADGES.info;

  return (
    <div>
      <PageHeader title={nav('systems')} subtitle={`Manage your ${t('system').toLowerCase()}s`}>
        <button onClick={() => exportSystemsCSV(systems)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          CSV
        </button>
        {canManage && (
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90">
            + New {t('system')}
          </button>
        )}
      </PageHeader>

      {showCreate && (
        <div className={`${CARDS.base} p-6 mb-6`}>
          <h2 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>Create {t('system')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="System Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={FORMS.input} />
              <input type="text" placeholder="Acronym" value={form.acronym} onChange={(e) => setForm({ ...form, acronym: e.target.value.toUpperCase() })} maxLength={10} className={FORMS.input} />
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={FORMS.textarea} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={form.impact_level} onChange={(e) => setForm({ ...form, impact_level: e.target.value })} className={FORMS.select}>
                <option value="low">Low Impact</option>
                <option value="moderate">Moderate Impact</option>
                <option value="high">High Impact</option>
              </select>
              <select value={form.deployment_model} onChange={(e) => setForm({ ...form, deployment_model: e.target.value })} className={FORMS.select}>
                <option value="">Deployment Model</option>
                <option value="cloud">Cloud</option>
                <option value="on_premises">On-Premises</option>
                <option value="hybrid">Hybrid</option>
                <option value="government_cloud">Government Cloud</option>
              </select>
              <select value={form.service_model} onChange={(e) => setForm({ ...form, service_model: e.target.value })} className={FORMS.select}>
                <option value="">Service Model</option>
                <option value="IaaS">IaaS</option>
                <option value="PaaS">PaaS</option>
                <option value="SaaS">SaaS</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className={BUTTONS.primary}>{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className={BUTTONS.ghost}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <SkeletonListItem />
      ) : systems.length === 0 ? (
        <EmptyState title="No systems yet" subtitle="Create your first system to get started" icon="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((sys) => {
            const isExpanded = expandedId === sys.id;
            return (
              <React.Fragment key={sys.id}>
                <div
                  className={`bg-white rounded-xl border ${isExpanded ? 'border-forge-navy ring-2 ring-forge-navy/10' : 'border-gray-200'} p-5 hover:border-gray-300 transition-colors cursor-pointer`}
                  onClick={() => setExpandedId(isExpanded ? null : sys.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{sys.name}</h3>
                      {sys.acronym && <p className="text-xs text-gray-500">{sys.acronym}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(sys.status)}`}>{sys.status}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {sys.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{sys.description}</p>}
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${impactColor(sys.impact_level)}`}>{sys.impact_level}</span>
                    {sys.deployment_model && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{sys.deployment_model}</span>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="col-span-full bg-white rounded-xl border border-forge-navy ring-2 ring-forge-navy/10 p-5 -mt-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{sys.name}</h3>
                        {sys.description && <p className="text-sm text-gray-600 mt-1">{sys.description}</p>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setExpandedId(null); }} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">Impact Level</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${impactColor(sys.impact_level)}`}>{sys.impact_level}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">Status</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${statusColor(sys.status)}`}>{sys.status}</span>
                      </div>
                      {sys.deployment_model && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 block">Deployment</span>
                          <span className="text-sm text-gray-700 mt-1 block capitalize">{sys.deployment_model.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {sys.service_model && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 block">Service Model</span>
                          <span className="text-sm text-gray-700 mt-1 block">{sys.service_model}</span>
                        </div>
                      )}
                      {sys.system_owner && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 block">System Owner</span>
                          <span className="text-sm text-gray-700 mt-1 block">{sys.system_owner}</span>
                        </div>
                      )}
                      {sys.authorizing_official && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 block">Authorizing Official</span>
                          <span className="text-sm text-gray-700 mt-1 block">{sys.authorizing_official}</span>
                        </div>
                      )}
                      {sys.security_officer && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 block">Security Officer</span>
                          <span className="text-sm text-gray-700 mt-1 block">{sys.security_officer}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <ActivityTimeline resourceType="system" resourceId={sys.id} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
