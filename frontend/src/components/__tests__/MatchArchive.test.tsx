import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchArchive } from '../MatchArchive';

const MATCHES = [
  { id: 'match-1', format: 'structured' as const, mtime: 1700000000000, meta: { matchId: 'match-1', regime: 'china/tang', backend: 'claude' } },
  { id: 'match-2', format: 'legacy' as const, mtime: 1699900000000, meta: { matchId: 'match-2', regime: 'global/rome', backend: 'gpt' } },
];

const EVENTS = [
  { matchId: 'match-1', ts: 1700000001000, type: 'turn' as const, seq: 1, actor: 'emperor', text: 'First turn' },
];

describe('MatchArchive', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders the match list', async () => {
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/matches')
        return Promise.resolve(new Response(JSON.stringify(MATCHES), { status: 200 }));
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<MatchArchive />);

    await waitFor(() => expect(screen.getByText(/china\/tang/)).toBeInTheDocument());
    expect(screen.getByText(/global\/rome/)).toBeInTheDocument();
  });

  it('fetches events when a match is clicked', async () => {
    let detailUrl: string | null = null;
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/matches')
        return Promise.resolve(new Response(JSON.stringify(MATCHES), { status: 200 }));
      if (url.startsWith('/api/matches/match-1')) {
        detailUrl = url;
        return Promise.resolve(new Response(JSON.stringify({ events: EVENTS }), { status: 200 }));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<MatchArchive />);

    await waitFor(() => expect(screen.getByText(/china\/tang/)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/china\/tang/));

    await waitFor(() => expect(detailUrl).toBe('/api/matches/match-1'));
  });

  it('shows error state on list fetch failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/matches')
        return Promise.reject(new Error('Network down'));
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<MatchArchive />);

    // The component calls console.error on failure
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    // The list should remain empty — no matches rendered
    expect(screen.getByText(/No matches found/)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
