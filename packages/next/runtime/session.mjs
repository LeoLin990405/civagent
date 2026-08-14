/**
 * session.mjs — P1 runtime: AgentSession / Activation / Turn state machines.
 *
 * Plan §9.1: each entity owns an independent state machine; a parent state
 * never substitutes for a child's state. Every session has a durable FIFO
 * inbox and at most one turn is CLAIMED/RUNNING at a time.
 */
import crypto from "node:crypto";

export const SESSION_STATES = ["CREATED", "READY", "ACTIVE", "QUIESCING", "CLOSED"];
export const ACTIVATION_STATES = ["CREATED", "STARTING", "ACTIVE", "STOPPING", "STOPPED"];
export const TURN_STATES = ["QUEUED", "CLAIMED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"];

const SESSION_TRANSITIONS = {
  CREATED: ["READY", "CLOSED"],
  READY: ["ACTIVE", "CLOSED"],
  ACTIVE: ["QUIESCING", "CLOSED"],
  QUIESCING: ["CLOSED"],
  CLOSED: [],
};
const ACTIVATION_TRANSITIONS = {
  CREATED: ["STARTING", "STOPPED"],
  STARTING: ["ACTIVE", "STOPPING", "STOPPED"],
  ACTIVE: ["STOPPING", "STOPPED"],
  STOPPING: ["STOPPED"],
  STOPPED: [],
};
export const TURN_TRANSITIONS = {
  QUEUED: ["CLAIMED", "CANCELLED"],
  CLAIMED: ["RUNNING", "FAILED", "CANCELLED"],
  RUNNING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export function transition(name, from, to, table) {
  if (!table[from].includes(to)) {
    throw new Error(`illegal ${name} transition ${from} -> ${to}`);
  }
  return to;
}

export class AgentSession {
  /**
   * @param {object} opts {sessionId, matchId, rootSessionId?, directParentSessionId?}
   */
  constructor(opts) {
    this.sessionId = opts.sessionId;
    this.matchId = opts.matchId;
    this.rootSessionId = opts.rootSessionId ?? opts.sessionId;
    this.directParentSessionId = opts.directParentSessionId ?? null;
    this.state = "CREATED";
    this.inbox = []; // FIFO of queued turns/handoffs (durable in the Next store)
    this.claimedTurn = null; // at most one CLAIMED/RUNNING turn
    this.surfaceRevision = 0; // committed model-visible surface revision
    this.activations = [];
  }

  markReady() {
    this.state = transition("session", this.state, "READY", SESSION_TRANSITIONS);
    return this;
  }

  /** Enqueue one turn/handoff item at the tail of the FIFO inbox. */
  enqueue(item) {
    if (this.state === "CLOSED") throw new Error("enqueue on closed session");
    this.inbox.push(item);
    return item;
  }

  /**
   * Claim the FIFO head. Throws when a turn is already claimed/running or the
   * inbox is empty. Returns the claimed item.
   */
  claimTurn() {
    if (this.claimedTurn) throw new Error(`session ${this.sessionId} already has a claimed/running turn`);
    if (this.inbox.length === 0) throw new Error(`session ${this.sessionId} inbox empty`);
    const item = this.inbox.shift();
    item.state = "CLAIMED";
    this.claimedTurn = item;
    if (this.state !== "ACTIVE") {
      this.state = transition("session", this.state, "ACTIVE", SESSION_TRANSITIONS);
    }
    return item;
  }

  completeClaimedTurn(outcome = "COMPLETED") {
    const turn = this.claimedTurn;
    if (!turn) throw new Error("no claimed turn");
    if (turn.state === "CLAIMED") {
      // a claimed turn that reaches a terminal outcome has run: CLAIMED -> RUNNING
      turn.state = transition("turn", turn.state, "RUNNING", TURN_TRANSITIONS);
    }
    turn.state = transition("turn", turn.state, outcome, TURN_TRANSITIONS);
    this.claimedTurn = null;
    return turn;
  }

  /** Advance the committed surface revision (only after canonical commit). */
  commitSurfaceRevision(revision) {
    this.surfaceRevision = revision;
    return this.surfaceRevision;
  }

  startActivation(activationId) {
    const a = new Activation({ activationId, sessionId: this.sessionId });
    a.start();
    this.activations.push(a);
    return a;
  }

  quiesce() {
    if (this.claimedTurn) throw new Error("cannot quiesce with a claimed turn");
    this.state = transition("session", this.state, "QUIESCING", SESSION_TRANSITIONS);
  }

  close() {
    this.state = transition("session", this.state, "CLOSED", SESSION_TRANSITIONS);
  }
}

export class Activation {
  constructor(opts) {
    this.activationId = opts.activationId;
    this.sessionId = opts.sessionId;
    this.state = "CREATED";
    this.stopReason = null;
  }
  start() {
    this.state = transition("activation", this.state, "STARTING", ACTIVATION_TRANSITIONS);
    this.state = transition("activation", this.state, "ACTIVE", ACTIVATION_TRANSITIONS);
    return this;
  }
  stop(stopReason = "normal") {
    this.state = transition("activation", this.state, "STOPPING", ACTIVATION_TRANSITIONS);
    this.state = transition("activation", this.state, "STOPPED", ACTIVATION_TRANSITIONS);
    this.stopReason = stopReason;
    return this;
  }
}

export class Turn {
  constructor(opts) {
    this.turnId = opts.turnId;
    this.sessionId = opts.sessionId;
    this.activationId = opts.activationId;
    this.state = "QUEUED";
    this.contributionRefs = [];
    this.surfaceRevision = null;
  }
}

export function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}
