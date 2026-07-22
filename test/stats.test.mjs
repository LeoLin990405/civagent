// stats.test.mjs — tests for the cross-tournament statistics pipeline
// (Bradley-Terry ranking + bootstrap CI + pairwise significance).
// All fixtures are synthetic manifests written to OS-temp dirs; judge CLIs
// are never invoked.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  collectManifests,
  extractComparisons,
  fitBT,
  analyze,
  formatTable,
  mulberry32,
  MIN_SAMPLE,
  DEFAULT_TIE_THRESHOLD,
} from "../engine/v5/stats.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const STATS_MJS = path.join(PROJECT_ROOT, "engine", "v5", "stats.mjs");
const CIVAGENT_BIN = path.join(PROJECT_ROOT, "bin", "civagent");

// ── fixtures ─────────────────────────────────────────────────────────────────

function manifestFor(scores) {
  return { judge: { scores: scores.map(([regime, score]) => ({ regime, score })) } };
}

// Write N tournament dirs with manifests into a fresh temp dir.
// scoreSets: array of [[regime, score], ...] per tournament.
function makeTournamentDir(scoreSets) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-stats-"));
  scoreSets.forEach((scores, i) => {
    const tdir = path.join(dir, `t${String(i).padStart(3, "0")}`);
    fs.mkdirSync(tdir, { recursive: true });
    fs.writeFileSync(path.join(tdir, "manifest.json"), JSON.stringify(manifestFor(scores)));
  });
  return dir;
}

const rmrf = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ } };

// 12 tournaments: tang > qin > athens, consistent ordering.
const STRONG_MID_WEAK = Array.from({ length: 12 }, () => [
  ["china/tang", 9], ["china/qin", 7], ["global/athens", 5],
]);

// ── ingestion ────────────────────────────────────────────────────────────────

test("collectManifests scans tournament dirs and skips junk", () => {
  const dir = makeTournamentDir([[["a", 1], ["b", 2]], [["a", 3], ["b", 1]]]);
  try {
    fs.writeFileSync(path.join(dir, "stray-file"), "not a dir");
    fs.mkdirSync(path.join(dir, "no-manifest-here"));
    const found = collectManifests(dir);
    assert.equal(found.length, 2);
    assert.deepEqual(found.map((f) => f.id), ["t000", "t001"]);
  } finally {
    rmrf(dir);
  }
});

test("extractComparisons builds pairwise records with tie threshold", () => {
  const manifests = [
    { id: "m1", manifest: manifestFor([["a", 9.0], ["b", 8.6], ["c", 8.4]]) },
    { id: "m2", manifest: manifestFor([["a", 5]]) }, // <2 scores → skipped
  ];
  const { records, regimes, tournamentsUsed } = extractComparisons(manifests, { tieThreshold: 0.5 });
  assert.equal(tournamentsUsed, 1);
  assert.equal(records.length, 3); // C(3,2)
  assert.deepEqual(regimes, ["a", "b", "c"]);
  const ab = records.find((r) => r.a === "a" && r.b === "b");
  assert.equal(ab.winA, 0.5, "|Δ|=0.4 < 0.5 → tie");
  const bc = records.find((r) => r.a === "b" && r.b === "c");
  assert.equal(bc.winA, 0.5, "|Δ|=0.2 < 0.5 → tie");
  const ac = records.find((r) => r.a === "a" && r.b === "c");
  assert.equal(ac.winA, 1, "|Δ|=0.6 ≥ 0.5 → decisive win");
});

