import { test } from "node:test";
import assert from "node:assert/strict";
import {
  anonymizePrompt,
  parseScoreTable,
  aggregateJudgements,
  runMultiJudge,
} from "../engine/v5/multi-judge.mjs";

// ── anonymizePrompt ───────────────────────────────────────────────────────────

test("anonymizePrompt replaces each regime name with Civ-A, Civ-B …", () => {
  const civNames = ["china/tang", "global/athens"];
  const prompt = "### china/tang\nsome text\n### global/athens\nmore text";
  const { prompt: out, map } = anonymizePrompt(prompt, civNames);

  assert.ok(out.includes("Civ-A"), "Civ-A should appear");
  assert.ok(out.includes("Civ-B"), "Civ-B should appear");
  assert.ok(!out.includes("china/tang"), "original regime must not leak");
  assert.ok(!out.includes("global/athens"), "original regime must not leak");
  assert.deepEqual(map[0], { real: "china/tang",   anon: "Civ-A" });
  assert.deepEqual(map[1], { real: "global/athens", anon: "Civ-B" });
});

test("anonymizePrompt replaces all occurrences (split-join, not just first)", () => {
  const { prompt: out } = anonymizePrompt(
    "china/tang first  china/tang second  china/tang third",
    ["china/tang"]
  );
  assert.equal((out.match(/Civ-A/g) || []).length, 3);
  assert.ok(!out.includes("china/tang"));
});

test("anonymizePrompt handles up to 26 civs (A-Z labels)", () => {
  const civs = Array.from({ length: 5 }, (_, i) => `civ-${i}`);
  const { map } = anonymizePrompt("x", civs);
  assert.equal(map[0].anon, "Civ-A");
  assert.equal(map[4].anon, "Civ-E");
});

// P1 fix: prefix-collision guard — longer names must be replaced before shorter
// names that are a prefix of them, so "china/jin-jurchen" is never corrupted
// into "Civ-A-jurchen" when "china/jin" is replaced first.
test("anonymizePrompt handles prefix-name collisions correctly (china/jin vs china/jin-jurchen)", () => {
  const civNames = ["china/jin", "china/jin-jurchen"];
  const prompt = "### china/jin\ntext about jin\n### china/jin-jurchen\ntext about jurchen";
  const { prompt: out, map } = anonymizePrompt(prompt, civNames);

  // Both regimes must be fully anonymized
  assert.ok(!out.includes("china/jin"), "china/jin must not appear in output");
  assert.ok(!out.includes("china/jin-jurchen"), "china/jin-jurchen must not appear in output");

  // No corrupted partial label like "Civ-A-jurchen"
  assert.ok(!out.includes("-jurchen"), "no partial corruption with dangling -jurchen suffix");

  // Labels are assigned by original order (index), not by length
  assert.deepEqual(map[0], { real: "china/jin", anon: "Civ-A" });
  assert.deepEqual(map[1], { real: "china/jin-jurchen", anon: "Civ-B" });

  // Both Civ-A and Civ-B appear, each with their correct section text
  assert.ok(out.includes("Civ-A"), "Civ-A for china/jin");
  assert.ok(out.includes("Civ-B"), "Civ-B for china/jin-jurchen");
});

// ── parseScoreTable ───────────────────────────────────────────────────────────

test("parseScoreTable parses single-score Rank|Civ|Score table", () => {
  const md = `
| Rank | Civilization | Score /10 | Reason |
|---|---|---|---|
| 1 | Civ-A | 8.5/10 | strong legality |
| 2 | Civ-B | 7.0/10 | feasible |
`;
  const scores = parseScoreTable(md);
  assert.ok(scores !== null);
  assert.ok(scores.has("Civ-A"));
  assert.ok(scores.has("Civ-B"));
  assert.equal(scores.get("Civ-A").avg, 8.5);
  assert.equal(scores.get("Civ-B").avg, 7.0);
});

test("parseScoreTable parses triple-score Civ|Legality|Feasibility|Resilience table", () => {
  const md = `
| Civilization | Legality | Feasibility | Resilience |
|---|---|---|---|
| Civ-A | 9 | 8 | 7 |
| Civ-B | 6 | 7 | 5 |
`;
  const scores = parseScoreTable(md);
  // Triple-score rows use cells[0] as civ label
  assert.ok(scores !== null);
  // At least one entry parsed
  assert.ok(scores.size >= 1);
  const entry = [...scores.values()][0];
  assert.ok(typeof entry.legality === "number");
  assert.ok(typeof entry.feasibility === "number");
  assert.ok(typeof entry.resilience === "number");
});

