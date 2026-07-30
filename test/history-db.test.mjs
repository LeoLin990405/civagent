// history-db.test.mjs — episodic memory RAG persistence layer.
//
// history-db.mjs is zero-tested and lives in the hot tournament path: after a
// match it calls recordTournamentResult(), and run-v5 pulls context via
// queryEpisodicMemory(). A throw here would nuke a match's whole tail, so the
// contracts that matter are: (1) it never throws, (2) field mapping, (3) what
// happens on a duplicate tournamentId (idempotency), (4) retrieval correctness.
//
// Hermeticity (AGENTS.md rule #7): the DB path is resolved at module load from
// os.homedir() (history-db.mjs line 22). We point HOME at a temp dir BEFORE the
// dynamic import so the DB file lives under the temp tree, never ~/.civagent.
// better-sqlite3 is the real native module (no fake) — we exercise the actual
// SQL, which is what catches idempotency / injection bugs.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

// ── Set HOME to a temp dir before importing the module under test ─────────────
const TMP_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-hist-home-"));
process.env.HOME = TMP_HOME;
const DB_FILE = path.join(TMP_HOME, ".civagent", "civagent_history.db");

// history-retriever imports history-db, so both bind to TMP_HOME.
const {
  recordTournamentResult,
  queryEpisodicMemory,
} = await import("../engine/v5/history-db.mjs");
const { retrieveHistoricalContext } = await import("../engine/v5/history-retriever.mjs");

// A second, raw handle to the SAME db file lets us assert what actually landed
// in each table (read-only — we never write through it).
function rawDb() {
  return new Database(DB_FILE, { readonly: true, timeout: 5_000 });
}

before(() => {
  // Force the module to open/create the DB at least once so the schema exists.
  recordTournamentResult("warmup", { task: "warmup", judge: null }, []);
});

after(() => {
  fs.rmSync(TMP_HOME, { recursive: true, force: true });
});

// A representative result row, matching what tournament.mjs::resultsToRecord
// passes in (regime is already the popped leaf, e.g. "tang" not "china/tang").
function resultRow(over = {}) {
  return {
    matchId: "t1__china-tang",
    regime: "tang",
    score: 8,
    reason: "effective grain relief",
    commentary: "The granary policy averted famine.",
    ...over,
  };
}
function manifest(over = {}) {
  return { task: "handle a famine", judge: { provider: "codex" }, ...over };
}

// ── recordTournamentResult: field mapping ─────────────────────────────────────

test("recordTournamentResult writes one row per result into tournaments / match_results / episodic_memory", () => {
  recordTournamentResult("map-test", manifest(), [
    resultRow({ matchId: "map__china-tang", regime: "tang" }),
    resultRow({ matchId: "map__china-qin", regime: "qin", score: 6, reason: "harsh but stable" }),
  ]);

  const db = rawDb();
  try {
    const tourn = db.prepare("SELECT id, task, judge FROM tournaments WHERE id = ?").get("map-test");
    assert.equal(tourn.task, "handle a famine");
    assert.equal(tourn.judge, "codex", "judge column stores manifest.judge.provider");

    const matches = db.prepare("SELECT match_id, regime, score, reason, commentary FROM match_results WHERE tournament_id = ? ORDER BY regime").all("map-test");
    assert.equal(matches.length, 2);
    assert.deepEqual(
      matches.map((m) => ({ regime: m.regime, score: m.score })),
      [{ regime: "qin", score: 6 }, { regime: "tang", score: 8 }]
    );
    assert.equal(matches[1].commentary, "The granary policy averted famine.");

    const mem = db.prepare("SELECT regime, event_type, content, match_id FROM episodic_memory WHERE match_id LIKE 'map__%' ORDER BY regime").all();
    assert.equal(mem.length, 2, "one episodic_memory row per result");
    assert.equal(mem[1].event_type, "match_end");
    assert.match(mem[1].content, /Score: 8\/10/);
    assert.match(mem[1].content, /effective grain relief/);
  } finally {
    db.close();
  }
});

test("judge defaults to 'unknown' when manifest has no judge", () => {
  recordTournamentResult("no-judge", { task: "t" }, []);
  const db = rawDb();
  try {
    const t = db.prepare("SELECT judge FROM tournaments WHERE id = ?").get("no-judge");
    assert.equal(t.judge, "unknown");
  } finally {
    db.close();
  }
});

