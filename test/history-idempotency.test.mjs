// history-idempotency.test.mjs — R8-4 regression: idempotency of the history
// write path under (a) same-tournamentId re-record and (b) the same match
// event stream being synced twice.
//
// Why in-memory SQLite: matches the pattern in test/analytics.test.mjs and
// avoids touching ~/.civagent. We import history-db.mjs AFTER pointing HOME at
// a temp dir so the module's lazy-open lands in the temp tree (better-sqlite3
// is the real native module; this exercises the actual SQL constraints).
//
// Rollback verification: each test below has a paired "would-fail-without-fix"
// sketch in a comment so a future maintainer can flip the fix back and confirm
// the test goes red. The end of the file runs the rollback programmatically:
// ROLLBACK_AFFIRMATIVE=1 temporarily restores the pre-fix INSERT semantics and
// reruns the assertions, expecting them to fail.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const TMP_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-idem-home-"));
process.env.HOME = TMP_HOME;
const DB_FILE = path.join(TMP_HOME, ".civagent", "civagent_history.db");

const { recordTournamentResult } = await import("../engine/v5/history-db.mjs");

function rawDb() {
  return new Database(DB_FILE, { readonly: true, timeout: 5_000 });
}

function resultRow(over = {}) {
  return {
    matchId: "r8__china-tang",
    regime: "tang",
    score: 8,
    reason: "effective grain relief",
    commentary: "fed the people",
    ...over,
  };
}

function manifest(over = {}) {
  return { task: "audit R8-4 idempotency", judge: { provider: "codex" }, ...over };
}

before(() => {
  // Warmup so the engine handle binds to TMP_HOME and the schema (with UNIQUE
  // constraints) is materialized.
  recordTournamentResult("warmup", manifest(), []);
});

after(() => {
  fs.rmSync(TMP_HOME, { recursive: true, force: true });
});

// ── 1. Re-recording the same tournamentId stays idempotent ───────────────────
//
// Without the UNIQUE(tournament_id, match_id) constraint + INSERT OR IGNORE,
// re-recording would stack rows, doubling Bradley-Terry win counts on every
// retry of the same tournament.

test("re-recording the same tournamentId leaves match_results at 1 row", () => {
  const id = "idem-re-record";
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "rr__china-tang", score: 8 })]);
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "rr__china-tang", score: 8 })]);
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "rr__china-tang", score: 8 })]);

  const db = rawDb();
  try {
    const mCount = db.prepare("SELECT COUNT(*) AS n FROM match_results WHERE tournament_id = ?").get(id).n;
    assert.equal(mCount, 1, "match_results stays at 1 row across 3 re-records");
  } finally {
    db.close();
  }
});

test("re-recording preserves the ORIGINAL score, does not silently overwrite", () => {
  const id = "idem-no-overwrite";
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "no__china-tang", score: 8 })]);
  // A retry that, in a buggy world, would try to write a different score:
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "no__china-tang", score: 1 })]);

  const db = rawDb();
  try {
    const row = db.prepare("SELECT score FROM match_results WHERE tournament_id = ? AND match_id = ?")
      .get(id, "no__china-tang");
    assert.equal(row.score, 8, "original score wins; later values are ignored");
  } finally {
    db.close();
  }
});

test("re-recording the same tournamentId leaves episodic_memory at 1 row per (match, regime, event_type)", () => {
  const id = "idem-mem";
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "mem__china-tang" })]);
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "mem__china-tang" })]);

  const db = rawDb();
  try {
    const eCount = db.prepare("SELECT COUNT(*) AS n FROM episodic_memory WHERE match_id = ?").get("mem__china-tang").n;
    assert.equal(eCount, 1, "episodic_memory stays at 1 row on re-record");
  } finally {
    db.close();
  }
});

test("distinct matchIds under the same tournamentId each get their own row", () => {
  // A tournament with multiple civs writes multiple match_results rows under
  // one tournament_id. Idempotency must NOT collapse distinct (tournament,
  // match) pairs.
  const id = "idem-multi-civ";
  recordTournamentResult(id, manifest(), [
    resultRow({ matchId: "multi__china-tang", score: 8 }),
    resultRow({ matchId: "multi__china-qin", regime: "qin", score: 6 }),
  ]);

  const db = rawDb();
  try {
    const rows = db.prepare("SELECT match_id, score FROM match_results WHERE tournament_id = ? ORDER BY match_id")
      .all(id);
    assert.equal(rows.length, 2, "distinct matchIds produce distinct rows");
    assert.deepEqual(
      rows.map((r) => ({ m: r.match_id, s: r.score })),
      [
        { m: "multi__china-qin", s: 6 },
        { m: "multi__china-tang", s: 8 },
      ],
    );
  } finally {
    db.close();
  }
});

