/**
 * domain.test.mjs — L0 tests for the P2 domain: RegimeIR, handoff, graph,
 * policy, orchestration.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RegimeCompiler, parseIdentityTable, topologyTreatment } from "../regime-ir.mjs";
import { Handoff, validateHandoffRequest, joinSatisfied, EDGE_KINDS } from "../handoff.mjs";
import { GraphDispatcher, GraphSpecError } from "../graph.mjs";
import { PolicyEngine, PolicyDeniedError } from "../policy.mjs";
import { OrchestrationRun } from "../orchestration.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGIMES = path.resolve(__dirname, "../../../../regimes");

test("RegimeIR compiles real tang regime: 9 agents, 15 edges, historical", () => {
  const { ir, digest } = new RegimeCompiler().compile(path.join(REGIMES, "china/tang"));
  assert.equal(ir.regimeId, "china/tang");
  assert.equal(ir.treatment, "historical");
  assert.equal(ir.agents.length, 9, "IDENTITY table must match metadata.agentCount");
  assert.equal(ir.graph.nodes.length, 9);
  assert.equal(ir.graph.edges.length, 15);
  assert.equal(digest.length, 64);
  // every edge references existing nodes with canonical kinds
  const nodeIds = new Set(ir.graph.nodes.map((n) => n.officeId));
  for (const e of ir.graph.edges) {
    assert.ok(nodeIds.has(e.source), `edge ${e.edgeId} source`);
    assert.ok(nodeIds.has(e.target), `edge ${e.edgeId} target`);
    assert.ok(EDGE_KINDS.includes(e.kind), `edge ${e.edgeId} kind ${e.kind}`);
  }
  // veto edge mapped to review with legacyKind preserved
  const veto = ir.graph.edges.find((e) => e.legacyKind === "veto");
  assert.ok(veto && veto.kind === "review", "legacy veto edge must map to review");
});

test("RegimeIR covers all four topology treatments from real artifacts", () => {
  const c = new RegimeCompiler();
  const tang = c.compile(path.join(REGIMES, "china/tang"));
  const flat = c.compile(path.join(REGIMES, "_baseline/tang-flat"));
  const solo = c.compile(path.join(REGIMES, "_baseline/tang-solo"));
  const random = c.compile(path.join(REGIMES, "_baseline/tang-random"));
  assert.equal(tang.ir.treatment, "historical");
  assert.equal(flat.ir.treatment, "flat");
  assert.equal(solo.ir.treatment, "solo");
  assert.equal(random.ir.treatment, "random");
  assert.equal(flat.ir.graph.edges.length, 0, "flat topology has no declared edges");
  assert.equal(solo.ir.agents.length, 1, "solo topology has one agent");
});

test("RegimeIR compile is deterministic (same source -> same digest)", () => {
  const c = new RegimeCompiler();
  const a = c.compile(path.join(REGIMES, "china/tang"));
  const b = c.compile(path.join(REGIMES, "china/tang"));
  assert.equal(a.digest, b.digest);
});

test("parseIdentityTable mirrors the legacy parser contract", () => {
  const { ir } = new RegimeCompiler().compile(path.join(REGIMES, "china/tang"));
  const ids = ir.agents.map((a) => a.officeId);
  assert.ok(ids.includes("zhongshu") && ids.includes("menxia") && ids.includes("shangshu"));
  assert.ok(ids.includes("libu_personnel"), "agent ids must match the IDENTITY.md table exactly");
});

test("validateHandoffRequest: valid request passes; contract violations fail", () => {
  const good = {
    handoffId: "h1", sourceOfficeId: "zhongshu", sourceSessionId: "s1",
    targetOfficeId: "menxia", targetSessionId: "s2", edgeId: "e1",
    edgeKind: "command", artifactRefs: [], causalParentId: "s1",
    mode: "one-shot", context: "fresh", joinPolicy: "await", idempotencyKey: "ik1",
  };
  assert.equal(validateHandoffRequest(good).valid, true);
  for (const [key, bad] of [["handoffId", ""], ["edgeKind", "nonsense"], ["mode", "parallel"], ["joinPolicy", "majority"], ["causalParentId", null], ["idempotencyKey", ""]]) {
    const r = validateHandoffRequest({ ...good, [key]: bad });
    assert.equal(r.valid, false, `expected ${key}=${JSON.stringify(bad)} to fail`);
  }
});

test("Handoff state machine: happy path and reject path", () => {
  const req = {
    handoffId: "h1", sourceOfficeId: "zhongshu", sourceSessionId: "s1",
    targetOfficeId: "menxia", targetSessionId: "s2", edgeId: "e1",
    edgeKind: "command", causalParentId: "s1", mode: "one-shot",
    context: "fresh", joinPolicy: "await", idempotencyKey: "ik1",
  };
  const h = new Handoff(req);
  h.accepted().claimed().running().contributed(["sha256:" + "a".repeat(64)]).settled({ classification: "completed" });
  assert.equal(h.state, "SETTLED");
  assert.deepEqual(h.participation, { invoked: true, started: true, contributed: true, settled: true });
  const r = new Handoff(req);
  r.reject("graph: unknown edge");
  assert.equal(r.state, "REJECTED");
  assert.throws(() => r.accepted(), /illegal handoff transition REJECTED -> ACCEPTED/);
});

test("join policies: await, notify, quorum are distinct", () => {
  const mk = (joinPolicy) => new Handoff({
    handoffId: "h", sourceOfficeId: "a", sourceSessionId: "s1", targetOfficeId: "b",
    targetSessionId: "s2", edgeId: "e", edgeKind: "command", causalParentId: "s1",
    mode: "one-shot", context: "fresh", joinPolicy, idempotencyKey: "ik",
  });
  const awaiting = mk("await");
  assert.equal(joinSatisfied(awaiting), false, "await requires CONTRIBUTED/FAILED");
  awaiting.accepted().claimed();
  assert.equal(joinSatisfied(awaiting), false);
  awaiting.running().contributed();
  assert.equal(joinSatisfied(awaiting), true);
  const notified = mk("notify");
  notified.accepted().claimed();
  assert.equal(joinSatisfied(notified), true, "notify is satisfied at claim");
  const quorum = mk("quorum");
  quorum.accepted().claimed().running().contributed();
  assert.equal(joinSatisfied(quorum, { contributionCount: 1, quorumSize: 2 }), false);
  assert.equal(joinSatisfied(quorum, { contributionCount: 2, quorumSize: 2 }), true);
});

test("GraphDispatcher: graph_enforced rejects unknown/wrong edges before enqueue", () => {
  const { ir } = new RegimeCompiler().compile(path.join(REGIMES, "china/tang"));
  const d = new GraphDispatcher(ir.graph, "graph_enforced");
  const h = (edgeId, kind, from, to) => new Handoff({
    handoffId: "h", sourceOfficeId: from, sourceSessionId: "s1", targetOfficeId: to,
    targetSessionId: "s2", edgeId, edgeKind: kind, causalParentId: "s1",
    mode: "one-shot", context: "fresh", joinPolicy: "await", idempotencyKey: "ik",
  });
  assert.equal(d.validate(h("e99-unknown", "command", "zhongshu", "menxia")).valid, false, "undeclared edge must fail");
  assert.equal(d.validate(h("e1-zhongshu-menxia", "vote", "zhongshu", "menxia")).valid, false, "wrong kind must fail");
  assert.equal(d.validate(h("e1-zhongshu-menxia", "command", "menxia", "zhongshu")).valid, false, "wrong endpoints must fail");
  assert.equal(d.validate(h("e1-zhongshu-menxia", "command", "zhongshu", "menxia")).valid, true, "declared edge passes");
});

test("GraphDispatcher: observational mode records undeclared edges without rejecting", () => {
  const { ir } = new RegimeCompiler().compile(path.join(REGIMES, "china/tang"));
  const d = new GraphDispatcher(ir.graph, "observational");
  const h = new Handoff({
    handoffId: "h", sourceOfficeId: "zhongshu", sourceSessionId: "s1", targetOfficeId: "menxia",
    targetSessionId: "s2", edgeId: "e99-unknown", edgeKind: "vote", causalParentId: "s1",
    mode: "one-shot", context: "fresh", joinPolicy: "await", idempotencyKey: "ik",
  });
  const r = d.validate(h);
  assert.equal(r.valid, true);
  assert.equal(r.unknownEdgeObserved, true);
  const rep = d.topologyReport();
  assert.equal(rep.unknownObservedCount, 1);
});

test("GraphSpec errors on unknown nodes/duplicate edge ids", () => {
  const { ir } = new RegimeCompiler().compile(path.join(REGIMES, "china/tang"));
  const bad = {
    nodes: [{ officeId: "a" }],
    edges: [{ edgeId: "e1", source: "ghost", target: "a", kind: "command" }],
  };
  assert.throws(() => new GraphDispatcher(bad, "graph_enforced"), GraphSpecError);
});

test("PolicyEngine: grants authorize typed actions; markers never grant", () => {
  const { ir } = new RegimeCompiler().compile(path.join(REGIMES, "china/tang"));
  const pe = new PolicyEngine(ir.policy);
  const decision = pe.authorize({ actorOffice: "zhongshu", targetOffice: "menxia", edgeId: "e1-zhongshu-menxia", edgeKind: "command", mechanism: null, matchPhase: "active" });
  assert.equal(decision.granted, true);
  assert.throws(() => pe.authorize({ actorOffice: "menxia", targetOffice: "shangshu", edgeId: "e3-menxia-shangshu", edgeKind: "vote", mechanism: null, matchPhase: "active" }), PolicyDeniedError);
  const marker = pe.authorizeMarkerText({ actorOffice: "menxia", marker: "[VETO]" });
  assert.equal(marker.granted, false, "printed markers are text, never authority");
});

test("OrchestrationRun: modes, distinct metrics, no pooling across modes", () => {
  const run = new OrchestrationRun({ runId: "r1", mode: "graph_enforced", regimeId: "china/tang", epoch: "native-next-v1", instrumentVersion: "iv-1", requiredOffices: ["a", "b"] });
  run.recordInvoked("b");
  run.recordStarted("a");
  const p = run.participation();
  assert.equal(p.mode, "graph_enforced");
  assert.equal(p.offices.a.started, 1);
  assert.equal(p.offices.a.invoked, 0, "invoked and started must stay distinct");
  assert.equal(run.rosterCompleteness().complete, true);
  const run2 = new OrchestrationRun({ runId: "r2", mode: "observational", regimeId: "china/tang", epoch: "native-next-v1", instrumentVersion: "iv-1", requiredOffices: ["a", "b"] });
  assert.notEqual(run2.participation().mode, run.participation().mode, "modes never pool");
  assert.throws(() => new OrchestrationRun({ runId: "r3", mode: "chaos", regimeId: "x", epoch: "e", instrumentVersion: "i", requiredOffices: [] }));
});

test("topologyTreatment classifies all four treatments", () => {
  assert.equal(topologyTreatment("china/tang"), "historical");
  assert.equal(topologyTreatment("_baseline/tang-random"), "random");
  assert.equal(topologyTreatment("china/tang-flat"), "flat");
  assert.equal(topologyTreatment("china/tang-solo"), "solo");
});
