#!/usr/bin/env node
// baseline.mjs — trivial baseline control variants for governance topology experiments.
//
// Three variant types, all generated into regimes/_baseline/<type>/<region>/<id>/:
//
//   solo     — 1 agent, 0 edges. Strips all governance structure; keeps only
//              minimal regime identity. The null hypothesis: "topology doesn't
//              matter, a single agent performs just as well."
//   flat-N   — N agents (same count as original), 0 edges. All agents work in
//              parallel with no inter-agent communication. Tests whether raw
//              agent count alone explains performance.
//   random-N — N agents, random edges (same count as original, edge kinds
//              sampled from the original's distribution, seeded for reproducibility).
//              Tests whether a *specific* topology outperforms random wiring.
//
// Seeded PRNG (mulberry32) guarantees byte-identical output for the same seed.
// Connectivity is enforced: random graphs include a random spanning tree so
// every node is reachable (undirected sense); no isolated agents.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRegimeTopology } from "./topology/validate.mjs";
import { computeMetrics } from "./topology/metrics.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

export const BASELINE_TYPES = ["solo", "random", "flat"];

const FUNCTIONAL_ROLES = [
  "coordinator", "engineering", "review", "research", "data",
  "devops", "content", "legal", "management",
];
const EDGE_KINDS = ["command", "review", "info", "veto"];

// ── seeded PRNG (mulberry32) ────────────────────────────────────────────────

