import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillLibrary } from '../SkillLibrary';
import type { SkillsStatsResponse, RegimeMetadata } from '../../types/api';

const REGIMES = [
  { id: 'china/tang', metadata: { id: 'china/tang', name: 'Tang Dynasty', region: 'china', orchestrationPattern: 'imperial' } as RegimeMetadata },
  { id: 'global/rome', metadata: { id: 'global/rome', name: 'Roman Empire', region: 'global', orchestrationPattern: 'republican' } as RegimeMetadata },
];

const STATS_WITH_DUPES: SkillsStatsResponse = {
  regime: 'china/tang',
  total: 3,
  uniqueTopics: ['topic-x'],
  duplicateGroups: [['skill-a.md', 'skill-b.md']],
  stats: { firstSedimented: '2025-01-01', lastSedimented: '2025-06-01', duplicateCount: 1 },
  skills: [
    { filename: 'skill-a.md', name: 'Skill A', description: 'Desc A', contentHash: 'aaa', auditedBy: 'judge-1', sizeBytes: 1234, mtime: 1700000000000 },
    { filename: 'skill-b.md', name: 'Skill B', description: 'Desc B', contentHash: 'bbb', auditedBy: null, sizeBytes: 5678, mtime: 1700100000000 },
    { filename: 'skill-c.md', name: 'Skill C', description: 'Desc C', contentHash: 'ccc', auditedBy: 'judge-2', sizeBytes: 900, mtime: 1700200000000 },
  ],
};

const STATS_EMPTY: SkillsStatsResponse = {
  regime: 'global/rome',
  total: 0,
  uniqueTopics: [],
  duplicateGroups: [],
  stats: { firstSedimented: null, lastSedimented: null, duplicateCount: 0 },
  skills: [],
};

function mockFetchForMount() {
  globalThis.fetch = vi.fn((url: string) => {
    if (url === '/api/regimes?summary=1')
      return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as typeof fetch;
}

describe('SkillLibrary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows stats bar with correct numbers and marks duplicates', async () => {
    mockFetchForMount();
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/regimes?summary=1')
        return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
      if (url === '/api/skills/china/tang/stats')
        return Promise.resolve(new Response(JSON.stringify(STATS_WITH_DUPES), { status: 200 }));
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<SkillLibrary />);

    await waitFor(() => expect(screen.getByText('Tang Dynasty')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Tang Dynasty'));

    await waitFor(() => expect(screen.getByText('Total:')).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Unique Topics:')).toBeInTheDocument();
    expect(screen.getByText('Duplicates:')).toBeInTheDocument();
    expect(screen.getAllByText('⚠ Duplicate')).toHaveLength(2); // skill-a and skill-b
  });

  it('shows friendly empty state when total is 0 (not error)', async () => {
    mockFetchForMount();
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/regimes?summary=1')
        return Promise.resolve(new Response(JSON.stringify(REGIMES), { status: 200 }));
      if (url === '/api/skills/global/rome/stats')
        return Promise.resolve(new Response(JSON.stringify(STATS_EMPTY), { status: 200 }));
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<SkillLibrary />);

    await waitFor(() => expect(screen.getByText('Roman Empire')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Roman Empire'));

    await waitFor(() =>
      expect(screen.getByText(/No skills sedimented yet/)).toBeInTheDocument(),
    );
    // Must NOT show an error
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('renders regime list loading then error', async () => {
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/api/regimes?summary=1')
        return Promise.resolve(new Response('', { status: 500 }));
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as typeof fetch;

    render(<SkillLibrary />);

    await waitFor(() =>
      expect(screen.getByText(/Error: Failed to load regimes/)).toBeInTheDocument(),
    );
  });
});
