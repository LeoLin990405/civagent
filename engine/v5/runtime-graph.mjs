// runtime-graph.mjs — reconstruct a runtime graph from match events and diff it
// against the declared regime topology.
//
// Pure functions, zero dependencies (project policy: engine layer is dep-free).
// Consumes the OTel-style v2 event envelope from events.mjs.
//
//   reconstructRuntimeGraph(events)  → runtime graph object
//   diffTopology(declared, runtime)   → diff report
//   readEventsFile(matchId)           → parsed event array (for CLI use)
//   loadDeclaredTopology(regime)      → parsed topology.json (for CLI use)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT as CIVAGENT_ROOT } from "./events.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// ── reconstructRuntimeGraph ──────────────────────────────────────────────────
//
// Builds a runtime graph from a match's event array.
//
// Nodes: every unique `actor` that appears in the stream. Each node carries the
// total event count attributed to that actor.
//
// Edges: derived from the span tree — for every event whose parent_span_id is
// non-null, the parent span's actor → this event's actor forms one directed
// edge, tagged with the event's `kind`. Multiple events between the same
// (from, to, kind) are merged with an accumulated count.
//
// Robustness guarantees:
//   - Empty array → valid empty graph (never throws).
//   - Missing actor fields → defaults to "unknown".
//   - parent_span_id = null → skipped (it's a trace root, no edge).
//   - parent_span_id pointing to an unknown span → recorded in orphan_spans;
//     the edge is still created with from="<orphan>" so the graph isn't
//     silently incomplete.
//   - Duplicate span_ids → detected and reported in duplicate_spans; the LAST
//     event wins the span_id→actor mapping (so at least one is represented).
//   - Out-of-order events: the two-pass approach (span_id→actor map first,
//     then edges) is order-independent for the map; edges are created in
//     iteration order which is fine for a cumulative count.

export function reconstructRuntimeGraph(events) {
  const nodes = new Map();       // actor → { id, eventCount }
  const edges = new Map();       // key "from→to:kind" → { from, to, kind, count }
  const spanActors = new Map();  // span_id → actor
  const spanIdSeen = new Map();  // span_id → count (duplicate detection)
  const orphanSpans = [];        // { span_id, parent_span_id, event_id }
  const duplicateSpans = [];     // { span_id, count }

  if (!Array.isArray(events) || events.length === 0) {
    return {
      nodes: [],
      edges: [],
      orphan_spans: [],
      duplicate_spans: [],
      event_count: 0,
    };
  }

  // ── Pass 1: build span_id → actor map ──
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;

    const actor = typeof ev.actor === "string" && ev.actor ? ev.actor : "unknown";
    const sid = ev.span_id;

    // Track actor counts
    if (!nodes.has(actor)) {
      nodes.set(actor, { id: actor, eventCount: 0 });
    }
    nodes.get(actor).eventCount++;

    // Track span_id → actor (detect duplicates)
    if (sid != null) {
      const prev = spanIdSeen.get(sid) || 0;
      spanIdSeen.set(sid, prev + 1);
      if (prev > 0) {
        // Only report the first duplicate occurrence
        if (prev === 1) {
          duplicateSpans.push({ span_id: sid, count: 2 });
        } else {
          // Update count on the already-reported entry
          const entry = duplicateSpans.find((d) => d.span_id === sid);
          if (entry) entry.count = prev + 1;
        }
      }
      // Last write wins (at least one event is represented)
      spanActors.set(sid, actor);
    }
  }

  // ── Pass 2: build edges from parent_span_id → span_id links ──
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;

    const psid = ev.parent_span_id;
    if (psid == null) continue; // trace root — no incoming edge

    const toActor = typeof ev.actor === "string" && ev.actor ? ev.actor : "unknown";
    const kind = typeof ev.kind === "string" && ev.kind ? ev.kind : "unknown";

    let fromActor;
    if (spanActors.has(psid)) {
      fromActor = spanActors.get(psid);
    } else {
      // Parent span not in this event stream (e.g. truncated log)
      fromActor = "<orphan>";
      orphanSpans.push({
        span_id: ev.span_id,
        parent_span_id: psid,
        event_id: ev.event_id,
      });
    }

    const key = `${fromActor}→${toActor}:${kind}`;
    if (!edges.has(key)) {
      edges.set(key, { from: fromActor, to: toActor, kind, count: 0 });
    }
    edges.get(key).count++;
  }

  return {
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...edges.values()].sort((a, b) => {
      const c = a.from.localeCompare(b.from);
      if (c !== 0) return c;
      const d = a.to.localeCompare(b.to);
      if (d !== 0) return d;
      return a.kind.localeCompare(b.kind);
    }),
    orphan_spans: orphanSpans,
    duplicate_spans: duplicateSpans,
    event_count: events.length,
  };
}

