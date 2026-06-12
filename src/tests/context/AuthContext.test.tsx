import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { vi } from 'vitest';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import Cookies from 'js-cookie';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'docRef'),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
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
        onboarded: true,
      }),
    });
    return vi.fn();
  }),
}));

vi.mock('js-cookie', () => ({
  default: {
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

const TestComponent = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  return <div>Signed in as {user.displayName}</div>;
};

const AuthActions = () => {
  const authApi = useAuth();
  return (
    <div>
      <button type="button" onClick={() => authApi.loginWithGoogle()}>Google</button>
      <button type="button" onClick={() => authApi.loginWithEmail('a@b.com', 'pass')}>Email</button>
      <button type="button" onClick={() => authApi.signupWithEmail('a@b.com', 'pass', 'Name')}>Signup</button>
      <button type="button" onClick={() => authApi.logout()}>Logout</button>
      <button type="button" onClick={() => authApi.resetPassword('a@b.com')}>Reset</button>
      <button type="button" onClick={() => authApi.updateProfile({ name: 'Updated' })}>Update</button>
      <button type="button" onClick={() => authApi.onboardUser({ country: 'India' })}>Onboard</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(onAuthStateChanged).mockImplementation(() => vi.fn());
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('updates state when auth state changes to user', async () => {
    let authCallback: (user: unknown) => void = () => {};
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
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
        email: 'test@example.com',
        getIdToken: vi.fn().mockResolvedValue('token'),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Signed in as Test User')).toBeInTheDocument();
    });
    expect(Cookies.set).toHaveBeenCalledWith('__session', 'token', { expires: 14 });
  });

  it('updates state when auth state changes to null', async () => {
    let authCallback: (user: unknown) => void = () => {};
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
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
    expect(Cookies.remove).toHaveBeenCalledWith('__session');
  });

  it('creates a default profile when Firestore document is missing', async () => {
    let authCallback: (user: unknown) => void = () => {};
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      authCallback = cb;
      return vi.fn();
    });

    vi.mocked(onSnapshot).mockImplementationOnce((ref, callback) => {
      callback({ exists: () => false, data: () => undefined });
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
        displayName: 'New User',
        email: 'new@example.com',
        photoURL: null,
        getIdToken: vi.fn().mockResolvedValue('token'),
      });
    });

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });
  });

  it('calls Google sign-in', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation(() => vi.fn());
    vi.mocked(signInWithPopup).mockResolvedValue({} as never);

    render(
      <AuthProvider>
        <AuthActions />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Google').click();
    });

    expect(signInWithPopup).toHaveBeenCalled();
  });

  it('calls email login and signup flows', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation(() => vi.fn());
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({} as never);
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: { uid: '123' },
    } as never);

    render(
      <AuthProvider>
        <AuthActions />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Email').click();
      screen.getByText('Signup').click();
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalled();
    expect(createUserWithEmailAndPassword).toHaveBeenCalled();
  });

  it('logs out and resets password', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation(() => vi.fn());
    vi.mocked(signOut).mockResolvedValue(undefined);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <AuthActions />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Logout').click();
      screen.getByText('Reset').click();
    });

    expect(signOut).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('updates profile and onboarding data in Firestore', async () => {
    let authCallback: (user: unknown) => void = () => {};
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      authCallback = cb;
      return vi.fn();
    });

    render(
      <AuthProvider>
        <AuthActions />
      </AuthProvider>
    );

    await act(async () => {
      authCallback({
        uid: '123',
        displayName: 'Test User',
        email: 'test@example.com',
        getIdToken: vi.fn().mockResolvedValue('token'),
      });
    });

    await act(async () => {
      screen.getByText('Update').click();
      screen.getByText('Onboard').click();
    });

    expect(updateDoc).toHaveBeenCalled();
  });

  it('throws when useAuth is used outside provider', () => {
    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });
});
