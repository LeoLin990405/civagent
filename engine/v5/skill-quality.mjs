// skill-quality.mjs — skill deduplication and quality metrics.
//
// Operates deterministically (no embedding calls): uses SHA-256 fingerprints for
// exact-duplicate detection and word-level Jaccard similarity for near-duplicate
// detection. Integrated into skill-sediment.mjs to gate writes.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Strip YAML frontmatter and normalise to lowercase word tokens.
//
// Real on-disk skill files (written by skill-sediment.mjs) carry a provenance
// HTML comment banner BEFORE the frontmatter:
//   <!-- civagent v5 learned skill — source_match=… — audited_by=… -->
// We strip that banner first so that the fingerprint / Jaccard comparison
// between a candidate (no banner) and a saved file (has banner) is consistent.
export function normalizeSkill(content) {
  return String(content)
    .replace(/<!--[\s\S]*?-->\s*/g, "")   // provenance banner (HTML comment)
    .replace(/^---[\s\S]*?---\s*/m, "")   // YAML frontmatter
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 16-hex-char fingerprint of the normalised content.
export function skillFingerprint(content) {
  return crypto
    .createHash("sha256")
    .update(normalizeSkill(content))
    .digest("hex")
    .slice(0, 16);
}

// Word-level Jaccard similarity (only words longer than 3 chars to ignore noise).
export function jaccardSimilarity(normA, normB) {
  const setA = new Set(normA.split(" ").filter((w) => w.length > 3));
  const setB = new Set(normB.split(" ").filter((w) => w.length > 3));
  if (!setA.size && !setB.size) return 1;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

// Return the filename of the first existing skill that is a near-duplicate of
// `candidateContent`, or null if no duplicate found.
// threshold = 0 → only exact fingerprint matches; 0.6 → near-duplicate.
export function findDuplicate(candidateContent, skillsDir, { threshold = 0.6 } = {}) {
  if (!fs.existsSync(skillsDir)) return null;
  const candidateFp = skillFingerprint(candidateContent);
  const candidateNorm = normalizeSkill(candidateContent);
  const files = fs.readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const existing = fs.readFileSync(path.join(skillsDir, f), "utf8");
    if (skillFingerprint(existing) === candidateFp) return f; // exact
    if (jaccardSimilarity(normalizeSkill(existing), candidateNorm) >= threshold) return f; // near
  }
  return null;
}

// Analyse an entire skills/ directory.
// Returns { total, duplicateGroups, uniqueTopics, stats }.
export function analyzeSkillsDir(skillsDir, { threshold = 0.6 } = {}) {
  if (!fs.existsSync(skillsDir)) {
    return { total: 0, duplicateGroups: [], uniqueTopics: [], stats: { duplicateCount: 0 } };
  }

  const files = fs.readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
  const skills = files.map((f) => {
    const content = fs.readFileSync(path.join(skillsDir, f), "utf8");
    const norm = normalizeSkill(content);
    const fp = skillFingerprint(content);
    // Filename pattern: learned-<YYYY-MM-DD>-<topic>-<matchId>.md
    const topicMatch = f.match(/^learned-\d{4}-\d{2}-\d{2}-(.+)-[a-z0-9]+\.md$/);
    const topic = topicMatch ? topicMatch[1] : f.replace(/\.md$/, "");
    const dateMatch = f.match(/^learned-(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : null;
    return { filename: f, norm, fp, topic, date };
  });

  // Find near-duplicate groups (each skill appears in at most one group).
  const visited = new Set();
  const duplicateGroups = [];
  for (let i = 0; i < skills.length; i++) {
    if (visited.has(i)) continue;
    const group = [skills[i].filename];
    for (let j = i + 1; j < skills.length; j++) {
      if (visited.has(j)) continue;
      if (
        skills[i].fp === skills[j].fp ||
        jaccardSimilarity(skills[i].norm, skills[j].norm) >= threshold
      ) {
        group.push(skills[j].filename);
        visited.add(j);
      }
    }
    if (group.length > 1) {
      visited.add(i);
      duplicateGroups.push(group);
    }
  }

  const uniqueTopics = [...new Set(skills.map((s) => s.topic))];
  const dates = skills.map((s) => s.date).filter(Boolean).sort();

  return {
    total: files.length,
    duplicateGroups,
    uniqueTopics,
    stats: {
      firstSedimented: dates[0] || null,
      lastSedimented: dates[dates.length - 1] || null,
      duplicateCount: duplicateGroups.reduce((n, g) => n + g.length - 1, 0),
    },
  };
}
