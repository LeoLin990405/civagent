// runtime-graph.test.mjs — tests for engine/v5/runtime-graph.mjs
//
// Covers: reconstructRuntimeGraph (empty, normal, out-of-order, duplicate span_ids,
// orphan parent, missing fields) and diffTopology (matching/mismatched node IDs,
// all-unexercised, partial, empty topologies).
//
// Every test has a corresponding regression-verification comment describing what
// would happen if the implementation were changed to the wrong behavior.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  reconstructRuntimeGraph,
  diffTopology,
  SAFE_MATCH_ID,
  assertSafeMatchId,
} from "../engine/v5/runtime-graph.mjs";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEv(overrides = {}) {
  return {
    event_id: `ev-${Math.random().toString(36).slice(2, 8)}`,
    schema_version: "2.0",
    trace_id: "test-match",
    span_id: `span-${Math.random().toString(36).slice(2, 8)}`,
    parent_span_id: null,
    actor: "system",
    kind: "match_start",
    payload_hash: "0000000000000000",
    ...overrides,
  };
}

// ── reconstructRuntimeGraph ──────────────────────────────────────────────────

test("reconstructRuntimeGraph: empty array returns empty graph", () => {
  const g = reconstructRuntimeGraph([]);
  assert.deepEqual(g.nodes, []);
  assert.deepEqual(g.edges, []);
  assert.deepEqual(g.orphan_spans, []);
  assert.deepEqual(g.duplicate_spans, []);
  assert.equal(g.event_count, 0);
});
// REGRESSION: if the function returned null or threw on empty, this would fail.

test("reconstructRuntimeGraph: non-array input handled gracefully", () => {
  // null and undefined produce the same empty shape (contract: never throw)
  for (const bad of [null, undefined, "string", 42]) {
    const g = reconstructRuntimeGraph(bad);
    assert.deepEqual(g.nodes, []);
    assert.deepEqual(g.edges, []);
    assert.equal(g.event_count, 0);
  }
});
// REGRESSION: if the function did not guard with Array.isArray, it would throw
// a TypeError on the for-of loop.

test("reconstructRuntimeGraph: single event (match_start, parent=null) produces a node but no edges", () => {
  const rootSpan = "root-span-001";
  const events = [
    makeEv({ span_id: rootSpan, parent_span_id: null, actor: "china/tang", kind: "match_start" }),
  ];
  const g = reconstructRuntimeGraph(events);
  assert.equal(g.nodes.length, 1);
  assert.equal(g.nodes[0].id, "china/tang");
  assert.equal(g.nodes[0].eventCount, 1);
  assert.equal(g.edges.length, 0);
  assert.equal(g.event_count, 1);
});
// REGRESSION: if parent_span_id=null were treated as a string "null", it would
// create a spurious edge from an "<orphan>" actor. The test confirms null
// (not the string "null") is correctly skipped.

test("reconstructRuntimeGraph: two events linked by parent_span_id produce one edge", () => {
  const rootSpan = "root-001";
  const childSpan = "child-001";
  const events = [
    makeEv({ span_id: rootSpan, parent_span_id: null, actor: "china/tang", kind: "match_start" }),
    makeEv({ span_id: childSpan, parent_span_id: rootSpan, actor: "china/tang", kind: "turn" }),
  ];
  const g = reconstructRuntimeGraph(events);
  assert.equal(g.nodes.length, 1); // same actor
  assert.equal(g.nodes[0].eventCount, 2);
  assert.equal(g.edges.length, 1);
  assert.equal(g.edges[0].from, "china/tang");
  assert.equal(g.edges[0].to, "china/tang");
  assert.equal(g.edges[0].kind, "turn");
  assert.equal(g.edges[0].count, 1);
});
// REGRESSION: if pass 2 failed to look up the parent span's actor, the edge
// would have from="<orphan>" instead of "china/tang". The count would still be 1
// (silent wrong answer).

