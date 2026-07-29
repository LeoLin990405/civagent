// Regime catalog service — reads the on-disk regimes/ tree once per change and
// caches the result in-process.
//
// The old route handler (server/routes/regimes.mjs) walked the full tree and
// read IDENTITY.md / SOUL.md / every skills/*.md on *every* GET /api/regimes.
// With 57 regimes that is a lot of redundant disk I/O for a catalog that rarely
// changes between requests.
//
// Cache validity is a *recursive fingerprint* over the files actually served
// (metadata.json, IDENTITY.md, SOUL.md, skills/*.md — each contributing path +
// mtimeMs + size), not the root directory's mtime. A parent directory's mtime
// does not change when a nested file is edited in place, so a root-mtime key
// served edited regimes stale until the process restarted. Fingerprinting costs
// one stat per served file (~230 stats for 57 regimes) and no reads.
//
// Two read modes:
//   - listRegimes(dir)         — full bodies (identity/soul/skills), identical to
//                                 the legacy GET /api/regimes payload.
//   - listRegimeSummaries(dir) — body-less entries (metadata only, no markdown),
//                                 for the lightweight ?summary=1 list mode.
// The summary mode also avoids reading the markdown bodies on a cold cache:
// `full` is filled lazily, only when the full catalog is actually requested.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Map<dir, { fp, dirs, summary, full }> — process-wide cache. Bounded by the
// number of distinct regimes roots ever queried (in practice 1). `full` is null
// until someone asks for the full catalog.
const cache = new Map();

// Locate every regime leaf (a directory containing metadata.json) under the
// root, skipping '.'/'_' entries (private/template dirs, e.g. _ablated,
// _template). Returns leaf dirs in stable tree-walk order.
function findRegimeDirs(regimesDir) {
  const dirs = [];
  const walk = (dir) => {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      return; // missing or unreadable directory — skip
    }
    for (const file of files) {
      if (file.startsWith('_') || file.startsWith('.')) continue;
      const fullPath = path.join(dir, file);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;
      if (fs.existsSync(path.join(fullPath, 'metadata.json'))) dirs.push(fullPath);
      else walk(fullPath);
    }
  };
  walk(regimesDir);
  return dirs;
}

// Every file whose CONTENT can appear in a response, so an in-place edit to any
// of them invalidates the cache.
function servedFiles(regimeDir) {
  const files = [
    path.join(regimeDir, 'metadata.json'),
    path.join(regimeDir, 'IDENTITY.md'),
    path.join(regimeDir, 'SOUL.md'),
  ];
  const skillsDir = path.join(regimeDir, 'skills');
  try {
    for (const f of fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md')).sort()) {
      files.push(path.join(skillsDir, f));
    }
  } catch { /* no skills dir — nothing to add */ }
  return files;
}

// path + mtimeMs + size for every served file. mtimeMs is sub-millisecond on
// APFS/ext4, but size is included so a same-timestamp edit that changes length
// is still caught; a same-timestamp same-length edit is the only blind spot and
// callers that need certainty can call invalidateRegimeCache().
function fingerprint(regimesDir, dirs) {
  const h = crypto.createHash('sha256');
  h.update(regimesDir);
  for (const dir of dirs) {
    for (const f of servedFiles(dir)) {
      let st;
      try {
        st = fs.statSync(f);
      } catch {
        h.update(`${f}:absent`);
        continue;
      }
      h.update(`${f}:${st.mtimeMs}:${st.size}`);
    }
  }
  return h.digest('hex');
}

function readRegime(regimesDir, regimeDir) {
  try {
    const metadata = JSON.parse(fs.readFileSync(path.join(regimeDir, 'metadata.json'), 'utf8'));
    const id = path.relative(regimesDir, regimeDir);
    const identityPath = path.join(regimeDir, 'IDENTITY.md');
    const identity = fs.existsSync(identityPath) ? fs.readFileSync(identityPath, 'utf8') : '';
    const soulPath = path.join(regimeDir, 'SOUL.md');
    const soul = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';
    const skillsDir = path.join(regimeDir, 'skills');
    const skills = [];
    if (fs.existsSync(skillsDir)) {
      const skillFiles = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
      for (const sf of skillFiles) {
        skills.push({ filename: sf, content: fs.readFileSync(path.join(skillsDir, sf), 'utf8') });
      }
    }
    return { id, metadata, identity, soul, skills };
  } catch (err) {
    console.error(`Error parsing regime in ${regimeDir}:`, err);
    return null;
  }
}

function readRegimeSummary(regimesDir, regimeDir) {
  try {
    const metadata = JSON.parse(fs.readFileSync(path.join(regimeDir, 'metadata.json'), 'utf8'));
    return { id: path.relative(regimesDir, regimeDir), metadata };
  } catch (err) {
    console.error(`Error parsing regime in ${regimeDir}:`, err);
    return null;
  }
}

function cacheEntry(regimesDir) {
  if (!fs.existsSync(regimesDir)) return { fp: null, dirs: [], summary: [], full: [] };

  const dirs = findRegimeDirs(regimesDir);
  const fp = fingerprint(regimesDir, dirs);
  const hit = cache.get(regimesDir);
  if (hit && hit.fp === fp) return hit;

  // Summary is cheap (one small JSON per regime) so it is built eagerly; the
  // markdown bodies are deferred until the full catalog is requested.
  const summary = dirs.map((d) => readRegimeSummary(regimesDir, d)).filter(Boolean);
  const entry = { fp, dirs, summary, full: null };
  cache.set(regimesDir, entry);
  return entry;
}

// Full regime catalog — byte-for-byte equivalent to the legacy GET /api/regimes
// payload (same fields, same order: tree walk order is stable).
export function listRegimes(regimesDir) {
  const entry = cacheEntry(regimesDir);
  if (entry.full === null) {
    entry.full = entry.dirs.map((d) => readRegime(regimesDir, d)).filter(Boolean);
  }
  return entry.full;
}

// Lightweight catalog — metadata only, no IDENTITY/SOUL/skills bodies. Used by
// GET /api/regimes?summary=1. Never reads the markdown bodies, cold or warm.
export function listRegimeSummaries(regimesDir) {
  return cacheEntry(regimesDir).summary;
}

// Drop the cached entry for a directory (or the whole cache when no dir given).
// Exposed for tests that mutate the tree and need to force a re-read.
export function invalidateRegimeCache(regimesDir) {
  if (regimesDir) cache.delete(regimesDir);
  else cache.clear();
}