export function mulberry32(seed) {
  let s = seed | 0;
  return function next() {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Fisher–Yates shuffle with a provided random function.
function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick a random element from an array.
function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

// ── helpers ─────────────────────────────────────────────────────────────────

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

// Parse agent IDs from an IDENTITY.md role table.
export function parseIdentityAgentIds(identityMd) {
  const ids = [];
  let inTable = false;
  for (const line of String(identityMd).split("\n")) {
    if (line.includes("Agent ID") || line.includes("agent_id")) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 3 && !cells[0].startsWith("-")) {
        ids.push(cells[1].replace(/`/g, ""));
      }
    } else if (inTable && !line.startsWith("|") && line.trim()) {
      inTable = false;
    }
  }
  return ids;
}

// Build a minimal SOUL for baseline variants — keep the regime's core identity
// (name, era, one-line description) but strip all governance process language.
function baselineSoul(metadata) {
  const zh = metadata.name?.zh || metadata.id || "Unknown";
  const en = metadata.name?.en || metadata.id || "Unknown";
  const era = metadata.era?.zh || "";
  const desc = metadata.description?.zh || "";
  return [
    `# ${zh} / ${en} — Baseline Control`,
    ``,
    `> ${era} — ${desc.slice(0, 120)}`,
    ``,
    `## Identity`,
    ``,
    `This is a **baseline control variant**. It does not represent any historically`,
    `accurate governance structure. It exists solely as an experimental control`,
    `to measure the effect of governance topology on multi-agent task performance.`,
    ``,
    `Source regime: ${metadata.id}`,
    ``,
  ].join("\n");
}

// Build a minimal IDENTITY.md table with N generic agents.
// Returns markdown string with a table that parseIdentityTable will recognise.
function baselineIdentity(n, _functionalRole = "content") {
  const lines = [
    `# Baseline Control — Agent Table`,
    ``,
    `| Role | Agent ID | Duty | Model |`,
    `|---|---|---|---|`,
  ];
  for (let i = 0; i < n; i++) {
    const id = i === 0 ? "role_a" : `role_${String.fromCharCode(97 + i)}`;
    lines.push(`| Baseline Agent ${i + 1} | \`${id}\` | Generic governance agent — no historical role | sonnet |`);
  }
  return lines.join("\n") + "\n";
}

// ── topology generation ─────────────────────────────────────────────────────

// Build a flat topology: N nodes with same count as original, 0 edges.
function flatTopology(regimeId, agentIds) {
  const nodes = agentIds.map((id, i) => ({
    id,
    label: `Baseline Agent ${i + 1}`,
    functional_role: FUNCTIONAL_ROLES[i % FUNCTIONAL_ROLES.length],
  }));
  return {
    schema_version: "1.0",
    regime: `baseline-flat/${regimeId.replace(/\//g, "-")}`,
    mode: "centralized",
    nodes,
    edges: [],
  };
}

// Build a random-N topology: N nodes, same edge count as original,
// edge kinds sampled from the original's distribution.
// Connectivity guaranteed via a random spanning tree.
function randomTopology(regimeId, agentIds, originalTopology, rand) {
  const origEdges = originalTopology.edges || [];
  const origEdgeCount = origEdges.length;

  // Build edge-kind distribution from the original.
  const kindCounts = {};
  for (const e of origEdges) {
    kindCounts[e.kind] = (kindCounts[e.kind] || 0) + 1;
  }
  const kindPool = [];
  for (const [kind, count] of Object.entries(kindCounts)) {
    for (let i = 0; i < count; i++) kindPool.push(kind);
  }
  // Fallback: if original had no edges, use a uniform pool.
  if (kindPool.length === 0) {
    for (const k of EDGE_KINDS) kindPool.push(k);
  }

  const nodes = agentIds.map((id, i) => ({
    id,
    label: `Baseline Agent ${i + 1}`,
    functional_role: FUNCTIONAL_ROLES[i % FUNCTIONAL_ROLES.length],
  }));

  const edges = [];
  const edgeKeys = new Set();

  function addEdge(from, to, kind) {
    if (from === to) return false; // no self-loops
    const key = `${from}→${to}:${kind}`;
    if (edgeKeys.has(key)) return false;
    edges.push({ from, to, kind });
    edgeKeys.add(key);
    return true;
  }

  // Step 1: build a random spanning tree (undirected sense) to guarantee connectivity.
  const shuffled = shuffle(agentIds, rand);
  for (let i = 1; i < shuffled.length; i++) {
    const from = shuffled[i - 1];
    const to = shuffled[i];
    const dir = rand() < 0.5;
    addEdge(dir ? from : to, dir ? to : from, pick(kindPool, rand));
  }

  // Step 2: add remaining edges randomly up to the original count.
  const attempts = origEdgeCount * 10; // generous attempt budget
  for (let a = 0; a < attempts && edges.length < origEdgeCount; a++) {
    const from = pick(agentIds, rand);
    const to = pick(agentIds, rand);
    addEdge(from, to, pick(kindPool, rand));
  }

  return {
    schema_version: "1.0",
    regime: `baseline-random/${regimeId.replace(/\//g, "-")}`,
    mode: "centralized",
    nodes,
    edges,
  };
}

// ── drivers ─────────────────────────────────────────────────────────────────

// Generate a solo (1-agent) baseline variant.
function generateSolo(regimeId, srcDir, destDir) {
  const metadata = readJson(path.join(srcDir, "metadata.json"));
  const identityOut = baselineIdentity(1, "coordinator");
  const soulOut = baselineSoul(metadata);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "IDENTITY.md"), identityOut);
  fs.writeFileSync(path.join(destDir, "SOUL.md"), soulOut);
  fs.writeFileSync(path.join(destDir, "metadata.json"), JSON.stringify({
    id: metadata.id,
    name: { zh: `${metadata.name?.zh ?? metadata.id} (Solo)`, en: `${metadata.name?.en ?? metadata.id} (Solo)` },
    era: metadata.era,
    region: metadata.region,
    system: { zh: "单人基线对照", en: "Solo Baseline Control" },
    description: {
      zh: "基线对照变体（solo）：单 agent，无拓扑结构，仅保留政体身份标识。",
      en: "Baseline control variant (solo): single agent, no topology, minimal identity only.",
    },
    agentCount: 1,
    tags: ["baseline", "solo", "control"],
    orchestrationPattern: "centralized",
    // No generatedAt here on purpose: a baseline variant is an experimental
    // artifact, and a wall-clock stamp would make two runs of the same seed
    // differ byte-for-byte, defeating the reproducibility the seed exists for.
    _baseline: { type: "solo", source: regimeId },
  }, null, 2) + "\n");

  // topology.json: only if original had one.
  const topoPath = path.join(srcDir, "topology.json");
  if (fs.existsSync(topoPath)) {
    const soloTopo = {
      schema_version: "1.0",
      regime: `baseline-solo/${regimeId.replace(/\//g, "-")}`,
      mode: "centralized",
      nodes: [{ id: "role_a", label: "Baseline Agent 1", functional_role: "coordinator" }],
      edges: [],
    };
    fs.writeFileSync(path.join(destDir, "topology.json"), JSON.stringify(soloTopo, null, 2) + "\n");
  }

  const validation = fs.existsSync(path.join(destDir, "topology.json"))
    ? validateRegimeTopology(destDir) : { ok: true, errors: [], skipped: true };
  const metrics = validation.ok && !validation.skipped ? computeMetrics(validation.topology) : null;
  return { outDir: destDir, validation, metrics };
}

// Generate a flat-N baseline variant.
function generateFlat(regimeId, srcDir, destDir, agentCount) {
  const metadata = readJson(path.join(srcDir, "metadata.json"));
  const identityOut = baselineIdentity(agentCount);
  const soulOut = baselineSoul(metadata);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "IDENTITY.md"), identityOut);
  fs.writeFileSync(path.join(destDir, "SOUL.md"), soulOut);
  fs.writeFileSync(path.join(destDir, "metadata.json"), JSON.stringify({
    id: metadata.id,
    name: { zh: `${metadata.name?.zh ?? metadata.id} (Flat-${agentCount})`, en: `${metadata.name?.en ?? metadata.id} (Flat-${agentCount})` },
    era: metadata.era,
    region: metadata.region,
    system: { zh: `水平基线对照 (${agentCount} agents)`, en: `Flat Baseline Control (${agentCount} agents)` },
    description: {
      zh: `基线对照变体（flat-${agentCount}）：${agentCount} 个 agent，零边，完全并行互不通信。`,
      en: `Baseline control variant (flat-${agentCount}): ${agentCount} agents, zero edges, fully parallel with no inter-agent communication.`,
    },
    agentCount,
    tags: ["baseline", "flat", "control"],
    orchestrationPattern: "centralized",
    _baseline: { type: "flat", source: regimeId, agentCount },
  }, null, 2) + "\n");

  const topoPath = path.join(srcDir, "topology.json");
  if (fs.existsSync(topoPath)) {
    const ft = flatTopology(regimeId, parseIdentityAgentIds(identityOut));
    fs.writeFileSync(path.join(destDir, "topology.json"), JSON.stringify(ft, null, 2) + "\n");
  }

  const validation = fs.existsSync(path.join(destDir, "topology.json"))
    ? validateRegimeTopology(destDir) : { ok: true, errors: [], skipped: true };
  const metrics = validation.ok && !validation.skipped ? computeMetrics(validation.topology) : null;
  return { outDir: destDir, validation, metrics };
}

