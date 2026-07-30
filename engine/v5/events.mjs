// events.mjs — structured per-match event log + metadata.
//
// This is the stable contract the frontend (antigravity) consumes. A match writes
// JSONL events to ~/.civagent/matches/<matchId>/events.jsonl and a meta.json
// summary. See schemas/match-event.schema.json for the line format.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export const ROOT = path.join(os.homedir(), ".civagent");

export const EVENT_TYPES = [
  "match_start", "turn", "tool", "judge", "skill", "match_end",
  // V6 constitutional mechanisms — emitted by engine/mechanisms/* when a
  // [VETO] / [IMPEACH] / [EDICT] marker fires during a match.
  "veto_triggered", "impeach_triggered", "edict_triggered",
];

// ── OTel-style envelope (schema v2) ─────────────────────────────────────────
// Added back-compatibly: every event keeps its legacy fields (matchId, seq, ts,
// type, ...) and additionally carries a trace/span envelope so event streams can
// be correlated across matches, judges, and skill sedimentation.
export const SCHEMA_VERSION = "2.0";

// Fine-grained kind per legacy coarse type. Coexists with `type`; consumers that
// only know `type` are unaffected.
export const KIND_BY_TYPE = {
  match_start: "match_start",
  turn: "turn",
  tool: "tool_call",
  judge: "judge_score",
  skill: "skill_commit",
  match_end: "match_end",
  veto_triggered: "veto_triggered",
  impeach_triggered: "impeach_triggered",
  edict_triggered: "edict_triggered",
};

// Default producer per type when the emitter doesn't pass an explicit actor.
const DEFAULT_ACTOR_BY_TYPE = {
  judge: "judge",
  skill: "skill-learner",
  match_end: "system",
  veto_triggered: "system",
  impeach_triggered: "system",
  edict_triggered: "system",
};

// sha256 of `input`, truncated to 16 hex chars (64 bits) — enough to detect
// prompt/payload drift without storing the full digest.
export function hashShort(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex").slice(0, 16);
}

// 16 hex chars, mirroring OTel span-id width.
export function newSpanId() {
  return crypto.randomBytes(8).toString("hex");
}

export function matchDir(matchId) {
  const dir = path.join(ROOT, "matches", String(matchId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function eventsPath(matchId) {
  return path.join(matchDir(matchId), "events.jsonl");
}

export function metaPath(matchId) {
  return path.join(matchDir(matchId), "meta.json");
}

// Append-only JSONL writer with a monotonic seq per match.
export class EventLog {
  constructor(matchId) {
    this.matchId = String(matchId);
    this.path = eventsPath(this.matchId);
    this.stream = fs.createWriteStream(this.path, { flags: "a" });
    this.seq = 0;
    // Root span of this trace; match_start adopts it, all other events default
    // to being its children unless the caller passes an explicit parent.
    this.rootSpanId = newSpanId();
  }

  emit(type, fields = {}) {
    if (!EVENT_TYPES.includes(type)) throw new Error(`unknown event type: ${type}`);
    const isRoot = type === "match_start";
    // Hash only the caller-supplied payload (the type-specific fields), not the
    // envelope itself.
    const payload_hash = hashShort(JSON.stringify(fields));
    const ev = {
      // legacy fields — untouched contract
      matchId: this.matchId,
      seq: this.seq++,
      ts: Date.now(),
      type,
      // OTel-style envelope (schema v2, all additive)
      event_id: crypto.randomUUID(),
      schema_version: SCHEMA_VERSION,
      trace_id: this.matchId,
      span_id: fields.span_id || (isRoot ? this.rootSpanId : newSpanId()),
      parent_span_id: fields.parent_span_id ?? (isRoot ? null : this.rootSpanId),
      actor: fields.actor || DEFAULT_ACTOR_BY_TYPE[type] || "system",
      kind: fields.kind || KIND_BY_TYPE[type] || type,
      payload_hash,
      // Optional observability fields, passed through when the caller has them:
      // model, model_version, prompt_hash, tokens, cost — spread below.
      ...fields,
    };
    this.stream.write(JSON.stringify(ev) + "\n");
    return ev;
  }

  close() {
    return new Promise((resolve) => this.stream.end(resolve));
  }
}

// Merge-write meta.json (so partial updates across a match accumulate).
export function writeMeta(matchId, meta) {
  const p = metaPath(matchId);
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    /* first write */
  }
  const merged = { matchId: String(matchId), ...existing, ...meta };
  fs.writeFileSync(p, JSON.stringify(merged, null, 2));
  return p;
}

// Reconstruct the trailing conversation text from an events.jsonl file
// (concatenated `turn` texts). Used by the judge and skill sedimentation.
export function readMatchText(matchId, maxChars = Infinity) {
  const p = eventsPath(matchId);
  if (!fs.existsSync(p)) return "";
  const out = [];
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!line) continue;
    try {
      const ev = JSON.parse(line);
      if (ev.type === "turn" && typeof ev.text === "string") out.push(ev.text);
    } catch {
      /* tolerate a torn final line */
    }
  }
  const text = out.join("");
  return maxChars === Infinity ? text : text.slice(-maxChars);
}

