/**
 * ForgeComply 360 - Inherit Controls Modal Component
 * Modal for inheriting controls from another system
 */
import React from 'react';
import { MODALS, TYPOGRAPHY, FORMS, BUTTONS, BADGES } from '../../utils/typography';
import type { System } from '../../types/api';

interface InheritResult {
  inherited_count: number;
  skipped_count: number;
  source_name: string;
}

interface InheritModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInherit: () => void;
  inheriting: boolean;
  systems: System[];
  selectedSystem: string;
  inheritSource: string;
  onSourceChange: (value: string) => void;
  inheritResult: InheritResult | null;
}

export function InheritModal({
  isOpen,
  onClose,
  onInherit,
  inheriting,
  systems,
  selectedSystem,
  inheritSource,
  onSourceChange,
  inheritResult,
}: InheritModalProps) {
  if (!isOpen) return null;

  const targetSystem = systems.find((s) => s.id === selectedSystem);
  const availableSources = systems.filter((s) => s.id !== selectedSystem);

  return (
    <div className={MODALS.backdrop}>
      <div
        className={MODALS.container}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inherit-controls-modal-title"
      >
        <div className={MODALS.header}>
          <h3 id="inherit-controls-modal-title" className={TYPOGRAPHY.modalTitle}>
            Inherit Controls
          </h3>
        </div>

        <div className={MODALS.body}>
          <p className={`${TYPOGRAPHY.bodyMuted} mb-4`}>
            Copy implemented controls from another system into{' '}
            <strong>{targetSystem?.name || 'this system'}</strong>. Controls
            already implemented natively will be skipped.
          </p>

          <label className={FORMS.label}>Source System</label>
          <select
            value={inheritSource}
            onChange={(e) => onSourceChange(e.target.value)}
            className={`${FORMS.select} mb-4`}
          >
            <option value="">Select a source system...</option>
            {availableSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {inheritResult && (
            <div
              className={`mb-4 p-3 rounded-lg border ${BADGES.success} border-green-200`}
            >
              <p className="text-sm font-medium">
                Inherited {inheritResult.inherited_count} control(s) from{' '}
                {inheritResult.source_name}
              </p>
              {inheritResult.skipped_count > 0 && (
                <p className="text-xs mt-0.5 opacity-80">
                  {inheritResult.skipped_count} control(s) skipped (already
                  implemented)
                </p>
              )}
            </div>
          )}
        </div>

        <div className={MODALS.footer}>
          <button onClick={onClose} className={BUTTONS.secondary}>
            {inheritResult ? 'Close' : 'Cancel'}
          </button>
          {!inheritResult && (
            <button
              onClick={onInherit}
              disabled={!inheritSource || inheriting}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {inheriting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Inheriting...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Inherit Controls
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
