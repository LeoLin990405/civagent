/**
 * p2-slice.mjs — P2 runtime: end-to-end typed multi-agent orchestration.
 *
 * Compiles a real regime into immutable RegimeIR, then executes its declared
 * graph in each orchestration mode (observational / roster_enforced /
 * graph_enforced) with scripted per-office providers. Produces:
 *   - mode-tagged participation ledgers (never pooled across modes)
 *   - roster completeness and declared-vs-exercised topology reports
 *   - invalid handoff / marker-text rejection evidence (fail before enqueue)
 *
 * Flow: root entry office executes a turn, then declared command/review edges
 * hand off to target offices (claim -> turn -> contribute -> settle with the
 * durable compound inbox records); declared information edges notify without
 * executing a target turn.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Cas } from "../evidence/cas.mjs";
import { EventStore } from "../evidence/eventstore.mjs";
import { RegimeCompiler } from "../domain/regime-ir.mjs";
import { GraphDispatcher } from "../domain/graph.mjs";
import { PolicyEngine, PolicyDeniedError } from "../domain/policy.mjs";
import { Handoff, validateHandoffRequest } from "../domain/handoff.mjs";
import { OrchestrationRun } from "../domain/orchestration.mjs";
import { DurableInbox } from "./inbox.mjs";
import { AgentSession, Turn, newId, transition, TURN_TRANSITIONS } from "./session.mjs";
import { Operation } from "./operation.mjs";
import { FakeProvider } from "../providers/fake-provider.mjs";
import { ModelGateway } from "../providers/gateway.mjs";
import { BehaviorScript } from "../providers/behavior-script.mjs";
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const P2_REPORT_DIR = path.join(__dirname, "reports");
export const P2_INSTRUMENT = "native-next-v1-p2slice";

export function officeScript(officeId, text = `臣（${officeId}）谨奏。`) {
  return new BehaviorScript([
    { expect: { purpose: `office-${officeId}` }, behave: { kind: "chunks", data: { chunks: [text], usage: { inputTokens: 3, outputTokens: 2 } } } },
  ]);
}

/**
 * Execute the declared graph of one RegimeIR in one mode.
 * @param {object} opts {ir, mode, dir, emitExtra?}
 */
