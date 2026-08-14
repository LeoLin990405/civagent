/**
 * crash-matrix.mjs — P3: SIGKILL durability matrix (plan §17 P3).
 *
 * Spawns crash-worker.mjs children, SIGKILLs them at every durability
 * boundary, then verifies:
 *   - the verified committed prefix survives intact (no malformed inside,
 *     no silent truncation, no half record visible);
 *   - recovery classifies conservatively (START_OUTCOME_UNKNOWN /
 *     EFFECT_OUTCOME_UNKNOWN / NOT_STARTED / COMPLETED per boundary);
 *   - generation N is sealed byte-for-byte and generation N+1 links the seal.
 *
 * Usage:
 *   node packages/next/runtime/crash-matrix.mjs [--trials N] [--boundaries a,b,c]
 *   (default trials = 100 per boundary, plan acceptance)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Cas } from "../evidence/cas.mjs";
import { verifySegment } from "../evidence/segment.mjs";
import { recoverSegment } from "./recovery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CRASH_REPORT_DIR = path.join(__dirname, "reports");
const WORKER = path.join(__dirname, "crash-worker.mjs");

export const BOUNDARIES = [
  "before_start_intent",
  "after_start_intent",
  "mid_receipt",
  "after_receipt",
  "mid_terminal",
  "after_terminal",
];

/** Expected classification per boundary (conservative, never optimistic). */
export const EXPECTED_CLASSIFICATION = {
  before_start_intent: "NOT_STARTED",
  after_start_intent: "START_OUTCOME_UNKNOWN",
  mid_receipt: "START_OUTCOME_UNKNOWN", // receipt partial => never durable
  after_receipt: "EFFECT_OUTCOME_UNKNOWN",
  mid_terminal: "EFFECT_OUTCOME_UNKNOWN", // terminal partial => never durable
  after_terminal: "COMPLETED",
};

/** Expected committed record count per boundary (events 0..N committed). */
export const EXPECTED_COMMITTED = {
  before_start_intent: 0,
  after_start_intent: 3,
  mid_receipt: 3,
  after_receipt: 5,
  mid_terminal: 6,
  after_terminal: 7,
};

function waitForCheckpoint(checkpointDir, names, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  const found = new Set();
  while (Date.now() < deadline) {
    for (const n of names) {
      if (fs.existsSync(path.join(checkpointDir, n))) found.add(n);
    }
    if ([...names].every((n) => found.has(n))) return true;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  }
  return false;
}

/**
 * One SIGKILL trial at one boundary. Returns {ok, violations[], classification,
 * committedLength, sealDigest?}.
 */
export function runTrial({ boundary, dir, seed }) {
  const violations = [];
  const checkpointDir = path.join(dir, "ckpt");
  const segmentsDir = path.join(dir, "segments");
  const segmentFile = path.join(segmentsDir, "segment-000001.jsonl");
  fs.mkdirSync(checkpointDir, { recursive: true });
  fs.mkdirSync(segmentsDir, { recursive: true });

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [WORKER, segmentFile, boundary, checkpointDir], { stdio: "ignore" });
    const deadline = Date.now() + 15000;
    const poll = () => {
      const names = boundary === "mid_receipt" || boundary === "mid_terminal"
        ? [`cp-partial-${EXPECTED_COMMITTED[boundary]}`]
        : boundary === "after_terminal"
          ? ["done"]
          : boundary === "before_start_intent"
            ? ["ready"]
            : [`cp-${EXPECTED_COMMITTED[boundary] - 1}`];
      const ready = names.every((n) => fs.existsSync(path.join(checkpointDir, n)));
      if (ready) {
        child.kill("SIGKILL");
        child.once("exit", () => finish());
      } else if (Date.now() > deadline) {
        child.kill("SIGKILL");
        child.once("exit", () => {
          violations.push("checkpoint timeout");
          finish();
        });
      } else {
        setTimeout(poll, 5);
      }
    };
    const finish = () => {
      try {
        const result = verifyTrial({ segmentFile, segmentsDir, boundary, violations, dir });
        resolve(result);
      } catch (e) {
        resolve({ ok: false, violations: [...violations, `verify threw: ${e.message}`] });
      }
    };
    poll();
  });
}

