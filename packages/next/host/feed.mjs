/**
 * feed.mjs — P5 host: scoped durable event feed (plan §14.2).
 *
 * The `civ.events` topic is scoped per match and delivers only authorized
 * canonical/projection events. Subscription avoids the snapshot/live race:
 *   1. atomically register a bounded live queue and capture `headOffset`;
 *   2. return a snapshot defined `asOf=headOffset`;
 *   3. drain buffered events strictly after `headOffset`;
 *   4. continue live delivery.
 *
 * Clients track `(generation, feedOffset, eventId)`, deduplicate ids, detect
 * gaps, request repair, and surface cursor expiry. No gap is silently ignored.
 * The server never broadcasts a whole Context; a subscriber without the
 * match's scope token is rejected.
 */
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

export const FEED_SCHEMA = "civ.feed/1";
export const DESCRIBE_SCHEMA = "civ.describe/1";
export const DEFAULT_QUEUE_LIMIT = 1000;
export const DEFAULT_RETENTION = 5000;

export class ScopeDeniedError extends Error {
  constructor() {
    super("scope denied: subscriber is not authorized for this match feed");
    this.code = "SCOPE_DENIED";
  }
}

export class FeedServer {
  /**
   * @param {object} opts {eventSource(matchId) -> committed events array,
   *                       allowedScopes: Map<matchId, string>,
   *                       queueLimit, retention}
   */
  constructor(opts) {
    this.eventSource = opts.eventSource;
    this.allowedScopes = opts.allowedScopes ?? new Map();
    this.queueLimit = opts.queueLimit ?? DEFAULT_QUEUE_LIMIT;
    this.retention = opts.retention ?? DEFAULT_RETENTION;
    this.generation = 1; // increments on restart/reset (feed generation change)
    this.subscriptions = new Map(); // subscriptionId -> state
    this._nextSub = 0;
  }

  /** Server restart / generation change: bump generation, drop subscriptions. */
  restart() {
    this.generation++;
    const dropped = [...this.subscriptions.keys()];
    this.subscriptions.clear();
    return { generation: this.generation, dropped };
  }

  /**
   * Atomic subscribe: register the bounded live queue first, then capture
   * headOffset (single-threaded JS makes register-then-capture atomic; a
   * concurrent append lands either before headOffset (snapshot) or after it
   * (live queue)).
   */
  subscribe({ matchId, scopeToken, since }) {
    if (this.allowedScopes.get(matchId) !== scopeToken) throw new ScopeDeniedError();
    const events = this.eventSource(matchId);
    const subscriptionId = `sub-${++this._nextSub}`;
    const liveQueue = [];
    const headOffset = events.length;
    const sub = {
      subscriptionId, matchId, generation: this.generation,
      headOffset, applied: headOffset, // next expected feedOffset
      liveQueue, since: since ?? null, state: "SNAPSHOT",
    };
    this.subscriptions.set(subscriptionId, sub);
    const snapshot = events.slice(0, headOffset);
    return { subscriptionId, matchId, generation: this.generation, headOffset, snapshot };
  }

  /** Push one committed event to every live subscriber of its match. */
  publish(matchId, event) {
    for (const sub of this.subscriptions.values()) {
      if (sub.matchId !== matchId) continue;
      if (sub.liveQueue.length >= this.queueLimit) {
        // bounded queue: the slowest consumer loses nothing silently — it
        // detects a gap and repairs; the queue never grows unbounded
        sub.overflowed = true;
      } else {
        sub.liveQueue.push({ event, feedOffset: sub.headOffset + sub.liveQueue.length });
      }
    }
  }

  /**
   * Drain the next live frame for a subscription. Returns the frame or null.
   * Frames carry (generation, feedOffset, eventId) so clients can dedupe,
   * detect gaps, and track the cursor.
   */
  nextFrame(subscriptionId) {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return null;
    if (sub.overflowed && sub.liveQueue.length === 0) {
      sub.overflowed = false;
      sub.state = "GAP";
      return { topic: "civ.feed", subscriptionId, matchId: sub.matchId, state: "gap", generation: this.generation, feedOffset: sub.headOffset + 0, eventId: null, reason: "live queue overflowed; repair required" };
    }
    if (sub.liveQueue.length === 0) return null;
    const frame = sub.liveQueue.shift();
    sub.state = "LIVE";
    return {
      topic: "civ.events", subscriptionId, matchId: sub.matchId,
      generation: this.generation, feedOffset: frame.feedOffset,
      event: frame.event,
      cursor: { generation: this.generation, feedOffset: frame.feedOffset, headOffset: sub.headOffset },
    };
  }

  /**
   * Repair: resend committed events from `fromOffset` (feedOffset space).
   * If the cursor is outside retention, expire it and return a full snapshot
   * with a new head (plan §14.2: cursor expiry never silently drops).
   */
  repair({ subscriptionId, fromOffset }) {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return { error: "no such subscription" };
    const events = this.eventSource(sub.matchId);
    if (fromOffset < Math.max(0, events.length - this.retention)) {
      sub.headOffset = events.length;
      sub.applied = sub.headOffset;
      sub.state = "EXPIRED";
      return { state: "expired", generation: this.generation, headOffset: sub.headOffset, snapshot: events.slice(0, sub.headOffset) };
    }
    const chunk = events.slice(Math.max(0, fromOffset), events.length);
    sub.applied = events.length;
    sub.state = "LIVE";
    return { state: "repair", generation: this.generation, fromOffset, events: chunk, headOffset: events.length };
  }

  /** Feed generation seen by a subscription (client uses for restart detect). */
  subscriptionGeneration(subscriptionId) {
    return this.subscriptions.get(subscriptionId)?.generation ?? null;
  }
}

/** Deterministic oracle: the ordered eventId list the client must converge to. */
export function feedOracle(committedEvents) {
  return committedEvents.map((e) => e.eventId);
}

export function feedFrameDigest(frame) {
  return sha256Hex(Buffer.from(canonicalJson({ generation: frame.generation, feedOffset: frame.feedOffset, eventId: frame.event?.eventId ?? null, state: frame.state ?? "live" })));
}
