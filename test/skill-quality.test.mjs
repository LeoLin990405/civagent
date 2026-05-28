import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  normalizeSkill,
  skillFingerprint,
  jaccardSimilarity,
  findDuplicate,
  analyzeSkillsDir,
} from "../engine/v5/skill-quality.mjs";

// ── normalizeSkill ────────────────────────────────────────────────────────────

const SAMPLE_SKILL = `---
name: tang-famine-relief
type: learned
civ: china/tang
---
# Famine Relief Protocol
## Trigger
When a province reports crop failure exceeding 30% of the harvest.
## Pattern
- Dispatch grain inspectors within 48 hours.
- Activate imperial granaries at county level.
- Suspend tax collection for the affected area.
## Example
Tang dispatched grain inspectors to Henan after the 731 drought.`;

test("normalizeSkill strips YAML frontmatter and lowercases content", () => {
  const norm = normalizeSkill(SAMPLE_SKILL);
  assert.ok(!norm.includes("---"), "frontmatter dashes must be stripped");
  assert.ok(!norm.includes("tang-famine-relief"), "frontmatter name field stripped");
  assert.equal(norm, norm.toLowerCase(), "must be lowercased");
  assert.ok(norm.includes("famine relief protocol"), "body content preserved");
});

test("normalizeSkill replaces punctuation with spaces (no special chars except underscore)", () => {
  const norm = normalizeSkill("---\nname: x\n---\n## Pattern\nstep-one. step_two, (step3)!");
  // \w includes underscore, so underscores survive normalisation; all other punctuation becomes spaces.
  assert.ok(!/[^a-z0-9_\s]/.test(norm), "only lowercase alphanum + underscore + whitespace allowed");
  assert.ok(!norm.includes("-"), "hyphens must be replaced");
  assert.ok(!norm.includes("."), "dots must be replaced");
  assert.ok(!norm.includes("("), "parens must be replaced");
});

// ── skillFingerprint ──────────────────────────────────────────────────────────

test("skillFingerprint returns a 16-char hex string", () => {
  const fp = skillFingerprint(SAMPLE_SKILL);
  assert.match(fp, /^[0-9a-f]{16}$/, "must be 16 hex chars");
});

test("skillFingerprint is deterministic", () => {
  assert.equal(skillFingerprint(SAMPLE_SKILL), skillFingerprint(SAMPLE_SKILL));
});

test("skillFingerprint differs for distinct content", () => {
  const a = skillFingerprint("---\nname: a\n---\nalpha content here for testing");
  const b = skillFingerprint("---\nname: b\n---\nbeta content here for testing");
  assert.notEqual(a, b);
});

test("skillFingerprint ignores frontmatter differences when body is identical", () => {
  const skillA = "---\nname: tang-foo\nsource_match: m1\n---\nbody content";
  const skillB = "---\nname: tang-foo\nsource_match: m2\n---\nbody content";
  assert.equal(skillFingerprint(skillA), skillFingerprint(skillB));
});

// ── jaccardSimilarity ─────────────────────────────────────────────────────────

test("jaccardSimilarity returns 1 for identical strings", () => {
  const norm = "dispatch grain inspectors immediately famine relief protocol";
  assert.equal(jaccardSimilarity(norm, norm), 1);
});

test("jaccardSimilarity returns 0 for completely different strings", () => {
  const a = "agriculture famine drought relief grain inspectors";
  const b = "naval warfare fleet admiral battle formation";
  const sim = jaccardSimilarity(a, b);
  assert.ok(sim < 0.1, `expected near-0, got ${sim}`);
});

test("jaccardSimilarity is in [0,1]", () => {
  const a = "alpha beta gamma delta epsilon famine grain relief province";
  const b = "alpha beta omega theta sigma grain province military defense";
  const sim = jaccardSimilarity(a, b);
  assert.ok(sim >= 0 && sim <= 1, `out of range: ${sim}`);
});

test("jaccardSimilarity ignores words ≤ 3 chars (noise words)", () => {
  // "the", "of", "and", "to" are all ≤3 chars — should be ignored
  const a = "the of and to a an in on";
  const b = "foo bar baz qux quux";
  // Both become empty sets after filtering → similarity = 1
  assert.equal(jaccardSimilarity(a, b), 0);
});

// ── findDuplicate ─────────────────────────────────────────────────────────────

function makeTempSkillsDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "civagent-sq-test-"));
}

function writeSkill(dir, filename, content) {
  fs.writeFileSync(path.join(dir, filename), content, "utf8");
}

