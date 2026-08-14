/**
 * regime-ir.mjs — P2 domain: RegimeCompiler producing immutable RegimeIR.
 *
 * Plan §8.1: the compiler validates existing regime/persona/topology/control
 * artifacts and emits an immutable IR whose digest is pinned into the runtime
 * manifest. No registry, role, tool, provider, policy, or skill can change
 * after match admission.
 *
 * Inputs (read-only): metadata.json, IDENTITY.md (role table is the source of
 * truth — same parsing semantics as the legacy engine, AGENTS.md hard rule 2),
 * topology.json (declared nodes/edges), SOUL.md (persona artifact).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

export const REGIME_IR_SCHEMA = "regime-ir/1";
export const EDGE_KINDS = ["command", "review", "information", "vote", "escalation"];
export const TOPOLOGY_TREATMENTS = ["historical", "random", "flat", "solo"];

/**
 * Mirror of engine/regime-to-cc.mjs::parseIdentityTable: the markdown table
 * whose header contains "Agent ID" is the source of truth; rows are
 * `| 古代角色 | agent id | AI 职责 | 推荐模型 |`.
 */
export function parseIdentityTable(identityMd) {
  const lines = identityMd.split("\n");
  const agents = [];
  let inTable = false;
  for (const line of lines) {
    if (line.includes("Agent ID") || line.includes("agent_id")) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 3 && !cells[0].startsWith("-")) {
        agents.push({
          historicalRole: cells[0],
          officeId: cells[1].replace(/`/g, ""),
          aiRole: cells[2],
          modelHint: cells[3] || "",
        });
      }
    } else if (inTable && !line.startsWith("|") && line.trim()) {
      inTable = false;
    }
  }
  return agents;
}

/** Map legacy topology edge kinds onto the canonical handoff enum (plan §8.2). */
export function canonicalEdgeKind(legacyKind) {
  switch (legacyKind) {
    case "command": return "command";
    case "info": return "information";
    case "veto": return "review";
    default: return legacyKind; // already canonical
  }
}

/** Classify the topology treatment from the regime path (id or dir name). */
export function topologyTreatment(regimeId) {
  const id = String(regimeId);
  if (/solo/.test(id)) return "solo";
  if (/flat/.test(id)) return "flat";
  if (/random/.test(id)) return "random";
  if (/^(china|global|baseline-flat)\//.test(id) || /^(china|global)\//.test(id)) return "historical";
  return "unknown";
}

export class RegimeCompiler {
  /**
   * @param {string} regimeDir absolute path of a regime directory
   */
  compile(regimeDir) {
    const metadataPath = path.join(regimeDir, "metadata.json");
    const identityPath = path.join(regimeDir, "IDENTITY.md");
    const soulPath = path.join(regimeDir, "SOUL.md");
    const topologyPath = path.join(regimeDir, "topology.json");

    if (!fs.existsSync(metadataPath)) throw new Error(`no metadata.json in ${regimeDir}`);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const identity = fs.existsSync(identityPath) ? fs.readFileSync(identityPath, "utf8") : "";
    const soul = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, "utf8") : "";
    const topology = fs.existsSync(topologyPath) ? JSON.parse(fs.readFileSync(topologyPath, "utf8")) : { nodes: [], edges: [] };

    const tableAgents = parseIdentityTable(identity);
    const expected = metadata.agentCount;
    if (expected !== undefined && tableAgents.length !== expected) {
      throw new Error(`agentCount mismatch for ${metadata.id}: metadata says ${expected}, IDENTITY table has ${tableAgents.length}`);
    }

    // source digest covers every input artifact
    const sourceInputs = {};
    for (const [name, p] of [["metadata", metadataPath], ["identity", identityPath], ["soul", soulPath], ["topology", topologyPath]]) {
      sourceInputs[name] = fs.existsSync(p) ? sha256Hex(fs.readFileSync(p)) : null;
    }

    const regimeId = metadata.id ? `${metadata.region ?? "?"}/${metadata.id}` : path.basename(regimeDir);
    const nodes = (topology.nodes ?? []).map((n) => ({
      officeId: n.id,
      label: n.label ?? n.id,
      functionalRole: n.functional_role ?? null,
    }));
    const edgeIds = new Set();
    const edges = (topology.edges ?? []).map((e, i) => {
      const edgeId = e.edgeId ?? `e${i + 1}-${e.from}-${e.to}`;
      if (edgeIds.has(edgeId)) throw new Error(`duplicate edgeId ${edgeId} in ${regimeDir}`);
      edgeIds.add(edgeId);
      const kind = canonicalEdgeKind(e.kind);
      return {
        edgeId,
        source: e.from,
        target: e.to,
        kind,
        legacyKind: e.kind === kind ? undefined : e.kind,
        note: e.note ?? null,
      };
    });

    const ir = {
      schema: REGIME_IR_SCHEMA,
      regimeId,
      treatment: topologyTreatment(regimeId),
      orchestrationPattern: topology.mode ?? metadata.orchestrationPattern ?? null,
      sourceDigest: sha256Hex(Buffer.from(canonicalJson(sourceInputs))),
      sourceArtifacts: sourceInputs,
      agents: tableAgents.map((a) => ({
        officeId: a.officeId,
        historicalRole: a.historicalRole,
        aiRole: a.aiRole,
        modelHint: a.modelHint || null,
        personaArtifactRef: soul ? `sha256:${sourceInputs.soul}` : null,
      })),
      graph: { nodes, edges },
      policy: {
        // declared grants: every declared edge authorizes its source office
        // to send along that edge; mechanisms are pinned separately
        grants: edges.map((e) => ({
          actorOffice: e.source,
          edgeId: e.edgeId,
          edgeKind: e.kind,
          mechanism: e.kind === "review" ? "veto" : null,
          phase: "active",
          allowed: true,
        })),
        limits: { maxHandoffPerTurn: 8, maxContributions: 32 },
      },
    };

    const bytes = Buffer.from(canonicalJson(ir));
    const digest = sha256Hex(bytes);
    return { ir, bytes, digest, regimeDir };
  }
}

function main() {
  const args = process.argv.slice(2);
  const compiler = new RegimeCompiler();
  const out = {};
  for (const dir of args) {
    const { ir, digest } = compiler.compile(dir);
    out[ir.regimeId] = { regimeId: ir.regimeId, treatment: ir.treatment, digest, agents: ir.agents.length, edges: ir.graph.edges.length };
  }
  console.log(JSON.stringify(out, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