// ── diffTopology ─────────────────────────────────────────────────────────────
//
// Compares a declared topology (topology.json object) against a runtime graph
// (output of reconstructRuntimeGraph).
//
// Returns:
//   unexercised_edges     — declared edges with zero runtime occurrences
//   undeclared_edges      — runtime edges not found in the declared topology
//   edge_exercise_counts  — every declared edge with its actual trigger count
//   unexercised_ratio     — unexercised / total declared (0–1); null when the
//                           node-id granularity does not match, or no declared edges
//   node_id_match         — whether any declared node id appears as a runtime node
//   node_id_mismatch_detail — explanation when node ids don't overlap
//   declared_node_ids     — sorted list of node ids in the topology
//   runtime_node_ids      — sorted list of node ids in the runtime graph

export function diffTopology(declared, runtime) {
  // ── Validate inputs ──
  if (!declared || typeof declared !== "object") {
    throw new Error("declared topology must be an object");
  }
  if (!runtime || typeof runtime !== "object") {
    throw new Error("runtime graph must be an object");
  }

  const declaredEdges = Array.isArray(declared.edges) ? declared.edges : [];
  const runtimeEdges = Array.isArray(runtime.edges) ? runtime.edges : [];

  const declaredNodeIds = new Set(
    (Array.isArray(declared.nodes) ? declared.nodes : []).map((n) => n?.id).filter(Boolean)
  );
  const runtimeNodeIds = new Set(
    (Array.isArray(runtime.nodes) ? runtime.nodes : []).map((n) => n?.id).filter(Boolean)
  );

  // ── Node ID namespace check ──
  const overlap = [...declaredNodeIds].filter((id) => runtimeNodeIds.has(id));
  const nodeIdMatch = overlap.length > 0;
  let nodeIdMismatchDetail = null;

  if (!nodeIdMatch) {
    const declaredSample = [...declaredNodeIds].slice(0, 10).join(", ");
    const runtimeSample = [...runtimeNodeIds].slice(0, 10).join(", ");
    nodeIdMismatchDetail =
      `Declared topology nodes (${declaredSample}${declaredNodeIds.size > 10 ? ", …" : ""}) ` +
      `are agent-level / role-level identifiers. ` +
      `Runtime nodes (${runtimeSample}${runtimeNodeIds.size > 10 ? ", …" : ""}) ` +
      `are regime-level / actor-level identifiers (e.g., "china/tang", "judge", "system"). ` +
      `The current event stream does not record which individual agent within a regime ` +
      `produced each event — all turn events share the regime id as their actor. ` +
      `Because the two naming schemes operate at different granularities, ` +
      `agent-level edge exercise cannot be confirmed from runtime data alone. ` +
      `The diff below treats every declared edge as unexercised (count = 0) and ` +
      `every runtime edge as undeclared. This is accurate given the data available, ` +
      `not a bug in the diff algorithm.`;
  }

  // ── Build edge key → declared edge lookup ──
  // Declared edge key: "from→to:kind"
  const declaredByKey = new Map();
  for (const e of declaredEdges) {
    if (!e || typeof e !== "object") continue;
    const key = `${e.from}→${e.to}:${e.kind}`;
    declaredByKey.set(key, e);
  }

  // Runtime edge key set
  const runtimeByKey = new Map();
  for (const e of runtimeEdges) {
    if (!e || typeof e !== "object") continue;
    const key = `${e.from}→${e.to}:${e.kind}`;
    runtimeByKey.set(key, e);
  }

  // ── Compute diff ──
  const unexercisedEdges = [];
  const edgeExerciseCounts = [];

  for (const [key, decl] of declaredByKey) {
    const rt = runtimeByKey.get(key);
    const count = rt ? rt.count : 0;
    edgeExerciseCounts.push({
      from: decl.from,
      to: decl.to,
      kind: decl.kind,
      declared: true,
      runtimeCount: count,
      note: decl.note || undefined,
    });
    if (count === 0) {
      unexercisedEdges.push({
        from: decl.from,
        to: decl.to,
        kind: decl.kind,
        note: decl.note || undefined,
      });
    }
  }

  const undeclaredEdges = [];
  for (const [key, rt] of runtimeByKey) {
    if (!declaredByKey.has(key)) {
      undeclaredEdges.push({
        from: rt.from,
        to: rt.to,
        kind: rt.kind,
        runtimeCount: rt.count,
      });
    }
  }

  const totalDeclared = declaredEdges.length;
  // When declared and runtime node ids do not overlap at all, every declared
  // edge is trivially "unexercised" and the ratio is 1.0 for every regime, every
  // match. That number looks like a measurement and is not one — it is an
  // artifact of the event stream carrying regime-level actors while the topology
  // is written at office level. Reporting null forces the consumer to read
  // node_id_mismatch_detail instead of copying a meaningless 1.000 into a
  // results table.
  const unexercisedRatio = !nodeIdMatch
    ? null
    : totalDeclared > 0
      ? unexercisedEdges.length / totalDeclared
      : null;

  return {
    unexercised_edges: unexercisedEdges,
    undeclared_edges: undeclaredEdges,
    edge_exercise_counts: edgeExerciseCounts,
    unexercised_ratio: unexercisedRatio,
    total_declared_edges: totalDeclared,
    total_unexercised: unexercisedEdges.length,
    node_id_match: nodeIdMatch,
    node_id_mismatch_detail: nodeIdMismatchDetail,
    declared_node_ids: [...declaredNodeIds].sort(),
    runtime_node_ids: [...runtimeNodeIds].sort(),
    // Passthrough runtime integrity signals
    orphan_spans: runtime.orphan_spans || [],
    duplicate_spans: runtime.duplicate_spans || [],
  };
}

