#!/usr/bin/env node
// stats.mjs — cross-tournament statistics: Bradley-Terry ability ranking with
// bootstrap confidence intervals and pairwise significance.
//
// Input: tournament manifest.json files (judge.scores = [{regime, score}]);
// score entries may optionally carry extra fields (e.g. dims from the swap-judge
// branch) — only regime/score are read, so both shapes are compatible.
//
// Method (following MT-Bench / LMC practice):
//   1. Per tournament, per pair of regimes: higher score wins; |Δ| below the
//      tie threshold counts as half a win each.
//   2. Fit Bradley-Terry abilities with MM iteration over all pairwise records.
//   3. Bootstrap: resample tournaments with replacement B times, re-fit BT each
//      time → ability CIs and rank intervals.
//   4. Pairwise significance: bootstrap distribution of the ability difference
//      p_a − p_b; a 95% CI containing 0 means "not separable".
//
// Zero dependencies. Pure functions exported for tests; CLI at the bottom.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Swap-double-judging averages two passes, so the real score grain is ~0.4/10
// (trial batch measured tieRate 70.6% at 0.8 — discrimination collapsed).
export const DEFAULT_TIE_THRESHOLD = 0.4;
export const DEFAULT_BOOTSTRAP = 1000;
export const MIN_SAMPLE = 5; // below this, warn that CIs are indicative only

// ── regime id aliases ────────────────────────────────────────────────────────
// Historical data contains id drift (e.g. global/athenian == global/athens).
// Built-in table is intentionally minimal; users extend via
// ~/.civagent/aliases.json ({ "drifted/id": "canonical/id" }).
export const ALIASES = { "global/athenian": "global/athens" };

export function loadAliases(home = os.homedir()) {
  const p = path.join(home, ".civagent", "aliases.json");
  let user = {};
  try {
    if (fs.existsSync(p)) user = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    /* a corrupt aliases file must never break stats */
  }
  return { ...ALIASES, ...(user && typeof user === "object" ? user : {}) };
}

export function normalizeRegime(id, aliases = null) {
  const a = aliases ?? loadAliases();
  return a[id] || id;
}

// Split manifests into swap-era (post-#17: judge.swap === true, comparable
// rubric scale) and legacy (different scale — would pollute the BT fit).
export function splitSwapEra(manifests, { includeLegacy = false } = {}) {
  const kept = [];
  let skippedLegacy = 0;
  for (const m of manifests) {
    if (includeLegacy || m?.manifest?.judge?.swap === true) kept.push(m);
    else skippedLegacy++;
  }
  return { kept, skippedLegacy };
}

// ── data ingestion ───────────────────────────────────────────────────────────

