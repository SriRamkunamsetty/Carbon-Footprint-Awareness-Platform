import { renderHook } from '@testing-library/react';
import { useCarbonScore } from '@/hooks/useCarbonScore';
import { vi } from 'vitest';

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toDate() { return new Date(this.seconds * 1000); }
    static now() { return new MockTimestamp(Date.now() / 1000, 0); }
    static fromDate(date: Date) { return new MockTimestamp(date.getTime() / 1000, 0); }
  }

  return {
    doc: vi.fn(),
    getDoc: vi.fn(),
    onSnapshot: vi.fn(),
    Timestamp: MockTimestamp
  };
});

describe('useCarbonScore', () => {
  const mockActivities = [
    { id: '1', name: 'Drive', category: 'transport', carbonEmit: 10, date: new Date() },
    { id: '2', name: 'Meal', category: 'food', carbonEmit: 5, date: new Date(Date.now() - 86400000) } // yesterday
  ];

  it('should calculate carbon score and metrics correctly', () => {
    const { result } = renderHook(() => useCarbonScore(mockActivities as any));

    expect(result.current.score).toBeDefined();
    expect(result.current.todayCarbon).toBe(10);
    expect(result.current.weeklyCarbon).toBeDefined();
    expect(result.current.categoryBreakdown.length).toBe(2);
    expect(result.current.trend).toBeDefined();
  });

  it('should return default values when activities are empty', () => {
    const { result } = renderHook(() => useCarbonScore([]));

    expect(result.current.score).toBe(100);
    expect(result.current.todayCarbon).toBe(0);
    expect(result.current.weeklyCarbon).toBe(0);
    expect(result.current.categoryBreakdown.length).toBe(0);
  });
});