test("tie threshold is configurable and boundary is strict (<)", () => {
  // Default follows the rubric's smallest normalized grain (~0.83 after swap aggregation).
  assert.equal(DEFAULT_TIE_THRESHOLD, 0.8);
  const manifests = [{ id: "m", manifest: manifestFor([["a", 5.5], ["b", 5.0]]) }];
  assert.equal(extractComparisons(manifests, { tieThreshold: 0.5 }).records[0].winA, 1, "Δ=0.5 is NOT a tie at threshold 0.5");
  assert.equal(extractComparisons(manifests, { tieThreshold: 0.6 }).records[0].winA, 0.5, "Δ=0.5 < 0.6 → tie");
  // At the new default, Δ=0.5 is a tie but Δ=0.9 is decisive.
  assert.equal(extractComparisons(manifests).records[0].winA, 0.5, "Δ=0.5 < 0.8 default → tie");
  const wide = [{ id: "m", manifest: manifestFor([["a", 5.9], ["b", 5.0]]) }];
  assert.equal(extractComparisons(wide).records[0].winA, 1, "Δ=0.9 ≥ 0.8 default → decisive");
});

// ── Bradley-Terry fit ────────────────────────────────────────────────────────

test("BT recovers a known strong/mid/weak ordering", () => {
  const dir = makeTournamentDir(STRONG_MID_WEAK);
  try {
    const { records, regimes } = extractComparisons(collectManifests(dir));
    const abilities = fitBT(records, regimes);
    assert.ok(abilities.get("china/tang") > abilities.get("china/qin"), "tang must outrank qin");
    assert.ok(abilities.get("china/qin") > abilities.get("global/athens"), "qin must outrank athens");
    // Consistent blowouts → large ratios.
    assert.ok(abilities.get("china/tang") / abilities.get("global/athens") > 4);
  } finally {
    rmrf(dir);
  }
});

test("always-tied regimes get equal abilities", () => {
  const manifests = Array.from({ length: 6 }, (_, i) => ({
    id: `m${i}`, manifest: manifestFor([["x", 7], ["y", 7.1]]),
  }));
  const { records, regimes } = extractComparisons(manifests, { tieThreshold: 0.5 });
  const abilities = fitBT(records, regimes);
  const ratio = abilities.get("x") / abilities.get("y");
  assert.ok(Math.abs(ratio - 1) < 0.01, `tied regimes must be ~equal, ratio=${ratio}`);
});

// ── analyze: ranking + bootstrap CI + significance + warnings ────────────────

test("analyze ranks consistently and flags significant pairs", () => {
  const dir = makeTournamentDir(STRONG_MID_WEAK);
  try {
    const r = analyze(collectManifests(dir), { B: 200, seed: 7 });
    assert.equal(r.tournamentsUsed, 12);
    assert.deepEqual(r.warnings, []);
    assert.deepEqual(r.rankings.map((x) => x.regime), ["china/tang", "china/qin", "global/athens"]);
    assert.ok(r.rankings.every((x) => x.games === 12), "every regime played all 12 tournaments");
    for (const row of r.rankings) {
      assert.ok(row.ci95[0] <= row.ability && row.ability <= row.ci95[1], "ability inside its CI");
      assert.ok(row.ci95[0] > 0, "abilities positive");
      assert.ok(row.rankCi95[0] <= row.rank && row.rank <= row.rankCi95[1]);
    }
    // All wins one direction → every pair separable.
    assert.ok(r.pairwise.every((p) => p.significant), "deterministic ordering must be significant");
    const tq = r.pairwise.find((p) => p.a === "china/qin" || p.b === "china/qin");
    assert.ok(tq.games > 0);
  } finally {
    rmrf(dir);
  }
});

test("alternating winners are NOT significant (CI contains 0)", () => {
  // 8 tournaments: even → e wins, odd → f wins (exactly 4-4).
  const sets = Array.from({ length: 8 }, (_, i) =>
    i % 2 === 0 ? [["e", 8], ["f", 6]] : [["e", 6], ["f", 8]],
  );
  const dir = makeTournamentDir(sets);
  try {
    const r = analyze(collectManifests(dir), { B: 200, seed: 11 });
    const p = r.pairwise.find((x) => (x.a === "e" && x.b === "f") || (x.a === "f" && x.b === "e"));
    assert.equal(p.winsA + p.winsB, 8);
    assert.equal(p.significant, false, `balanced rivalry must be ns, CI=${p.ci95}`);
    assert.ok(p.ci95[0] <= 0 && p.ci95[1] >= 0, "CI must contain 0");
  } finally {
    rmrf(dir);
  }
});

