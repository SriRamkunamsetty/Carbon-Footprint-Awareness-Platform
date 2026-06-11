import { AnalyticsService } from '@/services/analytics.service';
import { logEvent } from 'firebase/analytics';
import { vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({
  getFirebaseAnalytics: vi.fn(() => ({})),
  app: {},
}));

vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
  getAnalytics: vi.fn(() => ({})),
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tracks page views', () => {
    AnalyticsService.trackPageView('/dashboard');
    expect(logEvent).toHaveBeenCalled();
  });

  it('tracks login', () => {
    AnalyticsService.trackLogin({ method: 'email' });
    expect(logEvent).toHaveBeenCalled();
  });

  it('tracks activity logged', () => {
    AnalyticsService.trackCarbonActivity({ category: 'transport', value: 10, unit: 'km', carbonEmit: 2.1 });
    expect(logEvent).toHaveBeenCalled();
  });
});
