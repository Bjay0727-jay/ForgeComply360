import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { BUTTONS } from '../utils/typography';

// --- Constants ---
const SECTIONS = [
  { key: 'system_info', label: 'System Information' },
  { key: 'fips199_categorization', label: 'FIPS 199 Categorization' },
  { key: 'control_baseline', label: 'Control Baseline' },
  { key: 'authorization_boundary', label: 'Authorization Boundary' },
  { key: 'data_flow', label: 'Data Flow' },
  { key: 'network_architecture', label: 'Network Architecture' },
  { key: 'system_interconnections', label: 'System Interconnections' },
  { key: 'personnel', label: 'Personnel & Roles' },
  { key: 'control_implementations', label: 'Control Implementations' },
  { key: 'contingency_plan', label: 'Contingency Plan' },
  { key: 'incident_response', label: 'Incident Response' },
  { key: 'continuous_monitoring', label: 'Continuous Monitoring' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-gray-100 text-gray-500',
};

export function SSPPage() {
  const { t, isFederal } = useExperience();
  const { canEdit } = useAuth();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/v1/ssp')
      .then((d) => setDocuments(d.documents || []))
      .finally(() => setLoading(false));
  }, []);

  // Open SSP in the standalone Reporter app
  const handleOpenInReporter = async (sspId: string) => {
    try {
      const data = await api(`/api/v1/ssp/${sspId}/reporter-token`, { method: 'POST' });
      if (data.reporter_url) {
        window.open(data.reporter_url, '_blank', 'noopener,noreferrer');
      }
    } catch (e: any) {
      console.error('Failed to generate reporter token:', e);
      alert('Failed to open Reporter. Please try again.');
    }
  };

  // Open Reporter to create a new SSP (no existing SSP ID)
  const handleLaunchReporter = async () => {
    try {
      const data = await api<{ reporter_url: string }>('/api/v1/auth/reporter-token', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (data.reporter_url) {
        window.open(data.reporter_url, '_blank', 'noopener,noreferrer');
      }
    } catch (e: any) {
      console.error('Failed to launch Reporter:', e);
      alert('Failed to launch Forge Reporter. Please try again.');
    }
  };

  // Calculate completion percentage for a document
  const getDocCompletion = (doc: any): number => {
    try {
      const oscal = typeof doc.oscal_json === 'string' ? JSON.parse(doc.oscal_json) : doc.oscal_json;
      const sections = oscal?._authoring?.sections || {};
      const filled = SECTIONS.filter(s => sections[s.key]?.status && sections[s.key].status !== 'empty').length;
      return Math.round((filled / SECTIONS.length) * 100);
    } catch { return 0; }
  };

  const title = isFederal ? 'SSP Document Builder' : `${t('document')} Builder`;

  if (loading) {
    return <div className="space-y-6"><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div>
      <PageHeader title={title} subtitle="Create and manage System Security Plans with Forge Reporter">
        <div className="flex items-center gap-2">
          {documents.length >= 2 && canEdit && (
            <Link
              to="/ssp/compare"
              className="px-3 py-2 text-xs font-medium text-blue-100 bg-blue-500/30 rounded-lg hover:bg-blue-500/50 flex items-center gap-1.5 border border-blue-300/30"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Compare SSPs
            </Link>
          )}
          <button
            onClick={handleLaunchReporter}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New SSP
          </button>
        </div>
      </PageHeader>

      {/* Document List */}
      <div className="bg-white rounded-xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">SSP Documents</h2>
          <span className="text-sm text-gray-500">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        </div>

        {documents.length === 0 ? (
          <EmptyState
            title="No SSP documents yet"
            subtitle="Click 'Create New SSP' to get started with Forge Reporter"
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const completion = getDocCompletion(doc);
              return (
                <div key={doc.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                        {doc.ssp_type === 'fisma' && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-700 flex-shrink-0">FISMA</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                          {doc.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{doc.framework_name} | {doc.system_name}</span>
                        <span className="text-xs text-gray-400">v{doc.version}</span>
                        <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {/* Completion bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[200px]">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              completion === 100 ? 'bg-green-500' : completion > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{completion}% complete</span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleOpenInReporter(doc.id)}
                        className={`${BUTTONS.sm} ${BUTTONS.primary} flex items-center gap-1.5`}
                        title="Open in Forge Reporter"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in Reporter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
