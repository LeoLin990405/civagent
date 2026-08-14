/**
 * cancel.mjs — P3 runtime: owned Run tree with top-down cancellation and
 * bottom-up release (plan §9.1).
 *
 * - Cancellation propagates top-down (parent CANCEL_REQUESTED before children).
 * - Resource release and final drain proceed bottom-up (children first).
 * - Logical terminal status and cleanup status are separate fields: a
 *   completed task with leaked resources is NOT reported as clean.
 * - Child terminal state, ownership release, and the durable parent
 *   notification are one canonical compound record (the parent's inbox
 *   envelope; see inbox.mjs settleHandoff).
 */
export const RUN_STATES = ["ADMITTED", "RUNNING", "CANCEL_REQUESTED", "TERMINAL", "DRAINED"];

export class RunNode {
  /**
   * @param {object} opts {runId, parent?, resourceKind?}
   */
  constructor(opts) {
    this.runId = opts.runId;
    this.parent = opts.parent ?? null;
    this.resourceKind = opts.resourceKind ?? "none";
    this.state = "ADMITTED";
    this.children = [];
    this.logicalOutcome = null; // completed | failed | cancelled
    this.cleanup = null; // {clean: boolean, leaked: string[]}
    this.releaseOrder = [];
    if (this.parent) this.parent.children.push(this);
  }

  start() {
    if (this.state !== "ADMITTED") throw new Error(`cannot start ${this.state} run`);
    this.state = "RUNNING";
    return this;
  }

  /** Top-down: cancel self first, then every descendant. */
  cancel(reason = "user") {
    if (this.state !== "RUNNING" && this.state !== "ADMITTED") return this;
    this.state = "CANCEL_REQUESTED";
    this.cancelReason = reason;
    this.cancelled = true;
    for (const c of this.children) c.cancel(reason);
    return this;
  }

  /**
   * Bottom-up release: children drain first, then self. Returns the drain
   * order. A node with a leaked resource is reported not-clean regardless of
   * its logical outcome.
   */
  release({ leaked = [] } = {}) {
    const order = [];
    const releaseNode = (node) => {
      for (const c of node.children) releaseNode(c);
      node.cleanup = { clean: leaked.length === 0, leaked };
      node.releaseOrder.push(node.runId);
      order.push(node.runId);
    };
    releaseNode(this);
    this.state = "TERMINAL";
    this.cleanupFinal = { clean: leaked.length === 0, leaked };
    return order;
  }

  /** Mark logical completion; cleanup status stays separate. */
  complete() {
    this.logicalOutcome = "completed";
    return this;
  }

  fail() {
    this.logicalOutcome = "failed";
    return this;
  }

  /** Terminal only when logical outcome AND cleanup are both settled. */
  drain() {
    this.state = "DRAINED";
    return this;
  }

  /** A completed task with leaked resources is never reported clean. */
  report() {
    const leaked = this.cleanup?.leaked ?? this.cleanupFinal?.leaked ?? [];
    return {
      runId: this.runId,
      state: this.state,
      logicalOutcome: this.logicalOutcome ?? (this.cancelled ? "cancelled" : "unknown"),
      cleanup: { clean: leaked.length === 0, leaked },
      childrenDrained: this.children.every((c) => c.state === "DRAINED" || c.state === "TERMINAL"),
    };
  }
}

/** Top-down cancellation + bottom-up release on a root run tree. */
export function cancelAndDrain(root, { leaked = [] } = {}) {
  root.cancel();
  const releaseOrder = root.release({ leaked });
  root.drain();
  return { releaseOrder, report: root.report() };
}
