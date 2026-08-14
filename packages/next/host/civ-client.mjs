/**
 * civ-client.mjs — P5 client: framework-agnostic subscription oracle.
 *
 * Tracks (generation, feedOffset, eventId); dedupes ids, detects gaps,
 * requests repair, handles cursor expiry and server-restart generation
 * changes. Keeps a bounded tail window (no unbounded replay/render) and
 * surfaces every state transition (snapshot/live/gap/repair/expired/
 * reconnected) so staleness is always visible. Runs in Node or a browser
 * (no Node-only APIs).
 */
export const CLIENT_STATES = ["SUBSCRIBING", "SNAPSHOT", "LIVE", "GAP", "REPAIR", "EXPIRED", "RECONNECTED", "DENIED"];

export class CivClient {
  /**
   * @param {object} opts {matchId, scopeToken, tailLimit, onEvent, onState}
   */
  constructor(opts) {
    this.matchId = opts.matchId;
    this.scopeToken = opts.scopeToken;
    this.tailLimit = opts.tailLimit ?? 500;
    this.onEvent = opts.onEvent ?? (() => {});
    this.onState = opts.onState ?? (() => {});
    this.state = "SUBSCRIBING";
    this.generation = null;
    this.feedOffset = -1; // last applied feedOffset
    this.lastEventId = null;
    this.tail = []; // bounded tail window (eventIds + digests)
    this.deduplicated = 0;
    this.gapsDetected = 0;
    this.repairs = 0;
    this.seenIds = new Set();
    this._applyCount = 0;
  }

  _setState(s) {
    this.state = s;
    this.onState(s);
  }

  /** Apply one feed frame (from subscribe, drain, or repair). */
  applyFrame(frame) {
    if (frame.state === "gap") {
      this.gapsDetected++;
      this._setState("GAP");
      return { action: "repair", fromOffset: this.feedOffset + 1 };
    }
    if (frame.state === "expired") {
      this._setState("EXPIRED");
      this.generation = frame.generation;
      this.feedOffset = -1;
      this.tail = [];
      this._applySnapshot(frame.snapshot, frame.generation);
      this._setState("RECONNECTED");
      return { action: "applied", snapshot: true };
    }
    if (frame.state === "repair") {
      this.repairs++;
      this._setState("REPAIR");
      let repaired = 0;
      for (const ev of frame.events) {
        if (this._applyEvent(ev, frame.generation)) repaired++;
      }
      this.feedOffset = frame.headOffset - 1;
      this._setState("LIVE");
      return { action: "applied", repaired };
    }
    // live event frame: adopt the generation from the first live frame
    if (this.generation === null && frame.generation !== null) this.generation = frame.generation;
    if (frame.generation !== null && this.generation !== null && frame.generation !== this.generation) {
      // server restarted: generation change -> full re-snapshot
      this.gapsDetected++;
      this._setState("RECONNECTED");
      return { action: "resnapshot", generation: frame.generation };
    }
    const expected = this.feedOffset + 1;
    if (frame.feedOffset < expected) {
      // duplicate (re-delivery): dedupe by eventId, never double-apply
      if (this.seenIds.has(frame.event?.eventId)) {
        this.deduplicated++;
        return { action: "duplicate" };
      }
      return { action: "duplicate-unknown" };
    }
    if (frame.feedOffset > expected) {
      this.gapsDetected++;
      this._setState("GAP");
      return { action: "repair", fromOffset: expected };
    }
    this._applyEvent(frame.event, frame.generation);
    this.feedOffset = frame.feedOffset;
    this._setState("LIVE");
    return { action: "applied" };
  }

  /** Apply a snapshot (feedOffset space 0..headOffset-1). */
  _applySnapshot(events, generation) {
    this.generation = generation;
    this.feedOffset = events.length - 1;
    this._setState("SNAPSHOT");
    for (const ev of events) this._applyEvent(ev, generation);
  }

  _applyEvent(event, generation) {
    if (this.seenIds.has(event.eventId)) {
      this.deduplicated++;
      return false;
    }
    this.seenIds.add(event.eventId);
    this.lastEventId = event.eventId;
    this.tail.push({ eventId: event.eventId, seq: event.seq, payloadDigest: event.payloadDigest });
    if (this.tail.length > this.tailLimit) this.tail.shift(); // bounded tail
    this._applyCount++;
    this.onEvent(event, this.feedOffset + 1, generation);
    return true;
  }

  /** The applied eventId sequence (bounded tail) — oracle comparison helper. */
  appliedEventIds() {
    return [...this.seenIds];
  }

  get stats() {
    return {
      state: this.state, generation: this.generation, feedOffset: this.feedOffset,
      applied: this._applyCount, deduplicated: this.deduplicated,
      gapsDetected: this.gapsDetected, repairs: this.repairs,
      tailLength: this.tail.length, tailBounded: this.tail.length <= this.tailLimit,
      lastEventId: this.lastEventId,
    };
  }
}
