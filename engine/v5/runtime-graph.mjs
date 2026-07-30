// runtime-graph.mjs — reconstruct a runtime graph from match events and diff it
// against the declared regime topology.
//
// Pure functions, zero dependencies (project policy: engine layer is dep-free).
// Consumes the OTel-style v2 event envelope from events.mjs.
//
//   parseActor(actor)                  → { regime, office, raw }
//   bareOfficeId(actorId)              → bare office name for topology comparison
//   extractDispatches(events)          → seq-stable dispatch list
//   reconstructRuntimeGraph(events)    → runtime graph with measurement + observed
//   diffTopology(declared, runtime)    → diff report (measurement-gated)
//   readEventsFile(matchId) / ...      → file-system helpers (CLI use)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT as CIVAGENT_ROOT } from "./events.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// ── Actor parsing ────────────────────────────────────────────────────────────
//
// Runtime turn actors are attributed as "regime#office" (see run-v5.mjs). The
// regime id is validated to exclude "#" (loadDeclaredTopology regex), so the
// FIRST "#" is always the regime/office separator; the office suffix may itself
// contain further "#" characters and is kept verbatim.

export function parseActor(actor) {
  if (typeof actor !== "string" || actor.length === 0) {
    return { regime: "<unknown>", office: null, raw: actor ?? null };
  }
  const hash = actor.indexOf("#");
  if (hash < 0) return { regime: actor, office: null, raw: actor };
  const regime = actor.slice(0, hash);
  const office = actor.slice(hash + 1);
  return {
    regime: regime.length === 0 ? "<unknown>" : regime,
    office: office.length === 0 ? null : office,
    raw: actor,
  };
}

// Strip the "regime#" prefix (at the first "#") so a runtime actor can be
// compared against a bare declared-topology office id. Non-string ids and ids
// without a "#" are returned unchanged.
export function bareOfficeId(actorId) {
  if (typeof actorId !== "string") return actorId;
  const hash = actorId.indexOf("#");
  return hash < 0 ? actorId : actorId.slice(hash + 1);
}

// ── Dispatch extraction ──────────────────────────────────────────────────────
//
// A dispatch is a coordinator→office delegation, observed as a literal
// "[→ office]" token in a turn's rendered text (stream-json.mjs emits these for
// tool_use delegations). This is an explicit, textual measurement — no event
// `kind` is interpreted. Records carry { sequence, seq, coordinator, office,
// text } and are sorted stably by the event seq.

