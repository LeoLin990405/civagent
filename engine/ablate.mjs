#!/usr/bin/env node
// ablate.mjs — ablation variant generator (experiment design §4: A1/A2).
//
// A1 (persona): strip persona semantics while keeping the governance graph
//   intact — historical role names become neutral "Role-N: <functional_role>",
//   narrative sections (制度简介/制度特点/历史参考) are dropped, court-language
//   terms are neutralized. Deterministic, mechanical, zero LLM calls.
// A2 (checks): remove review/veto edges from topology.json (checks_cycles → 0)
//   and delete the corresponding audit/veto steps from the IDENTITY decision
//   flow. Nodes are unchanged.
// A3 (skill): no files — runtime switch only (CIVAGENT_SKILL_LEARN=off /
//   --no-skill in run-v5.mjs + tournament.mjs).
//
// Variants are written to regimes/_ablated/<type>/<region>/<id>/ with an
// _ablation marker in metadata.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRegimeTopology } from "./topology/validate.mjs";
import { computeMetrics } from "./topology/metrics.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

export const ABLATION_TYPES = ["persona", "checks"];

// Neutral one-line description per functional role (replaces flavored duty text).
const NEUTRAL_ROLE_TEXT = {
  coordinator: "coordination: draft instructions, dispatch tasks, consolidate reports",
  review: "review: audit drafts, exercise veto, send back for revision",
  engineering: "engineering: implementation, construction, technical work",
  research: "research: information gathering, analysis, documentation",
  data: "data: budgets, accounting, quantitative analysis",
  devops: "operations: deployment, logistics, maintenance",
  content: "content: writing, records, communications",
  legal: "legal: compliance checks, rule interpretation",
  management: "management: process tracking, scheduling, personnel",
};

// Court / dynasty language → neutral terms (applied to prose outside tables).
const PERSONA_LEXICON = [
  [/陛下/g, "the user"],
  [/圣旨|诏书|诏令|敕令/g, "the instruction"],
  [/王命/g, "the instruction"],
  [/奏折|奏报|朝觐|述职/g, "report"],
  [/遵旨/g, "acknowledged"],
  [/启禀|御览/g, "report"],
  [/下旨/g, "issue"],
  [/微臣|臣等|为臣/g, "the agent"],
  [/朝廷|皇权/g, "the regime"],
];

// Section headings whose content is historical narrative (dropped in A1).
const NARRATIVE_HEADING = /制度简介|制度特点|历史参考|attribution|system overview|characteristics|historical sources/i;

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

// Split a markdown doc into { head, sections: [{heading, body}] } by "## ".
function splitSections(md) {
  const lines = String(md).split("\n");
  const head = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    if (/^##\s/.test(line)) {
      cur = { heading: line, body: [] };
      sections.push(cur);
    } else if (cur) {
      cur.body.push(line);
    } else {
      head.push(line);
    }
  }
  return { head, sections };
}

// ── A1: persona neutralization ───────────────────────────────────────────────

