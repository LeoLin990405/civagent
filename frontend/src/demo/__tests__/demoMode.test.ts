import { describe, it, expect, beforeAll } from 'vitest';
import { installDemoApi } from '../demoMode';
import fixtures from '../fixtures.json';

describe('demo mode fixture transport', () => {
  beforeAll(() => {
    installDemoApi(fixtures as Parameters<typeof installDemoApi>[0]);
  });

  it('serves regime catalog from the snapshot', async () => {
    const res = await fetch('/api/regimes?summary=1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(50);
  });

  it('every sample match is flagged as demo data', async () => {
    const matches = await (await fetch('/api/matches')).json();
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      expect(m.meta.demo).toBe(true);
      expect(m.meta.backend).toBe('demo-fixture');
    }
  });

  it('never writes: non-GET is refused, launch points at the sample tournament', async () => {
    const put = await fetch('/api/regimes/china/ming', { method: 'PUT', body: '{}' });
    expect(put.status).toBe(403);
    const post = await fetch('/api/tournaments', { method: 'POST', body: '{}' });
    expect(post.status).toBe(202);
    expect((await post.json()).demo).toBe(true);
  });
});
