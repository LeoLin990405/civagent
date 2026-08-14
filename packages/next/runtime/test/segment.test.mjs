/**
 * segment.test.mjs — L0 tests for the immutable segment chain (plan §11.3).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Cas } from "../../evidence/cas.mjs";
import { SegmentWriter, verifySegment, readCommittedEvents } from "../../evidence/segment.mjs";
import { EventStore } from "../../evidence/eventstore.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "civ-segment-test-"));
}

test("append + verify + readCommitted roundtrip with trailer", () => {
  const dir = tmpDir();
  const file = path.join(dir, "seg.jsonl");
  const w = new SegmentWriter(file, { generation: 1, segmentId: "t1", writer: "test", instrumentVersion: "iv-1" });
  w.append({ schema: "civ.event/1", type: "match.admitted", payload: { a: 1 } });
  w.append({ schema: "civ.event/1", type: "turn.observed", payload: { b: 2 } });
  w.close("clean");
  const v = verifySegment(file);
  assert.equal(v.ok, true);
  assert.equal(v.committedLength, 2);
  assert.equal(v.malformedInside, false);
  assert.equal(v.incompleteTail, false);
  const events = readCommittedEvents(file);
  assert.equal(events.length, 2);
  assert.equal(events[0].seq, 0);
  assert.equal(events[1].seq, 1);
});

test("tampered committed record is detected, never silently skipped", () => {
  const dir = tmpDir();
  const file = path.join(dir, "seg.jsonl");
  const w = new SegmentWriter(file, { generation: 1, segmentId: "t2", writer: "test", instrumentVersion: "iv-1" });
  w.append({ type: "match.admitted", payload: { a: 1 } });
  w.append({ type: "turn.observed", payload: { b: 2 } });
  w.close("clean");
  // corrupt the first record's digest field in place (same line length)
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  const rec = JSON.parse(lines[1]);
  const corrupted = lines[1].replace(rec.d, "0".repeat(64));
  fs.writeFileSync(file, [lines[0], corrupted, ...lines.slice(2)].join("\n"));
  const v = verifySegment(file);
  assert.equal(v.malformedInside, true, "corrupt record inside committed prefix must be flagged");
  assert.equal(v.committedLength, 0);
  assert.throws(() => readCommittedEvents(file), /not trustworthy/);
});

test("incomplete tail outside committedLength is ignored; committed prefix survives", () => {
  const dir = tmpDir();
  const file = path.join(dir, "seg.jsonl");
  const w = new SegmentWriter(file, { generation: 1, segmentId: "t3", writer: "test", instrumentVersion: "iv-1" });
  w.append({ type: "match.admitted", payload: { a: 1 } });
  w.append({ type: "turn.observed", payload: { b: 2 } });
  // simulate crash: a partial third record line (no newline, no digest)
  fs.appendFileSync(file, '{"s":2,"d":"abcdef","e":{"type":"turn.observed","payload":{');
  const v = verifySegment(file);
  assert.equal(v.ok, true, "committed prefix must verify even with a broken tail");
  assert.equal(v.committedLength, 2);
  assert.equal(v.incompleteTail, true);
  assert.equal(readCommittedEvents(file).length, 2);
});

test("generation N+1 links to a SegmentSeal that preserves the crash tail", () => {
  const dir = tmpDir();
  const cas = new Cas(dir);
  const store = new EventStore(path.join(dir, "segments"), { generation: 1, segmentId: "g1", writer: "test", instrumentVersion: "iv-1" });
  store.append({ type: "match.admitted", payload: { a: 1 } });
  // crash: no close, partial tail
  fs.appendFileSync(store.file, '{"s":1,"d":"1234","e":{"type":"turn.observed"');
  const { next, sealDigest, verified } = store.recoverWithSeal(cas, { closeReason: "crash" });
  assert.equal(verified.committedLength, 1);
  assert.ok(verified.incompleteTail);
  assert.ok(cas.exists(sealDigest));
  const seal = JSON.parse(cas.get(sealDigest).toString("utf8"));
  assert.equal(seal.schema, "civ.segment-seal/1");
  assert.equal(seal.generation, 1);
  assert.equal(seal.committedLength, 1);
  assert.ok(seal.physicalDigest.startsWith("sha256:"));
  assert.equal(next.generation, 2);
  next.append({ type: "recovery.completed", payload: { sealDigest } });
  next.close("clean");
  assert.equal(readCommittedEvents(next.file).length, 1);
  assert.equal(readCommittedEvents(next.file)[0].type, "recovery.completed");
  // generation 1 remains byte-for-byte frozen (seal recorded the physical bytes)
  assert.equal(seal.physicalBytes, fs.statSync(store.file).size);
});

test("writer refuses append after close; seq is assigned at commit", () => {
  const dir = tmpDir();
  const file = path.join(dir, "seg.jsonl");
  const w = new SegmentWriter(file, { generation: 1, segmentId: "t4", writer: "test", instrumentVersion: "iv-1" });
  const ev = { type: "match.admitted" };
  w.append(ev);
  assert.equal(ev.seq, 0, "canonical seq assigned at commit time");
  w.close("clean");
  assert.throws(() => w.append({ type: "x" }), /segment closed/);
});
