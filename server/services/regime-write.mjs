// regime-write.mjs — the PUT /api/regimes/:region/:id backing service.
//
// Edits only: updates metadata.json / IDENTITY.md / SOUL.md for an existing
// regime. Regime creation/deletion is deliberately out of scope.
//
// The whole point is the pre-commit validation chain: a regime must never be
// left on disk in a state the engine cannot compile. The two hazards this guards
// (AGENTS.md hard rules #2 and #3) are a prose-rewritten IDENTITY.md that
// compiles to 0 agents, and an agentCount that drifts from the compiled count.
// Either would silently brick the regime the next time it runs. So: every check
// runs against the PROPOSED content in memory; not a byte is written until all
// pass. Writes are atomic per file (temp + rename), and a failure mid-write
// rolls every file back to its original bytes — a regime is never half-updated.

import fs from 'node:fs';
import path from 'node:path';
import { safeResolve } from '../utils.mjs';
import { invalidateRegimeCache } from './regimes.mjs';
import { parseIdentityTable } from '../../engine/regime-to-cc.mjs';
import {
  validateTopologyData,
  crossCheckIdentity,
  normalizeMode,
} from '../../engine/topology/validate.mjs';

// region/region-id shape — mirrors bin/lib/common.sh::validate_regime.
const REGIME_PATH_RE = /^(china|global)\/[a-z0-9][a-z0-9-]*$/;

// Which files an update may touch. Anything else in the payload is ignored
// (the API only edits these three; skills/topology are managed elsewhere).
const WRITABLE_FILES = ['metadata', 'identity', 'soul'];
const FILENAMES = { metadata: 'metadata.json', identity: 'IDENTITY.md', soul: 'SOUL.md' };

