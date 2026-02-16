import React from 'react';

// Inline SVG icons
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  width?: string;
  required?: boolean;
}

export interface DynamicTableProps {
  columns: TableColumn[];
  rows: Record<string, any>[];
  onAddRow: () => void;
  onDeleteRow: (index: number) => void;
  onUpdateCell: (rowIndex: number, columnKey: string, value: any) => void;
  addLabel?: string;
  emptyMessage?: string;
  readOnly?: boolean;
  compact?: boolean;
}

export function DynamicTable({
  columns,
  rows,
  onAddRow,
  onDeleteRow,
  onUpdateCell,
  addLabel = 'Add Row',
  emptyMessage = 'No items added yet',
  readOnly = false,
  compact = false,
}: DynamicTableProps) {
  const cellPadding = compact ? 'px-2 py-1' : 'px-3 py-2';
  const inputPadding = compact ? 'px-2 py-1 text-sm' : 'px-3 py-2';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`${cellPadding} font-medium text-gray-700 text-sm flex-1`}
              style={col.width ? { width: col.width, flex: 'none' } : undefined}
            >
              {col.label}
              {col.required && <span className="text-red-500 ml-1">*</span>}
            </div>
          ))}
          {!readOnly && <div className={`${cellPadding} w-12`}></div>}
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100">
        {rows.length === 0 ? (
          <div className={`${cellPadding} text-center text-gray-500 text-sm py-6`}>
            {emptyMessage}
          </div>
        ) : (
          rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-center hover:bg-gray-50">
              {columns.map((col) => (
                <div
                  key={col.key}
                  className={`${cellPadding} flex-1`}
                  style={col.width ? { width: col.width, flex: 'none' } : undefined}
                >
                  {readOnly ? (
                    <span className="text-sm text-gray-900">{row[col.key] || '—'}</span>
                  ) : col.type === 'select' ? (
                    <select
                      value={row[col.key] || ''}
                      onChange={(e) => onUpdateCell(rowIndex, col.key, e.target.value)}
                      className={`${inputPadding} w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="">{col.placeholder || 'Select...'}</option>
                      {col.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'date' ? (
                    <input
                      type="date"
                      value={row[col.key] || ''}
                      onChange={(e) => onUpdateCell(rowIndex, col.key, e.target.value)}
                      className={`${inputPadding} w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                    />
                  ) : col.type === 'number' ? (
                    <input
                      type="number"
                      value={row[col.key] || ''}
                      onChange={(e) => onUpdateCell(rowIndex, col.key, e.target.value)}
                      placeholder={col.placeholder}
                      className={`${inputPadding} w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={row[col.key] || ''}
                      onChange={(e) => onUpdateCell(rowIndex, col.key, e.target.value)}
                      placeholder={col.placeholder}
                      className={`${inputPadding} w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                    />
                  )}
                </div>
              ))}
              {!readOnly && (
                <div className={`${cellPadding} w-12 flex justify-center`}>
                  <button
                    type="button"
                    onClick={() => onDeleteRow(rowIndex)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete row"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Row Button */}
      {!readOnly && (
        <div className="border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onAddRow}
            className={`${cellPadding} w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors`}
          >
            <PlusIcon className="h-4 w-4" />
            {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default DynamicTable;
