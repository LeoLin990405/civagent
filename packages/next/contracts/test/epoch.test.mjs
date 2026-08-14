/**
 * epoch.test.mjs — executable P0 acceptance tests (plan §17 P0):
 *   - epoch separation and no-pooling rules
 *   - canonical event schema and ID discipline over the frozen corpus
 *   - legacy mapping rates >= 99% (event and field level)
 *   - unobservable logical edges labelled unavailable, never counted
 *
 * Run: npm run test:next   (node --test packages/next/contracts/test/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateCanonicalEvent, assertEpochSeparation, assertIdDiscipline,
  LEGACY_EPOCH, LEGACY_INSTRUMENT, CANONICAL_TYPES, EPOCHS,
} from "../epoch-rules.mjs";
import { importCorpus, mapLegacyEvent, CORPUS_ROOT, TYPE_MAP } from "../../legacy-importer/map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestFile = path.join(CORPUS_ROOT, "MANIFEST.json");

let cachedReport = null;
function report() {
  return (cachedReport ??= importCorpus());
}

test("frozen corpus manifest is corpus-v1 with >=100 traces", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  assert.equal(manifest.schemaVersion, "corpus-v1");
  assert.equal(manifest.instrument, "legacy-cc-v5");
  assert.ok(manifest.traces.length >= 100, `expected >=100 traces, got ${manifest.traces.length}`);
  for (const t of manifest.traces) {
    assert.ok(t.digests["meta.json"], `missing meta digest for ${t.matchId}`);
    assert.ok(t.digests["events.jsonl"], `missing events digest for ${t.matchId}`);
  }
});

test("whole frozen corpus maps with eventRate and fieldRate >= 99%", () => {
  const r = report();
  assert.ok(r.gates.eventRateGE99, `eventRate ${r.rates.eventRate} < 0.99`);
  assert.ok(r.gates.fieldRateGE99, `fieldRate ${r.rates.fieldRate} < 0.99`);
  assert.ok(r.gates.zeroUnknownTypes, "unknown legacy types must be zero");
  assert.equal(r.totals.matches, 105);
  assert.ok(r.totals.total >= 4000);
});

test("every imported event validates against the canonical civ.event/1 schema", () => {
  let checked = 0;
  for (const entry of JSON.parse(fs.readFileSync(manifestFile, "utf8")).traces) {
    const eventsFile = path.join(CORPUS_ROOT, "traces", entry.matchId, "events.jsonl");
    for (const [i, line] of fs.readFileSync(eventsFile, "utf8").trim().split("\n").entries()) {
      const { event } = mapLegacyEvent(JSON.parse(line), i);
      const violations = validateCanonicalEvent(event);
      assert.deepEqual(violations, [], `match ${entry.matchId} seq ${i}: ${violations.join("; ")}`);
      checked++;
    }
  }
  assert.ok(checked >= 4000, `checked ${checked} events`);
});

test("no pooling: each match is a single epoch and single instrument", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  for (const entry of manifest.traces) {
    const eventsFile = path.join(CORPUS_ROOT, "traces", entry.matchId, "events.jsonl");
    const events = fs.readFileSync(eventsFile, "utf8").trim().split("\n")
      .map((line, i) => mapLegacyEvent(JSON.parse(line), i).event);
    const { epoch, instrumentVersion } = assertEpochSeparation(events, { matchId: entry.matchId });
    assert.equal(epoch, LEGACY_EPOCH);
    assert.equal(instrumentVersion, LEGACY_INSTRUMENT);
  }
});

test("mixed-epoch event stream is rejected (epoch pooling is a hard stop)", () => {
  const events = [
    { epoch: "legacy-cc-v5", instrumentVersion: "a", seq: 0, eventId: "1", matchId: "m", type: "match.admitted", schema: "civ.event/1", generation: 1, ts: 1, payloadDigest: "0".repeat(64), payload: {} },
    { epoch: "native-next-v1", instrumentVersion: "b", seq: 1, eventId: "2", matchId: "m", type: "turn.observed", schema: "civ.event/1", generation: 1, ts: 2, payloadDigest: "0".repeat(64), payload: {} },
  ];
  assert.throws(() => assertEpochSeparation(events, { matchId: "m" }), /epoch pooling/);
});

test("ID discipline: canonical seq monotonic, eventId unique, spanId unique per match", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  for (const entry of manifest.traces) {
    const eventsFile = path.join(CORPUS_ROOT, "traces", entry.matchId, "events.jsonl");
    const events = fs.readFileSync(eventsFile, "utf8").trim().split("\n")
      .map((line, i) => mapLegacyEvent(JSON.parse(line), i).event);
    assertIdDiscipline(events, { matchId: entry.matchId });
  }
});

test("legacy seq reset is renumbered by canonical file-order seq", () => {
  // e3-cn-doubao-plague-response-01-r04__china-tang has a known legacy seq
  // reset (seq 0 after 20); canonical seq must be strictly monotonic instead.
  const entry = { matchId: "e3-cn-doubao-plague-response-01-r04__china-tang" };
  const eventsFile = path.join(CORPUS_ROOT, "traces", entry.matchId, "events.jsonl");
  const lines = fs.readFileSync(eventsFile, "utf8").trim().split("\n");
  const canonical = lines.map((line, i) => mapLegacyEvent(JSON.parse(line), i).event);
  let legacyReset = false;
  let prevLegacy = -1;
  lines.forEach((line) => {
    const legacySeq = JSON.parse(line).seq;
    if (legacySeq <= prevLegacy) legacyReset = true;
    prevLegacy = legacySeq;
  });
  assert.ok(legacyReset, "fixture must actually contain a legacy seq reset");
  assertIdDiscipline(canonical, { matchId: entry.matchId });
  assert.equal(canonical[0].payload.legacy.legacySeq, 0);
  assert.equal(canonical[canonical.length - 1].seq, canonical.length - 1);
});

test("unobservable logical edges are labelled unavailable and never counted", () => {
  const r = report();
  for (const m of r.perMatch) {
    assert.equal(m.edges.handoffs.count, 0, `match ${m.matchId}: handoffs must never be inferred`);
    assert.equal(m.edges.handoffs.available, false);
    assert.equal(m.edges.sessionIdentity.available, false);
    assert.equal(m.edges.subagentType.available, false);
    assert.equal(m.edges.planDispatch.authority, false);
  }
  // no handoff appears in any totals denominator
  assert.ok(!("handoffs" in r.totals));
});

test("unknown legacy event type maps to legacy.unmapped and counts against the gate", () => {
  const { event } = mapLegacyEvent({ matchId: "m", seq: 0, ts: 1, type: "bogus_type", some_unknown_field: 1 }, 0);
  assert.equal(event.type, "legacy.unmapped");
  assert.ok(CANONICAL_TYPES.includes(event.type));
  assert.deepEqual(event.payload.raw.some_unknown_field, 1);
  // the unmapped field is reported as unknown, lowering fieldRate
});

test("every legacy type present in the corpus has a canonical mapping", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const seen = new Set();
  for (const entry of manifest.traces) {
    const eventsFile = path.join(CORPUS_ROOT, "traces", entry.matchId, "events.jsonl");
    for (const line of fs.readFileSync(eventsFile, "utf8").trim().split("\n")) {
      seen.add(JSON.parse(line).type);
    }
  }
  for (const t of seen) {
    assert.ok(TYPE_MAP[t], `legacy type ${t} has no canonical mapping`);
  }
  assert.deepEqual([...EPOCHS].sort(), ["legacy-cc-v5", "native-next-v1"].sort());
});
