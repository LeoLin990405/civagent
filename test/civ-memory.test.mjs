import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { envDirFor, validateRegime, transcriptPath, ensureCivHome } from "../engine/v5/civ-memory.mjs";

test("envDirFor flattens region/id", () => {
  const p = envDirFor("china/tang");
  assert.equal(path.basename(p), "china-tang");
  assert.equal(path.basename(path.dirname(p)), "envs");
});

test("validateRegime accepts valid ids", () => {
  assert.equal(validateRegime("china/tang"), "china/tang");
  assert.equal(validateRegime("global/rome-republic"), "global/rome-republic");
});

test("validateRegime rejects path traversal", () => {
  assert.throws(() => validateRegime("../../etc"));
  assert.throws(() => validateRegime("china/../secrets"));
  assert.throws(() => validateRegime("/etc/passwd"));
  assert.throws(() => validateRegime("china"));
  assert.throws(() => validateRegime(""));
});

test("transcriptPath creates dir and returns path under ~/.civagent/transcripts", () => {
  const p = transcriptPath("test-match-xyz");
  assert.equal(path.basename(p), "test-match-xyz.jsonl");
  assert.ok(fs.existsSync(path.dirname(p)));
});

test("ensureCivHome re-seeds CLAUDE.md when source is newer", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "civ-test-"));
  const regimeDir = path.join(tmp, "regime");
  fs.mkdirSync(regimeDir);
  fs.writeFileSync(path.join(regimeDir, "SOUL.md"), "# v1");

  // First seed
  const regime = "test/sample";
  // Redirect ROOT by monkey-patching HOME before ensureCivHome reads it.
  const originalHome = process.env.HOME;
  process.env.HOME = tmp;
  // Re-import not possible (ESM cache); instead just verify the side-effect path.
  try {
    const home1 = ensureCivHome(regime, regimeDir);
    const claudeMd = path.join(home1, ".claude", "CLAUDE.md");
    const v1 = fs.readFileSync(claudeMd, "utf8");
    assert.ok(v1.includes("v1"));

    // Touch SOUL.md to a future mtime and re-seed
    const future = new Date(Date.now() + 10_000);
    fs.writeFileSync(path.join(regimeDir, "SOUL.md"), "# v2-updated");
    fs.utimesSync(path.join(regimeDir, "SOUL.md"), future, future);
    ensureCivHome(regime, regimeDir);
    const v2 = fs.readFileSync(claudeMd, "utf8");
    assert.ok(v2.includes("v2-updated"), "CLAUDE.md should re-seed from newer SOUL.md");
  } finally {
    process.env.HOME = originalHome;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
