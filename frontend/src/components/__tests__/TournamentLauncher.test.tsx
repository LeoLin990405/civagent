import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TournamentLauncher } from '../TournamentLauncher';
import type { RegimeMetadata, Scenario } from '../../types/api';

const REGIMES: RegimeMetadata[] = Array.from({ length: 8 }, (_, i) => ({
  id: `dynasty/d${i + 1}`,
  name: `Dynasty ${i + 1}`,
  region: 'china',
  orchestrationPattern: 'centralized',
}));

const SCENARIOS: Scenario[] = [
  { id: 's1', category: 'governance', prompt: 'Scenario A prompt' },
  { id: 's2', category: 'economy', prompt: 'Scenario B prompt' },
];

function mockFetchForMount() {
  globalThis.fetch = vi.fn((url: string) => {
    if (url === '/api/regimes?summary=1')
      return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
    if (url === '/api/scenarios')
      return Promise.resolve(new Response(JSON.stringify(SCENARIOS), { status: 200 }));
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as typeof fetch;
}

describe('TournamentLauncher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents selecting more than 6 civs and shows a warning', async () => {
    mockFetchForMount();
    render(<TournamentLauncher onNavigateToLive={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Dynasty 1')).toBeInTheDocument());

    // Select 6 civs
    for (let i = 1; i <= 6; i++) {
      await userEvent.click(screen.getByText(`Dynasty ${i}`));
    }
    expect(screen.getByText(/6\/6/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum 6 civilizations reached/)).toBeInTheDocument();

    // Attempt 7th — should not change the count
    await userEvent.click(screen.getByText('Dynasty 7'));
    expect(screen.getByText(/6\/6/)).toBeInTheDocument();
  });

  it('blocks submit with empty task', async () => {
    mockFetchForMount();
    const nav = vi.fn();
    render(<TournamentLauncher onNavigateToLive={nav} />);

    await waitFor(() => expect(screen.getByText('Dynasty 1')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Dynasty 1'));
    await userEvent.click(screen.getByText('Launch Tournament'));

    expect(screen.getByText(/Task prompt is required/)).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      '/api/tournaments',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('textarea has maxLength=2000 to prevent over-length input', async () => {
    mockFetchForMount();
    render(<TournamentLauncher onNavigateToLive={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Dynasty 1')).toBeInTheDocument());
    const textarea = screen.getByPlaceholderText(/Describe the governance challenge/) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(2000);
  });

  it('sends correct POST body and navigates on 202', async () => {
    let capturedBody: unknown = null;
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/regimes?summary=1')
        return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
      if (url === '/api/scenarios')
        return Promise.resolve(new Response(JSON.stringify(SCENARIOS), { status: 200 }));
      if (url === '/api/tournaments') {
        capturedBody = JSON.parse(init?.body as string);
        return Promise.resolve(
          new Response(JSON.stringify({ tournamentId: 'tid-abc' }), { status: 202 }),
        );
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    const nav = vi.fn();
    render(<TournamentLauncher onNavigateToLive={nav} />);

    await waitFor(() => expect(screen.getByText('Dynasty 1')).toBeInTheDocument());

    // Select 2 civs
    await userEvent.click(screen.getByText('Dynasty 1'));
    await userEvent.click(screen.getByText('Dynasty 2'));

    // Type task
    const textarea = screen.getByPlaceholderText(/Describe the governance challenge/);
    await userEvent.type(textarea, 'Test task');

    // Submit
    await userEvent.click(screen.getByText('Launch Tournament'));

    await waitFor(() => expect(nav).toHaveBeenCalledWith('tid-abc'));

    expect(capturedBody).toEqual({
      civs: ['dynasty/d1', 'dynasty/d2'],
      task: 'Test task',
      backend: 'native',
      judgesN: 1,
      anonCivs: false,
    });
  });

  it('displays server error string verbatim on 4xx', async () => {
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/regimes?summary=1')
        return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
      if (url === '/api/scenarios')
        return Promise.resolve(new Response(JSON.stringify(SCENARIOS), { status: 200 }));
      if (url === '/api/tournaments')
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'At least 2 civs required' }), { status: 400 }),
        );
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<TournamentLauncher onNavigateToLive={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Dynasty 1')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Dynasty 1'));
    const textarea = screen.getByPlaceholderText(/Describe the governance challenge/);
    await userEvent.type(textarea, 'Test task');
    await userEvent.click(screen.getByText('Launch Tournament'));

    await waitFor(() =>
      expect(screen.getByText('At least 2 civs required')).toBeInTheDocument(),
    );
  });

  it('fills task from random scenario', async () => {
    mockFetchForMount();
    render(<TournamentLauncher onNavigateToLive={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Random Scenario')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Random Scenario'));

    const textarea = screen.getByPlaceholderText(/Describe the governance challenge/) as HTMLTextAreaElement;
    const filled = textarea.value;
    expect(filled === 'Scenario A prompt' || filled === 'Scenario B prompt').toBe(true);
  });
});
