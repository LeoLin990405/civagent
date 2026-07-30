#!/usr/bin/env node
// validate.mjs — validate a regime's topology.json against the topology schema
// and cross-check it against the regime's IDENTITY.md role mapping table.
//
// Zero-dependency, hand-written checks (project policy: no ajv). Pure functions
// are exported for tests; the CLI wrapper is at the bottom.
//
//   node engine/topology/validate.mjs <regime-dir>

import fs from "node:fs";
import path from "node:path";

export const TOPOLOGY_SCHEMA_VERSION = "1.0";

// Same vocabulary as engine/regime-to-cc.mjs ROLE_MODEL_MAP (9 canonical roles).
export const FUNCTIONAL_ROLES = [
  "coordinator", "engineering", "review", "research", "data",
  "devops", "content", "legal", "management",
];

export const EDGE_KINDS = ["command", "review", "info", "veto"];

// Structural node kinds (R8-1 node typing). `kind` is OPTIONAL and defaults to
// "agent" when omitted or null — that is the only kind the 57 pre-typing regimes
// use, so the default preserves their existing semantics exactly.
//   agent       = calls the model, produces content (the historical baseline)
//   gate        = deterministic gate: no model discretion, a rule decides pass/block
//   checkpoint  = human checkpoint: control handed back to the operator
//   router      = pure fan-out dispatcher: routes work, produces no content
export const NODE_KINDS = ["agent", "gate", "checkpoint", "router"];
// functional_role values that describe a *content-producing* role (they call the
// model to generate output). A node whose kind declares it does NOT call the model
// (gate/router/checkpoint) contradicts a content-producing role — see below.
const CONTENT_ROLES = new Set(["engineering", "research", "data", "devops", "content"]);

// Canonical orchestration modes (engine/modes/*.md). Historical metadata uses
// some non-canonical names; normalize with the same aliases as regime-to-cc.mjs.
export const MODES = [
  "centralized", "checks-and-balances", "democratic",
  "dual-track", "federation", "theocratic",
];
const MODE_ALIASES = {
  "centralized-hierarchy": "centralized",
  "democratic-council": "democratic",
  "federated-autonomy": "federation",
  "dual-power": "dual-track",
};
export function normalizeMode(pattern) {
  return MODE_ALIASES[pattern] || pattern || "centralized";
}

// Parse the role mapping table from IDENTITY.md and return the Agent IDs.
// Mirrors the parsing rules of parseIdentityTable in engine/regime-to-cc.mjs
// (the compiler's copy is not exported, and this iteration must not touch it).
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

