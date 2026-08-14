#!/usr/bin/env node
/**
 * map.mjs — P0 legacy-importer: one-way mapping of the frozen legacy-cc-v5
 * corpus onto canonical civ.event/1 records.
 *
 * Rules (contracts/README.md §4):
 *  - every known legacy event type maps to exactly one canonical type;
 *  - every observable legacy field is carried into the canonical payload;
 *  - the legacy `seq` field resets per dispatch section (observed in 76/105
 *    frozen matches), so canonical `seq` is the file order index and the
 *    legacy seq is preserved as payload.legacySeq — file order is the only
 *    durable observable ordering;
 *  - unobservable logical edges (session identity, handoffs, subagent type)
 *    are labelled `unavailable` and never counted in any denominator;
 *  - dispatch_plan is carried as an observed projection, not authority.
 *
 * Read-only on the corpus. CLI writes reports/mapping-report.json.
 *
 * Usage:
 *   node packages/next/legacy-importer/map.mjs [--out path]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  LEGACY_EPOCH, LEGACY_INSTRUMENT, EVENT_SCHEMA,
  sha256Hex, validateCanonicalEvent, assertEpochSeparation, assertIdDiscipline,
} from "../contracts/epoch-rules.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CORPUS_ROOT = path.join(__dirname, "corpus");
const REPORT_ROOT = path.join(__dirname, "reports");

/** Legacy → canonical event type. */
export const TYPE_MAP = {
  match_start: "match.admitted",
  turn: "turn.observed",
  tool: "operation.observed",
  judge: "judge.observed",
  skill: "skill.event",
  veto_triggered: "mechanism.triggered",
  impeach_triggered: "mechanism.triggered",
  edict_triggered: "mechanism.triggered",
  match_end: "match.terminal",
};

const MECHANISM_KIND = { veto_triggered: "veto", impeach_triggered: "impeach", edict_triggered: "edict" };

/**
 * Every field the legacy contract documents or the frozen corpus observes.
 * Anything outside this set is an unmapped unknown field that lowers the
 * field mapping rate.
 */
export const KNOWN_FIELDS = new Set([
  // envelope
  "matchId", "seq", "ts", "type", "event_id", "schema_version", "trace_id",
  "span_id", "parent_span_id", "actor", "kind", "payload_hash",
  // design (match_start)
  "regime", "backend", "command", "task",
  // dispatch observability
  "dispatch_observability", "dispatch_plan", "dispatch_plan_status",
  "dispatch_plan_error", "dispatch_enforcement", "topology_participation",
  // turn
  "text", "phase", "message_role", "content_items", "tool_uses",
  // judge/model/usage
  "model", "model_version", "prompt_hash", "tokens", "cost", "provider",
  // terminal
  "exitCode", "signal", "mechanisms", "status",
  // skill
  "skillPath", "contentHash", "auditedBy", "reason",
  // mechanism
  "target", "error",
]);

function legacyMeta(e) {
  const meta = {};
  if (e.schema_version !== undefined) meta.schemaVersion = e.schema_version;
  if (e.kind !== undefined) meta.kind = e.kind;
  if (e.payload_hash !== undefined) meta.payloadHash = e.payload_hash;
  if (e.trace_id !== undefined) meta.traceId = e.trace_id;
  if (e.seq !== undefined) meta.legacySeq = e.seq;
  return meta;
}

function dispatchOf(e) {
  const d = {};
  if (e.dispatch_observability !== undefined) d.observability = e.dispatch_observability;
  if (e.dispatch_plan !== undefined) d.plan = e.dispatch_plan;
  if (e.dispatch_plan_status !== undefined) d.planStatus = e.dispatch_plan_status;
  if (e.dispatch_plan_error !== undefined) d.planError = e.dispatch_plan_error;
  if (e.dispatch_enforcement !== undefined) d.enforcement = e.dispatch_enforcement;
  if (e.topology_participation !== undefined) d.topologyParticipation = e.topology_participation;
  if (Object.keys(d).length) d.observedOnly = true; // observed projection, never authority
  return Object.keys(d).length ? d : undefined;
}

function designOf(e) {
  const d = {};
  if (e.regime !== undefined) d.regime = e.regime;
  if (e.backend !== undefined) d.backend = e.backend;
  if (e.command !== undefined) d.command = e.command;
  if (e.task !== undefined) d.task = e.task;
  return Object.keys(d).length ? d : undefined;
}

function usageOf(e) {
  const u = {};
  if (e.tokens !== undefined) u.tokens = e.tokens;
  if (e.cost !== undefined) u.cost = e.cost;
  return Object.keys(u).length ? u : undefined;
}

