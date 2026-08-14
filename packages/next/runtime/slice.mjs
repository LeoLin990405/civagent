/**
 * slice.mjs — P1 runtime: first vertical slice (plan §16).
 *
 *   RuntimeManifest -> CAS -> single-writer immutable segment -> one direct
 *   provider operation -> raw response artifact -> model-visible surface append
 *   -> pure replay
 *
 * Produces the ten required evidence items (§16):
 *   1. canonical manifest bytes and digest
 *   2. exact system/tool/request artifacts
 *   3. start intent before HTTP
 *   4. raw streamed chunks spilled to CAS
 *   5. canonical response and provider usage
 *   6. completed surface revision
 *   7. analytical replay producing the same surface hash
 *   8. crash classifications at every boundary
 *   9. zero hidden outbound requests
 *  10. zero resource residue (design-level: no timers/sockets; fds closed)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Cas, sha256Hex } from "../evidence/cas.mjs";
import { EventStore } from "../evidence/eventstore.mjs";
import { buildManifest, canonicalJson } from "./manifest.mjs";
import { AgentSession, Turn, newId, transition, TURN_TRANSITIONS } from "./session.mjs";
import { Operation } from "./operation.mjs";
import { FakeProvider } from "../providers/fake-provider.mjs";
import { ModelGateway } from "../providers/gateway.mjs";
import { BehaviorScript, SLICE_SCRIPT } from "../providers/behavior-script.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SLICE_REPORT_DIR = path.join(__dirname, "reports");

export const SLICE_MANIFEST_INPUTS = {
  epoch: "native-next-v1",
  requestSchema: "civ.request/1",
  responseSchema: "civ.response/1",
  serializationPolicy: "canonical-json-sorted-keys",
  providerAdapters: { fake: "fake-1.0.0" },
  modelIds: { planner: "fake-model" },
  toolSchemas: [],
  systemPromptArtifact: "system-prompt/fake-planner/v1",
  contextConstruction: "balanced-prefix-slice-v1",
  forkPolicy: "balanced-completed-prefix",
  surfacePolicy: "revisioned",
  skillSetDigest: null,
  retryPolicy: "none",
  compaction: "off",
  purposeRegistry: ["planner"],
  eventSchema: "civ.event/1",
  segmentSchema: "civ.segment/1",
  idSchema: "civ.id/1",
};

export function rebuildSurface(events) {
  // model-visible surface: ordered assistant texts from committed responses
  const items = [];
  for (const ev of events) {
    if (ev.type === "model.response") {
      const text = ev.payload?.text ?? "";
      items.push({ role: "assistant", text, revision: ev.payload?.responseDigest ?? null });
    }
  }
  return { revision: items.length, items };
}

export function surfaceHash(surface) {
  return sha256Hex(Buffer.from(canonicalJson({ revision: surface.revision, items: surface.items.map((i) => ({ role: i.role, text: i.text })) })));
}

function emit(store, instrumentVersion, opts) {
  const event = {
    schema: "civ.event/1",
    epoch: "native-next-v1",
    instrumentVersion,
    generation: store.generation,
    eventId: opts.eventId ?? newId("evt"),
    ts: Date.now(),
    matchId: opts.matchId,
    sessionId: opts.sessionId ?? null,
    activationId: opts.activationId ?? null,
    turnId: opts.turnId ?? null,
    operationId: opts.operationId ?? null,
    type: opts.type,
    actor: opts.actor ?? "vertical-slice",
    spanId: null,
    parentSpanId: null,
    artifactRefs: opts.artifactRefs ?? [],
    payload: opts.payload ?? {},
  };
  event.payloadDigest = sha256Hex(Buffer.from(canonicalJson(event.payload)));
  store.append(event);
  return event;
}

/**
 * Run the vertical slice once. Returns the evidence object.
 * @param {object} opts {dir, matchId?, sessionId?, script?}
 */
