#!/usr/bin/env node
// hillclimb.mjs — L4 hill-climbing loop (iteration-directions §2.2).
//
//   analyze → propose → (human) validate → apply / rollback
//
// Hard rules:
//   - ZERO LLM calls. The analyzer is deterministic heuristics over the event
//     streams; proposals are diffs that never take effect by themselves.
//   - Validation (paired tournaments on a held-out task set) is NEVER run by
//     this module — it prints a command plan for the user (token spend is a
//     human decision). A --fake-backend mode exercises the paired-comparison
//     pipeline synthetically for tests/demos.
//   - apply/rollback go through a changelog with state snapshots, so every
//     mutation is reversible.
//
// Data layout (all under $HOME/.civagent):
//   tournaments/<id>/manifest.json          (judge.scores, civs, swap passes)
//   matches/<id>/{events.jsonl,meta.json}   (skill events, regimes)
//   hillclimb/proposals/<id>.json           (proposal cards)
//   hillclimb/changelog.jsonl               (apply/rollback audit log)
//   config.json                             (hillclimb-managed config overlay)

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { collectManifests, extractComparisons, mulberry32 } from "./stats.mjs";

export const DEFAULTS = {
  minTournaments: 50,        // below this, warn "不建议启动爬山"
  minEvidenceTournaments: 5, // below this, propose() emits nothing
  lowScore: 6.0,             // /10 — below counts as a low-scoring match
  evidenceMatches: 3,        // min matches on both sides of a co-occurrence split
  effectSize: 1.0,           // min mean-score delta (/10) to consider actionable
};

export const PROPOSAL_TYPES = ["skill_disable", "skill_promote", "config_tune"];

export function hcPaths(home = os.homedir()) {
  const root = path.join(home, ".civagent");
  return {
    root,
    tournaments: path.join(root, "tournaments"),
    matches: path.join(root, "matches"),
    hc: path.join(root, "hillclimb"),
    proposals: path.join(root, "hillclimb", "proposals"),
    changelog: path.join(root, "hillclimb", "changelog.jsonl"),
    config: path.join(root, "config.json"),
  };
}

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function readJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// ── data loading ─────────────────────────────────────────────────────────────

// Per-match skill events joined with the match's regime.
export function loadSkillEvents(home = os.homedir()) {
  const { matches } = hcPaths(home);
  const out = []; // [{ matchId, regime, status, skillPath, ts }]
  if (!fs.existsSync(matches)) return out;
  for (const id of fs.readdirSync(matches)) {
    const dir = path.join(matches, id);
    const metaPath = path.join(dir, "meta.json");
    const eventsPath = path.join(dir, "events.jsonl");
    if (!fs.existsSync(eventsPath)) continue;
    let regime = null;
    try { regime = readJson(metaPath).regime ?? null; } catch { /* tolerate */ }
    for (const ev of readJsonl(eventsPath)) {
      if (ev.type !== "skill") continue;
      out.push({ matchId: id, regime: regime ?? ev.regime ?? null, status: ev.status, skillPath: ev.skillPath ?? null, ts: ev.ts ?? 0 });
    }
  }
  return out;
}

// ── analyze ──────────────────────────────────────────────────────────────────