// ── File-system helpers (for CLI use; not pure — they read the filesystem) ───

// SAFE_MATCH_ID — reuses the same contract as engine/v5/replay.mjs.
// Match ids appear as directory names under ~/.civagent/matches/.
export const SAFE_MATCH_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function assertSafeMatchId(matchId, what = "match id") {
  const id = String(matchId ?? "");
  if (
    id.includes("/") ||
    id.includes("\\") ||
    id === "." ||
    id === ".." ||
    id.includes("..") ||
    !SAFE_MATCH_ID.test(id)
  ) {
    throw new Error(`unsafe ${what}: ${JSON.stringify(matchId)}`);
  }
  return id;
}

// Read and parse a match's events.jsonl. Returns an array of event objects.
// Throws if the match is not found or the id is unsafe.
export function readEventsFile(matchId) {
  assertSafeMatchId(matchId);
  const p = path.join(CIVAGENT_ROOT, "matches", String(matchId), "events.jsonl");
  if (!fs.existsSync(p)) {
    throw new Error(`match not found: ${matchId} (looked for ${p})`);
  }
  const events = [];
  const raw = fs.readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      // Tolerate torn final lines (process killed mid-write)
    }
  }
  return events;
}

// Read a regime's topology.json. Returns the parsed object.
// Throws if the regime directory or topology file doesn't exist.
export function loadDeclaredTopology(regime) {
  // Same contract as engine/v5/civ-memory.mjs::validateRegime, deliberately:
  // hardcoding china|global here excluded _baseline/* and _ablated/*, which are
  // exactly the control arms this comparison exists to evaluate. A control could
  // run as a civ, produce events, and then be the one match whose declared graph
  // could not be looked up.
  if (!/^_?[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_-]*$/i.test(regime)) {
    throw new Error(`invalid regime id: ${regime}`);
  }
  const topoPath = path.join(PROJECT_ROOT, "regimes", regime, "topology.json");
  if (!fs.existsSync(topoPath)) {
    throw new Error(`topology.json not found for regime: ${regime} (looked for ${topoPath})`);
  }
  return JSON.parse(fs.readFileSync(topoPath, "utf8"));
}

