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

const BANNER = "<!-- civagent v5 learned skill — source_match=abc123 — audited_by=codex -->\n";
const SKILL = `${BANNER}---
name: tang-famine-relief
type: learned
description: route grain through the canal
---

# Famine Relief

- Activate provincial granaries in sequence.
`;

function makeTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-outcome-"));
  const dir = path.join(root, "china", "tang", "skills");
  fs.mkdirSync(dir, { recursive: true });
  // Filename shape mirrors writeSkillFile: learned-<date>-<topic>-<match6>-<rand>.md
  const file = path.join(dir, "learned-2026-07-30-famine-abc123-x1y2.md");
  fs.writeFileSync(file, SKILL);
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

test("skillsForMatch matches on the match-id suffix in the filename", () => {
  const { root, dir } = makeTree();
  try {
    fs.writeFileSync(path.join(dir, "learned-2026-07-30-other-zzzzzz-aaaa.md"), SKILL);
    const found = skillsForMatch(dir, "tournament-1__china-tang-abc123");
    assert.equal(found.length, 1, `only the matching skill: ${found}`);
    assert.match(found[0], /abc123/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("skillsForMatch tolerates a regime with no skills dir", () => {
  assert.deepEqual(skillsForMatch("/nonexistent/skills", "m-abc123"), []);
});

test("stampTournamentOutcome writes score and rank onto the right regime's skill", () => {
  const { root, file } = makeTree();
  try {
    const stamped = stampTournamentOutcome({
      tournamentId: "T-1",
      civs: [{ regime: "china/tang", matchId: "T-1__china-tang-abc123" }],
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
      civs: [{ regime: "china/tang", matchId: "T-2__china-tang-abc123" }],
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
      civs: [{ regime: "china/tang", matchId: "T-3__china-tang-abc123" }],
      scores: [], // judge failed entirely
      regimesRoot: root,
    });
    assert.deepEqual(stamped, []);
    assert.ok(!fs.readFileSync(file, "utf8").includes("outcome_score"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
