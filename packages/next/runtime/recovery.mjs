/**
 * recovery.mjs — P3 runtime: conservative crash classification (plan §9.3).
 *
 * Recovery reads the committed prefix of generation N, freezes it byte-for-byte
 * (SegmentSeal), and classifies the in-flight operation:
 *   NOT_STARTED            no committed start intent (effect provably absent)
 *   START_OUTCOME_UNKNOWN  start intent committed, no receipt (crash boundary)
 *   EFFECT_OUTCOME_UNKNOWN receipt committed, no terminal
 *   COMPLETED              terminal committed
 * Never optimistic: absence of a receipt after a committed start intent is
 * never `NOT_STARTED`.
 */
import { verifySegment, readCommittedEvents, sealSegment } from "../evidence/segment.mjs";
import { EventStore } from "../evidence/eventstore.mjs";

export function classifyRecovery(committedEvents, { operationId = "op-1" } = {}) {
  let startIntent = false;
  let receipt = false;
  let terminal = false;
  let terminalFailed = false;
  for (const ev of committedEvents) {
    const matches = ev.operationId === operationId || ev.payload?.operationId === operationId;
    if (ev.type === "model.start_intent" && matches) startIntent = true;
    if (ev.type === "model.receipt" && matches) receipt = true;
    if (ev.type === "operation.outcome" && matches) {
      terminal = true;
      if (ev.payload?.status !== "settled") terminalFailed = true;
    }
  }
  if (!startIntent) return "NOT_STARTED";
  if (!receipt) return "START_OUTCOME_UNKNOWN";
  if (!terminal) return "EFFECT_OUTCOME_UNKNOWN";
  return terminalFailed ? "SETTLED_FAILED" : "COMPLETED";
}

/**
 * Recover one crashed segment: verify the committed prefix, seal generation N
 * (crash evidence preserved byte-for-byte, tail included), open generation
 * N+1 whose first event is `recovery.completed` linking the seal and carrying
 * the conservative classification.
 */
export function recoverSegment({ segmentFile, segmentsDir, cas, closeReason = "crash", instrumentVersion = "native-next-v1-crash" }) {
  const verified = verifySegment(segmentFile);
  if (verified.malformedInside) {
    throw new Error(`corrupt committed prefix in ${segmentFile}; refusing recovery`);
  }
  const committedEvents = readCommittedEvents(segmentFile);
  const classification = classifyRecovery(committedEvents);
  const { sealDigest } = sealSegment(cas, segmentFile, {
    verificationResult: verified,
    closeReason,
    sealedAt: new Date().toISOString(),
  });
  const next = new EventStore(segmentsDir, {
    generation: 2,
    segmentId: "recovery-g2",
    writer: "recovery",
    instrumentVersion,
  });
  const payload = { classification, committedLength: verified.committedLength, sealDigest };
  next.append({
    schema: "civ.event/1",
    epoch: "native-next-v1",
    instrumentVersion,
    generation: 2,
    eventId: `recovery:${verified.generation}:${classification}`,
    ts: Date.now(),
    matchId: committedEvents[0]?.matchId ?? "crash",
    sessionId: null,
    activationId: null,
    turnId: null,
    operationId: null,
    type: "recovery.completed",
    actor: "recovery",
    spanId: null,
    parentSpanId: null,
    artifactRefs: [sealDigest],
    payload,
  });
  next.close("clean");
  return { classification, sealDigest, verified, committedEvents, nextFile: next.file, payload };
}
