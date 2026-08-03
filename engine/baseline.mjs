#!/usr/bin/env node
// baseline.mjs — trivial baseline control variants for governance topology experiments.
//
// Three variant types, all generated into regimes/_baseline/<type>/<region>/<id>/:
//
//   solo     — 1 agent, 0 edges. Collapses all governance structure into a
//              single office. The null hypothesis: "topology doesn't matter,
//              a single agent performs just as well."
//   flat-N   — N agents (same count as original), 0 edges. All agents work in
//              parallel with no inter-agent communication. Tests whether raw
//              agent count alone explains performance.
//   random-N — N agents, random edges (same count as original, edge kinds
//              sampled from the original's distribution, seeded for reproducibility).
//              Tests whether a *specific* topology outperforms random wiring.
//
// WHAT A CONTROL MAY AND MAY NOT CHANGE
//
// The only variable a control isolates is the wiring between offices. Persona
// carries over untouched: SOUL.md is copied verbatim (plus a provenance
// comment), office ids, labels and duty descriptions stay as the source wrote
// them, and only the Decision Flow prose and the mermaid diagram are rewritten
// to describe the control's own edges.
//
// This is not stylistic. An earlier generator replaced every office with
// "Baseline Agent N — generic governance agent" and cut SOUL.md to a 571-byte
// disclaimer. A smoke run then scored the source regime 10 and the control 2.5
// — but the control's transcript was the model asking the operator how to
// configure the experiment. With persona and topology both removed, the
// measured gap was persona presence, and said nothing about topology at all.
// test/baseline.test.mjs has revert-verified guards against that regression.
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

// A control has to isolate ONE variable: the wiring between roles. An earlier
// version also replaced every office with "Baseline Agent N — generic
// governance agent, no historical role" and cut SOUL.md down to a disclaimer.
// That is not a topology control, it is a persona control — and in a live smoke
// run the model, left with no role to play, abandoned the scenario entirely and
// started asking the operator how to configure the experiment. The resulting
// 10-vs-2.5 gap looked like proof that topology matters and was nothing of the
// kind. Persona is therefore carried over verbatim; only the wiring changes.

// SOUL.md is the persona. It is copied unchanged, with one appended note so a
// reader (or a future auditor of the corpus) can tell a control from a regime.
function baselineSoul(sourceSoul, metadata, type) {
  return `${sourceSoul.trimEnd()}

---

<!-- experimental control: variant "${type}" derived from ${metadata.id}.
     The historical persona above is carried over verbatim and unchanged.
     Only the coordination structure below differs from the source regime —
     that is the single variable this control isolates. -->
`;
}

// The role table keeps the source regime's offices, agent ids, duties and model
// hints exactly. Only the flow description that follows it is rewritten, because
// the source prose narrates the real chain of command ("中書省 drafts → 門下省
// reviews → 尚書省 dispatches") and a model follows the prose, not the JSON. If
// the prose were left intact the topology would be scrambled on disk and obeyed
// as-written at runtime, and the control would silently be no control at all.
// The source IDENTITY.md draws its wiring twice: once as a diagram and once as
// prose. The diagram is not always mermaid — several regimes (china/ming among
// them) draw an ASCII org chart in a plain fence. An earlier version matched
// only ```mermaid, so the Ming flat control declared zero edges in
// topology.json while still showing the model the full dual-track chart. The
// model reads IDENTITY.md, not topology.json, so that control isolated nothing. A control that rewrites only the prose leaves the diagram
// asserting the original topology, so the agent reads two contradictory wirings
// and follows whichever it happened to read last — which silently reintroduces
// the very variable the control exists to isolate. Rewrite the diagram from the
// control's own edges, or drop it when the control has no edges to draw.
function rewriteDiagram(lines, edges) {
  const graph = ["```mermaid", "graph TD"];
  if (edges && edges.length) {
    for (const e of edges) graph.push(`    ${e.from} -->|${e.kind}| ${e.to}`);
  } else {
    graph.push("    %% experimental control: no inter-office edges");
  }
  graph.push("```");

  const out = [];
  let inFence = false;
  let replaced = false;
  for (const line of lines) {
    if (!inFence && /^\s*```/.test(line)) {
      inFence = true;
      // Only the first diagram becomes the control's wiring. A control has one
      // wiring; a second surviving chart would contradict it.
      if (!replaced) { out.push(...graph); replaced = true; }
      continue;
    }
    if (inFence) {
      if (/^\s*```\s*$/.test(line)) inFence = false;
      continue;
    }
    out.push(line);
  }
  return out;
}