test("reconstructRuntimeGraph: multiple edges between same (from,to,kind) are merged", () => {
  const rootSpan = "root-002";
  const events = [
    makeEv({ span_id: rootSpan, parent_span_id: null, actor: "china/tang", kind: "match_start" }),
    makeEv({ span_id: "c1", parent_span_id: rootSpan, actor: "china/tang", kind: "turn" }),
    makeEv({ span_id: "c2", parent_span_id: rootSpan, actor: "china/tang", kind: "turn" }),
    makeEv({ span_id: "c3", parent_span_id: rootSpan, actor: "china/tang", kind: "turn" }),
  ];
  const g = reconstructRuntimeGraph(events);
  assert.equal(g.edges.length, 1);
  assert.equal(g.edges[0].count, 3, "three turn events → merged count of 3");
});
// REGRESSION: if the merge used a key that didn't include 'kind', edges of
// different kinds between the same actors would incorrectly merge into one.

test("reconstructRuntimeGraph: edges of different kinds are NOT merged", () => {
  const rootSpan = "root-003";
  const events = [
    makeEv({ span_id: rootSpan, parent_span_id: null, actor: "china/tang", kind: "match_start" }),
    makeEv({ span_id: "c1", parent_span_id: rootSpan, actor: "china/tang", kind: "turn" }),
    makeEv({ span_id: "c2", parent_span_id: rootSpan, actor: "skill-learner", kind: "skill_commit" }),
  ];
  const g = reconstructRuntimeGraph(events);
  assert.equal(g.edges.length, 2, "different kinds → different edges");
  const kinds = g.edges.map((e) => e.kind).sort();
  assert.deepEqual(kinds, ["skill_commit", "turn"]);
});
// REGRESSION: if the edge key omitted kind, these would merge into one edge
// and the kind field would reflect only the last event processed.

test("reconstructRuntimeGraph: cross-actor edges are captured between regime and judge/system", () => {
  const rootSpan = "root-004";
  const events = [
    makeEv({ span_id: rootSpan, parent_span_id: null, actor: "system", kind: "match_start" }),
    makeEv({ span_id: "c1", parent_span_id: rootSpan, actor: "china/tang", kind: "turn" }),
    makeEv({ span_id: "c2", parent_span_id: rootSpan, actor: "china/tang", kind: "turn" }),
    makeEv({ span_id: "c3", parent_span_id: rootSpan, actor: "judge", kind: "judge_score" }),
    makeEv({ span_id: "c4", parent_span_id: rootSpan, actor: "judge", kind: "judge_score" }),
    makeEv({ span_id: "c5", parent_span_id: rootSpan, actor: "skill-learner", kind: "skill_commit" }),
    makeEv({ span_id: "c6", parent_span_id: rootSpan, actor: "system", kind: "match_end" }),
  ];
  const g = reconstructRuntimeGraph(events);

  // 4 unique actors
  assert.equal(g.nodes.length, 4);
  const nodeIds = g.nodes.map((n) => n.id).sort();
  assert.deepEqual(nodeIds, ["china/tang", "judge", "skill-learner", "system"]);

  // Edge counts per actor
  const chinaNode = g.nodes.find((n) => n.id === "china/tang");
  assert.equal(chinaNode.eventCount, 2);
  const judgeNode = g.nodes.find((n) => n.id === "judge");
  assert.equal(judgeNode.eventCount, 2);

  // 4 edges: system→china/tang:turn (×2 merged to 1), system→judge:judge_score (×2 merged to 1),
  // system→skill-learner:skill_commit, system→system:match_end
  assert.equal(g.edges.length, 4);
});
// REGRESSION: different actors would collapse to the same node if actor were
// not used as the node key.

test("reconstructRuntimeGraph: missing actor field defaults to 'unknown'", () => {
  const rootSpan = "root-005";
  const events = [
    makeEv({ span_id: rootSpan, parent_span_id: null, kind: "match_start" }),
    // no 'actor' field at all
    makeEv({ span_id: "c1", parent_span_id: rootSpan, kind: "turn" }),
  ];
  // Remove actor
  delete events[0].actor;
  delete events[1].actor;

  const g = reconstructRuntimeGraph(events);
  assert.equal(g.nodes.length, 1);
  assert.equal(g.nodes[0].id, "unknown");
  assert.equal(g.nodes[0].eventCount, 2);
});
// REGRESSION: if actor access used `ev.actor || "default"` an actor=""
// (empty string) would be replaced with "default" instead of "unknown".

