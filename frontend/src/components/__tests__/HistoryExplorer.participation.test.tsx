import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryExplorer } from '../HistoryExplorer';
import type { MatchSummary } from '../../types/api';

function match(
  id: string,
  topologyParticipation?: MatchSummary['meta']['topologyParticipation'],
): MatchSummary {
  return {
    id,
    format: 'structured',
    mtime: 1700000000000,
    meta: {
      matchId: id,
      regime: `china/${id}`,
      backend: 'native',
      ...(topologyParticipation ? { topologyParticipation } : {}),
    },
  };
}

describe('HistoryExplorer participation wiring', () => {
  it('renders all three backend states in the list and active-match header', () => {
    render(
      <HistoryExplorer
        matches={[
          match('observed', {
            status: 'participation_observed',
            dispatchCount: 2,
            officeTurnCount: 1,
            officesInvoked: ['menxia'],
            officeCount: 1,
          }),
          match('absent', {
            status: 'not_observed',
            dispatchCount: 0,
            officeTurnCount: 0,
            officesInvoked: [],
            officeCount: 0,
          }),
          match('legacy'),
        ]}
        onSelectMatch={() => {}}
        activeMatchId="observed"
        activeMatchEvents={[]}
      />,
    );
    expect(screen.getAllByTestId('participation-observed').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByTestId('participation-not-observed')).toHaveLength(1);
    expect(screen.getAllByTestId('participation-unknown')).toHaveLength(1);
    expect(screen.getByTestId('participation-not-observed').textContent).not.toContain('拓扑无效');
    expect(screen.getByTestId('participation-unknown').textContent).not.toContain('未观察');
  });
});
