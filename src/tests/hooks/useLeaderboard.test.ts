import { renderHook } from '@testing-library/react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { vi } from 'vitest';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

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

describe('useLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch leaderboard data', async () => {
    (collection as any).mockReturnValue('collectionRef');
    (query as any).mockReturnValue('queryRef');
    (orderBy as any).mockReturnValue('orderByRef');
    (limit as any).mockReturnValue('limitRef');
    
    (onSnapshot as any).mockImplementation((ref: any, callback: any) => {
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