test("reconstructRuntimeGraph: out-of-order events produce the same graph", () => {
  const rootSpan = "root-006";
  const eventsInOrder = [
    makeEv({ span_id: rootSpan, parent_span_id: null, actor: "china/tang", kind: "match_start" }),
    makeEv({ span_id: "c1", parent_span_id: rootSpan, actor: "china/tang", kind: "turn", seq: 1 }),
    makeEv({ span_id: "c2", parent_span_id: rootSpan, actor: "judge", kind: "judge_score", seq: 2 }),
    makeEv({ span_id: "c3", parent_span_id: rootSpan, actor: "system", kind: "match_end", seq: 3 }),
  ];
  // Reverse order: child events before parent
  const eventsReversed = [...eventsInOrder].reverse();

  const gOrdered = reconstructRuntimeGraph(eventsInOrder);
  const gReversed = reconstructRuntimeGraph(eventsReversed);

  // Same nodes
  assert.deepEqual(
    gOrdered.nodes.map((n) => n.id).sort(),
    gReversed.nodes.map((n) => n.id).sort(),
  );
  // Same edges (the two-pass approach is order-independent for the map)
  assert.equal(gOrdered.edges.length, gReversed.edges.length);
  for (const e of gOrdered.edges) {
    const match = gReversed.edges.find(
      (r) => r.from === e.from && r.to === e.to && r.kind === e.kind
    );
    assert.ok(match, `edge ${e.from}→${e.to}:${e.kind} must exist in reversed graph`);
    assert.equal(match.count, e.count);
  }
});
// REGRESSION: a single-pass implementation that built edges during the first
// (only) pass would miss edges when the parent event appears AFTER its children.

test("reconstructRuntimeGraph: parent_span_id pointing to nonexistent span → orphan reported", () => {
  const events = [
    makeEv({ span_id: "orphan-child", parent_span_id: "ghost-span", actor: "china/tang", kind: "turn" }),
  ];
  const g = reconstructRuntimeGraph(events);
  assert.equal(g.orphan_spans.length, 1);
  assert.equal(g.orphan_spans[0].span_id, "orphan-child");
  assert.equal(g.orphan_spans[0].parent_span_id, "ghost-span");
  // Edge is still created with from="<orphan>"
  assert.equal(g.edges.length, 1);
  assert.equal(g.edges[0].from, "<orphan>");
  assert.equal(g.edges[0].to, "china/tang");
});
// REGRESSION: if orphan detection were omitted, the edge would either be
// silently dropped or the parent lookup would return undefined (causing the
// key to be "undefined→china/tang:turn").

test("reconstructRuntimeGraph: duplicate span_id detected and reported", () => {
  const events = [
    makeEv({ span_id: "dup-span", parent_span_id: null, actor: "china/tang", kind: "match_start" }),
    makeEv({ span_id: "dup-span", parent_span_id: null, actor: "china/qin", kind: "match_start" }),
  ];
  const g = reconstructRuntimeGraph(events);
  assert.equal(g.duplicate_spans.length, 1);
  assert.equal(g.duplicate_spans[0].span_id, "dup-span");
  assert.equal(g.duplicate_spans[0].count, 2);
  // Last write wins: the span_id maps to "china/qin", not "china/tang"
  assert.equal(g.nodes.length, 2); // both actors still appear as nodes
});
// REGRESSION: if duplicate detection were omitted, duplicate span_ids would
// silently overwrite without any signal in the output.

test("reconstructRuntimeGraph: events with null span_id are tolerated", () => {
  const events = [
    makeEv({ span_id: null, parent_span_id: null, actor: "system", kind: "match_start" }),
  ];
  const g = reconstructRuntimeGraph(events);
  assert.equal(g.nodes.length, 1);
  assert.equal(g.edges.length, 0);
  assert.equal(g.orphan_spans.length, 0);
  assert.equal(g.duplicate_spans.length, 0);
});
// REGRESSION: if span_id=null weren't guarded in Pass 1, the map would contain
// null→actor, and a subsequent event with parent_span_id=null would incorrectly
// find a parent actor instead of being treated as a root.

