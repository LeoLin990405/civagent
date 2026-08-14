/**
 * graph.mjs — P2 domain: GraphSpec validation and GraphDispatcher.
 *
 * Plan §8.2/§9: GraphDispatcher validates typed handoffs against graph
 * semantics; printed markers have no authority. In `graph_enforced` mode,
 * declared-versus-exercised topology claims are allowed only after the oracle
 * gate. Invalid requests fail before enqueue.
 */
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";
import { EDGE_KINDS } from "./handoff.mjs";

export class GraphSpecError extends Error {}

/** Validate a compiled graph spec (from RegimeIR). Throws GraphSpecError. */
export function validateGraphSpec(graph) {
  const nodeIds = new Set(graph.nodes.map((n) => n.officeId));
  const edgeIds = new Set();
  for (const e of graph.edges) {
    if (!nodeIds.has(e.source)) throw new GraphSpecError(`edge ${e.edgeId}: unknown source office ${e.source}`);
    if (!nodeIds.has(e.target)) throw new GraphSpecError(`edge ${e.edgeId}: unknown target office ${e.target}`);
    if (!EDGE_KINDS.includes(e.kind)) throw new GraphSpecError(`edge ${e.edgeId}: unknown kind ${e.kind}`);
    if (edgeIds.has(e.edgeId)) throw new GraphSpecError(`duplicate edgeId ${e.edgeId}`);
    edgeIds.add(e.edgeId);
  }
  return { nodeIds, edgeIds, digest: sha256Hex(Buffer.from(canonicalJson(graph))) };
}

export class GraphDispatcher {
  /**
   * @param {object} graph compiled GraphSpec
   * @param {string} mode orchestration mode (observational | roster_enforced | graph_enforced)
   */
  constructor(graph, mode) {
    this.graph = graph;
    this.mode = mode;
    this.spec = validateGraphSpec(graph);
    this.exercised = []; // declared edges actually exercised (observed, not authority)
  }

  /**
   * Validate a HandoffRequest against graph semantics. Returns
   * {valid, reasons, exercisedEdge?}. In observational mode the dispatcher
   * records without enforcing; in graph_enforced mode unknown edges fail.
   */
  validate(handoff) {
    const reasons = [];
    const edge = this.graph.edges.find((e) => e.edgeId === handoff.edgeId);
    if (!edge) {
      if (this.mode === "graph_enforced") {
        reasons.push(`edge ${handoff.edgeId} is not declared in the graph`);
      } else {
        // observational/roster modes still record the unknown edge as observed
        this.exercised.push({ edgeId: handoff.edgeId, declared: false, kind: handoff.edgeKind });
        return { valid: true, exercisedEdge: null, unknownEdgeObserved: true };
      }
    } else {
      if (edge.source !== handoff.sourceOfficeId) reasons.push(`edge ${handoff.edgeId} source ${edge.source} != ${handoff.sourceOfficeId}`);
      if (edge.target !== handoff.targetOfficeId) reasons.push(`edge ${handoff.edgeId} target ${edge.target} != ${handoff.targetOfficeId}`);
      if (edge.kind !== handoff.edgeKind) reasons.push(`edge ${handoff.edgeId} kind ${edge.kind} != ${handoff.edgeKind}`);
      if (reasons.length === 0) {
        this.exercised.push({ edgeId: edge.edgeId, declared: true, kind: edge.kind, source: edge.source, target: edge.target });
      }
    }
    return { valid: reasons.length === 0, reasons, exercisedEdge: edge ?? null };
  }

  /** Declared-vs-exercised topology report. Only meaningful after the oracle gate. */
  topologyReport() {
    const declared = new Map(this.graph.edges.map((e) => [e.edgeId, e]));
    const exercisedMap = new Map(this.exercised.map((e) => [e.edgeId, e]));
    const exercisedDeclared = [...exercisedMap.values()].filter((e) => e.declared);
    const unknownObserved = [...exercisedMap.values()].filter((e) => !e.declared);
    return {
      mode: this.mode,
      declaredCount: declared.size,
      exercisedDeclaredCount: exercisedDeclared.length,
      unknownObservedCount: unknownObserved.length,
      unknownEdgeRate: exercisedMap.size ? unknownObserved.length / exercisedMap.size : 0,
    };
  }
}
