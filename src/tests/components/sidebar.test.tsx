/**
 * @module Sidebar Tests
 * Tests for the Sidebar navigation component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/dashboard/sidebar';

// Override the global next/navigation mock from setup.tsx with sidebar-specific mock
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Import AFTER vi.mock declarations to get the mocked versions
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: '123' } as any,
      logout: vi.fn(),
    } as any);
  });

  it('renders navigation links', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Carbon Tracker')).toBeInTheDocument();
    expect(screen.getByText('AI Coach')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });
});