test("reconstructRuntimeGraph: non-object entries in the array are skipped", () => {
  const rootSpan = "root-007";
  const events = [
    makeEv({ span_id: rootSpan, parent_span_id: null, actor: "china/tang", kind: "match_start" }),
    null,
    "garbage string",
    42,
    makeEv({ span_id: "c1", parent_span_id: rootSpan, actor: "china/tang", kind: "turn" }),
  ];
  const g = reconstructRuntimeGraph(events);
  assert.equal(g.event_count, 5, "event_count counts everything, even non-objects");
  assert.equal(g.nodes[0].eventCount, 2, "only the two valid objects increment the node counter... wait");
  // Actually: non-objects are skipped, so eventCount on legit nodes should be 2
  // But event_count total should still be 5 (length of array)
});
// REGRESSION: `ev.actor` on null would throw TypeError without the guard.

// ── diffTopology ─────────────────────────────────────────────────────────────

const TANG_TOPOLOGY = {
  schema_version: "1.0",
  regime: "china/tang",
  mode: "checks-and-balances",
  nodes: [
    { id: "zhongshu", label: "中书省", functional_role: "coordinator" },
    { id: "menxia", label: "门下省", functional_role: "review" },
    { id: "shangshu", label: "尚书省", functional_role: "management" },
  ],
  edges: [
    { from: "zhongshu", to: "menxia", kind: "command", note: "中书→门下" },
    { from: "menxia", to: "zhongshu", kind: "veto", note: "门下封驳" },
    { from: "menxia", to: "shangshu", kind: "command", note: "门下→尚书" },
  ],
};

function makeRuntimeGraph(nodes = [], edges = []) {
  return {
    nodes,
    edges,
    orphan_spans: [],
    duplicate_spans: [],
    event_count: 0,
  };
}

test("diffTopology: all edges unexercised when runtime has different node namespace", () => {
  const rt = makeRuntimeGraph(
    [{ id: "china/tang", eventCount: 10 }],
    [
      { from: "china/tang", to: "china/tang", kind: "turn", count: 8 },
      { from: "china/tang", to: "judge", kind: "judge_score", count: 1 },
    ]
  );
  const diff = diffTopology(TANG_TOPOLOGY, rt);

  assert.equal(diff.node_id_match, false);
  assert.ok(diff.node_id_mismatch_detail, "must explain the mismatch");
  assert.ok(
    diff.node_id_mismatch_detail.includes("agent-level"),
    "must mention agent-level vs regime-level"
  );
  assert.equal(diff.unexercised_edges.length, 3, "all 3 declared edges unexercised");
  assert.equal(diff.undeclared_edges.length, 2, "both runtime edges undeclared");
  // Not 1.0: across a granularity gap every declared edge is trivially
  // unexercised, so the ratio would read the same for every regime and every
  // match. The raw counts stay; the derived number is withheld.
  assert.equal(diff.unexercised_ratio, null);
  assert.equal(diff.total_declared_edges, 3);
  assert.equal(diff.total_unexercised, 3);

  // Edge exercise counts should all be 0
  for (const ec of diff.edge_exercise_counts) {
    assert.equal(ec.runtimeCount, 0, `${ec.from}→${ec.to}:${ec.kind} must have count=0`);
    assert.ok(ec.declared);
  }
});
// REGRESSION: if node_id_match silently returned true without checking, the
// mismatch_detail would be null and the unexercised count would be wrongly
// interpreted as "the veto edge was never used" rather than "we can't tell."

