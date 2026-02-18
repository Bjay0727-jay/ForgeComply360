import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BUTTONS } from '../utils/typography';

interface PortalData {
  org_name: string;
  org_logo?: string;
  expires_at: string;
  systems: PortalSystem[];
  controls: PortalControl[];
  evidence: PortalEvidence[];
  policies: PortalPolicy[];
}

interface PortalSystem {
  id: string;
  name: string;
  description: string;
  status: string;
  framework: string;
}

interface PortalControl {
  id: string;
  control_id: string;
  title: string;
  description: string;
  status: string;
  family: string;
}

interface PortalEvidence {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface PortalPolicy {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  effective_date: string;
}

type TabType = 'systems' | 'controls' | 'evidence' | 'policies';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function PublicPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('systems');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentItem, setCommentItem] = useState<{ type: string; id: string; name: string } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/v1/public/portal/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setPortalData(data);
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load portal. The link may be invalid or expired.');
          setLoading(false);
        });
    }
  }, [token]);

  const handleDownload = async (evidenceId: string, fileName: string) => {
    setDownloading(evidenceId);
    try {
      const res = await fetch(`${API_BASE}/api/v1/public/portal/${token}/evidence/${evidenceId}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'evidence';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentItem || !commentText.trim()) return;
    setSubmittingComment(true);
    setCommentSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/v1/public/portal/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: commentItem.type,
          item_id: commentItem.id,
          comment: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setCommentSuccess(true);
        setCommentText('');
        setTimeout(() => {
          setCommentItem(null);
          setCommentSuccess(false);
        }, 2000);
      }
    } catch {
      setError('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getDaysUntilExpiry = () => {
    if (!portalData?.expires_at) return 0;
    const now = new Date();
    const expiry = new Date(portalData.expires_at);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeBadge = (fileType: string) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return { label: 'PDF', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (type.includes('word') || type.includes('doc')) return { label: 'DOC', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return { label: 'XLS', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    if (type.includes('image') || type.includes('png') || type.includes('jpg')) return { label: 'IMG', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
    return { label: 'FILE', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
  };

  const filterItems = <T extends { title?: string; name?: string; description?: string }>(items: T[]) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'systems', label: 'Systems', count: portalData?.systems?.length || 0 },
    { key: 'controls', label: 'Controls', count: portalData?.controls?.length || 0 },
    { key: 'evidence', label: 'Evidence', count: portalData?.evidence?.length || 0 },
    { key: 'policies', label: 'Policies', count: portalData?.policies?.length || 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !portalData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Portal Access Error</h2>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
            If you believe this is an error, please contact the organization that shared this link.
          </p>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysUntilExpiry();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Forge Cyber Defense</span>
              </div>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{portalData?.org_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Auditor Portal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Expiry Banner */}
      {daysRemaining <= 7 && daysRemaining > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Portal expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}
      {daysRemaining > 7 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Portal access valid for {daysRemaining} days</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && portalData && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
                  }`}
                >
                  <span className="font-medium">{tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Systems Tab */}
            {activeTab === 'systems' && (
              <div className="grid gap-4">
                {filterItems(portalData?.systems || []).map(system => (
                  <div key={system.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{system.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{system.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                          {system.framework}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          system.status === 'authorized' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          system.status === 'in_progress' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {system.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCommentItem({ type: 'system', id: system.id, name: system.name })}
                      className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Add Comment
                    </button>
                  </div>
                ))}
                {filterItems(portalData?.systems || []).length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">No systems found</div>
                )}
              </div>
            )}

            {/* Controls Tab */}
            {activeTab === 'controls' && (
              <div className="grid gap-4">
                {filterItems(portalData?.controls || []).map(control => (
                  <div key={control.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                            {control.control_id}
                          </span>
                          <span className="text-xs text-gray-400">{control.family}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mt-2">{control.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{control.description}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        control.status === 'implemented' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        control.status === 'partial' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                        control.status === 'planned' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {control.status}
                      </span>
                    </div>
                    <button
                      onClick={() => setCommentItem({ type: 'control', id: control.id, name: control.control_id })}
                      className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Add Comment
                    </button>
                  </div>
                ))}
                {filterItems(portalData?.controls || []).length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">No controls found</div>
                )}
              </div>
            )}

            {/* Evidence Tab */}
            {activeTab === 'evidence' && (
              <div className="grid gap-4">
                {filterItems(portalData?.evidence || []).map(ev => {
                  const badge = getFileTypeBadge(ev.file_type);
                  return (
                    <div key={ev.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatFileSize(ev.file_size)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mt-2">{ev.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ev.description}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Uploaded {new Date(ev.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(ev.id, ev.file_name)}
                          disabled={downloading === ev.id}
                          className={`flex-shrink-0 ml-4 flex items-center gap-2 ${BUTTONS.primary}`}
                        >
                          {downloading === ev.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                          Download
                        </button>
                      </div>
                      <button
                        onClick={() => setCommentItem({ type: 'evidence', id: ev.id, name: ev.title })}
                        className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Add Comment
                      </button>
                    </div>
                  );
                })}
                {filterItems(portalData?.evidence || []).length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">No evidence found</div>
                )}
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <div className="grid gap-4">
                {filterItems(portalData?.policies || []).map(policy => (
                  <div key={policy.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                            {policy.category}
                          </span>
                          <span className="text-xs text-gray-400">v{policy.version}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mt-2">{policy.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{policy.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Effective {new Date(policy.effective_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCommentItem({ type: 'policy', id: policy.id, name: policy.title })}
                      className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Add Comment
                    </button>
                  </div>
                ))}
                {filterItems(portalData?.policies || []).length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">No policies found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {commentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Comment</h3>
              <button
                onClick={() => { setCommentItem(null); setCommentText(''); setCommentSuccess(false); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Commenting on: <span className="font-medium text-gray-900 dark:text-white">{commentItem.name}</span>
            </p>
            {commentSuccess ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 py-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Comment submitted successfully!</span>
              </div>
            ) : (
              <>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Enter your comment or feedback..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => { setCommentItem(null); setCommentText(''); }}
                    className={BUTTONS.ghost}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className={`${BUTTONS.primary} flex items-center gap-2`}
                  >
                    {submittingComment && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Submit Comment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">
            Powered by Forge Cyber Defense - Compliance Management Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
