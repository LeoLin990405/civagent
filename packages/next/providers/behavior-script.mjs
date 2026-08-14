/**
 * behavior-script.mjs — P1 providers: one request, one behavior (plan §18.1).
 *
 * Every fixture script contains exactly one request expectation and one
 * scripted behavior. At teardown, `assertConsumed()` fails the test if any
 * scripted behavior was unused or any unexpected request occurred — this
 * exposes hidden retries and hidden model calls.
 *
 * Behavior kinds:
 *   chunks          — normal streamed chunks + usage
 *   toolRequest     — a native tool-call request in the stream
 *   error           — explicit provider error
 *   hang            — no response at all (gateway must classify outcome-unknown)
 *   eofEarly        — EOF before terminal event
 *   malformedFrame  — non-JSON frames in the stream
 *   rateLimit       — rate-limit error mapping
 *   cancelBeforeReceipt / cancelAfterReceipt — cancellation acknowledgement
 *   overflow        — output overflow (bounded-memory spill failure)
 */

export const BEHAVIOR_KINDS = [
  "chunks", "toolRequest", "error", "hang", "eofEarly", "malformedFrame",
  "rateLimit", "cancelBeforeReceipt", "cancelAfterReceipt", "overflow",
];

export class BehaviorScript {
  /**
   * @param {object[]} steps each {expect: {purpose}, behave: {kind, data}}
   */
  constructor(steps = []) {
    this.steps = [...steps];
    this.consumed = 0;
  }

  /** The gateway calls this with each outbound request. Returns the scripted behavior. */
  next(expectedPurpose) {
    if (this.steps.length === 0) {
      const err = new Error(`UNEXPECTED REQUEST: purpose=${expectedPurpose} with empty script (hidden call)`);
      err.code = "UNEXPECTED_REQUEST";
      throw err;
    }
    const step = this.steps.shift();
    if (step.expect?.purpose && step.expect.purpose !== expectedPurpose) {
      throw new Error(`script purpose mismatch: expected ${step.expect.purpose}, got ${expectedPurpose}`);
    }
    this.consumed++;
    return step.behave;
  }

  /** Teardown gate: every scripted behavior must have been consumed. */
  assertConsumed() {
    if (this.steps.length > 0) {
      const err = new Error(`unconsumed scripted behaviors: ${this.steps.length} (${this.steps.map((s) => s.behave.kind).join(",")})`);
      err.code = "UNCONSUMED_SCRIPT";
      throw err;
    }
    return true;
  }
}

/** Standard fixtures for the vertical slice. */
export const SLICE_SCRIPT = new BehaviorScript([
  {
    expect: { purpose: "planner" },
    behave: {
      kind: "chunks",
      data: {
        chunks: ["臣谨奏：边境三镇宜增戍卒二千。", "然粮道艰远，请先修漕渠。"],
        usage: { inputTokens: 42, outputTokens: 37 },
      },
    },
  },
]);

export const ERROR_SCRIPT = new BehaviorScript([
  { expect: { purpose: "planner" }, behave: { kind: "rateLimit", data: { message: "429 too many requests", retryAfterMs: 1000 } } },
]);

export const HANG_SCRIPT = new BehaviorScript([
  { expect: { purpose: "planner" }, behave: { kind: "hang", data: {} } },
]);
