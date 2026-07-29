// judge-anon-multi.test.mjs — R2 blind anonymization + multi-provider judging,
// revived into the v6 anchored-rubric judge. All judge calls are faked.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { anonymizeCivs } from "../engine/v5/judge.mjs";
import { judge } from "../engine/v5/tournament.mjs";

// ── anonymizeCivs ───────────────────────────────────────────────────────────

test("anonymizeCivs replaces ids, slugs, and metadata display names", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-anon-"));
  try {
    fs.mkdirSync(path.join(root, "china", "tang"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "china", "tang", "metadata.json"),
      JSON.stringify({ name: { zh: "唐朝", en: "Tang Dynasty" } }),
    );
    const anon = anonymizeCivs(["china/tang"], { regimesRoot: root });
    const out = anon.transform(
      "china/tang consults the Tang Dynasty code; 唐朝 officials cite tang precedent.",
    );
    assert.ok(!out.includes("tang") && !out.includes("Tang") && !out.includes("唐朝"), out);
    assert.ok(out.includes("Civ-A"), out);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("anonymizeCivs handles prefix-overlapping ids (jin-jurchen before jin)", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-anon-"));
  try {
    const anon = anonymizeCivs(["china/jin", "china/jin-jurchen"], { regimesRoot: root });
    const out = anon.transform("china/jin-jurchen attacked china/jin");
    assert.ok(!out.includes("jurchen"), `longer id must be replaced first: ${out}`);
    assert.equal(out, "Civ-B attacked Civ-A");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("anonymizeCivs detransform restores real ids in verdict text", () => {
  const anon = anonymizeCivs(["china/tang", "china/qin"], { regimesRoot: "/nonexistent" });
  assert.equal(anon.detransform("Civ-A beats Civ-B"), "china/tang beats china/qin");
});

// ── judge() with anonymization ──────────────────────────────────────────────

const civResults = (regimes) =>
  regimes.map((regime, i) => ({ regime, backend: "native", matchId: `m${i}`, code: 0, logFile: "/nonexistent" }));

function jsonJudgeOutput(scoresByName) {
  return JSON.stringify({
    scores: Object.entries(scoresByName).map(([civilization, v]) => ({
      civilization, legality: v, feasibility: v, resilience: v, reason: "r",
    })),
    verdict: `${Object.keys(scoresByName)[0]} leads.`,
  });
}

test("anonymized judging: prompt hides names, scores de-anonymize back to regimes", async () => {
  const prompts = [];
  const fakeRunJudge = (prompt) => {
    prompts.push(prompt);
    return { provider: "codex", output: jsonJudgeOutput({ "Civ-A": 4, "Civ-B": 2 }) };
  };
  const r = await judge("famine task", civResults(["china/tang", "china/qin"]), {
    swap: false,
    anonymize: true,
    _runJudge: fakeRunJudge,
  });
  assert.ok(!prompts[0].includes("china/tang"), "regime id must not reach the judge");
  assert.ok(prompts[0].includes("Civ-A"), "labels reach the judge");
  assert.equal(r.anonymized, true);
  assert.equal(r.scores[0].regime, "china/tang", "top score de-anonymized");
  assert.equal(r.scores[0].score, 10);
  assert.equal(r.scores[1].regime, "china/qin");
  assert.match(r.md, /china\/tang leads\./, "verdict de-anonymized in the result md");
});

// ── judge() with judgesN > 1 ────────────────────────────────────────────────

test("judgesN=2 pools passes from two providers and averages", async () => {
  const providerCalls = [];
  const fakeRunJudge = (prompt, opts = {}) => {
    const p = opts.providers?.[0] ?? "codex";
    providerCalls.push(p);
    const score = p === "codex" ? 4 : 2; // codex → 10/10, other → 5/10
    return { provider: p, output: jsonJudgeOutput({ "china/tang": score }) };
  };
  const r = await judge("t", civResults(["china/tang"]), {
    swap: false,
    judgesN: 2,
    _runJudge: fakeRunJudge,
  });
  assert.equal(r.passes, 2, "one pass per provider (swap off)");
  assert.equal(r.providers.length, 2);
  assert.equal(r.scores[0].score, 7.5, "mean of 10 and 5");
  assert.ok(new Set(providerCalls).size >= 2, "distinct providers were called");
});

test("judgesN=2: a dead provider is skipped without consuming a slot", async () => {
  const fakeRunJudge = (prompt, opts = {}) => {
    const p = opts.providers?.[0];
    if (p === "codex") throw new Error("codex unavailable");
    return { provider: p ?? "fallback", output: jsonJudgeOutput({ "china/tang": 3 }) };
  };
  const r = await judge("t", civResults(["china/tang"]), {
    swap: false,
    judgesN: 2,
    _runJudge: fakeRunJudge,
  });
  // codex died; the two remaining chain providers filled both slots.
  assert.equal(r.providers.length, 2, `providers: ${r.providers}`);
  assert.ok(!r.providers.includes("codex"));
  assert.equal(r.scores[0].score, 7.5, "mean of two 7.5 passes");
});

test("judgesN=1 preserves the original single-provider behavior", async () => {
  let calls = 0;
  const fakeRunJudge = () => {
    calls++;
    return { provider: "codex", output: jsonJudgeOutput({ "china/tang": 4 }) };
  };
  const r = await judge("t", civResults(["china/tang"]), { swap: true, _runJudge: fakeRunJudge });
  assert.equal(calls, 2, "swap on → exactly 2 passes, single provider");
  assert.equal(r.provider, "codex");
  assert.deepEqual(r.providers, ["codex"]);
});
