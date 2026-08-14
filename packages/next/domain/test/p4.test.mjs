/**
 * p4.test.mjs — L0 tests for P4: tournament scheduling/eligibility, paired
 * blind judging, skill provenance, and the P4 slice evidence.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Tournament, checkEligibility, EligibilityError, E3_STRATA_BLOCKS } from "../tournament.mjs";
import { blindPresentation, aggregateScores, judgeEligible, RUBRIC_DIMENSIONS } from "../judge.mjs";
import { Skill, skillSetDigest } from "../skills.mjs";
import { RegimeCompiler } from "../regime-ir.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGIMES = path.resolve(__dirname, "../../../../regimes");
const TANG = path.join(REGIMES, "china/tang");

function mkTournament(overrides = {}) {
  return new Tournament({
    tournamentId: "t1", epoch: "native-next-v1", instrumentVersion: "iv-1", designVersion: "d1",
    task: "task", deadlineMs: Date.now() + 60_000, caps: { global: 2, perParent: 1, perOffice: 1 },
    ...overrides,
  });
}

test("eligibility: one-sided pairs, unknown strata, missing seeds are denied; solo is explicit", () => {
  assert.ok(checkEligibility({ regime: "r", ir: {}, provider: "p", stratum: "cn:doubao", seed: 1, paired: { completed: true } }).length === 0);
  assert.ok(checkEligibility({ regime: "r", ir: {}, provider: "p", stratum: "cn:doubao", seed: 1, paired: null }).length > 0, "one-sided denied");
  assert.ok(checkEligibility({ regime: "r", ir: {}, provider: "p", stratum: "cn:mystery", seed: 1, paired: { completed: true } }).length > 0, "unknown stratum denied");
  assert.ok(checkEligibility({ regime: "r", ir: {}, provider: "p", stratum: "cn:doubao", paired: { completed: true } }).length > 0, "missing seed denied");
  assert.ok(checkEligibility({ regime: "r", ir: {}, provider: "p", stratum: "cn:doubao", seed: 1, solo: true }).length === 0, "explicit solo allowed");
});

test("tournament caps bound fan-out; admission beyond caps is denied", () => {
  const t = mkTournament();
  t.admit({ matchId: "m1", regime: "china/tang", ir: {}, provider: "p", stratum: "cn:doubao", seed: 1, arm: "A", paired: { completed: true } });
  t.admit({ matchId: "m2", regime: "china/qin", ir: {}, provider: "p", stratum: "cn:doubao", seed: 1, arm: "B", paired: { completed: true } });
  assert.throws(() => t.admit({ matchId: "m3", regime: "china/ming", ir: {}, provider: "p", stratum: "cn:glm", seed: 1, arm: "A", paired: { completed: true } }), EligibilityError, "global cap 2 reached");
});

test("deadline closes admission; late matches cannot enter the pool", () => {
  const t = mkTournament({ deadlineMs: Date.now() - 1 });
  assert.throws(() => t.admit({ matchId: "m1", regime: "china/tang", ir: {}, provider: "p", stratum: "cn:doubao", seed: 1, paired: { completed: true } }), EligibilityError, "deadline passed");
  assert.equal(t.closedForAdmission, true);
});

test("no detached runs: a match must be owned by its tournament", () => {
  const t = mkTournament();
  t.admit({ matchId: "m1", regime: "china/tang", ir: {}, provider: "p", stratum: "cn:doubao", seed: 1, paired: { completed: true } });
  assert.throws(() => t.startMatch("not-mine"), /not owned/);
  t.assertOwned("m1");
  t.startMatch("m1");
  assert.equal(t.running, 1);
  t.terminalMatch("m1", { status: "done", score: 5 });
  assert.equal(t.joined(), true);
});

test("four E3 strata are explicit blocks and never mixed silently", () => {
  assert.deepEqual(E3_STRATA_BLOCKS, ["cn:doubao", "cn:glm", "cn:qwen", "cn:minimax"]);
  const t = mkTournament();
  t.admit({ matchId: "m1", regime: "china/tang", ir: {}, provider: "p", stratum: "cn:doubao", seed: 1, paired: { completed: true } });
  const sn = t.snapshot();
  assert.equal(sn.matches[0].stratum, "cn:doubao");
  assert.equal(sn.epoch, "native-next-v1");
});

test("blind presentation strips regime/backend/model metadata; swap balances order", () => {
  const arm = (label, text) => ({ label, surfaceText: text, evidenceDigest: "d" });
  const p1 = blindPresentation(arm("tang", "t"), arm("qin", "q"), { swap: false });
  assert.deepEqual(Object.keys(p1.A), ["surfaceText"], "no regime/backend/model metadata in judge input");
  assert.equal(p1.A.surfaceText, "t");
  assert.equal(p1.swap, false);
  const p2 = blindPresentation(arm("tang", "t"), arm("qin", "q"), { swap: true });
  assert.equal(p2.A.surfaceText, "q", "swap exchanges presentation order");
});

test("aggregateScores is swap-consistent and deterministic", () => {
  // pass scores are "as judged": in a swapped pass, A = the second-presented
  // civ (the B arm); aggregateScores un-swaps deterministically
  const pass1 = { swap: false, scores: { A: { legality: 3, feasibility: 2, resilience: 3 }, B: { legality: 2, feasibility: 3, resilience: 2 } } };
  const pass2 = { swap: true, scores: { A: { legality: 2, feasibility: 3, resilience: 2 }, B: { legality: 3, feasibility: 2, resilience: 3 } } };
  const agg1 = aggregateScores([pass1, pass2]);
  const agg2 = aggregateScores([pass1, pass2]);
  assert.deepEqual(agg1, agg2, "deterministic aggregation");
  assert.equal(agg1.total.A, 8);
  assert.equal(agg1.total.B, 7);
  assert.equal(agg1.passes, 2);
});

test("judgeEligible rejects one-sided pairs and unreconstructible inputs", () => {
  assert.deepEqual(judgeEligible({ armA: { surfaceText: "a", evidenceDigest: "d1" }, armB: { surfaceText: "b", evidenceDigest: "d2" }, evidenceDigests: ["d1", "d2"] }), []);
  assert.ok(judgeEligible({ armA: { surfaceText: "a", evidenceDigest: "d1" }, armB: { surfaceText: "b", evidenceDigest: "d1" }, evidenceDigests: ["d1", "d1"] }).length > 0, "identical arms are one-sided");
  assert.ok(judgeEligible({ armA: { surfaceText: "", evidenceDigest: "d1" }, armB: { surfaceText: "b", evidenceDigest: "d2" }, evidenceDigests: ["d1", "d2"] }).length > 0);
});

test("skill provenance: proposed -> audited -> promoted -> revoked; reject path; set digest pins only promoted", () => {
  const s = new Skill({ skillId: "s1", contentHash: "h1", authorMatchId: "m1", extractorCallId: "op1", body: "b" });
  assert.equal(s.state, "PROPOSED");
  assert.throws(() => s.promoted({ approvalIdentity: "x" }), /cannot promote without an approving audit/);
  s.audited({ auditCallId: "op2", auditProvider: "fake", verdict: "approve" });
  s.promoted({ approvalIdentity: "approver-1" });
  assert.equal(s.state, "PROMOTED");
  s.revoked("superseded");
  assert.equal(s.state, "REVOKED");
  const r = new Skill({ skillId: "s2", contentHash: "h2", authorMatchId: "m2", extractorCallId: "op3", body: "c" });
  r.audited({ auditCallId: "op4", auditProvider: "fake", verdict: "reject" });
  r.rejected();
  assert.equal(r.state, "REJECTED");
  const promoted = new Skill({ skillId: "s3", contentHash: "h3", authorMatchId: "m3", extractorCallId: "op5", body: "d" });
  promoted.audited({ auditCallId: "op6", auditProvider: "fake", verdict: "approve" });
  promoted.promoted({ approvalIdentity: "approver-2" });
  const digest1 = skillSetDigest([s, r, promoted]); // s revoked, r rejected -> only s3 counts
  const digest2 = skillSetDigest([promoted]);
  assert.equal(digest1, digest2, "set digest pins only promoted skills");
  assert.equal(skillSetDigest([]).length, 64);
});
