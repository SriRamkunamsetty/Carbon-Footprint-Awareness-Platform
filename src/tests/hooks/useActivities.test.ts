import { renderHook, act } from '@testing-library/react';
import { useActivities } from '@/hooks/useActivities';
import { vi } from 'vitest';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';

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

describe('useActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty list when not authenticated', () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useActivities({ userId: 'user123' }));

    expect(result.current.activities).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should fetch activities for authenticated user', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user123' } });
    (collection as any).mockReturnValue('collectionRef');
    (query as any).mockReturnValue('queryRef');
    (where as any).mockReturnValue('whereRef');
    (orderBy as any).mockReturnValue('orderByRef');
    
    (onSnapshot as any).mockImplementation((ref: any, callback: any) => {
      callback({
        docs: [
          { id: '1', data: () => ({ name: 'Test Activity', category: 'transport', date: new Date(), carbonEmit: 5 }) }
        ],
      });
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useActivities({ userId: 'user123' }));

    expect(result.current.activities.length).toBe(1);
    expect(result.current.activities[0].name).toBe('Test Activity');
    expect(result.current.loading).toBe(false);
  });

  it('should call addDoc when addActivity is invoked', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user123' } });
    (collection as any).mockReturnValue('collectionRef');
    (addDoc as any).mockResolvedValue({ id: 'newActivityId' });

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

    expect(addDoc).toHaveBeenCalled();
    expect(newId).toBe('newActivityId');
  });

  it('should call deleteDoc when deleteActivity is invoked', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user123' } });
    (doc as any).mockReturnValue('docRef');
    (deleteDoc as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useActivities({ userId: 'user123' }));

    await act(async () => {
      await result.current.deleteActivity('activity123');
    });

    expect(deleteDoc).toHaveBeenCalled();
  });
});
