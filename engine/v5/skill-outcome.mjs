// skill-outcome.mjs — stamp a tournament's judged outcome onto the skills that
// were sedimented during it.
//
// Why this exists as a separate pass rather than a parameter to sediment():
// sedimentation runs at the end of each civ's own match (run-v5.mjs), while the
// judge only runs once every civ has finished (tournament.mjs). At extraction
// time the score does not exist yet, so the extractor is structurally
// outcome-blind and cannot simply be handed a score.
//
// Skills learned from a match the regime lost are exactly the ones most likely
// to cause negative transfer, so the outcome has to reach the skill file
// somehow. This pass runs after judging and writes the result back into the
// skill's frontmatter, which gives later work — utility regression, retirement,
// weighting at injection time — something to key on. It never deletes or
// rewrites the skill body; it only annotates.

import fs from "node:fs";
import path from "node:path";

// Frontmatter keys this pass owns. Re-stamping replaces them rather than
// appending duplicates, so the operation is idempotent.
const OUTCOME_KEYS = ["outcome_score", "outcome_rank", "outcome_of", "outcome_total"];

// Insert or replace keys inside the leading `--- ... ---` block. Returns the
// original text unchanged when there is no frontmatter to edit.
export function stampFrontmatter(text, fields) {
  const src = String(text);
  const m = src.match(/^(\s*<!--[\s\S]*?-->\s*)?(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return src;
  const [full, banner = "", open, body, close] = m;
  const kept = body
    .split(/\r?\n/)
    .filter((line) => !OUTCOME_KEYS.some((k) => new RegExp(`^${k}\\s*:`).test(line.trim())));
  const added = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${v}`);
  const merged = [...kept.filter((l) => l.trim() !== ""), ...added].join("\n");
  return src.replace(full, `${banner}${open}${merged}${close}`);
}

// Which skill files did this match produce? Sedimentation names them with the
// match id's last six characters (see writeSkillFile), which is what lets us
// attribute a file to a match without threading state through the child process.
export function skillsForMatch(skillsDir, matchId) {
  const suffix = String(matchId).slice(-6).replace(/[^\w-]/g, "") || "x";
  let entries;
  try {
    entries = fs.readdirSync(skillsDir);
  } catch {
    return []; // no skills dir — nothing was sedimented
  }
  return entries
    .filter((f) => f.endsWith(".md") && f.includes(`-${suffix}-`))
    .map((f) => path.join(skillsDir, f));
}

// Annotate every skill produced by this tournament with how its regime scored.
// scores: [{ regime, score }] sorted descending (the judge's aggregate).
// civs:   manifest.civs — [{ regime, matchId }].
// Returns [{ file, regime, score, rank }] for what it actually stamped.
export function stampTournamentOutcome({ tournamentId, civs, scores, regimesRoot }) {
  const rankOf = new Map(scores.map((s, i) => [s.regime, i + 1]));
  const scoreOf = new Map(scores.map((s) => [s.regime, s.score]));
  const stamped = [];

  for (const civ of civs ?? []) {
    const score = scoreOf.get(civ.regime);
    if (score === undefined) continue; // unscored civ (judge failed for it)
    const skillsDir = path.join(regimesRoot, civ.regime, "skills");
    for (const file of skillsForMatch(skillsDir, civ.matchId)) {
      try {
        const updated = stampFrontmatter(fs.readFileSync(file, "utf8"), {
          outcome_score: score,
          outcome_rank: rankOf.get(civ.regime),
          outcome_total: scores.length,
          outcome_of: tournamentId,
        });
        fs.writeFileSync(file, updated);
        stamped.push({ file, regime: civ.regime, score, rank: rankOf.get(civ.regime) });
      } catch (err) {
        // Annotation is best-effort: it runs in the tournament tail and must
        // never take the run down with it.
        console.error(`[skill-outcome] could not stamp ${file}: ${err.message}`);
      }
    }
  }
  return stamped;
}