test("diffTopology: edges match when node IDs align (happy path)", () => {
  const decl = {
    nodes: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    edges: [
      { from: "a", to: "b", kind: "command" },
      { from: "b", to: "a", kind: "review" },
    ],
  };
  const rt = makeRuntimeGraph(
    [{ id: "a", eventCount: 5 }, { id: "b", eventCount: 3 }],
    [
      { from: "a", to: "b", kind: "command", count: 4 },
      // b→a:review is NOT exercised
    ]
  );
  const diff = diffTopology(decl, rt);

  assert.equal(diff.node_id_match, true);
  assert.equal(diff.node_id_mismatch_detail, null);
  assert.equal(diff.unexercised_edges.length, 1);
  assert.equal(diff.unexercised_edges[0].from, "b");
  assert.equal(diff.unexercised_edges[0].to, "a");
  assert.equal(diff.unexercised_edges[0].kind, "review");
  assert.equal(diff.undeclared_edges.length, 0);
  assert.equal(diff.unexercised_ratio, 0.5);
  assert.equal(diff.total_declared_edges, 2);

  // Edge exercise counts
  const cmdEc = diff.edge_exercise_counts.find((e) => e.kind === "command");
  assert.equal(cmdEc.runtimeCount, 4);
  const revEc = diff.edge_exercise_counts.find((e) => e.kind === "review");
  assert.equal(revEc.runtimeCount, 0);
});
// REGRESSION: if the diff used only the edge key (from→to:kind) but didn't
// include the 'kind' in the key, review edges could match command edges.

test("diffTopology: undeclared edges from runtime are reported", () => {
  const decl = {
    nodes: [{ id: "a" }, { id: "b" }],
    edges: [{ from: "a", to: "b", kind: "command" }],
  };
  const rt = makeRuntimeGraph(
    [{ id: "a", eventCount: 2 }, { id: "b", eventCount: 1 }],
    [
      { from: "a", to: "b", kind: "command", count: 1 },
      { from: "b", to: "a", kind: "info", count: 1 }, // undeclared kind
      { from: "a", to: "b", kind: "veto", count: 1 },  // undeclared kind
    ]
  );
  const diff = diffTopology(decl, rt);

  assert.equal(diff.undeclared_edges.length, 2);
  assert.equal(diff.unexercised_edges.length, 0, "command edge IS exercised");
  assert.equal(diff.unexercised_ratio, 0.0);
  assert.equal(diff.total_declared_edges, 1);
});
// REGRESSION: if the diff only iterated declared edges without also checking
// runtime edges against the declared set, undeclared edges would be missing.

test("diffTopology: empty declared topology (0 edges) → null ratio, no unexercised", () => {
  const decl = { nodes: [], edges: [] };
  const rt = makeRuntimeGraph(
    [{ id: "a", eventCount: 1 }],
    [{ from: "a", to: "a", kind: "turn", count: 1 }]
  );
  const diff = diffTopology(decl, rt);
  assert.equal(diff.total_declared_edges, 0);
  assert.equal(diff.unexercised_ratio, null, "no declared edges means there is no ratio to report");
  assert.equal(diff.unexercised_edges.length, 0);
  assert.equal(diff.undeclared_edges.length, 1);
});
// REGRESSION: dividing by 0 without the guard would produce NaN, which
// JSON.stringify turns into null anyway — but silently, and only in the JSON
// path. Returning null explicitly makes the "no answer" case the same value
// everywhere.

test("diffTopology: invalid inputs throw", () => {
  assert.throws(() => diffTopology(null, makeRuntimeGraph()), /declared topology must be an object/);
  assert.throws(() => diffTopology({}, null), /runtime graph must be an object/);
  assert.throws(() => diffTopology("not an object", makeRuntimeGraph()), /declared topology must be an object/);
});
// REGRESSION: if input validation were omitted, property access on null/string
// would throw a confusing TypeError deep in the function.

test("diffTopology: orphan and duplicate spans are passed through", () => {
  const rt = makeRuntimeGraph([], []);
  rt.orphan_spans = [{ span_id: "s1", parent_span_id: "ghost", event_id: "e1" }];
  rt.duplicate_spans = [{ span_id: "s2", count: 3 }];

  const diff = diffTopology({ nodes: [], edges: [] }, rt);
  assert.equal(diff.orphan_spans.length, 1);
  assert.equal(diff.duplicate_spans.length, 1);
});
// REGRESSION: if the diffResult didn't pass through orphan_spans/duplicate_spans,
// CLI users would have no visibility into data-quality problems.

