/**
 * inbox.mjs — P2 runtime: durable FIFO inbox on the canonical event store.
 *
 * Plan §9.1: the authoritative FIFO inbox is part of the Next event store.
 * Acceptance uses one `handoff/accepted_and_target_enqueued` record; settlement
 * uses one `handoff/terminal_and_parent_enqueued` compound record containing
 * the child terminal classification, output refs, ownership release, and the
 * complete parent inbox envelope. Each is a single physical record (one
 * append), so no half-settled handoff can become visible: a partial physical
 * record is outside committedLength and invisible to recovery.
 */
import { sha256Hex, canonicalJson } from "../contracts/epoch-rules.mjs";

export const INBOX_EVENT_TYPES = [
  "handoff/accepted_and_target_enqueued",
  "handoff/terminal_and_parent_enqueued",
  "handoff/claimed",
];

export class DurableInbox {
  /**
   * @param {object} deps {eventStore, instrumentVersion, epoch}
   */
  constructor(deps) {
    this.eventStore = deps.eventStore;
    this.instrumentVersion = deps.instrumentVersion;
    this.epoch = deps.epoch ?? "native-next-v1";
  }

  _emit(type, payload) {
    const event = {
      schema: "civ.event/1",
      epoch: this.epoch,
      instrumentVersion: this.instrumentVersion,
      generation: this.eventStore.generation,
      eventId: payload.idempotencyKey ?? `${type}:${payload.handoffId}`,
      ts: Date.now(),
      matchId: payload.matchId,
      sessionId: payload.targetSessionId ?? null,
      type,
      actor: "durable-inbox",
      spanId: null,
      parentSpanId: null,
      artifactRefs: payload.artifactRefs ?? [],
      payload,
    };
    event.payloadDigest = sha256Hex(Buffer.from(canonicalJson(payload)));
    const { seq } = this.eventStore.append(event);
    return { ...event, seq };
  }

  /**
   * Accept a handoff: ONE compound record (handoff id + target enqueue).
   * Returns the committed record.
   */
  acceptHandoff({ handoffId, matchId, targetSessionId, sourceOfficeId, targetOfficeId, edgeId, edgeKind, artifactRefs, idempotencyKey }) {
    return this._emit("handoff/accepted_and_target_enqueued", {
      handoffId, matchId, targetSessionId, sourceOfficeId, targetOfficeId, edgeId, edgeKind,
      artifactRefs: artifactRefs ?? [], idempotencyKey,
    });
  }

  /**
   * Claim the FIFO head. Rebuilds the queue from committed events (durable,
   * replayable). Returns the claimed record or null when empty.
   */
  claim({ matchId, targetSessionId }) {
    const queue = this.peek({ matchId, targetSessionId });
    if (queue.length === 0) return null;
    const record = queue[0];
    this._emit("handoff/claimed", {
      handoffId: record.payload.handoffId, matchId, targetSessionId,
      idempotencyKey: `${record.payload.handoffId}:claimed`,
    });
    return record;
  }

  /** Rebuild the FIFO queue from committed events (projection, disposable). */
  peek({ matchId, targetSessionId }) {
    const events = this.eventStore.readCommitted();
    const accepted = [];
    const removed = new Set(); // claimed heads and settled handoffs leave the queue
    for (const ev of events) {
      if (ev.type === "handoff/accepted_and_target_enqueued" && ev.payload.targetSessionId === targetSessionId) {
        accepted.push(ev);
      }
      if (ev.type === "handoff/claimed" && ev.payload.targetSessionId === targetSessionId) {
        removed.add(ev.payload.handoffId);
      }
      if (ev.type === "handoff/terminal_and_parent_enqueued" && ev.payload.targetSessionId === targetSessionId) {
        removed.add(ev.payload.handoffId);
      }
    }
    return accepted.filter((ev) => !removed.has(ev.payload.handoffId));
  }

  /**
   * Settle a handoff: ONE compound record with child terminal classification,
   * output refs, ownership release, and the complete parent notice envelope.
   */
  settleHandoff({ handoffId, matchId, targetSessionId, parentSessionId, childTerminal, outputRefs, ownershipRelease, idempotencyKey }) {
    return this._emit("handoff/terminal_and_parent_enqueued", {
      handoffId, matchId, targetSessionId, parentSessionId,
      childTerminal, // {classification: completed|failed|cancelled, outcomeRefs}
      outputRefs: outputRefs ?? [],
      ownershipRelease: ownershipRelease ?? { released: true, at: Date.now() },
      parentNotice: { handoffId, targetSessionId, parentSessionId, childTerminal }, // complete parent inbox envelope
      idempotencyKey,
    });
  }
}