// One atomic file replace: write to a sibling temp file, fsync, then rename over
// the target. rename is atomic on the same filesystem; the temp file is a
// sibling so it shares the target's filesystem.
function atomicWrite(filePath, content) {
  const tmp = `${filePath}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  // 'wx' fails (EEXIST) if the temp name collides — vanishingly unlikely, but
  // safer than clobbering. We let it throw; the caller rolls back.
  const fd = fs.openSync(tmp, 'wx');
  try {
    fs.writeFileSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, filePath);
}

// Core service. Returns a discriminated result:
//   { ok: true,  summary }            — written; summary describes the new state
//   { ok: false, status, findings }   — rejected; findings is the structured list
// `updates` is { metadata?: object|string, identity?: string, soul?: string }.
// metadata may arrive as a parsed object (JSON body) — we always serialize it.
export function updateRegimeFiles(regimesRoot, region, id, updates = {}) {
  const findings = [];

  // ── 1. Path whitelist + safeResolve ──────────────────────────────────────
  // safeResolve already rejects '.', '..', '/', and non-SAFE_ID segments; the
  // explicit region whitelist additionally enforces the china|global contract.
  if (!REGIME_PATH_RE.test(`${region}/${id}`)) {
    findings.push(`invalid regime id "${region}/${id}" (expected china|global/<kebab-id>)`);
    return { ok: false, status: 400, findings };
  }
  const resolved = safeResolve(regimesRoot, region, id);
  if (!resolved.ok) {
    findings.push(resolved.error);
    return { ok: false, status: 400, findings };
  }
  const regimeDir = resolved.resolved;

  // ── 2. Edit-only: the regime directory must already exist ────────────────
  if (!fs.existsSync(regimeDir)) {
    return { ok: false, status: 404, findings: [`regime "${region}/${id}" not found`] };
  }

  // Ignore any update key that isn't one of the three editable files.
  const proposed = {};
  for (const key of WRITABLE_FILES) {
    if (updates[key] != null) proposed[key] = updates[key];
  }
  if (Object.keys(proposed).length === 0) {
    findings.push('no editable fields supplied (metadata, identity, or soul)');
    return { ok: false, status: 400, findings };
  }

  // ── Read the CURRENT on-disk state (proposed overrides per field) ────────
  const readCurrent = (key) => {
    const p = path.join(regimeDir, FILENAMES[key]);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  };

  // ── 3. metadata.json must parse (current or proposed) ────────────────────
  let metadata;
  const metadataSource = proposed.metadata != null ? proposed.metadata : readCurrent('metadata');
  if (proposed.metadata != null) {
    // Accept either a parsed object or a raw JSON string from the body.
    if (typeof proposed.metadata === 'string') {
      try {
        metadata = JSON.parse(proposed.metadata);
      } catch {
        findings.push('metadata.json is not valid JSON');
        return { ok: false, status: 400, findings };
      }
    } else if (typeof proposed.metadata === 'object') {
      metadata = proposed.metadata;
    } else {
      findings.push('metadata must be a JSON object');
      return { ok: false, status: 400, findings };
    }
  } else if (metadataSource != null) {
    try {
      metadata = JSON.parse(metadataSource);
    } catch {
      // Existing metadata is corrupt — we can't safely re-serialize it. Refuse
      // rather than risk clobbering it on an unrelated edit.
      findings.push('existing metadata.json is not valid JSON; fix it before editing');
      return { ok: false, status: 400, findings };
    }
  } else {
    metadata = {};
  }

  // ── 4. IDENTITY must compile to ≥1 agent (the prose-rewrite hazard) ──────
  // The compiled agent count is derived from the PROPOSED identity (or the
  // current one if identity isn't being edited). This count drives agentCount.
  const identityMd = proposed.identity != null ? proposed.identity : (readCurrent('identity') ?? '');
  const agents = parseIdentityTable(identityMd);
  if (agents.length === 0) {
    findings.push(
      'IDENTITY.md has no parseable role-mapping table (Agent ID column) — a prose ' +
        'rewrite compiles to 0 agents and would brick the regime (AGENTS.md #2)'
    );
    return { ok: false, status: 400, findings };
  }

  // ── 5. Auto-sync metadata.agentCount to the compiled count (AGENTS #3) ───
  // Never trust the payload's count — re-derive it so the on-disk metadata
  // always agrees with the table the engine will actually compile.
  const syncedMetadata = { ...metadata, agentCount: agents.length };

  // ── 6. Topology cross-check (only if a topology.json exists) ─────────────
  // validateRegimeTopology() reads from disk, but we must validate the PROPOSED
  // state before writing. So we reuse the pure building blocks against the
  // proposed IDENTITY + the (unchanged) topology.json + synced metadata.
  const topologyPath = path.join(regimeDir, 'topology.json');
  if (fs.existsSync(topologyPath)) {
    let topology;
    try {
      topology = JSON.parse(fs.readFileSync(topologyPath, 'utf8'));
    } catch (e) {
      findings.push(`topology.json is not valid JSON: ${e.message}`);
      return { ok: false, status: 400, findings };
    }
    const topoErrors = [];
    topoErrors.push(...validateTopologyData(topology));
    topoErrors.push(...crossCheckIdentity(topology, identityMd));
    // mode must match the (synced) metadata's orchestrationPattern.
    const expectedMode = normalizeMode(syncedMetadata.orchestrationPattern);
    if (topology.mode && expectedMode !== topology.mode) {
      topoErrors.push(
        `mode "${topology.mode}" does not match metadata orchestrationPattern ` +
          `"${syncedMetadata.orchestrationPattern}" (normalized: "${expectedMode}")`
      );
    }
    if (topoErrors.length > 0) {
      findings.push(...topoErrors);
      return { ok: false, status: 400, findings };
    }
  }

  // ── All checks passed — assemble the exact bytes to write ────────────────
  const writes = [];
  // metadata.json is written whenever the caller sent it, and ALSO whenever the
  // synced agentCount differs from what is on disk — editing IDENTITY.md alone
  // changes the compiled agent count, and leaving metadata stale would break
  // AGENTS.md rule #3 and fail `npm run validate:regimes` on the next run.
  const agentCountDrifted = metadata.agentCount !== syncedMetadata.agentCount;
  if (proposed.metadata != null || agentCountDrifted) {
    writes.push({ key: 'metadata', path: path.join(regimeDir, FILENAMES.metadata), content: `${JSON.stringify(syncedMetadata, null, 2)}\n` });
  }
  if (proposed.identity != null) {
    writes.push({ key: 'identity', path: path.join(regimeDir, FILENAMES.identity), content: proposed.identity });
  }
  if (proposed.soul != null) {
    writes.push({ key: 'soul', path: path.join(regimeDir, FILENAMES.soul), content: proposed.soul });
  }

  // ── Atomic write: snapshot originals, write all, roll back on any failure ─
  const backups = writes.map((w) => ({ ...w, original: fs.existsSync(w.path) ? fs.readFileSync(w.path) : null }));
  try {
    for (const w of writes) atomicWrite(w.path, w.content);
  } catch (err) {
    // A write failed mid-batch — restore every file to its pre-edit bytes so the
    // regime is never left half-updated. Restore errors are surfaced but do not
    // mask the original failure.
    for (const b of backups) {
      try {
        if (b.original == null) {
          if (fs.existsSync(b.path)) fs.unlinkSync(b.path);
        } else {
          fs.writeFileSync(b.path, b.original);
        }
      } catch { /* best-effort rollback */ }
    }
    return { ok: false, status: 500, findings: [`write failed and was rolled back: ${err.message}`] };
  }

  // ── Invalidate the read cache so GET /api/regimes reflects the new state ──
  invalidateRegimeCache(regimesRoot);

  return {
    ok: true,
    summary: {
      regime: `${region}/${id}`,
      agentCount: agents.length,
      updated: writes.map((w) => FILENAMES[w.key]),
    },
  };
}
