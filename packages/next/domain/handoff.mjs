/**
 * handoff.mjs — P2 domain: typed HandoffRequest and the Handoff state machine.
 *
 * Plan §8.2: GraphDispatcher accepts only a HandoffRequest; printed markers,
 * natural-language claims, or provider tool metadata have no authority. The
 * state machine follows plan §9.3:
 *   PROPOSED -> REJECTED (schema/policy/edge denied)
 *   PROPOSED -> ACCEPTED (durable inbox enqueue)
 *   ACCEPTED -> CLAIMED (target session claims FIFO head)
 *   CLAIMED -> RUNNING -> CONTRIBUTED -> SETTLED (join policy satisfied)
 *   RUNNING -> FAILED -> SETTLED
 *   RUNNING -> CANCEL_REQUESTED -> SETTLED
 */
export const HANDOFF_STATES = ["PROPOSED", "REJECTED", "ACCEPTED", "CLAIMED", "RUNNING", "CONTRIBUTED", "FAILED", "CANCEL_REQUESTED", "SETTLED"];
export const EDGE_KINDS = ["command", "review", "information", "vote", "escalation"];
export const JOIN_POLICIES = ["await", "notify", "quorum"];
export const HANDOFF_MODES = ["one-shot", "continuable"];
export const HANDOFF_CONTEXTS = ["fresh", "fork"];

const TRANSITIONS = {
  PROPOSED: ["REJECTED", "ACCEPTED"],
  REJECTED: ["SETTLED"],
  ACCEPTED: ["CLAIMED", "CANCEL_REQUESTED"],
  CLAIMED: ["RUNNING", "FAILED", "SETTLED"], // SETTLED from CLAIMED = notify/join-at-claim
  RUNNING: ["CONTRIBUTED", "FAILED", "CANCEL_REQUESTED"],
  CONTRIBUTED: ["SETTLED", "CANCEL_REQUESTED"],
  FAILED: ["SETTLED"],
  CANCEL_REQUESTED: ["SETTLED"],
  SETTLED: [],
};

export class Handoff {
  /**
   * @param {object} req validated HandoffRequest (see validateHandoffRequest)
   */
  constructor(req) {
    this.handoffId = req.handoffId;
    this.sourceOfficeId = req.sourceOfficeId;
    this.sourceSessionId = req.sourceSessionId;
    this.targetOfficeId = req.targetOfficeId;
    this.targetSessionId = req.targetSessionId;
    this.edgeId = req.edgeId;
    this.edgeKind = req.edgeKind;
    this.artifactRefs = req.artifactRefs ?? [];
    this.causalParentId = req.causalParentId;
    this.mode = req.mode;
    this.context = req.context;
    this.joinPolicy = req.joinPolicy;
    this.idempotencyKey = req.idempotencyKey;
    this.state = "PROPOSED";
    this.rejectReason = null;
    this.terminal = null; // {classification, outputRefs, ownershipRelease, parentNotice}
    this.participation = { invoked: false, started: false, contributed: false, settled: false };
  }

  _go(to, note) {
    if (!TRANSITIONS[this.state].includes(to)) {
      throw new Error(`illegal handoff transition ${this.state} -> ${to}`);
    }
    this.state = to;
    return this;
  }

  reject(reason) {
    this.rejectReason = reason;
    return this._go("REJECTED");
  }

  /** Durable enqueue into the target inbox (single compound record). */
  accepted() {
    this.participation.invoked = true;
    return this._go("ACCEPTED");
  }

  /** Target session claimed the FIFO head. */
  claimed() {
    this.participation.started = true;
    return this._go("CLAIMED");
  }

  running() {
    return this._go("RUNNING");
  }

  contributed(artifactRefs = []) {
    this.participation.contributed = true;
    this.contributionRefs = artifactRefs;
    return this._go("CONTRIBUTED");
  }

  failed() {
    return this._go("FAILED");
  }

  cancelRequested() {
    return this._go("CANCEL_REQUESTED");
  }

  /**
   * Settle with the child terminal classification and the complete parent
   * notice (plan §9.1: one canonical compound record).
   */
  settled(terminal) {
    this.terminal = terminal;
    this.participation.settled = true;
    return this._go("SETTLED");
  }
}

/**
 * Validate a raw HandoffRequest against the contract. Returns
 * {valid: true, request} or {valid: false, reasons: [...]}. Structural only —
 * graph/policy checks happen in GraphDispatcher/PolicyEngine.
 */
export function validateHandoffRequest(raw) {
  const reasons = [];
  const str = (v) => typeof v === "string" && v.length > 0;
  if (!str(raw.handoffId)) reasons.push("handoffId required");
  if (!str(raw.sourceOfficeId)) reasons.push("sourceOfficeId required");
  if (!str(raw.sourceSessionId)) reasons.push("sourceSessionId required");
  if (!str(raw.targetOfficeId)) reasons.push("targetOfficeId required");
  if (!str(raw.targetSessionId)) reasons.push("targetSessionId required");
  if (!str(raw.edgeId)) reasons.push("edgeId required");
  if (!EDGE_KINDS.includes(raw.edgeKind)) reasons.push(`edgeKind must be one of ${EDGE_KINDS.join("/")}`);
  if (!str(raw.causalParentId)) reasons.push("causalParentId required");
  if (!HANDOFF_MODES.includes(raw.mode)) reasons.push(`mode must be one of ${HANDOFF_MODES.join("/")}`);
  if (!HANDOFF_CONTEXTS.includes(raw.context)) reasons.push(`context must be one of ${HANDOFF_CONTEXTS.join("/")}`);
  if (!JOIN_POLICIES.includes(raw.joinPolicy)) reasons.push(`joinPolicy must be one of ${JOIN_POLICIES.join("/")}`);
  if (!str(raw.idempotencyKey)) reasons.push("idempotencyKey required");
  if (raw.artifactRefs !== undefined && !Array.isArray(raw.artifactRefs)) reasons.push("artifactRefs must be an array");
  return reasons.length ? { valid: false, reasons } : { valid: true, request: raw };
}

/** Join-policy check: has the handoff reached its declared terminal condition? */
export function joinSatisfied(handoff, { contributionCount = 1, quorumSize = 1 } = {}) {
  switch (handoff.joinPolicy) {
    case "await":
      return handoff.state === "CONTRIBUTED" || handoff.state === "FAILED";
    case "notify":
      return handoff.state === "CLAIMED" || handoff.state === "RUNNING" || handoff.state === "CONTRIBUTED" || handoff.state === "FAILED";
    case "quorum":
      return contributionCount >= quorumSize && handoff.state === "CONTRIBUTED";
    default:
      return false;
  }
}