const DISPATCH_TOKEN_RE = /\[→ ([A-Za-z0-9_.-]+(?:#[A-Za-z0-9_.-]+)*)\]/g;

export function extractDispatches(events) {
  if (!Array.isArray(events) || events.length === 0) return [];

  const indexed = events.map((ev, i) => ({ ev, i }));
  // Stable sort by seq; events without a numeric seq sink to the end, and ties
  // (equal seq, or both missing) fall back to original stream order.
  indexed.sort((a, b) => {
    const sa = typeof a.ev?.seq === "number" ? a.ev.seq : null;
    const sb = typeof b.ev?.seq === "number" ? b.ev.seq : null;
    if (sa !== null && sb !== null && sa !== sb) return sa - sb;
    if (sa !== null && sb === null) return -1;
    if (sa === null && sb !== null) return 1;
    return a.i - b.i;
  });

  const out = [];
  for (const { ev } of indexed) {
    if (!ev || typeof ev !== "object") continue;
    if (ev.type != null && ev.type !== "turn") continue;
    if (typeof ev.text !== "string" || ev.text.length === 0) continue;
    const coordinator = typeof ev.actor === "string" && ev.actor ? ev.actor : "unknown";
    DISPATCH_TOKEN_RE.lastIndex = 0;
    let m;
    while ((m = DISPATCH_TOKEN_RE.exec(ev.text)) !== null) {
      const office = m[1];
      if (!office) continue;
      out.push({
        sequence: 0,
        seq: typeof ev.seq === "number" ? ev.seq : null,
        coordinator,
        office,
        text: ev.text,
      });
    }
  }
  for (let i = 0; i < out.length; i++) out[i].sequence = i + 1;
  return out;
}

// ── reconstructRuntimeGraph ──────────────────────────────────────────────────

const INFERRED_NOTE =
  "Runtime events prove only office turn counts and coordinator→office " +
  "dispatches (via literal [→ office] tokens in turn text). Declared-topology " +
  "typed edges (command/review/info/veto) between offices cannot be inferred " +
  "from span parents, turn ordering, or text citations without risk of " +
  "inventing edges the data does not support. inferred.topology_edges is " +
  "left empty by design.";

function isTurn(ev) {
  if (!ev || typeof ev !== "object") return false;
  if (ev.type === "turn") return true;
  // `type` may be absent on older events; fall back to kind.
  if (ev.type == null && ev.kind === "turn") return true;
  return false;
}

export function reconstructRuntimeGraph(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      nodes: [], edges: [],
      measurement: { edge_observability: "coordinator_to_office_only" },
      observed: { office_turn_counts: {}, dispatch_sequence: [], dispatch_counts: {}, office_nodes: [] },
      inferred: { topology_edges: [], note: INFERRED_NOTE },
      orphan_spans: [], duplicate_spans: [],
      event_count: 0,
    };
  }

  const nodes = new Map();
  const edges = new Map();
  const spanActors = new Map();
  const spanIdSeen = new Map();
  const orphanSpans = [];
  const duplicateSpans = [];

  // Pass 1: nodes + span_id→actor map (order-independent).
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const actor = typeof ev.actor === "string" && ev.actor ? ev.actor : "unknown";
    const sid = ev.span_id;
    if (!nodes.has(actor)) nodes.set(actor, { id: actor, eventCount: 0 });
    nodes.get(actor).eventCount++;
    if (sid != null) {
      const prev = spanIdSeen.get(sid) || 0;
      spanIdSeen.set(sid, prev + 1);
      if (prev > 0) {
        if (prev === 1) duplicateSpans.push({ span_id: sid, count: 2 });
        else { const e = duplicateSpans.find((d) => d.span_id === sid); if (e) e.count = prev + 1; }
      }
      spanActors.set(sid, actor);
    }
  }

  // Pass 2: edges from parent_span_id → span_id links (order-independent given
  // the Pass-1 map; out-of-order parent/child still resolve).
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
      fromActor = "<orphan>";
      orphanSpans.push({ span_id: ev.span_id, parent_span_id: psid, event_id: ev.event_id });
    }
    const key = fromActor + "→" + toActor + ":" + kind;
    if (!edges.has(key)) edges.set(key, { from: fromActor, to: toActor, kind, count: 0 });
    edges.get(key).count++;
  }

  // Observed: office-level signals that the event stream actually measures.
  const officeTurnCounts = {};
  const officeEventCounts = new Map();
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const actor = typeof ev.actor === "string" && ev.actor ? ev.actor : "unknown";
    const { office } = parseActor(actor);
    if (!office) continue;
    officeEventCounts.set(office, (officeEventCounts.get(office) || 0) + 1);
    if (isTurn(ev)) officeTurnCounts[office] = (officeTurnCounts[office] || 0) + 1;
  }

  const dispatchSequence = extractDispatches(events);
  const dispatchCounts = {};
  for (const d of dispatchSequence) {
    dispatchCounts[d.office] = (dispatchCounts[d.office] || 0) + 1;
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
    measurement: { edge_observability: "coordinator_to_office_only" },
    observed: {
      office_turn_counts: officeTurnCounts,
      dispatch_sequence: dispatchSequence,
      dispatch_counts: dispatchCounts,
      office_nodes: [...officeEventCounts.entries()]
        .map(([id, eventCount]) => ({ id, eventCount }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    },
    inferred: { topology_edges: [], note: INFERRED_NOTE },
    orphan_spans: orphanSpans,
    duplicate_spans: duplicateSpans,
    event_count: events.length,
  };
}

// ── diffTopology ─────────────────────────────────────────────────────────────
//
// Node-id normalisation: runtime actors "regime#office" → bare "office" for
// overlap comparison with declared topology node ids.
//
// Comparability gate — based ONLY on the runtime graph's explicit `measurement`
// field, never on the runtime edge `kind` values (no kind heuristics):
//
//   no `measurement` field                                       → legacy/hand-built → comparable → real ratio
//   measurement.edge_observability = "direct_office_typed_edges" → comparable → real ratio
//   measurement.edge_observability = <anything else>             → NOT comparable → ratio = null
//
// reconstructRuntimeGraph always tags its output "coordinator_to_office_only",
// so even when normalised office ids overlap declared ids, the edge diff is not
// comparable (reason = edge_observability_limited): the stream sees that offices
// acted, not the office→office typed edges the topology declares.
//
// When NOT comparable, edge_exercise_counts still carry runtimeCount = 0 and
// unexercised_edges / total_unexercised follow the old logic — only the derived
// ratio is withheld (and explained).

export function diffTopology(declared, runtime) {
  if (!declared || typeof declared !== "object") throw new Error("declared topology must be an object");
  if (!runtime || typeof runtime !== "object") throw new Error("runtime graph must be an object");

  const declaredEdges = Array.isArray(declared.edges) ? declared.edges : [];
  const runtimeEdges = Array.isArray(runtime.edges) ? runtime.edges : [];

  const declaredNodeIds = new Set(
    (Array.isArray(declared.nodes) ? declared.nodes : []).map((n) => n?.id).filter(Boolean)
  );
  const runtimeRawIds = (Array.isArray(runtime.nodes) ? runtime.nodes : []).map((n) => n?.id).filter(Boolean);
  const normalizedRuntimeIds = new Set(runtimeRawIds.map((id) => bareOfficeId(id)));

  // Node overlap (normalised office ids).
  const overlap = [...declaredNodeIds].filter((id) => normalizedRuntimeIds.has(id));
  const nodeIdMatch = overlap.length > 0;

  // Measurement gate — explicit only.
  const meas = runtime.measurement;
  const observability = meas && typeof meas === "object" ? meas.edge_observability ?? null : null;
  const comparable =
    nodeIdMatch && (meas == null || observability === "direct_office_typed_edges");

  let incomparableReason = null;
  let nodeIdMismatchDetail = null;

  if (!nodeIdMatch) {
    incomparableReason = "no_node_overlap";
    const ds = [...declaredNodeIds].slice(0, 10).join(", ");
    const rs = [...normalizedRuntimeIds].slice(0, 10).join(", ");
    nodeIdMismatchDetail =
      "Declared topology nodes (" + ds + (declaredNodeIds.size > 10 ? ", …" : "") + ") " +
      "are bare office / role identifiers, while the runtime emits actor ids at the " +
      "agent-level — a regime id (e.g. \"china/ming\"), a regime#office pair, or " +
      "another system actor — which live in a different id space than the " +
      "regime-level / office-role ids the topology declares. " +
      "Normalised runtime nodes (" + rs + (normalizedRuntimeIds.size > 10 ? ", …" : "") + ") " +
      "do not overlap with declared ids. Per-edge exercise counts cannot be " +
      "attributed to declared edges. The unexercised ratio is null; see " +
      "runtime.observed for office-level signals that ARE measurable.";
  } else if (!comparable) {
    incomparableReason = "edge_observability_limited";
    nodeIdMismatchDetail =
      "Normalised runtime node ids overlap declared office ids, but the runtime " +
      "graph declares measurement.edge_observability = " + JSON.stringify(observability) + ". " +
      "This means the event stream captures coordinator→office dispatches and " +
      "office turn counts, but NOT the direction, kind (command/review/info/veto), " +
      "or office→office adjacency that the declared topology specifies. " +
      "The unexercised ratio is null because a numeric value would imply " +
      "measurement precision the data does not have. Use runtime.observed for " +
      "the signals that ARE measurable.";
  }

  // Edge key lookup.
  const declaredByKey = new Map();
  for (const e of declaredEdges) {
    if (!e || typeof e !== "object") continue;
    declaredByKey.set(e.from + "→" + e.to + ":" + e.kind, e);
  }
  const runtimeByKey = new Map();
  for (const e of runtimeEdges) {
    if (!e || typeof e !== "object") continue;
    runtimeByKey.set(bareOfficeId(e.from) + "→" + bareOfficeId(e.to) + ":" + e.kind, e);
  }

  // Compute diff. When not comparable, every declared edge gets runtimeCount 0
  // (old mismatch semantics); when comparable, a missing runtime edge is also 0.
  const unexercisedEdges = [];
  const edgeExerciseCounts = [];

  for (const [key, decl] of declaredByKey) {
    const rt = runtimeByKey.get(key);
    const count = comparable ? (rt ? rt.count : 0) : 0;
    edgeExerciseCounts.push({
      from: decl.from, to: decl.to, kind: decl.kind,
      declared: true, runtimeCount: count,
      note: decl.note || undefined,
    });
    if (count === 0) {
      unexercisedEdges.push({
        from: decl.from, to: decl.to, kind: decl.kind,
        note: decl.note || undefined,
      });
    }
  }

  const undeclaredEdges = [];
  for (const [key, rt] of runtimeByKey) {
    if (!declaredByKey.has(key)) {
      undeclaredEdges.push({ from: rt.from, to: rt.to, kind: rt.kind, runtimeCount: rt.count });
    }
  }

  const totalDeclared = declaredEdges.length;
  const unexercisedRatio =
    comparable && totalDeclared > 0 ? unexercisedEdges.length / totalDeclared : null;

  // "Unexercised" is a claim about behaviour: this edge existed and was never
  // used. It can only be made from data that could have seen the edge fire.
  // When the stream cannot observe typed office-to-office edges at all, the
  // same list means something entirely different — "we cannot see these" — and
  // publishing it under the exercise fields invites the false reading that none
  // of them fired. In the match this was verified against, the Chancellery
  // reviewed the Secretariat's draft three times: those edges were exercised
  // and merely invisible. So the exercise fields go null and the list is
  // republished under a name that says what it is.
  return {
    measurement: meas,
    unexercised_edges: comparable ? unexercisedEdges : null,
    unobservable_edges: comparable ? null : unexercisedEdges,
    undeclared_edges: undeclaredEdges,
    edge_exercise_counts: comparable ? edgeExerciseCounts : null,
    unexercised_ratio: unexercisedRatio,
    comparable,
    incomparable_reason: incomparableReason,
    total_declared_edges: totalDeclared,
    total_unexercised: comparable ? unexercisedEdges.length : null,
    total_unobservable: comparable ? null : unexercisedEdges.length,
    node_id_match: nodeIdMatch,
    node_id_mismatch_detail: nodeIdMismatchDetail,
    declared_node_ids: [...declaredNodeIds].sort(),
    runtime_node_ids: runtimeRawIds.sort(),
    orphan_spans: runtime.orphan_spans || [],
    duplicate_spans: runtime.duplicate_spans || [],
  };
}

// ── File-system helpers ──────────────────────────────────────────────────────

export const SAFE_MATCH_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function assertSafeMatchId(matchId, what) {
  const id = String(matchId ?? "");
  if (id.includes("/") || id.includes("\\") || id === "." || id === ".." ||
      id.includes("..") || !SAFE_MATCH_ID.test(id)) {
    throw new Error("unsafe " + (what || "match id") + ": " + JSON.stringify(matchId));
  }
  return id;
}

export function readEventsFile(matchId) {
  assertSafeMatchId(matchId);
  const p = path.join(CIVAGENT_ROOT, "matches", String(matchId), "events.jsonl");
  if (!fs.existsSync(p)) throw new Error("match not found: " + matchId);
  const events = [];
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { events.push(JSON.parse(line)); } catch { /* torn line */ }
  }
  return events;
}

