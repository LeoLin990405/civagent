/**
 * fake-provider.mjs — P1 providers: scripted direct model adapter.
 *
 * The first admitted provider in the plan's conformance order (§17 P1) is the
 * fake adapter. It is a leaf seam: it can only receive a prepared canonical
 * request and produce a scripted outcome — it cannot invoke tools, spawn
 * processes, retry, or call anything else. Every outbound request must be
 * matched by a scripted behavior (BehaviorScript.next throws otherwise).
 */
export class FakeProvider {
  constructor(script, { adapterVersion = "fake-1.0.0", capabilities = ["streaming", "usage", "nativeToolCalls", "cancellation"] } = {}) {
    this.script = script;
    this.adapterVersion = adapterVersion;
    this.capabilities = capabilities;
    this.requestCount = 0;
  }

  get capabilityReport() {
    return {
      adapter: "fake",
      version: this.adapterVersion,
      capabilities: this.capabilities,
      admitted: true,
    };
  }

  /**
   * Send one prepared canonical request. Returns a structured outcome:
   *   {kind:"stream", chunks, usage, toolCalls?}
   *   {kind:"error", errorType, message}
   *   {kind:"eof_early", chunks}
   *   {kind:"malformed", frames}
   *   {kind:"hang"}                       — nothing arrives
   *   {kind:"cancel_before_receipt"}      — cancellation acknowledged, no receipt
   *   {kind:"cancel_after_receipt", chunks}
   *   {kind:"overflow", chunks}           — stream exceeded bounded window
   */
  send(canonicalRequest) {
    this.requestCount++;
    const behavior = this.script.next(canonicalRequest.purpose);
    switch (behavior.kind) {
      case "chunks":
        return { kind: "stream", chunks: behavior.data.chunks, usage: behavior.data.usage, toolCalls: behavior.data.toolCalls ?? [] };
      case "toolRequest":
        return { kind: "stream", chunks: [], usage: behavior.data.usage, toolCalls: behavior.data.toolCalls };
      case "error":
        return { kind: "error", errorType: behavior.data.errorType ?? "server_error", message: behavior.data.message ?? "provider error" };
      case "rateLimit":
        return { kind: "error", errorType: "rate_limit", message: behavior.data.message, retryAfterMs: behavior.data.retryAfterMs };
      case "hang":
        return { kind: "hang" };
      case "eofEarly":
        return { kind: "eof_early", chunks: behavior.data.chunks ?? [] };
      case "malformedFrame":
        return { kind: "malformed", frames: behavior.data.frames ?? ["not json", "{broken"] };
      case "cancelBeforeReceipt":
        return { kind: "cancel_before_receipt" };
      case "cancelAfterReceipt":
        return { kind: "cancel_after_receipt", chunks: behavior.data.chunks ?? [] };
      case "overflow":
        return { kind: "overflow", chunks: behavior.data.chunks ?? [] };
      default:
        throw new Error(`unknown behavior kind ${behavior.kind}`);
    }
  }

  assertConsumed() {
    return this.script.assertConsumed();
  }
}
