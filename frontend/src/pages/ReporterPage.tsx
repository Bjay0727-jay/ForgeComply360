/**
 * ForgeComply 360 - Forge Reporter Launch Page
 *
 * This page serves as the entry point to the standalone Forge Reporter
 * for FISMA/FedRAMP SSP creation and editing.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { BUTTONS } from '../utils/typography';

interface SSPDocument {
  id: string;
  title: string;
  system_name: string;
  ssp_type: 'standard' | 'fisma';
  status: string;
  updated_at: string;
  completion_percentage?: number;
}

const REPORTER_URL = import.meta.env.VITE_REPORTER_URL || 'https://reporter-forgecomply360.pages.dev';

export function ReporterPage() {
  const { org } = useAuth();
  const [documents, setDocuments] = useState<SSPDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api<{ documents: SSPDocument[] }>('/api/v1/ssp');
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load SSP documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReporter = async (sspId?: string) => {
    try {
      // Get a scoped token for the Reporter
      const tokenRes = await api<{ token: string; reporter_url: string }>('/api/v1/auth/reporter-token', {
        method: 'POST',
        body: JSON.stringify({ ssp_id: sspId }),
      });

      // Open Reporter in new tab using the URL from the API (includes all params)
      if (tokenRes.reporter_url) {
        window.open(tokenRes.reporter_url, '_blank');
      } else {
        // Fallback: Build the Reporter URL with auth params
        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
        const params = new URLSearchParams();
        params.set('token', tokenRes.token);
        params.set('api', apiUrl);
        if (sspId) {
          params.set('ssp', sspId);
        }
        window.open(`${REPORTER_URL}#${params.toString()}`, '_blank');
      }
    } catch (err) {
      console.error('Failed to open Reporter:', err);
      alert('Failed to launch Forge Reporter. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      in_review: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      published: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forge Reporter"
        subtitle="Advanced FISMA/FedRAMP SSP Builder with AI-assisted narrative generation"
      >
        <button
          onClick={() => handleOpenReporter()}
          className={`${BUTTONS.lg} ${BUTTONS.primary} flex items-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New SSP
        </button>
      </PageHeader>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-5">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">21 NIST Sections</h3>
          <p className="text-sm text-gray-600">Complete FISMA/FedRAMP SSP template covering all required sections per NIST SP 800-18</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">ForgeML AI</h3>
          <p className="text-sm text-gray-600">AI-powered narrative generation for control implementations and system descriptions</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-5">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">OSCAL Export</h3>
          <p className="text-sm text-gray-600">Export to NIST OSCAL JSON format for eMASS, FedRAMP, and automated processing</p>
        </div>
      </div>

      {/* Existing SSP Documents */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Your SSP Documents</h2>
          <span className="text-sm text-gray-500">{documents.length} documents</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No SSP documents yet</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first System Security Plan using Forge Reporter</p>
            <button
              onClick={() => handleOpenReporter()}
              className={`${BUTTONS.sm} ${BUTTONS.primary}`}
            >
              Create SSP
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900 truncate">{doc.title || doc.system_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(doc.status)}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                    {doc.ssp_type === 'fisma' && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                        FISMA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-500">{doc.system_name}</span>
                    <span className="text-xs text-gray-400">
                      Updated {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                    {doc.completion_percentage !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              doc.completion_percentage === 100 ? 'bg-green-500' :
                              doc.completion_percentage > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${doc.completion_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{doc.completion_percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleOpenReporter(doc.id)}
                    className={`${BUTTONS.sm} ${BUTTONS.primary} flex items-center gap-1`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Reporter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Getting Started with Forge Reporter</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Click "Create New SSP" or open an existing document</li>
              <li>2. Fill out each section using the guided wizard interface</li>
              <li>3. Use ForgeML AI to generate narratives for control implementations</li>
              <li>4. Export to PDF for stakeholders or OSCAL JSON for eMASS/FedRAMP</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
