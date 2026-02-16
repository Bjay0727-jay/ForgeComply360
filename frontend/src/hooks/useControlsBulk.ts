/**
 * ForgeComply 360 - Bulk Operations Hook for Controls
 * Extracts bulk edit functionality from ControlsPage
 */
import { useState } from 'react';
import { api } from '../utils/api';
import type { Implementation } from '../types/api';

interface UseBulkOperationsProps {
  selectedSystem: string;
  selectedFw: string;
  onImplementationsUpdate: (implementations: Record<string, Implementation>) => void;
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

export function useControlsBulk({ selectedSystem, selectedFw, onImplementationsUpdate }: UseBulkOperationsProps) {
  const [bulkState, setBulkState] = useState<BulkState>({
    mode: false,
    selectedControls: new Set(),
    status: '',
    role: '',
    processing: false,
    progress: '',
    current: 0,
    total: 0,
  });

  const toggleBulkMode = () => {
    setBulkState(prev => ({
      ...prev,
      mode: !prev.mode,
      selectedControls: new Set(),
    }));
  };

  const toggleSelectControl = (controlId: string) => {
    setBulkState(prev => {
      const next = new Set(prev.selectedControls);
      if (next.has(controlId)) next.delete(controlId);
      else next.add(controlId);
      return { ...prev, selectedControls: next };
    });
  };

  const selectAllOnPage = (controlIds: string[]) => {
    setBulkState(prev => {
      if (prev.selectedControls.size === controlIds.length) {
        return { ...prev, selectedControls: new Set() };
      }
      return { ...prev, selectedControls: new Set(controlIds) };
    });
  };

  const setBulkStatus = (status: string) => {
    setBulkState(prev => ({ ...prev, status }));
  };

  const setBulkRole = (role: string) => {
    setBulkState(prev => ({ ...prev, role }));
  };

  const clearBulkSelection = () => {
    setBulkState(prev => ({
      ...prev,
      mode: false,
      selectedControls: new Set(),
      status: '',
      role: '',
    }));
  };

  const refreshImplementations = async () => {
    const d = await api(`/api/v1/implementations?system_id=${selectedSystem}&framework_id=${selectedFw}`);
    const map: Record<string, Implementation> = {};
    d.implementations.forEach((impl: Implementation) => { map[impl.control_id] = impl; });
    onImplementationsUpdate(map);
  };

  const handleBulkUpdateStatus = async () => {
    if (!bulkState.status || bulkState.selectedControls.size === 0 || !selectedSystem || !selectedFw) return;

    setBulkState(prev => ({
      ...prev,
      processing: true,
      total: prev.selectedControls.size,
      current: 0,
      progress: 'Updating status...',
    }));

    try {
      await api('/api/v1/implementations/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem,
          framework_id: selectedFw,
          control_ids: [...bulkState.selectedControls],
          status: bulkState.status,
        }),
      });

      setBulkState(prev => ({ ...prev, current: prev.selectedControls.size }));
      await refreshImplementations();

      setBulkState(prev => ({
        ...prev,
        status: '',
        progress: '',
        current: 0,
        total: 0,
      }));
    } finally {
      setBulkState(prev => ({ ...prev, processing: false }));
    }
  };

  const handleBulkUpdateRole = async () => {
    if (!bulkState.role.trim() || bulkState.selectedControls.size === 0 || !selectedSystem || !selectedFw) return;

    setBulkState(prev => ({
      ...prev,
      processing: true,
      total: prev.selectedControls.size,
      current: 0,
      progress: 'Assigning role...',
    }));

    try {
      await api('/api/v1/implementations/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem,
          framework_id: selectedFw,
          control_ids: [...bulkState.selectedControls],
          responsible_role: bulkState.role,
        }),
      });

      setBulkState(prev => ({ ...prev, current: prev.selectedControls.size }));
      await refreshImplementations();

      setBulkState(prev => ({
        ...prev,
        role: '',
        progress: '',
        current: 0,
        total: 0,
      }));
    } finally {
      setBulkState(prev => ({ ...prev, processing: false }));
    }
  };

  const handleBulkAINarrative = async () => {
    if (bulkState.selectedControls.size === 0 || !selectedSystem || !selectedFw) return;

    const ids = [...bulkState.selectedControls];
    const batchSize = 20;

    setBulkState(prev => ({
      ...prev,
      processing: true,
      total: ids.length,
      current: 0,
    }));

    try {
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        setBulkState(prev => ({
          ...prev,
          progress: `Generating AI narratives ${i + 1}-${Math.min(i + batchSize, ids.length)} of ${ids.length}...`,
        }));

        await api('/api/v1/ai/narrative/bulk', {
          method: 'POST',
          body: JSON.stringify({
            system_id: selectedSystem,
            framework_id: selectedFw,
            control_ids: batch,
          }),
        });

        setBulkState(prev => ({
          ...prev,
          current: Math.min(i + batchSize, ids.length),
        }));
      }

      await refreshImplementations();

      setBulkState(prev => ({
        ...prev,
        progress: '',
        current: 0,
        total: 0,
      }));
    } finally {
      setBulkState(prev => ({ ...prev, processing: false }));
    }
  };

  return {
    bulkState,
    toggleBulkMode,
    toggleSelectControl,
    selectAllOnPage,
    setBulkStatus,
    setBulkRole,
    clearBulkSelection,
    handleBulkUpdateStatus,
    handleBulkUpdateRole,
    handleBulkAINarrative,
  };
}
