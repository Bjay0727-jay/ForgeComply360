/**
 * ForgeComply 360 Reporter - Dynamic Table Component (Light Theme)
 * Updated with Section 508 accessibility support
 */
import React, { useId } from 'react';
import { C } from '../config/colors';

interface Column {
  k: string;
  l: string;
  ph?: string;
  w?: string;
  mono?: boolean;
  type?: 'select';
  opts?: string[];
}

interface DTProps {
  cols: Column[];
  rows: Record<string, unknown>[];
  onAdd: () => void;
  onDel: (index: number) => void;
  onUpd: (index: number, key: string, value: string) => void;
  ariaLabel?: string;
}

export const DT: React.FC<DTProps> = ({ cols, rows, onAdd, onDel, onUpd, ariaLabel = 'Data table' }) => {
  const tableId = useId();
  const gridTemplate = cols.map(c => c.w || '1fr').join(' ') + ' 40px';

  // Common cell styles
  const cellStyle: React.CSSProperties = {
    padding: '5px 6px',
    fontSize: 11.5,
    textAlign: 'left',
    verticalAlign: 'middle',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px 6px',
    fontSize: 11.5,
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 5,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <table
        id={tableId}
        role="grid"
        aria-label={ariaLabel}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <caption className="sr-only">{ariaLabel}</caption>
        <thead>
          <tr
            style={{
              display: 'grid',
              gridTemplateColumns: gridTemplate,
              background: C.surface,
              borderBottom: `1px solid ${C.border}`,
              padding: '7px 10px',
            }}
          >
            {cols.map((c) => (
              <th
                key={c.k}
                scope="col"
                id={`${tableId}-col-${c.k}`}
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: C.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  textAlign: 'left',
                  padding: 0,
                }}
              >
                {c.l}
              </th>
            ))}
            <th scope="col" style={{ padding: 0 }}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={cols.length + 1}
                style={{
                  ...cellStyle,
                  textAlign: 'center',
                  color: C.textMuted,
                  padding: '16px',
                }}
              >
                No data. Click "Add Row" to begin.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridTemplate,
                  padding: '5px 10px',
                  borderBottom: i < rows.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                  alignItems: 'center',
                  background: i % 2 === 0 ? 'transparent' : C.surface,
                }}
              >
                {cols.map((c) => (
                  <td key={c.k} style={{ ...cellStyle, paddingRight: 6 }}>
                    {c.type === 'select' ? (
                      <select
                        value={(r[c.k] as string) || ''}
                        onChange={(e) => onUpd(i, c.k, e.target.value)}
                        aria-label={`${c.l} for row ${i + 1}`}
                        aria-describedby={`${tableId}-col-${c.k}`}
                        style={inputStyle}
                      >
                        <option value="">—</option>
                        {c.opts?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={(r[c.k] as string) || ''}
                        onChange={(e) => onUpd(i, c.k, e.target.value)}
                        placeholder={c.ph || ''}
                        aria-label={`${c.l} for row ${i + 1}`}
                        aria-describedby={`${tableId}-col-${c.k}`}
                        style={{
                          ...inputStyle,
                          fontFamily: c.mono ? "'Fira Code', monospace" : 'inherit',
                        }}
                      />
                    )}
                  </td>
                ))}
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <button
                    onClick={() => onDel(i)}
                    aria-label={`Delete row ${i + 1}`}
                    title={`Delete row ${i + 1}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.error,
                      cursor: 'pointer',
                      fontSize: 14,
                      padding: 4,
                      opacity: 0.5,
                      transition: 'opacity 0.15s',
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '1')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '0.5')}
                    onFocus={(e) => ((e.target as HTMLElement).style.opacity = '1')}
                    onBlur={(e) => ((e.target as HTMLElement).style.opacity = '0.5')}
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add Row Button */}
      <button
        onClick={onAdd}
        aria-label={`Add new row to ${ariaLabel}`}
        style={{
          width: '100%',
          padding: '9px',
          background: 'none',
          border: 'none',
          borderTop: `1px solid ${C.border}`,
          color: C.primary,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15 }}>+</span> Add Row
      </button>
    </div>
  );
};

// Hook for managing dynamic table data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDT<T extends Record<string, unknown>>(
  data: any,
  key: string,
  setField: (key: string, value: T[]) => void
) {
  const rows = (data[key] as T[]) || [];

  return {
    rows,
    add: () => setField(key, [...rows, {} as T]),
    del: (i: number) => setField(key, rows.filter((_, x) => x !== i)),
    upd: (i: number, k: string, v: string) => {
      const c = [...rows];
      c[i] = { ...c[i], [k]: v };
      setField(key, c);
    },
  };
}
