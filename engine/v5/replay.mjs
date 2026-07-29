// replay.mjs — re-run a past match with the same regime/backend/task (R2, revived).
//
// Reads the original match's meta.json and spawns run-v5.mjs with the same
// parameters. A new matchId is minted; the new meta.json carries `replayOf`
// for lineage tracking. Replaying a replay chases `replayOf` back to the
// original, so lineage never nests (replay-of-replay-of-… ids cannot grow).

import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { metaPath, writeMeta } from "./events.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RUN_V5 = path.join(__dirname, "run-v5.mjs");

// Read and parse a past match's meta.json. Throws if not found.
export function readMatchMeta(matchId) {
  const p = metaPath(matchId);
  if (!fs.existsSync(p)) throw new Error(`match not found: ${matchId} (looked for ${p})`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function newReplayId(originalMatchId) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 23);
  const rand = Math.random().toString(36).slice(2, 6);
  // Embed the original id prefix so logs stay readable.
  const prefix = String(originalMatchId).slice(0, 12).replace(/[^a-z0-9-]/gi, "-");
  return `replay-${prefix}-${stamp}-${rand}`;
}

// Build the child env: start from the parent env but drop every CIVAGENT_*
// variable so state from the calling context (an in-flight tournament, a
// previous replay) can never leak into the replayed match. Only the new
// match id is passed. (Codex review P1: the original R2 draft inherited the
// caller's env wholesale.)
export function replayChildEnv(newMatchId, baseEnv = process.env) {
  const env = {};
  for (const [k, v] of Object.entries(baseEnv)) {
    if (k.startsWith("CIVAGENT_")) continue;
    env[k] = v;
  }
  env.CIVAGENT_MATCH_ID = newMatchId;
  return env;
}

// Replay a past match. Returns a Promise<{ newMatchId, replayOf, exitCode }>.
// Accepts injectable _spawn and _runV5 for testing.
export function replayMatch(originalMatchId, {
  _runV5 = RUN_V5,
  _spawn = spawn,
} = {}) {
  let meta = readMatchMeta(originalMatchId);
  // Chase lineage: replaying a replay re-runs the ORIGINAL match, so the
  // replayOf field always points at a root match and ids never nest.
  let rootId = originalMatchId;
  const seen = new Set([rootId]);
  while (meta.replayOf) {
    if (seen.has(meta.replayOf)) break; // defensive: broken lineage loop on disk
    rootId = meta.replayOf;
    seen.add(rootId);
    meta = readMatchMeta(rootId);
  }

  const { regime, backend = "native", task } = meta;
  if (!regime) throw new Error(`original match ${rootId} has no regime in meta.json`);

  const newMatchId = newReplayId(rootId);
  writeMeta(newMatchId, {
    replayOf: rootId,
    regime,
    backend,
    task,
    status: "running",
    startedAt: Date.now(),
  });

  return new Promise((resolve, reject) => {
    const args = [_runV5, "--backend", backend, regime];
    if (task) args.push(task);

    const proc = _spawn("node", args, {
      stdio: "inherit",
      env: replayChildEnv(newMatchId),
    });

    proc.on("error", (err) => {
      writeMeta(newMatchId, { status: "failed", error: err.message, endedAt: Date.now() });
      reject(err);
    });

    proc.on("close", (code) => {
      writeMeta(newMatchId, {
        status: code === 0 ? "done" : "failed",
        exitCode: code,
        endedAt: Date.now(),
      });
      resolve({ newMatchId, replayOf: rootId, exitCode: code });
    });
  });
}

// CLI: node engine/v5/replay.mjs <matchId>
if (import.meta.url === `file://${process.argv[1]}`) {
  const matchId = process.argv[2];
  if (!matchId) {
    console.error("Usage: node engine/v5/replay.mjs <matchId>");
    process.exit(1);
  }
  replayMatch(matchId)
    .then(({ newMatchId, replayOf, exitCode }) => {
      console.log(`[replay] ${replayOf} → ${newMatchId} (exit ${exitCode})`);
      process.exit(exitCode ?? 0);
    })
    .catch((e) => {
      console.error(`[replay] ${e.message}`);
      process.exit(1);
    });
}
