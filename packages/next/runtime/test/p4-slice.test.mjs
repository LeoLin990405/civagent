/**
 * p4-slice.test.mjs — L0 tests for the P4 end-to-end slice evidence.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runP4Slice, P4_REPORT_DIR } from "../p4-slice.mjs";
import { readCommittedEvents } from "../../evidence/segment.mjs";
import { validateCanonicalEvent, assertEpochSeparation, assertIdDiscipline } from "../../contracts/epoch-rules.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("P4 slice: eligibility denials, swap-balanced blind judge, skills, raw evidence survives", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-p4test-"));
  const ev = await runP4Slice({ dir });
  // denials
  const labels = new Map(ev.denialEvidence.map((d) => [d.label, d.denied]));
  assert.equal(labels.get("one-sided pair"), true);
  assert.equal(labels.get("unknown stratum"), true);
  assert.equal(labels.get("missing seed"), true);
  assert.equal(labels.get("global cap"), true);
  // judge
  assert.equal(ev.judge.swapBalanced, true);
  assert.equal(ev.judge.passes.length, 2);
  assert.equal(ev.judge.aggregate.passes, 2);
  for (const p of ev.judge.passes) {
    assert.equal(p.purpose, "judge", "judge calls are purpose-labelled");
    assert.ok(p.operationId, "judge calls are correlated");
    for (const dim of ["legality", "feasibility", "resilience"]) {
      assert.ok(Number.isInteger(p.scores.A[dim]) && p.scores.A[dim] >= 1 && p.scores.A[dim] <= 4, "anchored rubric scale");
      assert.ok(Number.isInteger(p.scores.B[dim]));
    }
  }
  assert.equal(ev.judge.blindInputNoMetadata, true);
  // skills
  assert.equal(ev.skills.skill1.state, "PROMOTED");
  assert.equal(ev.skills.skill2.state, "REJECTED");
  assert.ok(ev.skills.matchSkillSetDigest.length === 64);
  // raw evidence survives projections
  assert.equal(ev.rawEvidence.survives, true);
  assert.equal(ev.rawEvidence.joined, true);
  assert.deepEqual(ev.rawEvidence.ownedMatches.sort(), ["p4-m-qin", "p4-m-tang"]);
  // strata explicit
  assert.deepEqual(ev.strata.blocks, ["cn:doubao", "cn:glm", "cn:qwen", "cn:minimax"]);
  // every committed event validates, single epoch, ID discipline
  const committed = readCommittedEvents(path.join(dir, "segments", "segment-000001.jsonl"));
  for (const e of committed) {
    const violations = validateCanonicalEvent(e);
    assert.deepEqual(violations, [], `event ${e.type}: ${violations.join("; ")}`);
  }
  assertEpochSeparation(committed);
  assertIdDiscipline(committed);
  // ranking is epoch-scoped
  assert.equal(ev.tournament.epoch, "native-next-v1");
  assert.equal(ev.tournament.instrumentVersion, "native-next-v1-p4slice");
  // report file exists
  assert.ok(fs.existsSync(path.join(P4_REPORT_DIR, "p4-slice-evidence.json")));
});