export function loadDeclaredTopology(regime) {
  if (!/^_?[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_-]*$/i.test(regime)) {
    throw new Error("invalid regime id: " + regime);
  }
  const topoPath = path.join(PROJECT_ROOT, "regimes", regime, "topology.json");
  if (!fs.existsSync(topoPath)) throw new Error("topology.json not found for regime: " + regime);
  return JSON.parse(fs.readFileSync(topoPath, "utf8"));
}

export function readMatchMeta(matchId) {
  assertSafeMatchId(matchId);
  const p = path.join(CIVAGENT_ROOT, "matches", String(matchId), "meta.json");
  if (!fs.existsSync(p)) throw new Error("match meta not found: " + matchId);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// ── CLI ──────────────────────────────────────────────────────────────────────

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
  if (opts.json) { console.log(JSON.stringify(g, null, 2)); return; }
  const meas = g.measurement || {};
  console.log("Runtime graph — " + g.event_count + " events, " + g.nodes.length + " actors, " +
    g.edges.length + " edge types (edge_observability: " + (meas.edge_observability || "legacy") + ")");
  console.log("");
  console.log("Nodes:");
  for (const n of g.nodes) console.log("  " + n.id + " (" + n.eventCount + " events)");
  console.log("");
  console.log("Span-tree edges:");
  if (g.edges.length === 0) console.log("  (none)");
  else for (const e of g.edges) console.log("  " + e.from + " → " + e.to + "  [" + e.kind + "]  ×" + e.count);
  const obs = g.observed || {};
  console.log("");
  console.log("Observed:");
  const on = obs.office_nodes || [];
  if (on.length > 0) {
    console.log("  Office nodes:");
    for (const n of on) console.log("    " + n.id + ": " + n.eventCount + " events");
  } else console.log("  (no office-attributed events)");
  const tc = obs.office_turn_counts || {};
  if (Object.keys(tc).length > 0) {
    console.log("  Office turn counts:");
    for (const k of Object.keys(tc).sort()) console.log("    " + k + ": " + tc[k]);
  }
  const dc = obs.dispatch_counts || {};
  if (Object.keys(dc).length > 0) {
    console.log("  Dispatch counts (per office):");
    for (const k of Object.keys(dc).sort()) console.log("    " + k + ": " + dc[k]);
    console.log("  Dispatch sequence:");
    for (const d of obs.dispatch_sequence || []) {
      console.log("    #" + d.sequence + "  seq=" + (d.seq ?? "?") + "  " + d.coordinator + " → " + d.office);
    }
  } else console.log("  Dispatches: (none)");
  const inf = g.inferred || {};
  console.log("");
  console.log("Inferred:");
  const te = inf.topology_edges || [];
  if (te.length === 0) console.log("  topology_edges: (none)");
  else for (const e of te) console.log("  " + e.from + " → " + e.to + "  [" + e.kind + "]");
  if (inf.note) console.log("  Note: " + inf.note);
  if (g.orphan_spans && g.orphan_spans.length) console.log("\n⚠  " + g.orphan_spans.length + " orphan span(s)");
  if (g.duplicate_spans && g.duplicate_spans.length) console.log("\n⚠  " + g.duplicate_spans.length + " duplicate span_id(s)");
}

