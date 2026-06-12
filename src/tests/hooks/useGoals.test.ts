/**
 * @module useGoals Tests
 * Tests for the useGoals hook that manages eco-goals with Firestore real-time updates.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGoals } from '@/hooks/useGoals';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

// Import AFTER vi.mock declarations so we get the mocked versions
import { doc, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

describe('useGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null goal when not authenticated', () => {
    const { result } = renderHook(() => useGoals(null));

    expect(result.current.goals).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should fetch goal for authenticated user', async () => {
    vi.mocked(doc).mockReturnValue('docRef' as any);
    vi.mocked(onSnapshot).mockImplementation((ref: any, callback: any) => {
      callback({
        docs: [
          { id: '1', data: () => ({ targetScore: 100 }) }
        ]
      });
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useGoals('user123'));

    expect(result.current.goals.length).toBe(1);
    expect(result.current.loading).toBe(false);
  });

  it('should call addDoc when addGoal is invoked', async () => {
    vi.mocked(addDoc).mockResolvedValue({ id: 'newGoalId' } as any);

    const { result } = renderHook(() => useGoals('user123'));

    let newId;
    await act(async () => {
      newId = await result.current.addGoal({
        userId: 'user123',
        title: 'Save Water',
        category: 'water',
        targetValue: 100,
        deadline: new Date() as any,
      });
    });

    expect(vi.mocked(addDoc)).toHaveBeenCalled();
    expect(newId).toBe('newGoalId');
  });

  it('should call updateDoc when updateGoal is invoked', async () => {
    vi.mocked(doc).mockReturnValue('docRef' as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGoals('user123'));

    await act(async () => {
      await result.current.updateGoal('goal123', { title: 'Save More Water' });
    });

    expect(vi.mocked(updateDoc)).toHaveBeenCalled();
  });

  it('should call deleteDoc when deleteGoal is invoked', async () => {
    vi.mocked(doc).mockReturnValue('docRef' as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGoals('user123'));

    await act(async () => {
      await result.current.deleteGoal('goal123');
    });

    expect(vi.mocked(deleteDoc)).toHaveBeenCalled();
  });

  it('should call updateDoc when completeGoal is invoked', async () => {
    vi.mocked(doc).mockReturnValue('docRef' as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(onSnapshot).mockImplementation((ref: any, callback: any) => {
      callback({
        docs: [
          { id: 'goal123', data: () => ({ targetValue: 100 }) }
        ]
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useGoals('user123'));

    await act(async () => {
      await result.current.completeGoal('goal123');
    });

    expect(vi.mocked(updateDoc)).toHaveBeenCalled();
  });
});
