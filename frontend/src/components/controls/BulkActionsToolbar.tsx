/**
 * ForgeComply 360 - Bulk Actions Toolbar Component
 * Toolbar for bulk operations on controls
 */
import React from 'react';
import { ProgressBar } from '../ProgressBar';

interface StatusOption {
  value: string;
  label: string;
}

interface BulkState {
  mode: boolean;
  selectedControls: Set<string>;
  status: string;
  role: string;
  processing: boolean;
  progress: string;
  current: number;
  total: number;
}

interface BulkActionsToolbarProps {
  bulkState: BulkState;
  statusOptions: StatusOption[];
  onSetStatus: (status: string) => void;
  onSetRole: (role: string) => void;
  onUpdateStatus: () => void;
  onUpdateRole: () => void;
  onGenerateNarratives: () => void;
  onCancel: () => void;
}

export function BulkActionsToolbar({
  bulkState,
  statusOptions,
  onSetStatus,
  onSetRole,
  onUpdateStatus,
  onUpdateRole,
  onGenerateNarratives,
  onCancel,
}: BulkActionsToolbarProps) {
  if (!bulkState.mode || bulkState.selectedControls.size === 0) {
    return null;
  }

  return (
    <div className="bg-forge-navy/5 rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-forge-navy-800">
          {bulkState.selectedControls.size} selected
        </span>
        <div className="h-5 border-l border-gray-200" />

        {/* Status Update */}
        <div className="flex items-center gap-2">
          <select
            value={bulkState.status}
            onChange={(e) => onSetStatus(e.target.value)}
            className="px-2 py-1.5 border border-forge-navy rounded-lg text-xs bg-white"
          >
            <option value="">Set Status...</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={onUpdateStatus}
            disabled={!bulkState.status || bulkState.processing}
            className="px-3 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50"
          >
            Apply
          </button>
        </div>

        <div className="h-5 border-l border-gray-200" />

        {/* Role Assignment */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={bulkState.role}
            onChange={(e) => onSetRole(e.target.value)}
            placeholder="Assign role..."
            className="px-2 py-1.5 border border-forge-navy rounded-lg text-xs w-40 bg-white"
          />
          <button
            onClick={onUpdateRole}
            disabled={!bulkState.role.trim() || bulkState.processing}
            className="px-3 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50"
          >
            Assign
          </button>
        </div>

        <div className="h-5 border-l border-gray-200" />

        {/* AI Narrative Generation */}
        <button
          onClick={onGenerateNarratives}
          disabled={bulkState.processing}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          ForgeML Writers
        </button>

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-600 text-xs font-medium hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      {/* Progress Bar */}
      {bulkState.processing && bulkState.total > 0 && (
        <div className="w-full mt-3">
          <ProgressBar
            current={bulkState.current}
            total={bulkState.total}
            label={bulkState.progress || undefined}
            color="bg-forge-navy-900"
          />
        </div>
      )}
    </div>
  );
}
