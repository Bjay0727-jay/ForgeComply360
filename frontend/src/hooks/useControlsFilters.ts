/**
 * ForgeComply 360 - Saved Filters Hook for Controls
 * Extracts filter view management from ControlsPage
 */
import { useState, useCallback } from 'react';

export interface SavedFilter {
  id: string;
  name: string;
  statusFilter: string;
  inheritFilter: '' | 'inherited' | 'native';
  search: string;
}

const STORAGE_KEY = 'fc360_control_filters';

interface UseControlsFiltersReturn {
  // Current filters
  statusFilter: string;
  inheritFilter: '' | 'inherited' | 'native';
  search: string;

  // Filter setters
  setStatusFilter: (value: string) => void;
  setInheritFilter: (value: '' | 'inherited' | 'native') => void;
  setSearch: (value: string) => void;
  clearFilters: () => void;

  // Saved filters
  savedFilters: SavedFilter[];
  showSaveFilter: boolean;
  filterName: string;
  setShowSaveFilter: (show: boolean) => void;
  setFilterName: (name: string) => void;
  saveCurrentFilter: () => void;
  loadFilter: (filter: SavedFilter) => void;
  deleteFilter: (id: string) => void;

  // Helpers
  hasActiveFilters: boolean;
}

export function useControlsFilters(): UseControlsFiltersReturn {
  // Current filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [inheritFilter, setInheritFilter] = useState<'' | 'inherited' | 'native'>('');
  const [search, setSearch] = useState('');

  // Saved filters state
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');

  const clearFilters = useCallback(() => {
    setStatusFilter('');
    setInheritFilter('');
  }, []);

  const saveCurrentFilter = useCallback(() => {
    if (!filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(36),
      name: filterName.trim(),
      statusFilter,
      inheritFilter,
      search,
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setFilterName('');
    setShowSaveFilter(false);
  }, [filterName, statusFilter, inheritFilter, search, savedFilters]);

  const loadFilter = useCallback((f: SavedFilter) => {
    setStatusFilter(f.statusFilter);
    setInheritFilter(f.inheritFilter);
    setSearch(f.search);
  }, []);

  const deleteFilter = useCallback((id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [savedFilters]);

  const hasActiveFilters = !!(statusFilter || inheritFilter);

  return {
    statusFilter,
    inheritFilter,
    search,
    setStatusFilter,
    setInheritFilter,
    setSearch,
    clearFilters,
    savedFilters,
    showSaveFilter,
    filterName,
    setShowSaveFilter,
    setFilterName,
    saveCurrentFilter,
    loadFilter,
    deleteFilter,
    hasActiveFilters,
  };
}