// Parse the role mapping table rows: [{ agentId, historicalRole }].
function parseTableRoles(identityMd) {
  const roles = [];
  let inTable = false;
  for (const line of String(identityMd).split("\n")) {
    if (line.includes("Agent ID") || line.includes("agent_id")) { inTable = true; continue; }
    if (inTable && line.startsWith("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 3 && !cells[0].startsWith("-")) {
        roles.push({ historicalRole: cells[0], agentId: cells[1].replace(/`/g, "") });
      }
    } else if (inTable && !line.startsWith("|") && line.trim()) {
      inTable = false;
    }
  }
  return roles;
}

// Rewrite the role mapping table: role cell → "Role-N: <functional_role>",
// duty cell → neutral functional text. Agent ID and model hint are kept.
function neutralizeTable(md, roleIndex) {
  const lines = String(md).split("\n");
  const out = [];
  let inTable = false;
  for (const line of lines) {
    if (line.includes("Agent ID") || line.includes("agent_id")) { inTable = true; out.push(line); continue; }
    if (inTable && line.startsWith("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 3 && !cells[0].startsWith("-")) {
        const agentId = cells[1].replace(/`/g, "");
        const info = roleIndex.get(agentId);
        const fr = info?.functional_role || "content";
        out.push(`| Role-${info?.n ?? "?"}: ${fr} | \`${agentId}\` | ${NEUTRAL_ROLE_TEXT[fr] || NEUTRAL_ROLE_TEXT.content} | ${cells[3] || ""} |`);
        continue;
      }
      out.push(line);
    } else {
      if (inTable && !line.startsWith("|") && line.trim()) inTable = false;
      out.push(line);
    }
  }
  return out.join("\n");
}

// Build the replacement map: historical names → neutral tokens.
function buildPersonaReplacements({ roles, topology, metadata }) {
  const pairs = [];
  // Historical role labels (full label + base without parenthetical). We do
  // NOT expand parenthetical fragments (起草/封驳 etc. are generic verbs).
  for (const r of roles) {
    const info = roleInfo(r.agentId, topology);
    pairs.push([r.historicalRole, `Role-${info.n}`]);
  }
  for (const node of topology.nodes) {
    const info = roleInfo(node.id, topology);
    const base = String(node.label).split(/[（(]/)[0].trim();
    if (base && base !== node.id) pairs.push([node.label, `Role-${info.n}`], [base, `Role-${info.n}`]);
  }
  // Regime display names → neutral.
  for (const name of [metadata?.name?.zh, metadata?.name?.en]) {
    if (name && name.length >= 2) pairs.push([name, "the regime"]);
  }
  // Longest first so 给事中（门下省·封驳） wins over 门下省.
  return pairs
    .filter(([k]) => k && k.length >= 2)
    .sort((a, b) => b[0].length - a[0].length);
}

function roleInfo(agentId, topology) {
  const order = topology.nodes.findIndex((n) => n.id === agentId);
  return { n: order >= 0 ? order + 1 : "?", functional_role: order >= 0 ? topology.nodes[order].functional_role : null };
}

function applyReplacements(text, pairs) {
  let out = String(text);
  for (const [from, to] of pairs) out = out.split(from).join(to);
  for (const [rx, to] of PERSONA_LEXICON) out = out.replace(rx, to);
  return out;
}

function dropNarrativeSections(md) {
  const { head, sections } = splitSections(md);
  const kept = sections.filter((s) => !NARRATIVE_HEADING.test(s.heading));
  return [...head, ...kept.flatMap((s) => [s.heading, ...s.body])].join("\n");
}

export function ablatePersona({ identity, soul, topology, metadata }) {
  const roles = parseTableRoles(identity);
  const roleIndex = new Map(roles.map((r) => {
    const info = roleInfo(r.agentId, topology);
    return [r.agentId, { n: info.n, functional_role: info.functional_role || "content" }];
  }));
  const pairs = buildPersonaReplacements({ roles, topology, metadata });

  const identityOut = applyReplacements(dropNarrativeSections(neutralizeTable(identity, roleIndex)), pairs);
  const soulOut = applyReplacements(dropNarrativeSections(soul), pairs);
  return { identity: identityOut, soul: soulOut };
}

// ── A2: remove checks (review/veto) ──────────────────────────────────────────

const CHECK_KEYWORDS = /审核|封驳|批红|审计|审查|监察|复核|驳回|audit|review|veto/i;

// Expand removed-edge endpoints into matchable terms: id, label, base label,
// and parenthetical institution names (e.g. 门下省 out of 给事中（门下省·封驳）).
function roleTerms(topology, removedEdges) {
  const ids = new Set(removedEdges.flatMap((e) => [e.from, e.to]));
  const terms = new Set(ids);
  for (const node of topology.nodes) {
    if (!ids.has(node.id)) continue;
    terms.add(node.label);
    for (const part of String(node.label).split(/[（）()·\s]+/)) {
      if (part.length >= 2) terms.add(part);
    }
  }
  return [...terms];
}

// Delete decision-flow steps that describe audit/veto actions by the removed
// roles, then renumber the surviving numbered steps.
export function stripChecksFlow(identity, removedEdges, topology) {
  if (removedEdges.length === 0) return identity;
  const terms = roleTerms(topology, removedEdges);
  const out = [];
  let counter = 0;
  for (const line of String(identity).split("\n")) {
    const isStep = /^\s*(\d+)\.\s/.test(line);
    const mentionsRole = terms.some((t) => line.includes(t));
    if (isStep && mentionsRole && CHECK_KEYWORDS.test(line)) continue; // drop
    if (isStep) {
      counter++;
      out.push(line.replace(/^(\s*)\d+\.\s/, `$1${counter}. `));
      continue;
    }
    if (!isStep) counter = 0; // numbering restarts per list block
    out.push(line);
  }
  return out.join("\n");
}

// ── driver ───────────────────────────────────────────────────────────────────

// Generate one ablation variant. Returns { outDir, validation, metrics }.
export function ablateRegime(regimeId, type, {
  projectRoot = PROJECT_ROOT,
  outRoot = null,
} = {}) {
  if (!ABLATION_TYPES.includes(type)) throw new Error(`unknown ablation type: ${type} (use ${ABLATION_TYPES.join("|")})`);
  const srcDir = path.join(projectRoot, "regimes", regimeId);
  if (!fs.existsSync(path.join(srcDir, "metadata.json"))) throw new Error(`regime not found: ${regimeId}`);
  const topologyPath = path.join(srcDir, "topology.json");
  if (!fs.existsSync(topologyPath)) throw new Error(`${regimeId} has no topology.json — ablation requires a typed regime`);

  const topology = readJson(topologyPath);
  const metadata = readJson(path.join(srcDir, "metadata.json"));
  const identity = fs.existsSync(path.join(srcDir, "IDENTITY.md")) ? fs.readFileSync(path.join(srcDir, "IDENTITY.md"), "utf8") : "";
  const soul = fs.existsSync(path.join(srcDir, "SOUL.md")) ? fs.readFileSync(path.join(srcDir, "SOUL.md"), "utf8") : "";

  const destDir = path.join(outRoot || path.join(projectRoot, "regimes", "_ablated"), type, regimeId);
  fs.mkdirSync(destDir, { recursive: true });

  let topologyOut = topology;
  let identityOut = identity;
  let soulOut = soul;

  if (type === "persona") {
    ({ identity: identityOut, soul: soulOut } = ablatePersona({ identity, soul, topology, metadata }));
    // topology.json copied unchanged — the graph is the controlled variable.
  } else if (type === "checks") {
    const removed = topology.edges.filter((e) => e.kind === "review" || e.kind === "veto");
    topologyOut = { ...topology, edges: topology.edges.filter((e) => e.kind !== "review" && e.kind !== "veto") };
    identityOut = stripChecksFlow(identity, removed, topology);
    soulOut = soul; // A2 targets edges + flow steps; SOUL left as-is (bounded).
  }

  fs.writeFileSync(path.join(destDir, "topology.json"), JSON.stringify(topologyOut, null, 2) + "\n");
  fs.writeFileSync(path.join(destDir, "IDENTITY.md"), identityOut);
  if (soulOut) fs.writeFileSync(path.join(destDir, "SOUL.md"), soulOut);
  fs.writeFileSync(path.join(destDir, "metadata.json"), JSON.stringify({
    ...metadata,
    _ablation: { type, source: regimeId, generatedAt: new Date().toISOString() },
  }, null, 2) + "\n");

  const validation = validateRegimeTopology(destDir);
  const metrics = validation.ok ? computeMetrics(validation.topology) : null;
  return { outDir: destDir, validation, metrics };
}

// CLI: node engine/ablate.mjs <region/id> --type persona|checks [--out <dir>]
if (process.argv[1] && process.argv[1].endsWith("ablate.mjs")) {
  const args = process.argv.slice(2);
  const regimeId = args[0];
  let type = null;
  let outRoot = null;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--type" && args[i + 1]) type = args[++i];
    else if (args[i] === "--out" && args[i + 1]) outRoot = args[++i];
  }
  if (!regimeId || !type) {
    console.error("usage: ablate.mjs <region/id> --type persona|checks [--out <dir>]");
    process.exit(1);
  }
  try {
    const r = ablateRegime(regimeId, type, { outRoot });
    if (!r.validation.ok) {
      console.error(`✗ variant failed validation:\n  ${r.validation.errors.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`✓ ${type} variant written: ${r.outDir}`);
    console.log(`  nodes=${r.metrics.nodes} edges=${r.metrics.edges} checks_cycles=${r.metrics.checks_cycles} (validation OK)`);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
