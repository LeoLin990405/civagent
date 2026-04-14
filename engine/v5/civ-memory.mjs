#!/usr/bin/env node
// civ-memory.mjs — per-civilization isolated HOME + persistent skill dir
// Each regime gets its own ~/.civagent/envs/<region>-<id>/ so learned skills
// and CLAUDE.md context don't cross-contaminate between civilizations.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = path.join(os.homedir(), ".civagent");

export function envDirFor(regime) {
  // regime format: "china/tang" → "china-tang"
  const safe = regime.replace(/\//g, "-");
  return path.join(ROOT, "envs", safe);
}

export function ensureCivHome(regime, regimeDir) {
  const home = envDirFor(regime);
  const claudeDir = path.join(home, ".claude");
  const skillsDir = path.join(claudeDir, "skills");
  fs.mkdirSync(skillsDir, { recursive: true });

  // Seed CLAUDE.md at ~/.claude/CLAUDE.md (where CC loads user memory from)
  const claudeMd = path.join(claudeDir, "CLAUDE.md");
  if (!fs.existsSync(claudeMd)) {
    const soul = path.join(regimeDir, "SOUL.md");
    const identity = path.join(regimeDir, "IDENTITY.md");
    const parts = [`# ${regime} — Civilization Memory\n`];
    for (const f of [identity, soul]) {
      if (fs.existsSync(f)) parts.push(fs.readFileSync(f, "utf8"));
    }
    fs.writeFileSync(claudeMd, parts.join("\n\n---\n\n"));
  }

  // Symlink learned skills from regimes/<civ>/skills/ into the HOME's skill dir
  const regimeSkills = path.join(regimeDir, "skills");
  if (fs.existsSync(regimeSkills)) {
    for (const file of fs.readdirSync(regimeSkills)) {
      const src = path.join(regimeSkills, file);
      const dst = path.join(skillsDir, file);
      try {
        const st = fs.lstatSync(dst);
        if (!st.isSymbolicLink()) {
          console.warn(`[civ-memory] ${dst} exists as non-symlink; skipping`);
        }
      } catch {
        try { fs.symlinkSync(src, dst); }
        catch (e) { console.warn(`[civ-memory] symlink failed: ${e.message}`); }
      }
    }
  }

  return home;
}

// Strict regime-id validation to block path traversal like "../../etc"
export function validateRegime(regime) {
  if (!/^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_-]*$/i.test(regime)) {
    throw new Error(`invalid regime id: ${regime}`);
  }
  return regime;
}

export function transcriptPath(matchId) {
  const dir = path.join(ROOT, "transcripts");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${matchId}.jsonl`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [regime, regimeDir] = process.argv.slice(2);
  if (!regime || !regimeDir) {
    console.error("usage: civ-memory.mjs <regime> <regime-dir>");
    process.exit(1);
  }
  console.log(ensureCivHome(regime, regimeDir));
}