/**
 * Map one legacy event to a canonical event plus its unmapped-field list.
 * canonicalSeq is the file order index (see header note on legacy seq resets).
 */
export function mapLegacyEvent(e, canonicalSeq) {
  const payload = {};
  let unmapped = [];

  switch (e.type) {
    case "match_start": {
      const design = designOf(e);
      if (design) payload.design = design;
      const dispatch = dispatchOf(e);
      if (dispatch) payload.dispatch = dispatch;
      break;
    }
    case "turn": {
      if (e.text !== undefined) payload.text = e.text;
      if (e.phase !== undefined) payload.phase = e.phase;
      if (e.message_role !== undefined) payload.messageRole = e.message_role;
      if (e.content_items !== undefined) payload.contentItems = e.content_items;
      if (e.tool_uses !== undefined) payload.toolUses = e.tool_uses;
      const dispatch = dispatchOf(e);
      if (dispatch) payload.dispatch = dispatch;
      if (e.model !== undefined) payload.model = e.model;
      if (e.model_version !== undefined) payload.modelVersion = e.model_version;
      const usage = usageOf(e);
      if (usage) payload.usage = usage;
      break;
    }
    case "tool":
    case "judge": {
      if (e.provider !== undefined) payload.provider = e.provider;
      if (e.prompt_hash !== undefined) payload.promptHash = e.prompt_hash;
      if (e.error !== undefined) payload.error = e.error;
      if (e.status !== undefined) payload.status = e.status;
      const usage = usageOf(e);
      if (usage) payload.usage = usage;
      break;
    }
    case "skill": {
      const s = {};
      if (e.status !== undefined) s.status = e.status;
      if (e.skillPath !== undefined) s.skillPath = e.skillPath;
      if (e.contentHash !== undefined) s.contentHash = e.contentHash;
      if (e.auditedBy !== undefined) s.auditedBy = e.auditedBy;
      if (e.reason !== undefined) s.reason = e.reason;
      if (e.error !== undefined) s.error = e.error;
      if (Object.keys(s).length) payload.skill = s;
      break;
    }
    case "veto_triggered":
    case "impeach_triggered":
    case "edict_triggered": {
      payload.mechanism = { kind: MECHANISM_KIND[e.type] };
      if (e.reason !== undefined) payload.mechanism.reason = e.reason;
      if (e.target !== undefined) payload.mechanism.target = e.target;
      break;
    }
    case "match_end": {
      payload.terminal = {};
      if (e.exitCode !== undefined) payload.terminal.exitCode = e.exitCode;
      if (e.signal !== undefined) payload.terminal.signal = e.signal;
      if (e.status !== undefined) payload.terminal.status = e.status;
      if (e.mechanisms !== undefined) payload.terminal.mechanisms = e.mechanisms;
      const dispatch = dispatchOf(e);
      if (dispatch) payload.dispatch = dispatch;
      break;
    }
    default: {
      // Unknown legacy type: canonical type is legacy.unmapped and every
      // present field is carried raw (they are still observed bytes).
      payload.raw = { ...e };
      delete payload.raw.matchId;
      delete payload.raw.seq;
      delete payload.raw.ts;
      delete payload.raw.type;
      delete payload.raw.event_id;
      delete payload.raw.span_id;
      delete payload.raw.parent_span_id;
      delete payload.raw.actor;
    }
  }

  const meta = legacyMeta(e);
  if (Object.keys(meta).length) payload.legacy = meta;

  for (const k of Object.keys(e)) {
    if (!KNOWN_FIELDS.has(k)) unmapped.push(k);
  }

  const canonical = {
    schema: EVENT_SCHEMA,
    epoch: LEGACY_EPOCH,
    instrumentVersion: LEGACY_INSTRUMENT,
    generation: 1,
    seq: canonicalSeq,
    eventId: e.event_id ?? `legacy:${e.matchId}:${canonicalSeq}`,
    ts: e.ts,
    matchId: e.matchId,
    sessionId: null, // unobservable in legacy
    activationId: null,
    turnId: null,
    operationId: null,
    type: TYPE_MAP[e.type] ?? "legacy.unmapped",
    actor: e.actor,
    spanId: e.span_id ?? null,
    parentSpanId: e.parent_span_id ?? null,
    artifactRefs: [], // raw capture was not preserved by the legacy instrument
    payload,
  };
  canonical.payloadDigest = sha256Hex(JSON.stringify(canonical.payload));
  return { event: canonical, unmapped };
}

