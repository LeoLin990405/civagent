/**
 * judge.mjs — P4 domain: paired blind multi-judge with swap balance.
 *
 * Ports the legacy anchored rubric (engine/v5/judge-rubric.mjs): three
 * dimensions (legality, feasibility, resilience) on an anchored 4-point
 * integer scale, scored blind. Judge calls are purpose-labelled ("judge") and
 * 100% correlated to matchId/sessionId/turnId/operationId (plan §12.3).
 *
 * Blinding: the judge input is anonymized — arms are "Civ A"/"Civ B" with no
 * regime, backend, model, or provider labels. Swap balance: every pair is
 * judged twice, once in each presentation order; the reported score is the
 * swap-consistent mean.
 */
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

export const RUBRIC_DIMENSIONS = ["legality", "feasibility", "resilience"];
export const RUBRIC_SCALE = 4;

/** Anchored scoring instruction (port of the legacy rubric prompt). */
export const JUDGE_RUBRIC_PROMPT = `You are the blind judge of a governance tournament.
Each civilization received the same task. You do not know which backend or
model produced which transcript. Score EVERY civilization on EACH dimension
using an anchored ${RUBRIC_SCALE}-point scale (integers 1-${RUBRIC_SCALE}).
Calibrate HARD: most competent answers belong at 2-3.
legality — respect for their own rules and institutions.
feasibility — workability of the plan under real constraints.
resilience — robustness to shocks, defections, and external pressure.
Answer ONLY with JSON: {"A": {"legality": n, "feasibility": n, "resilience": n}, "B": {...}}`;

/** Blind presentation: anonymized, no regime/backend/model labels (tested). */
export function blindPresentation(armA, armB, { swap = false } = {}) {
  const [first, second] = swap ? [armB, armA] : [armA, armB];
  return {
    prompt: JUDGE_RUBRIC_PROMPT,
    A: anonymize(first),
    B: anonymize(second),
    swap,
    labelA: "Civ A",
    labelB: "Civ B",
  };
}

function anonymize(arm) {
  const { label, surfaceText } = arm;
  void label;
  return { surfaceText }; // regime/backend/model metadata never enters the judge input
}

/** Deterministic aggregation: dimension mean per arm, swap-consistent. */
export function aggregateScores(passes) {
  const perArm = { A: {}, B: {} };
  for (const pass of passes) {
    for (const dim of RUBRIC_DIMENSIONS) {
      perArm.A[dim] = perArm.A[dim] ?? [];
      perArm.B[dim] = perArm.B[dim] ?? [];
    }
    const scores = pass.scores; // {A: {legality..}, B: {...}}
    const mapped = pass.swap ? { A: scores.B, B: scores.A } : scores;
    for (const dim of RUBRIC_DIMENSIONS) {
      if (Number.isInteger(mapped.A?.[dim])) perArm.A[dim].push(mapped.A[dim]);
      if (Number.isInteger(mapped.B?.[dim])) perArm.B[dim].push(mapped.B[dim]);
    }
  }
  const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  return {
    A: Object.fromEntries(RUBRIC_DIMENSIONS.map((d) => [d, mean(perArm.A[d])])),
    B: Object.fromEntries(RUBRIC_DIMENSIONS.map((d) => [d, mean(perArm.B[d])])),
    total: {
      A: RUBRIC_DIMENSIONS.reduce((s, d) => s + (mean(perArm.A[d]) ?? 0), 0),
      B: RUBRIC_DIMENSIONS.reduce((s, d) => s + (mean(perArm.B[d]) ?? 0), 0),
    },
    passes: passes.length,
    digest: sha256Hex(Buffer.from(canonicalJson({ A: perArm.A, B: perArm.B }))),
  };
}

/** Eligibility: judge inputs must be reconstructible; one-sided pairs excluded. */
export function judgeEligible({ armA, armB, evidenceDigests }) {
  const problems = [];
  if (!armA.surfaceText || !armB.surfaceText) problems.push("missing surface text for an arm");
  if (!armA.evidenceDigest || !armB.evidenceDigest) problems.push("missing evidence digest for an arm");
  if (armA.evidenceDigest === armB.evidenceDigest) problems.push("identical arms (one-sided pair)");
  if (evidenceDigests && !evidenceDigests.every((d) => d)) problems.push("judge input not reconstructible from raw evidence");
  return problems;
}