export function executeRegimeFlow(opts) {
  const { ir, mode } = opts;
  const dir = opts.dir ?? fs.mkdtempSync(path.join(os.tmpdir(), "civ-p2-"));
  const cas = new Cas(path.join(dir, "evidence"));
  const store = new EventStore(path.join(dir, "segments"), {
    generation: 1, segmentId: `p2-${mode}`, writer: "p2-slice", instrumentVersion: P2_INSTRUMENT,
  });
  const matchId = `p2-${mode}-${ir.regimeId.replace("/", "-")}`;
  const dispatcher = new GraphDispatcher(ir.graph, mode);
  const policy = new PolicyEngine(ir.policy);
  const inbox = new DurableInbox({ eventStore: store, instrumentVersion: P2_INSTRUMENT });
  const run = new OrchestrationRun({
    runId: matchId, mode, regimeId: ir.regimeId,
    epoch: "native-next-v1", instrumentVersion: P2_INSTRUMENT,
    requiredOffices: ir.agents.map((a) => a.officeId),
  });

  const sessions = new Map();
  const sessionOf = (officeId) => {
    if (!sessions.has(officeId)) {
      sessions.set(officeId, new AgentSession({ sessionId: `sess-${officeId}`, matchId }).markReady());
    }
    return sessions.get(officeId);
  };

  const emit = (session, type, payload, artifactRefs = []) => {
    const event = {
      schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: P2_INSTRUMENT,
      generation: store.generation, eventId: `${type}:${newId("e")}`, ts: Date.now(),
      matchId, sessionId: session?.sessionId ?? null, type,
      actor: "p2-slice", spanId: null, parentSpanId: null, artifactRefs, payload,
    };
    event.payloadDigest = sha256Hex(Buffer.from(canonicalJson(payload)));
    store.append(event);
    return event;
  };

  /** One office turn through the ModelGateway with a scripted provider. */
  function executeTurn(officeId) {
    const session = sessionOf(officeId);
    const activationId = newId("act");
    session.startActivation(activationId);
    const turn = new Turn({ turnId: newId("turn"), sessionId: session.sessionId, activationId });
    session.enqueue(turn);
    session.claimTurn();
    turn.state = transition("turn", turn.state, "RUNNING", TURN_TRANSITIONS);
    emit(session, "turn.claimed", { officeId, turnId: turn.turnId });
    const op = new Operation({ operationId: newId("op"), matchId, sessionId: session.sessionId, turnId: turn.turnId, purpose: `office-${officeId}` });
    const gateway = new ModelGateway({ cas, eventStore: store, provider: new FakeProvider(officeScript(officeId)), instrumentVersion: P2_INSTRUMENT });
    const outcome = gateway.request({
      operation: op, model: "fake-model",
      systemPrompt: `你是${officeId}。`, messages: [{ role: "user", content: `执行任务（${officeId}）` }], tools: [],
    });
    emit(session, "surface.revision", { officeId, revision: 1, surfaceHash: sha256Hex(Buffer.from(outcome.text)) });
    session.commitSurfaceRevision(1);
    session.completeClaimedTurn("COMPLETED");
    run.recordStarted(officeId);
    run.recordContributed(officeId);
    return { outcome, op, session, turn };
  }

  /**
   * Typed handoff: schema -> dispatcher (mode-dependent) -> policy -> durable
   * compound records -> target claim/turn/contribution -> settlement.
   * Returns {accepted, handoff, rejectReason?}.
   */
  function handoff({ from, to, edge, kind, executeTargetTurn = true, extra = {} }) {
    const source = sessionOf(from);
    const target = sessionOf(to);
    const req = {
      handoffId: newId("h"),
      sourceOfficeId: from,
      sourceSessionId: source.sessionId,
      targetOfficeId: to,
      targetSessionId: target.sessionId,
      edgeId: edge?.edgeId ?? extra.edgeId,
      edgeKind: kind,
      artifactRefs: [],
      causalParentId: source.sessionId,
      mode: "one-shot",
      context: "fresh",
      joinPolicy: kind === "information" ? "notify" : "await",
      idempotencyKey: newId("ik"),
      ...extra,
    };
    // 1. schema validation
    const schemaCheck = validateHandoffRequest(req);
    if (!schemaCheck.valid) return { accepted: false, rejectReason: `schema: ${schemaCheck.reasons.join("; ")}` };
    const h = new Handoff(req);
    // 2. graph validation (mode-dependent)
    const graphCheck = dispatcher.validate(h);
    if (!graphCheck.valid) {
      h.reject(`graph: ${graphCheck.reasons.join("; ")}`);
      return { accepted: false, rejectReason: h.rejectReason, handoff: h };
    }
    // 3. policy authorization (typed action; markers never authorize).
    // observational mode records the decision without enforcing it (observe
    // only, no topology compliance claim, plan §8.3).
    let decision;
    try {
      decision = policy.authorize({
        actorOffice: from, targetOffice: to, edgeId: req.edgeId, edgeKind: kind,
        mechanism: null, matchPhase: "active",
      });
    } catch (e) {
      if (e instanceof PolicyDeniedError) {
        if (mode === "observational") {
          decision = { granted: false, policyDigest: policy.digest, reason: e.message, recordedOnly: true };
        } else {
          h.reject(`policy: ${e.message}`);
          return { accepted: false, rejectReason: h.rejectReason, handoff: h };
        }
      } else {
        throw e;
      }
    }
    // 4. durable accept (single compound record) -> invoked
    h.accepted();
    run.recordInvoked(to);
    inbox.acceptHandoff({
      handoffId: h.handoffId, matchId, targetSessionId: target.sessionId,
      sourceOfficeId: from, targetOfficeId: to, edgeId: req.edgeId, edgeKind: kind,
      artifactRefs: [], idempotencyKey: h.idempotencyKey,
    });
    // 5. claim -> started
    inbox.claim({ matchId, targetSessionId: target.sessionId });
    h.claimed();
    run.recordStarted(to);
    // 6. target turn (information/notify edges settle at claim without a turn)
    const terminal = { classification: "completed", outcomeRefs: [] };
    if (executeTargetTurn) {
      h.running();
      const { outcome } = executeTurn(to);
      const contributionRefs = outcome.chunkDigests ?? [];
      h.contributed(contributionRefs);
      run.recordContributed(to);
      terminal.classification = outcome.status === "ok" ? "completed" : "failed";
      terminal.outcomeRefs = contributionRefs;
      terminal.status = outcome.status;
    }
    // 7. settlement: one compound record with child terminal + parent notice
    inbox.settleHandoff({
      handoffId: h.handoffId, matchId, targetSessionId: target.sessionId, parentSessionId: source.sessionId,
      childTerminal: terminal,
      outputRefs: terminal.outcomeRefs,
      ownershipRelease: { released: true },
      idempotencyKey: `${h.idempotencyKey}:settle`,
    });
    h.settled({
      classification: terminal.classification, outputRefs: terminal.outcomeRefs,
      ownershipRelease: { released: true },
      parentNotice: { handoffId: h.handoffId, targetSessionId: target.sessionId, parentSessionId: source.sessionId },
    });
    run.recordSettled(to);
    return { accepted: true, handoff: h, policyDigest: decision.policyDigest };
  }

  // ── walk the declared graph from the entry office ────────────────────────
  const entry = ir.graph.nodes.find((n) => !ir.graph.edges.some((e) => e.target === n.officeId))?.officeId
    ?? ir.agents[0].officeId;
  const visited = new Set();
  const walk = (officeId) => {
    if (visited.has(officeId)) return;
    visited.add(officeId);
    // only the entry office runs its own turn here; every other office's turn
    // executes inside the handoff that invoked it
    if (officeId === entry) executeTurn(officeId);
    for (const edge of ir.graph.edges.filter((e) => e.source === officeId)) {
      const r = handoff({ from: officeId, to: edge.target, edge, kind: edge.kind, executeTargetTurn: edge.kind !== "information" });
      if (r.accepted) walk(edge.target);
    }
  };
  walk(entry);

  // ── mode-specific evidence ───────────────────────────────────────────────
  const modeEvidence = opts.modeEvidence ? opts.modeEvidence({ handoff, dispatcher, policy, entry }) : {};

  store.close("clean");
  const committed = store.readCommitted();
  const result = {
    matchId,
    mode,
    regimeId: ir.regimeId,
    regimeDigest: opts.regimeDigest,
    instrumentVersion: P2_INSTRUMENT,
    participation: run.participation(),
    roster: run.rosterCompleteness(),
    topology: dispatcher.topologyReport(),
    eventCount: committed.length,
    committedTypes: [...new Set(committed.map((e) => e.type))].sort(),
    modeEvidence,
    dir,
  };
  return result;
}

