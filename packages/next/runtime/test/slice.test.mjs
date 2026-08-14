/**
 * slice.test.mjs — L0 tests for the first vertical slice (plan §16).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { runVerticalSlice, SLICE_MANIFEST_INPUTS } from "../slice.mjs";
import { readCommittedEvents } from "../../evidence/segment.mjs";
import { BehaviorScript } from "../../providers/behavior-script.mjs";
import { validateCanonicalEvent, assertEpochSeparation, assertIdDiscipline } from "../../contracts/epoch-rules.mjs";
import { Operation } from "../operation.mjs";
import { FakeProvider } from "../../providers/fake-provider.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "civ-slice-test-"));
}

test("vertical slice: all ten evidence items pass", async () => {
  const dir = tmpDir();
  const ev = runVerticalSlice({ dir });
  // 1. manifest bytes and digest
  assert.ok(ev.manifest.digest.length === 64);
  assert.ok(ev.manifest.bytes > 0);
  assert.match(ev.manifest.instrumentVersion, /^native-next-v1-/);
  // 2. exact request artifact (byte-for-byte reconstruction)
  assert.equal(ev.request.exact, true);
  // 3. start intent before transport (structural in gateway; committed types prove it)
  const types = ev.events.map((e) => e.type);
  const startIdx = types.indexOf("model.start_intent");
  const chunkIdx = types.indexOf("model.raw_chunk");
  assert.ok(startIdx >= 0 && chunkIdx > startIdx, "start intent must precede raw chunks");
  // 4. raw chunks spilled to CAS
  assert.equal(ev.rawChunksSpilledToCas, true);
  // 5. canonical response and usage
  assert.equal(ev.response.usage.inputTokens, 42);
  assert.equal(ev.response.usage.outputTokens, 37);
  // 6. completed surface revision
  assert.equal(ev.surface.revision, 1);
  // 7. analytical replay produces the same surface hash
  assert.equal(ev.surface.replayEqual, true);
  // 8. crash classifications at every boundary
  assert.equal(ev.crashClassifications.a.notMisclassifiedAsNotStarted, true);
  assert.equal(ev.crashClassifications.b.operationState, "EFFECT_OUTCOME_UNKNOWN");
  assert.ok(ev.crashClassifications.c.newOperationId.startsWith("crash-c-op-retry"));
  // 9. zero hidden outbound requests
  assert.equal(ev.hiddenRequests.zero, true);
  assert.equal(ev.hiddenRequests.requestCount, 1);
  // 10. zero resource residue
  assert.equal(ev.residue, null);
  // event stream validates + is single-epoch (read from the committed file)
  const committed = readCommittedEvents(path.join(dir, "segments", "segment-000001.jsonl"));
  for (const e of committed) {
    const violations = validateCanonicalEvent(e);
    assert.deepEqual(violations, [], `event ${e.type} seq ${e.seq}: ${violations.join("; ")}`);
  }
  assertEpochSeparation(committed);
  assertIdDiscipline(committed);
  // request + response + chunk artifacts all exist in CAS
  const { Cas } = await import("../../evidence/cas.mjs");
  const cas = new Cas(path.join(dir, "evidence"));
  assert.ok(cas.exists(ev.request.artifactDigest));
  assert.ok(cas.exists(ev.response.artifactDigest));
});

test("assertConsumed catches unused scripted behavior (hidden-call protection)", () => {
  const dir = tmpDir();
  const script = new BehaviorScript([
    { expect: { purpose: "planner" }, behave: { kind: "chunks", data: { chunks: ["a"], usage: { inputTokens: 1, outputTokens: 1 } } } },
    { expect: { purpose: "planner" }, behave: { kind: "chunks", data: { chunks: ["b"], usage: { inputTokens: 1, outputTokens: 1 } } } },
  ]);
  // the slice runs its own teardown gate; an unconsumed scripted behavior
  // fails the run closed instead of producing evidence
  assert.throws(() => runVerticalSlice({ dir, script }), /unconsumed scripted behaviors/);
  assert.equal(script.steps.length, 1);
});

test("unexpected outbound request fails loudly (empty script)", async () => {
  const dir = tmpDir();
  const script = new BehaviorScript([]);
  const { Cas } = await import("../../evidence/cas.mjs");
  const { EventStore } = await import("../../evidence/eventstore.mjs");
  const { ModelGateway } = await import("../../providers/gateway.mjs");
  const cas = new Cas(path.join(dir, "cas"));
  const store = new EventStore(path.join(dir, "seg"), { generation: 1, segmentId: "x", writer: "x", instrumentVersion: "iv" });
  const op = new Operation({ operationId: "op", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  const gateway = new ModelGateway({ cas, eventStore: store, provider: new FakeProvider(script), instrumentVersion: "iv" });
  assert.throws(() => gateway.request({ operation: op, model: "m", systemPrompt: "p", messages: [], tools: [] }), /UNEXPECTED REQUEST/);
});

test("behavior scripts: rate limit, eof early, malformed, overflow, cancellation", async () => {
  const { ModelGateway } = await import("../../providers/gateway.mjs");
  const { Cas } = await import("../../evidence/cas.mjs");
  const { EventStore } = await import("../../evidence/eventstore.mjs");
  const cases = [
    { kind: "rateLimit", expect: (r) => r.status === "error" && r.errorType === "rate_limit" },
    { kind: "eofEarly", expect: (r) => r.status === "error" && r.errorType === "eof_early" },
    { kind: "malformedFrame", expect: (r) => r.status === "error" && r.errorType === "malformed_frame" },
    { kind: "overflow", expect: (r) => r.status === "error" && r.errorType === "overflow" },
    { kind: "cancelBeforeReceipt", expect: (r) => r.status === "cancelled" && r.phase === "before_receipt" },
    { kind: "cancelAfterReceipt", expect: (r) => r.status === "cancelled" && r.phase === "after_receipt" },
  ];
  for (const c of cases) {
    const dir = tmpDir();
    const cas = new Cas(path.join(dir, "cas"));
    const store = new EventStore(path.join(dir, "seg"), { generation: 1, segmentId: "x", writer: "x", instrumentVersion: "iv" });
    const script = new BehaviorScript([{ expect: { purpose: "planner" }, behave: { kind: c.kind, data: { message: "x", retryAfterMs: 1000, frames: ["{bad"], chunks: ["partial"] } } }]);
    const op = new Operation({ operationId: "op", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
    const gateway = new ModelGateway({ cas, eventStore: store, provider: new FakeProvider(script), instrumentVersion: "iv" });
    const result = gateway.request({ operation: op, model: "m", systemPrompt: "p", messages: [], tools: [] });
    assert.ok(c.expect(result), `${c.kind} outcome mismatch: ${JSON.stringify(result)}`);
    assert.equal(script.steps.length, 0, "script fully consumed");
    assert.ok(["OP_SETTLED", "OP_FLUSHED", "START_OUTCOME_UNKNOWN", "FAILED_BEFORE_START", "EFFECT_OUTCOME_UNKNOWN"].includes(op.state), `${c.kind} op state ${op.state}`);
  }
});

test("manifest determinism: same inputs -> same digest and instrumentVersion", async () => {
  const { buildManifest } = await import("../manifest.mjs");
  const a = buildManifest(SLICE_MANIFEST_INPUTS);
  const b = buildManifest(SLICE_MANIFEST_INPUTS);
  assert.equal(a.digest, b.digest);
  assert.equal(a.instrumentVersion, b.instrumentVersion);
  const c = buildManifest({ ...SLICE_MANIFEST_INPUTS, retryPolicy: "one" });
  assert.notEqual(a.instrumentVersion, c.instrumentVersion, "semantic change must yield a new instrument");
});
