import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { vi } from 'vitest';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    (useAuth as any).mockReturnValue({
      user: { uid: '123' },
      logout: vi.fn(),
    });
  });

  it('renders navigation links', () => {
    (usePathname as any).mockReturnValue('/dashboard');
    render(<Sidebar />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Carbon Tracker')).toBeInTheDocument();
    expect(screen.getByText('AI Coach')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });
});