/** Evidence (observational): an undeclared edge is recorded, not rejected. */
export function buildObservationalEvidence({ handoff, dispatcher, entry }) {
  const r = handoff({
    from: entry, to: "xingbu", edge: null, kind: "vote",
    extra: { edgeId: "e99-undeclared" }, executeTargetTurn: false,
  });
  return {
    undeclaredEdgeAcceptedAndRecorded: r.accepted,
    topologyAfterUndeclared: dispatcher.topologyReport(),
  };
}

/** Evidence: invalid handoffs and marker text must fail before enqueue. */
export function buildRejectionEvidence({ handoff, policy, entry }) {
  const results = {};
  const office = (e) => (e ?? { source: entry, target: "menxia" });
  // unknown edge (not declared) — graph_enforced rejects
  results.unknownEdge = handoff({ from: office().source, to: "menxia", edge: null, kind: "command", extra: { edgeId: "e99-unknown" } });
  // wrong edge kind for a declared edge
  const declared = { edgeId: "e1-zhongshu-menxia", source: "zhongshu", target: "menxia", kind: "command" };
  results.wrongKind = handoff({ from: "zhongshu", to: "menxia", edge: declared, kind: "vote", executeTargetTurn: false });
  // schema-invalid request (missing causalParentId)
  results.schemaInvalid = (() => {
    const check = validateHandoffRequest({ handoffId: "x", sourceOfficeId: "zhongshu", sourceSessionId: "s", targetOfficeId: "menxia", targetSessionId: "t", edgeId: "e1", edgeKind: "command", causalParentId: "", mode: "one-shot", context: "fresh", joinPolicy: "await", idempotencyKey: "" });
    return { rejected: !check.valid, reasons: check.reasons };
  })();
  // marker text never grants authority
  results.markerText = policy.authorizeMarkerText({ actorOffice: "menxia", marker: "[VETO]" });
  return results;
}

/** Run all three modes for one regime; never pool results. */
export function runAllModes({ regimeDir, reportFile }) {
  const compiler = new RegimeCompiler();
  const { ir, digest } = compiler.compile(regimeDir);
  const modes = ["observational", "roster_enforced", "graph_enforced"];
  const runs = modes.map((mode) => executeRegimeFlow({
    ir, mode, regimeDigest: digest,
    modeEvidence:
      mode === "graph_enforced" ? buildRejectionEvidence
      : mode === "observational" ? buildObservationalEvidence
      : undefined,
  }));
  const evidence = {
    schema: "p2-slice-evidence/1",
    regime: ir.regimeId,
    treatment: ir.treatment,
    regimeDigest: digest,
    instrumentVersion: P2_INSTRUMENT,
    modes: Object.fromEntries(runs.map((r) => [r.mode, r])),
  };
  fs.mkdirSync(P2_REPORT_DIR, { recursive: true });
  fs.writeFileSync(reportFile, JSON.stringify(evidence, null, 2) + "\n");
  return evidence;
}

function main() {
  const regimeDir = process.argv[2] ?? path.resolve(__dirname, "../../../regimes/china/tang");
  const reportFile = process.argv[3] ?? path.join(P2_REPORT_DIR, "p2-slice-evidence.json");
  const evidence = runAllModes({ regimeDir, reportFile });
  const summary = {};
  for (const [mode, r] of Object.entries(evidence.modes)) {
    summary[mode] = {
      offices: Object.keys(r.participation.offices).length,
      events: r.eventCount,
      rosterComplete: r.roster.complete,
      exercisedDeclared: r.topology.exercisedDeclaredCount,
      unknownObserved: r.topology.unknownObservedCount,
      rejectionEvidence: r.modeEvidence?.unknownEdge ? { unknownEdge: r.modeEvidence.unknownEdge.accepted ? "ACCEPTED(bad)" : "rejected", wrongKind: r.modeEvidence.wrongKind.accepted ? "ACCEPTED(bad)" : "rejected", markerGranted: r.modeEvidence.markerText.granted } : null,
    };
  }
  console.log(JSON.stringify({ regime: evidence.regime, treatment: evidence.treatment, digest: evidence.regimeDigest.slice(0, 12), summary, reportFile }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
