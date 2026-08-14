/**
 * gateway.mjs — P1 providers: ModelGateway.
 *
 * Plan §12.1: the provider layer is generation, not orchestration. The gateway
 * may only: prepare a canonical request, send it through an approved transport
 * (here: the scripted fake provider), stream provider bytes into lossless raw
 * capture (CAS), and emit canonical events (start intent, raw chunk, response,
 * error, cancel, hang, EOF, malformed). It cannot invoke tools, spawn, retry,
 * or create identities.
 *
 * Ordering (plan §10.1): request artifact durable in CAS → start-intent event
 * committed → transport → per-chunk CAS spill → canonical response → usage.
 * Memory is bounded: raw bytes go to CAS per chunk; memory holds digests only.
 */
import { canonicalJson } from "../runtime/manifest.mjs";
import { validateCanonicalEvent } from "../contracts/epoch-rules.mjs";
import { sha256Hex } from "../evidence/cas.mjs";

export const REQUEST_SCHEMA = "civ.request/1";
export const RESPONSE_SCHEMA = "civ.response/1";

export class ModelGateway {
  /**
   * @param {object} deps {cas, eventStore, provider, instrumentVersion, epoch}
   */
  constructor(deps) {
    this.cas = deps.cas;
    this.eventStore = deps.eventStore;
    this.provider = deps.provider;
    this.instrumentVersion = deps.instrumentVersion;
    this.epoch = deps.epoch ?? "native-next-v1";
    this._eventSeq = 0; // per-gateway event counter so eventIds stay unique per operation
  }

  _emit(operation, type, payload, artifactRefs = []) {
    const event = {
      schema: "civ.event/1",
      epoch: this.epoch,
      instrumentVersion: this.instrumentVersion,
      generation: this.eventStore.generation,
      eventId: `${operation.operationId}:${++this._eventSeq}`, // unique per operation step
      ts: Date.now(),
      matchId: operation.matchId,
      sessionId: operation.sessionId,
      turnId: operation.turnId,
      operationId: operation.operationId,
      type,
      actor: "model-gateway",
      spanId: null,
      parentSpanId: null,
      artifactRefs,
      payload,
    };
    // payloadDigest is the SHA-256 of the canonical payload bytes; the segment
    // record digest (covers the whole event) is separate and internal
    event.payloadDigest = sha256Hex(Buffer.from(canonicalJson(payload)));
    const { seq } = this.eventStore.append(event);
    const committed = { ...event, seq };
    const violations = validateCanonicalEvent(committed);
    if (violations.length) throw new Error(`gateway emitted invalid event: ${violations.join("; ")}`);
    return committed;
  }

