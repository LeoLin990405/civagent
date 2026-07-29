// routes-matches.test.mjs — GET /api/matches (list + detail) and SSE stream.
// Mounts the matches router with an injected temp state dir, so no ~/.civagent
// state is touched. Mirrors the tournaments-write-api.test.mjs injection style.

import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMatchesRouter } from "../server/routes/matches.mjs";

function makeApp({ rootDir }) {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.use("/api/matches", createMatchesRouter({ rootDir }));
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function withServer(fn) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-matches-"));
  const server = await listen(makeApp({ rootDir }));
  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`, rootDir);
  } finally {
    server.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

// Write a structured match (matches/<id>/{meta.json,events.jsonl}).
function writeStructured(rootDir, id, meta, events) {
  const dir = path.join(rootDir, "matches", id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta));
  fs.writeFileSync(
    path.join(dir, "events.jsonl"),
    events.map((e) => JSON.stringify(e)).join("\n") + "\n"
  );
  return dir;
}

test("GET /api/matches returns an empty list for an empty state dir", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/matches`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  });
});

test("GET /api/matches lists structured matches sorted by mtime desc", async () => {
  await withServer(async (base, rootDir) => {
    writeStructured(rootDir, "m1", { matchId: "m1", regime: "china/tang", backend: "x" },
      [{ type: "match_start", ts: 1 }]);
    // bump mtime so m2 sorts first
    const m2Dir = writeStructured(rootDir, "m2", { matchId: "m2", regime: "china/qin", backend: "y" },
      [{ type: "match_start", ts: 2 }]);
    const future = new Date(Date.now() + 60000);
    fs.utimesSync(path.join(m2Dir, "meta.json"), future, future);

    const res = await fetch(`${base}/api/matches`);
    assert.equal(res.status, 200);
    const list = await res.json();
    assert.equal(list.length, 2);
    assert.equal(list[0].id, "m2", "newer match first");
    assert.equal(list[0].format, "structured");
    assert.equal(typeof list[0].mtime, "number");
    assert.equal(list[0].meta.regime, "china/qin");
  });
});

test("GET /api/matches/:id returns structured events + meta", async () => {
  await withServer(async (base, rootDir) => {
    writeStructured(rootDir, "abc", { matchId: "abc", regime: "china/tang" },
      [{ type: "turn", ts: 5, text: "hello" }]);

    const res = await fetch(`${base}/api/matches/abc`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.format, "structured");
    assert.equal(body.meta.regime, "china/tang");
    assert.equal(body.events.length, 1);
    assert.equal(body.events[0].text, "hello");
  });
});

test("GET /api/matches/:id 404s an unknown match", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/matches/no-such-match`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, "Match not found");
  });
});

test("GET /api/matches/:id rejects traversal ids via safeResolve (400)", async () => {
  await withServer(async (base) => {
    // An id with an embedded dot reaches the handler and must hit safeResolve.
    const bad = await fetch(`${base}/api/matches/evil.id`);
    assert.equal(bad.status, 400);
    // Encoded traversal never reads outside the root.
    const traversal = await fetch(`${base}/api/matches/%2e%2e`);
    assert.ok([400, 404].includes(traversal.status), "encoded traversal rejected");
  });
});

test("GET /api/matches/:id/stream surfaces an error payload for a missing match", async () => {
  await withServer(async (base, rootDir) => {
    // A match dir exists but has no events.jsonl → stream reports "not found".
    const dir = path.join(rootDir, "matches", "ghost");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "meta.json"), "{}");

    const res = await fetch(`${base}/api/matches/ghost/stream`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "text/event-stream");
    const text = await res.text();
    assert.match(text, /Match events not found/);
  });
});
