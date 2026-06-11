import { renderHook, act } from '@testing-library/react';
import { useGoals } from '@/hooks/useGoals';
import { vi } from 'vitest';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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

describe('useGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null goal when not authenticated', () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useGoals(null));

    expect(result.current.goals).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should fetch goal for authenticated user', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user123' } });
    (doc as any).mockReturnValue('docRef');
    (onSnapshot as any).mockImplementation((ref: any, callback: any) => {
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
    (useAuth as any).mockReturnValue({ user: { uid: 'user123' } });
    (addDoc as any).mockResolvedValue({ id: 'newGoalId' });

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

    expect(addDoc).toHaveBeenCalled();
    expect(newId).toBe('newGoalId');
  });

  it('should call updateDoc when updateGoal is invoked', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user123' } });
    (doc as any).mockReturnValue('docRef');
    (updateDoc as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGoals('user123'));

    await act(async () => {
      await result.current.updateGoal('goal123', { title: 'Save More Water' });
    });

    expect(updateDoc).toHaveBeenCalled();
  });

  it('should call deleteDoc when deleteGoal is invoked', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user123' } });
    (doc as any).mockReturnValue('docRef');
    (deleteDoc as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGoals('user123'));

    await act(async () => {
      await result.current.deleteGoal('goal123');
    });

    expect(deleteDoc).toHaveBeenCalled();
  });

  it('should call updateDoc when completeGoal is invoked', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user123' } });
    (doc as any).mockReturnValue('docRef');
    (updateDoc as any).mockResolvedValue(undefined);
    (onSnapshot as any).mockImplementation((ref: any, callback: any) => {
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

    expect(updateDoc).toHaveBeenCalled();
  });
});
