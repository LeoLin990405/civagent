// judge-transcript-wiring.test.mjs — the judge must actually receive each
// office's contribution, not just the tail of the stream.
//
// Why this file exists separately from test/transcript-selection.test.mjs:
// that file proves selectTranscript() samples across actors. It does not prove
// that judge() *uses* that strategy. Flipping tournament.mjs back to
// strategy: "tail" left all 462 tests green — the unit was pinned and the
// wiring was not, which is the seventh time this repo has had a test suite that
// passes while the thing under study is broken.
//
// The failure this guards against is not hypothetical. Before actor-stratified
// selection, a real 72,830-character Tang match reached the judge as its last
// 6,000 characters: zero of the Secretariat's four segments, zero of the
// Chancellery's four, zero of the Department of State Affairs' three. The
// three rounds of fengbo review — the entire behavioural signal of a
// checks-and-balances regime — were outside the judge's view.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// The events path is resolved from HOME at module load, so point HOME at a temp
// dir before importing anything that touches it.
const TMP_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-judge-wiring-"));
process.env.HOME = TMP_HOME;

const { judge } = await import("../engine/v5/tournament.mjs");

after(() => { fs.rmSync(TMP_HOME, { recursive: true, force: true }); });

// Each office writes a block far larger than the 6000-char judge budget, so a
// tail slice can only ever contain the last one.
const OFFICES = ["zhongshu", "menxia", "shangshu"];
const MARKER = (office) => `<<${office.toUpperCase()}-CONTRIBUTION>>`;

function seedMatch(matchId, regime) {
  const dir = path.join(TMP_HOME, ".civagent", "matches", matchId);
  fs.mkdirSync(dir, { recursive: true });
  const lines = [];
  let seq = 0;
  const push = (actor, text) =>
    lines.push(JSON.stringify({ matchId, seq: seq++, ts: 1 + seq, type: "turn", actor, text }));

  push(regime, "match opening\n");
  for (const office of OFFICES) {
    push(regime, `[→ ${office}] dispatch to ${office}\n`);
    push(`${regime}#${office}`, `${MARKER(office)}\n${"填".repeat(5000)}\n`);
  }
  push(regime, "match closing\n");
  fs.writeFileSync(path.join(dir, "events.jsonl"), lines.join("\n") + "\n");
}

test("every office's contribution reaches the judge prompt", async () => {
  const civs = [
    { regime: "china/tang", matchId: "wiring-tang", code: 0, logFile: "/nonexistent" },
    { regime: "china/qin", matchId: "wiring-qin", code: 0, logFile: "/nonexistent" },
  ];
  for (const c of civs) seedMatch(c.matchId, c.regime);

  let prompt = "";
  const fakeRunJudge = (p) => {
    prompt = p;
    return {
      provider: "codex",
      output: JSON.stringify({
        scores: [
          { civilization: "china/tang", legality: 4, feasibility: 4, resilience: 4 },
          { civilization: "china/qin", legality: 2, feasibility: 2, resilience: 2 },
        ],
        verdict: "ok",
      }),
    };
  };

  await judge("task", civs, { swap: false, anonymize: false, _runJudge: fakeRunJudge });

  assert.ok(prompt, "the fake judge must have been called");
  for (const office of OFFICES) {
    assert.ok(
      prompt.includes(MARKER(office)),
      `${office}'s contribution is missing from the judge prompt — a tail slice keeps only the last office`,
    );
  }
});

test("the selection metadata reports how much never reached the judge", async () => {
  const civs = [
    { regime: "china/tang", matchId: "wiring-meta-tang", code: 0, logFile: "/nonexistent" },
    { regime: "china/qin", matchId: "wiring-meta-qin", code: 0, logFile: "/nonexistent" },
  ];
  for (const c of civs) seedMatch(c.matchId, c.regime);

  const v = await judge("task", civs, {
    swap: false,
    anonymize: false,
    _runJudge: () => ({
      provider: "codex",
      output: JSON.stringify({
        scores: [
          { civilization: "china/tang", legality: 3, feasibility: 3, resilience: 3 },
          { civilization: "china/qin", legality: 3, feasibility: 3, resilience: 3 },
        ],
        verdict: "ok",
      }),
    }),
  });

  for (const entry of v.transcriptSelection.perCiv) {
    assert.equal(entry.fallback, false, "structured events were found, so this is not a raw-log fallback");
    assert.ok(entry.originalLength > 6000, "precondition: the fixture is larger than the budget");
    assert.ok(entry.judgeViewLength <= entry.originalLength);
    // The omission has to be stated. A selection that silently drops 90% of a
    // transcript while reporting only what it kept is how the tail slice went
    // unnoticed for the entire life of the project.
    assert.ok(entry.omittedContentChars > 0, "what was dropped must be recorded, never implied");
  }
});
