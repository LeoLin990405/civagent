/**
 * fork.mjs — P2 runtime: deterministic fork of a balanced completed prefix.
 *
 * Plan §9.2: a fork copies only the balanced prefix ending at the last
 * COMPLETED turn, pinning directParentSessionId, rootSessionId, source surface
 * revision, copied-prefix artifact digests, and a deterministic forkHash. An
 * incomplete assistant/tool exchange is never copied. Resume creates a new
 * Activation epoch for the same session; it never mutates the prior activation.
 */
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

/**
 * @param {object} source {sessionId, rootSessionId, directParentSessionId,
 *                         surfaceRevision, committedEvents, artifactDigests}
 *   committedEvents: canonical events of the source session in seq order
 * @returns {object} {forkHash, pinned, prefix, copiedEventCount}
 */
export function forkBalancedPrefix(source) {
  // balanced prefix: every event up to and including the last committed
  // surface.revision (a surface revision is only committed after a COMPLETED
  // turn, so the prefix ends at the last completed turn). Anything after it —
  // an in-flight assistant/tool exchange — is never copied.
  let cut = 0;
  for (let i = 0; i < source.committedEvents.length; i++) {
    if (source.committedEvents[i].type === "surface.revision") cut = i + 1;
  }
  const prefix = source.committedEvents.slice(0, cut);
  const pinned = {
    directParentSessionId: source.directParentSessionId ?? source.sessionId,
    rootSessionId: source.rootSessionId ?? source.sessionId,
    sourceSessionId: source.sessionId,
    sourceSurfaceRevision: source.surfaceRevision,
    copiedPrefixDigests: prefix.map((ev) => ev.payloadDigest),
    artifactDigests: [...(source.artifactDigests ?? [])].sort(),
  };
  const forkHash = sha256Hex(Buffer.from(canonicalJson(pinned)));
  return { forkHash, pinned, prefix, copiedEventCount: prefix.length };
}