test("score is stored as-is (a missing score becomes SQL NULL, not a fallback)", () => {
  // tournament.mjs always supplies a numeric score (0 default), but history-db
  // itself does no coercion — undefined passes through as NULL. Lock that in so a
  // future "default to 5" change is a conscious decision, not an accident.
  recordTournamentResult("null-score", manifest(), [
    resultRow({ matchId: "null__china-tang", score: undefined }),
  ]);
  const db = rawDb();
  try {
    const m = db.prepare("SELECT score FROM match_results WHERE match_id = ?").get("null__china-tang");
    assert.equal(m.score, null, "undefined score → SQL NULL (no fallback)");
  } finally {
    db.close();
  }
});

// ── Idempotency — re-recording the same tournamentId must NOT stack ──────────
//
// Earlier this test asserted the duplicate-stacking behaviour as correct,
// which was exactly the bug that polluted Bradley-Terry win counts. The
// behaviour is now fixed at the schema level (UNIQUE(tournament_id, match_id)
// and UNIQUE(match_id, regime, event_type)) plus INSERT OR IGNORE in
// recordTournamentResult. A re-record leaves each table at 1 row and the
// original values win.

test("re-recording the SAME tournamentId stays idempotent (no row stacking)", () => {
  const id = "dup-test";
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "dup__china-tang" })]);
  recordTournamentResult(id, manifest(), [resultRow({ matchId: "dup__china-tang" })]);

  const db = rawDb();
  try {
    const tCount = db.prepare("SELECT COUNT(*) AS n FROM tournaments WHERE id = ?").get(id).n;
    assert.equal(tCount, 1, "tournaments table is idempotent (INSERT OR IGNORE on PK)");

    const mCount = db.prepare("SELECT COUNT(*) AS n FROM match_results WHERE tournament_id = ?").get(id).n;
    assert.equal(mCount, 1, "match_results stays at 1 row on re-record (UNIQUE constraint)");

    const eCount = db.prepare("SELECT COUNT(*) AS n FROM episodic_memory WHERE match_id = ?").get("dup__china-tang").n;
    assert.equal(eCount, 1, "episodic_memory stays at 1 row on re-record (UNIQUE constraint)");

    // And the original score survived — re-record does NOT silently overwrite.
    const row = db.prepare("SELECT score FROM match_results WHERE tournament_id = ? AND match_id = ?").get(id, "dup__china-tang");
    assert.equal(row.score, 8, "original score preserved on re-record");
  } finally {
    db.close();
  }
});

// ── Degradation: never throws ─────────────────────────────────────────────────
// (DB-unavailable path is covered in test/history-db-degrade.test.mjs, which
//  loads the module under a HOME that cannot hold a DB.)

test("recordTournamentResult swallows insert errors and does not throw (degrades gracefully)", () => {
  // Pass arguments whose shape would break the prepared statement binding
  // (undefined manifest) — the function must catch, not propagate.
  assert.doesNotThrow(() => recordTournamentResult("degrade-test", undefined, [resultRow()]));
});

test("queryEpisodicMemory never throws on an unexpected input", () => {
  assert.doesNotThrow(() => queryEpisodicMemory("never-seen", []));
  assert.doesNotThrow(() => queryEpisodicMemory("tang", null));
});

// ── queryEpisodicMemory: retrieval correctness ────────────────────────────────

test("queryEpisodicMemory ranks by keyword hit count and filters non-matches", () => {
  // Use a unique regime for this test so cross-test accumulation can't change
  // the counts. Seed two memories: one about grain/famine, one about defense.
  const regime = "rank-regime";
  recordTournamentResult("q-rank-1", manifest(), [
    resultRow({ matchId: "qrank1", regime, reason: "grain relief during famine", commentary: "fed the people" }),
  ]);
  recordTournamentResult("q-rank-2", manifest(), [
    resultRow({ matchId: "qrank2", regime, reason: "garrison the frontier", commentary: "held the border" }),
  ]);

  const hits = queryEpisodicMemory(regime, ["famine", "grain"]);
  assert.equal(hits.length, 1, "only the grain/famine memory matches; defense is filtered out");
  assert.ok(hits.every((h) => h.score > 0), "all returned rows match a keyword");
  assert.ok(hits[0].content.includes("grain") || hits[0].content.includes("famine"), "the match is the grain/famine memory");
});