// Generate a random-N baseline variant (seeded, reproducible edge wiring).
function generateRandom(regimeId, srcDir, destDir, agentCount, seed, rand) {
  const metadata = readJson(path.join(srcDir, "metadata.json"));
  const identityOut = baselineIdentity(agentCount);
  const soulOut = baselineSoul(metadata);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "IDENTITY.md"), identityOut);
  fs.writeFileSync(path.join(destDir, "SOUL.md"), soulOut);
  fs.writeFileSync(path.join(destDir, "metadata.json"), JSON.stringify({
    id: metadata.id,
    name: { zh: `${metadata.name?.zh ?? metadata.id} (Random-${agentCount})`, en: `${metadata.name?.en ?? metadata.id} (Random-${agentCount})` },
    era: metadata.era,
    region: metadata.region,
    system: { zh: `随机基线对照 (${agentCount} agents, seed=${seed})`, en: `Random Baseline Control (${agentCount} agents, seed=${seed})` },
    description: {
      zh: `基线对照变体（random-${agentCount}）：${agentCount} 个 agent，边数 ≈ 原政体，边的种类按原分布随机采样，seed=${seed} 保证可复现。`,
      en: `Baseline control variant (random-${agentCount}): ${agentCount} agents, edge count ≈ original, edge kinds randomly sampled from original distribution, seed=${seed} for reproducibility.`,
    },
    agentCount,
    tags: ["baseline", "random", "control"],
    orchestrationPattern: "centralized",
    _baseline: { type: "random", source: regimeId, agentCount, seed },
  }, null, 2) + "\n");

  const topoPath = path.join(srcDir, "topology.json");
  if (fs.existsSync(topoPath)) {
    const originalTopo = readJson(topoPath);
    const rt = randomTopology(regimeId, parseIdentityAgentIds(identityOut), originalTopo, rand);
    fs.writeFileSync(path.join(destDir, "topology.json"), JSON.stringify(rt, null, 2) + "\n");
  }

  const validation = fs.existsSync(path.join(destDir, "topology.json"))
    ? validateRegimeTopology(destDir) : { ok: true, errors: [], skipped: true };
  const metrics = validation.ok && !validation.skipped ? computeMetrics(validation.topology) : null;
  return { outDir: destDir, validation, metrics };
}

