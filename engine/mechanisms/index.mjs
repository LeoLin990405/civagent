// engine/mechanisms/index.mjs — Unified V6 Constitutional Mechanism Engine
// Composes veto, impeach, and edict into a clean, testable API.

import { checkVeto } from './veto.mjs';
import { checkImpeach } from './impeach.mjs';
import { checkEdict } from './edict.mjs';

/**
 * MechanismEngine — orchestrates all V6 constitutional mechanisms.
 * 
 * Usage:
 *   const engine = new MechanismEngine(eventLog, ccProcess, allowedMechanisms);
 *   engine.process(chunk);          // feed each stdout chunk
 *   engine.getStats();              // { vetoes, impeachments, edicts }
 *   engine.reset();                 // reset per-turn state
 */
export class MechanismEngine {
  constructor(eventLog, ccProcess, allowedMechanisms = ['VETO', 'IMPEACH', 'EDICT']) {
    this.allowed = new Set(allowedMechanisms.map(m => m.toUpperCase()));
    this.context = {
      vetoTriggered: false,
      vetoImmunity: false,
      edictTriggered: false,
      impeachments: new Set(),
      log: eventLog,
      ccProcess: ccProcess,
    };
    // Stats for analytics
    this._stats = { vetoes: 0, impeachments: 0, edicts: 0 };
  }

  /**
   * Process a text chunk from agent output.
   * Returns an object describing which mechanisms fired, if any.
   */
  process(chunk) {
    const fired = { veto: false, impeach: false, edict: false };

    if (this.allowed.has('EDICT') && checkEdict(chunk, this.context)) {
      fired.edict = true;
      this._stats.edicts++;
    }

    if (this.allowed.has('IMPEACH') && checkImpeach(chunk, this.context)) {
      fired.impeach = true;
      this._stats.impeachments++;
    }

    if (this.allowed.has('VETO') && checkVeto(chunk, this.context)) {
      fired.veto = true;
      this._stats.vetoes++;
    }

    return fired;
  }

  /**
   * Reset per-turn mechanism state (e.g., between debate rounds).
   * Keeps cumulative stats and impeachment history.
   */
  resetTurn() {
    this.context.vetoTriggered = false;
    this.context.edictTriggered = false;
    this.context.vetoImmunity = false;
  }

  /** Get cumulative mechanism statistics. */
  getStats() {
    return { ...this._stats };
  }

  /** Get the list of impeached targets so far. */
  getImpeachments() {
    return [...this.context.impeachments];
  }

  /** Check if a specific mechanism is allowed for this regime. */
  isAllowed(mechanism) {
    return this.allowed.has(mechanism.toUpperCase());
  }
}

// Re-export individual checkers for backward compatibility
export { checkVeto } from './veto.mjs';
export { checkImpeach } from './impeach.mjs';
export { checkEdict } from './edict.mjs';