function controlIdentity(sourceIdentity, agentIds, flowLines, edges = null) {
  const lines = rewriteDiagram(String(sourceIdentity).split(/\r?\n/), edges);
  // Keep everything up to and including the role-mapping table; the table ends
  // at the first non-pipe line after it started.
  const kept = [];
  let inTable = false;
  for (const line of lines) {
    if (line.includes("Agent ID") || line.includes("agent_id")) inTable = true;
    if (inTable && line.trim() && !line.startsWith("|")) break;
    kept.push(line);
  }
  return [
    ...kept,
    ``,
    `## Decision Flow (experimental control — rewired)`,
    ``,
    `The offices above are unchanged from the source regime. Their coordination`,
    `structure is not: this variant follows the flow below and nothing else.`,
    ``,
    `Any description of the historical decision procedure earlier in this file is`,
    `background on the offices, not the procedure to follow. Where it conflicts`,
    `with the flow below, the flow below governs.`,
    ``,
    ...flowLines,
    ``,
    `Agents: ${agentIds.join(", ")}`,
    ``,
  ].join("\n");
}

// Prose that matches a flat topology: everyone answers in parallel, no routing.
function flatFlowLines(agentIds) {
  return [
    `- Every office responds to the task independently and in parallel.`,
    `- No office reviews, approves, vetoes or dispatches to another.`,
    `- There is no drafting order and no final consolidator; the ${agentIds.length}`,
    `  responses stand side by side.`,
  ];
}

// Prose generated from the scrambled edge list, so the narrated flow and the
// topology.json agree.
function randomFlowLines(edges) {
  const verb = { command: "directs", review: "reviews the output of", info: "is kept informed by", veto: "may veto" };
  return edges.map((e) => `- \`${e.from}\` ${verb[e.kind] ?? "coordinates with"} \`${e.to}\`.`);
}

// Solo keeps the persona too, collapsed into a single office that carries the
// whole regime. It answers "does splitting the work across offices help at all",
// which is a different question from "does the wiring matter".
function soloIdentity(sourceIdentity) {
  const title = String(sourceIdentity).split(/\r?\n/).find((l) => l.startsWith("#")) || "# Regime";
  return [
    title,
    ``,
    `| Role | Agent ID | Duty | Model |`,
    `|---|---|---|---|`,
    `| Sole Minister | \`sole\` | Carries the entire governance burden of this regime alone | opus |`,
    ``,
    `## Decision Flow (experimental control — single office)`,
    ``,
    `One office holds every responsibility the source regime distributes across`,
    `its ministries. It drafts, reviews and executes without consulting anyone.`,
    ``,
    `Any historical decision procedure described in SOUL.md is background on this`,
    `regime's character, not a procedure to follow: there is no one to consult.`,
    ``,
  ].join("\n");
}

// ── topology generation ─────────────────────────────────────────────────────

// Reuse the source topology's node objects when available so the offices keep
// their historical names; fall back to the agent id itself, never to a
// "Baseline Agent N" placeholder.
function sourceNodes(agentIds, originalTopology) {
  const byId = new Map((originalTopology?.nodes ?? []).map((n) => [n.id, n]));
  return agentIds.map((id, i) => {
    const src = byId.get(id);
    return {
      id,
      label: src?.label ?? id,
      functional_role: src?.functional_role ?? FUNCTIONAL_ROLES[i % FUNCTIONAL_ROLES.length],
    };
  });
}

// Build a flat topology: N nodes with same count as original, 0 edges.
// topology.regime must name the directory the file actually lands in — the
// validator cross-checks the two whenever a control is staged at
// regimes/<region>/<id>. A synthetic "baseline-<type>/<dashed-source>" is only
// correct when the control sits somewhere the validator does not check, so
// derive the field from destDir and fall back to the synthetic form.
function controlRegimeField(destDir, type, regimeId) {
  // Mirror the validator's own rule (topology/validate.mjs) rather than
  // reimplementing it: it only cross-checks when the path ends in
  // regimes/<region>/<id>, so match exactly that shape.
  const posix = String(destDir).split(path.sep).join("/");
  const m = posix.match(/regimes\/([a-z0-9-]+\/[a-z0-9-]+)$/);
  if (m) return m[1];
  return `baseline-${type}/${regimeId.replace(/\//g, "-")}`;
}