test("parseScoreTable returns null on empty markdown", () => {
  assert.equal(parseScoreTable(""), null);
  assert.equal(parseScoreTable(null), null);
});

test("parseScoreTable skips rows without Civ-X labels in the civ column", () => {
  const md = `
| Rank | Civilization | Score /10 |
|---|---|---|
| 1 | SomeName | 9.0 |
`;
  const scores = parseScoreTable(md);
  // No Civ-X label → nothing parsed → null
  assert.equal(scores, null);
});

// ── aggregateJudgements ───────────────────────────────────────────────────────

test("aggregateJudgements averages scores across two judges and de-anonymizes", () => {
  const deAnonymizeMap = [
    { real: "china/tang",   anon: "Civ-A" },
    { real: "global/athens", anon: "Civ-B" },
  ];

  const j1 = {
    provider: "codex",
    scores: new Map([
      ["Civ-A", { legality: 8, feasibility: 7, resilience: 9, avg: 8 }],
      ["Civ-B", { legality: 6, feasibility: 6, resilience: 6, avg: 6 }],
    ]),
    raw: "codex verdict",
  };
  const j2 = {
    provider: "opencode",
    scores: new Map([
      ["Civ-A", { legality: 6, feasibility: 9, resilience: 7, avg: 7.33 }],
      ["Civ-B", { legality: 8, feasibility: 7, resilience: 9, avg: 8 }],
    ]),
    raw: "opencode verdict",
  };

  const result = aggregateJudgements([j1, j2], deAnonymizeMap);

  // De-anonymized names
  assert.ok(result.scores.has("china/tang"),    "Civ-A → china/tang");
  assert.ok(result.scores.has("global/athens"), "Civ-B → global/athens");

  // Averaged values
  const tang = result.scores.get("china/tang");
  assert.equal(tang.legality, 7);      // (8+6)/2
  assert.equal(tang.feasibility, 8);   // (7+9)/2
  assert.equal(tang.resilience, 8);    // (9+7)/2

  // Providers list
  assert.deepEqual(result.providers, ["codex", "opencode"]);
});

test("aggregateJudgements gracefully handles all-failed judges", () => {
  const failed = [
    { provider: "codex",   scores: null, raw: null, error: "timeout" },
    { provider: "cn-glm",  scores: null, raw: null, error: "unavailable" },
  ];
  const result = aggregateJudgements(failed, []);
  assert.equal(result.scores.size, 0);
  assert.ok(result.verdict.includes("timeout"));
  assert.ok(result.verdict.includes("unavailable"));
});

test("aggregateJudgements uses only successful judges when mixed", () => {
  const map = [{ real: "china/tang", anon: "Civ-A" }];
  const ok = {
    provider: "codex",
    scores: new Map([["Civ-A", { legality: 9, feasibility: 9, resilience: 9, avg: 9 }]]),
    raw: "ok",
  };
  const fail = { provider: "cn-glm", scores: null, raw: null, error: "fail" };

  const result = aggregateJudgements([ok, fail], map);
  assert.ok(result.scores.has("china/tang"));
  assert.equal(result.providers.length, 1);
  assert.equal(result.providers[0], "codex");
});

// ── runMultiJudge ─────────────────────────────────────────────────────────────

test("runMultiJudge fills requested judge count from later providers after failures", () => {
  const calls = [];
  const output = `
| Rank | Civilization | Score /10 |
|---|---|---|
| 1 | Civ-A | 8 |
`;
  const result = runMultiJudge("### china/tang\ntext", [{ regime: "china/tang" }], {
    judgesN: 2,
    _runJudge: (_prompt, { providers }) => {
      const provider = providers[0];
      calls.push(provider);
      if (provider === "codex") throw new Error("codex unavailable");
      return { provider, output };
    },
  });

  assert.deepEqual(calls, ["codex", "opencode-reviewer", "cn-glm"]);
  assert.deepEqual(result.providers, ["opencode-reviewer", "cn-glm"]);
  assert.equal(result.scores.get("china/tang").judgeCount, 2);
});

test("runMultiJudge stops once the requested number of successful judges is reached", () => {
  const calls = [];
  const output = `
| Rank | Civilization | Score /10 |
|---|---|---|
| 1 | Civ-A | 8 |
`;
  const result = runMultiJudge("### china/tang\ntext", [{ regime: "china/tang" }], {
    judgesN: 2,
    _runJudge: (_prompt, { providers }) => {
      const provider = providers[0];
      calls.push(provider);
      if (provider === "cn-glm") throw new Error("should not call third provider");
      return { provider, output };
    },
  });

  assert.deepEqual(calls, ["codex", "opencode-reviewer"]);
  assert.deepEqual(result.providers, ["codex", "opencode-reviewer"]);
});
