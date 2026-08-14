/**
 * crash-worker.mjs — P3: child process executed by the crash matrix.
 *
 * Performs a scripted evidence sequence on one segment and stops at a crash
 * boundary (SIGKILL comes from the parent; the worker never exits early on its
 * own after checkpointing). Checkpoint files tell the parent which durable
 * writes completed before the kill:
 *
 *   cp-<i>         appended canonical event i (fsynced), i = 0-based index
 *   cp-partial-<i> wrote a deliberately truncated record after event i
 *   done           finished the whole sequence and closed cleanly
 *
 * Boundaries (plan §11.3 / §9.3):
 *   before_start_intent        crash before any write
 *   after_start_intent         start intent durable, no receipt
 *   mid_receipt                receipt record partially written
 *   after_receipt              receipt durable, no terminal
 *   mid_terminal               terminal record partially written
 *   after_terminal             everything committed, clean close
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SegmentWriter } from "../evidence/segment.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [segmentPath, boundary, checkpointDir] = process.argv.slice(2);
const ckpt = (name) => fs.writeFileSync(path.join(checkpointDir, name), String(Date.now()));

function partialWrite(writer, s) {
  // deliberately truncated record line (no trailing newline, broken JSON)
  const fd = fs.openSync(segmentPath, "a");
  try {
    fs.writeSync(fd, `{"s":${s},"d":"0000","e":{"type":"model.response","payload":`);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

const w = new SegmentWriter(segmentPath, {
  generation: 1, segmentId: `crash-${boundary}`, writer: "crash-worker", instrumentVersion: "native-next-v1-crash",
});
ckpt("ready"); // header written; parent may kill at the before-start boundary

// sequence of canonical events: 0 match.admitted, 1 turn.claimed,
// 2 model.start_intent, 3 model.receipt, 4 model.response, 5 surface.revision, 6 match.terminal
const events = [
  { schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "native-next-v1-crash", generation: 1, eventId: "ev-0", ts: 1, matchId: "crash", type: "match.admitted", sessionId: null, activationId: null, turnId: null, operationId: null, actor: "worker", spanId: null, parentSpanId: null, artifactRefs: [], payload: { step: 0 } },
  { schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "native-next-v1-crash", generation: 1, eventId: "ev-1", ts: 2, matchId: "crash", type: "turn.claimed", sessionId: "s", activationId: null, turnId: "t", operationId: null, actor: "worker", spanId: null, parentSpanId: null, artifactRefs: [], payload: { step: 1 } },
  { schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "native-next-v1-crash", generation: 1, eventId: "ev-2", ts: 3, matchId: "crash", type: "model.start_intent", sessionId: "s", activationId: null, turnId: "t", operationId: "op-1", actor: "worker", spanId: null, parentSpanId: null, artifactRefs: [], payload: { step: 2, operationId: "op-1" } },
  { schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "native-next-v1-crash", generation: 1, eventId: "ev-3", ts: 4, matchId: "crash", type: "model.receipt", sessionId: "s", activationId: null, turnId: "t", operationId: "op-1", actor: "worker", spanId: null, parentSpanId: null, artifactRefs: [], payload: { step: 3 } },
  { schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "native-next-v1-crash", generation: 1, eventId: "ev-4", ts: 5, matchId: "crash", type: "model.response", sessionId: "s", activationId: null, turnId: "t", operationId: "op-1", actor: "worker", spanId: null, parentSpanId: null, artifactRefs: [], payload: { step: 4 } },
  { schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "native-next-v1-crash", generation: 1, eventId: "ev-5", ts: 6, matchId: "crash", type: "surface.revision", sessionId: "s", activationId: null, turnId: "t", operationId: null, actor: "worker", spanId: null, parentSpanId: null, artifactRefs: [], payload: { step: 5 } },
  { schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "native-next-v1-crash", generation: 1, eventId: "ev-6", ts: 7, matchId: "crash", type: "operation.outcome", sessionId: "s", activationId: null, turnId: "t", operationId: "op-1", actor: "worker", spanId: null, parentSpanId: null, artifactRefs: [], payload: { step: 6, operationId: "op-1", status: "settled" } },
];

const APPEND_UP_TO = {
  before_start_intent: -1, // no writes
  after_start_intent: 2, // events 0..2 committed (start intent durable, no receipt)
  mid_receipt: 2, // events 0..2 committed, then partial RECEIPT record (s=3)
  after_receipt: 4, // events 0..4 committed (receipt durable, no terminal)
  mid_terminal: 5, // events 0..5 committed, then partial TERMINAL record (s=6)
  after_terminal: 6, // events 0..6 committed, clean close
};

const limit = APPEND_UP_TO[boundary];
for (let i = 0; i <= limit; i++) {
  w.append(events[i]);
  ckpt(`cp-${i}`);
}

if (boundary === "mid_receipt" || boundary === "mid_terminal") {
  partialWrite(w, limit + 1);
  ckpt(`cp-partial-${limit + 1}`);
}

if (boundary === "after_terminal") {
  w.close("clean");
  ckpt("done");
}

// hold until SIGKILL (parent kills after checkpoint); never exit early
setInterval(() => {}, 1 << 30);
