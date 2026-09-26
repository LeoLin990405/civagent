// Demo mode — lets the dashboard run with NO backend, for screenshots,
// recordings and first-look evaluation.
//
// Enable with `?demo=1` in the URL, or build with `VITE_DEMO=1`.
// All /api/* GETs are answered from fixtures.json, a snapshot of the real
// server's responses (see scripts/build-demo-fixtures.mjs). Regime definitions
// in it are real repo data; tournaments / matches / rankings are hand-written
// samples marked demo:true. The UI shows a permanent banner so demo data is
// never mistaken for a real run.

export function isDemoMode(): boolean {
  if (import.meta.env.VITE_DEMO === '1') return true;
  if (typeof window === 'undefined') return false;
  const v = new URLSearchParams(window.location.search).get('demo');
  return v !== null && v !== '0' && v !== 'false';
}

interface FixtureEntry { status: number; body: unknown }
interface FixtureFile { responses: Record<string, FixtureEntry> }

const DEMO_TOURNAMENT_ID = 'demo-t-001';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-civagent-demo': '1' },
  });
}

/** Replace window.fetch / window.EventSource for /api/* with fixture replay. */
export function installDemoApi(fixtures: FixtureFile): void {
  const table = fixtures.responses;
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
      return realFetch(input, init);
    }
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const key = url.pathname + url.search;
    if (method === 'POST' && url.pathname === '/api/tournaments') {
      // Nothing is launched: point the UI at the bundled sample tournament.
      return jsonResponse(202, { tournamentId: DEMO_TOURNAMENT_ID, demo: true });
    }
    if (method !== 'GET') {
      return jsonResponse(403, { error: '演示模式只读 / demo mode is read-only — nothing was written.' });
    }
    const hit = table[key] ?? table[url.pathname];
    if (hit) return jsonResponse(hit.status, hit.body);
    return jsonResponse(404, { error: `no demo fixture for ${key}` });
  };

  // Live Court uses SSE. Replay the sample transcript in small batches so the
  // "live" view actually streams, then stop (a finished sample match).
  class DemoEventSource extends EventTarget {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSED = 2;
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSED = 2;
    readonly url: string;
    readonly withCredentials = false;
    readyState = 0;
    onopen: ((ev: Event) => void) | null = null;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;
    private timers: number[] = [];

    constructor(url: string | URL) {
      super();
      this.url = String(url);
      const path = new URL(this.url, window.location.origin).pathname;
      const events = (table[path]?.body as unknown[] | undefined) ?? [];
      this.timers.push(window.setTimeout(() => {
        this.readyState = 1;
        const ev = new Event('open');
        this.onopen?.(ev);
        this.dispatchEvent(ev);
        const batch = 1;
        for (let i = 0; i < events.length; i += batch) {
          this.timers.push(window.setTimeout(() => {
            if (this.readyState === 2) return;
            const msg = new MessageEvent('message', { data: JSON.stringify(events.slice(i, i + batch)) });
            this.onmessage?.(msg);
            this.dispatchEvent(msg);
          }, 400 + (i / batch) * 700));
        }
      }, 150));
    }

    close(): void {
      this.readyState = 2;
      for (const t of this.timers) window.clearTimeout(t);
      this.timers = [];
    }
  }
  (window as unknown as { EventSource: unknown }).EventSource = DemoEventSource;
}