test("small samples trigger the 样本不足 warning", () => {
  const dir = makeTournamentDir(STRONG_MID_WEAK.slice(0, 3));
  try {
    const r = analyze(collectManifests(dir), { B: 50, seed: 3 });
    assert.equal(r.tournamentsUsed, 3);
    assert.ok(r.warnings.some((w) => w.includes("样本不足")), `warnings: ${r.warnings}`);
    assert.ok(MIN_SAMPLE > 3);
  } finally {
    rmrf(dir);
  }
});

test("empty input yields a clear warning, not a crash", () => {
  const r = analyze([], { B: 10 });
  assert.deepEqual(r.rankings, []);
  assert.ok(r.warnings.length > 0);
});

test("mulberry32 is deterministic per seed", () => {
  const a = mulberry32(123);
  const b = mulberry32(123);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});

// ── CLI ──────────────────────────────────────────────────────────────────────

function runCli(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    proc.stdout.on("data", (d) => { out += d; });
    proc.stderr.on("data", (d) => { err += d; });
    proc.on("error", reject);
    proc.on("close", (code) => resolve({ code, out, err }));
  });
}

test("CLI: stats --dir prints a human table; --json prints machine output", { timeout: 30_000 }, async () => {
  const dir = makeTournamentDir(STRONG_MID_WEAK);
  try {
    const table = await runCli("node", [STATS_MJS, "--dir", dir, "--boot", "100"]);
    assert.equal(table.code, 0, `stderr: ${table.err}`);
    assert.match(table.out, /Bradley-Terry/);
    assert.match(table.out, /china\/tang/);
    assert.match(table.out, /rank/);

    const js = await runCli("node", [STATS_MJS, "--dir", dir, "--boot", "100", "--json"]);
    assert.equal(js.code, 0, `stderr: ${js.err}`);
    const parsed = JSON.parse(js.out);
    assert.equal(parsed.rankings[0].regime, "china/tang");
    assert.equal(parsed.tournamentsUsed, 12);
  } finally {
    rmrf(dir);
  }
});

test("CLI: positional tournament dirs work; empty dir exits 1", { timeout: 30_000 }, async () => {
  const dir = makeTournamentDir(STRONG_MID_WEAK.slice(0, 6));
  try {
    const dirs = fs.readdirSync(dir).map((d) => path.join(dir, d));
    const r = await runCli("node", [STATS_MJS, "--boot", "50", ...dirs]);
    assert.equal(r.code, 0, `stderr: ${r.err}`);
    assert.match(r.out, /tournaments used: 6/);

    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-stats-empty-"));
    try {
      const r2 = await runCli("node", [STATS_MJS, "--dir", empty]);
      assert.equal(r2.code, 1);
      assert.match(r2.err, /no tournament manifests/);
    } finally {
      rmrf(empty);
    }
  } finally {
    rmrf(dir);
  }
});

test("CLI: wired into bin/civagent as `civagent stats`", { timeout: 30_000 }, async () => {
  const dir = makeTournamentDir(STRONG_MID_WEAK.slice(0, 5));
  try {
    const r = await runCli("bash", [CIVAGENT_BIN, "stats", "--dir", dir, "--boot", "50"]);
    assert.equal(r.code, 0, `stderr: ${r.err}`);
    assert.match(r.out, /Bradley-Terry/);
    assert.match(r.out, /china\/qin/);
  } finally {
    rmrf(dir);
  }
});

test("formatTable renders all sections", () => {
  const dir = makeTournamentDir(STRONG_MID_WEAK.slice(0, 4));
  try {
    const r = analyze(collectManifests(dir), { B: 50, seed: 5 });
    const table = formatTable(r);
    assert.match(table, /ability CI95/);
    assert.match(table, /pairwise significant/);
    assert.match(table, /样本不足/); // 4 < MIN_SAMPLE
  } finally {
    rmrf(dir);
  }
});