export function analyze({ home = os.homedir(), since = null, minTournaments = DEFAULTS.minTournaments } = {}) {
  const { tournaments } = hcPaths(home);
  let manifests = collectManifests(tournaments);
  if (since) {
    const t = Date.parse(since);
    manifests = manifests.filter(({ manifest }) => (manifest.createdAt ?? 0) >= t);
  }

  // matchId → { regime, score } across all tournaments (for co-occurrence).
  const scoreByMatch = new Map();
  const perRegime = new Map(); // regime → { scores[], dims: {d: []}, tasks: Map(task → [{score, ts}]) }
  let swapsOff = 0;
  for (const { manifest } of manifests) {
    if (manifest?.judge?.swap === false) swapsOff++;
    const task = manifest.task ?? "";
    const ts = manifest.createdAt ?? 0;
    for (const s of manifest?.judge?.scores ?? []) {
      if (!s || typeof s.regime !== "string" || !Number.isFinite(s.score)) continue;
      if (!perRegime.has(s.regime)) perRegime.set(s.regime, { scores: [], dims: {}, tasks: new Map() });
      const r = perRegime.get(s.regime);
      r.scores.push(s.score);
      if (s.dims) for (const [d, v] of Object.entries(s.dims)) {
        if (!Number.isFinite(v)) continue;
        if (!r.dims[d]) r.dims[d] = [];
        r.dims[d].push(v);
      }
      if (!r.tasks.has(task)) r.tasks.set(task, []);
      r.tasks.get(task).push({ score: s.score, ts });
    }
    for (const civ of manifest?.civs ?? []) {
      const sc = (manifest?.judge?.scores ?? []).find((x) => x.regime === civ.regime);
      if (civ.matchId && sc) scoreByMatch.set(civ.matchId, { regime: civ.regime, score: sc.score });
    }
  }

  const { records } = extractComparisons(manifests.map((m) => ({ id: m.id, manifest: m.manifest })));
  const ties = records.filter((r) => r.winA === 0.5).length;
  const tieRate = records.length > 0 ? ties / records.length : 0;

  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
  const regimes = {};
  for (const [regime, r] of perRegime) {
    const dimMeans = Object.fromEntries(Object.entries(r.dims).map(([d, xs]) => [d, mean(xs)]));
    const weakestDim = Object.keys(dimMeans).length
      ? Object.entries(dimMeans).sort((a, b) => a[1] - b[1])[0][0]
      : null;
    // repeated failures: same task, ≥2 consecutive low scores
    const repeatedFailures = [];
    for (const [task, runs] of r.tasks) {
      const sorted = [...runs].sort((a, b) => a.ts - b.ts);
      let streak = 0;
      for (const run of sorted) {
        streak = run.score < DEFAULTS.lowScore ? streak + 1 : 0;
        if (streak === 2) repeatedFailures.push({ task, scores: sorted.map((x) => x.score) });
      }
    }
    regimes[regime] = {
      matches: r.scores.length,
      meanScore: Math.round(mean(r.scores) * 100) / 100,
      lowCount: r.scores.filter((s) => s < DEFAULTS.lowScore).length,
      dimMeans,
      weakestDim,
      repeatedFailures,
    };
  }

  // skill stats + co-occurrence with scores
  const skillEvents = loadSkillEvents(home);
  const skillStats = {}; // per regime { saved, staged, rejected, skipped, error }
  const cooccur = new Map(); // `${regime}|${skillPath}|${status}` → { with: [], without: [] }
  const byRegimeSkill = new Map(); // `${regime}|${skillPath}` → { status, matchIds: [] }
  for (const ev of skillEvents) {
    if (!ev.regime) continue;
    if (!skillStats[ev.regime]) skillStats[ev.regime] = { saved: 0, staged: 0, rejected: 0, skipped: 0, error: 0 };
    if (ev.status in skillStats[ev.regime]) skillStats[ev.regime][ev.status]++;
    if (ev.skillPath && (ev.status === "saved" || ev.status === "staged")) {
      const key = `${ev.regime}|${ev.skillPath}`;
      if (!byRegimeSkill.has(key)) byRegimeSkill.set(key, { status: ev.status, matchIds: [] });
      byRegimeSkill.get(key).matchIds.push(ev.matchId);
    }
  }
  for (const [key, v] of byRegimeSkill) {
    const [regime, skillPath] = key.split("|");
    const withSet = new Set(v.matchIds);
    const withScores = [];
    const withoutScores = [];
    for (const [matchId, sc] of scoreByMatch) {
      if (sc.regime !== regime) continue;
      (withSet.has(matchId) ? withScores : withoutScores).push(sc.score);
    }
    cooccur.set(key, { status: v.status, withScores, withoutScores });
  }

  const warnings = [];
  let recommendation = "start";
  if (manifests.length < minTournaments) {
    warnings.push(`锦标赛数据 ${manifests.length} < ${minTournaments} 局，不建议启动爬山（先积累对局）`);
    recommendation = "hold";
  }

  return {
    generatedAt: new Date().toISOString(),
    tournamentsUsed: manifests.length,
    pairwiseRecords: records.length,
    tieRate: Math.round(tieRate * 1000) / 1000,
    swapsOff,
    regimes,
    skillStats,
    cooccurrence: Object.fromEntries([...cooccur].map(([k, v]) => [k, {
      status: v.status,
      withN: v.withScores.length,
      withoutN: v.withoutScores.length,
      withMean: Math.round(mean(v.withScores) * 100) / 100,
      withoutMean: Math.round(mean(v.withoutScores) * 100) / 100,
    }])),
    warnings,
    recommendation,
  };
}

// ── propose ──────────────────────────────────────────────────────────────────

