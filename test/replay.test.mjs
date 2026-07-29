// replay.test.mjs — R2 match replay, revived for v6.
// Uses an isolated HOME (events.mjs derives ~/.civagent from os.homedir()) via
// child fixtures written directly, plus an injected fake spawn — no real
// backend is ever launched.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { replayMatch, replayChildEnv, newReplayId, readMatchMeta } from "../engine/v5/replay.mjs";
import { writeMeta, metaPath } from "../engine/v5/events.mjs";

function fakeSpawnFactory(calls, exitCode = 0) {
  return (cmd, args, opts) => {
    const proc = new EventEmitter();
    calls.push({ cmd, args, opts });
    setImmediate(() => proc.emit("close", exitCode));
    return proc;
  };
}

test("replayChildEnv strips CIVAGENT_* and injects only the new match id", () => {
  const env = replayChildEnv("new-id", {
    HOME: "/home/leo",
    CIVAGENT_MATCH_ID: "stale-id",
    CIVAGENT_ENGINE: "/stale",
    PATH: "/usr/bin",
  });
  assert.equal(env.CIVAGENT_MATCH_ID, "new-id");
  assert.equal(env.CIVAGENT_ENGINE, undefined, "stale CIVAGENT_* removed");
  assert.equal(env.HOME, "/home/leo");
  assert.equal(env.PATH, "/usr/bin");
});

test("newReplayId embeds the original prefix and never nests 'replay-' chains visually", () => {
  const id = newReplayId("2026-07-29T10-00-00-abcd");
  assert.match(id, /^replay-2026-07-29T1-/, "first 12 chars of the original id embedded");
});

test("replayMatch re-runs with original regime/backend/task and records lineage", async () => {
  const matchId = `test-replay-src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  writeMeta(matchId, { regime: "china/tang", backend: "cn:glm", task: "test the canal" });
  const calls = [];
  try {
    const { newMatchId, replayOf, exitCode } = await replayMatch(matchId, {
      _spawn: fakeSpawnFactory(calls),
      _runV5: "/fake/run-v5.mjs",
    });
    assert.equal(exitCode, 0);
    assert.equal(replayOf, matchId);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].args, ["/fake/run-v5.mjs", "--backend", "cn:glm", "china/tang", "test the canal"]);
    assert.equal(calls[0].opts.env.CIVAGENT_MATCH_ID, newMatchId);

    const newMeta = readMatchMeta(newMatchId);
    assert.equal(newMeta.replayOf, matchId);
    assert.equal(newMeta.status, "done");
    assert.equal(newMeta.regime, "china/tang");
    fs.rmSync(path.dirname(metaPath(newMatchId)), { recursive: true, force: true });
  } finally {
    fs.rmSync(path.dirname(metaPath(matchId)), { recursive: true, force: true });
  }
});

test("replaying a replay chases lineage back to the root (no nesting)", async () => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const rootId = `test-replay-root-${stamp}`;
  const childId = `test-replay-child-${stamp}`;
  writeMeta(rootId, { regime: "china/qin", backend: "native", task: "unify weights" });
  writeMeta(childId, { replayOf: rootId, regime: "china/qin", backend: "native", task: "unify weights" });
  const calls = [];
  try {
    const { newMatchId, replayOf } = await replayMatch(childId, {
      _spawn: fakeSpawnFactory(calls),
      _runV5: "/fake/run-v5.mjs",
    });
    assert.equal(replayOf, rootId, "lineage points at the ROOT, not the intermediate replay");
    assert.equal(readMatchMeta(newMatchId).replayOf, rootId);
    fs.rmSync(path.dirname(metaPath(newMatchId)), { recursive: true, force: true });
  } finally {
    fs.rmSync(path.dirname(metaPath(rootId)), { recursive: true, force: true });
    fs.rmSync(path.dirname(metaPath(childId)), { recursive: true, force: true });
  }
});

test("replayMatch of a failing child records status=failed", async () => {
  const matchId = `test-replay-fail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  writeMeta(matchId, { regime: "china/han", backend: "native", task: "t" });
  const calls = [];
  try {
    const { newMatchId, exitCode } = await replayMatch(matchId, {
      _spawn: fakeSpawnFactory(calls, 1),
      _runV5: "/fake/run-v5.mjs",
    });
    assert.equal(exitCode, 1);
    assert.equal(readMatchMeta(newMatchId).status, "failed");
    fs.rmSync(path.dirname(metaPath(newMatchId)), { recursive: true, force: true });
  } finally {
    fs.rmSync(path.dirname(metaPath(matchId)), { recursive: true, force: true });
  }
});

test("replayMatch of an unknown match throws", () => {
  assert.throws(() => readMatchMeta("no-such-match-id-xyz"), /match not found/);
});

// Codex review R5 P1(3): metaPath() joins the id straight onto
// ~/.civagent/matches and matchDir() CREATES that directory before the read,
// so a traversing id both escaped the root and left a directory behind.
test("readMatchMeta rejects ids that would escape ~/.civagent/matches", () => {
  for (const bad of ["../../../../tmp/civagent-escape-probe", "a/b", "..", ".", "./x", "x\\y"]) {
    assert.throws(() => readMatchMeta(bad), /unsafe match id/, `must reject ${JSON.stringify(bad)}`);
  }
  assert.ok(
    !fs.existsSync("/tmp/civagent-escape-probe"),
    "a rejected id must not have created a directory on the way out",
  );
});

test("a damaged replayOf pointer is rejected, not followed", async () => {
  const matchId = `test-replay-evil-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  writeMeta(matchId, {
    replayOf: "../../../../tmp/civagent-lineage-probe",
    regime: "china/tang",
    backend: "native",
    task: "t",
  });
  try {
    await assert.rejects(
      () => replayMatch(matchId, { _spawn: fakeSpawnFactory([]), _runV5: "/fake/run-v5.mjs" }),
      /unsafe replayOf lineage id/,
    );
    assert.ok(!fs.existsSync("/tmp/civagent-lineage-probe"), "no directory created off the bad pointer");
  } finally {
    fs.rmSync(path.dirname(metaPath(matchId)), { recursive: true, force: true });
  }
});