test("findDuplicate returns null when directory is empty", () => {
  const dir = makeTempSkillsDir();
  try {
    assert.equal(findDuplicate(SAMPLE_SKILL, dir), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("findDuplicate detects exact duplicate by fingerprint", () => {
  const dir = makeTempSkillsDir();
  try {
    writeSkill(dir, "learned-2024-01-01-famine-abc123.md", SAMPLE_SKILL);
    const dup = findDuplicate(SAMPLE_SKILL, dir);
    assert.equal(dup, "learned-2024-01-01-famine-abc123.md");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("findDuplicate detects near-duplicate above Jaccard threshold", () => {
  const dir = makeTempSkillsDir();
  // Slightly modified but highly similar skill
  const similar = SAMPLE_SKILL.replace(
    "Dispatch grain inspectors within 48 hours.",
    "Dispatch grain inspectors within 24 hours."
  );
  try {
    writeSkill(dir, "learned-2024-01-01-famine-abc123.md", SAMPLE_SKILL);
    const dup = findDuplicate(similar, dir);
    assert.equal(dup, "learned-2024-01-01-famine-abc123.md");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("findDuplicate returns null for genuinely different skill", () => {
  const dir = makeTempSkillsDir();
  const different = `---
name: tang-naval-warfare
type: learned
civ: china/tang
---
# Naval Warfare Strategy
## Trigger
When a coastal province reports enemy fleet movements.
## Pattern
- Mobilise the Yangtze River Fleet within three days.
- Establish coastal watchtowers every fifty li.
- Negotiate with allied river clans for supply lines.
## Example
Tang responded to southern piracy by doubling the river fleet in 720.`;

  try {
    writeSkill(dir, "learned-2024-01-01-famine-abc123.md", SAMPLE_SKILL);
    const dup = findDuplicate(different, dir);
    assert.equal(dup, null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("findDuplicate returns null when skills dir does not exist", () => {
  assert.equal(findDuplicate(SAMPLE_SKILL, "/nonexistent/path/skills"), null);
});

// ── analyzeSkillsDir ──────────────────────────────────────────────────────────

const SKILL_B = `---
name: tang-naval-warfare
type: learned
civ: china/tang
---
# Naval Warfare Strategy
## Trigger
When a coastal province reports enemy fleet movements along the southern sea.
## Pattern
- Mobilise the Yangtze River Fleet within three days of receiving the alert.
- Establish coastal watchtowers every fifty li along the shore.
- Negotiate with allied river clans for supply lines and intelligence.
## Example
Tang responded to piracy by doubling the river fleet in 720 AD.`;

test("analyzeSkillsDir returns zeros for missing directory", () => {
  const result = analyzeSkillsDir("/nonexistent/path/skills");
  assert.equal(result.total, 0);
  assert.equal(result.duplicateGroups.length, 0);
  assert.equal(result.stats.duplicateCount, 0);
});

test("analyzeSkillsDir counts files and finds no duplicates in distinct skills", () => {
  const dir = makeTempSkillsDir();
  try {
    writeSkill(dir, "learned-2024-01-01-famine-aa1111.md", SAMPLE_SKILL);
    writeSkill(dir, "learned-2024-01-02-naval-bb2222.md", SKILL_B);
    const result = analyzeSkillsDir(dir);
    assert.equal(result.total, 2);
    assert.equal(result.duplicateGroups.length, 0);
    assert.equal(result.stats.duplicateCount, 0);
    assert.ok(result.uniqueTopics.length > 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("analyzeSkillsDir groups near-duplicate skills", () => {
  const dir = makeTempSkillsDir();
  const nearlySame = SAMPLE_SKILL.replace("48 hours", "72 hours");
  try {
    writeSkill(dir, "learned-2024-01-01-famine-aa1111.md", SAMPLE_SKILL);
    writeSkill(dir, "learned-2024-01-02-famine-bb2222.md", nearlySame);
    writeSkill(dir, "learned-2024-01-03-naval-cc3333.md", SKILL_B);
    const result = analyzeSkillsDir(dir);
    assert.equal(result.total, 3);
    assert.equal(result.duplicateGroups.length, 1);
    assert.equal(result.duplicateGroups[0].length, 2);
    assert.equal(result.stats.duplicateCount, 1); // one extra copy
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("analyzeSkillsDir extracts firstSedimented and lastSedimented from filenames", () => {
  const dir = makeTempSkillsDir();
  try {
    writeSkill(dir, "learned-2024-01-10-famine-aa1111.md", SAMPLE_SKILL);
    writeSkill(dir, "learned-2024-03-20-naval-bb2222.md", SKILL_B);
    const result = analyzeSkillsDir(dir);
    assert.equal(result.stats.firstSedimented, "2024-01-10");
    assert.equal(result.stats.lastSedimented,  "2024-03-20");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
