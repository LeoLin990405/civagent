/**
 * epoch-rules.mjs — dependency-free enforcement of the P0 contract rules:
 * epoch separation, no pooling, canonical event shape, ID discipline.
 *
 * Used by packages/next/contracts/test/epoch.test.mjs and by the legacy
 * importer (packages/next/legacy-importer/map.mjs).
 */
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const EPOCHS = ["legacy-cc-v5", "native-next-v1"];
export const CANONICAL_TYPES = [
  // legacy import surface
  "match.admitted", "turn.observed", "operation.observed", "judge.observed",
  "skill.event", "mechanism.triggered", "match.terminal", "legacy.unmapped",
  // native runtime surface
  "turn.claimed", "model.start_intent", "model.raw_chunk", "model.response",
  "model.error", "model.cancelled", "surface.revision", "operation.outcome",
  "recovery.completed",
  // native durable inbox (P2)
  "handoff/accepted_and_target_enqueued", "handoff/terminal_and_parent_enqueued", "handoff/claimed",
];
export const LEGACY_EPOCH = "legacy-cc-v5";
export const LEGACY_BASELINE = "1460441528069465dca7263dba3e9ac01b18c78a";
export const LEGACY_INSTRUMENT = `${LEGACY_EPOCH}-${LEGACY_BASELINE.slice(0, 7)}`;
export const EVENT_SCHEMA = "civ.event/1";

/** Deterministic canonical JSON: sorted keys, no whitespace. */
export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
}

export function sha256Hex(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

/**
 * Validate one canonical event object. Returns an array of violation strings
 * (empty when valid). Mirrors contracts/schemas/event.schema.json.
 */
export function validateCanonicalEvent(ev) {
  const violations = [];
  const required = ["schema", "epoch", "instrumentVersion", "generation", "seq", "eventId", "ts", "matchId", "type", "payloadDigest"];
  for (const k of required) if (ev[k] === undefined || ev[k] === null) violations.push(`missing required field ${k}`);
  if (ev.schema !== undefined && ev.schema !== EVENT_SCHEMA) violations.push(`schema ${ev.schema} != ${EVENT_SCHEMA}`);
  if (ev.epoch !== undefined && !EPOCHS.includes(ev.epoch)) violations.push(`unknown epoch ${ev.epoch}`);
  if (ev.type !== undefined && !CANONICAL_TYPES.includes(ev.type)) violations.push(`unknown type ${ev.type}`);
  if (ev.seq !== undefined && (!Number.isInteger(ev.seq) || ev.seq < 0)) violations.push(`bad seq ${ev.seq}`);
  if (ev.generation !== undefined && (!Number.isInteger(ev.generation) || ev.generation < 1)) violations.push(`bad generation ${ev.generation}`);
  if (ev.artifactRefs !== undefined) {
    if (!Array.isArray(ev.artifactRefs)) violations.push("artifactRefs must be an array");
    else for (const ref of ev.artifactRefs) if (!/^sha256:[0-9a-f]{64}$/.test(ref)) violations.push(`bad artifact ref ${ref}`);
  }
  if (ev.payloadDigest !== undefined && !/^[0-9a-f]{64}$/.test(ev.payloadDigest)) violations.push(`bad payloadDigest ${ev.payloadDigest}`);
  const digest = ev.payload === undefined ? null : sha256Hex(Buffer.from(canonicalJson(ev.payload)));
  if (digest !== null && ev.payloadDigest !== undefined && digest !== ev.payloadDigest) violations.push("payloadDigest does not match payload bytes");
  return violations;
}

/**
 * Epoch separation (plan §2 invariant 2): a match cannot change epoch after
 * admission. Throws when events of one matchId mix epochs or instruments.
 */
export function assertEpochSeparation(events, { matchId } = {}) {
  const epochs = new Set();
  const instruments = new Set();
  for (const ev of events) {
    epochs.add(ev.epoch);
    instruments.add(ev.instrumentVersion);
  }
  if (epochs.size > 1) {
    throw new Error(`epoch pooling: match ${matchId ?? "?"} mixes epochs ${[...epochs].join(", ")}`);
  }
  if (instruments.size > 1) {
    throw new Error(`instrument pooling: match ${matchId ?? "?"} mixes instruments ${[...instruments].join(", ")}`);
  }
  return { epoch: [...epochs][0], instrumentVersion: [...instruments][0] };
}

/**
 * ID discipline (plan §7): eventId unique within a match, seq strictly
 * monotonic per match, spanId unique. Throws on violation.
 */
export function assertIdDiscipline(events, { matchId } = {}) {
  const seen = new Set();
  let prevSeq = -1;
  for (const ev of events) {
    if (seen.has(ev.eventId)) throw new Error(`duplicate eventId ${ev.eventId} in match ${matchId ?? "?"}`);
    seen.add(ev.eventId);
    if (ev.seq <= prevSeq) throw new Error(`non-monotonic seq ${ev.seq} after ${prevSeq} in match ${matchId ?? "?"}`);
    prevSeq = ev.seq;
    if (ev.spanId !== undefined && ev.spanId !== null) {
      if (seen.has(`span:${ev.spanId}`)) throw new Error(`duplicate spanId ${ev.spanId} in match ${matchId ?? "?"}`);
      seen.add(`span:${ev.spanId}`);
    }
  }
}

export const JSON_SCHEMA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "schemas");
