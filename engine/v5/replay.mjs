// replay.mjs — re-run a past match with the same regime/backend/task.
//
// Reads the original match's meta.json and spawns run-v5.mjs with the same
// parameters. A new matchId is minted; the new meta.json carries `replayOf`
// for lineage tracking.

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

function newReplayId(originalMatchId) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 23);
  const rand = Math.random().toString(36).slice(2, 6);
  // Embed the original id prefix so logs stay readable.
  const prefix = String(originalMatchId).slice(0, 12).replace(/[^a-z0-9-]/gi, "-");
  return `replay-${prefix}-${stamp}-${rand}`;
}

// Replay a past match. Returns a Promise<{ newMatchId, exitCode }>.
// Accepts injectable _spawn and _runV5 for testing.
export function replayMatch(originalMatchId, {
  _runV5 = RUN_V5,
  _spawn = spawn,
} = {}) {
  const meta = readMatchMeta(originalMatchId);
  const { regime, backend = "native", task } = meta;
  if (!regime) throw new Error(`original match ${originalMatchId} has no regime in meta.json`);

  const newMatchId = newReplayId(originalMatchId);
  writeMeta(newMatchId, {
    replayOf: originalMatchId,
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
      env: { ...process.env, CIVAGENT_MATCH_ID: newMatchId },
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
      resolve({ newMatchId, exitCode: code });
    });
  });
}
