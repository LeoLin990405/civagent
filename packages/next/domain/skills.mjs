/**
 * skills.mjs — P4 domain: audited skill provenance (plan §11.5).
 *
 * Skills move through PROPOSED -> AUDITED -> PROMOTED -> REVOKED (or
 * AUDITED -> REJECTED) with immutable content hashes, author/extractor call
 * lineage, audit evidence, approval identity, and effective time. A match pins
 * exactly one skill-set digest. There are no live symlinks, mutable shared
 * HOME, or silent self-modification.
 */
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

export const SKILL_STATES = ["PROPOSED", "AUDITED", "PROMOTED", "REVOKED", "REJECTED"];

const TRANSITIONS = {
  PROPOSED: ["AUDITED", "REJECTED"],
  AUDITED: ["PROMOTED", "REJECTED", "REVOKED"],
  PROMOTED: ["REVOKED"],
  REVOKED: [],
  REJECTED: [],
};

export class Skill {
  /**
   * @param {object} opts {skillId, contentHash, authorMatchId, extractorCallId,
   *                       body}
   */
  constructor(opts) {
    this.skillId = opts.skillId;
    this.contentHash = opts.contentHash; // immutable content pin
    this.authorMatchId = opts.authorMatchId;
    this.extractorCallId = opts.extractorCallId; // causal lineage
    this.body = opts.body;
    this.state = "PROPOSED";
    this.auditEvidence = null;
    this.approvalIdentity = null;
    this.effectiveTime = null;
    this.revokeReason = null;
  }

  _go(to) {
    if (!TRANSITIONS[this.state].includes(to)) throw new Error(`illegal skill transition ${this.state} -> ${to}`);
    this.state = to;
    return this;
  }

  /** Independent audit evidence (purpose "auditor" call, correlated). */
  audited({ auditCallId, auditProvider, verdict }) {
    if (!["approve", "reject"].includes(verdict)) throw new Error(`verdict must be approve|reject, got ${verdict}`);
    this.auditEvidence = { auditCallId, auditProvider, verdict, at: Date.now() };
    return this._go("AUDITED");
  }

  /** Promotion requires an approval identity (supply-chain gate). */
  promoted({ approvalIdentity }) {
    if (!this.auditEvidence || this.auditEvidence.verdict !== "approve") throw new Error("cannot promote without an approving audit");
    this.approvalIdentity = approvalIdentity;
    this.effectiveTime = Date.now();
    return this._go("PROMOTED");
  }

  rejected() {
    return this._go("REJECTED");
  }

  revoked(reason) {
    this.revokeReason = reason;
    return this._go("REVOKED");
  }

  get digest() {
    return sha256Hex(Buffer.from(canonicalJson({
      skillId: this.skillId, contentHash: this.contentHash, state: this.state,
      authorMatchId: this.authorMatchId, auditEvidence: this.auditEvidence,
      approvalIdentity: this.approvalIdentity, effectiveTime: this.effectiveTime,
    })));
  }
}

/** A match pins exactly one skill-set digest over its promoted skills. */
export function skillSetDigest(skills) {
  return sha256Hex(Buffer.from(canonicalJson({
    skills: skills.filter((s) => s.state === "PROMOTED").map((s) => ({ skillId: s.skillId, contentHash: s.contentHash })),
  })));
}
