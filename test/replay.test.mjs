import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { readMatchMeta, replayMatch, RUN_V5 } from "../engine/v5/replay.mjs";
import { writeMeta, metaPath, matchDir } from "../engine/v5/events.mjs";

// Unique prefix so test matches don't collide with real matches.
const TEST_PREFIX = "test-replay-unit-";

function makeTestMatchId(suffix) {
  return `${TEST_PREFIX}${suffix}`;
}

// Clean up any test match directories after a test.
function cleanup(...matchIds) {
  for (const id of matchIds) {
    try {
      const dir = matchDir(id);
      fs.rmSync(dir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}

// Create a mock spawn that fires 'close' with the given exit code.
function mockSpawn(exitCode = 0) {
  let capturedArgs = null;
  let capturedEnv = null;
  const spawn = (cmd, args, opts) => {
    capturedArgs = [cmd, ...args];
    capturedEnv = opts?.env ?? {};
    const emitter = new EventEmitter();
    setImmediate(() => emitter.emit("close", exitCode));
    return emitter;
  };
  return { spawn, getCapturedArgs: () => capturedArgs, getCapturedEnv: () => capturedEnv };
}

// ── readMatchMeta ─────────────────────────────────────────────────────────────

test("readMatchMeta reads back what writeMeta wrote", () => {
  const matchId = makeTestMatchId("read-01");
  try {
    writeMeta(matchId, { regime: "china/tang", backend: "native", task: "test task" });
    const meta = readMatchMeta(matchId);
    assert.equal(meta.regime, "china/tang");
    assert.equal(meta.backend, "native");
    assert.equal(meta.task, "test task");
  } finally {
    cleanup(matchId);
  }
});

test("readMatchMeta throws for nonexistent matchId", () => {
  assert.throws(
    () => readMatchMeta("nonexistent-match-id-xyz"),
    /match not found/,
    "should throw with match not found message"
  );
});

// ── replayMatch ───────────────────────────────────────────────────────────────

test("replayMatch spawns run-v5 with the original regime/backend/task", async () => {
  const origMatchId = makeTestMatchId("orig-02");
  try {
    writeMeta(origMatchId, {
      regime: "china/tang",
      backend: "native",
      task: "handle the eastern famine",
      status: "done",
      exitCode: 0,
    });

    const { spawn, getCapturedArgs, getCapturedEnv } = mockSpawn(0);
    const result = await replayMatch(origMatchId, {
      _runV5: "/fake/run-v5.mjs",
      _spawn: spawn,
    });

    // Returns correct shape
    assert.ok(typeof result.newMatchId === "string", "newMatchId must be a string");
    assert.equal(result.exitCode, 0);

    // Spawned with correct args: node /fake/run-v5.mjs --backend native china/tang handle the eastern famine
    const args = getCapturedArgs();
    assert.equal(args[0], "node");
    assert.equal(args[1], "/fake/run-v5.mjs");
    assert.ok(args.includes("--backend"), "--backend flag required");
    assert.ok(args.includes("native"), "backend value required");
    assert.ok(args.includes("china/tang"), "regime required");
    assert.ok(args.includes("handle the eastern famine"), "task required");

    // Each replay gets the new matchId in CIVAGENT_MATCH_ID env
    const env = getCapturedEnv();
    assert.equal(env.CIVAGENT_MATCH_ID, result.newMatchId);

    // New match ID must be different from original
    assert.notEqual(result.newMatchId, origMatchId);

    // New match meta carries replayOf lineage
    const newMeta = readMatchMeta(result.newMatchId);
    assert.equal(newMeta.replayOf, origMatchId);
    assert.equal(newMeta.regime, "china/tang");
    assert.equal(newMeta.backend, "native");

    cleanup(result.newMatchId);
  } finally {
    cleanup(origMatchId);
  }
});

test("replayMatch uses the injectable _runV5 path (not the real RUN_V5)", async () => {
  const origMatchId = makeTestMatchId("orig-03");
  try {
    writeMeta(origMatchId, { regime: "global/athens", backend: "cn:glm", task: "plague" });
    const { spawn, getCapturedArgs } = mockSpawn(0);
    const result = await replayMatch(origMatchId, {
      _runV5: "/custom/run-v5-test.mjs",
      _spawn: spawn,
    });

    assert.equal(getCapturedArgs()[1], "/custom/run-v5-test.mjs");
    cleanup(result.newMatchId);
  } finally {
    cleanup(origMatchId);
  }
});

test("replayMatch propagates non-zero exit code", async () => {
  const origMatchId = makeTestMatchId("orig-04");
  try {
    writeMeta(origMatchId, { regime: "china/qin", backend: "native", task: "tax revolt" });
    const { spawn } = mockSpawn(2);
    const result = await replayMatch(origMatchId, {
      _runV5: "/fake/run-v5.mjs",
      _spawn: spawn,
    });
    assert.equal(result.exitCode, 2);

    const newMeta = readMatchMeta(result.newMatchId);
    assert.equal(newMeta.status, "failed");
    assert.equal(newMeta.exitCode, 2);
    cleanup(result.newMatchId);
  } finally {
    cleanup(origMatchId);
  }
});

test("replayMatch throws synchronously when the original match has no regime", () => {
  const origMatchId = makeTestMatchId("orig-05");
  try {
    writeMeta(origMatchId, { backend: "native", task: "some task" }); // no regime
    // replayMatch throws synchronously before returning a Promise when regime is absent.
    assert.throws(
      () => replayMatch(origMatchId, { _runV5: "/x", _spawn: mockSpawn().spawn }),
      /no regime/
    );
  } finally {
    cleanup(origMatchId);
  }
});

test("RUN_V5 export points to an existing file", () => {
  assert.ok(fs.existsSync(RUN_V5), `RUN_V5 path does not exist: ${RUN_V5}`);
});

test("replay match IDs include a 'replay-' prefix for easy log filtering", async () => {
  const origMatchId = makeTestMatchId("orig-06");
  try {
    writeMeta(origMatchId, { regime: "china/tang", backend: "native", task: "test" });
    const { spawn } = mockSpawn(0);
    const result = await replayMatch(origMatchId, {
      _runV5: "/fake/run-v5.mjs",
      _spawn: spawn,
    });
    assert.ok(result.newMatchId.startsWith("replay-"), "replay IDs must start with 'replay-'");
    cleanup(result.newMatchId);
  } finally {
    cleanup(origMatchId);
  }
});
