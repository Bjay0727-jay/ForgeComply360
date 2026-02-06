import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  type: 'select' | 'search' | 'toggle';
  key: string;
  label: string;
  options?: FilterOption[];
}

interface FilterBarProps {
  filters: FilterField[];
  values: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
  onClear: () => void;
  resultCount?: number;
  resultLabel?: string;
  actions?: React.ReactNode;
}

export function FilterBar({ filters, values, onChange, onClear, resultCount, resultLabel, actions }: FilterBarProps) {
  const hasActiveFilters = filters.some(f => {
    const val = values[f.key];
    if (f.type === 'toggle') return val === true;
    return typeof val === 'string' && val !== '';
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {filters.map(filter => {
          if (filter.type === 'search') {
            return (
              <div key={filter.key} className="relative w-full sm:w-auto sm:min-w-[200px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={(values[filter.key] as string) || ''}
                  onChange={e => onChange(filter.key, e.target.value)}
                  placeholder={filter.label}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm min-h-[44px] focus:ring-2 focus:ring-forge-navy focus:border-forge-navy dark:bg-gray-700 dark:text-white"
                />
              </div>
            );
          }

          if (filter.type === 'toggle') {
            return (
              <label
                key={filter.key}
                className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px] select-none"
              >
                <input
                  type="checkbox"
                  checked={!!values[filter.key]}
                  onChange={e => onChange(filter.key, e.target.checked)}
                  className="w-4 h-4 text-forge-navy border-gray-300 rounded focus:ring-forge-navy"
                />
                <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{filter.label}</span>
              </label>
            );
          }

          // select type
          return (
            <select
              key={filter.key}
              value={(values[filter.key] as string) || ''}
              onChange={e => onChange(filter.key, e.target.value)}
              className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm min-h-[44px] w-full sm:w-auto focus:ring-2 focus:ring-forge-navy focus:border-forge-navy dark:bg-gray-700 dark:text-white"
            >
              <option value="">{filter.label}</option>
              {filter.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          );
        })}

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium min-h-[44px] whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}

        {actions && (
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {resultCount !== undefined && (
        <div className="mt-2.5 pt-2.5 border-t border-gray-100">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{resultCount}</span> {resultLabel || 'results'}
          </p>
        </div>
      )}
    </div>
  );
}

export type { FilterField, FilterOption };
