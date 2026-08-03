// judge-calibration.test.mjs — bias measurement + verbosity control.
//
// All pure: synthetic passes/backends feed the helpers, no judge CLI is ever
// called. The judge()-level wiring is also covered (injected _runJudge) to prove
// verbosity is applied and bias_report is returned.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyVerbosityControl,
  computeBiasReport,
  modelFamilyOf,
} from "../engine/v5/judge-calibration.mjs";
import { TRANSCRIPT_STRATEGIES } from "../engine/v5/events.mjs";
import { judge } from "../engine/v5/tournament.mjs";

// ── modelFamilyOf ─────────────────────────────────────────────────────────────

test("modelFamilyOf resolves civ backends, judge providers, and bare commands to a family", () => {
  // Civ backend ids.
  assert.equal(modelFamilyOf("native"), "claude");
  assert.equal(modelFamilyOf("cn:glm"), "glm");
  assert.equal(modelFamilyOf("cn:doubao"), "doubao");
  assert.equal(modelFamilyOf("cn:kimi"), "kimi");
  // Judge provider ids (resolve through the judge command table).
  assert.equal(modelFamilyOf("cn-glm"), "glm");
  assert.equal(modelFamilyOf("opencode-reviewer"), "opencode");
  assert.equal(modelFamilyOf("codex"), "codex");
  // Bare commands.
  assert.equal(modelFamilyOf("cc-glm"), "glm");
  assert.equal(modelFamilyOf("claude"), "claude");
  // Unknown → never same-family (safe for measurement).
  assert.equal(modelFamilyOf("mystery-model"), "unknown");
  assert.equal(modelFamilyOf(""), "unknown");
});

// ── applyVerbosityControl ─────────────────────────────────────────────────────

function section(name, bodyLen) {
  return `### ${name} (exit 0)\n\n\`\`\`\n${"x".repeat(bodyLen)}\n\`\`\``;
}

test("applyVerbosityControl leaves short sections untouched and logs them uncut", () => {
  const s = section("china/tang", 100);
  const { sections, verbosityLog } = applyVerbosityControl([s], { budget: 1000 });
  assert.equal(sections[0], s);
  assert.equal(verbosityLog[0].truncated, false);
  assert.equal(verbosityLog[0].beforeChars, 100);
  assert.equal(verbosityLog[0].afterChars, 100);
});

