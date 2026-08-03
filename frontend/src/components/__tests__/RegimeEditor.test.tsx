import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegimeEditor } from '../RegimeEditor';
import type { RegimeSummary, RegimeMetadata } from '../../types/api';

const REGIMES: RegimeSummary[] = [
  {
    id: 'china/tang',
    metadata: {
      id: 'china/tang',
      name: 'Tang Dynasty',
      region: 'china',
      orchestrationPattern: 'imperial',
    } as RegimeMetadata,
  },
  {
    id: 'global/rome',
    metadata: {
      id: 'global/rome',
      name: 'Roman Empire',
      region: 'global',
      orchestrationPattern: 'republican',
    } as RegimeMetadata,
  },
];

const TANG_DETAIL = {
  metadata: {
    id: 'china/tang',
    name: 'Tang Dynasty',
    region: 'china',
    orchestrationPattern: 'imperial',
    agentCount: 3,
  },
  identity:
    '# IDENTITY.md\n\n| Historical Role | Agent ID | AI Role | Model |\n|---|---|---|---|\n| Emperor | emperor | Coordinator | claude |\n| Censor | censor | Reviewer | claude |\n| Minister | minister | Executor | claude |\n',
  soul: '# SOUL.md\nYou are the Tang Dynasty court.',
};

function mockFetchForMount() {
  globalThis.fetch = vi.fn((url: string) => {
    if (url === '/api/regimes?summary=1')
      return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as typeof fetch;
}

function mockFetchWithDetail() {
  globalThis.fetch = vi.fn((url: string) => {
    if (url === '/api/regimes?summary=1')
      return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
    if (url === '/api/regimes/china/tang')
      return Promise.resolve(new Response(JSON.stringify(TANG_DETAIL), { status: 200 }));
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as typeof fetch;
}

describe('RegimeEditor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads regime list on mount', async () => {
    mockFetchForMount();
    render(<RegimeEditor />);

    await waitFor(() =>
      expect(screen.getByText('Tang Dynasty')).toBeInTheDocument(),
    );
    expect(screen.getByText('Roman Empire')).toBeInTheDocument();
  });

  it('IDENTITY with N=0 agents disables save and shows warning', async () => {
    // Prose identity that parses to 0 agents
    const proseIdentity = '# IDENTITY.md\n\nThis regime has no table, just prose.\nIt should compile to 0 agents.\n';

    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/regimes?summary=1')
        return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
      if (url === '/api/regimes/china/tang')
        return Promise.resolve(
          new Response(
            JSON.stringify({ ...TANG_DETAIL, identity: proseIdentity }),
            { status: 200 },
          ),
        );
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<RegimeEditor />);

    await waitFor(() =>
      expect(screen.getByText('Tang Dynasty')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText('Tang Dynasty'));

    await waitFor(() =>
      expect(screen.getByTestId('identity-warning')).toBeInTheDocument(),
    );

    // Save button must be disabled
    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();

    // Warning message content
    expect(screen.getByText(/0 agents compiled/)).toBeInTheDocument();
    expect(screen.getByText(/prose-formatted IDENTITY.md/)).toBeInTheDocument();
  });

  it('PUT failure shows error and findings', async () => {
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/regimes?summary=1')
        return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
      if (url === '/api/regimes/china/tang' && (!init || init.method !== 'PUT'))
        return Promise.resolve(new Response(JSON.stringify(TANG_DETAIL), { status: 200 }));
      if (url === '/api/regimes/china/tang' && init?.method === 'PUT') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              error: 'Validation failed',
              findings: [
                { rule: 'agent-count-mismatch', message: 'agentCount in metadata (3) does not match compiled agents (2)' },
                { rule: 'missing-soul', message: 'SOUL.md is empty' },
              ],
            }),
            { status: 400 },
          ),
        );
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<RegimeEditor />);

    await waitFor(() =>
      expect(screen.getByText('Tang Dynasty')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText('Tang Dynasty'));

    await waitFor(() =>
      expect(screen.getByTestId('save-button')).toBeEnabled(),
    );

    await userEvent.click(screen.getByTestId('save-button'));

    await waitFor(() =>
      expect(screen.getByTestId('save-error')).toBeInTheDocument(),
    );

    // Error message
    expect(screen.getByText('Validation failed')).toBeInTheDocument();

    // Findings
    const findings = screen.getByTestId('save-findings');
    expect(findings).toHaveTextContent('agent-count-mismatch');
    expect(findings).toHaveTextContent('agentCount in metadata (3) does not match compiled agents (2)');
    expect(findings).toHaveTextContent('missing-soul');
    expect(findings).toHaveTextContent('SOUL.md is empty');
  });

  it('PUT success shows agentCount', async () => {
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/regimes?summary=1')
        return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
      if (url === '/api/regimes/china/tang' && (!init || init.method !== 'PUT'))
        return Promise.resolve(new Response(JSON.stringify(TANG_DETAIL), { status: 200 }));
      if (url === '/api/regimes/china/tang' && init?.method === 'PUT') {
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true, agentCount: 3 }), { status: 200 }),
        );
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<RegimeEditor />);

    await waitFor(() =>
      expect(screen.getByText('Tang Dynasty')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText('Tang Dynasty'));

    await waitFor(() =>
      expect(screen.getByTestId('save-button')).toBeEnabled(),
    );

    await userEvent.click(screen.getByTestId('save-button'));

    await waitFor(() =>
      expect(screen.getByTestId('save-success')).toBeInTheDocument(),
    );

    expect(screen.getByText(/Saved/)).toBeInTheDocument();
    // The success message contains the agentCount
    const successEl = screen.getByTestId('save-success');
    expect(successEl).toHaveTextContent('3');
    expect(successEl).toHaveTextContent('Saved');
  });

  it('metadata JSON syntax error shows inline error', async () => {
    mockFetchWithDetail();
    render(<RegimeEditor />);

    await waitFor(() =>
      expect(screen.getByText('Tang Dynasty')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText('Tang Dynasty'));

    await waitFor(() =>
      expect(screen.getByTestId('metadata-editor')).toBeInTheDocument(),
    );

    const editor = screen.getByTestId('metadata-editor');
    // Use fireEvent.change to set invalid JSON directly
    fireEvent.change(editor, { target: { value: 'not valid json' } });

    await waitFor(() =>
      expect(screen.getByTestId('metadata-error')).toBeInTheDocument(),
    );
    expect(screen.getByText(/JSON syntax error/)).toBeInTheDocument();
  });

  it('valid identity shows agent count preview', async () => {
    mockFetchWithDetail();
    render(<RegimeEditor />);

    await waitFor(() =>
      expect(screen.getByText('Tang Dynasty')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText('Tang Dynasty'));

    await waitFor(() =>
      expect(screen.getByTestId('identity-preview')).toBeInTheDocument(),
    );

    const preview = screen.getByTestId('identity-preview');
    expect(preview).toHaveTextContent('Compiles to');
    expect(preview).toHaveTextContent('3');
    expect(preview).toHaveTextContent('agents');
  });
});
