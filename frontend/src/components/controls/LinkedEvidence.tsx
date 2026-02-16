/**
 * ForgeComply 360 - Linked Evidence Component
 * Displays evidence linked to a control implementation
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api, getAccessToken } from '../../utils/api';
import { EvidencePicker } from './EvidencePicker';
import type { Evidence, Implementation } from '../../types/api';

interface LinkedEvidenceProps {
  implementation?: Implementation;
  canEdit: boolean;
}

export function LinkedEvidence({ implementation, canEdit }: LinkedEvidenceProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [allEvidence, setAllEvidence] = useState<Evidence[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const loadEvidence = useCallback(async () => {
    if (!implementation?.id) {
      setEvidence([]);
      return;
    }
    setLoading(true);
    try {
      const d = await api(`/api/v1/implementations/${implementation.id}/evidence`);
      setEvidence(d.evidence || []);
    } catch {
      setEvidence([]);
    } finally {
      setLoading(false);
    }
  }, [implementation?.id]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const handleOpenPicker = async () => {
    setShowPicker(true);
    try {
      const d = await api('/api/v1/evidence');
      setAllEvidence(d.evidence || []);
    } catch {
      setAllEvidence([]);
    }
  };

  const linkEvidence = async (evidenceId: string) => {
    if (!implementation?.id) return;
    try {
      await api('/api/v1/evidence/link', {
        method: 'POST',
        body: JSON.stringify({
          evidence_id: evidenceId,
          implementation_id: implementation.id,
        }),
      });
      await loadEvidence();
      setShowPicker(false);
    } catch {
      // Silent fail
    }
  };

  const downloadEvidence = async (ev: Evidence) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/evidence/${ev.id}/download`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ev.file_name || 'evidence';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="mt-5 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Linked Evidence ({evidence.length})
        </h4>

        {canEdit && implementation?.id && (
          <button
            onClick={handleOpenPicker}
            className="text-xs px-3 py-1.5 rounded-lg bg-forge-navy/5 text-forge-navy border border-gray-200 hover:bg-forge-navy/10 font-medium flex items-center gap-1"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Link Evidence
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : evidence.length > 0 ? (
        <div className="space-y-1.5">
          {evidence.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-forge-navy/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-4 h-4 text-forge-navy flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-gray-700 truncate">
                  {ev.title || ev.file_name}
                </span>
                <span className="text-xs text-gray-400">
                  {formatSize(ev.file_size || 0)}
                </span>
              </div>
              <button
                onClick={() => downloadEvidence(ev)}
                className="text-xs text-forge-navy hover:text-forge-navy-900 font-medium flex-shrink-0"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">
          No evidence linked to this control yet.
        </p>
      )}

      {showPicker && (
        <EvidencePicker
          allEvidence={allEvidence}
          linkedEvidence={evidence}
          onLink={linkEvidence}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