/** Unobservable logical edges for one match (plan §17 P0). */
export function edgeReport(events) {
  const turnCount = events.filter((e) => e.type === "turn.observed").length;
  return {
    handoffs: { available: false, count: 0, reason: "no typed handoff records exist in the legacy instrument; never inferred" },
    sessionIdentity: { available: false, count: turnCount, reason: "legacy actor is regime-level only; office/session identity unobservable" },
    subagentType: { available: false, count: 0, reason: "legacy subagent_type inference is forbidden by plan §3" },
    planDispatch: { available: true, observed: true, authority: false, reason: "dispatch_plan carried as observed projection (payload.dispatch.observedOnly)" },
  };
}

/** Import one frozen match from its manifest entry. */
export function importMatch(entry, corpusRoot = CORPUS_ROOT) {
  const eventsFile = path.join(corpusRoot, "traces", entry.matchId, "events.jsonl");
  const lines = fs.readFileSync(eventsFile, "utf8").trim().split("\n").filter(Boolean);
  const canonical = [];
  const stats = { total: 0, mappedEvents: 0, unknownTypes: 0, mappedFields: 0, unknownFields: 0 };
  for (let i = 0; i < lines.length; i++) {
    const legacy = JSON.parse(lines[i]);
    stats.total++;
    const { event, unmapped } = mapLegacyEvent(legacy, i);
    canonical.push(event);
    if (event.type !== "legacy.unmapped") stats.mappedEvents++;
    else stats.unknownTypes++;
    // every present legacy field is either carried into the canonical event
    // (mapped) or outside the known set (unmapped unknown field)
    stats.mappedFields += Object.keys(legacy).length - unmapped.length;
    stats.unknownFields += unmapped.length;
  }
  assertEpochSeparation(canonical, { matchId: entry.matchId });
  assertIdDiscipline(canonical, { matchId: entry.matchId });
  return { matchId: entry.matchId, epoch: LEGACY_EPOCH, instrumentVersion: LEGACY_INSTRUMENT, events: canonical, stats, edges: edgeReport(canonical) };
}

/** Import the whole frozen corpus. Returns aggregate stats + per-match rows. */
export function importCorpus(corpusRoot = CORPUS_ROOT) {
  const manifestFile = path.join(corpusRoot, "MANIFEST.json");
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const totals = { matches: 0, total: 0, mappedEvents: 0, unknownTypes: 0, mappedFields: 0, unknownFields: 0 };
  const perMatch = [];
  for (const entry of manifest.traces) {
    const m = importMatch(entry, corpusRoot);
    totals.matches++;
    totals.total += m.stats.total;
    totals.mappedEvents += m.stats.mappedEvents;
    totals.unknownTypes += m.stats.unknownTypes;
    totals.mappedFields += m.stats.mappedFields;
    totals.unknownFields += m.stats.unknownFields;
    perMatch.push({
      matchId: m.matchId,
      events: m.stats.total,
      mappedEvents: m.stats.mappedEvents,
      unknownFields: m.stats.unknownFields,
      edges: m.edges,
    });
  }
  const fieldTotal = totals.mappedFields + totals.unknownFields;
  const rates = {
    eventRate: totals.total ? totals.mappedEvents / totals.total : 0,
    fieldRate: fieldTotal ? totals.mappedFields / fieldTotal : 0,
  };
  return {
    reportSchema: "mapping-report/1",
    manifestDigest: sha256Hex(fs.readFileSync(manifestFile)),
    corpusRoot,
    frozenAt: manifest.frozenAt,
    instrument: manifest.instrument,
    totals,
    rates,
    gates: {
      eventRateGE99: rates.eventRate >= 0.99,
      fieldRateGE99: rates.fieldRate >= 0.99,
      zeroUnknownTypes: totals.unknownTypes === 0,
    },
    perMatch,
  };
}

function main() {
  const outArg = process.argv.indexOf("--out");
  const outFile = outArg >= 0 ? process.argv[outArg + 1] : path.join(REPORT_ROOT, "mapping-report.json");
  const report = importCorpus();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n");
  const { totals, rates, gates } = report;
  console.log(JSON.stringify({
    matches: totals.matches,
    events: totals.total,
    mappedEvents: totals.mappedEvents,
    unknownTypes: totals.unknownTypes,
    unknownFields: totals.unknownFields,
    eventRate: rates.eventRate.toFixed(4),
    fieldRate: rates.fieldRate.toFixed(4),
    gates,
    reportFile: outFile,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