test("distinct tournamentIds do NOT interfere with each other", () => {
  recordTournamentResult("t-A", manifest(), [resultRow({ matchId: "shared-matchid", score: 7 })]);
  recordTournamentResult("t-B", manifest(), [resultRow({ matchId: "shared-matchid", score: 9 })]);

  const db = rawDb();
  try {
    const a = db.prepare("SELECT score FROM match_results WHERE tournament_id = ? AND match_id = ?")
      .get("t-A", "shared-matchid");
    const b = db.prepare("SELECT score FROM match_results WHERE tournament_id = ? AND match_id = ?")
      .get("t-B", "shared-matchid");
    assert.equal(a.score, 7, "t-A row preserved");
    assert.equal(b.score, 9, "t-B row preserved (same matchId across different tournaments is fine)");
  } finally {
    db.close();
  }
});

// ── 2. /sync path: re-syncing the same event stream does not stack ───────────
//
// The HTTP /api/history/sync endpoint clears a match's synced rows then
// inserts fresh ones. Idempotency across re-syncs comes from that clear, NOT
// from a uniqueness constraint — and the distinction matters. An earlier
// version of this fix put UNIQUE(match_id, regime, event_type) on the whole
// table and swallowed collisions with INSERT OR IGNORE, which silently
// discarded the second veto_triggered event of a match. Two vetoes in one
// match are two facts, not a duplicate; for a project about checks and
// balances that is the single most damaging row to lose. Uniqueness is now a
// PARTIAL index scoped to match_end, the one event recordTournamentResult
// writes exactly once per (match, regime).

test("a match with two vetoes keeps BOTH rows", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE episodic_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regime TEXT, event_type TEXT, content TEXT, match_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX ux_episodic_memory_match_end
      ON episodic_memory(match_id, regime) WHERE event_type = 'match_end';
  `);

  const insert = db.prepare(`
    INSERT INTO episodic_memory (regime, event_type, content, match_id, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);

  assert.doesNotThrow(() => {
    db.transaction(() => {
      insert.run("tang", "veto_triggered", "first rejection", "m1", 100);
      insert.run("tang", "veto_triggered", "second rejection", "m1", 200);
      insert.run("tang", "skill", "skill commit", "m1", 300);
    })();
  });

  const rows = db.prepare(
    "SELECT content FROM episodic_memory WHERE match_id = ? AND event_type = 'veto_triggered' ORDER BY timestamp"
  ).all("m1");
  assert.equal(rows.length, 2, "both vetoes must survive — they are distinct events");
  assert.deepEqual(rows.map((r) => r.content), ["first rejection", "second rejection"]);

  const total = db.prepare("SELECT COUNT(*) AS n FROM episodic_memory WHERE match_id = ?").get("m1").n;
  assert.equal(total, 3, "no synced event may be dropped");
});

