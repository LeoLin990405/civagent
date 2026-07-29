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

