#!/usr/bin/env node
/**
 * freeze-corpus.mjs — P0: freeze a representative legacy-cc-v5 trace corpus.
 *
 * Reads match/tournament artifacts from the local CivAgent data root and copies
 * a stratified, deterministic sample into `corpus/` together with a coverage
 * ledger (MANIFEST.json) that records per-file SHA-256 digests, dimension tags,
 * and declared coverage gaps. The corpus is immutable: verify-corpus.mjs
 * re-hashes every file and compares against the manifest.
 *
 * Stratification (per the adoption research plan §17 P0):
 *   - four E3 strata providers: cn:doubao, cn:glm, cn:qwen, cn:minimax
 *   - extra providers for breadth: cn:kimi, native, cn:mimo
 *   - topology treatments: historical (china/, global/) and random (_baseline/)
 *     — flat/solo do not exist in the legacy corpus and are declared as a gap
 *   - normal and failed runs (status done / vetoed / running)
 *   - mechanism use (veto_triggered / impeach_triggered / edict_triggered)
 *   - skill lifecycle (skill / skill_commit events)
 *   - plan/dispatch (meta.dispatchPlan) and judging (tournament artifacts)
 *
 * Selection inside a stratum is deterministic: mechanism and abnormal runs
 * first, then smallest files first (repository hygiene), then matchId. No
 * randomness; re-running with the same source data reproduces the same corpus.
 *
 * Usage:
 *   node packages/next/legacy-importer/freeze-corpus.mjs [--traces-per-stratum N] [--source DIR]
 *
 * The plan's pinned source baseline is recorded in the manifest so the ledger
 * is self-describing.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const LEGACY_BASELINE = "1460441528069465dca7263dba3e9ac01b18c78a";
const HARNESS_BASELINE = "47f943859bef60e4160492346772ded9b24f765a";
const INSTRUMENT = "legacy-cc-v5";

const args = process.argv.slice(2);
const tracesPerStratum = (() => {
  const i = args.indexOf("--traces-per-stratum");
  return i >= 0 ? Number(args[i + 1]) : 24;
})();
const sourceRoot = (() => {
  const i = args.indexOf("--source");
  return i >= 0 ? args[i + 1] : path.join(osHome(), ".civagent");
})();
const MATCHES_ROOT = path.join(sourceRoot, "matches");
const TOURNAMENTS_ROOT = path.join(sourceRoot, "tournaments");
const CORPUS_ROOT = path.join(__dirname, "corpus");
const TRACES_ROOT = path.join(CORPUS_ROOT, "traces");
const TOURNAMENTS_OUT = path.join(CORPUS_ROOT, "tournaments");

function osHome() {
  return process.env.HOME || process.env.USERPROFILE;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function taskLabel(task) {
  if (!task) return "unknown";
  if (/epidemic|plague|疫情|瘟疫/i.test(task)) return "plague-response";
  if (/governors|regional|藩镇|节度使|地方/i.test(task)) return "regional-militarization";
  if (/border city|border|边防|边城|突厥/i.test(task)) return "border-city-autonomy";
  if (/todo/i.test(task)) return "todo-crud";
  if (/tax revenue|税收|财政/i.test(task)) return "tax-revenue";
  if (/r3-manifest/i.test(task)) return "r3-manifest-structure";
  if (/漕运|canal/i.test(task)) return "canal-finance";
  if (/PONG/i.test(task)) return "pong";
  return "other";
}

function topologyOf(regime) {
  if (!regime) return "unknown";
  if (/^_?baseline\//.test(regime)) return "random";
  if (/^(china|global)\//.test(regime)) return "historical";
  return "unknown";
}

function classifyMatch(matchId, meta, eventsText) {
  const events = eventsText.trim().split("\n").filter(Boolean);
  const mechanismEvents = [];
  const skillEvents = [];
  for (const line of events) {
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    const t = e.type || "";
    if (/veto_triggered|impeach_triggered|edict_triggered/.test(t)) mechanismEvents.push(t);
    if (t === "skill" || t === "skill_commit") skillEvents.push(t);
  }
  return {
    matchId,
    backend: meta.backend || "?",
    command: meta.command || "?",
    regime: meta.regime || "?",
    topology: topologyOf(meta.regime),
    taskHash: crypto.createHash("sha256").update(meta.task || "").digest("hex").slice(0, 16),
    taskLabel: taskLabel(meta.task),
    status: meta.status || "?",
    startedAt: meta.startedAt ?? null,
    dispatchObservability: meta.dispatchObservability || null,
    eventCount: events.length,
    mechanismEvents,
    skillEvents,
  };
}

function collectMatches() {
  const out = [];
  if (!fs.existsSync(MATCHES_ROOT)) {
    console.error(`source matches root not found: ${MATCHES_ROOT}`);
    process.exit(1);
  }
  for (const d of fs.readdirSync(MATCHES_ROOT)) {
    const dir = path.join(MATCHES_ROOT, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    const metaFile = path.join(dir, "meta.json");
    const eventsFile = path.join(dir, "events.jsonl");
    if (!fs.existsSync(metaFile) || !fs.existsSync(eventsFile)) continue;
    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
    } catch {
      continue; // malformed meta is not corpus material
    }
    const eventsText = fs.readFileSync(eventsFile, "utf8");
    const cls = classifyMatch(d, meta, eventsText);
    cls.dir = dir;
    cls.sizeBytes = fs.statSync(eventsFile).size + fs.statSync(metaFile).size;
    out.push(cls);
  }
  return out;
}

function collectTournaments() {
  const out = [];
  if (!fs.existsSync(TOURNAMENTS_ROOT)) return out;
  for (const d of fs.readdirSync(TOURNAMENTS_ROOT)) {
    const dir = path.join(TOURNAMENTS_ROOT, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    const result = path.join(dir, "result.md");
    const manifest = path.join(dir, "manifest.json");
    if (!fs.existsSync(result)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".json"));
    out.push({ id: d, dir, files, sizeBytes: files.reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0) });
  }
  return out;
}

function bySizeAsc(a, b) {
  return a.sizeBytes - b.sizeBytes || a.matchId.localeCompare(b.matchId);
}

function pick(stratum, count) {
  // Two-phase deterministic selection. Mechanism runs and abnormal runs are
  // forced in first (they are the rare, scientifically valuable strata); the
  // remaining slots are filled by smallest files (repository hygiene). The
  // mechanism bonus must never be expressed as a scalar that file size can
  // swamp, hence the explicit phase separation.
  const mechanism = stratum.filter((m) => m.mechanismEvents.length).sort(bySizeAsc);
  const abnormal = stratum.filter((m) => m.status !== "done" && !m.mechanismEvents.length).sort(bySizeAsc);
  const rest = stratum.filter((m) => !m.mechanismEvents.length && m.status === "done").sort(bySizeAsc);
  const mechCap = Math.max(4, Math.floor(count / 4));
  const out = mechanism.slice(0, Math.min(mechanism.length, mechCap, count));
  for (const group of [abnormal, rest]) {
    for (const m of group) {
      if (out.length >= count) break;
      out.push(m);
    }
  }
  return out;
}

function main() {
  const all = collectMatches();
  const tournaments = collectTournaments();
  const byBackend = new Map();
  for (const m of all) {
    if (!byBackend.has(m.backend)) byBackend.set(m.backend, []);
    byBackend.get(m.backend).push(m);
  }

  const strata = ["cn:doubao", "cn:glm", "cn:qwen", "cn:minimax", "cn:kimi", "native", "cn:mimo"];
  const selected = [];
  const provenance = {};
  for (const b of strata) {
    const pool = byBackend.get(b) || [];
    if (!pool.length) {
      console.warn(`stratum "${b}" has no traces; skipping`);
      continue;
    }
    const n = strata.slice(0, 4).includes(b) ? tracesPerStratum : Math.max(2, Math.floor(tracesPerStratum / 8));
    const picked = pick(pool, Math.min(n, pool.length));
    selected.push(...picked);
    provenance[b] = { pool: pool.length, picked: picked.length };
  }

  // ensure at least one vetoed match is included overall
  if (!selected.some((m) => m.status === "vetoed")) {
    const vetoed = all.filter((m) => m.status === "vetoed" && !selected.includes(m));
    if (vetoed.length) {
      const v = vetoed.sort((a, b) => a.sizeBytes - b.sizeBytes)[0];
      selected.push(v);
      provenance.extra = { pool: vetoed.length, picked: 1, reason: "force-include vetoed" };
    }
  }

  fs.rmSync(CORPUS_ROOT, { recursive: true, force: true });
  fs.mkdirSync(TRACES_ROOT, { recursive: true });
  fs.mkdirSync(TOURNAMENTS_OUT, { recursive: true });

  const traces = [];
  let totalBytes = 0;
  for (const m of selected.sort((a, b) => a.matchId.localeCompare(b.matchId))) {
    const outDir = path.join(TRACES_ROOT, m.matchId);
    fs.mkdirSync(outDir, { recursive: true });
    fs.copyFileSync(path.join(m.dir, "meta.json"), path.join(outDir, "meta.json"));
    fs.copyFileSync(path.join(m.dir, "events.jsonl"), path.join(outDir, "events.jsonl"));
    const digests = {
      "meta.json": sha256(path.join(outDir, "meta.json")),
      "events.jsonl": sha256(path.join(outDir, "events.jsonl")),
    };
    const { dir, ...rest } = m;
    traces.push({ ...rest, sourceAbsPath: m.dir, digests, sizeBytes: m.sizeBytes });
    totalBytes += m.sizeBytes;
  }

  const tSel = tournaments
    .sort((a, b) => a.sizeBytes - b.sizeBytes)
    .slice(0, Math.min(3, tournaments.length));
  const tournamentEntries = [];
  for (const t of tSel) {
    const outDir = path.join(TOURNAMENTS_OUT, t.id);
    fs.mkdirSync(outDir, { recursive: true });
    const digests = {};
    for (const f of t.files) {
      fs.copyFileSync(path.join(t.dir, f), path.join(outDir, f));
      digests[f] = sha256(path.join(outDir, f));
    }
    tournamentEntries.push({ tournamentId: t.id, sourceAbsPath: t.dir, files: t.files, digests, sizeBytes: t.sizeBytes });
    totalBytes += t.sizeBytes;
  }

  const coverage = {};
  for (const t of traces) {
    coverage[t.backend] = coverage[t.backend] || { traces: 0, historical: 0, random: 0, abnormal: 0, mechanisms: 0, skillLifecycle: 0, tasks: new Set() };
    const c = coverage[t.backend];
    c.traces++;
    if (t.topology === "historical") c.historical++;
    if (t.topology === "random") c.random++;
    if (t.status !== "done") c.abnormal++;
    if (t.mechanismEvents.length) c.mechanisms++;
    if (t.skillEvents.length) c.skillLifecycle++;
    c.tasks.add(t.taskLabel);
  }

  const manifest = {
    schemaVersion: "corpus-v1",
    instrument: INSTRUMENT,
    legacyBaselineCommit: LEGACY_BASELINE,
    harnessBaselineCommit: HARNESS_BASELINE,
    frozenAt: new Date().toISOString(),
    sourceRoot,
    freezeTool: "packages/next/legacy-importer/freeze-corpus.mjs",
    selection: {
      rule: "per-stratum deterministic: mechanism runs first, abnormal runs second, smallest files third, matchId tiebreak; extra strata (kimi/native/mimo) at reduced count; 3 smallest tournaments for judging coverage",
      tracesPerE3Stratum: tracesPerStratum,
    },
    coverage: Object.fromEntries(
      Object.entries(coverage).map(([k, v]) => [k, { ...v, tasks: [...v.tasks].sort() }]),
    ),
    declaredGaps: [
      "topology treatments flat and solo do not exist anywhere in the legacy corpus (13 distinct regimes, all historical or *_random); they are native-epoch-only treatments",
      "npm registry lacks @deepseek-ai/dsh-* 0.1.0-rc.5 (the version at Harness baseline 47f9438); harness-adapter must resolve seams by building from the pinned source",
      "mimo traces exist but the E3 analysis froze the instrument without mimo (commit f2279f9); mimo entries here are non-E3 breadth samples",
    ],
    totals: { traces: traces.length, tournaments: tournamentEntries.length, bytes: totalBytes },
    traces,
    tournaments: tournamentEntries,
  };

  const manifestFile = path.join(CORPUS_ROOT, "MANIFEST.json");
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  const manifestDigest = sha256(manifestFile);

  console.log(JSON.stringify({
    corpusRoot: CORPUS_ROOT,
    traces: traces.length,
    tournaments: tournamentEntries.length,
    bytes: totalBytes,
    provenance,
    manifestDigest,
    declaredGaps: manifest.declaredGaps,
  }, null, 2));
}

// Run only when executed directly; importing this module must not re-freeze.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
