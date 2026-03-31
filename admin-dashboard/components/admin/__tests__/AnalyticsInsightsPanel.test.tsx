import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AnalyticsInsightsPanel from '../AnalyticsInsightsPanel';
import { fetchAnalyticsSummary } from '../adminApi';
import type { AnalyticsSummary } from '../types';

jest.mock('../adminApi', () => ({
  fetchAnalyticsSummary: jest.fn(),
}));

const mockedFetchAnalyticsSummary = jest.mocked(fetchAnalyticsSummary);

function createSummary(): AnalyticsSummary {
  return {
    days: 7,
    since: '2026-03-24T00:00:00.000Z',
    until: '2026-03-31T00:00:00.000Z',
    rangeMode: 'lookback',
    filters: {
      locale: null,
      persona: null,
    },
    totals: {
      totalEvents: 120,
      uniqueSessions: 40,
      conversionEvents: 30,
    },
    funnel: {
      pageViews: 100,
      authStarted: 30,
      authCompleted: 20,
      upgradeIntent: 10,
      upgradeCompleted: 2,
      authStartRateFromViews: 30,
      authCompletionRateFromStarts: 66.7,
      upgradeIntentRateFromAuthCompletion: 50,
      upgradeCompletionRateFromIntent: 20,
    },
    breakdownByLocale: [
      {
        key: 'fr',
        pageViews: 20,
        authStarted: 6,
        authCompleted: 4,
        upgradeIntent: 3,
        upgradeCompleted: 0,
        authStartRateFromViews: 30,
        authCompletionRateFromStarts: 66.7,
        upgradeIntentRateFromAuthCompletion: 75,
        upgradeCompletionRateFromIntent: 0,
      },
    ],
    breakdownByPersona: [
      {
        key: 'beginner',
        pageViews: 50,
        authStarted: 15,
        authCompleted: 10,
        upgradeIntent: 8,
        upgradeCompleted: 1,
        authStartRateFromViews: 30,
        authCompletionRateFromStarts: 66.7,
        upgradeIntentRateFromAuthCompletion: 80,
        upgradeCompletionRateFromIntent: 12.5,
      },
    ],
    dailyFunnelTrend: [
      {
        date: '2026-03-30',
        pageViews: 10,
        authStarted: 4,
        authCompleted: 3,
        upgradeIntent: 2,
        upgradeCompleted: 1,
      },
      {
        date: '2026-03-31',
        pageViews: 15,
        authStarted: 5,
        authCompleted: 4,
        upgradeIntent: 2,
        upgradeCompleted: 0,
      },
    ],
    eventsByType: [
      { eventType: 'page_view', count: 100 },
      { eventType: 'auth_modal_opened', count: 30 },
    ],
    recentEvents: [],
  };
}

describe('AnalyticsInsightsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchAnalyticsSummary.mockResolvedValue(createSummary());
  });

  it('sends pricing section focus when tuning weakest pricing locale', async () => {
    const user = userEvent.setup();
    const onJumpToMarketing = jest.fn();

    render(<AnalyticsInsightsPanel onJumpToMarketing={onJumpToMarketing} />);

    await waitFor(() => {
      expect(screen.getByText('Lowest Pricing Completion Locale')).toBeTruthy();
    });

    await user.click(screen.getAllByRole('button', { name: 'Tune pricing copy' })[0]);

    expect(onJumpToMarketing).toHaveBeenCalledWith({
      contentKey: 'pricing',
      locale: 'fr',
      section: 'upgradeFlow',
    });
  });
});