// ── Transcript selection ──────────────────────────────────────────────────────
// `readMatchText(matchId, maxChars)` deliberately retains its historical
// tail-only semantics. Judging uses this separate selector so a long transcript
// does not hide every office except whichever actor happened to speak last.
//
// `actor-stratified` is structural, not semantic: for every observed actor it
// nominates the first, middle, and last turn, also nominating explicit dispatch
// turns (`[→ office]`) and the match's final turn. Nominated turns share the
// remaining character budget through a deterministic water-fill allocation.
// The selector does not search for words such as "veto" and therefore applies
// the same rule to every regime and scenario.

export const TRANSCRIPT_STRATEGIES = ["tail", "actor-stratified"];

const DISPATCH_RE = /\[→\s*[^\]\r\n]+\]/u;
const MIN_EXCERPT_CHARS = 32;

function readTurnEvents(matchId) {
  const p = eventsPath(matchId);
  if (!fs.existsSync(p)) return [];
  const turns = [];
  let lineIndex = 0;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!line) continue;
    try {
      const ev = JSON.parse(line);
      if (ev.type === "turn" && typeof ev.text === "string") {
        turns.push({
          index: turns.length,
          seq: Number.isInteger(ev.seq) ? ev.seq : lineIndex,
          actor: typeof ev.actor === "string" && ev.actor ? ev.actor : "unknown",
          text: ev.text,
        });
      }
    } catch {
      /* tolerate malformed or torn lines */
    }
    lineIndex += 1;
  }
  return turns;
}

function nominateTurns(turns) {
  const byActor = new Map();
  for (const turn of turns) {
    if (!byActor.has(turn.actor)) byActor.set(turn.actor, []);
    byActor.get(turn.actor).push(turn);
  }

  const nominated = new Map();
  const add = (turn, reason) => {
    const current = nominated.get(turn.index) ?? { turn, reasons: new Set() };
    current.reasons.add(reason);
    nominated.set(turn.index, current);
  };

  for (const actorTurns of byActor.values()) {
    add(actorTurns[0], "actor-first");
    add(actorTurns[Math.floor(actorTurns.length / 2)], "actor-middle");
    add(actorTurns[actorTurns.length - 1], "actor-last");
  }
  for (const turn of turns) {
    if (DISPATCH_RE.test(turn.text)) add(turn, "dispatch");
  }
  add(turns[turns.length - 1], "global-last");

  return {
    actors: [...byActor.keys()],
    candidates: [...nominated.values()].sort((a, b) => a.turn.index - b.turn.index),
  };
}

function candidatePriority(candidate) {
  if (candidate.reasons.has("global-last")) return 0;
  if (candidate.reasons.has("dispatch")) return 1;
  if (candidate.reasons.has("actor-first")) return 2;
  if (candidate.reasons.has("actor-middle")) return 3;
  return 4;
}

function candidateHeader(candidate) {
  const { seq, actor } = candidate.turn;
  return `[turn seq=${seq} actor=${actor} reason=${[...candidate.reasons].join("+")}]\n`;
}

function candidateSourceText(candidate) {
  if (!candidate.reasons.has("dispatch")) return candidate.turn.text;
  // The renderer's text after `[→ office]` is a human-facing gloss which can
  // repeat identifying office names with different capitalization. The token
  // itself is the structured dispatch evidence; sample that exact token.
  return candidate.turn.text.match(DISPATCH_RE)?.[0] ?? candidate.turn.text;
}

function fitCandidates(candidates, maxChars, prefix) {
  const ranked = [...candidates].sort((a, b) =>
    candidatePriority(a) - candidatePriority(b) || a.turn.index - b.turn.index);
  const selected = [];
  let fixedChars = prefix.length;
  for (const candidate of ranked) {
    const separatorChars = selected.length ? 2 : 0;
    const required = separatorChars + candidateHeader(candidate).length + MIN_EXCERPT_CHARS;
    if (fixedChars + required <= maxChars) {
      selected.push(candidate);
      fixedChars += required;
    }
  }
  return selected.sort((a, b) => a.turn.index - b.turn.index);
}

function allocateContent(candidates, availableChars) {
  const quotas = new Map(candidates.map((candidate) => [candidate.turn.index, 0]));
  let remaining = Math.max(0, availableChars);
  let active = [...candidates];

  while (active.length && remaining > 0) {
    const share = Math.max(1, Math.floor(remaining / active.length));
    const completed = [];
    for (const candidate of active) {
      const already = quotas.get(candidate.turn.index);
      const need = candidateSourceText(candidate).length - already;
      const grant = Math.min(need, share, remaining);
      quotas.set(candidate.turn.index, already + grant);
      remaining -= grant;
      if (grant === need) completed.push(candidate.turn.index);
      if (remaining === 0) break;
    }
    if (completed.length === 0 && share > 1) break;
    active = active.filter((candidate) => !completed.includes(candidate.turn.index));
  }

  // Distribute any rounding remainder in chronological order.
  while (remaining > 0) {
    let granted = false;
    for (const candidate of candidates) {
      const current = quotas.get(candidate.turn.index);
      if (current < candidateSourceText(candidate).length) {
        quotas.set(candidate.turn.index, current + 1);
        remaining -= 1;
        granted = true;
        if (remaining === 0) break;
      }
    }
    if (!granted) break;
  }
  return quotas;
}

