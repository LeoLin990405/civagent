// history-db-degrade.test.mjs — the DB-unavailable degradation path.
//
// recordTournamentResult() runs in the match's main flow (tournament.mjs:400).
// If it ever threw when the DB could not be opened, it would take down the whole
// match's tail — the foundational invariant of this module. This file loads
// history-db.mjs under a HOME that CANNOT hold a DB file (HOME points at a real
// file, so the .civagent dir cannot be created → getDb() returns null), then
// asserts every exported entry point degrades to a no-op / empty result without
// throwing.
//
// Lives in its own file (own node process under `node --test test/*.test.mjs`)
// so its poisoned HOME never touches the happy-path module instance in
// history-db.test.mjs.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// HOME = a real file. history-db.mjs builds dbPath as
// path.join(os.homedir(), '.civagent', 'civagent_history.db'); its getDb() does
// fs.mkdirSync(path.dirname(dbPath), { recursive: true }), which throws ENOTDIR
// because <file>/.civagent sits under a non-directory. getDb() catches that,
// sets dbFailed=true, and returns null.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-hist-degrade-"));
const POISON_FILE = path.join(TMP, "i-am-a-file-not-a-dir");
fs.writeFileSync(POISON_FILE, "x");
process.env.HOME = POISON_FILE;

const { recordTournamentResult, queryEpisodicMemory } = await import("../engine/v5/history-db.mjs");

before(() => {
  // Sanity: confirm the module actually failed to open the DB (dbFailed flipped).
  // We observe this indirectly: every call must return null/[] without writing.
});

after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

test("recordTournamentResult does not throw and writes nothing when the DB cannot be opened", () => {
  assert.doesNotThrow(() =>
    recordTournamentResult("should-not-land", { task: "t", judge: null }, [
      { matchId: "m", regime: "tang", score: 8, reason: "r", commentary: "c" },
    ])
  );
  // Nothing could have been written — no DB file under the poisoned HOME.
  assert.ok(!fs.existsSync(path.join(POISON_FILE, ".civagent", "civagent_history.db")));
});

test("queryEpisodicMemory returns [] (does not throw) when the DB cannot be opened", () => {
  assert.doesNotThrow(() => queryEpisodicMemory("tang", ["famine"]));
  assert.deepEqual(queryEpisodicMemory("tang", ["famine"]), []);
});
