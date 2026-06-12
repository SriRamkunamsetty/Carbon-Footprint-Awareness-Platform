import { vi } from 'vitest';

vi.unmock('@/lib/firebase');

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  isSupported: vi.fn(async () => true),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(() => ({})),
}));

describe('Firebase Client Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize and export Firebase SDK instances', async () => {
    // Stub environment variables before dynamic import execution
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-domain';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app';

    const { app, auth, db, storage } = await import('@/lib/firebase');

    expect(app).toBeDefined();
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    expect(storage).toBeDefined();
  });
});
