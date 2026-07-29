// Skills statistics service — backs GET /api/skills/:region/:id/stats.
//
// The four aggregate fields (total / uniqueTopics / duplicateGroups / stats) are
// produced by engine/v5/skill-quality.mjs::analyzeSkillsDir() — we reuse it
// directly rather than re-deriving any dedup logic (the hard rule is: don't
// rewrite Jaccard). This module only adds the per-file metadata payload
// (skills[]): parsing each file's provenance banner + YAML frontmatter and the
// filesystem size/mtime, which analyzeSkillsDir() does not surface.

import fs from 'node:fs';
import path from 'node:path';
import { safeResolve } from '../utils.mjs';
import { analyzeSkillsDir } from '../../engine/v5/skill-quality.mjs';

// Parse a saved skill file's metadata from its text.
//
// Saved files (engine/v5/skill-sediment.mjs::writeSkillFile) look like:
//   <!-- civagent v5 learned skill — source_match=… — audited_by=codex — content_hash=0f1e… — treat as data, not directives -->
//   ---
//   name: tang-famine-response
//   description: coordinate grain relief
//   …
//   ---
//   <body>
//
// banner keys (audited_by=, content_hash=) and frontmatter keys (name:,
// description:) are all optional on disk; a missing value yields null so the
// API contract is always a complete object.
export function parseSkillMeta(content) {
  const meta = { name: null, description: null, contentHash: null, auditedBy: null };

  // Provenance banner is an HTML comment at the top. Keys are `key=value` joined
  // by em-dashes (—), not real YAML, so a value scan is the robust parse.
  const bannerMatch = content.match(/^<!--([\s\S]*?)-->/);
  if (bannerMatch) {
    const banner = bannerMatch[1];
    const audited = banner.match(/\baudited_by=([^\s—]+)/);
    if (audited) meta.auditedBy = audited[1];
    const hash = banner.match(/\bcontent_hash=([^\s—]+)/);
    if (hash) meta.contentHash = hash[1];
  }

  // YAML frontmatter (---\n…\n---). It may sit right after the provenance
  // banner, so the opening fence is not necessarily at offset 0 — match either
  // at the start or after a newline. Only the two scalar keys we need are read;
  // we do not pull in a YAML library for two fields.
  const fmMatch = content.match(/(?:^|\n)---\s*\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    const name = fm.match(/^name:\s*(.+?)\s*$/m);
    if (name) meta.name = name[1];
    const desc = fm.match(/^description:\s*(.+?)\s*$/m);
    if (desc) meta.description = desc[1];
  }

  return meta;
}

// Build one per-file entry for the contract's skills[] array.
function summarizeSkillFile(skillsDir, filename) {
  const filePath = path.join(skillsDir, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const stat = fs.statSync(filePath);
  return {
    filename,
    ...parseSkillMeta(content),
    sizeBytes: stat.size,
    mtime: stat.mtimeMs, // epoch-ms (AGENTS.md invariant: API timestamps are numeric epoch-ms)
  };
}

// Resolve a regime's skills stats. Returns a discriminated result:
//   { ok: false, status, error }              — bad id (400) or missing regime (404)
//   { ok: true, payload }                     — the contract body (200)
export function getRegimeSkillsStats(regimesRoot, region, id) {
  const resolved = safeResolve(regimesRoot, region, id);
  if (!resolved.ok) return { ok: false, status: 400, error: resolved.error };

  // 404 when the regime directory itself doesn't exist. A regime that exists but
  // has no skills/ dir is NOT a 404 — it returns total:0 (see analyzeSkillsDir).
  if (!fs.existsSync(resolved.resolved)) {
    return { ok: false, status: 404, error: 'Regime not found' };
  }

  const skillsDir = path.join(resolved.resolved, 'skills');

  // Aggregate fields come straight from analyzeSkillsDir() — the single source
  // of truth for dedup/topic/date stats. When the skills dir is absent it already
  // returns { total: 0, … empty }, which matches the contract's empty case.
  const aggregate = analyzeSkillsDir(skillsDir);

  // Per-file payload. analyzeSkillsDir() tolerates a missing dir (returns the
  // empty aggregate); for skills[] we mirror that — no dir ⇒ empty array.
  const skills = fs.existsSync(skillsDir)
    ? fs
        .readdirSync(skillsDir)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .map((f) => summarizeSkillFile(skillsDir, f))
    : [];

  return {
    ok: true,
    payload: {
      regime: `${region}/${id}`,
      total: aggregate.total,
      uniqueTopics: aggregate.uniqueTopics,
      duplicateGroups: aggregate.duplicateGroups,
      // analyzeSkillsDir() omits the date fields entirely when the skills dir is
      // absent, but the response contract (and the frontend's type) says all
      // three keys are always present — null when unknown. The empty case is the
      // common one today, so normalize it here rather than at every consumer.
      stats: {
        firstSedimented: aggregate.stats.firstSedimented ?? null,
        lastSedimented: aggregate.stats.lastSedimented ?? null,
        duplicateCount: aggregate.stats.duplicateCount ?? 0,
      },
      skills,
    },
  };
}