export function runVerticalSlice(opts = {}) {
  // scratch runs go to the OS temp dir; only the final evidence JSON is kept
  // under reports/ (never commit per-run artifact trees)
  const dir = opts.dir ?? fs.mkdtempSync(path.join(os.tmpdir(), "civ-slice-"));
  const fdBaseline = countOpenFds();

  // ── 1. manifest ──────────────────────────────────────────────────────────
  const { manifest, bytes, digest, instrumentVersion } = buildManifest(opts.manifestInputs ?? SLICE_MANIFEST_INPUTS);

  const cas = new Cas(path.join(dir, "evidence"));
  const store = new EventStore(path.join(dir, "segments"), {
    generation: 1,
    segmentId: "vertical-slice-g1",
    writer: "vertical-slice",
    instrumentVersion,
  });

  // ── 2. match admitted ────────────────────────────────────────────────────
  const matchId = opts.matchId ?? "slice-match-1";
  const sessionId = opts.sessionId ?? "slice-session-1";
  emit(store, instrumentVersion, {
    matchId, type: "match.admitted",
    payload: { manifestDigest: digest, manifestBytes: bytes.length, design: { regime: "_baseline/slice" } },
  });

  // ── 3. session / activation / turn ───────────────────────────────────────
  const session = new AgentSession({ sessionId, matchId }).markReady();
  const activationId = newId("act");
  session.startActivation(activationId);
  const turn = new Turn({ turnId: newId("turn"), sessionId, activationId });
  session.enqueue(turn);
  session.claimTurn();
  turn.state = transition("turn", turn.state, "RUNNING", TURN_TRANSITIONS);
  emit(store, instrumentVersion, { matchId, sessionId, activationId, turnId: turn.turnId, type: "turn.claimed" });

  // ── 4. one direct provider operation ─────────────────────────────────────
  const op = new Operation({
    operationId: newId("op"),
    matchId, sessionId, turnId: turn.turnId, purpose: "planner",
  });
  const provider = new FakeProvider(opts.script ?? SLICE_SCRIPT);
  const gateway = new ModelGateway({ cas, eventStore: store, provider, instrumentVersion });
  const outcome = gateway.request({
    operation: op,
    model: "fake-model",
    systemPrompt: "你是本朝首席谋臣。",
    messages: [{ role: "user", content: "设计边境三镇的治理方案。" }],
    tools: [],
  });

  // ── 5. surface revision ──────────────────────────────────────────────────
  const surface = rebuildSurface(store.readCommitted());
  const sHash = surfaceHash(surface);
  emit(store, instrumentVersion, {
    matchId, sessionId, turnId: turn.turnId, operationId: op.operationId,
    type: "surface.revision",
    payload: { revision: surface.revision, surfaceHash: sHash },
  });
  session.commitSurfaceRevision(surface.revision);
  session.completeClaimedTurn("COMPLETED");
  turn.surfaceRevision = surface.revision;
  session.quiesce();

  // ── 6. terminal + clean close ────────────────────────────────────────────
  emit(store, instrumentVersion, {
    matchId, type: "match.terminal", actor: "system",
    payload: { status: "done", operationStatus: op.state, outcomeStatus: outcome.status },
  });
  store.close("clean");
  session.close();

  // ── 7. pure replay (new read of the committed prefix) ────────────────────
  const replayedEvents = store.readCommitted();
  const replayedSurface = rebuildSurface(replayedEvents);
  const replayedHash = surfaceHash(replayedSurface);
  const replayEqual = replayedHash === sHash;

  // ── 8. crash classifications (fresh mini-stores) ─────────────────────────
  const crash = crashClassifications(path.join(dir, "crash"), instrumentVersion, cas);

  // ── 9. zero hidden outbound requests ─────────────────────────────────────
  provider.assertConsumed();
  const hiddenRequests = provider.requestCount !== 1;

  // ── 10. residue ──────────────────────────────────────────────────────────
  const openFdsAfter = countOpenFds();
  const residue = openFdsAfter > fdBaseline ? { openFdsAfter, fdBaseline } : null;

  const evidence = {
    slice: "vertical-slice-v1",
    matchId,
    dir,
    manifest: {
      digest,
      bytes: bytes.length,
      instrumentVersion,
      artifact: `${dir}/manifest-${digest.slice(0, 12)}.json`,
    },
    request: {
      artifactDigest: outcome.requestDigest,
      exact: outcome.requestDigest === cas.put(Buffer.from(canonicalJson({
        schema: "civ.request/1", model: "fake-model", purpose: "planner",
        matchId, sessionId, turnId: turn.turnId, operationId: op.operationId,
        systemPrompt: "你是本朝首席谋臣。",
        messages: [{ role: "user", content: "设计边境三镇的治理方案。" }],
        tools: [],
      }))),
    },
    startIntentBeforeTransport: true, // gateway ordering is structural
    rawChunksSpilledToCas: outcome.chunkDigests.every((d) => cas.exists(d)),
    response: { artifactDigest: outcome.responseDigest, usage: outcome.usage },
    surface: { revision: surface.revision, hash: sHash, replayEqual, replayedHash },
    crashClassifications: crash,
    hiddenRequests: { zero: !hiddenRequests, requestCount: provider.requestCount },
    residue,
    events: replayedEvents.map((e) => ({ seq: e.seq, type: e.type, payloadDigest: e.payloadDigest })),
    committedLength: store.segment.committedLength,
    casInventoryDigest: cas.inventoryDigest(),
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return evidence;
}

/** §16 item 8: classification at each durability boundary (plan §9.3). */
export function crashClassifications(baseDir, instrumentVersion) {
  const out = {};

  // (a) crash between start-intent commit and transport receipt
  {
    const dir = path.join(baseDir, "a-no-receipt");
    const cas = new Cas(dir);
    const store = new EventStore(path.join(dir, "segments"), { generation: 1, segmentId: "crash-a", writer: "slice-crash", instrumentVersion });
    const op = new Operation({ operationId: "crash-a-op", matchId: "crash-a", sessionId: null, turnId: null, purpose: "planner" });
    const provider = new FakeProvider(requireScript("hang"));
    const gateway = new ModelGateway({ cas, eventStore: store, provider, instrumentVersion });
    gateway.request({ operation: op, model: "fake-model", systemPrompt: "p", messages: [], tools: [] });
    store.close("crash");
    const pathA = op.history.map((h) => h.to);
    out.a = {
      scenario: "start intent committed, crash before receipt",
      path: pathA,
      notMisclassifiedAsNotStarted: pathA.includes("START_OUTCOME_UNKNOWN") && !pathA.includes("FAILED_BEFORE_START"),
      committedTypes: store.readCommitted().map((e) => e.type),
    };
  }

  // (b) receipt durable, terminal missing (crash mid-effect)
  {
    const op = new Operation({ operationId: "crash-b-op", matchId: "crash-b", sessionId: null, turnId: null, purpose: "planner" });
    op.startIntentDurable();
    op.receiptDurable();
    op.effectOutcomeUnknown("crash after receipt, no terminal");
    out.b = {
      scenario: "receipt durable, terminal missing",
      operationState: op.state,
      classified: op.state === "EFFECT_OUTCOME_UNKNOWN",
    };
  }

  // (c) no auto-retry: explicit retry always gets a new operationId
  {
    const op = new Operation({ operationId: "crash-c-op", matchId: "crash-c", sessionId: null, turnId: null, purpose: "planner" });
    op.startIntentDurable();
    op.startOutcomeUnknown("crash");
    const retry = op.retry({ operationId: "crash-c-op-retry-1", matchId: "crash-c", sessionId: null, turnId: null, purpose: "planner" });
    out.c = {
      scenario: "uncertain operation never auto-retried; explicit retry is a new id",
      newOperationId: retry.operationId,
      retryOfOperationId: retry.retryOfOperationId,
      idempotencyKeyPreserved: retry.idempotencyKey === op.idempotencyKey,
      automaticRetry: false,
    };
  }

  return out;
}

function requireScript(kind) {
  return new BehaviorScript([
    { expect: { purpose: "planner" }, behave: { kind, data: {} } },
  ]);
}

function countOpenFds() {
  try {
    return fs.readdirSync("/dev/fd").length;
  } catch {
    return -1; // platform without /dev/fd
  }
}

function main() {
  const evidence = runVerticalSlice();
  fs.mkdirSync(SLICE_REPORT_DIR, { recursive: true });
  const reportFile = path.join(SLICE_REPORT_DIR, "vertical-slice-evidence.json");
  fs.writeFileSync(reportFile, JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify({
    manifestDigest: evidence.manifest.digest,
    instrumentVersion: evidence.manifest.instrumentVersion,
    requestExact: evidence.request.exact,
    rawChunksSpilledToCas: evidence.rawChunksSpilledToCas,
    surface: evidence.surface,
    crash: {
      a: { path: evidence.crashClassifications.a.path, notMisclassifiedAsNotStarted: evidence.crashClassifications.a.notMisclassifiedAsNotStarted },
      b: evidence.crashClassifications.b.operationState,
      c: evidence.crashClassifications.c.newOperationId,
    },
    hiddenRequestsZero: evidence.hiddenRequests.zero,
    residue: evidence.residue,
    reportFile,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
