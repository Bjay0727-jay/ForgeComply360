import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('renders children when no minRole specified', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'viewer' } });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders children when user role meets requirement', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' } });

    renderWithRouter(
      <ProtectedRoute minRole="admin">
        <div data-testid="content">Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders children when user role exceeds requirement', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'owner' } });

    renderWithRouter(
      <ProtectedRoute minRole="analyst">
        <div data-testid="content">Analyst Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('shows access denied for insufficient role', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'viewer' } });

    renderWithRouter(
      <ProtectedRoute minRole="admin">
        <div data-testid="content">Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });

  it('displays correct minRole in error message', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'viewer' } });

    renderWithRouter(
      <ProtectedRoute minRole="manager">
        <div>Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/manager/i)).toBeInTheDocument();
    expect(screen.getByText(/privileges or higher/i)).toBeInTheDocument();
  });

  it('handles unknown user roles (defaults to viewer level)', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'unknown_role' } });

    renderWithRouter(
      <ProtectedRoute minRole="analyst">
        <div data-testid="content">Content</div>
      </ProtectedRoute>
    );

    // Unknown role defaults to level 0 (viewer), which is less than analyst (level 1)
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });

  it('handles unknown minRole (blocks access)', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' } });

    renderWithRouter(
      <ProtectedRoute minRole="super_admin">
        <div data-testid="content">Content</div>
      </ProtectedRoute>
    );

    // Unknown minRole defaults to level 99, blocking all access
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });

  it('renders back to dashboard link', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'viewer' } });

    renderWithRouter(
      <ProtectedRoute minRole="admin">
        <div>Content</div>
      </ProtectedRoute>
    );

    const link = screen.getByText(/Back to Dashboard/i);
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/');
  });

  it('handles null user gracefully', () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderWithRouter(
      <ProtectedRoute minRole="analyst">
        <div data-testid="content">Content</div>
      </ProtectedRoute>
    );

    // Null user defaults to viewer level (0), which is less than analyst (1)
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });
});
