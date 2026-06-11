import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { vi } from 'vitest';
import { auth } from '@/lib/firebase';

vi.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn((ref, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        uid: '123',
        name: 'Test User',
        email: 'test@example.com',
        points: 100,
        streak: 5,
        goal: 350,
      })
    });
    return vi.fn();
  }),
}));

const TestComponent = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  return <div>Signed in as {user.displayName}</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (auth.onAuthStateChanged as any).mockImplementation(() => vi.fn());
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('updates state when auth state changes to user', async () => {
    let authCallback: any;
    (auth.onAuthStateChanged as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      authCallback({ 
        uid: '123', 
        displayName: 'Test User',
        getIdToken: vi.fn().mockResolvedValue('token')
      });
    });

    expect(screen.getByText('Signed in as Test User')).toBeInTheDocument();
  });
  
  it('updates state when auth state changes to null', async () => {
    let authCallback: any;
    (auth.onAuthStateChanged as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      authCallback(null);
    });

    expect(screen.getByText('Not signed in')).toBeInTheDocument();
  });
});
