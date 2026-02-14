/**
 * ForgeComply 360 - Inheritance Hook for Controls
 * Extracts inheritance functionality from ControlsPage
 */
import { useState, useCallback } from 'react';
import { api } from '../utils/api';
import { useToast } from '../components/Toast';
import type { InheritanceMap, Implementation } from '../types/api';

interface UseControlsInheritanceProps {
  selectedSystem: string;
  selectedFw: string;
  onImplementationsUpdate: () => void;
}

interface InheritResult {
  inherited_count: number;
  skipped_count: number;
  source_name: string;
}

export function useControlsInheritance({
  selectedSystem,
  selectedFw,
  onImplementationsUpdate,
}: UseControlsInheritanceProps) {
  const { addToast } = useToast();

  // Inheritance map state
  const [showInheritanceMap, setShowInheritanceMap] = useState(false);
  const [inheritanceData, setInheritanceData] = useState<InheritanceMap | null>(null);
  const [loadingInheritance, setLoadingInheritance] = useState(false);

  // Inherit modal state
  const [showInheritModal, setShowInheritModal] = useState(false);
  const [inheritSource, setInheritSource] = useState('');
  const [inheriting, setInheriting] = useState(false);
  const [inheritResult, setInheritResult] = useState<InheritResult | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);

  const loadInheritanceMap = useCallback(async () => {
    setLoadingInheritance(true);
    try {
      const params = selectedFw ? `?framework_id=${selectedFw}` : '';
      const data = await api(`/api/v1/implementations/inheritance-map${params}`);
      setInheritanceData(data);
      setShowInheritanceMap(true);
    } catch {
      // Silent fail
    } finally {
      setLoadingInheritance(false);
    }
  }, [selectedFw]);

  const openInheritModal = useCallback(() => {
    setShowInheritModal(true);
    setInheritSource('');
    setInheritResult(null);
  }, []);

  const closeInheritModal = useCallback(() => {
    setShowInheritModal(false);
  }, []);

  const handleInherit = useCallback(async () => {
    if (!inheritSource || !selectedSystem || !selectedFw) return;

    setInheriting(true);
    setInheritResult(null);

    try {
      const result = await api('/api/v1/implementations/inherit', {
        method: 'POST',
        body: JSON.stringify({
          source_system_id: inheritSource,
          target_system_id: selectedSystem,
          framework_id: selectedFw,
        }),
      });

      setInheritResult({
        inherited_count: result.inherited_count,
        skipped_count: result.skipped_count,
        source_name: result.source_name,
      });

      onImplementationsUpdate();
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Inherit Failed',
        message: e.message || 'Failed to inherit controls',
      });
    } finally {
      setInheriting(false);
    }
  }, [inheritSource, selectedSystem, selectedFw, onImplementationsUpdate, addToast]);

  const handleSyncInherited = useCallback(async () => {
    if (!selectedSystem || !selectedFw) return;

    setSyncing(true);
    try {
      const result = await api('/api/v1/implementations/sync-inherited', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem,
          framework_id: selectedFw,
        }),
      });

      addToast({
        type: 'success',
        title: 'Controls Synced',
        message: `Synced ${result.synced_count} inherited control(s) from source.`,
      });

      onImplementationsUpdate();
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: e.message || 'Failed to sync inherited controls',
      });
    } finally {
      setSyncing(false);
    }
  }, [selectedSystem, selectedFw, onImplementationsUpdate, addToast]);

  const syncSingleControl = useCallback(async () => {
    if (!selectedSystem || !selectedFw) return;

    try {
      await api('/api/v1/implementations/sync-inherited', {
        method: 'POST',
        body: JSON.stringify({
          system_id: selectedSystem,
          framework_id: selectedFw,
        }),
      });
      onImplementationsUpdate();
    } catch {
      // Silent fail
    }
  }, [selectedSystem, selectedFw, onImplementationsUpdate]);

  return {
    // Inheritance map
    showInheritanceMap,
    setShowInheritanceMap,
    inheritanceData,
    loadingInheritance,
    loadInheritanceMap,

    // Inherit modal
    showInheritModal,
    inheritSource,
    setInheritSource,
    inheriting,
    inheritResult,
    openInheritModal,
    closeInheritModal,
    handleInherit,

    // Sync
    syncing,
    handleSyncInherited,
    syncSingleControl,
  };
}
