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
   * Process a text chunk from agent output (legacy API — no provenance gating).
   * Kept backward-compatible for existing tests and callers that don't pass
   * structured provenance. Production code in run-v5.mjs uses processStructured().
   */
  process(chunk) {
    const fired = { veto: false, impeach: false, edict: false };
    const chunkText = typeof chunk === "string" ? chunk : String(chunk ?? "");

    if (this.allowed.has('EDICT') && checkEdict(chunkText, this.context)) {
      fired.edict = true;
      this._stats.edicts++;
    }

    if (this.allowed.has('IMPEACH') && checkImpeach(chunkText, this.context)) {
      fired.impeach = true;
      this._stats.impeachments++;
    }

    if (this.allowed.has('VETO') && checkVeto(chunkText, this.context)) {
      fired.veto = true;
      this._stats.vetoes++;
    }

    return fired;
  }

  /**
   * Process a text chunk WITH provenance information. This is the primary API
   * called by run-v5.mjs.
   *
   * Provenance gates:
   *   1. `actor` must be non-null. Null actors (unparseable lines, system
   *      messages without attribution) are REJECTED.
   *   2. `messageRole`, when present, must be "assistant". User-role messages
   *      are REJECTED. A null messageRole (legacy plain-text backend without
   *      stream-json) is ALLOWED for backward compatibility.
   *   3. `contentItems` must not contain any `tool_result` items. Tool results
   *      carry untrusted external content that can contain marker injection.
   *
   * @param {{ text: string, actor: string|null, messageRole: string|null,
   *          contentItems: Array<{type: string}> }} chunk
   * @returns {{ veto: boolean, impeach: boolean, edict: boolean }}
   */
  processStructured({ text, actor, messageRole, contentItems }) {
    const fired = { veto: false, impeach: false, edict: false };

    // Gate 1: must have an actor (null = unknown origin → reject).
    if (typeof actor !== "string" || actor.length === 0) {
      return fired;
    }

    // Gate 2: if messageRole is present, it must be "assistant".
    // null messageRole = legacy plain-text backend → allowed.
    if (messageRole !== null && messageRole !== undefined && messageRole !== "assistant") {
      return fired;
    }

    // Gate 3: must not contain tool_result content items.
    const items = Array.isArray(contentItems) ? contentItems : [];
    const hasToolResult = items.some((item) => item?.type === "tool_result");
    if (hasToolResult) {
      return fired;
    }

    const chunkText = typeof text === "string" ? text : String(text ?? "");

    if (this.allowed.has("EDICT") && checkEdict(chunkText, this.context)) {
      fired.edict = true;
      this._stats.edicts++;
    }

    if (this.allowed.has("IMPEACH") && checkImpeach(chunkText, this.context)) {
      fired.impeach = true;
      this._stats.impeachments++;
    }

    if (this.allowed.has("VETO") && checkVeto(chunkText, this.context)) {
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
