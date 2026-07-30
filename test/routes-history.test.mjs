// routes-history.test.mjs — GET /api/history/:regime and POST /api/history/sync.
//
// Hermeticity note (AGENTS.md rule #7): the history DB path is resolved at
// module load from os.homedir() (server/db/database.mjs). To keep this test off
// the real ~/.civagent, we point HOME at a temp dir BEFORE dynamically importing
// the router, so database.mjs re-evaluates against the temp home. The router's
// filesystem scan is driven by an explicitly injected rootDir (the same temp
// .civagent dir), so fixtures live entirely in the temp tree.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Set HOME to a temp dir before any import that touches os.homedir(). Done once
// at the top level so every dynamic import below sees the same temp home.
const TMP_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-history-home-"));
process.env.HOME = TMP_HOME;

// Dynamic import so database.mjs (and the router's default rootDir) bind to the
// temp HOME rather than the real ~/.civagent.
const { createHistoryRouter } = await import("../server/routes/history.mjs");

const rootDir = path.join(TMP_HOME, ".civagent");

function makeApp() {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  // Inject the same temp .civagent dir the DB lives under.
  app.use("/api/history", createHistoryRouter({ rootDir }));
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function withServer(fn) {
  const server = await listen(makeApp());
  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

after(() => {
  fs.rmSync(TMP_HOME, { recursive: true, force: true });
});

test("POST /api/history/sync returns imported:0 when there are no matches", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/history/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.imported, 0);
  });
});

test("POST /api/history/sync backfills synced event types from on-disk matches", async () => {
  await withServer(async (base) => {
    // Seed a match dir with meta + events, including a synced type (skill) and a
    // non-synced type (turn) — only the synced one should be imported.
    const dir = path.join(rootDir, "matches", "m-backfill");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ regime: "china/tang" }));
    const events = [
      { type: "turn", ts: 1, text: "ignored" },
      { type: "skill", ts: 2, reason: "learned a thing", status: "saved" },
      { type: "veto_triggered", ts: 3, reason: "blocked an edict" },
    ];
    fs.writeFileSync(
      path.join(dir, "events.jsonl"),
      events.map((e) => JSON.stringify(e)).join("\n") + "\n"
    );

    const res = await fetch(`${base}/api/history/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.imported, 2, "only skill + veto_triggered are synced event types");

    // The backfilled rows should now be readable via /:regime. The regime value
    // is "china/tang" (with a slash), so the client encodes it (matches how the
    // frontend calls /api/history/${encodeURIComponent(regime)}).
    const hist = await fetch(`${base}/api/history/${encodeURIComponent("china/tang")}`);
    assert.equal(hist.status, 200);
    const rows = await hist.json();
    const types = rows.map((r) => r.event_type).sort();
    assert.deepEqual(types, ["skill", "veto_triggered"]);
  });
});


// Regression: two vetoes in one match are two facts, not a duplicate.
//
// An intermediate version of the idempotency fix put a table-wide
// UNIQUE(match_id, regime, event_type) on episodic_memory and swallowed the
// collision with INSERT OR IGNORE. Every assertion above still passed, because
// each event_type appears once in that fixture. This test is the one that
// notices: a match in which the Chancellery rejected twice would have silently
// lost the second rejection — in a project whose subject is checks and
// balances, the single most damaging row to drop.
test("POST /api/history/sync keeps every occurrence of a repeated event type", async () => {
  await withServer(async (base) => {
    const dir = path.join(rootDir, "matches", "m-repeat");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ regime: "china/song" }));
    const events = [
      { type: "veto_triggered", ts: 1, reason: "first rejection" },
      { type: "veto_triggered", ts: 2, reason: "second rejection" },
      { type: "skill", ts: 3, reason: "learned from the rejections" },
    ];
    fs.writeFileSync(
      path.join(dir, "events.jsonl"),
      events.map((e) => JSON.stringify(e)).join("\n") + "\n"
    );

    const res = await fetch(`${base}/api/history/sync`, { method: "POST" });
    assert.equal(res.status, 200);

    const hist = await fetch(`${base}/api/history/${encodeURIComponent("china/song")}`);
    const rows = await hist.json();
    const vetoes = rows.filter((r) => r.event_type === "veto_triggered").map((r) => r.content).sort();
    assert.deepEqual(vetoes, ["first rejection", "second rejection"],
      "both rejections must be readable back, with their distinct reasons");
    assert.equal(rows.length, 3, "no synced event of this match may be dropped");
  });
});

// The count the API reports must be rows written, not insert attempts.
// Measured as a delta, because /sync re-imports every match dir on the disk and
// these tests share one temp home — an absolute count would be coupled to
// whatever earlier tests happened to seed.
test("POST /api/history/sync counts rows written, not insert attempts", async () => {
  await withServer(async (base) => {
    const before = (await (await fetch(`${base}/api/history/sync`, { method: "POST" })).json()).imported;

    const dir = path.join(rootDir, "matches", "m-count");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ regime: "china/han" }));
    const events = [
      { type: "veto_triggered", ts: 1, reason: "a" },
      { type: "veto_triggered", ts: 2, reason: "b" },
      { type: "turn", ts: 3, text: "not synced" },
    ];
    fs.writeFileSync(
      path.join(dir, "events.jsonl"),
      events.map((e) => JSON.stringify(e)).join("\n") + "\n"
    );

    const after = (await (await fetch(`${base}/api/history/sync`, { method: "POST" })).json()).imported;
    const rows = await (await fetch(`${base}/api/history/${encodeURIComponent("china/han")}`)).json();

    assert.equal(rows.length, 2, "both vetoes stored; the turn event is not a synced type");
    assert.equal(after - before, rows.length,
      `imported grew by ${after - before} but only ${rows.length} rows are readable`);
  });
});
