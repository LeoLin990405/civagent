/**
 * tournament.mjs — P4 domain: owned tournament scheduling and eligibility.
 *
 * Plan §7/§17 P4:
 * - A Tournament owns its matches: concurrency/deadline caps, admission,
 *   cancellation, and join. No detached run or uncapped fan-out.
 * - One match = one task/regime/provider/seed assignment; a match belongs to
 *   exactly one tournament and one epoch.
 * - The four E3 provider strata (doubao, glm, qwen, minimax) are explicit
 *   blocks: a match row must declare its stratum; unknown or mixed strata are
 *   rejected. No silent provider insertion (plan §12.2).
 * - Ineligible or one-sided pairs cannot enter the pool.
 */
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

export const E3_STRATA_BLOCKS = ["cn:doubao", "cn:glm", "cn:qwen", "cn:minimax"];
export const MATCH_STATES = ["ASSIGNED", "ADMITTED", "RUNNING", "TERMINAL", "CANCELLED"];

export class EligibilityError extends Error {}

/** Eligibility rules for one match entry (plan §17 P4 acceptance). */
export function checkEligibility({ regime, ir, provider, stratum, seed, paired, solo }) {
  const problems = [];
  if (!ir) problems.push(`regime ${regime} has no compiled RegimeIR`);
  if (!E3_STRATA_BLOCKS.includes(stratum)) problems.push(`stratum ${stratum} not in E3 strata block (${E3_STRATA_BLOCKS.join("/")})`);
  if (!provider) problems.push("provider required");
  if (seed === undefined || seed === null) problems.push("seed required");
  // a comparison-pool entry needs its pair completed; only an explicit solo
  // declaration may enter unpaired
  if (!paired?.completed && !solo) problems.push("one-sided pair cannot enter the pool");
  return problems;
}

export class Tournament {
  /**
   * @param {object} opts {tournamentId, epoch, instrumentVersion, designVersion,
   *                       task, deadlineMs, caps: {global, perParent, perOffice}}
   */
  constructor(opts) {
    this.tournamentId = opts.tournamentId;
    this.epoch = opts.epoch;
    this.instrumentVersion = opts.instrumentVersion;
    this.designVersion = opts.designVersion;
    this.task = opts.task;
    this.deadlineMs = opts.deadlineMs;
    this.caps = { global: opts.caps?.global ?? 8, perParent: opts.caps?.perParent ?? 4, perOffice: opts.caps?.perOffice ?? 2 };
    this.matches = []; // owned matches: {matchId, regime, provider, stratum, seed, arm, state}
    this.running = 0;
    this.closedForAdmission = false;
    this.scores = null;
  }

  get digest() {
    return sha256Hex(Buffer.from(canonicalJson({
      tournamentId: this.tournamentId, epoch: this.epoch, instrumentVersion: this.instrumentVersion,
      designVersion: this.designVersion, task: this.task, caps: this.caps,
    })));
  }

  /** Admission: eligibility + caps + deadline. Fails before any run starts. */
  admit({ matchId, regime, ir, provider, stratum, seed, arm, paired }) {
    if (this.closedForAdmission) throw new EligibilityError(`admission closed (deadline ${this.deadlineMs})`);
    if (Date.now() > this.deadlineMs) {
      this.closedForAdmission = true;
      throw new EligibilityError("deadline passed");
    }
    const problems = checkEligibility({ regime, ir, provider, stratum, seed, paired });
    if (problems.length) throw new EligibilityError(problems.join("; "));
    if (this.matches.length >= this.caps.global) throw new EligibilityError(`global cap ${this.caps.global} reached`);
    if (this.matches.filter((m) => m.regime === regime && m.state === "RUNNING").length >= this.caps.perParent) {
      throw new EligibilityError(`per-regime cap ${this.caps.perParent} reached`);
    }
    if (this.matches.filter((m) => m.regime === regime && m.state === "RUNNING").length >= this.caps.perOffice) {
      throw new EligibilityError(`per-office cap ${this.caps.perOffice} reached`);
    }
    const match = { matchId, regime, provider, stratum, seed, arm, state: "ADMITTED" };
    this.matches.push(match);
    return match;
  }

  startMatch(matchId) {
    const m = this.matches.find((x) => x.matchId === matchId);
    if (!m) throw new Error(`match ${matchId} not owned by tournament ${this.tournamentId}`);
    if (m.state !== "ADMITTED") throw new Error(`match ${matchId} state ${m.state}`);
    m.state = "RUNNING";
    this.running++;
    return m;
  }

  terminalMatch(matchId, { status, score } = {}) {
    const m = this.matches.find((x) => x.matchId === matchId);
    m.state = "TERMINAL";
    m.status = status;
    m.score = score;
    this.running--;
    return m;
  }

  cancelMatch(matchId) {
    const m = this.matches.find((x) => x.matchId === matchId);
    m.state = "CANCELLED";
    if (m.state === "RUNNING") this.running--;
    return m;
  }

  /** Join: true when every admitted match reached a terminal state. */
  joined() {
    return this.matches.length > 0 && this.matches.every((m) => m.state === "TERMINAL" || m.state === "CANCELLED");
  }

  /** No detached run: every running match is owned by this tournament. */
  assertOwned(matchId) {
    if (!this.matches.some((m) => m.matchId === matchId)) throw new Error(`detached run: match ${matchId} not owned`);
  }

  rank() {
    const pool = this.matches.filter((m) => m.state === "TERMINAL" && m.score !== undefined);
    return [...pool].sort((a, b) => b.score - a.score).map((m, i) => ({
      rank: i + 1, matchId: m.matchId, regime: m.regime, stratum: m.stratum, score: m.score,
    }));
  }

  /** Epoch-scoped snapshot; never pooled with other tournaments/epochs. */
  snapshot() {
    return {
      tournamentId: this.tournamentId,
      epoch: this.epoch,
      instrumentVersion: this.instrumentVersion,
      designVersion: this.designVersion,
      task: this.task,
      digest: this.digest,
      matches: this.matches.map((m) => ({ matchId: m.matchId, regime: m.regime, provider: m.provider, stratum: m.stratum, seed: m.seed, state: m.state, score: m.score ?? null })),
      ranking: this.rank(),
    };
  }
}