function flatTopology(regimeId, destDir, agentIds, originalTopology) {
  // Nodes keep the source regime's office ids, labels and functional roles —
  // renaming them to "Baseline Agent N" would blank out the persona and turn a
  // topology control into a persona control.
  const nodes = sourceNodes(agentIds, originalTopology);
  return {
    schema_version: "1.0",
    regime: controlRegimeField(destDir, "flat", regimeId),
    mode: "centralized",
    nodes,
    edges: [],
  };
}

// Build a random-N topology: N nodes, same edge count as original,
// edge kinds sampled from the original's distribution.
// Connectivity guaranteed via a random spanning tree.
function randomTopology(regimeId, destDir, agentIds, originalTopology, rand) {
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

  // Nodes keep the source regime's office ids, labels and functional roles —
  // renaming them to "Baseline Agent N" would blank out the persona and turn a
  // topology control into a persona control.
  const nodes = sourceNodes(agentIds, originalTopology);

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
    regime: controlRegimeField(destDir, "random", regimeId),
    mode: "centralized",
    nodes,
    edges,
  };
}

// ── drivers ─────────────────────────────────────────────────────────────────

// Generate a solo (1-agent) baseline variant.
function generateSolo(regimeId, srcDir, destDir) {
  const metadata = readJson(path.join(srcDir, "metadata.json"));
  const srcIdentity = fs.readFileSync(path.join(srcDir, "IDENTITY.md"), "utf8");
  const srcSoul = fs.readFileSync(path.join(srcDir, "SOUL.md"), "utf8");
  const identityOut = soloIdentity(srcIdentity);
  const soulOut = baselineSoul(srcSoul, metadata, "solo");

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "IDENTITY.md"), identityOut);
  fs.writeFileSync(path.join(destDir, "SOUL.md"), soulOut);
  fs.writeFileSync(path.join(destDir, "metadata.json"), JSON.stringify({
    // The variant lives in its own directory, and the validator requires
    // metadata.id to match that directory name — copying the source id makes
    // every generated control fail validate:regimes the moment it is staged
    // somewhere runnable.
    id: path.basename(destDir),
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
      regime: controlRegimeField(destDir, "solo", regimeId),
      mode: "centralized",
      nodes: [{ id: "sole", label: "Sole Minister", functional_role: "coordinator" }],
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
  const srcIdentity = fs.readFileSync(path.join(srcDir, "IDENTITY.md"), "utf8");
  const srcSoul = fs.readFileSync(path.join(srcDir, "SOUL.md"), "utf8");
  const srcAgentIds = parseIdentityAgentIds(srcIdentity);
  const identityOut = controlIdentity(srcIdentity, srcAgentIds, flatFlowLines(srcAgentIds));
  const soulOut = baselineSoul(srcSoul, metadata, "flat");

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "IDENTITY.md"), identityOut);
  fs.writeFileSync(path.join(destDir, "SOUL.md"), soulOut);
  fs.writeFileSync(path.join(destDir, "metadata.json"), JSON.stringify({
    // The variant lives in its own directory, and the validator requires
    // metadata.id to match that directory name — copying the source id makes
    // every generated control fail validate:regimes the moment it is staged
    // somewhere runnable.
    id: path.basename(destDir),
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
    const ft = flatTopology(regimeId, destDir, parseIdentityAgentIds(identityOut), readJson(topoPath));
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
  const srcIdentity = fs.readFileSync(path.join(srcDir, "IDENTITY.md"), "utf8");
  const srcSoul = fs.readFileSync(path.join(srcDir, "SOUL.md"), "utf8");
  const srcAgentIds = parseIdentityAgentIds(srcIdentity);
  const soulOut = baselineSoul(srcSoul, metadata, "random");

  // The scrambled wiring has to exist before IDENTITY.md can describe it: the
  // Decision Flow section in the control must be the prose form of the same
  // edges the topology declares, or the two artefacts contradict each other and
  // the agent follows whichever it read last.
  const topoPath = path.join(srcDir, "topology.json");
  const randomTopo = fs.existsSync(topoPath)
    ? randomTopology(regimeId, destDir, srcAgentIds, readJson(topoPath), rand)
    : null;
  const flowLines = randomTopo ? randomFlowLines(randomTopo.edges) : flatFlowLines(srcAgentIds);
  const identityOut = controlIdentity(srcIdentity, srcAgentIds, flowLines, randomTopo?.edges ?? null);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "IDENTITY.md"), identityOut);
  fs.writeFileSync(path.join(destDir, "SOUL.md"), soulOut);
  fs.writeFileSync(path.join(destDir, "metadata.json"), JSON.stringify({
    // The variant lives in its own directory, and the validator requires
    // metadata.id to match that directory name — copying the source id makes
    // every generated control fail validate:regimes the moment it is staged
    // somewhere runnable.
    id: path.basename(destDir),
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

  if (randomTopo) {
    fs.writeFileSync(path.join(destDir, "topology.json"), JSON.stringify(randomTopo, null, 2) + "\n");
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
  destDir: destDirOverride = null,
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

  // destDir lets a caller stage a control at a runnable location such as
  // regimes/_baseline/tang-random; without it every control lands three levels
  // deep, where the validator's regime/directory cross-check never fires and a
  // wrong regime field would ship unnoticed.
  //
  // It is also the most dangerous input this module takes. Every generator
  // unconditionally overwrites IDENTITY.md, SOUL.md, metadata.json and
  // topology.json at the destination, so an unchecked --dest turns a control
  // generator into an arbitrary-file overwriter:
  //   civagent baseline china/tang --type solo --dest regimes/china/tang
  // destroyed the real Tang regime (IDENTITY.md 1465 -> 526 bytes) in one
  // command, and `--dest ../../anywhere` escaped the repository entirely.
  // The guards below are ordered so the most destructive case fails first.
  const baseOut = outRoot || path.join(projectRoot, "regimes", "_baseline");
  const destDir = destDirOverride
    ? path.resolve(projectRoot, destDirOverride)
    : path.join(baseOut, type, regimeId);

  if (destDirOverride) {
    // The property that matters is not "lives under _baseline" — examples/smoke.mjs
    // legitimately stages a control beside an example regime inside a disposable
    // sandbox. It is: never leave the project's regimes tree, and never write
    // over a source regime. An earlier version required _baseline and broke the
    // smoke, which is how a guard that is too strict shows up: as a green local
    // unit suite and a red end-to-end run.
    const regimesRoot = path.resolve(projectRoot, "regimes");
    const relToRegimes = path.relative(regimesRoot, destDir);
    if (relToRegimes === "" || relToRegimes.startsWith("..") || path.isAbsolute(relToRegimes)) {
      throw new Error(
        `--dest must be inside ${regimesRoot} (got ${destDir}); ` +
        "controls never write outside the regimes tree",
      );
    }
    // Never the source regime itself, and never a parent of it.
    const relToSource = path.relative(destDir, path.resolve(srcDir));
    if (relToSource === "" || !relToSource.startsWith("..")) {
      throw new Error(
        `--dest ${destDir} is the source regime ${srcDir} or contains it; ` +
        "generating a control there would overwrite the regime it is derived from",
      );
    }
    // Inside the tree, still refuse to clobber a directory holding someone
    // else's regime; re-generating a control this generator made is fine.
    if (fs.existsSync(destDir)) {
      const existing = fs.readdirSync(destDir);
      const meta = path.join(destDir, "metadata.json");
      const isOwnControl = fs.existsSync(meta) && Boolean(readJson(meta)?._baseline);
      if (existing.length > 0 && !isOwnControl) {
        throw new Error(
          `--dest ${destDir} is a non-empty directory that is not a generated control; refusing to overwrite`,
        );
      }
    }
  }


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
  let destDir = null;
  let seed = Date.now();
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--type" && args[i + 1]) type = args[++i];
    else if (args[i] === "--out" && args[i + 1]) outRoot = args[++i];
    else if (args[i] === "--dest" && args[i + 1]) destDir = args[++i];
    else if (args[i] === "--seed" && args[i + 1] != null) seed = parseInt(args[++i], 10);
  }
  if (!regimeId || !type) {
    console.error("usage: baseline.mjs <region/id> --type solo|random|flat [--seed N] [--out dir] [--dest dir]");
    process.exit(1);
  }
  try {
    const r = generateBaseline(regimeId, type, { outRoot, destDir, seed });
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
