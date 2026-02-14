/**
 * ForgeComply 360 - Baseline Modal Component
 * Modal for applying framework baseline descriptions to controls
 */
import React from 'react';
import { MODALS, TYPOGRAPHY, FORMS, BUTTONS } from '../../utils/typography';
import type { Framework, System } from '../../types/api';

interface BaselineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  applying: boolean;
  overwrite: boolean;
  onOverwriteChange: (value: boolean) => void;
  framework?: Framework;
  system?: System;
}

export function BaselineModal({
  isOpen,
  onClose,
  onApply,
  applying,
  overwrite,
  onOverwriteChange,
  framework,
  system,
}: BaselineModalProps) {
  if (!isOpen) return null;

  return (
    <div className={MODALS.backdrop} onClick={onClose}>
      <div className={MODALS.container} onClick={(e) => e.stopPropagation()}>
        <div className={MODALS.header}>
          <h3 className={TYPOGRAPHY.modalTitle}>Apply Framework Baseline</h3>
        </div>

        <div className={MODALS.body}>
          <p className={`${TYPOGRAPHY.bodyMuted} mb-4`}>
            This will populate implementation descriptions and responsible roles
            with industry-standard baseline text for all controls in the selected
            framework.
          </p>

          <div className="bg-forge-navy/5 rounded-lg p-3 mb-4">
            <p className="text-xs text-forge-navy-700 font-medium">
              Framework: {framework?.name || 'Not selected'}
            </p>
            <p className="text-xs text-forge-navy">
              System: {system?.name || 'Not selected'}
            </p>
          </div>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => onOverwriteChange(e.target.checked)}
              className={FORMS.checkbox}
            />
            <span className={TYPOGRAPHY.body}>
              Overwrite existing descriptions
            </span>
          </label>

          <p
            className={`${TYPOGRAPHY.bodySmallMuted} ${
              overwrite ? 'text-amber-600' : ''
            }`}
          >
            {overwrite
              ? 'Warning: This will replace ALL existing implementation descriptions.'
              : 'Only empty fields will be populated. Existing descriptions will be preserved.'}
          </p>
        </div>

        <div className={MODALS.footer}>
          <button onClick={onClose} className={BUTTONS.secondary}>
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={applying}
            className={`${BUTTONS.primary} flex items-center gap-2`}
          >
            {applying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              'Apply Baseline'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
