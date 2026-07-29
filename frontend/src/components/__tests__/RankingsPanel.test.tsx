import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RankingsPanel } from '../RankingsPanel';
import type { StatsRankingsResponse } from '../../types/api';

const DATA_WITH_WARNINGS: StatsRankingsResponse = {
  rankings: [],
  pairwise: [],
  warnings: ['Tie-breaker had to randomize 2 pairs'],
  tournamentsUsed: 3,
  regimes: [],
  B: 1000,
  minSample: 5,
};

describe('RankingsPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders warnings from data without crashing', async () => {
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/stats/rankings')
        return Promise.resolve(new Response(JSON.stringify(DATA_WITH_WARNINGS), { status: 200 }));
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<RankingsPanel />);

    await waitFor(() =>
      expect(screen.getByText('Tie-breaker had to randomize 2 pairs')).toBeInTheDocument(),
    );
    // Should also show the "no ranked tournaments" empty state since rankings is empty
    expect(screen.getByText(/No ranked tournaments yet/)).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/stats/rankings')
        return Promise.resolve(new Response('', { status: 500 }));
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<RankingsPanel />);

    await waitFor(() =>
      expect(screen.getByText(/Failed to load rankings/)).toBeInTheDocument(),
    );
  });
});
