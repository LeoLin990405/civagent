import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistoryExplorer } from '../HistoryExplorer';
import type { MatchEvent, MatchSummary } from '../../types/api';

const match: MatchSummary = {
  id: 'm-1',
  format: 'structured',
  mtime: 1,
  meta: { matchId: 'm-1', regime: 'china/tang' },
};

function turn(actor: string, seq: number): MatchEvent {
  return { matchId: 'm-1', ts: seq, type: 'turn', seq, actor, text: `turn-${seq}` };
}

describe('HistoryExplorer office actors', () => {
  it('uses the office as the role badge and keeps legacy actors unchanged', () => {
    render(
      <HistoryExplorer
        matches={[match]}
        onSelectMatch={() => {}}
        activeMatchId="m-1"
        activeMatchEvents={[
          turn('emperor', 1),
          turn('china/tang#menxia', 2),
          turn('china/tang#bingbu#sub#2', 3),
        ]}
      />,
    );

    expect(screen.getAllByTestId('actor-role').map((node) => node.textContent)).toEqual([
      'emperor',
      'menxia',
      'bingbu#sub#2',
    ]);
    expect(screen.getAllByTestId('actor-regime').map((node) => node.textContent)).toEqual([
      'china/tang',
      'china/tang',
    ]);
  });
});