  /**
   * One direct provider operation. Returns the outcome descriptor:
   *   {status:"ok", requestDigest, responseDigest?, usage?, chunkDigests[]}
   *   {status:"error", requestDigest, errorType, message}
   *   {status:"hang", requestDigest}                    — no receipt after start intent
   *   {status:"cancelled", requestDigest, phase}
   */
  request({ operation, model, systemPrompt, messages, tools = [] }) {
    if (operation.state !== "ACCEPTED") throw new Error(`operation must be ACCEPTED, got ${operation.state}`);

    // 1. canonical request artifact, durable before anything leaves
    const request = {
      schema: REQUEST_SCHEMA,
      model,
      purpose: operation.purpose,
      matchId: operation.matchId,
      sessionId: operation.sessionId,
      turnId: operation.turnId,
      operationId: operation.operationId,
      systemPrompt,
      messages,
      tools,
    };
    const requestBytes = Buffer.from(canonicalJson(request));
    const requestDigest = this.cas.put(requestBytes);

    // 2. start intent is committed BEFORE the transport is touched
    operation.startIntentDurable();
    this._emit(operation, "model.start_intent", { model, requestDigest, requestBytes: requestBytes.length }, [requestDigest]);

    // 3. transport (scripted fake provider; a real adapter streams HTTP here)
    const outcome = this.provider.send(request);

    switch (outcome.kind) {
      case "stream": {
        operation.receiptDurable();
        const chunkDigests = [];
        for (const [i, chunk] of outcome.chunks.entries()) {
          const bytes = Buffer.from(chunk, "utf8");
          const digest = this.cas.put(bytes);
          chunkDigests.push(digest);
          this._emit(operation, "model.raw_chunk", { index: i, bytes: bytes.length, chunkDigest: digest }, [digest]);
        }
        const response = {
          schema: RESPONSE_SCHEMA,
          model,
          operationId: operation.operationId,
          text: outcome.chunks.join(""),
          toolCalls: outcome.toolCalls ?? [],
          usage: outcome.usage ?? null,
        };
        const responseBytes = Buffer.from(canonicalJson(response));
        const responseDigest = this.cas.put(responseBytes);
        this._emit(operation, "model.response", { responseDigest, toolCalls: response.toolCalls ?? [], usage: response.usage }, [responseDigest]);
        operation.settle();
        this._emit(operation, "operation.outcome", { status: "settled", errorType: null });
        operation.flush();
        return { status: "ok", requestDigest, responseDigest, usage: response.usage, chunkDigests, text: response.text };
      }

      case "error": {
        operation.receiptDurable();
        this._emit(operation, "model.error", { errorType: outcome.errorType, message: outcome.message, retryAfterMs: outcome.retryAfterMs ?? null });
        operation.settle();
        this._emit(operation, "operation.outcome", { status: "settled_failed", errorType: outcome.errorType });
        operation.flush();
        return { status: "error", requestDigest, errorType: outcome.errorType, message: outcome.message };
      }

      case "eof_early": {
        operation.receiptDurable();
        for (const [i, chunk] of outcome.chunks.entries()) {
          const digest = this.cas.put(Buffer.from(chunk, "utf8"));
          this._emit(operation, "model.raw_chunk", { index: i, bytes: Buffer.byteLength(chunk), chunkDigest: digest }, [digest]);
        }
        this._emit(operation, "model.error", { errorType: "eof_early", message: "EOF before terminal event" });
        operation.settle();
        this._emit(operation, "operation.outcome", { status: "settled_failed", errorType: "eof_early" });
        operation.flush();
        return { status: "error", requestDigest, errorType: "eof_early", message: "EOF before terminal event" };
      }

      case "malformed": {
        operation.receiptDurable();
        for (const frame of outcome.frames) {
          this._emit(operation, "model.error", { errorType: "malformed_frame", message: `malformed frame: ${String(frame).slice(0, 80)}` });
        }
        operation.settle();
        this._emit(operation, "operation.outcome", { status: "settled_failed", errorType: "malformed_frame" });
        operation.flush();
        return { status: "error", requestDigest, errorType: "malformed_frame", message: "malformed frames; failed closed" };
      }

      case "hang": {
        // no receipt: crash/default classification is the caller's evidence step
        operation.startOutcomeUnknown("no receipt after start intent (hang)");
        this._emit(operation, "model.error", { errorType: "hang", message: "no receipt after start intent" });
        operation.flush();
        return { status: "hang", requestDigest };
      }

      case "cancel_before_receipt": {
        this._emit(operation, "model.cancelled", { phase: "before_receipt", acknowledged: true });
        operation.failBeforeStart("cancelled before receipt (acknowledged)");
        operation.flush();
        return { status: "cancelled", requestDigest, phase: "before_receipt" };
      }

      case "cancel_after_receipt": {
        operation.receiptDurable();
        for (const [i, chunk] of outcome.chunks.entries()) {
          const digest = this.cas.put(Buffer.from(chunk, "utf8"));
          this._emit(operation, "model.raw_chunk", { index: i, bytes: Buffer.byteLength(chunk), chunkDigest: digest }, [digest]);
        }
        this._emit(operation, "model.cancelled", { phase: "after_receipt", acknowledged: true });
        operation.settle();
        this._emit(operation, "operation.outcome", { status: "settled_cancelled", errorType: null });
        operation.flush();
        return { status: "cancelled", requestDigest, phase: "after_receipt" };
      }

      case "overflow": {
        operation.receiptDurable();
        for (const [i, chunk] of outcome.chunks.entries()) {
          const digest = this.cas.put(Buffer.from(chunk, "utf8"));
          this._emit(operation, "model.raw_chunk", { index: i, bytes: Buffer.byteLength(chunk), chunkDigest: digest }, [digest]);
        }
        this._emit(operation, "model.error", { errorType: "overflow", message: "output exceeded bounded window; failed explicitly" });
        operation.settle();
        this._emit(operation, "operation.outcome", { status: "settled_failed", errorType: "overflow" });
        operation.flush();
        return { status: "error", requestDigest, errorType: "overflow", message: "output overflow" };
      }

      default:
        throw new Error(`unhandled provider outcome kind ${outcome.kind}`);
    }
  }
}
