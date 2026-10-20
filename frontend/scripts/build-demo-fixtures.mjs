#!/usr/bin/env node
// build-demo-fixtures.mjs — snapshot the REAL server's GET responses into a
// static fixture file for the frontend's demo mode (?demo=1 / VITE_DEMO=1).
//
// Regime catalog / identity / topology / skill stats / scenarios come from the
// repo's own regimes/ tree (real definitions). Tournament, match and ranking
// payloads come from examples/demo-state/ — hand-written SAMPLE data, every
// record flagged demo:true / backend "demo-fixture". The server is run with
// HOME pointed at a throwaway dir whose .civagent/ is a copy of demo-state, so
// your real ~/.civagent is never read.
//
// Usage (from repo root, after `npm ci`):
//   node frontend/scripts/build-demo-fixtures.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'frontend/src/demo/fixtures.json');

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'civagent-demo-home-'));
fs.cpSync(path.join(ROOT, 'examples/demo-state'), path.join(home, '.civagent'), { recursive: true });
process.env.HOME = home;
// Deterministic mtimes (the list endpoints sort by them): stamp each match's
// meta.json with its own tsEnd so re-running the script yields the same file.
for (const dir of fs.readdirSync(path.join(home, '.civagent/matches'))) {
  const metaPath = path.join(home, '.civagent/matches', dir, 'meta.json');
  const t = new Date(JSON.parse(fs.readFileSync(metaPath, 'utf8')).tsEnd);
  fs.utimesSync(metaPath, t, t);
}

const { createApp } = await import(path.join(ROOT, 'server/index.mjs'));
const server = createApp().listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;

const responses = {};
async function snap(url) {
  const res = await fetch(base + url);
  const type = res.headers.get('content-type') || '';
  let body;
  if (type.includes('text/event-stream')) {
    // First SSE frame carries the whole events array; the demo shim replays it.
    const reader = res.body.getReader();
    const { value } = await reader.read();
    reader.cancel();
    const m = /data: (.*)\n/.exec(new TextDecoder().decode(value));
    body = m ? JSON.parse(m[1]) : [];
  } else {
    body = type.includes('json') ? await res.json() : await res.text();
  }
  responses[url] = { status: res.status, body };
  return body;
}

try {
  await snap('/api/regimes');
  const summaries = await snap('/api/regimes?summary=1');
  await snap('/api/scenarios');
  for (const { id } of summaries) {
    const [region, rid] = id.split('/');
    await snap(`/api/regimes/${region}/${rid}/identity`);
    await snap(`/api/regimes/${region}/${rid}/topology`);
    await snap(`/api/skills/${region}/${rid}/stats`);
    await snap(`/api/history/${rid}`);
    await snap(`/api/analytics/radar/${rid}`);
  }
  await snap('/api/analytics/trends');
  const matches = await snap('/api/matches');
  for (const m of matches) {
    await snap(`/api/matches/${m.id}`);
    await snap(`/api/matches/${m.id}/stream`);
  }
  await snap('/api/tournaments');
  await snap('/api/stats/rankings');
} finally {
  server.close();
  fs.rmSync(home, { recursive: true, force: true });
}

// Scrub the throwaway HOME path out of payloads (e.g. rankings warnings).
const json = JSON.stringify({
  generatedBy: 'frontend/scripts/build-demo-fixtures.mjs',
  note: 'DEMO fixtures. Regime definitions are real repo data; tournaments/matches/rankings are hand-written samples from examples/demo-state/.',
  responses,
}).split(home).join('~');
fs.writeFileSync(OUT, json + '\n');
console.log(`wrote ${path.relative(ROOT, OUT)} — ${Object.keys(responses).length} responses, ${(json.length / 1024).toFixed(0)} KiB`);
