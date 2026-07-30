import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveCourt } from '../LiveCourt';

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly url: string) {
    MockEventSource.instances.push(this);
  }

  push(events: unknown[]) {
    this.onmessage?.({ data: JSON.stringify(events) });
  }

  close() {}
}

describe('LiveCourt office actors', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    (globalThis as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
    ) as typeof fetch;
  });

  it('shows office badges from SSE events without changing legacy actors', async () => {
    render(<LiveCourt initialMatchId="m-1" />);
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    act(() => {
      MockEventSource.instances[0].push([
        { type: 'turn', text: 'legacy', actor: 'emperor' },
        { type: 'turn', text: 'office', actor: 'china/tang#menxia' },
        { type: 'turn', text: 'nested', actor: 'china/tang#bingbu#sub#2' },
      ]);
    });

    expect(await screen.findAllByTestId('live-actor-role')).toHaveLength(3);
    expect(screen.getAllByTestId('live-actor-role').map((node) => node.textContent)).toEqual([
      'emperor',
      'menxia',
      'bingbu#sub#2',
    ]);
    expect(screen.getAllByTestId('live-actor-regime').map((node) => node.textContent)).toEqual([
      'china/tang',
      'china/tang',
    ]);
  });
});