export function buildProposals(analysis, {
  minEvidenceTournaments = DEFAULTS.minEvidenceTournaments,
  evidenceMatches = DEFAULTS.evidenceMatches,
  effectSize = DEFAULTS.effectSize,
} = {}) {
  if (analysis.tournamentsUsed < minEvidenceTournaments) {
    return { proposals: [], heldBack: `锦标赛 ${analysis.tournamentsUsed} < ${minEvidenceTournaments}，样本不足，不生成提案` };
  }
  const proposals = [];
  const stamp = new Date().toISOString().slice(0, 10);
  const mkId = (type, key) =>
    `hc-${stamp}-${crypto.createHash("sha256").update(type + key).digest("hex").slice(0, 8)}`;

  // skill_disable: a saved skill co-occurs with significantly lower scores.
  for (const [key, c] of Object.entries(analysis.cooccurrence)) {
    const [regime, skillPath] = key.split("|");
    if (c.status !== "saved") continue;
    if (c.withN < evidenceMatches || c.withoutN < evidenceMatches) continue;
    const delta = c.withoutMean - c.withMean; // positive = skill hurts
    if (!(delta >= effectSize)) continue;
    proposals.push({
      id: mkId("skill_disable", key),
      createdAt: new Date().toISOString(),
      type: "skill_disable",
      status: "proposed",
      regime,
      skillPath,
      evidence: { withN: c.withN, withoutN: c.withoutN, withMean: c.withMean, withoutMean: c.withoutMean, delta },
      rationale: `skill ${path.basename(skillPath)} 与低分共现：携带局均分 ${c.withMean}（n=${c.withN}）vs 未携带 ${c.withoutMean}（n=${c.withoutN}），Δ=${delta.toFixed(2)}`,
    });
  }

  // skill_promote: a staged skill co-occurs with significantly higher scores.
  for (const [key, c] of Object.entries(analysis.cooccurrence)) {
    const [regime, skillPath] = key.split("|");
    if (c.status !== "staged") continue;
    if (c.withN < evidenceMatches || c.withoutN < evidenceMatches) continue;
    const delta = c.withMean - c.withoutMean; // positive = skill helps
    if (!(delta >= effectSize)) continue;
    proposals.push({
      id: mkId("skill_promote", key),
      createdAt: new Date().toISOString(),
      type: "skill_promote",
      status: "proposed",
      regime,
      skillPath,
      evidence: { withN: c.withN, withoutN: c.withoutN, withMean: c.withMean, withoutMean: c.withoutMean, delta },
      rationale: `staged skill ${path.basename(skillPath)} 与高分共现：Δ=${delta.toFixed(2)}（n=${c.withN} vs ${c.withoutN}），建议 approve`,
    });
  }

  // config_tune: judge swap disabled in some tournaments → re-enable.
  if (analysis.swapsOff > 0) {
    proposals.push({
      id: mkId("config_tune", "CIVAGENT_JUDGE_SWAP"),
      createdAt: new Date().toISOString(),
      type: "config_tune",
      status: "proposed",
      config: { key: "CIVAGENT_JUDGE_SWAP", value: "1" },
      evidence: { swapsOff: analysis.swapsOff, tournamentsUsed: analysis.tournamentsUsed },
      rationale: `${analysis.swapsOff}/${analysis.tournamentsUsed} 场锦标赛以 swap=off 运行，削弱顺序偏差校正；建议恢复双评`,
    });
  }
  // config_tune: tie band too wide → scores can't discriminate.
  if (analysis.tieRate > 0.4) {
    proposals.push({
      id: mkId("config_tune", "tieThreshold"),
      createdAt: new Date().toISOString(),
      type: "config_tune",
      status: "proposed",
      config: { key: "tieThreshold", delta: -0.2 },
      evidence: { tieRate: analysis.tieRate, pairwiseRecords: analysis.pairwiseRecords },
      rationale: `平局率 ${(analysis.tieRate * 100).toFixed(1)}%（${analysis.pairwiseRecords} 对），区分度过低；建议下调平局阈值`,
    });
  }

  return { proposals };
}

export function writeProposals(analysis, opts, home = os.homedir()) {
  const { proposals } = buildProposals(analysis, opts);
  const { proposals: dir } = hcPaths(home);
  fs.mkdirSync(dir, { recursive: true });
  for (const p of proposals) {
    fs.writeFileSync(path.join(dir, `${p.id}.json`), JSON.stringify(p, null, 2) + "\n");
  }
  return proposals;
}

export function readProposal(id, home = os.homedir()) {
  const p = path.join(hcPaths(home).proposals, `${id}.json`);
  if (!fs.existsSync(p)) throw new Error(`proposal not found: ${id}`);
  return readJson(p);
}