test("queryEpisodicMemory returns [] for a regime with no recorded memory", () => {
  assert.deepEqual(queryEpisodicMemory("nonexistent-regime", ["anything"]), []);
});

test("queryEpisodicMemory is scoped by regime (one regime's memory never leaks into another)", () => {
  // Seed a memory for an isolated regime; a DIFFERENT regime querying the same
  // keywords must get nothing (rows are filtered by regime = ?).
  const owned = "owned-regime";
  const stranger = "stranger-regime";
  recordTournamentResult("scope-1", manifest(), [
    resultRow({ matchId: "scope1", regime: owned, reason: "grain relief during famine", commentary: "fed the people" }),
  ]);
  assert.deepEqual(queryEpisodicMemory(stranger, ["famine", "grain"]), [], "stranger regime sees no rows from owned regime");
  // And the owner DOES see its own row — proving the filter is on regime, not a
  // global keyword match.
  assert.equal(queryEpisodicMemory(owned, ["famine", "grain"]).length, 1);
});

test("queryEpisodicMemory returns at most 3 rows", () => {
  // Seed 5 distinct memories for one regime all matching the keyword "shared".
  for (let i = 0; i < 5; i++) {
    recordTournamentResult(`cap-${i}`, manifest(), [
      resultRow({ matchId: `cap${i}__china-x`, regime: "capregime", reason: "shared keyword here", commentary: "" }),
    ]);
  }
  const hits = queryEpisodicMemory("capregime", ["shared"]);
  assert.equal(hits.length, 3, "hard LIMIT 3 in SQL + slice(0,3) cap the result");
});

// ── retrieveHistoricalContext: README RAG + episodic merge ────────────────────

test("retrieveHistoricalContext returns '' when the regime has no README.md", () => {
  const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-rag-empty-"));
  try {
    assert.equal(retrieveHistoricalContext(emptyDir, "famine grain"), "");
  } finally {
    fs.rmSync(emptyDir, { recursive: true, force: true });
  }
});

test("retrieveHistoricalContext returns top README paragraphs matching the task keywords", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-rag-"));
  try {
    // Directory basename is the regime leaf used to query episodic memory.
    const regimeDir = path.join(dir, "tang");
    fs.mkdirSync(regimeDir, { recursive: true });
    fs.writeFileSync(
      path.join(regimeDir, "README.md"),
      "The Tang granary system distributed grain during famine.\n\n" +
        "Naval defense protected the coast from raids.\n\n" +
        "An unrelated paragraph about poetry."
    );

    const ctx = retrieveHistoricalContext(regimeDir, "handle a famine with grain relief");
    assert.ok(ctx.length > 0, "returns context for a matching task");
    assert.match(ctx, /granary|grain|famine/i, "includes the keyword-matched paragraph");
    assert.ok(!ctx.includes("poetry"), "does not include the non-matching paragraph");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── SQL injection: every user-controlled value is parameterized ───────────────

test("regime and matchId are parameterized (no SQL injection)", () => {
  // If any of these were string-interpolated, the payload would either error or
  // mutate the schema. With parameterized binding they are inert string literals.
  const evil = "tang'); DROP TABLE match_results;--";
  assert.doesNotThrow(() =>
    recordTournamentResult("inj-test", manifest(), [
      resultRow({ matchId: evil, regime: evil, reason: evil, commentary: evil }),
    ])
  );

  const db = rawDb();
  try {
    // Table still intact and the poison string stored verbatim as data.
    const cnt = db.prepare("SELECT COUNT(*) AS n FROM match_results").get().n;
    assert.ok(cnt > 0, "match_results table survived (no DROP executed)");
    const row = db.prepare("SELECT regime FROM match_results WHERE tournament_id = ?").get("inj-test");
    assert.equal(row.regime, evil, "payload stored as a literal, not executed");
  } finally {
    db.close();
  }
});

test("queryEpisodicMemory parameterizes the regime filter", () => {
  const evil = "x' OR '1'='1";
  // Must not return rows from other regimes; returns [] (no regime named evil).
  const hits = queryEpisodicMemory(evil, ["famine"]);
  assert.deepEqual(hits, [], "injection string treated as a literal regime, not a clause");
});