test("applyVerbosityControl truncates over-budget bodies to the SAME budget for every civ", () => {
  // One verbose, one short — the verbose one must be cut, the short kept whole.
  // (This is the anti-verbosity-bias property: no civ gets a longer hearing.)
  const { sections, verbosityLog } = applyVerbosityControl(
    [section("china/tang", 5000), section("china/qin", 50)],
    { budget: 1000 },
  );
  assert.equal(verbosityLog[0].truncated, true);
  assert.equal(verbosityLog[0].beforeChars, 5000);
  assert.ok(verbosityLog[0].afterChars < 5000, "verbose body shrunk");
  assert.equal(verbosityLog[1].truncated, false, "short body left whole");

  // Headers + fences preserved on the truncated section.
  assert.match(sections[0], /^### china\/tang \(exit 0\)\n\n```/);
  assert.match(sections[0], /```\s*$/);
  // A visible truncation marker keeps the cut honest.
  assert.match(sections[0], /truncated/);
  // The verbose body was cut down to ~budget (the truncation marker adds a few
  // chars over the cap; the short body is untouched). The point: no one who was
  // over-budget keeps a long body, while a short one is never padded/inflated.
  const bodyOf = (sec) => sec.match(/```\n([\s\S]*?)\n```/)[1].length;
  assert.ok(bodyOf(sections[0]) < 1100, "verbose body shrunk near the budget");
  assert.equal(bodyOf(sections[1]), 50, "short body left whole, not inflated");
});

test("applyVerbosityControl does not corrupt a section that isn't the envelope shape", () => {
  const odd = "just some text, no fences";
  const { sections, verbosityLog } = applyVerbosityControl([odd], { budget: 5 });
  assert.equal(sections[0], odd, "non-envelope text passed through unchanged");
  assert.equal(verbosityLog[0].truncated, false);
});

// ── computeBiasReport ─────────────────────────────────────────────────────────

const PASS = (order, perRegime, { swapped = false, provider = "codex" } = {}) => ({
  swapped, provider, order, perRegime,
});

test("computeBiasReport reports per-provider mean and variance", () => {
  const r = computeBiasReport({
    passes: [
      PASS(["china/tang", "china/qin"], { "china/tang": { score10: 10 }, "china/qin": { score10: 6 } }, { provider: "codex" }),
      PASS(["china/qin", "china/tang"], { "china/tang": { score10: 8 }, "china/qin": { score10: 6 } }, { provider: "cn-glm" }),
    ],
    civRegimes: ["china/tang", "china/qin"],
  });
  const codex = r.providerStats.find((p) => p.provider === "codex");
  const glm = r.providerStats.find((p) => p.provider === "cn-glm");
  assert.equal(codex.n, 2);
  assert.equal(codex.mean, 8); // (10+6)/2
  assert.ok(codex.variance > 0, "codex spread across its two scores");
  assert.equal(glm.mean, 7); // (8+6)/2
});

test("computeBiasReport detects self-preference (same-family scored higher)", () => {
  // GLM judge scores the GLM civ higher than the cross-family civs.
  const r = computeBiasReport({
    passes: [
      PASS(["china/a", "china/b", "china/c"],
        { "china/a": { score10: 9 }, "china/b": { score10: 5 }, "china/c": { score10: 5 } },
        { provider: "cn-glm" }),
    ],
    civRegimes: ["china/a", "china/b", "china/c"],
    civBackends: { "china/a": "cn:glm", "china/b": "native", "china/c": "cn:doubao" },
  });
  // china/a is glm (same family as the cn-glm judge); b/c are cross-family.
  assert.equal(r.selfPreference.sameFamilyCount, 1);
  assert.equal(r.selfPreference.crossFamilyCount, 2);
  assert.equal(r.selfPreference.sameFamilyMean, 9);
  assert.equal(r.selfPreference.crossFamilyMean, 5);
  assert.ok(r.selfPreference.gap > 0, "positive gap = same-family favoritism");
  assert.equal(r.selfPreference.gap, 4);
});

test("computeBiasReport: unknown judge/civ families are excluded from the self-pref gap", () => {
  const r = computeBiasReport({
    passes: [PASS(["china/a"], { "china/a": { score10: 7 } }, { provider: "mystery" })],
    civRegimes: ["china/a"],
    civBackends: { "china/a": "native" },
  });
  // judge family unknown → can't classify → no same/cross counts.
  assert.equal(r.selfPreference.sameFamilyCount, 0);
  assert.equal(r.selfPreference.crossFamilyCount, 0);
  assert.equal(r.selfPreference.gap, null);
});

test("computeBiasReport quantifies position effect (forward vs swapped score delta)", () => {
  // Position bias: tang scores 10 when first, 6 when the order is swapped
  // (it drops to second). The delta exposes that.
  const r = computeBiasReport({
    passes: [
      PASS(["china/tang", "china/qin"], { "china/tang": { score10: 10 }, "china/qin": { score10: 6 } }, { swapped: false }),
      PASS(["china/qin", "china/tang"], { "china/tang": { score10: 6 }, "china/qin": { score10: 6 } }, { swapped: true }),
    ],
    civRegimes: ["china/tang", "china/qin"],
  });
  const tang = r.positionEffect.deltas.find((d) => d.regime === "china/tang");
  assert.equal(tang.forward, 10);
  assert.equal(tang.swapped, 6);
  assert.equal(tang.delta, 4, "tang lost 4 points when moved to second position");
  assert.equal(r.positionEffect.comparable, 2);
  assert.equal(r.positionEffect.meanDelta, 2); // tang +4, qin 0 → mean +2
  assert.ok(r.positionEffect.meanAbsDelta > 0);
});

test("computeBiasReport position effect is ~0 when order doesn't move scores", () => {
  const r = computeBiasReport({
    passes: [
      PASS(["china/tang", "china/qin"], { "china/tang": { score10: 8 }, "china/qin": { score10: 7 } }, { swapped: false }),
      PASS(["china/qin", "china/tang"], { "china/tang": { score10: 8 }, "china/qin": { score10: 7 } }, { swapped: true }),
    ],
    civRegimes: ["china/tang", "china/qin"],
  });
  assert.equal(r.positionEffect.meanDelta, 0, "no position effect when scores are order-invariant");
  for (const d of r.positionEffect.deltas) assert.equal(d.delta, 0);
});

test("computeBiasReport surfaces verbosity summary when a budget was applied", () => {
  const log = [{ beforeChars: 5000, afterChars: 1000, truncated: true }, { beforeChars: 50, afterChars: 50, truncated: false }];
  const r = computeBiasReport({ passes: [], civRegimes: [], verbosityLog: log });
  assert.equal(r.verbosity.budgetApplied, true);
  assert.equal(r.verbosity.sections, 2);
  assert.equal(r.verbosity.truncated, 1);
  assert.equal(r.verbosity.meanBeforeChars, 2525);
  assert.equal(r.verbosity.meanAfterChars, 525);
});

test("computeBiasReport reports each pass's presentation order + scores (post-hoc analysis)", () => {
  const r = computeBiasReport({
    passes: [PASS(["china/tang", "china/qin"], { "china/tang": { score10: 9 }, "china/qin": { score10: 4 } })],
    civRegimes: ["china/tang", "china/qin"],
  });
  assert.equal(r.perPass.length, 1);
  assert.deepEqual(r.perPass[0].order, ["china/tang", "china/qin"]);
  assert.equal(r.perPass[0].scores.length, 2);
  assert.equal(r.perPass[0].scores[0].position, 0);
});

// ── judge() wiring: verbosity applied + bias_report returned ──────────────────

const CIVS = [
  { regime: "china/tang", backend: "native", matchId: "calib-no-such-a", code: 0, logFile: "/nonexistent-a" },
  { regime: "china/qin", backend: "cn:glm", matchId: "calib-no-such-b", code: 0, logFile: "/nonexistent-b" },
];

function jsonOut(tangDims, qinDims) {
  return JSON.stringify({
    scores: [
      { civilization: "china/tang", ...tangDims, reason: "r" },
      { civilization: "china/qin", ...qinDims, reason: "r" },
    ],
    verdict: "tang leads.",
  });
}

test("judge() returns an additive bias_report without changing scores/passes/md", async () => {
  const fakeRunJudge = () => ({ provider: "codex", output: jsonOut({ legality: 4, feasibility: 4, resilience: 4 }, { legality: 2, feasibility: 2, resilience: 2 }) });
  const v = await judge("task", CIVS, { swap: true, _runJudge: fakeRunJudge });
  // Existing contract untouched.
  assert.equal(v.passes, 2);
  assert.equal(v.scores[0].regime, "china/tang");
  assert.ok(v.md.includes("## Verdict"));
  // New additive field.
  assert.ok(v.biasReport, "bias_report present");
  assert.equal(v.biasReport.providerStats[0].provider, "codex");
  assert.equal(v.biasReport.positionEffect.comparable, 2);
});

test("judge() applies verbosity control and records the per-section lengths", async () => {
  // A tiny budget forces truncation; capture the prompt the judge received.
  let seenPrompt = "";
  const fakeRunJudge = (prompt) => { seenPrompt = prompt; return { provider: "codex", output: jsonOut({ legality: 3, feasibility: 3, resilience: 3 }, { legality: 3, feasibility: 3, resilience: 3 }) }; };
  const v = await judge("task", CIVS, { swap: false, verbosityBudget: 50, _runJudge: fakeRunJudge });
  // The judge still saw both section headers (structure preserved).
  assert.match(seenPrompt, /### china\/tang/);
  assert.match(seenPrompt, /### china\/qin/);
  // Verbosity summary is populated and reflects a budget was applied.
  assert.equal(v.biasReport.verbosity.budgetApplied, true);
  assert.equal(v.biasReport.verbosity.sections, 2);
});

test("judge() bias_report surfaces a position effect when swap scores diverge", async () => {
  let call = 0;
  const fakeRunJudge = () => {
    call++;
    // Pass 1 (forward): tang great; Pass 2 (swapped): tang poor → position effect.
    return call === 1
      ? { provider: "codex", output: jsonOut({ legality: 4, feasibility: 4, resilience: 4 }, { legality: 2, feasibility: 2, resilience: 2 }) }
      : { provider: "codex", output: jsonOut({ legality: 2, feasibility: 2, resilience: 2 }, { legality: 4, feasibility: 4, resilience: 4 }) };
  };
  const v = await judge("task", CIVS, { swap: true, _runJudge: fakeRunJudge });
  const tangDelta = v.biasReport.positionEffect.deltas.find((d) => d.regime === "china/tang");
  // tang: forward 10, swapped 5 → delta +5 (the swap-cancellation still averages
  // to a fair 7.5, but the report now *shows* the order moved the score by 5).
  assert.equal(tangDelta.forward, 10);
  assert.equal(tangDelta.swapped, 5);
  assert.equal(tangDelta.delta, 5);
});

test("judge() bias_report null when the judge is unavailable", async () => {
  const fakeRunJudge = () => { throw new Error("all judge providers failed"); };
  const v = await judge("task", CIVS, { swap: true, _runJudge: fakeRunJudge });
  assert.equal(v.provider, null);
  assert.equal(v.biasReport, null);
});

// ── Transcript selection integration with judge() ─────────────────────────────

test("judge() returns transcriptSelection with per-civ selection metadata", async () => {
  const fakeRunJudge = () => ({ provider: "codex", output: jsonOut({ legality: 4, feasibility: 4, resilience: 4 }, { legality: 2, feasibility: 2, resilience: 2 }) });
  const v = await judge("task", CIVS, { swap: false, _runJudge: fakeRunJudge });
  assert.ok(v.transcriptSelection, "transcriptSelection present");
  assert.equal(v.transcriptSelection.maxChars, 6000);
  assert.equal(v.transcriptSelection.verbosityBudget, 6000);
  assert.equal(v.transcriptSelection.perCiv.length, 2, "one entry per civ");

  for (const entry of v.transcriptSelection.perCiv) {
    assert.ok(entry.regime, "each entry has a regime");
    assert.equal(typeof entry.originalLength, "number", "originalLength is a number");
    assert.equal(typeof entry.selectedLength, "number", "selectedLength is a number");
    assert.equal(typeof entry.postAnonymizationLength, "number");
    assert.equal(typeof entry.judgeViewLength, "number");
    assert.equal(typeof entry.verbosityTruncated, "boolean");
    assert.equal(typeof entry.truncated, "boolean", "truncated is a boolean");
    assert.ok(TRANSCRIPT_STRATEGIES.includes(entry.strategy), `strategy ${entry.strategy} is valid`);
    assert.equal(entry.fallback, true, "missing structured events are explicitly marked as raw-log fallback");
  }
});
