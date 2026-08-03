// memory-retrieval.test.mjs — the episodic-memory retrieval path.
//
// Two defects motivated these tests, both found by reading the code rather than
// by a failing run, because the local corpus was small enough to hide them:
//
//   1. queryEpisodicMemory applied `LIMIT 10` in SQL and only then scored by
//      keyword, so anything a regime learned before its eleventh match was
//      unreachable regardless of relevance.
//   2. the retriever's tokenizer kept every token longer than one character, so
//      "the"/"of"/"and" matched nearly every paragraph and ranking collapsed.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Point HOME at a temp dir BEFORE importing history-db, which resolves the DB
// path at module load. Never touches the real ~/.civagent.
const TMP_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-mem-"));
process.env.HOME = TMP_HOME;

const { recordTournamentResult, queryEpisodicMemory } = await import("../engine/v5/history-db.mjs");
const { extractKeywords } = await import("../engine/v5/history-retriever.mjs");

const REGIME = "probe";

before(() => {
  // 25 memories, comfortably past the old 10-row ceiling. The distinctive term
  // goes in the OLDEST one, so it is only findable if scoring sees everything.
  for (let i = 0; i < 25; i++) {
    const distinctive =
      i === 0 ? "canal dredging silt removal"
      : i === 24 ? "final settlement of arrears"
      : "routine granary audit";
    recordTournamentResult(`t-${String(i).padStart(3, "0")}`, {
      task: "t",
      judge: { provider: "codex" },
      civs: [{ regime: `china/${REGIME}`, matchId: `m-${i}` }],
    }, [{ matchId: `m-${i}`, regime: REGIME, score: 5, reason: distinctive, commentary: distinctive }]);
  }
});

after(() => {
  fs.rmSync(TMP_HOME, { recursive: true, force: true });
});

test("the oldest memory is still retrievable once a regime passes ten matches", () => {
  const hits = queryEpisodicMemory(REGIME, ["canal", "dredging"]);
  assert.ok(hits.length > 0, "a strongly matching memory must not be hidden by recency");
  assert.match(hits[0].content, /canal dredging/, `got: ${JSON.stringify(hits[0]?.content)}`);
});

// The test above cannot distinguish "scans everything" from "scans an arbitrary
// ten" when all rows share a timestamp — CURRENT_TIMESTAMP is second-granular,
// so a fast test inserts every row inside one tick and the ties make SQLite's
// order unspecified. Asserting on both ends of the corpus is what actually
// pins full coverage: a bounded scan cannot return the first and last row at
// once, whichever end the tie-break happens to favour.
test("both ends of a regime's history are reachable in one corpus", () => {
  const oldest = queryEpisodicMemory(REGIME, ["canal", "dredging"]);
  const newest = queryEpisodicMemory(REGIME, ["final", "settlement"]);
  assert.match(oldest[0]?.content ?? "", /canal dredging/, "first-ever memory reachable");
  assert.match(newest[0]?.content ?? "", /final settlement/, "most recent memory reachable");
});

test("scoring ranks by keyword overlap, not by recency alone", () => {
  const hits = queryEpisodicMemory(REGIME, ["granary", "audit"]);
  assert.ok(hits.length > 0);
  for (const h of hits) assert.match(h.content, /granary audit/);
});

test("a query matching nothing returns empty rather than the newest rows", () => {
  assert.deepEqual(queryEpisodicMemory(REGIME, ["zzzznonexistent"]), []);
});

test("the result cap is honoured and overridable", () => {
  assert.ok(queryEpisodicMemory(REGIME, ["granary"]).length <= 3);
  assert.ok(queryEpisodicMemory(REGIME, ["granary"], { limit: 5 }).length <= 5);
});

test("an unknown regime yields no memories", () => {
  assert.deepEqual(queryEpisodicMemory("no-such-regime", ["granary"]), []);
});

// ── tokenizer ────────────────────────────────────────────────────────────────

test("extractKeywords drops stopwords and very short tokens", () => {
  const kw = extractKeywords("What should the Ministry of Revenue do about the granary?");
  for (const noise of ["what", "should", "the", "of", "do", "about"]) {
    assert.ok(!kw.includes(noise), `"${noise}" must be filtered out, got ${JSON.stringify(kw)}`);
  }
  assert.ok(kw.includes("ministry") && kw.includes("revenue") && kw.includes("granary"));
});

test("extractKeywords filters Chinese stopwords too", () => {
  const kw = extractKeywords("我们应该如何处理边境的饥荒问题");
  for (const noise of ["我们", "应该", "如何", "的"]) {
    assert.ok(!kw.includes(noise), `"${noise}" must be filtered, got ${JSON.stringify(kw)}`);
  }
});

test("extractKeywords tolerates empty and punctuation-only input", () => {
  assert.deepEqual(extractKeywords(""), []);
  assert.deepEqual(extractKeywords("，。！？"), []);
  assert.deepEqual(extractKeywords(null), []);
});
