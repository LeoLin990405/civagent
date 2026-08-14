/**
 * p2.test.mjs — L0 tests for the P2 runtime: orchestration flow, durable
 * compound inbox records, replay, and fork determinism.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RegimeCompiler } from "../../domain/regime-ir.mjs";
import { executeRegimeFlow, buildRejectionEvidence, buildObservationalEvidence, runAllModes, P2_REPORT_DIR } from "../p2-slice.mjs";
import { DurableInbox } from "../inbox.mjs";
import { forkBalancedPrefix } from "../fork.mjs";
import { EventStore } from "../../evidence/eventstore.mjs";
import { validateCanonicalEvent, assertEpochSeparation, assertIdDiscipline, canonicalJson, sha256Hex } from "../../contracts/epoch-rules.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGIMES = path.resolve(__dirname, "../../../../regimes");
const TANG = path.join(REGIMES, "china/tang");

test("P2 flow: all three modes exercise all 9 offices, roster complete, 15 declared edges", async () => {
  const { ir, digest } = new RegimeCompiler().compile(TANG);
  for (const mode of ["observational", "roster_enforced", "graph_enforced"]) {
    const r = executeRegimeFlow({ ir, mode, regimeDigest: digest });
    assert.equal(Object.keys(r.participation.offices).length, 9, `${mode}: all offices participate`);
    assert.equal(r.roster.complete, true, `${mode}: roster complete`);
    assert.equal(r.topology.exercisedDeclaredCount, 15, `${mode}: all declared edges exercised`);
    assert.equal(r.participation.mode, mode, "mode tag must match the run");
    // every event validates and is single-epoch single-instrument
    const { readCommittedEvents } = await import("../../evidence/segment.mjs");
    const committed = readCommittedEvents(path.join(r.dir, "segments", "segment-000001.jsonl"));
    for (const e of committed) {
      const violations = validateCanonicalEvent(e);
      assert.deepEqual(violations, [], `${mode} event ${e.type}: ${violations.join("; ")}`);
    }
    assertEpochSeparation(committed);
    assertIdDiscipline(committed);
  }
});

test("graph_enforced rejects invalid handoffs before enqueue; markers never grant", () => {
  const { ir, digest } = new RegimeCompiler().compile(TANG);
  const r = executeRegimeFlow({ ir, mode: "graph_enforced", regimeDigest: digest, modeEvidence: buildRejectionEvidence });
  assert.equal(r.modeEvidence.unknownEdge.accepted, false);
  assert.match(r.modeEvidence.unknownEdge.rejectReason, /not declared/);
  assert.equal(r.modeEvidence.wrongKind.accepted, false);
  assert.equal(r.modeEvidence.schemaInvalid.rejected, true);
  assert.equal(r.modeEvidence.markerText.granted, false);
});

test("observational records undeclared edges; graph_enforced does not pool with it", () => {
  const { ir, digest } = new RegimeCompiler().compile(TANG);
  const obs = executeRegimeFlow({ ir, mode: "observational", regimeDigest: digest, modeEvidence: buildObservationalEvidence });
  assert.equal(obs.modeEvidence.undeclaredEdgeAcceptedAndRecorded, true);
  assert.equal(obs.modeEvidence.topologyAfterUndeclared.unknownObservedCount, 1);
  const g = executeRegimeFlow({ ir, mode: "graph_enforced", regimeDigest: digest });
  assert.equal(g.topology.unknownObservedCount, 0);
  assert.notEqual(obs.participation.mode, g.participation.mode, "modes never pool");
});

test("durable inbox: accept and settle are each ONE compound physical record", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-inbox-"));
  const store = new EventStore(path.join(dir, "seg"), { generation: 1, segmentId: "inbox", writer: "test", instrumentVersion: "iv" });
  const inbox = new DurableInbox({ eventStore: store, instrumentVersion: "iv" });
  const before = store.segment.committedLength;
  const accepted = inbox.acceptHandoff({
    handoffId: "h1", matchId: "m", targetSessionId: "sess-menxia", sourceOfficeId: "zhongshu",
    targetOfficeId: "menxia", edgeId: "e1", edgeKind: "command", artifactRefs: [], idempotencyKey: "ik1",
  });
  assert.equal(store.segment.committedLength, before + 1, "accept is one physical record");
  assert.equal(accepted.type, "handoff/accepted_and_target_enqueued");
  const settled = inbox.settleHandoff({
    handoffId: "h1", matchId: "m", targetSessionId: "sess-menxia", parentSessionId: "sess-zhongshu",
    childTerminal: { classification: "completed", outcomeRefs: [] }, outputRefs: [],
    ownershipRelease: { released: true }, idempotencyKey: "ik1:settle",
  });
  assert.equal(store.segment.committedLength, before + 2, "settlement is one physical record");
  assert.equal(settled.type, "handoff/terminal_and_parent_enqueued");
  const rec = settled.payload;
  assert.ok(rec.childTerminal && rec.parentNotice, "compound record carries terminal + parent notice");
  assert.equal(rec.parentNotice.handoffId, "h1");
  store.close("clean");
});

test("durable inbox: FIFO claim pops the head; replay rebuilds the queue", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-inbox2-"));
  const store = new EventStore(path.join(dir, "seg"), { generation: 1, segmentId: "inbox", writer: "test", instrumentVersion: "iv" });
  const inbox = new DurableInbox({ eventStore: store, instrumentVersion: "iv" });
  for (const id of ["h1", "h2", "h3"]) {
    inbox.acceptHandoff({ handoffId: id, matchId: "m", targetSessionId: "sess-b", sourceOfficeId: "a", targetOfficeId: "b", edgeId: "e", edgeKind: "command", artifactRefs: [], idempotencyKey: `ik-${id}` });
  }
  assert.deepEqual(inbox.peek({ matchId: "m", targetSessionId: "sess-b" }).map((r) => r.payload.handoffId), ["h1", "h2", "h3"]);
  const claimed = inbox.claim({ matchId: "m", targetSessionId: "sess-b" });
  assert.equal(claimed.payload.handoffId, "h1", "FIFO head claimed first");
  // replay: rebuild the queue from the committed file (read-only; never
  // re-open an EventStore on the same path — that truncates)
  store.close("clean");
  const { readCommittedEvents } = await import("../../evidence/segment.mjs");
  const replayedStore = { readCommitted: () => readCommittedEvents(path.join(dir, "seg", "segment-000001.jsonl")) };
  const inbox2 = new DurableInbox({ eventStore: replayedStore, instrumentVersion: "iv" });
  assert.deepEqual(inbox2.peek({ matchId: "m", targetSessionId: "sess-b" }).map((r) => r.payload.handoffId), ["h2", "h3"], "replay rebuilds the durable queue minus claimed head");
});

test("fork: deterministic forkHash over the balanced completed prefix", () => {
  const events = [
    { type: "turn.claimed", payloadDigest: "d1" },
    { type: "model.response", payloadDigest: "d2" },
    { type: "surface.revision", payloadDigest: "d3" },
    { type: "turn.claimed", payloadDigest: "d4" },
    { type: "model.response", payloadDigest: "d5" }, // in-flight, not completed
  ];
  const source = {
    sessionId: "sess-menxia", rootSessionId: "root", directParentSessionId: "sess-zhongshu",
    surfaceRevision: 1, committedEvents: events, artifactDigests: ["sha256:" + "b".repeat(64)],
  };
  const a = forkBalancedPrefix(source);
  const b = forkBalancedPrefix(source);
  assert.equal(a.forkHash, b.forkHash, "forkHash must be deterministic");
  assert.equal(a.copiedEventCount, 3, "only the balanced prefix ending at the last completed turn is copied");
  assert.deepEqual(a.pinned.copiedPrefixDigests, ["d1", "d2", "d3"]);
  assert.equal(a.pinned.directParentSessionId, "sess-zhongshu");
  assert.equal(a.pinned.rootSessionId, "root");
  // changing any pinned input changes the hash
  const c = forkBalancedPrefix({ ...source, surfaceRevision: 2 });
  assert.notEqual(c.forkHash, a.forkHash);
});

test("P2 evidence report: modes tagged, never pooled, report committed", async () => {
  const reportFile = path.join(P2_REPORT_DIR, "p2-slice-evidence.json");
  const evidence = runAllModes({ regimeDir: TANG, reportFile });
  assert.ok(fs.existsSync(reportFile));
  assert.equal(evidence.regime, "china/tang");
  const modes = Object.keys(evidence.modes);
  assert.deepEqual(modes.sort(), ["graph_enforced", "observational", "roster_enforced"]);
  for (const m of modes) {
    assert.equal(evidence.modes[m].participation.mode, m);
    assert.equal(evidence.modes[m].roster.complete, true);
  }
  // no pooling: every mode row carries its own mode tag and separate events
  const allTags = modes.map((m) => evidence.modes[m].participation.mode);
  assert.equal(new Set(allTags).size, 3);
});
