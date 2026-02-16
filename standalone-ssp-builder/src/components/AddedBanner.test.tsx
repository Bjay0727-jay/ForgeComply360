/**
 * AddedBanner Component Tests
 * Tests for ForgeComply 360 Reporter contextual banner component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddedBanner } from './AddedBanner';

describe('AddedBanner Component', () => {
  describe('FedRAMP Banner', () => {
    it('should render FedRAMP banner with correct label', () => {
      render(<AddedBanner tag="fedramp" ref="Appendix A" text="This is FedRAMP content." />);

      expect(screen.getByText(/FEDRAMP ADDITION/)).toBeInTheDocument();
    });

    it('should display the reference', () => {
      render(<AddedBanner tag="fedramp" ref="Appendix A" text="This is FedRAMP content." />);

      expect(screen.getByText(/Appendix A/)).toBeInTheDocument();
    });

    it('should display the banner text', () => {
      render(<AddedBanner tag="fedramp" ref="Appendix A" text="This is FedRAMP content." />);

      expect(screen.getByText('This is FedRAMP content.')).toBeInTheDocument();
    });

    it('should show star symbol for FedRAMP', () => {
      render(<AddedBanner tag="fedramp" ref="Test Ref" text="Test text" />);

      expect(screen.getByText(/✦/)).toBeInTheDocument();
    });
  });

  describe('FISMA Banner', () => {
    it('should render FISMA banner with correct label', () => {
      render(<AddedBanner tag="fisma" ref="SP 800-37" text="This is FISMA content." />);

      expect(screen.getByText(/NEW — FISMA\/RMF Requirement/)).toBeInTheDocument();
    });

    it('should display the reference', () => {
      render(<AddedBanner tag="fisma" ref="SP 800-37" text="This is FISMA content." />);

      expect(screen.getByText(/SP 800-37/)).toBeInTheDocument();
    });

    it('should display the banner text', () => {
      render(<AddedBanner tag="fisma" ref="SP 800-37" text="This is FISMA content." />);

      expect(screen.getByText('This is FISMA content.')).toBeInTheDocument();
    });

    it('should show red circle for FISMA', () => {
      render(<AddedBanner tag="fisma" ref="Test Ref" text="Test text" />);

      expect(screen.getByText(/🔴/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should render with proper structure', () => {
      const { container } = render(
        <AddedBanner tag="fedramp" ref="Test" text="Test content" />
      );

      // Should have a root container
      const rootDiv = container.firstChild;
      expect(rootDiv).toBeInTheDocument();
    });
  });

  describe('Different Content', () => {
    it('should render long text correctly', () => {
      const longText =
        'This is a very long piece of text that explains the FedRAMP requirement in detail. It includes multiple sentences and provides comprehensive guidance for compliance documentation.';

      render(<AddedBanner tag="fedramp" ref="Appendix Q" text={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should render different reference formats', () => {
      render(
        <AddedBanner tag="fisma" ref="NIST SP 800-53 Rev5 AC-1" text="Access control policy." />
      );

      expect(screen.getByText(/NIST SP 800-53 Rev5 AC-1/)).toBeInTheDocument();
    });
  });
});
