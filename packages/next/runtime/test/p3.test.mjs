/**
 * p3.test.mjs — L0 tests for P3: recovery classification, cancellation tree,
 * projection rebuild, and the crash matrix (small trial counts).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { classifyRecovery, recoverSegment } from "../recovery.mjs";
import { RunNode, cancelAndDrain } from "../cancel.mjs";
import { Cas } from "../../evidence/cas.mjs";
import { EventStore } from "../../evidence/eventstore.mjs";
import { verifySegment, readCommittedEvents } from "../../evidence/segment.mjs";
import { runTrial, BOUNDARIES, EXPECTED_CLASSIFICATION, EXPECTED_COMMITTED } from "../crash-matrix.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function mkEvent(type, operationId = "op-1") {
  return {
    schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "iv",
    generation: 1, eventId: `ev-${Math.random()}`, ts: 1, matchId: "m",
    sessionId: "s", activationId: null, turnId: "t", operationId,
    type, actor: "t", spanId: null, parentSpanId: null, artifactRefs: [],
    payload: { operationId },
  };
}

test("classifyRecovery is conservative at every operation boundary", () => {
  assert.equal(classifyRecovery([]), "NOT_STARTED");
  assert.equal(classifyRecovery([mkEvent("model.start_intent")]), "START_OUTCOME_UNKNOWN", "start intent without receipt is never NOT_STARTED");
  assert.equal(classifyRecovery([mkEvent("model.start_intent"), mkEvent("model.receipt")]), "EFFECT_OUTCOME_UNKNOWN");
  const ok = mkEvent("operation.outcome");
  ok.payload.status = "settled";
  assert.equal(classifyRecovery([mkEvent("model.start_intent"), mkEvent("model.receipt"), ok]), "COMPLETED");
  const failed = mkEvent("operation.outcome");
  failed.payload.status = "settled_failed";
  assert.equal(classifyRecovery([mkEvent("model.start_intent"), mkEvent("model.receipt"), failed]), "SETTLED_FAILED");
  // operations are correlated by operationId: another op's events do not count
  assert.equal(classifyRecovery([mkEvent("model.start_intent", "op-2")], { operationId: "op-1" }), "NOT_STARTED");
});

test("recoverSegment seals generation N and links generation N+1 with the classification", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-recover-"));
  const segmentsDir = path.join(dir, "segments");
  const segmentFile = path.join(segmentsDir, "segment-000001.jsonl");
  const store = new EventStore(segmentsDir, { generation: 1, segmentId: "g1", writer: "test", instrumentVersion: "iv" });
  store.append(mkEvent("model.start_intent"));
  store.append(mkEvent("model.receipt"));
  // crash: no close, partial tail
  fs.appendFileSync(segmentFile, '{"s":2,"d":"abc","e":{"type":"operation.outcome"');
  const cas = new Cas(dir);
  const r = recoverSegment({ segmentFile, segmentsDir, cas });
  assert.equal(r.classification, "EFFECT_OUTCOME_UNKNOWN");
  assert.equal(r.verified.committedLength, 2);
  assert.ok(r.verified.incompleteTail);
  assert.ok(cas.exists(r.sealDigest));
  const sealed = JSON.parse(cas.get(r.sealDigest).toString("utf8"));
  assert.equal(sealed.generation, 1);
  assert.equal(sealed.committedLength, 2);
  // generation N+1 events: recovery.completed links the seal
  const g2 = readCommittedEvents(r.nextFile);
  assert.equal(g2.length, 1);
  assert.equal(g2[0].type, "recovery.completed");
  assert.deepEqual(g2[0].artifactRefs, [r.sealDigest]);
  assert.equal(g2[0].payload.classification, "EFFECT_OUTCOME_UNKNOWN");
});

test("crash matrix smoke: 2 trials per boundary, all invariant-clean", async () => {
  for (const boundary of BOUNDARIES) {
    for (let t = 0; t < 2; t++) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), `civ-matrix-${boundary}-`));
      const r = await runTrial({ boundary, dir, seed: t });
      assert.ok(r.ok, `${boundary} trial ${t}: ${r.violations.join("; ")}`);
      assert.equal(r.classification, EXPECTED_CLASSIFICATION[boundary], `${boundary} classification`);
      assert.equal(r.committedLength, EXPECTED_COMMITTED[boundary], `${boundary} committed prefix`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

test("verifySegment rejects malformed data inside the committed prefix", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-mal-"));
  const file = path.join(dir, "segment-000001.jsonl");
  const store = new EventStore(dir, { generation: 1, segmentId: "g1", writer: "test", instrumentVersion: "iv" });
  store.append(mkEvent("model.start_intent"));
  store.close("clean");
  // corrupt the FIRST committed record -> malformedInside, never skipped
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  const rec = JSON.parse(lines[1]);
  lines[1] = lines[1].replace(rec.d, "f".repeat(64));
  fs.writeFileSync(file, lines.join("\n"));
  const v = verifySegment(file);
  assert.equal(v.malformedInside, true);
  assert.throws(() => readCommittedEvents(file), /not trustworthy/);
});

test("cancellation is top-down; release is bottom-up; logical and cleanup stay separate", () => {
  const root = new RunNode({ runId: "root" }).start();
  const a = new RunNode({ runId: "a", parent: root }).start();
  const b = new RunNode({ runId: "b", parent: root }).start();
  const a1 = new RunNode({ runId: "a1", parent: a }).start();
  root.cancel();
  assert.equal(root.state, "CANCEL_REQUESTED");
  assert.equal(a.state, "CANCEL_REQUESTED");
  assert.equal(a1.state, "CANCEL_REQUESTED");
  assert.equal(b.state, "CANCEL_REQUESTED");
  const { releaseOrder, report } = cancelAndDrain(root, { leaked: ["socket-1"] });
  assert.deepEqual(releaseOrder, ["a1", "a", "b", "root"], "children drain before parents");
  assert.equal(root.state, "DRAINED");
  assert.equal(report.logicalOutcome, "cancelled");
  assert.equal(report.cleanup.clean, false, "a completed task with leaked resources is never reported clean");
  assert.deepEqual(report.cleanup.leaked, ["socket-1"]);
  // clean run reports clean
  const root2 = new RunNode({ runId: "root2" }).start();
  const c = new RunNode({ runId: "c", parent: root2 }).start();
  root2.cancel();
  const r2 = cancelAndDrain(root2);
  assert.deepEqual(r2.releaseOrder, ["c", "root2"]);
  assert.equal(r2.report.cleanup.clean, true);
});

test("projection rebuild after crash: inbox queue reflects only committed records", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-proj-"));
  const segmentsDir = path.join(dir, "segments");
  const segmentFile = path.join(segmentsDir, "segment-000001.jsonl");
  const store = new EventStore(segmentsDir, { generation: 1, segmentId: "g1", writer: "test", instrumentVersion: "iv" });
  // accept h1 and h2, claim h1, then crash mid-settle of h1 (no terminal record)
  const { DurableInbox } = await import("../inbox.mjs");
  const ib = new DurableInbox({ eventStore: store, instrumentVersion: "iv" });
  ib.acceptHandoff({ handoffId: "h1", matchId: "m", targetSessionId: "sess-b", sourceOfficeId: "a", targetOfficeId: "b", edgeId: "e", edgeKind: "command", artifactRefs: [], idempotencyKey: "ik1" });
  ib.acceptHandoff({ handoffId: "h2", matchId: "m", targetSessionId: "sess-b", sourceOfficeId: "a", targetOfficeId: "b", edgeId: "e", edgeKind: "command", artifactRefs: [], idempotencyKey: "ik2" });
  ib.claim({ matchId: "m", targetSessionId: "sess-b" });
  // crash: append a partial settle record
  fs.appendFileSync(segmentFile, '{"s":9,"d":"abc","e":{"type":"handoff/terminal_and_parent_enqueued"');
  // recovery: committed events only
  const cas = new Cas(dir);
  const r = recoverSegment({ segmentFile, segmentsDir, cas });
  const g2events = readCommittedEvents(r.nextFile);
  assert.equal(g2events.length, 1);
  assert.equal(g2events[0].type, "recovery.completed");
  // rebuilt inbox projection over the committed prefix: h2 remains queued,
  // h1 was claimed (removed from queue), no half-settled record is visible
  const { DurableInbox: DB2 } = await import("../inbox.mjs");
  const recoveredStore = { readCommitted: () => readCommittedEvents(segmentFile) };
  const ib2 = new DB2({ eventStore: recoveredStore, instrumentVersion: "iv" });
  const queue = ib2.peek({ matchId: "m", targetSessionId: "sess-b" });
  assert.deepEqual(queue.map((ev) => ev.payload.handoffId), ["h2"], "no half-settled handoff visible; claimed h1 gone");
});
