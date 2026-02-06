import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SSPDocument {
  id: string;
  system_name: string;
  framework_name: string;
  status: string;
  completion: number;
}

interface SectionDocument {
  doc_id: string;
  system_name: string;
  content: string;
  full_length: number;
  word_count: number;
  status: string;
  ai_generated: boolean;
  last_edited_at: string | null;
}

interface ComparisonSection {
  key: string;
  label: string;
  consistency: 'complete' | 'partial' | 'none';
  documents: SectionDocument[];
}

interface ComparisonSummary {
  total_sections: number;
  complete: number;
  partial: number;
  missing: number;
}

interface ComparisonResponse {
  documents: SSPDocument[];
  sections: ComparisonSection[];
  summary: ComparisonSummary;
}

interface SSPListItem {
  id: string;
  system_name: string;
  framework_name: string;
  status: string;
  completion: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE_COLORS: Record<string, string> = {
  empty: 'bg-gray-100 text-gray-500',
  draft: 'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  in_review: 'bg-blue-100 text-blue-700',
  published: 'bg-emerald-100 text-emerald-800',
};

const CONSISTENCY_BORDER: Record<string, string> = {
  complete: 'border-green-400',
  partial: 'border-yellow-400',
  none: 'border-red-400',
};

const CONSISTENCY_DOT: Record<string, string> = {
  complete: 'bg-green-500',
  partial: 'bg-yellow-500',
  none: 'bg-red-500',
};

const SSP_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-gray-100 text-gray-500',
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function SSPComparisonPage() {
  const { t } = useExperience();
  const { canEdit } = useAuth();

  const [sspDocuments, setSSPDocuments] = useState<SSPListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  // Fetch SSP list on mount
  useEffect(() => {
    api<{ documents: SSPListItem[] }>('/api/v1/ssp')
      .then((d) => setSSPDocuments(d.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Run comparison
  const handleCompare = () => {
    if (selectedIds.length < 2) return;
    setComparing(true);
    setComparisonData(null);
    setActiveSection('');

    api<ComparisonResponse>(`/api/v1/ssp/compare?ssp_ids=${selectedIds.join(',')}`)
      .then((data) => {
        setComparisonData(data);
        if (data.sections?.length > 0) {
          setActiveSection(data.sections[0].key);
        }
      })
      .catch(() => {})
      .finally(() => setComparing(false));
  };

  // Toggle SSP selection (limit 2-4)
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state: fewer than 2 SSPs available
  if (sspDocuments.length < 2) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          title="SSP Comparison"
          subtitle="Compare sections across multiple System Security Plans side-by-side"
        />
        <EmptyState
          icon="M4 6h4v12H4V6zm6 0h4v12h-4V6zm6 0h4v12h-4V6z"
          title="Multiple SSP Documents Required"
          subtitle={`At least two ${t('system').toLowerCase()} security plans are needed for comparison. Create additional SSPs to use this feature.`}
        />
      </div>
    );
  }

  const currentSection = comparisonData?.sections.find((s) => s.key === activeSection) || null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="SSP Comparison"
        subtitle="Compare sections across multiple System Security Plans side-by-side"
      />

      {/* SSP Selection Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select SSP Documents</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Choose 2 to 4 documents to compare ({selectedIds.length} selected)
            </p>
          </div>
          <button
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || comparing}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {comparing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm6 0h4v12h-4V6zm6 0h4v12h-4V6z" />
                </svg>
                Compare Selected
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sspDocuments.map((doc) => {
            const isSelected = selectedIds.includes(doc.id);
            const isDisabled = !isSelected && selectedIds.length >= 4;

            return (
              <label
                key={doc.id}
                className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggleSelection(doc.id)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {doc.system_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doc.framework_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${SSP_STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                      {doc.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{doc.completion}%</span>
                  </div>
                  {/* Completion bar */}
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        doc.completion >= 80 ? 'bg-green-500' : doc.completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(doc.completion, 2)}%` }}
                    />
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Comparison Results */}
      {comparisonData && (
        <>
          {/* Summary Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Sections</p>
              <p className="text-3xl font-bold text-blue-600">{comparisonData.summary.total_sections}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Complete</p>
              <p className="text-3xl font-bold text-green-600">{comparisonData.summary.complete}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Partial</p>
              <p className="text-3xl font-bold text-yellow-600">{comparisonData.summary.partial}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Missing</p>
              <p className="text-3xl font-bold text-red-600">{comparisonData.summary.missing}</p>
            </div>
          </div>

          {/* Section Sidebar + Main Comparison */}
          <div className="flex gap-6">
            {/* Left Sidebar */}
            <div className="w-72 shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sections</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {comparisonData.sections.map((section) => (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        activeSection === section.key
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium truncate ${
                            activeSection === section.key
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {section.label}
                        </span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ml-2 ${CONSISTENCY_DOT[section.consistency]}`}
                        />
                      </div>
                      {/* Per-document status dots */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {section.documents.map((doc) => (
                          <div
                            key={doc.doc_id}
                            title={`${doc.system_name}: ${doc.status}`}
                            className={`w-2 h-2 rounded-full ${
                              doc.status === 'approved'
                                ? 'bg-green-500'
                                : doc.status === 'reviewed'
                                ? 'bg-blue-500'
                                : doc.status === 'draft'
                                ? 'bg-yellow-400'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Comparison Area */}
            <div className="flex-1 min-w-0">
              {currentSection ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {currentSection.label}
                    </h2>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        currentSection.consistency === 'complete'
                          ? 'bg-green-100 text-green-700'
                          : currentSection.consistency === 'partial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {currentSection.consistency === 'complete'
                        ? 'All Complete'
                        : currentSection.consistency === 'partial'
                        ? 'Partially Complete'
                        : 'Missing'}
                    </span>
                  </div>

                  <div className={`grid gap-4 ${
                    currentSection.documents.length === 2
                      ? 'grid-cols-1 lg:grid-cols-2'
                      : currentSection.documents.length === 3
                      ? 'grid-cols-1 lg:grid-cols-3'
                      : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
                  }`}>
                    {currentSection.documents.map((doc) => (
                      <div
                        key={doc.doc_id}
                        className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${CONSISTENCY_BORDER[currentSection.consistency]} p-5 flex flex-col`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {doc.system_name}
                          </h3>
                        </div>

                        {/* Meta badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              STATUS_BADGE_COLORS[doc.status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {doc.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.word_count.toLocaleString()} words
                          </span>
                          {doc.ai_generated && (
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              AI Generated
                            </span>
                          )}
                        </div>

                        {/* Last edited */}
                        {doc.last_edited_at && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                            Last edited: {new Date(doc.last_edited_at).toLocaleDateString()}
                          </p>
                        )}

                        {/* Content preview */}
                        <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 overflow-y-auto max-h-64">
                          {doc.content ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {doc.content}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                              No content for this section.
                            </p>
                          )}
                        </div>

                        {/* Full length indicator */}
                        {doc.full_length > doc.content.length && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Showing preview ({doc.content.length.toLocaleString()} of{' '}
                            {doc.full_length.toLocaleString()} characters)
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                  <p className="text-sm">Select a section from the sidebar to view the comparison.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Comparing spinner overlay */}
      {comparing && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing SSP documents...</p>
          </div>
        </div>
      )}
    </div>
  );
}
