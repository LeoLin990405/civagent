/**
 * p6.test.mjs — L0 tests for the P6 pilot machinery (plan §19, P6
 * preregistration): determinism, budget enforcement, strata isolation,
 * no pooling, reproducible assignments.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { runP6Pilot, analyzePilot, seededPermutation, PILOT_STRATA, PILOT_TOPOLOGIES, PILOT_TASKS, P6_INSTRUMENT } from "../p6-pilot.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "civ-p6test-"));
}

test("pilot is fully deterministic: same inputs -> same assignments and analysis digest", () => {
  const a = runP6Pilot({ dir: tmpDir() });
  const b = runP6Pilot({ dir: tmpDir() });
  assert.equal(a.assignmentsDigest, b.assignmentsDigest, "assignments digest identical");
  assert.equal(a.analysis.digest, b.analysis.digest, "analysis digest identical");
  assert.deepEqual(a.cells.map((c) => c.evidenceDigest), b.cells.map((c) => c.evidenceDigest), "per-cell evidence identical");
});

test("design matrix is complete and reproducible: 24 cells, 12 pairs, 4 strata blocks", () => {
  const ev = runP6Pilot({ dir: tmpDir() });
  assert.equal(ev.cells.length, 24, "4 strata x 2 topologies x 3 tasks x 1 seed");
  assert.equal(ev.judging.length, 12, "4 strata x 3 tasks pairs");
  const strataUsed = new Set(ev.cells.map((c) => c.stratum));
  assert.deepEqual([...strataUsed].sort(), [...PILOT_STRATA].sort());
  const toposUsed = new Set(ev.cells.map((c) => c.topology));
  assert.deepEqual([...toposUsed].sort(), [...PILOT_TOPOLOGIES].sort());
  const tasksUsed = new Set(ev.cells.map((c) => c.task));
  assert.deepEqual([...tasksUsed].sort(), [...PILOT_TASKS].sort());
});

test("budget caps fail cells closed: recorded in missingness, never silently dropped", () => {
  // cell usage is 35 tokens; a budget of 30 must fail every cell closed
  const ev = runP6Pilot({ dir: tmpDir(), budget: 30 });
  assert.equal(ev.cells.every((c) => c.status === "budget_overflow"), true);
  assert.equal(ev.missingness.budgetOverflow.length, 24, "every overflow recorded");
  assert.equal(ev.missingness.failedCellsInDenominator, 24, "failed cells stay in the denominator");
  // no judging pairs can be formed from failed cells
  assert.equal(ev.judging.length, 0);
});

test("strata never pool: analysis is per-stratum and runtime-labelled", () => {
  const ev = runP6Pilot({ dir: tmpDir() });
  assert.equal(ev.analysis.runtime, P6_INSTRUMENT);
  for (const s of PILOT_STRATA) {
    assert.ok(ev.analysis.byStratum[s], `stratum ${s} has its own row`);
    assert.equal(ev.analysis.byStratum[s].cells, 6);
  }
  assert.ok(!("legacy-cc-v5" in ev.analysis), "legacy epoch never enters the pilot analysis");
  assert.equal(ev.analysis.topologyEffect.pairs, 12);
});

test("seeded permutation is deterministic and seed-sensitive", () => {
  const a = seededPermutation(8, 1);
  const b = seededPermutation(8, 1);
  const c = seededPermutation(8, 2);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c, "different seed -> different order");
  assert.deepEqual([...a].sort(), [0, 1, 2, 3, 4, 5, 6, 7], "permutation covers all arms");
});

test("analysis is a pure function of cells + judging (recomputable)", () => {
  const ev = runP6Pilot({ dir: tmpDir() });
  const recomputed = analyzePilot(ev.cells, ev.judging);
  assert.deepEqual(recomputed, ev.analysis, "analysis recomputes identically from pinned evidence");
});