// Scan a directory for <dir>/<tournament-id>/manifest.json files.
// Returns [{ id, manifest }] sorted by id. Missing/unparseable manifests are
// skipped silently (they may be partial writes of a running tournament).
export function collectManifests(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const manifestPath = path.join(dir, entry, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    try {
      out.push({ id: entry, manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")) });
    } catch {
      /* skip unparseable manifest */
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

// Per-tournament pairwise records. Each record: { match, a, b, winA } where
// winA ∈ {1, 0.5, 0} from the perspective of regime a (0.5 = tie).
// Tournaments with fewer than 2 scored regimes contribute nothing.
// Regime ids are normalized through the alias table (id drift merged).
export function extractComparisons(manifests, { tieThreshold = DEFAULT_TIE_THRESHOLD, aliases = null } = {}) {
  const norm = (r) => normalizeRegime(r, aliases);
  const records = [];
  let used = 0;
  for (const { id, manifest } of manifests) {
    const scores = (manifest?.judge?.scores || []).filter(
      (s) => s && typeof s.regime === "string" && Number.isFinite(s.score),
    );
    if (scores.length < 2) continue;
    used++;
    for (let i = 0; i < scores.length; i++) {
      for (let j = i + 1; j < scores.length; j++) {
        const a = scores[i];
        const b = scores[j];
        const delta = a.score - b.score;
        records.push({
          match: id,
          a: norm(a.regime),
          b: norm(b.regime),
          winA: Math.abs(delta) < tieThreshold ? 0.5 : delta > 0 ? 1 : 0,
        });
      }
    }
  }
  const regimes = [...new Set(records.flatMap((r) => [r.a, r.b]))].sort();
  return { records, regimes, tournamentsUsed: used };
}

// Aggregate records into win counts: wins.get("a|b") = times a beat b
// (ties add 0.5 in both directions); games.get("a|b") with a<b = total games.
export function aggregateWins(records) {
  const wins = new Map();
  const games = new Map();
  const add = (map, key, v) => map.set(key, (map.get(key) || 0) + v);
  for (const r of records) {
    add(wins, `${r.a}|${r.b}`, r.winA);
    add(wins, `${r.b}|${r.a}`, 1 - r.winA);
    const key = [r.a, r.b].sort().join("|");
    add(games, key, 1);
  }
  return { wins, games };
}

// ── Bradley-Terry (MM iteration) ─────────────────────────────────────────────

// Fit BT abilities gamma_i > 0 (normalized to geometric mean 1).
// regimes: string[]; returns Map regime → ability. Regimes with no games are
// absent from the result.
//
// Perfect win/loss records make raw BT diverge (separation), so every regime
// also plays `prior` fictitious games against a phantom average opponent
// (gamma fixed at 1, half won) — a standard ridge-like regularization that
// keeps abilities finite and ordered identically.
export function fitBT(records, regimes, { maxIter = 10_000, tol = 1e-9, prior = 1 } = {}) {
  const { wins, games } = aggregateWins(records);
  const idx = new Map(regimes.map((r, i) => [r, i]));
  const m = regimes.length;
  const totalWins = new Float64Array(m);
  const opponents = new Map(); // i -> [{j, n}]
  for (let i = 0; i < m; i++) {
    const ri = regimes[i];
    opponents.set(i, []);
    for (let j = 0; j < m; j++) {
      if (i === j) continue;
      totalWins[i] += wins.get(`${ri}|${regimes[j]}`) || 0;
      const n = games.get([ri, regimes[j]].sort().join("|")) || 0;
      if (n > 0) opponents.get(i).push({ j, n });
    }
    totalWins[i] += prior / 2; // phantom prior, half won
  }

  let p = new Float64Array(m).fill(1);
  for (let iter = 0; iter < maxIter; iter++) {
    const next = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      let denom = prior / (p[i] + 1); // phantom opponent pinned at gamma = 1
      for (const { j, n } of opponents.get(i)) denom += n / (p[i] + p[j]);
      next[i] = denom > 0 ? totalWins[i] / denom : 1e-12;
      if (!Number.isFinite(next[i]) || next[i] <= 0) next[i] = 1e-12;
    }
    // Normalize to geometric mean 1 (identifiability constraint).
    const logMean = next.reduce((s, v) => s + Math.log(v), 0) / m;
    for (let i = 0; i < m; i++) next[i] = Math.exp(Math.log(next[i]) - logMean);
    let maxChange = 0;
    for (let i = 0; i < m; i++) {
      maxChange = Math.max(maxChange, Math.abs(Math.log(next[i]) - Math.log(p[i])));
    }
    p = next;
    if (maxChange < tol) break;
  }

  const out = new Map();
  for (let i = 0; i < m; i++) {
    if (opponents.get(i).length > 0) out.set(regimes[i], p[i]);
  }
  return out;
}

// ── bootstrap ────────────────────────────────────────────────────────────────

// Deterministic PRNG (mulberry32) so tests and reports are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ranksOf(abilities, regimes) {
  const order = regimes
    .filter((r) => abilities.has(r))
    .sort((x, y) => abilities.get(y) - abilities.get(x) || x.localeCompare(y));
  const rank = new Map();
  order.forEach((r, i) => rank.set(r, i + 1));
  return rank;
}

function percentile(sorted, q) {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// Full analysis: BT fit on all records + bootstrap over tournaments.
// By default only swap-era tournaments (judge.swap === true, post-#17 rubric
// scale) are counted; includeLegacy restores the old behavior and legacy
// manifests are always reported via skippedLegacy.
// Returns { rankings, pairwise, warnings, tournamentsUsed, skippedLegacy, regimes, B }.
export function analyze(manifests, {
  tieThreshold = DEFAULT_TIE_THRESHOLD,
  B = DEFAULT_BOOTSTRAP,
  seed = 42,
  includeLegacy = false,
  aliases = null,
} = {}) {
  const { kept, skippedLegacy } = splitSwapEra(manifests, { includeLegacy });
  const { records, regimes, tournamentsUsed } = extractComparisons(kept, { tieThreshold, aliases });
  const warnings = [];
  if (skippedLegacy > 0) {
    warnings.push(`skipped ${skippedLegacy} legacy tournaments (pre-swap scale; --include-legacy to keep)`);
  }
  if (tournamentsUsed === 0) {
    return { rankings: [], pairwise: [], warnings: [...warnings, "no tournaments with ≥2 scored regimes found"], tournamentsUsed, skippedLegacy, regimes, B };
  }
  if (tournamentsUsed < MIN_SAMPLE) {
    warnings.push(`样本不足（${tournamentsUsed} < ${MIN_SAMPLE} 场锦标赛），CI 仅供参考`);
  }

  // Group records by tournament for resampling.
  const byMatch = new Map();
  for (const r of records) {
    if (!byMatch.has(r.match)) byMatch.set(r.match, []);
    byMatch.get(r.match).push(r);
  }
  const matchIds = [...byMatch.keys()];

  const baseAbilities = fitBT(records, regimes);
  const baseRanks = ranksOf(baseAbilities, regimes);

  // Bootstrap: resample tournaments with replacement, re-fit.
  const rand = mulberry32(seed);
  const abilitySamples = new Map(regimes.map((r) => [r, []]));
  const rankSamples = new Map(regimes.map((r) => [r, []]));
  const diffSamples = new Map(); // "a|b" (sorted) -> [p_a - p_b]
  for (let b = 0; b < B; b++) {
    const sample = [];
    for (let k = 0; k < matchIds.length; k++) {
      const pick = matchIds[Math.floor(rand() * matchIds.length)];
      sample.push(...byMatch.get(pick));
    }
    const ab = fitBT(sample, regimes);
    const rk = ranksOf(ab, regimes);
    for (const r of regimes) {
      if (ab.has(r)) abilitySamples.get(r).push(ab.get(r));
      if (rk.has(r)) rankSamples.get(r).push(rk.get(r));
    }
    for (let i = 0; i < regimes.length; i++) {
      for (let j = i + 1; j < regimes.length; j++) {
        const a = regimes[i];
        const c = regimes[j];
        if (!ab.has(a) || !ab.has(c)) continue;
        const key = `${a}|${c}`;
        if (!diffSamples.has(key)) diffSamples.set(key, []);
        diffSamples.get(key).push(Math.log(ab.get(a)) - Math.log(ab.get(c)));
      }
    }
  }

  // Tournaments played per regime (distinct matches appearing in any record).
  const gamesPerRegime = new Map(regimes.map((r) => [r, new Set()]));
  for (const rec of records) {
    gamesPerRegime.get(rec.a)?.add(rec.match);
    gamesPerRegime.get(rec.b)?.add(rec.match);
  }

  const rankings = regimes
    .filter((r) => baseAbilities.has(r))
    .map((r) => {
      const abSamples = [...abilitySamples.get(r)].sort((x, y) => x - y);
      const rkSamples = [...rankSamples.get(r)].sort((x, y) => x - y);
      return {
        regime: r,
        ability: Math.round(baseAbilities.get(r) * 1000) / 1000,
        ci95: [percentile(abSamples, 0.025), percentile(abSamples, 0.975)].map((v) => Math.round(v * 1000) / 1000),
        rank: baseRanks.get(r),
        rankCi95: [percentile(rkSamples, 0.025), percentile(rkSamples, 0.975)],
        medianRank: percentile(rkSamples, 0.5),
        games: gamesPerRegime.get(r)?.size ?? 0,
      };
    })
    .sort((x, y) => x.rank - y.rank);

  // Pairwise significance + head-to-head records from the original data.
  const { wins, games } = aggregateWins(records);
  const pairwise = [];
  for (let i = 0; i < regimes.length; i++) {
    for (let j = i + 1; j < regimes.length; j++) {
      const a = regimes[i];
      const b = regimes[j];
      const key = `${a}|${b}`;
      const n = games.get(key) || 0;
      if (n === 0) continue;
      const diffs = [...(diffSamples.get(key) || [])].sort((x, y) => x - y);
      const ci = [percentile(diffs, 0.025), percentile(diffs, 0.975)].map((v) => Math.round(v * 1000) / 1000);
      pairwise.push({
        a,
        b,
        games: n,
        winsA: wins.get(key) || 0,
        winsB: wins.get(`${b}|${a}`) || 0,
        logAbilityDiff: Math.round((Math.log(baseAbilities.get(a) || 1e-12) - Math.log(baseAbilities.get(b) || 1e-12)) * 1000) / 1000,
        ci95: ci,
        significant: diffs.length > 0 && (ci[0] > 0 || ci[1] < 0),
      });
    }
  }

  return { rankings, pairwise, warnings, tournamentsUsed, skippedLegacy, regimes, B };
}

// ── human-readable output ────────────────────────────────────────────────────

export function formatTable(result) {
  const lines = [];
  lines.push(`CivAgent cross-tournament statistics (Bradley-Terry, bootstrap B=${result.B})`);
  lines.push(`tournaments used: ${result.tournamentsUsed}   regimes: ${result.regimes.length}`);
  for (const w of result.warnings) lines.push(`⚠ ${w}`);
  lines.push("");
  if (result.rankings.length === 0) return lines.join("\n");

  const rows = result.rankings.map((r) => [
    String(r.rank),
    r.regime,
    r.ability.toFixed(3),
    `[${r.ci95[0].toFixed(3)}, ${r.ci95[1].toFixed(3)}]`,
    `${r.medianRank}`,
    `[${r.rankCi95[0]}, ${r.rankCi95[1]}]`,
  ]);
  const head = ["rank", "regime", "ability", "ability CI95", "med rank", "rank CI95"];
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const fmt = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join("  ").trimEnd();
  lines.push(fmt(head));
  lines.push(widths.map((w) => "─".repeat(w)).join("  "));
  for (const r of rows) lines.push(fmt(r));

  const sig = result.pairwise.filter((p) => p.significant);
  lines.push("");
  lines.push(`pairwise significant (log-ability CI95 excludes 0): ${sig.length}/${result.pairwise.length} pairs`);
  for (const p of result.pairwise) {
    lines.push(
      `  ${p.a} vs ${p.b}: ${p.winsA}-${p.winsB} (${p.games} games)  Δlog γ ${p.logAbilityDiff}  CI95 [${p.ci95[0]}, ${p.ci95[1]}] ${p.significant ? "✓ sig" : "· ns"}`,
    );
  }
  return lines.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { dir: path.join(os.homedir(), ".civagent", "tournaments"), manifests: [], B: DEFAULT_BOOTSTRAP, tie: DEFAULT_TIE_THRESHOLD, json: false, includeLegacy: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir" && argv[i + 1]) opts.dir = argv[++i];
    else if (a === "--boot" && argv[i + 1]) opts.B = parseInt(argv[++i], 10);
    else if (a === "--tie" && argv[i + 1]) opts.tie = parseFloat(argv[++i]);
    else if (a === "--json") opts.json = true;
    else if (a === "--include-legacy") opts.includeLegacy = true;
    else opts.manifests.push(a);
  }
  return opts;
}

if (process.argv[1] && process.argv[1].endsWith("stats.mjs")) {
  const opts = parseArgs(process.argv.slice(2));
  let manifests;
  if (opts.manifests.length > 0) {
    // Positional args: tournament dirs or direct manifest.json paths.
    manifests = [];
    for (const p of opts.manifests) {
      const mp = p.endsWith("manifest.json") ? p : path.join(p, "manifest.json");
      if (!fs.existsSync(mp)) {
        console.error(`manifest not found: ${mp}`);
        process.exit(1);
      }
      try {
        manifests.push({ id: path.basename(path.dirname(mp)), manifest: JSON.parse(fs.readFileSync(mp, "utf8")) });
      } catch (e) {
        console.error(`unparseable manifest ${mp}: ${e.message}`);
        process.exit(1);
      }
    }
  } else {
    manifests = collectManifests(opts.dir);
  }

  if (manifests.length === 0) {
    console.error(`no tournament manifests found in ${opts.dir}`);
    process.exit(1);
  }

  const result = analyze(manifests, { tieThreshold: opts.tie, B: opts.B, includeLegacy: opts.includeLegacy });
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatTable(result));
  }
}