function writeProposal(p, home) {
  fs.writeFileSync(path.join(hcPaths(home).proposals, `${p.id}.json`), JSON.stringify(p, null, 2) + "\n");
}

// ── paired comparison (validation statistics) ────────────────────────────────

// pairs: [{ task, regime, baseline, candidate }] — same task, same regime.
// Bootstrap over pairs (resample with replacement) → CI of mean(candidate −
// baseline). Significant when the 95% CI excludes 0.
export function pairedCompare(pairs, { B = 1000, seed = 42 } = {}) {
  if (!pairs.length) return { n: 0, meanDelta: NaN, ci95: [NaN, NaN], significant: false };
  const diffs = pairs.map((p) => p.candidate - p.baseline);
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const rand = mulberry32(seed);
  const samples = [];
  for (let b = 0; b < B; b++) {
    let s = 0;
    for (let k = 0; k < diffs.length; k++) s += diffs[Math.floor(rand() * diffs.length)];
    samples.push(s / diffs.length);
  }
  samples.sort((a, b) => a - b);
  const q = (x) => samples[Math.min(samples.length - 1, Math.floor(x * samples.length))];
  const ci = [q(0.025), q(0.975)].map((v) => Math.round(v * 1000) / 1000);
  return { n: pairs.length, meanDelta: Math.round(mean(diffs) * 1000) / 1000, ci95: ci, significant: ci[0] > 0 || ci[1] < 0 };
}

// ── validate (plan only; fake-backend mode for tests) ────────────────────────

// Build the human-executable validation plan for a proposal. With
// fakeBackend=true, synthesize paired baseline/candidate results and run the
// paired bootstrap — no tournaments are launched either way.
export function validateProposal(id, {
  home = os.homedir(),
  heldOutTasks = [],
  repeats = 5,
  fakeBackend = false,
  seed = 42,
  B = 1000,
} = {}) {
  const proposal = readProposal(id, home);
  const tasks = heldOutTasks.length ? heldOutTasks : ["<held-out task 1>", "<held-out task 2>", "<held-out task 3>"];
  const civ = proposal.regime ?? "<regime>";

  const plan = [
    `# Validation plan for ${id} (${proposal.type})`,
    `# 1) baseline — current state, ${repeats}× per held-out task:`,
    ...tasks.map((t) => `civagent tournament --civs ${civ},global/athens "${t}"   # ×${repeats}`),
    `# 2) record baseline scores, then apply the proposal:`,
    `civagent hillclimb apply ${id}`,
    `# 3) candidate — SAME tasks, SAME seeds/order:`,
    ...tasks.map((t) => `civagent tournament --civs ${civ},global/athens "${t}"   # ×${repeats}`),
    `# 4) paired comparison (significant only if CI excludes 0):`,
    `civagent stats --json   # or node engine/v5/hillclimb.mjs compare`,
    `# 5) keep the change iff significant & positive; otherwise:`,
    `civagent hillclimb rollback ${id}`,
  ];

  if (!fakeBackend) {
    return { proposalId: id, type: proposal.type, mode: "plan", plan };
  }

  // Synthetic paired run: deterministic improvement (+0.8) over baseline.
  const rand = mulberry32(seed);
  const pairs = [];
  for (const t of tasks) {
    for (let k = 0; k < repeats; k++) {
      const baseline = 7 + Math.floor(rand() * 2); // 7..8
      pairs.push({ task: t, regime: civ, baseline, candidate: baseline + 0.8 });
    }
  }
  const paired = pairedCompare(pairs, { B, seed });
  return { proposalId: id, type: proposal.type, mode: "fake-backend", plan, paired };
}

// ── apply / rollback ─────────────────────────────────────────────────────────

function appendChangelog(home, entry) {
  const { changelog } = hcPaths(home);
  fs.mkdirSync(path.dirname(changelog), { recursive: true });
  fs.appendFileSync(changelog, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
}

function moveFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
}

