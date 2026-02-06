import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';

interface QuestionnaireResponse {
  id: string;
  respondent_name: string;
  respondent_email: string;
  organization: string;
  score: number;
  passed: boolean;
  submitted_at: string;
  answers: { question_id: string; question_text: string; answer: string; score: number; max_score: number }[];
}

interface Questionnaire {
  id: string;
  title: string;
  passing_score: number;
  total_responses: number;
  average_score: number;
}

export function QuestionnaireResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isFederal } = useExperience();
  const { addToast } = useToast();

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [scoreMin, setScoreMin] = useState('');
  const [scoreMax, setScoreMax] = useState('');
  const [passFilter, setPassFilter] = useState<'all' | 'pass' | 'fail'>('all');

  // AI Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api<{ questionnaire: Questionnaire }>(`/api/v1/questionnaires/${id}`),
      api<{ responses: QuestionnaireResponse[] }>(`/api/v1/questionnaires/${id}/responses`),
    ])
      .then(([qData, rData]) => {
        setQuestionnaire(qData.questionnaire);
        setResponses(rData.responses || []);
      })
      .catch(() => addToast({ type: 'error', title: 'Failed to load responses' }))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  const filteredResponses = responses.filter((r) => {
    if (dateFrom && new Date(r.submitted_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.submitted_at) > new Date(dateTo + 'T23:59:59')) return false;
    if (scoreMin && r.score < Number(scoreMin)) return false;
    if (scoreMax && r.score > Number(scoreMax)) return false;
    if (passFilter === 'pass' && !r.passed) return false;
    if (passFilter === 'fail' && r.passed) return false;
    return true;
  });

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const data = await api<{ analysis: string }>(`/api/v1/questionnaires/${id}/analyze`, { method: 'POST' });
      setAnalysisResult(data.analysis);
      setShowAnalysisModal(true);
    } catch {
      addToast({ type: 'error', title: 'Analysis failed' });
    }
    setAnalyzing(false);
  };

  const exportCSV = () => {
    const headers = ['Respondent', 'Email', 'Organization', 'Score', 'Pass/Fail', 'Submitted'];
    const rows = filteredResponses.map((r) => [r.respondent_name, r.respondent_email, r.organization, r.score, r.passed ? 'Pass' : 'Fail', r.submitted_at]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `questionnaire-responses-${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (!questionnaire) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Questionnaire not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={questionnaire.title} subtitle={`${questionnaire.total_responses} responses | Avg score: ${questionnaire.average_score?.toFixed(1) ?? 'N/A'}%`}>
        <button onClick={handleAnalyze} disabled={analyzing} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5">
          {analyzing ? 'Analyzing...' : 'AI Analyze'}
        </button>
        <button onClick={exportCSV} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90">Export CSV</button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="From" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="To" />
        <input type="number" value={scoreMin} onChange={(e) => setScoreMin(e.target.value)} placeholder="Min Score" className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm w-28 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        <input type="number" value={scoreMax} onChange={(e) => setScoreMax(e.target.value)} placeholder="Max Score" className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm w-28 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        <select value={passFilter} onChange={(e) => setPassFilter(e.target.value as 'all' | 'pass' | 'fail')} className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option value="all">All Results</option>
          <option value="pass">Pass Only</option>
          <option value="fail">Fail Only</option>
        </select>
      </div>

      {/* Response List */}
      <div className="space-y-3">
        {filteredResponses.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 text-gray-500 dark:text-gray-400">No responses match your filters</div>
        ) : (
          filteredResponses.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{r.respondent_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{r.respondent_email} | {r.organization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{r.score}%</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.passed ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                    {r.passed ? 'Pass' : 'Fail'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(r.submitted_at).toLocaleDateString()}</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === r.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {expandedId === r.id && (
                <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Score Breakdown</h4>
                  <div className="space-y-2">
                    {r.answers.map((a, i) => (
                      <div key={i} className="flex justify-between items-start text-sm">
                        <p className="text-gray-600 dark:text-gray-400 flex-1">{a.question_text}</p>
                        <span className="ml-4 font-medium text-gray-900 dark:text-white">{a.score}/{a.max_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* AI Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAnalysisModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Analysis</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300">{analysisResult}</div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowAnalysisModal(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
