/**
 * Pagination Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  const defaultProps = {
    page: 1,
    totalPages: 5,
    total: 100,
    limit: 25,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when totalPages is 1', () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={1} total={20} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders pagination when totalPages > 1', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('displays correct showing range for first page', () => {
      render(<Pagination {...defaultProps} page={1} />);
      expect(screen.getByText('1–25')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('displays correct showing range for middle page', () => {
      render(<Pagination {...defaultProps} page={3} />);
      expect(screen.getByText('51–75')).toBeInTheDocument();
    });

    it('displays correct showing range for last page with partial results', () => {
      render(<Pagination {...defaultProps} page={5} total={110} />);
      // Page 5: start = (5-1)*25+1 = 101, end = min(5*25, 110) = 110
      expect(screen.getByText('101–110')).toBeInTheDocument();
    });

    it('renders all page numbers when totalPages <= 7', () => {
      render(<Pagination {...defaultProps} totalPages={5} />);
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    });
  });

  describe('ellipsis behavior', () => {
    it('shows ellipsis for many pages when on first page', () => {
      render(<Pagination {...defaultProps} page={1} totalPages={10} total={250} />);
      // Should show: 1, 2, ..., 10
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('shows ellipsis on both sides when on middle page', () => {
      render(<Pagination {...defaultProps} page={5} totalPages={10} total={250} />);
      // Should show: 1, ..., 4, 5, 6, ..., 10
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
      const ellipses = screen.getAllByText('...');
      expect(ellipses).toHaveLength(2);
    });

    it('shows ellipsis only on left when on last page', () => {
      render(<Pagination {...defaultProps} page={10} totalPages={10} total={250} />);
      // Should show: 1, ..., 9, 10
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('navigation buttons', () => {
    it('disables Previous button on first page', () => {
      render(<Pagination {...defaultProps} page={1} />);
      const prevButton = screen.getByRole('button', { name: 'Previous' });
      expect(prevButton).toBeDisabled();
    });

    it('enables Previous button on non-first page', () => {
      render(<Pagination {...defaultProps} page={2} />);
      const prevButton = screen.getByRole('button', { name: 'Previous' });
      expect(prevButton).not.toBeDisabled();
    });

    it('disables Next button on last page', () => {
      render(<Pagination {...defaultProps} page={5} totalPages={5} />);
      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toBeDisabled();
    });

    it('enables Next button on non-last page', () => {
      render(<Pagination {...defaultProps} page={4} totalPages={5} />);
      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('page change interactions', () => {
    it('calls onPageChange with previous page when Previous is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} page={3} onPageChange={onPageChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange with next page when Next is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} page={3} onPageChange={onPageChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('calls onPageChange with specific page when page number is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} page={1} onPageChange={onPageChange} />);

      fireEvent.click(screen.getByRole('button', { name: '3' }));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('does not call onPageChange when clicking disabled Previous', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} page={1} onPageChange={onPageChange} />);

      const prevButton = screen.getByRole('button', { name: 'Previous' });
      fireEvent.click(prevButton);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('does not call onPageChange when clicking disabled Next', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} page={5} totalPages={5} onPageChange={onPageChange} />);

      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('current page highlighting', () => {
    it('highlights current page button', () => {
      render(<Pagination {...defaultProps} page={3} />);

      const currentPageButton = screen.getByRole('button', { name: '3' });
      expect(currentPageButton.className).toContain('bg-blue-600');
      expect(currentPageButton.className).toContain('text-white');
    });

    it('non-current page buttons have default styling', () => {
      render(<Pagination {...defaultProps} page={3} />);

      const otherPageButton = screen.getByRole('button', { name: '2' });
      expect(otherPageButton.className).not.toContain('bg-blue-600');
      expect(otherPageButton.className).toContain('text-gray-700');
    });
  });

  describe('limit selector', () => {
    it('does not show limit selector by default', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('shows limit selector when showLimitSelector is true and onLimitChange provided', () => {
      const onLimitChange = vi.fn();
      render(
        <Pagination
          {...defaultProps}
          showLimitSelector
          onLimitChange={onLimitChange}
        />
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('does not show limit selector when showLimitSelector is true but no onLimitChange', () => {
      render(<Pagination {...defaultProps} showLimitSelector />);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('displays correct options in limit selector', () => {
      const onLimitChange = vi.fn();
      render(
        <Pagination
          {...defaultProps}
          showLimitSelector
          onLimitChange={onLimitChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('25');
      expect(screen.getByText('25 per page')).toBeInTheDocument();
      expect(screen.getByText('50 per page')).toBeInTheDocument();
      expect(screen.getByText('100 per page')).toBeInTheDocument();
    });

    it('calls onLimitChange when limit is changed', () => {
      const onLimitChange = vi.fn();
      render(
        <Pagination
          {...defaultProps}
          showLimitSelector
          onLimitChange={onLimitChange}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '50' } });
      expect(onLimitChange).toHaveBeenCalledWith(50);
    });

    it('reflects current limit value in selector', () => {
      const onLimitChange = vi.fn();
      render(
        <Pagination
          {...defaultProps}
          limit={50}
          showLimitSelector
          onLimitChange={onLimitChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('50');
    });
  });

  describe('edge cases', () => {
    it('handles exactly 7 pages without ellipsis', () => {
      render(<Pagination {...defaultProps} totalPages={7} total={175} />);

      for (let i = 1; i <= 7; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
      }
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('handles 8 pages with ellipsis', () => {
      render(<Pagination {...defaultProps} page={1} totalPages={8} total={200} />);

      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '8' })).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('handles page 2 with many pages (no left ellipsis)', () => {
      render(<Pagination {...defaultProps} page={2} totalPages={10} total={250} />);

      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
      // Should only have right ellipsis
      expect(screen.getAllByText('...')).toHaveLength(1);
    });

    it('handles second-to-last page (no right ellipsis)', () => {
      render(<Pagination {...defaultProps} page={9} totalPages={10} total={250} />);

      expect(screen.getByRole('button', { name: '8' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
      // Should only have left ellipsis
      expect(screen.getAllByText('...')).toHaveLength(1);
    });
  });

  describe('accessibility', () => {
    it('all page buttons are accessible', () => {
      render(<Pagination {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('navigation buttons have proper disabled state', () => {
      render(<Pagination {...defaultProps} page={1} />);

      const prevButton = screen.getByRole('button', { name: 'Previous' });
      expect(prevButton).toHaveAttribute('disabled');
    });
  });
});
