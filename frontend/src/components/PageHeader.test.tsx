import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from './PageHeader';

// Mock useExperience hook
const mockUseExperience = vi.fn();
vi.mock('../hooks/useExperience', () => ({
  useExperience: () => mockUseExperience(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('PageHeader', () => {
  it('renders title', () => {
    mockUseExperience.mockReturnValue({ isFederal: false, isHealthcare: false, isEnterprise: true });
    renderWithRouter(<PageHeader title="Dashboard" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
  });

  it('renders subtitle when provided', () => {
    mockUseExperience.mockReturnValue({ isFederal: false, isHealthcare: false, isEnterprise: true });
    renderWithRouter(<PageHeader title="Settings" subtitle="Manage your account" />);
    expect(screen.getByText('Manage your account')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    mockUseExperience.mockReturnValue({ isFederal: false, isHealthcare: false, isEnterprise: true });
    const { container } = renderWithRouter(<PageHeader title="Dashboard" />);
    // Check that there's no subtitle paragraph (p tag with text content)
    const subtitleP = container.querySelector('.text-blue-100');
    expect(subtitleP).toBeNull();
  });

  it('renders children (action buttons)', () => {
    mockUseExperience.mockReturnValue({ isFederal: false, isHealthcare: false, isEnterprise: true });
    renderWithRouter(
      <PageHeader title="Systems">
        <button>+ New System</button>
      </PageHeader>
    );
    expect(screen.getByText('+ New System')).toBeInTheDocument();
  });

  it('applies forge-navy background', () => {
    mockUseExperience.mockReturnValue({ isFederal: true, isHealthcare: false, isEnterprise: false });
    const { container } = renderWithRouter(<PageHeader title="Test" />);
    // The header card is now nested inside a wrapper div
    const headerCard = container.querySelector('.bg-forge-navy-900');
    expect(headerCard).toBeInTheDocument();
  });

  it('has rounded-xl styling', () => {
    mockUseExperience.mockReturnValue({ isFederal: false, isHealthcare: false, isEnterprise: true });
    const { container } = renderWithRouter(<PageHeader title="Test" />);
    const headerCard = container.querySelector('.rounded-xl');
    expect(headerCard).toBeInTheDocument();
  });

  it('has border-l-4 accent styling', () => {
    mockUseExperience.mockReturnValue({ isFederal: false, isHealthcare: false, isEnterprise: true });
    const { container } = renderWithRouter(<PageHeader title="Test" />);
    const headerCard = container.querySelector('.border-l-4');
    expect(headerCard).toBeInTheDocument();
  });

  it('renders breadcrumbs for nested routes', () => {
    mockUseExperience.mockReturnValue({ isFederal: false, isHealthcare: false, isEnterprise: true });
    // Use a route that has breadcrumbs configured
    const { container } = render(
      <MemoryRouter initialEntries={['/evidence/schedules']}>
        <PageHeader title="Test" />
      </MemoryRouter>
    );
    // Breadcrumbs component renders with nav element
    const breadcrumbNav = container.querySelector('nav[aria-label="Breadcrumb"]');
    expect(breadcrumbNav).toBeInTheDocument();
  });

  it('hides breadcrumbs when hideBreadcrumbs is true', () => {
    mockUseExperience.mockReturnValue({ isFederal: false, isHealthcare: false, isEnterprise: true });
    const { container } = renderWithRouter(<PageHeader title="Test" hideBreadcrumbs />);
    const breadcrumbNav = container.querySelector('nav');
    expect(breadcrumbNav).toBeNull();
  });
});