// Validate a parsed topology object against schemas/regime-topology.schema.json.
// Returns an array of error strings ([] = valid). regimeDir is optional; when
// given, the regime field is also checked against the directory location.
export function validateTopologyData(topology, { regimeDir = null } = {}) {
  const errors = [];
  const t = topology;
  if (!t || typeof t !== "object" || Array.isArray(t)) {
    return ["topology must be a JSON object"];
  }

  // ── top-level fields ──
  if (typeof t.schema_version !== "string" || !t.schema_version) {
    errors.push("schema_version must be a non-empty string");
  }
  if (typeof t.regime !== "string" || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(t.regime)) {
    errors.push(`regime must match region/regime-id, got: ${JSON.stringify(t.regime)}`);
  } else if (regimeDir) {
    const rel = path.relative(process.cwd(), regimeDir).split(path.sep).join("/");
    const m = rel.match(/regimes\/([a-z0-9-]+\/[a-z0-9-]+)$/);
    if (m && m[1] !== t.regime) {
      errors.push(`regime field "${t.regime}" does not match directory "${m[1]}"`);
    }
  }
  if (!MODES.includes(t.mode)) {
    errors.push(`mode must be one of ${MODES.join("/")}, got: ${JSON.stringify(t.mode)}`);
  }

  // ── nodes ──
  if (!Array.isArray(t.nodes) || t.nodes.length === 0) {
    errors.push("nodes must be a non-empty array");
  }
  const nodeIds = new Set();
  // Map node id -> resolved kind ("agent" when omitted/null). Used by the
  // edge-level kind constraints below.
  const nodeKind = new Map();
  for (const [i, n] of (Array.isArray(t.nodes) ? t.nodes : []).entries()) {
    if (!n || typeof n !== "object") { errors.push(`nodes[${i}] must be an object`); continue; }
    if (typeof n.id !== "string" || !n.id) {
      errors.push(`nodes[${i}].id must be a non-empty string`);
    } else if (nodeIds.has(n.id)) {
      errors.push(`duplicate node id: ${n.id}`);
    } else {
      nodeIds.add(n.id);
    }
    if (typeof n.label !== "string" || !n.label) {
      errors.push(`nodes[${i}].label must be a non-empty string (node ${n.id ?? i})`);
    }
    if (!FUNCTIONAL_ROLES.includes(n.functional_role)) {
      errors.push(`node ${n.id ?? i}: functional_role must be one of ${FUNCTIONAL_ROLES.join("/")}, got: ${JSON.stringify(n.functional_role)}`);
    }
    // kind is optional; omitted/null means "agent". A typo like "gat" would
    // otherwise be silently treated as agent and the node would drop off the
    // gate/checkpoint counts — under-counting the regime's hard gates.
    const kind = n.kind ?? "agent";
    if (!NODE_KINDS.includes(kind)) {
      errors.push(`node ${n.id ?? i}: kind must be one of ${NODE_KINDS.join("/")} (or omitted for "agent"), got: ${JSON.stringify(n.kind)}`);
    } else {
      // Constraint: a non-content kind (gate/checkpoint/router) declares the
      // node does NOT call the model to produce output. Pairing it with a
      // content-producing functional_role (engineering/research/data/devops/
      // content) is self-contradictory — e.g. a "gate" that is also the
      // "engineering" role claims both "no model discretion" and "writes code".
      // Real consequence: the metrics/runner would treat it as a hard gate for
      // counting while the compiler still routes it a content model, so the
      // graph misreports how many judgment calls vs. deterministic gates exist.
      if (kind !== "agent" && n.functional_role && CONTENT_ROLES.has(n.functional_role)) {
        errors.push(`node ${n.id}: kind "${kind}" cannot have content-producing functional_role "${n.functional_role}" (a ${kind} does not call the model to generate content)`);
      }
      if (n.id) nodeKind.set(n.id, kind);
    }
  }

  // ── edges ──
  if (!Array.isArray(t.edges)) {
    errors.push("edges must be an array");
  }
  const edgeKeys = new Set();
  const hasInbound = new Set(); // node ids that appear as an edge target
  for (const [i, e] of (Array.isArray(t.edges) ? t.edges : []).entries()) {
    if (!e || typeof e !== "object") { errors.push(`edges[${i}] must be an object`); continue; }
    if (!nodeIds.has(e.from)) errors.push(`edges[${i}].from references unknown node: ${JSON.stringify(e.from)}`);
    if (!nodeIds.has(e.to)) errors.push(`edges[${i}].to references unknown node: ${JSON.stringify(e.to)}`);
    if (e.from === e.to) errors.push(`edges[${i}] is a self-loop on ${e.from}`);
    if (!EDGE_KINDS.includes(e.kind)) {
      errors.push(`edges[${i}].kind must be one of ${EDGE_KINDS.join("/")}, got: ${JSON.stringify(e.kind)}`);
    }
    // Constraint: a router (pure fan-out dispatcher, produces no content, makes
    // no judgment) may only emit command/info edges. A router emitting review
    // or veto would be exercising judgment — which means it is not a router but
    // a gate or agent. Real consequence: mislabeling inflates/deflates
    // gate_count and lets a "router" silently act as a hard veto gate, hiding a
    // deterministic block behind a kind that promises none.
    const srcKind = nodeKind.get(e.from);
    if (srcKind === "router" && (e.kind === "review" || e.kind === "veto")) {
      errors.push(`node ${e.from} is kind "router" but emits a ${e.kind} edge; a router only dispatches (command/info) — use kind "gate" or "agent" for a judgment edge`);
    }
    if (e.to) hasInbound.add(e.to);
    const key = `${e.from}→${e.to}:${e.kind}`;
    if (edgeKeys.has(key)) errors.push(`duplicate edge: ${key}`);
    edgeKeys.add(key);
  }

  // Constraint: a gate or checkpoint with no inbound edge is unreachable — it
  // can never fire, so it protects nothing. This is the classic "looks safe but
  // does nothing" defect. Real consequence: the regime's topology would
  // advertise a check (gate_count/checkpoint_count counts it) that can never
  // execute, overstating the regime's constraints exactly where it matters most.
  for (const [id, kind] of nodeKind) {
    if ((kind === "gate" || kind === "checkpoint") && !hasInbound.has(id)) {
      errors.push(`node ${id} is kind "${kind}" but has no inbound edge — a ${kind} with no incoming flow is a dead node that can never trigger`);
    }
  }
  return errors;
}

