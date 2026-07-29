import React, { useEffect, useState, useCallback } from 'react';
import { HistoryExplorer } from './HistoryExplorer';
import type { MatchSummary, MatchEvent } from '../types/api';

/**
 * Self-contained wrapper that fetches match data from the backend
 * and renders the HistoryExplorer component as the "Match Archive" tab.
 *
 * Data sources:
 *   GET /api/matches        → MatchSummary[]  (list)
 *   GET /api/matches/:id    → { events }      (detail)
 */
export const MatchArchive: React.FC = () => {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | undefined>(undefined);
  const [activeMatchEvents, setActiveMatchEvents] = useState<MatchEvent[]>([]);

  // Fetch match list on mount
  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data: MatchSummary[]) => setMatches(data))
      .catch(console.error);
  }, []);

  // Fetch events when a match is selected
  const handleSelectMatch = useCallback((matchId: string) => {
    setActiveMatchId(matchId);
    setActiveMatchEvents([]);

    fetch(`/api/matches/${encodeURIComponent(matchId)}`)
      .then((res) => res.json())
      .then((data: { events?: MatchEvent[] }) => {
        setActiveMatchEvents(data.events ?? []);
      })
      .catch(console.error);
  }, []);

  return (
    <HistoryExplorer
      matches={matches}
      onSelectMatch={handleSelectMatch}
      activeMatchId={activeMatchId}
      activeMatchEvents={activeMatchEvents}
    />
  );
};

export default MatchArchive;
