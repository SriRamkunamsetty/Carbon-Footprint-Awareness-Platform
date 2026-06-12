/**
 * @module useLeaderboard Tests
 * Tests for the useLeaderboard hook that fetches global leaderboard data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeaderboard } from '@/hooks/useLeaderboard';

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
}));

// Import AFTER vi.mock declarations so we get the mocked versions
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

describe('useLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch leaderboard data', async () => {
    vi.mocked(collection).mockReturnValue('collectionRef' as any);
    vi.mocked(query).mockReturnValue('queryRef' as any);
    vi.mocked(orderBy).mockReturnValue('orderByRef' as any);
    vi.mocked(limit).mockReturnValue('limitRef' as any);

    vi.mocked(onSnapshot).mockImplementation((ref: any, callback: any) => {
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