// ── public API ──────────────────────────────────────────────────────────────

// Generate one baseline variant. Returns { outDir, validation, metrics }.
export function generateBaseline(regimeId, type, {
  projectRoot = PROJECT_ROOT,
  outRoot = null,
  seed = Date.now(),
} = {}) {
  if (!BASELINE_TYPES.includes(type)) {
    throw new Error(`unknown baseline type: ${type} (use ${BASELINE_TYPES.join("|")})`);
  }
  const srcDir = path.join(projectRoot, "regimes", regimeId);
  if (!fs.existsSync(path.join(srcDir, "metadata.json"))) {
    throw new Error(`regime not found: ${regimeId}`);
  }

  const metadata = readJson(path.join(srcDir, "metadata.json"));
  const agentCount = metadata.agentCount;

  const baseOut = outRoot || path.join(projectRoot, "regimes", "_baseline");
  const destDir = path.join(baseOut, type, regimeId);

  // Ensure seed is a 32-bit integer for the PRNG.
  const seed32 = (typeof seed === "number" ? seed : String(seed).split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)) | 0;
  const rand = mulberry32(seed32);

  switch (type) {
    case "solo":
      return generateSolo(regimeId, srcDir, destDir);
    case "flat":
      return generateFlat(regimeId, srcDir, destDir, agentCount);
    case "random":
      return generateRandom(regimeId, srcDir, destDir, agentCount, seed32, rand);
    default:
      throw new Error(`unknown baseline type: ${type}`);
  }
}

// ── CLI entry point ─────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const regimeId = args[0];
  let type = null;
  let outRoot = null;
  let seed = Date.now();
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--type" && args[i + 1]) type = args[++i];
    else if (args[i] === "--out" && args[i + 1]) outRoot = args[++i];
    else if (args[i] === "--seed" && args[i + 1] != null) seed = parseInt(args[++i], 10);
  }
  if (!regimeId || !type) {
    console.error("usage: baseline.mjs <region/id> --type solo|random|flat [--seed N] [--out dir]");
    process.exit(1);
  }
  try {
    const r = generateBaseline(regimeId, type, { outRoot, seed });
    if (r.validation && !r.validation.ok) {
      console.error(`✗ variant failed validation:\n  ${r.validation.errors.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`✓ ${type} baseline written: ${r.outDir}`);
    if (r.metrics) {
      console.log(`  nodes=${r.metrics.nodes} edges=${r.metrics.edges} checks_cycles=${r.metrics.checks_cycles} (validation OK)`);
    } else {
      console.log(`  (no topology.json — non-topo regime, validation skipped)`);
    }
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
