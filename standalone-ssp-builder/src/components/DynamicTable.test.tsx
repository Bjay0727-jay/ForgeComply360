/**
 * DynamicTable Component Tests
 * Tests for ForgeComply 360 Reporter dynamic table functionality
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DT, useDT } from './DynamicTable';
import { renderHook, act } from '@testing-library/react';

describe('DT Component', () => {
  const defaultCols = [
    { k: 'name', l: 'Name', ph: 'Enter name' },
    { k: 'value', l: 'Value', ph: 'Enter value' },
  ];

  const defaultRows = [
    { name: 'Item 1', value: 'Value 1' },
    { name: 'Item 2', value: 'Value 2' },
  ];

  const defaultProps = {
    cols: defaultCols,
    rows: defaultRows,
    onAdd: vi.fn(),
    onDel: vi.fn(),
    onUpd: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render column headers', () => {
      render(<DT {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('should render all rows', () => {
      render(<DT {...defaultProps} />);

      // Find inputs with the row values
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(4); // 2 rows × 2 columns
    });

    it('should render row data in inputs', () => {
      render(<DT {...defaultProps} />);

      expect(screen.getByDisplayValue('Item 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Value 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Item 2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Value 2')).toBeInTheDocument();
    });

    it('should render Add Row button', () => {
      render(<DT {...defaultProps} />);

      expect(screen.getByText(/Add Row/)).toBeInTheDocument();
    });

    it('should render delete buttons for each row', () => {
      render(<DT {...defaultProps} />);

      const deleteButtons = screen.getAllByText('✕');
      expect(deleteButtons.length).toBe(2);
    });
  });

  describe('Empty State', () => {
    it('should render with empty rows array', () => {
      render(<DT {...defaultProps} rows={[]} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText(/Add Row/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onAdd when Add Row is clicked', () => {
      const onAdd = vi.fn();
      render(<DT {...defaultProps} onAdd={onAdd} />);

      fireEvent.click(screen.getByText(/Add Row/));

      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('should call onDel with correct index when delete is clicked', () => {
      const onDel = vi.fn();
      render(<DT {...defaultProps} onDel={onDel} />);

      const deleteButtons = screen.getAllByText('✕');
      fireEvent.click(deleteButtons[0]);

      expect(onDel).toHaveBeenCalledWith(0);
    });

    it('should call onUpd when input value changes', () => {
      const onUpd = vi.fn();
      render(<DT {...defaultProps} onUpd={onUpd} />);

      const firstInput = screen.getByDisplayValue('Item 1');
      fireEvent.change(firstInput, { target: { value: 'Updated Item' } });

      expect(onUpd).toHaveBeenCalledWith(0, 'name', 'Updated Item');
    });
  });

  describe('Select Column Type', () => {
    it('should render select element for select type columns', () => {
      const selectCols = [
        { k: 'status', l: 'Status', type: 'select' as const, opts: ['Active', 'Inactive'] },
      ];
      const selectRows = [{ status: 'Active' }];

      render(
        <DT
          cols={selectCols}
          rows={selectRows}
          onAdd={vi.fn()}
          onDel={vi.fn()}
          onUpd={vi.fn()}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should call onUpd when select value changes', () => {
      const onUpd = vi.fn();
      const selectCols = [
        { k: 'status', l: 'Status', type: 'select' as const, opts: ['Active', 'Inactive'] },
      ];
      const selectRows = [{ status: 'Active' }];

      render(
        <DT cols={selectCols} rows={selectRows} onAdd={vi.fn()} onDel={vi.fn()} onUpd={onUpd} />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Inactive' } });

      expect(onUpd).toHaveBeenCalledWith(0, 'status', 'Inactive');
    });
  });

  describe('Column Widths', () => {
    it('should use custom width when specified', () => {
      const colsWithWidth = [
        { k: 'name', l: 'Name', w: '200px' },
        { k: 'value', l: 'Value', w: '100px' },
      ];

      const { container } = render(
        <DT cols={colsWithWidth} rows={defaultRows} onAdd={vi.fn()} onDel={vi.fn()} onUpd={vi.fn()} />
      );

      // The grid template should include the widths
      const header = container.querySelector('[style*="grid-template-columns"]');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Placeholders', () => {
    it('should show placeholder text for empty inputs', () => {
      const rows = [{ name: '', value: '' }];

      render(<DT {...defaultProps} rows={rows} />);

      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    });
  });
});

describe('useDT Hook', () => {
  describe('Initial State', () => {
    it('should return empty rows when key does not exist', () => {
      const setField = vi.fn();
      const { result } = renderHook(() => useDT({}, 'items', setField));

      expect(result.current.rows).toEqual([]);
    });

    it('should return existing rows from data', () => {
      const data = { items: [{ name: 'Test' }] };
      const setField = vi.fn();
      const { result } = renderHook(() => useDT(data, 'items', setField));

      expect(result.current.rows).toEqual([{ name: 'Test' }]);
    });
  });

  describe('Add Action', () => {
    it('should call setField with new empty row appended', () => {
      const data = { items: [{ name: 'Test' }] };
      const setField = vi.fn();
      const { result } = renderHook(() => useDT(data, 'items', setField));

      act(() => {
        result.current.add();
      });

      expect(setField).toHaveBeenCalledWith('items', [{ name: 'Test' }, {}]);
    });

    it('should handle adding to empty rows', () => {
      const setField = vi.fn();
      const { result } = renderHook(() => useDT({}, 'items', setField));

      act(() => {
        result.current.add();
      });

      expect(setField).toHaveBeenCalledWith('items', [{}]);
    });
  });

  describe('Delete Action', () => {
    it('should call setField with row removed at index', () => {
      const data = { items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] };
      const setField = vi.fn();
      const { result } = renderHook(() => useDT(data, 'items', setField));

      act(() => {
        result.current.del(1);
      });

      expect(setField).toHaveBeenCalledWith('items', [{ name: 'A' }, { name: 'C' }]);
    });

    it('should handle deleting first row', () => {
      const data = { items: [{ name: 'A' }, { name: 'B' }] };
      const setField = vi.fn();
      const { result } = renderHook(() => useDT(data, 'items', setField));

      act(() => {
        result.current.del(0);
      });

      expect(setField).toHaveBeenCalledWith('items', [{ name: 'B' }]);
    });

    it('should handle deleting last row', () => {
      const data = { items: [{ name: 'A' }, { name: 'B' }] };
      const setField = vi.fn();
      const { result } = renderHook(() => useDT(data, 'items', setField));

      act(() => {
        result.current.del(1);
      });

      expect(setField).toHaveBeenCalledWith('items', [{ name: 'A' }]);
    });
  });

  describe('Update Action', () => {
    it('should call setField with updated value at index', () => {
      const data = { items: [{ name: 'Old' }] };
      const setField = vi.fn();
      const { result } = renderHook(() => useDT(data, 'items', setField));

      act(() => {
        result.current.upd(0, 'name', 'New');
      });

      expect(setField).toHaveBeenCalledWith('items', [{ name: 'New' }]);
    });

    it('should preserve other fields when updating', () => {
      const data = { items: [{ name: 'Test', value: 'Original' }] };
      const setField = vi.fn();
      const { result } = renderHook(() => useDT(data, 'items', setField));

      act(() => {
        result.current.upd(0, 'name', 'Updated');
      });

      expect(setField).toHaveBeenCalledWith('items', [{ name: 'Updated', value: 'Original' }]);
    });

    it('should add new field if it does not exist', () => {
      const data = { items: [{ name: 'Test' }] };
      const setField = vi.fn();
      const { result } = renderHook(() => useDT(data, 'items', setField));

      act(() => {
        result.current.upd(0, 'newField', 'NewValue');
      });

      expect(setField).toHaveBeenCalledWith('items', [{ name: 'Test', newField: 'NewValue' }]);
    });
  });
});
