/**
 * operation.mjs — P1 runtime: Operation state machine (plan §9.3).
 *
 * After an operation is accepted, absence of a spawn/request receipt defaults
 * to START_OUTCOME_UNKNOWN, not NOT_STARTED. No uncertain operation is ever
 * retried automatically; an explicit retry receives a new operationId and
 * links `retryOfOperationId`.
 */
export const OPERATION_STATES = [
  "ACCEPTED", "START_INTENT_DURABLE", "RECEIPT_DURABLE", "OP_SETTLED", "OP_FLUSHED",
  "FAILED_BEFORE_START", "START_OUTCOME_UNKNOWN", "EFFECT_OUTCOME_UNKNOWN",
];

const TRANSITIONS = {
  ACCEPTED: ["START_INTENT_DURABLE", "FAILED_BEFORE_START"],
  START_INTENT_DURABLE: ["RECEIPT_DURABLE", "START_OUTCOME_UNKNOWN", "EFFECT_OUTCOME_UNKNOWN", "FAILED_BEFORE_START"],
  RECEIPT_DURABLE: ["OP_SETTLED", "EFFECT_OUTCOME_UNKNOWN"],
  OP_SETTLED: ["OP_FLUSHED"],
  OP_FLUSHED: [],
  FAILED_BEFORE_START: ["OP_FLUSHED"],
  START_OUTCOME_UNKNOWN: ["OP_FLUSHED"],
  EFFECT_OUTCOME_UNKNOWN: ["OP_FLUSHED"],
};

export class Operation {
  /**
   * @param {object} opts {operationId, matchId, sessionId, turnId, purpose,
   *                        retryOfOperationId?, idempotencyKey?}
   */
  constructor(opts) {
    this.operationId = opts.operationId;
    this.matchId = opts.matchId;
    this.sessionId = opts.sessionId;
    this.turnId = opts.turnId;
    this.purpose = opts.purpose;
    this.retryOfOperationId = opts.retryOfOperationId ?? null;
    this.idempotencyKey = opts.idempotencyKey ?? null;
    this.state = "ACCEPTED";
    this.history = [];
    this.events = []; // canonical events emitted by this operation
  }

  _go(to, note) {
    if (!TRANSITIONS[this.state].includes(to)) {
      throw new Error(`illegal operation transition ${this.state} -> ${to}`);
    }
    this.state = to;
    this.history.push({ to, note, at: Date.now() });
    return this;
  }

  /** The canonical start-intent record is durable (committed) before any HTTP. */
  startIntentDurable() {
    return this._go("START_INTENT_DURABLE", "start intent committed to event store");
  }

  /** External effect acknowledged: spawn/request receipt is durable. */
  receiptDurable() {
    return this._go("RECEIPT_DURABLE", "external receipt committed");
  }

  settle() {
    return this._go("OP_SETTLED", "terminal outcome committed");
  }

  failBeforeStart(reason) {
    this.failureReason = reason;
    return this._go("FAILED_BEFORE_START", `local pre-create failure: ${reason}`);
  }

  /** Crash/no receipt after start intent: default, never NOT_STARTED. */
  startOutcomeUnknown(reason) {
    this.uncertaintyReason = reason;
    return this._go("START_OUTCOME_UNKNOWN", `crash without receipt: ${reason}`);
  }

  effectOutcomeUnknown(reason) {
    this.uncertaintyReason = reason;
    return this._go("EFFECT_OUTCOME_UNKNOWN", `crash without terminal receipt: ${reason}`);
  }

  flush() {
    return this._go("OP_FLUSHED", "evidence flushed");
  }

  /** Explicit retry: new operationId, links the old one, never automatic. */
  retry(opts) {
    if (this.state !== "START_OUTCOME_UNKNOWN" && this.state !== "EFFECT_OUTCOME_UNKNOWN" && this.state !== "FAILED_BEFORE_START") {
      throw new Error(`retry only from uncertain/failed states, not ${this.state}`);
    }
    return new Operation({ ...opts, retryOfOperationId: this.operationId, idempotencyKey: this.idempotencyKey });
  }
}
