/**
 * eventstore.mjs — P1 evidence package: canonical single-writer event store.
 *
 * Wraps one SegmentWriter per generation. Events are canonical civ.event/1
 * records (contracts/epoch-rules.mjs). The store is the durable scientific
 * ledger for a match; projections rebuild from committed events.
 */
import { SegmentWriter, verifySegment, readCommittedEvents, sealSegment } from "./segment.mjs";

export class EventStore {
  /**
   * @param {string} dir directory holding segments/...
   * @param {object} opts {generation, segmentId, writer, instrumentVersion}
   */
  constructor(dir, opts) {
    this.dir = dir;
    this.generation = opts.generation;
    this.writer = opts.writer;
    this.instrumentVersion = opts.instrumentVersion;
    this.file = `${dir}/segment-${String(opts.generation).padStart(6, "0")}.jsonl`;
    this.segment = new SegmentWriter(this.file, {
      generation: opts.generation,
      segmentId: opts.segmentId,
      writer: opts.writer,
      instrumentVersion: opts.instrumentVersion,
    });
  }

  append(event) {
    return this.segment.append(event);
  }

  close(closeReason = "clean") {
    this.segment.close(closeReason);
  }

  /** Committed events in order (verifies the whole committed prefix). */
  readCommitted() {
    return readCommittedEvents(this.file);
  }

  /** Verification snapshot (used by recovery). */
  verify() {
    return verifySegment(this.file);
  }

  /**
   * Crash recovery: freeze generation N byte-for-byte, publish a SegmentSeal,
   * and open generation N+1 whose first event links to the seal.
   */
  recoverWithSeal(cas, { closeReason = "crash", sealedAt = new Date().toISOString(), linkedEvent } = {}) {
    const v = verifySegment(this.file);
    if (v.malformedInside) throw new Error(`corrupt committed prefix in ${this.file}; refusing recovery`);
    const { sealDigest } = sealSegment(cas, this.file, { verificationResult: v, closeReason, sealedAt });
    const next = new EventStore(this.dir, {
      generation: this.generation + 1,
      segmentId: `${this.writer}-g${this.generation + 1}`,
      writer: this.writer,
      instrumentVersion: this.instrumentVersion,
    });
    if (linkedEvent) next.append(linkedEvent); // caller appends recovery.completed etc.
    return { next, sealDigest, verified: v };
  }
}
