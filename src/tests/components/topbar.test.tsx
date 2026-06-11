import { render, screen } from '@testing-library/react';
import { Topbar } from '@/components/dashboard/topbar';
import { vi } from 'vitest';
import { useAuth } from '@/context/AuthContext';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Topbar', () => {
  it('renders user information', () => {
    (useAuth as any).mockReturnValue({
      profile: { name: 'John Doe', email: 'john@example.com', photoURL: null, streak: 5, points: 100 },
      logout: vi.fn(),
    });

    render(<Topbar />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
