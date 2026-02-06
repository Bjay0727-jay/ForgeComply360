import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { BUTTONS, CARDS, BADGES } from '../utils/typography';

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  share_token: string;
  response_count: number;
  avg_score: number;
  created_at: string;
  updated_at: string;
}

export function QuestionnairesPage() {
  const { canManage } = useAuth();
  const { addToast } = useToast();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'draft' | 'archived'>('active');

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      const data = await api('/api/v1/questionnaires');
      setQuestionnaires(data.questionnaires || []);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to load questionnaires' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this questionnaire? All responses will also be deleted.')) return;
    try {
      await api(`/api/v1/questionnaires/${id}`, { method: 'DELETE' });
      addToast({ type: 'success', title: 'Questionnaire deleted' });
      loadQuestionnaires();
    } catch (err: any) {
      addToast({ type: 'error', title: err.message || 'Failed to delete' });
    }
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(`https://forgecomply360.pages.dev/q/${token}`);
    addToast({ type: 'success', title: 'Link copied to clipboard' });
  };

  const toggleStatus = async (q: Questionnaire) => {
    const newStatus = q.status === 'active' ? 'draft' : 'active';
    try {
      await api(`/api/v1/questionnaires/${q.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      addToast({ type: 'success', title: `Questionnaire ${newStatus === 'active' ? 'published' : 'unpublished'}` });
      loadQuestionnaires();
    } catch (err: any) {
      addToast({ type: 'error', title: err.message || 'Failed to update status' });
    }
  };

  const filtered = questionnaires.filter(q =>
    activeTab === 'active' ? q.status === 'active' :
    activeTab === 'draft' ? q.status === 'draft' :
    q.status === 'archived'
  );

  const stats = {
    total: questionnaires.length,
    active: questionnaires.filter(q => q.status === 'active').length,
    totalResponses: questionnaires.reduce((sum, q) => sum + (q.response_count || 0), 0),
    avgScore: questionnaires.length > 0
      ? Math.round(questionnaires.reduce((sum, q) => sum + (q.avg_score || 0), 0) / questionnaires.filter(q => q.avg_score).length) || 0
      : 0,
  };

  const categoryColors: Record<string, string> = {
    vendor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    system: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    security: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    custom: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Questionnaires" subtitle="Create and manage assessment questionnaires" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Questionnaires"
        subtitle="Create and manage assessment questionnaires"
      >
        {canManage && (
          <Link
            to="/questionnaires/new"
            className={BUTTONS.primary}
          >
            Create Questionnaire
          </Link>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${CARDS.base} p-4`}>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Questionnaires</p>
        </div>
        <div className={`${CARDS.base} p-4`}>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Active</p>
        </div>
        <div className={`${CARDS.base} p-4`}>
          <p className="text-2xl font-bold text-blue-600">{stats.totalResponses}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Responses</p>
        </div>
        <div className={`${CARDS.base} p-4`}>
          <p className="text-2xl font-bold text-purple-600">{stats.avgScore}%</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Avg Score</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['active', 'draft', 'archived'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700">
              {questionnaires.filter(q => tab === 'active' ? q.status === 'active' : tab === 'draft' ? q.status === 'draft' : q.status === 'archived').length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className={`text-center py-12 ${CARDS.base}`}>
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No questionnaires</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'active' ? 'No active questionnaires yet.' : `No ${activeTab} questionnaires.`}
          </p>
          {canManage && activeTab === 'active' && (
            <Link to="/questionnaires/new" className={`inline-block mt-4 ${BUTTONS.primary}`}>
              Create Your First Questionnaire
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(q => (
            <div key={q.id} className={`${CARDS.base} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{q.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{q.description || 'No description'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[q.category] || categoryColors.custom}`}>
                  {q.category}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>{q.response_count || 0} responses</span>
                {q.avg_score > 0 && <span>Avg: {Math.round(q.avg_score)}%</span>}
                <span>Updated {new Date(q.updated_at).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {q.status === 'active' && (
                  <button
                    onClick={() => handleCopyLink(q.share_token)}
                    className={`${BUTTONS.secondary} ${BUTTONS.sm}`}
                  >
                    Copy Link
                  </button>
                )}
                <Link
                  to={`/questionnaires/${q.id}/responses`}
                  className={`${BUTTONS.secondary} ${BUTTONS.sm}`}
                >
                  View Responses
                </Link>
                {canManage && (
                  <>
                    <Link
                      to={`/questionnaires/${q.id}/edit`}
                      className={`${BUTTONS.secondary} ${BUTTONS.sm}`}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleStatus(q)}
                      className={`${BUTTONS.secondary} ${BUTTONS.sm}`}
                    >
                      {q.status === 'active' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className={`${BUTTONS.danger} ${BUTTONS.sm}`}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
