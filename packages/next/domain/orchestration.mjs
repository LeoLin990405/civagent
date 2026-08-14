/**
 * orchestration.mjs — P2 domain: orchestration modes and participation metrics.
 *
 * Plan §8.3: the manifest declares exactly one mode; modes are separate
 * experimental treatments and cannot be pooled. Participation metrics are
 * distinct: invoked / started / contributed / settled — one metric may not
 * stand in for another.
 */
export const ORCHESTRATION_MODES = ["observational", "roster_enforced", "graph_enforced"];

export class OrchestrationRun {
  /**
   * @param {object} opts {runId, mode, regimeId, epoch, instrumentVersion,
   *                       requiredOffices: string[]}
   */
  constructor(opts) {
    if (!ORCHESTRATION_MODES.includes(opts.mode)) throw new Error(`unknown orchestration mode ${opts.mode}`);
    this.runId = opts.runId;
    this.mode = opts.mode;
    this.regimeId = opts.regimeId;
    this.epoch = opts.epoch;
    this.instrumentVersion = opts.instrumentVersion;
    this.requiredOffices = opts.requiredOffices ?? [];
    this.offices = new Map(); // officeId -> {invoked, started, contributed, settled}
  }

  _office(officeId) {
    if (!this.offices.has(officeId)) {
      this.offices.set(officeId, { invoked: 0, started: 0, contributed: 0, settled: 0 });
    }
    return this.offices.get(officeId);
  }

  recordInvoked(officeId) { this._office(officeId).invoked++; }
  recordStarted(officeId) { this._office(officeId).started++; }
  recordContributed(officeId) { this._office(officeId).contributed++; }
  recordSettled(officeId) { this._office(officeId).settled++; }

  /**
   * Roster completeness: every required office must have at least one
   * invoked handoff. Only meaningful in roster_enforced / graph_enforced.
   */
  rosterCompleteness() {
    // participation, not handoff-invocation only: the entry office (no incoming
    // handoff) participates by starting/contributing. One metric never stands
    // in for another — invoked/started/contributed/settled stay distinct.
    const missing = this.requiredOffices.filter((o) => {
      const m = this.offices.get(o);
      return !m || (m.invoked === 0 && m.started === 0 && m.contributed === 0 && m.settled === 0);
    });
    return {
      mode: this.mode,
      required: this.requiredOffices.length,
      missing,
      complete: missing.length === 0,
    };
  }

  /** Mode-tagged participation ledger (never pooled across modes). */
  participation() {
    return {
      runId: this.runId,
      mode: this.mode,
      regimeId: this.regimeId,
      epoch: this.epoch,
      instrumentVersion: this.instrumentVersion,
      offices: Object.fromEntries(
        [...this.offices.entries()].map(([id, m]) => [id, { ...m }]).sort((a, b) => a[0].localeCompare(b[0])),
      ),
    };
  }
}