function excerptTurn(candidate, quota) {
  const text = candidateSourceText(candidate);
  if (text.length <= quota) return { text, sourceChars: text.length };
  if (quota <= 1) return { text: "…".slice(0, quota), sourceChars: 0 };
  if (!candidate.reasons.has("global-last") || quota < 16) {
    return { text: `${text.slice(0, quota - 1)}…`, sourceChars: quota - 1 };
  }
  const marker = "\n…\n";
  const usable = quota - marker.length;
  const headChars = Math.floor(usable * 0.3);
  return {
    text: `${text.slice(0, headChars)}${marker}${text.slice(-(usable - headChars))}`,
    sourceChars: usable,
  };
}

export function selectTranscript(matchId, {
  maxChars = 6000,
  strategy = "actor-stratified",
} = {}) {
  if (!TRANSCRIPT_STRATEGIES.includes(strategy)) {
    throw new Error(`unknown transcript strategy: ${strategy} (valid: ${TRANSCRIPT_STRATEGIES.join(", ")})`);
  }
  if (!Number.isInteger(maxChars) || maxChars < 0) {
    throw new Error(`maxChars must be a non-negative integer, got ${maxChars}`);
  }

  const turns = readTurnEvents(matchId);
  const fullText = turns.map((turn) => turn.text).join("");
  const originalLength = fullText.length;
  const baseSelection = {
    strategy,
    originalLength,
    totalTurns: turns.length,
    actorCount: new Set(turns.map((turn) => turn.actor)).size,
  };

  if (strategy === "tail") {
    const text = maxChars === 0 ? "" : fullText.slice(-maxChars);
    return {
      text,
      selection: {
        ...baseSelection,
        selectedLength: text.length,
        selectedContentChars: text.length,
        omittedContentChars: originalLength - text.length,
        selectedTurns: text ? null : 0,
        truncated: text.length < originalLength,
      },
    };
  }

  if (originalLength <= maxChars) {
    return {
      text: fullText,
      selection: {
        ...baseSelection,
        selectedLength: originalLength,
        selectedContentChars: originalLength,
        omittedContentChars: 0,
        selectedTurns: turns.length,
        truncated: false,
      },
    };
  }
  if (turns.length === 0 || maxChars === 0) {
    return {
      text: "",
      selection: {
        ...baseSelection,
        selectedLength: 0,
        selectedContentChars: 0,
        omittedContentChars: originalLength,
        selectedTurns: 0,
        truncated: originalLength > 0,
      },
    };
  }

  const { actors, candidates } = nominateTurns(turns);
  const prefixFor = (count) =>
    `[actor-stratified transcript: ${count}/${turns.length} turns; chronological excerpts]\n`;
  let selected = fitCandidates(candidates, maxChars, prefixFor(candidates.length));
  // Candidate count changes the prefix width, so refit once with the exact text.
  selected = fitCandidates(candidates, maxChars, prefixFor(selected.length));
  const prefix = prefixFor(selected.length);
  const fixedChars = prefix.length +
    selected.reduce((sum, candidate, index) =>
      sum + (index ? 2 : 0) + candidateHeader(candidate).length, 0);
  const quotas = allocateContent(selected, maxChars - fixedChars);
  const excerpts = selected.map((candidate) => {
    const excerpt = excerptTurn(candidate, quotas.get(candidate.turn.index));
    return { candidate, excerpt };
  });
  const text = `${prefix}${excerpts.map(({ candidate, excerpt }) =>
    `${candidateHeader(candidate)}${excerpt.text}`).join("\n\n")}`.slice(0, maxChars);
  const selectedContentChars = excerpts.reduce(
    (sum, { excerpt }) => sum + excerpt.sourceChars, 0);

  return {
    text,
    selection: {
      ...baseSelection,
      selectedLength: text.length,
      selectedContentChars,
      omittedContentChars: originalLength - selectedContentChars,
      selectedTurns: selected.length,
      candidateTurns: candidates.length,
      actors,
      turns: excerpts.map(({ candidate, excerpt }) => ({
        seq: candidate.turn.seq,
        actor: candidate.turn.actor,
        originalChars: candidate.turn.text.length,
        eligibleChars: candidateSourceText(candidate).length,
        selectedChars: excerpt.sourceChars,
        renderedChars: excerpt.text.length,
        reasons: [...candidate.reasons],
      })),
      truncated: true,
    },
  };
}
