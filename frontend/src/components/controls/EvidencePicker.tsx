/**
 * ForgeComply 360 - Evidence Picker Component
 * Allows linking evidence to control implementations
 */
import React from 'react';
import type { Evidence } from '../../types/api';

interface EvidencePickerProps {
  allEvidence: Evidence[];
  linkedEvidence: Evidence[];
  onLink: (evidenceId: string) => void;
  onClose: () => void;
}

export function EvidencePicker({
  allEvidence,
  linkedEvidence,
  onLink,
  onClose,
}: EvidencePickerProps) {
  const availableEvidence = allEvidence.filter(
    ev => !linkedEvidence.some(ce => ce.id === ev.id)
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">
          Select evidence to link:
        </span>
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          Close
        </button>
      </div>

      {availableEvidence.length === 0 ? (
        <p className="text-xs text-gray-400">
          No evidence available. Upload evidence first.
        </p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {availableEvidence.map((ev) => (
            <button
              key={ev.id}
              onClick={() => onLink(ev.id)}
              className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-forge-navy/5 text-xs border border-transparent hover:border-gray-200"
            >
              <svg
                className="w-3 h-3 text-gray-400"
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
              <span className="text-gray-700 truncate">
                {ev.title || ev.file_name}
              </span>
              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {formatSize(ev.file_size || 0)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