function verifyTrial({ segmentFile, segmentsDir, boundary, violations, dir }) {
  // segment may not exist when the crash preceded any write
  if (!fs.existsSync(segmentFile)) {
    if (boundary === "before_start_intent") {
      return { ok: true, violations, classification: "NOT_STARTED", committedLength: 0 };
    }
    violations.push("segment file missing");
    return { ok: false, violations };
  }
  const v = verifySegment(segmentFile);
  if (v.malformedInside) violations.push("malformed record inside committed prefix");
  if (v.committedLength !== EXPECTED_COMMITTED[boundary]) {
    violations.push(`committedLength ${v.committedLength} != expected ${EXPECTED_COMMITTED[boundary]}`);
  }
  if (boundary !== "after_terminal" && !v.incompleteTail) violations.push("expected an uncommitted tail after crash");
  // recovery must classify conservatively and seal generation N
  const cas = new Cas(dir);
  let recovery;
  try {
    recovery = recoverSegment({ segmentFile, segmentsDir, cas });
  } catch (e) {
    violations.push(`recovery threw: ${e.message}`);
    return { ok: violations.length === 0, violations };
  }
  if (recovery.classification !== EXPECTED_CLASSIFICATION[boundary]) {
    violations.push(`classification ${recovery.classification} != expected ${EXPECTED_CLASSIFICATION[boundary]}`);
  }
  if (!cas.exists(recovery.sealDigest)) violations.push("seal not in CAS");
  if (recovery.verified.generation !== 1) violations.push(`sealed generation ${recovery.verified.generation}`);
  return { ok: violations.length === 0, violations, classification: recovery.classification, committedLength: v.committedLength, sealDigest: recovery.sealDigest };
}

/** Run the full matrix: trials per boundary (default 100). */
export async function runMatrix({ trials = 100, boundaries = BOUNDARIES, reportFile } = {}) {
  const results = {};
  let failures = 0;
  let trialsRun = 0;
  for (const boundary of boundaries) {
    const perBoundary = { trials: 0, ok: 0, violations: [], classifications: {} };
    for (let t = 0; t < trials; t++) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), `civ-crash-${boundary}-`));
      const r = await runTrial({ boundary, dir, seed: t });
      trialsRun++;
      perBoundary.trials++;
      perBoundary.classifications[r.classification ?? "none"] = (perBoundary.classifications[r.classification ?? "none"] ?? 0) + 1;
      if (r.ok) {
        perBoundary.ok++;
      } else {
        failures++;
        perBoundary.violations.push({ trial: t, violations: r.violations });
        if (perBoundary.violations.length > 5) {
          // record the first few, keep counting
          perBoundary.violationsDropped = perBoundary.violationsDropped ?? 0;
          perBoundary.violationsDropped++;
          perBoundary.violations.pop();
        }
      }
      fs.rmSync(dir, { recursive: true, force: true });
    }
    results[boundary] = perBoundary;
  }
  const report = {
    schema: "crash-matrix/1",
    instrumentVersion: "native-next-v1-crash",
    trialsPerBoundary: trials,
    boundaries,
    totals: { trialsRun, failures, pass: trialsRun - failures, passRate: 1 - failures / trialsRun },
    results,
  };
  if (reportFile) {
    fs.mkdirSync(CRASH_REPORT_DIR, { recursive: true });
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n");
  }
  return report;
}

function main() {
  const argv = process.argv.slice(2);
  const trialsArg = argv.indexOf("--trials");
  const trials = trialsArg >= 0 ? Number(argv[trialsArg + 1]) : 100;
  const bArg = argv.indexOf("--boundaries");
  const boundaries = bArg >= 0 ? argv[bArg + 1].split(",") : BOUNDARIES;
  const reportFile = path.join(CRASH_REPORT_DIR, `crash-matrix-${trials}x${boundaries.length}.json`);
  runMatrix({ trials, boundaries, reportFile }).then((report) => {
    console.log(JSON.stringify({
      trialsPerBoundary: report.trialsPerBoundary,
      totals: report.totals,
      perBoundary: Object.fromEntries(Object.entries(report.results).map(([b, r]) => [b, { ok: r.ok, trials: r.trials, classifications: r.classifications }])),
      reportFile,
    }, null, 2));
    process.exit(report.totals.failures === 0 ? 0 : 1);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
