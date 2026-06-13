/**
 * @module Sidebar Tests
 * Tests for the Sidebar navigation component.
 */
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Use vi.hoisted to ensure these are available when vi.mock factories run
const { mockUsePathname, mockUseAuth } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => '/dashboard'),
  mockUseAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

// Import component AFTER vi.mock declarations
import { Sidebar } from '@/components/dashboard/sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      logout: vi.fn(),
    });
  });

  it('renders navigation links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Carbon Tracker')).toBeInTheDocument();
    expect(screen.getByText('AI Coach')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/dashboard/tracker');
    render(<Sidebar />);
    expect(screen.getByText('Carbon Tracker')).toBeInTheDocument();
  });
});