function printDiff(diff, opts) {
  if (opts.json) { console.log(JSON.stringify(diff, null, 2)); return; }
  console.log("\n── Declared topology vs runtime diff ──");
  console.log("Declared nodes: " + diff.declared_node_ids.join(", "));
  console.log("Runtime nodes:  " + diff.runtime_node_ids.join(", "));
  console.log("Comparable:     " + diff.comparable + (diff.incomparable_reason ? " (" + diff.incomparable_reason + ")" : ""));
  console.log("");
  if (!diff.comparable && diff.node_id_mismatch_detail) {
    console.log("⚠  RATIO WITHHELD:");
    console.log("   " + diff.node_id_mismatch_detail);
    console.log("");
  }
  console.log("Declared edges: " + diff.total_declared_edges);
  const ratioText = diff.unexercised_ratio === null
    ? "ratio: n/a"
    : "ratio: " + diff.unexercised_ratio.toFixed(3);
  console.log(
    diff.comparable
      ? "Unexercised:    " + diff.total_unexercised + " (" + ratioText + ")"
      : "Unobservable:   " + diff.total_unobservable + " of " + diff.total_declared_edges +
        " declared edges (not a count of non-exercise — see above)");
  const listed = diff.unexercised_edges ?? diff.unobservable_edges ?? [];
  if (listed.length > 0) {
    console.log(diff.comparable
      ? "\nUnexercised edges (declared, never seen at runtime):"
      : "\nUnobservable edges (declared; this stream cannot see whether they fired):");
    for (const e of listed) {
      console.log("  " + e.from + " → " + e.to + "  [" + e.kind + "]" + (e.note ? " — " + e.note : ""));
    }
  }
  if (diff.undeclared_edges.length > 0) {
    console.log("\nUndeclared edges:");
    for (const e of diff.undeclared_edges) {
      console.log("  " + e.from + " → " + e.to + "  [" + e.kind + "]  ×" + e.runtimeCount);
    }
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
          if (args.json) console.log(JSON.stringify({ runtime_graph: g, diff }, null, 2));
          else { printGraph(g, args); printDiff(diff, args); }
        } catch (e) {
          console.error("\n⚠  Cannot load topology: " + e.message);
          if (args.json) console.log(JSON.stringify({ runtime_graph: g, diff: null, error: e.message }, null, 2));
        }
      } else {
        console.error("\n⚠  Cannot --diff: meta.json has no regime field");
        if (args.json) console.log(JSON.stringify({ runtime_graph: g, diff: null, error: "no regime" }, null, 2));
      }
    } else {
      printGraph(g, args);
    }
  } catch (e) {
    console.error("Error: " + e.message);
    process.exit(1);
  }
}
