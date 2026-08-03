// skill-outcome.test.mjs — stamping a tournament's judged result back onto the
// skills it produced.
//
// Sedimentation runs per-match, before any civ has been judged, so the skills
// it writes cannot know whether the run they came from won or lost. Skills
// learned from a losing run are exactly the ones most likely to transfer badly,
// so the outcome is written back after judging. This pins that pass.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stampFrontmatter, skillsForMatch, stampTournamentOutcome } from "../engine/v5/skill-outcome.mjs";

// Real tournament child match ids, exactly as engine/v5/tournament.mjs builds
// them: `${tournamentId}__${regime with / replaced by -}`. Using a made-up
// shape here is what let the suffix-matching defect stay green — the last six
// characters of every one of these is "a-tang".
const MATCH_A = "2026-07-30T06-06-44-953-qhyj__china-tang";
const MATCH_B = "2026-07-30T09-12-01-004-k3z8__china-tang";

function skillText(matchId, name = "tang-famine-relief") {
  return `<!-- civagent v5 learned skill — source_match=${matchId} — audited_by=codex -->
---
name: ${name}
type: learned
description: route grain through the canal
---

# Famine Relief

- Activate provincial granaries in sequence.
`;
}

const SKILL = skillText(MATCH_A);

// Filename shape mirrors writeSkillFile: learned-<date>-<topic>-<match6>-<rand>.md
function fileNameFor(matchId, topic, rand) {
  return `learned-2026-07-30-${topic}-${String(matchId).slice(-6).replace(/[^\w-]/g, "")}-${rand}.md`;
}

function makeTree(matchId = MATCH_A) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-outcome-"));
  const dir = path.join(root, "china", "tang", "skills");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, fileNameFor(matchId, "famine", "x1y2"));
  fs.writeFileSync(file, skillText(matchId));
  return { root, dir, file };
}

test("stampFrontmatter inserts outcome fields without touching the body", () => {
  const out = stampFrontmatter(SKILL, { outcome_score: 8.5, outcome_rank: 1 });
  assert.match(out, /outcome_score: 8\.5/);
  assert.match(out, /outcome_rank: 1/);
  assert.match(out, /name: tang-famine-relief/, "existing frontmatter survives");
  assert.match(out, /Activate provincial granaries/, "body untouched");
  assert.match(out, /civagent v5 learned skill/, "provenance banner untouched");
});

test("re-stamping replaces rather than duplicating", () => {
  const once = stampFrontmatter(SKILL, { outcome_score: 3, outcome_rank: 4 });
  const twice = stampFrontmatter(once, { outcome_score: 9, outcome_rank: 1 });
  assert.equal((twice.match(/outcome_score:/g) ?? []).length, 1, "one score line only");
  assert.match(twice, /outcome_score: 9/);
  assert.ok(!twice.includes("outcome_score: 3"), "stale value gone");
});

test("a file without frontmatter is returned unchanged", () => {
  const plain = "# Just a heading\n\nno frontmatter here\n";
  assert.equal(stampFrontmatter(plain, { outcome_score: 5 }), plain);
});

test("skillsForMatch attributes by the full match id in the provenance banner", () => {
  const { root, dir, file } = makeTree(MATCH_A);
  try {
    // A skill from a *different* match, whose filename suffix is identical
    // because both are china/tang tournament children.
    fs.writeFileSync(path.join(dir, fileNameFor(MATCH_B, "canal", "aaaa")), skillText(MATCH_B));
    assert.equal(
      fileNameFor(MATCH_A, "famine", "x1y2").split("-").at(-2),
      fileNameFor(MATCH_B, "canal", "aaaa").split("-").at(-2),
      "precondition: the two filenames really do share a suffix",
    );

    const found = skillsForMatch(dir, MATCH_A);
    assert.deepEqual(found, [file], `only the skill from this exact match: ${found}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// The defect this pins: tournament child ids end in the regime name, so the
// last six characters are "a-tang" for every china/tang tournament ever run.
// Suffix matching therefore attributed one tournament's skills to another, and
// stamping overwrote the outcome metadata of skills learned earlier under an
// unrelated result — teaching the corpus that a losing pattern had won.
test("stamping one tournament does not overwrite another tournament's skills", () => {
  const { root, dir, file: fileA } = makeTree(MATCH_A);
  try {
    const fileB = path.join(dir, fileNameFor(MATCH_B, "canal", "aaaa"));
    fs.writeFileSync(fileB, skillText(MATCH_B, "tang-canal-repair"));

    stampTournamentOutcome({
      tournamentId: "2026-07-30T06-06-44-953-qhyj",
      civs: [{ regime: "china/tang", matchId: MATCH_A }],
      scores: [{ regime: "china/tang", score: 9.1 }, { regime: "china/qin", score: 6.2 }],
      regimesRoot: root,
    });

    assert.match(fs.readFileSync(fileA, "utf8"), /outcome_score: 9\.1/, "its own skill is stamped");
    assert.ok(
      !fs.readFileSync(fileB, "utf8").includes("outcome_"),
      "a skill from a different tournament must be left completely alone",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("skillsForMatch tolerates a regime with no skills dir", () => {
  assert.deepEqual(skillsForMatch("/nonexistent/skills", MATCH_A), []);
});

test("stampTournamentOutcome writes score and rank onto the right regime's skill", () => {
  const { root, file } = makeTree();
  try {
    const stamped = stampTournamentOutcome({
      tournamentId: "T-1",
      civs: [{ regime: "china/tang", matchId: MATCH_A }],
      scores: [{ regime: "china/tang", score: 9.1 }, { regime: "china/qin", score: 6.2 }],
      regimesRoot: root,
    });
    assert.equal(stamped.length, 1);
    const text = fs.readFileSync(file, "utf8");
    assert.match(text, /outcome_score: 9\.1/);
    assert.match(text, /outcome_rank: 1/);
    assert.match(text, /outcome_total: 2/);
    assert.match(text, /outcome_of: T-1/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a losing regime is stamped with its real rank, not skipped", () => {
  const { root, file } = makeTree();
  try {
    stampTournamentOutcome({
      tournamentId: "T-2",
      civs: [{ regime: "china/tang", matchId: MATCH_A }],
      scores: [{ regime: "china/qin", score: 9 }, { regime: "china/tang", score: 2.5 }],
      regimesRoot: root,
    });
    const text = fs.readFileSync(file, "utf8");
    assert.match(text, /outcome_score: 2\.5/);
    assert.match(text, /outcome_rank: 2/, "the loser must be recorded as such — that is the point");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an unscored civ is skipped without throwing", () => {
  const { root, file } = makeTree();
  try {
    const stamped = stampTournamentOutcome({
      tournamentId: "T-3",
      civs: [{ regime: "china/tang", matchId: MATCH_A }],
      scores: [], // judge failed entirely
      regimesRoot: root,
    });
    assert.deepEqual(stamped, []);
    assert.ok(!fs.readFileSync(file, "utf8").includes("outcome_score"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