// Cross-check topology nodes against the IDENTITY.md role mapping table:
// no role may appear out of thin air, and none may be left out.
export function crossCheckIdentity(topology, identityMd) {
  const errors = [];
  const tableIds = parseIdentityAgentIds(identityMd);
  if (tableIds.length === 0) {
    return ["IDENTITY.md has no parseable role mapping table (Agent ID column)"];
  }
  const nodeIds = new Set((topology.nodes || []).map((n) => n?.id).filter(Boolean));
  for (const id of tableIds) {
    if (!nodeIds.has(id)) {
      errors.push(`role "${id}" exists in IDENTITY.md but is missing from topology nodes`);
    }
  }
  const tableSet = new Set(tableIds);
  for (const id of nodeIds) {
    if (!tableSet.has(id)) {
      errors.push(`topology node "${id}" does not appear in the IDENTITY.md role mapping table`);
    }
  }
  return errors;
}

// Full validation of one regime directory. Returns
// { ok, errors, topology, regimeDir } — never throws for content problems.
export function validateRegimeTopology(regimeDir) {
  const errors = [];
  const topologyPath = path.join(regimeDir, "topology.json");
  if (!fs.existsSync(topologyPath)) {
    return { ok: false, skipped: true, errors: [`no topology.json in ${regimeDir}`], topology: null, regimeDir };
  }

  let topology;
  try {
    topology = JSON.parse(fs.readFileSync(topologyPath, "utf8"));
  } catch (e) {
    return { ok: false, errors: [`topology.json is not valid JSON: ${e.message}`], topology: null, regimeDir };
  }

  errors.push(...validateTopologyData(topology, { regimeDir }));

  // Mode must correspond to metadata.json's orchestrationPattern.
  const metadataPath = path.join(regimeDir, "metadata.json");
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      const expected = normalizeMode(metadata.orchestrationPattern);
      if (topology.mode && expected !== topology.mode) {
        errors.push(`mode "${topology.mode}" does not match metadata orchestrationPattern "${metadata.orchestrationPattern}" (normalized: "${expected}")`);
      }
    } catch (e) {
      errors.push(`metadata.json is not valid JSON: ${e.message}`);
    }
  } else {
    errors.push("metadata.json not found (required for mode cross-check)");
  }

  // Nodes must match the IDENTITY.md role mapping table exactly.
  const identityPath = path.join(regimeDir, "IDENTITY.md");
  if (fs.existsSync(identityPath)) {
    errors.push(...crossCheckIdentity(topology, fs.readFileSync(identityPath, "utf8")));
  } else {
    errors.push("IDENTITY.md not found (required for role cross-check)");
  }

  return { ok: errors.length === 0, errors, topology, regimeDir };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith("validate.mjs")) {
  const regimeDir = process.argv[2];
  if (!regimeDir) {
    console.error("Usage: node engine/topology/validate.mjs <regime-dir>");
    process.exit(1);
  }
  const r = validateRegimeTopology(path.resolve(regimeDir));
  if (r.ok) {
    const { topology } = r;
    console.log(`✓ ${topology.regime} topology OK (${topology.nodes.length} nodes, ${topology.edges.length} edges, mode=${topology.mode})`);
  } else {
    for (const e of r.errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
}
