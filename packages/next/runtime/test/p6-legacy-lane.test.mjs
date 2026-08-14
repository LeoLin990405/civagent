/**
 * p6-legacy-lane.test.mjs — L0 tests for the legacy factorial arm over the
 * frozen corpus (plan §19): deterministic cell selection, surface extraction,
 * paired blind judging, runtime labelling, honest missingness.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildLegacyCells, traceSurface, runLegacyLane, LEGACY_LANE_RUNTIME, STRATA, TASKS } from "../p6-legacy-lane.mjs";
import { LEGACY_INSTRUMENT } from "../../contracts/epoch-rules.mjs";

test("legacy cells: deterministic selection, full stratum/task/topology grid, honest missingness", () => {
  const a = buildLegacyCells();
  const b = buildLegacyCells();
  assert.deepEqual(a, b, "cell selection is deterministic");
  assert.equal(a.cells.length, 22, "24-cell grid minus 2 honest corpus gaps");
  assert.equal(a.missing.length, 2, "missing cells are recorded, never silently dropped");
  for (const m of a.missing) {
    assert.ok(STRATA.includes(m.stratum) && TASKS.includes(m.task));
    assert.ok(["historical", "random"].includes(m.topology));
  }
  for (const c of a.cells) {
    assert.equal(c.runtime, "legacy-cc-v5");
    assert.equal(c.instrumentVersion, LEGACY_INSTRUMENT);
    assert.ok(c.surfaceDigest.length === 64);
    assert.ok(c.surfaceText.length > 0, `cell ${c.cellId} has observable surface text`);
  }
});

test("traceSurface extracts committed turn texts (observable legacy field)", () => {
  const { cells } = buildLegacyCells();
  const c = cells[0];
  const again = traceSurface({ matchId: c.matchId });
  assert.equal(again, c.surfaceText, "surface is a pure function of the frozen trace");
  assert.match(c.surfaceText, /\S/);
});

test("legacy lane: runtime-labelled, blind swap-balanced pairs, deterministic analysis", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-legacytest-"));
  const ev = await runLegacyLane({ dir });
  assert.equal(ev.runtime, "legacy-cc-v5", "legacy arm never masquerades as native");
  assert.equal(ev.instrumentVersion, LEGACY_INSTRUMENT);
  assert.equal(ev.pairs.length, 10, "4 strata x 3 tasks minus missing historical cells");
  for (const p of ev.pairs) {
    assert.equal(p.runtime, "legacy-cc-v5");
    assert.equal(p.judgeBlind, true);
    assert.ok(p.arms.historical.digest !== p.arms.random.digest, "arms are distinct traces");
    assert.ok(p.arms.historical.matchId && p.arms.random.matchId, "judge inputs reconstructible from frozen traces");
  }
  const ev2 = await runLegacyLane({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "civ-legacytest2-")) });
  assert.equal(ev.analysis.digest, ev2.analysis.digest, "analysis deterministic");
});

test("no pooling: the legacy arm never enters the native pilot analysis", async () => {
  const { analyzePilot } = await import("../p6-pilot.mjs");
  const ev = await runLegacyLane({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "civ-legacytest3-")) });
  assert.ok(!("native" in ev), "no native label inside the legacy evidence");
  assert.ok(!ev.analysis.runtime || ev.analysis.runtime === "legacy-cc-v5");
});