export function applyProposal(id, home = os.homedir()) {
  const proposal = readProposal(id, home);
  if (proposal.status === "applied") throw new Error(`proposal ${id} already applied`);
  const { root } = hcPaths(home);
  const snapshot = { type: proposal.type };

  if (proposal.type === "skill_disable") {
    const from = proposal.skillPath;
    if (!fs.existsSync(from)) throw new Error(`skill file missing: ${from}`);
    const to = path.join(path.dirname(from), "quarantine", path.basename(from));
    snapshot.fileOps = [{ op: "move", from, to }];
    moveFile(from, to);
  } else if (proposal.type === "skill_promote") {
    const from = proposal.skillPath; // expected under skills/staging/
    if (!fs.existsSync(from)) throw new Error(`staged skill missing: ${from}`);
    const stagingDir = path.dirname(from);
    const to = path.join(path.dirname(stagingDir), path.basename(from));
    snapshot.fileOps = [{ op: "move", from, to }];
    moveFile(from, to);
  } else if (proposal.type === "config_tune") {
    const configPath = hcPaths(home).config;
    const before = fs.existsSync(configPath) ? readJson(configPath) : {};
    const after = { ...before, [proposal.config.key]: proposal.config.value ?? proposal.config.delta };
    snapshot.config = { path: configPath, before, after };
    fs.writeFileSync(configPath, JSON.stringify(after, null, 2) + "\n");
  } else {
    throw new Error(`unknown proposal type: ${proposal.type}`);
  }

  proposal.status = "applied";
  proposal.appliedAt = new Date().toISOString();
  writeProposal(proposal, home);
  appendChangelog(home, { action: "apply", proposalId: id, snapshot });
  return { applied: id, snapshot };
}

export function rollback(id, home = os.homedir()) {
  const proposal = readProposal(id, home);
  if (proposal.status !== "applied") throw new Error(`proposal ${id} is not applied (status=${proposal.status})`);
  // Recover the snapshot from the changelog (single source of truth).
  const lines = readJsonl(hcPaths(home).changelog);
  const entry = [...lines].reverse().find((l) => l.action === "apply" && l.proposalId === id);
  if (!entry) throw new Error(`no apply snapshot found for ${id}`);
  const { snapshot } = entry;

  if (snapshot.fileOps) {
    for (const op of [...snapshot.fileOps].reverse()) {
      if (fs.existsSync(op.to)) moveFile(op.to, op.from);
    }
  }
  if (snapshot.config) {
    fs.writeFileSync(snapshot.config.path, JSON.stringify(snapshot.config.before, null, 2) + "\n");
  }

  proposal.status = "rolled_back";
  proposal.rolledBackAt = new Date().toISOString();
  writeProposal(proposal, home);
  appendChangelog(home, { action: "rollback", proposalId: id, snapshot });
  return { rolledBack: id };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function cli(argv) {
  const [cmd, ...rest] = argv;
  const flags = {};
  const pos = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith("--")) {
      const k = rest[i].slice(2);
      if (rest[i + 1] && !rest[i + 1].startsWith("--")) flags[k] = rest[++i];
      else flags[k] = true;
    } else pos.push(rest[i]);
  }
  const home = os.homedir();

  switch (cmd) {
    case "analyze": {
      const a = analyze({ home, since: flags.since ?? null, minTournaments: flags.min ? parseInt(flags.min, 10) : DEFAULTS.minTournaments });
      console.log(JSON.stringify(a, null, 2));
      break;
    }
    case "propose": {
      const a = analyze({ home });
      const proposals = writeProposals(a, {}, home);
      if (proposals.length === 0) {
        console.log("no proposals (样本不足或无显著共现模式)");
        break;
      }
      for (const p of proposals) console.log(`${p.id}  [${p.type}] ${p.rationale}`);
      break;
    }
    case "validate": {
      const id = pos[0];
      if (!id) { console.error("usage: hillclimb.mjs validate <id> [--fake-backend] [--tasks a,b,c] [--n 5]"); process.exit(1); }
      const r = validateProposal(id, {
        home,
        heldOutTasks: flags.tasks ? String(flags.tasks).split(",") : [],
        repeats: flags.n ? parseInt(flags.n, 10) : 5,
        fakeBackend: !!flags["fake-backend"],
      });
      for (const line of r.plan) console.log(line);
      if (r.paired) console.log(`\npaired (fake-backend): n=${r.paired.n} meanΔ=${r.paired.meanDelta} CI95=[${r.paired.ci95}] significant=${r.paired.significant}`);
      break;
    }
    case "apply": {
      const id = pos[0];
      if (!id) { console.error("usage: hillclimb.mjs apply <id>"); process.exit(1); }
      const r = applyProposal(id, home);
      console.log(JSON.stringify(r, null, 2));
      break;
    }
    case "rollback": {
      const id = pos[0];
      if (!id) { console.error("usage: hillclimb.mjs rollback <id>"); process.exit(1); }
      console.log(JSON.stringify(rollback(id, home), null, 2));
      break;
    }
    default:
      console.error("usage: hillclimb.mjs <analyze|propose|validate|apply|rollback> ...");
      process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("hillclimb.mjs")) cli(process.argv.slice(2));