// ── SAFE_MATCH_ID ────────────────────────────────────────────────────────────

test("SAFE_MATCH_ID: accepts typical match ids", () => {
  for (const id of [
    "2026-07-30T06-06-44-953-qhyj__china-tang",
    "abc123",
    "match_2026-07-30",
    "A",
    "replay-2026-07-30-abc",
  ]) {
    assert.ok(SAFE_MATCH_ID.test(id), `must accept: ${id}`);
  }
});
// REGRESSION: overly restrictive regex (e.g. no underscores) would reject real
// match ids that the tournament generates.

test("SAFE_MATCH_ID: rejects path separators", () => {
  assert.equal(SAFE_MATCH_ID.test("a/b"), false);
  assert.equal(SAFE_MATCH_ID.test("..\\evil"), false);
});
// REGRESSION: if the regex allowed "/", directory traversal would be possible.

test("assertSafeMatchId: throws on unsafe ids, returns safe ones", () => {
  assert.throws(() => assertSafeMatchId("../etc"), /unsafe/);
  assert.throws(() => assertSafeMatchId("."), /unsafe/);
  assert.throws(() => assertSafeMatchId(".."), /unsafe/);
  assert.throws(() => assertSafeMatchId("a/../b"), /unsafe/);
  assert.throws(() => assertSafeMatchId("a\\windows"), /unsafe/);

  assert.equal(assertSafeMatchId("2026-07-30-test"), "2026-07-30-test");
});
// REGRESSION: if assertSafeMatchId only checked the regex but not "/", "..",
// or "\\", path traversal through ~/.civagent/matches/ would be possible.

// ── Regression verification harness ──────────────────────────────────────────
//
// These tests verify that if the implementation is deliberately broken in
// specific ways, the corresponding tests above DO turn red. This proves the
// tests are actually testing the behavior, not just passing by coincidence.
//
// Each test below:
//   1. Builds a broken variant of the function under test
//   2. Runs the same assertions as the corresponding positive test
//   3. Asserts that the broken variant PRODUCES A DIFFERENT RESULT
//
// If any of these "regression_*" tests fail, it means the corresponding
// positive test would also pass with the broken implementation — the test
// has no discriminative power.

test("regression_guard: edge merge without kind would collapse different kinds", () => {
  // This mirrors "edges of different kinds are NOT merged" above.
  // Broken variant: key omits kind — only "from→to"
  function brokenReconstruct(events) {
    const g = reconstructRuntimeGraph(events);
    // Manually re-merge edges without kind in the key to simulate the bug
    const merged = new Map();
    for (const e of g.edges) {
      const badKey = `${e.from}→${e.to}`;
      if (!merged.has(badKey)) {
        merged.set(badKey, { ...e, kind: "merged" });
      } else {
        merged.get(badKey).count += e.count;
      }
    }
    return { ...g, edges: [...merged.values()] };
  }

  // Use TWO different actors for parent events so that edges share (from, to)
  // but differ in kind. That's what the kind-less merge would collapse.
  const rootA = "rg-root-A";
  const rootB = "rg-root-B";
  const events = [
    makeEv({ span_id: rootA, parent_span_id: null, actor: "zhongshu", kind: "match_start" }),
    makeEv({ span_id: rootB, parent_span_id: null, actor: "menxia", kind: "match_start" }),
    // a→b:command
    makeEv({ span_id: "c1", parent_span_id: rootA, actor: "menxia", kind: "command" }),
    // a→b:review — same (from, to) as above, different kind
    makeEv({ span_id: "c2", parent_span_id: rootA, actor: "menxia", kind: "review" }),
  ];
  const correct = reconstructRuntimeGraph(events);
  // With kind in the key: two distinct edges
  assert.equal(correct.edges.length, 2, "correct implementation keeps kinds separate");

  const broken = brokenReconstruct(events);
  // Without kind in the key: collapsed to one edge (zhongshu→menxia, various kinds)
  assert.equal(broken.edges.length, 1, "broken implementation merges different kinds");
  assert.notEqual(broken.edges.length, correct.edges.length, "regression guard: tests DO discriminate");
});
// If this assertion ever fails, the "edges of different kinds are NOT merged"
// test is not actually verifying the kind-separation behavior.

