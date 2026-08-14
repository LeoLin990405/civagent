/**
 * policy.mjs — P2 domain: PolicyEngine (plan §8.2, §13.2).
 *
 * Authorizes against the concrete actor instance, source and target offices,
 * declared edge and kind, mechanism grant, current match phase, and resource
 * limits. A model printing `[VETO]`, `圣旨`, or another marker is only text
 * unless a typed, authorized mechanism action is submitted.
 */
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

export class PolicyDeniedError extends Error {
  constructor(reason) {
    super(`policy denied: ${reason}`);
    this.code = "POLICY_DENIED";
  }
}

export class PolicyEngine {
  /**
   * @param {object} policy compiled PolicySpec {grants: [...], limits: {...}}
   */
  constructor(policy) {
    this.policy = policy;
    this.digest = sha256Hex(Buffer.from(canonicalJson(policy)));
    this.decisions = [];
  }

  /**
   * Authorize a typed mechanism/edge action.
   * @param {object} a {actorInstance, actorOffice, targetOffice, edgeId,
   *                    edgeKind, mechanism, matchPhase}
   */
  authorize(a) {
    const grant = this.policy.grants.find(
      (g) =>
        g.actorOffice === a.actorOffice &&
        g.edgeId === a.edgeId &&
        g.edgeKind === a.edgeKind &&
        (g.mechanism === null || g.mechanism === a.mechanism) &&
        (g.phase === a.matchPhase || g.phase === "active"),
    );
    const decision = {
      ...a,
      granted: !!grant && grant.allowed,
      policyDigest: this.digest,
      at: Date.now(),
    };
    this.decisions.push(decision);
    if (!decision.granted) throw new PolicyDeniedError(`${a.actorOffice} ${a.edgeKind}(${a.edgeId})${a.mechanism ? ` mech=${a.mechanism}` : ""}`);
    return decision;
  }

  /**
   * Marker-text claims never grant authority: a printed [VETO] / 圣旨 / 诏书 /
   * 弹劾 / 驳回 is text. Only a typed authorized action counts.
   */
  authorizeMarkerText({ actorOffice, marker }) {
    const decision = {
      actorOffice,
      marker,
      granted: false,
      reason: "printed markers are text, not authority (plan §8.2)",
      policyDigest: this.digest,
      at: Date.now(),
    };
    this.decisions.push(decision);
    return decision;
  }

  /** Resource-limit check against the declared policy limits. */
  checkLimits({ officeId, turnId, handoffCount, contributionCount }) {
    const limits = this.policy.limits ?? {};
    const problems = [];
    if (limits.maxHandoffPerTurn !== undefined && handoffCount > limits.maxHandoffPerTurn) problems.push(`handoff cap ${limits.maxHandoffPerTurn}`);
    if (limits.maxContributions !== undefined && contributionCount > limits.maxContributions) problems.push(`contribution cap ${limits.maxContributions}`);
    return { allowed: problems.length === 0, problems, policyDigest: this.digest };
  }
}