// Read a match's meta.json to discover which regime ran it.
export function readMatchMeta(matchId) {
  assertSafeMatchId(matchId);
  const p = path.join(CIVAGENT_ROOT, "matches", String(matchId), "meta.json");
  if (!fs.existsSync(p)) {
    throw new Error(`match meta not found: ${matchId} (looked for ${p})`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// ── CLI entry point ──────────────────────────────────────────────────────────
//   node engine/v5/runtime-graph.mjs <matchId> [--diff] [--json]
//
// --diff   Also load the regime's topology.json and print the diff.
// --json   Output JSON instead of human-readable text.

function parseCliArgs(argv) {
  const args = { matchId: null, diff: false, json: false };
  for (const a of argv) {
    if (a === "--diff") args.diff = true;
    else if (a === "--json") args.json = true;
    else if (!args.matchId && !a.startsWith("-")) args.matchId = a;
  }
  return args;
}

function printGraph(g, opts) {
  if (opts.json) {
    console.log(JSON.stringify(g, null, 2));
    return;
  }
  console.log(`Runtime graph — ${g.event_count} events, ${g.nodes.length} actors, ${g.edges.length} edge types`);
  console.log("");
  console.log("Nodes:");
  for (const n of g.nodes) {
    console.log(`  ${n.id} (${n.eventCount} events)`);
  }
  console.log("");
  console.log("Edges:");
  if (g.edges.length === 0) {
    console.log("  (none)");
  } else {
    for (const e of g.edges) {
      console.log(`  ${e.from} → ${e.to}  [${e.kind}]  ×${e.count}`);
    }
  }
  if (g.orphan_spans.length > 0) {
    console.log(`\n⚠  ${g.orphan_spans.length} orphan span(s) (parent_span_id not found in stream):`);
    for (const o of g.orphan_spans) {
      console.log(`  span=${o.span_id} parent=${o.parent_span_id}`);
    }
  }
  if (g.duplicate_spans.length > 0) {
    console.log(`\n⚠  ${g.duplicate_spans.length} duplicate span_id(s):`);
    for (const d of g.duplicate_spans) {
      console.log(`  span=${d.span_id} occurrences=${d.count}`);
    }
  }
}

function printDiff(diff, opts) {
  if (opts.json) {
    console.log(JSON.stringify(diff, null, 2));
    return;
  }
  console.log(`\n── Declared topology vs runtime diff ──`);
  console.log(`Declared nodes: ${diff.declared_node_ids.join(", ")}`);
  console.log(`Runtime nodes:  ${diff.runtime_node_ids.join(", ")}`);
  console.log("");

  if (!diff.node_id_match) {
    console.log(`⚠  NODE ID MISMATCH: declared (agent-level) and runtime (regime-level) node IDs do not overlap.`);
    console.log(`   ${diff.node_id_mismatch_detail}`);
    console.log("");
  }

  console.log(`Declared edges: ${diff.total_declared_edges}`);
  const ratioText = diff.unexercised_ratio === null
    ? "ratio: n/a — node id granularity does not match, see above"
    : `ratio: ${diff.unexercised_ratio.toFixed(3)}`;
  console.log(`Unexercised:    ${diff.total_unexercised} (${ratioText})`);

  if (diff.unexercised_edges.length > 0) {
    console.log(`\nUnexercised edges (declared but never seen at runtime):`);
    for (const e of diff.unexercised_edges) {
      const note = e.note ? ` — ${e.note}` : "";
      console.log(`  ${e.from} → ${e.to}  [${e.kind}]${note}`);
    }
  }

  if (diff.undeclared_edges.length > 0) {
    console.log(`\nUndeclared edges (seen at runtime but not in topology):`);
    for (const e of diff.undeclared_edges) {
      console.log(`  ${e.from} → ${e.to}  [${e.kind}]  ×${e.runtimeCount}`);
    }
  }

  if (diff.orphan_spans.length > 0) {
    console.log(`\n⚠  ${diff.orphan_spans.length} orphan span(s) in event stream.`);
  }
  if (diff.duplicate_spans.length > 0) {
    console.log(`\n⚠  ${diff.duplicate_spans.length} duplicate span_id(s) detected.`);
  }
}

if (process.argv[1] && process.argv[1].endsWith("runtime-graph.mjs")) {
  const args = parseCliArgs(process.argv.slice(2));
  if (!args.matchId) {
    console.error("Usage: node engine/v5/runtime-graph.mjs <matchId> [--diff] [--json]");
    process.exit(1);
  }

  try {
    const events = readEventsFile(args.matchId);
    const g = reconstructRuntimeGraph(events);

    if (args.diff) {
      const meta = readMatchMeta(args.matchId);
      if (meta.regime) {
        try {
          const topo = loadDeclaredTopology(meta.regime);
          const diff = diffTopology(topo, g);
          if (args.json) {
            console.log(JSON.stringify({ runtime_graph: g, diff }, null, 2));
          } else {
            printGraph(g, args);
            printDiff(diff, args);
          }
        } catch (e) {
          console.error(`\n⚠  Cannot load topology for regime "${meta.regime}": ${e.message}`);
          if (args.json) {
            console.log(JSON.stringify({ runtime_graph: g, diff: null, error: e.message }, null, 2));
          }
        }
      } else {
        console.error(`\n⚠  Cannot --diff: meta.json has no regime field`);
        if (args.json) {
          console.log(JSON.stringify({ runtime_graph: g, diff: null, error: "meta.json has no regime field" }, null, 2));
        }
      }
    } else {
      printGraph(g, args);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}
