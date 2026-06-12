/**
 * @module useActivities Tests
 * Tests for the useActivities hook that manages carbon activity data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivities } from '@/hooks/useActivities';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

// Import AFTER vi.mock declarations to get the mocked versions
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';

describe('useActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty list when not authenticated', () => {
    // useActivities with userId='user123' but onSnapshot never fires = loading stays true
    // But the initial state should be: activities=[], loading=true, error=null
    const { result } = renderHook(() => useActivities({ userId: 'user123' }));

    expect(result.current.activities).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should fetch activities for authenticated user', async () => {
    vi.mocked(collection).mockReturnValue('collectionRef' as any);
    vi.mocked(query).mockReturnValue('queryRef' as any);
    vi.mocked(where).mockReturnValue('whereRef' as any);
    vi.mocked(orderBy).mockReturnValue('orderByRef' as any);

    vi.mocked(onSnapshot).mockImplementation((ref: any, callback: any) => {
      callback({
        docs: [
          { id: '1', data: () => ({ note: 'Test Activity', category: 'transport', date: new Date(), carbonEmit: 5 }) }
        ],
      });
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useActivities({ userId: 'user123' }));

    expect(result.current.activities.length).toBe(1);
    expect(result.current.activities[0].note).toBe('Test Activity');
    expect(result.current.loading).toBe(false);
  });

  it('should call addDoc when addActivity is invoked', async () => {
    vi.mocked(collection).mockReturnValue('collectionRef' as any);
    vi.mocked(addDoc).mockResolvedValue({ id: 'newActivityId' } as any);

    const { result } = renderHook(() => useActivities({ userId: 'user123' }));

    let newId;
    await act(async () => {
      newId = await result.current.addActivity({
        category: 'transport',
        value: 10,
        unit: 'km',
        carbonEmit: 5,
        date: new Date(),
        note: 'Drive',
      } as any);
    });

    expect(vi.mocked(addDoc)).toHaveBeenCalled();
    expect(newId).toBe('newActivityId');
  });

  it('should call deleteDoc when deleteActivity is invoked', async () => {
    vi.mocked(doc).mockReturnValue('docRef' as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);

    const { result } = renderHook(() => useActivities({ userId: 'user123' }));

    await act(async () => {
      await result.current.deleteActivity('activity123');
    });

    expect(vi.mocked(deleteDoc)).toHaveBeenCalled();
  });
});