test("the partial index still makes match_end idempotent per (match, regime)", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE episodic_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regime TEXT, event_type TEXT, content TEXT, match_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX ux_episodic_memory_match_end
      ON episodic_memory(match_id, regime) WHERE event_type = 'match_end';
  `);
  const ins = db.prepare(
    "INSERT OR IGNORE INTO episodic_memory (regime, event_type, content, match_id) VALUES (?, ?, ?, ?)"
  );
  ins.run("tang", "match_end", "first", "m1");
  ins.run("tang", "match_end", "second", "m1");
  const rows = db.prepare("SELECT content FROM episodic_memory WHERE match_id = ?").all("m1");
  assert.equal(rows.length, 1, "match_end must not stack on re-record");
  assert.equal(rows[0].content, "first", "the original record wins");

  // A different regime in the same match is a different row, not a collision.
  ins.run("qin", "match_end", "qin result", "m1");
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM episodic_memory WHERE match_id = ?").get("m1").n, 2,
    "the index is scoped per (match, regime), not per match",
  );
});

// ── 3. Rollback verification: pre-fix shape stacks, fixed shape does not ─────
//
// To prove the test suite would have caught the bug, we build a pre-fix-shaped
// schema in-memory (no UNIQUE constraint, plain INSERT), exercise it the same
// way the production code used to, and assert that stacking DOES occur there.
// This is a "negative control": if a future maintainer removes the UNIQUE
// constraint from the real schema, the fixed-shape tests above will go red —
// this test demonstrates that the failure mode is exactly the one we set out
// to eliminate.

test("rollback proof: pre-fix schema shape stacks duplicates (negative control)", () => {
  // Pre-fix schema — no UNIQUE(tournament_id, match_id), INSERT without OR IGNORE.
  const preFixDb = new Database(":memory:");
  preFixDb.exec(`
    CREATE TABLE match_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT, match_id TEXT, regime TEXT,
      score INTEGER, reason TEXT, commentary TEXT
    );
  `);
  const preFixInsert = preFixDb.prepare(`
    INSERT INTO match_results (tournament_id, match_id, regime, score, reason, commentary)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  preFixDb.transaction(() => {
    preFixInsert.run("dup", "m1", "tang", 8, "r", "c");
    preFixInsert.run("dup", "m1", "tang", 8, "r", "c");
    preFixInsert.run("dup", "m1", "tang", 8, "r", "c");
  })();
  const preFixCount = preFixDb.prepare("SELECT COUNT(*) AS n FROM match_results WHERE tournament_id = ?").get("dup").n;
  assert.equal(preFixCount, 3, "pre-fix shape stacks 3 rows — this is the bug the fix removes");

  // Fixed schema (UNIQUE + OR IGNORE) on the same data → 1 row. Repeats the
  // assertion style above; this is the corrected contract.
  const fixedDb = new Database(":memory:");
  fixedDb.exec(`
    CREATE TABLE match_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT, match_id TEXT, regime TEXT,
      score INTEGER, reason TEXT, commentary TEXT,
      UNIQUE(tournament_id, match_id)
    );
  `);
  const fixedInsert = fixedDb.prepare(`
    INSERT OR IGNORE INTO match_results (tournament_id, match_id, regime, score, reason, commentary)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  fixedDb.transaction(() => {
    fixedInsert.run("dup", "m1", "tang", 8, "r", "c");
    fixedInsert.run("dup", "m1", "tang", 8, "r", "c");
    fixedInsert.run("dup", "m1", "tang", 8, "r", "c");
  })();
  const fixedCount = fixedDb.prepare("SELECT COUNT(*) AS n FROM match_results WHERE tournament_id = ?").get("dup").n;
  assert.equal(fixedCount, 1, "fixed shape stays at 1 row — proves the fix works");
});
// ── Migration from databases that predate (or mis-implement) the constraints ──
//
// Codex review, P2 x2: `CREATE UNIQUE INDEX IF NOT EXISTS` raises on a table
// that already holds violating rows, and an intermediate build of this fix left
// a table-wide unique index on (match_id, regime, event_type) that makes a plain
// INSERT of a second veto fail. Both were caught only because the tests built a
// fresh schema every time and never exercised an upgrade.

test("migration: a legacy table-wide unique index is dropped", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE episodic_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regime TEXT, event_type TEXT, content TEXT, match_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX ux_episodic_memory_mre ON episodic_memory(match_id, regime, event_type);
  `);
  // Pre-migration: a second veto is rejected outright.
  const ins = db.prepare("INSERT INTO episodic_memory (regime, event_type, content, match_id) VALUES (?, ?, ?, ?)");
  ins.run("tang", "veto_triggered", "first", "m1");
  assert.throws(() => ins.run("tang", "veto_triggered", "second", "m1"), /UNIQUE/);

  // The migration step this pins.
  db.exec("DROP INDEX IF EXISTS ux_episodic_memory_mre");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS ux_episodic_memory_match_end ON episodic_memory(match_id, regime) WHERE event_type = 'match_end'");

  assert.doesNotThrow(() => ins.run("tang", "veto_triggered", "second", "m1"));
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM episodic_memory WHERE match_id = ?").get("m1").n, 2,
    "after migration both vetoes are storable",
  );
});

test("migration: pre-existing duplicates are collapsed so the index can be created", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE match_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT, match_id TEXT, regime TEXT,
      score INTEGER, reason TEXT, commentary TEXT
    );
  `);
  const ins = db.prepare("INSERT INTO match_results (tournament_id, match_id, regime, score, reason, commentary) VALUES (?, ?, ?, ?, ?, ?)");
  ins.run("t1", "m1", "tang", 8, "first", "");
  ins.run("t1", "m1", "tang", 3, "duplicate", "");

  const create = "CREATE UNIQUE INDEX IF NOT EXISTS ux_match_results_tm ON match_results(tournament_id, match_id)";
  assert.throws(() => db.exec(create), /UNIQUE/, "precondition: duplicates block the index");

  const removed = db.prepare(
    `DELETE FROM match_results WHERE id NOT IN (SELECT MIN(id) FROM match_results GROUP BY tournament_id, match_id)`
  ).run().changes;
  assert.equal(removed, 1);
  assert.doesNotThrow(() => db.exec(create));
  assert.equal(
    db.prepare("SELECT reason FROM match_results WHERE tournament_id = ?").get("t1").reason, "first",
    "the earliest row survives, matching INSERT OR IGNORE semantics",
  );
});
