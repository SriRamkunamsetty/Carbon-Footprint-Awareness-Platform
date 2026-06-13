/**
 * @module useLeaderboard Tests
 * Tests for the useLeaderboard hook that fetches global leaderboard data.
 */
import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeaderboard } from '@/hooks/useLeaderboard';

// ─── Hoisted Mock Functions ───────────────────────────────────────────────────

const fsMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: fsMocks.collection,
  query: fsMocks.query,
  orderBy: fsMocks.orderBy,
  limit: fsMocks.limit,
  onSnapshot: fsMocks.onSnapshot,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsMocks.collection.mockReturnValue('collectionRef');
    fsMocks.query.mockReturnValue('queryRef');
    fsMocks.orderBy.mockReturnValue('orderByRef');
    fsMocks.limit.mockReturnValue('limitRef');
  });

  it('should fetch leaderboard data', async () => {
    fsMocks.onSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({
        docs: [
          { id: '1', data: () => ({ name: 'Test User', carbonScore: 90 }) }
        ],
      });
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useLeaderboard({ userId: null }));

    expect(result.current.entries.length).toBe(1);
    expect(result.current.entries[0].name).toBe('Test User');
    expect(result.current.loading).toBe(false);
  });
});
