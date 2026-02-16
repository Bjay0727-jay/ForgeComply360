/**
 * Footer Component Tests
 * Tests for ForgeComply 360 Reporter navigation footer
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from './Footer';
import { SECTIONS } from '../config/sections';

describe('Footer Component', () => {
  const defaultProps = {
    currentIndex: 5,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render Previous button', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByText(/Previous/)).toBeInTheDocument();
    });

    it('should render Next button', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByText(/Next/)).toBeInTheDocument();
    });

    it('should render section counter', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByText(`Section 6 of ${SECTIONS.length}`)).toBeInTheDocument();
    });
  });

  describe('First Section', () => {
    it('should disable Previous button on first section', () => {
      render(<Footer {...defaultProps} currentIndex={0} />);

      const prevButton = screen.getByText(/Previous/);
      expect(prevButton).toBeDisabled();
    });

    it('should enable Next button on first section', () => {
      render(<Footer {...defaultProps} currentIndex={0} />);

      const nextButton = screen.getByText(/Next/);
      expect(nextButton).not.toBeDisabled();
    });

    it('should show Section 1 of X', () => {
      render(<Footer {...defaultProps} currentIndex={0} />);

      expect(screen.getByText(`Section 1 of ${SECTIONS.length}`)).toBeInTheDocument();
    });
  });

  describe('Last Section', () => {
    it('should enable Previous button on last section', () => {
      render(<Footer {...defaultProps} currentIndex={SECTIONS.length - 1} />);

      const prevButton = screen.getByText(/Previous/);
      expect(prevButton).not.toBeDisabled();
    });

    it('should show Final text instead of Next on last section', () => {
      render(<Footer {...defaultProps} currentIndex={SECTIONS.length - 1} />);

      expect(screen.getByText('Final')).toBeInTheDocument();
      expect(screen.queryByText(/Next/)).not.toBeInTheDocument();
    });

    it('should show correct section count on last section', () => {
      render(<Footer {...defaultProps} currentIndex={SECTIONS.length - 1} />);

      expect(
        screen.getByText(`Section ${SECTIONS.length} of ${SECTIONS.length}`)
      ).toBeInTheDocument();
    });
  });

  describe('Middle Section', () => {
    it('should enable both navigation buttons', () => {
      render(<Footer {...defaultProps} currentIndex={10} />);

      const prevButton = screen.getByText(/Previous/);
      const nextButton = screen.getByText(/Next/);

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Navigation Callbacks', () => {
    it('should call onPrevious when Previous button is clicked', () => {
      const onPrevious = vi.fn();
      render(<Footer {...defaultProps} onPrevious={onPrevious} />);

      fireEvent.click(screen.getByText(/Previous/));

      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Next button is clicked', () => {
      const onNext = vi.fn();
      render(<Footer {...defaultProps} onNext={onNext} />);

      fireEvent.click(screen.getByText(/Next/));

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should not call onPrevious when disabled', () => {
      const onPrevious = vi.fn();
      render(<Footer {...defaultProps} currentIndex={0} onPrevious={onPrevious} />);

      const prevButton = screen.getByText(/Previous/);
      fireEvent.click(prevButton);

      // Disabled buttons don't fire click events
      expect(onPrevious).not.toHaveBeenCalled();
    });

    it('should call onNext on last section (Final button)', () => {
      const onNext = vi.fn();
      render(<Footer {...defaultProps} currentIndex={SECTIONS.length - 1} onNext={onNext} />);

      fireEvent.click(screen.getByText('Final'));

      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Section Counter Accuracy', () => {
    it('should display correct counter for various sections', () => {
      const indices = [0, 5, 10, 15, SECTIONS.length - 1];

      indices.forEach((index) => {
        const { unmount } = render(
          <Footer currentIndex={index} onPrevious={vi.fn()} onNext={vi.fn()} />
        );

        expect(screen.getByText(`Section ${index + 1} of ${SECTIONS.length}`)).toBeInTheDocument();

        unmount();
      });
    });
  });
});
