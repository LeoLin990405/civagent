// Regime catalog service — reads the on-disk regimes/ tree once per change and
// caches the result in-process.
//
// The old route handler (server/routes/regimes.mjs) walked the full tree and
// read IDENTITY.md / SOUL.md / every skills/*.md on *every* GET /api/regimes.
// With 57 regimes that is a lot of redundant disk I/O for a catalog that rarely
// changes between requests. This service caches the parsed result, keyed by the
// regimes directory's mtime: if the directory (or any of its parent scan
// entries) hasn't changed since the last read, the cached array is returned.
//
// Two read modes:
//   - listRegimes(dir)         — full bodies (identity/soul/skills), identical to
//                                 the legacy GET /api/regimes payload.
//   - listRegimeSummaries(dir) — body-less entries (metadata only, no markdown),
//                                 for the lightweight ?summary=1 list mode.

import fs from 'node:fs';
import path from 'node:path';

// Map<dir, { mtimeMs, full, summary }> — process-wide cache. Bounded by the
// number of distinct regimes roots ever queried (in practice 1).
const cache = new Map();

// Recursively read a regimes root into full RegimeDetail objects. Skips entries
// starting with '.' or '_' (private/template dirs, e.g. _ablated, _template).
// A leaf is any directory containing metadata.json.
function readRegimeTree(regimesDir) {
  const result = [];

  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      return; // unreadable directory — skip
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
      if (fs.existsSync(path.join(fullPath, 'metadata.json'))) {
        try {
          const metadata = JSON.parse(fs.readFileSync(path.join(fullPath, 'metadata.json'), 'utf8'));
          const id = path.relative(regimesDir, fullPath);
          const identityPath = path.join(fullPath, 'IDENTITY.md');
          const identity = fs.existsSync(identityPath) ? fs.readFileSync(identityPath, 'utf8') : '';
          const soulPath = path.join(fullPath, 'SOUL.md');
          const soul = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';
          const skillsDir = path.join(fullPath, 'skills');
          const skills = [];
          if (fs.existsSync(skillsDir)) {
            const skillFiles = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
            for (const sf of skillFiles) {
              skills.push({ filename: sf, content: fs.readFileSync(path.join(skillsDir, sf), 'utf8') });
            }
          }
          result.push({ id, metadata, identity, soul, skills });
        } catch (err) {
          console.error(`Error parsing regime in ${fullPath}:`, err);
        }
      } else {
        walk(fullPath);
      }
    }
  };
  walk(regimesDir);
  return result;
}

// The directory mtime changes when entries are added/removed inside it (the OS
// updates the parent dir's mtime on create/unlink). On a miss or a changed
// mtime, re-read; otherwise serve the cache.
function cacheEntry(regimesDir) {
  let stat;
  try {
    stat = fs.statSync(regimesDir);
  } catch {
    // Root missing → treat as an empty (uncacheable) catalog.
    const empty = { full: [], summary: [] };
    return empty;
  }
  const mtimeMs = stat.mtimeMs;
  const hit = cache.get(regimesDir);
  if (hit && hit.mtimeMs === mtimeMs) return hit;

  const full = readRegimeTree(regimesDir);
  // Summary = same entries minus the (potentially large) markdown bodies.
  const summary = full.map((r) => ({ id: r.id, metadata: r.metadata }));
  const entry = { mtimeMs, full, summary };
  cache.set(regimesDir, entry);
  return entry;
}

// Full regime catalog — byte-for-byte equivalent to the legacy GET /api/regimes
// payload (same fields, same order: tree walk order is stable).
export function listRegimes(regimesDir) {
  return cacheEntry(regimesDir).full;
}

// Lightweight catalog — metadata only, no IDENTITY/SOUL/skills bodies. Used by
// GET /api/regimes?summary=1.
export function listRegimeSummaries(regimesDir) {
  return cacheEntry(regimesDir).summary;
}

// Drop the cached entry for a directory (or the whole cache when no dir given).
// Exposed for tests that mutate the tree and need to force a re-read.
export function invalidateRegimeCache(regimesDir) {
  if (regimesDir) cache.delete(regimesDir);
  else cache.clear();
}