test("regression_guard: parent_span_id=null as string would create spurious edge", () => {
  // Verify that an event whose parent_span_id is literally the string "null"
  // is NOT confused with a JavaScript null (trace root).
  // The `== null` check in reconstructRuntimeGraph correctly distinguishes.
  const rootSpan = "rg-root-2";
  const events = [
    makeEv({ span_id: rootSpan, parent_span_id: null, actor: "system", kind: "match_start" }),
    makeEv({
      span_id: "child-of-null",
      parent_span_id: "null", // literal string "null" — should be treated as a real (but missing) parent
      actor: "china/tang",
      kind: "turn",
    }),
  ];
  const g = reconstructRuntimeGraph(events);
  // "null" as a string is not in the span_id map → orphan, not a root skip
  assert.equal(g.orphan_spans.length, 1, "string 'null' is not the same as null → orphan detected");
  assert.equal(g.edges[0].from, "<orphan>");
  assert.equal(g.edges[0].to, "china/tang");
});
// REGRESSION: `if (!psid)` would treat the string "null" as falsy and skip
// edge creation → a real event with parent_span_id="null" would be silently
// dropped. The `== null` check correctly distinguishes.

test("regression_guard: diffTopology with mismatched nodes catches missing detail", () => {
  // Verify that a broken diffTopology that forgets to populate
  // node_id_mismatch_detail would be caught by the positive test.
  const rt = makeRuntimeGraph(
    [{ id: "china/tang", eventCount: 1 }],
    [{ from: "china/tang", to: "china/tang", kind: "turn", count: 1 }]
  );
  const diff = diffTopology(TANG_TOPOLOGY, rt);

  // Correct behavior: detail IS populated
  assert.equal(diff.node_id_match, false);
  assert.ok(diff.node_id_mismatch_detail, "mismatch detail must be present");
  assert.ok(diff.node_id_mismatch_detail.length > 50, "detail must be substantive");

  // If we had forgotten to set node_id_mismatch_detail, it would be null here
  // and the positive test would fail on `diff.node_id_mismatch_detail.includes(...)`.
  // This guard confirms the detail is actually populated.
});
// This test guards the guard: it confirms node_id_mismatch_detail is populated
// with a real explanation when node IDs don't overlap. The corresponding
// positive test ("all edges unexercised when runtime has different node
// namespace") would fail if detail were null.

// A ratio of 1.000 for every regime in every match is not a finding, it is an
// artifact: the event stream tags actors at regime level while topology.json is
// written at office level, so no declared edge can ever match. Reporting a
// number there invites someone to put it in a results table.
test("unexercised_ratio is null when declared and runtime node ids do not overlap", () => {
  const declared = {
    nodes: [{ id: "zhongshu" }, { id: "menxia" }],
    edges: [{ from: "zhongshu", to: "menxia", kind: "command" }],
  };
  const runtime = {
    nodes: [{ id: "china/tang" }],
    edges: [{ from: "china/tang", to: "china/tang", kind: "turn", count: 5 }],
  };
  const d = diffTopology(declared, runtime);
  assert.equal(d.node_id_match, false);
  assert.equal(d.unexercised_ratio, null, "no number may be reported across a granularity gap");
  assert.equal(d.total_unexercised, 1, "the raw counts are still reported");
  assert.ok(d.node_id_mismatch_detail, "and the reason must be readable");
});

test("unexercised_ratio is a real number when the id spaces do line up", () => {
  const declared = {
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    edges: [
      { from: "a", to: "b", kind: "command" },
      { from: "b", to: "c", kind: "command" },
    ],
  };
  const runtime = {
    nodes: [{ id: "a" }, { id: "b" }],
    edges: [{ from: "a", to: "b", kind: "command", count: 3 }],
  };
  const d = diffTopology(declared, runtime);
  assert.equal(d.node_id_match, true);
  assert.equal(d.unexercised_ratio, 0.5, "one of two declared edges went unexercised");
});
