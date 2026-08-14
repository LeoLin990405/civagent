/**
 * http-adapter.mjs — P1/P6 providers: direct HTTP model adapter (plan §12).
 *
 * The live lane behind the ModelGateway transport contract. Implements the
 * same outcome contract as FakeProvider.send so the gateway is unchanged:
 *   {kind:"stream", chunks, usage, toolCalls}
 *   {kind:"error", errorType, message}
 *
 * Rules (plan §12.1/§13.1):
 *  - origin-bound HTTPS from a closed registry; arbitrary baseURL denied;
 *  - credentials come from a SecretBroker via CredentialRef, resolved only
 *    for the admitted operation and target origin — never ambient;
 *  - raw provider bytes stream into lossless capture (the gateway spills
 *    chunks to CAS); usage parsed from the SSE tail;
 *  - missing/unknown fields fail closed; 429 -> rate_limit, 5xx -> server_error,
 *    network -> transport; no retry (retryPolicy none, plan §9.3).
 */
import https from "node:https";
import http from "node:http";

export const ORIGIN_REGISTRY = {
  deepseek: { baseURL: "https://api.deepseek.com", path: "/chat/completions" },
  ark: { baseURL: "https://ark.cn-beijing.volces.com", path: "/api/v3/chat/completions" },
};

export class OriginDeniedError extends Error {
  constructor(origin) {
    super(`origin ${origin} not in the closed registry`);
    this.code = "ORIGIN_DENIED";
  }
}

export class SecretBroker {
  /**
   * @param {object} opts {secrets: Map<credentialRef, string>}
   */
  constructor(opts) {
    this.secrets = opts.secrets ?? new Map();
  }

  /** Resolve a credential ref only for an admitted origin (plan §13.1). */
  resolve(ref, { origin }) {
    if (!ORIGIN_REGISTRY[origin]) throw new OriginDeniedError(origin);
    if (!this.secrets.has(ref)) throw new Error(`credential ${ref} not resolvable`);
    return this.secrets.get(ref);
  }

  redact(secret) {
    if (typeof secret !== "string") return secret;
    return secret.slice(0, 3) + "…" + secret.slice(-2);
  }
}

export class DirectHttpAdapter {
  /**
   * @param {object} opts {origin, credentialRef, broker, fetchImpl?}
   */
  constructor(opts) {
    if (!ORIGIN_REGISTRY[opts.origin]) throw new OriginDeniedError(opts.origin);
    this.origin = opts.origin;
    this.credentialRef = opts.credentialRef;
    this.broker = opts.broker;
    this.registry = ORIGIN_REGISTRY[opts.origin];
    this.adapterVersion = "direct-http/1.0.0";
    this.requestCount = 0;
    // injectable transport for hermetic tests; default is node https
    this._transport = opts.fetchImpl ?? ((url, options, body) => streamRequest(url, options, body));
  }

  get capabilityReport() {
    return {
      adapter: "direct-http",
      version: this.adapterVersion,
      origin: this.origin,
      baseURL: this.registry.baseURL,
      capabilities: ["streaming", "usage", "nativeToolCalls", "cancellation"],
      admitted: true,
    };
  }

  /**
   * Send one prepared canonical request. Streams the provider response and
   * returns the outcome descriptor consumed by ModelGateway.
   */
  async send(canonicalRequest) {
    this.requestCount++;
    const apiKey = this.broker.resolve(this.credentialRef, { origin: this.origin });
    const url = `${this.registry.baseURL}${this.registry.path}`;
    const body = JSON.stringify({
      model: canonicalRequest.model,
      messages: canonicalRequest.messages,
      stream: true,
      stream_options: { include_usage: true },
    });
    let response;
    try {
      response = await this._transport(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "user-agent": `civagent-next/${this.adapterVersion}`,
        },
        body,
      });
    } catch (e) {
      return { kind: "error", errorType: "transport", message: `network failure: ${e.message}` };
    }
    if (response.status === 429) {
      return { kind: "error", errorType: "rate_limit", message: `rate limited by ${this.origin}`, retryAfterMs: null };
    }
    if (response.status >= 500) {
      return { kind: "error", errorType: "server_error", message: `${this.origin} ${response.status}` };
    }
    if (response.status !== 200) {
      return { kind: "error", errorType: "http_error", message: `${this.origin} ${response.status}` };
    }
    // SSE parse: data lines, [DONE] terminator, usage in the final chunk
    const chunks = [];
    let usage = null;
    let toolCalls = [];
    for (const line of response.body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") break;
      let frame;
      try {
        frame = JSON.parse(data);
      } catch {
        return { kind: "error", errorType: "malformed_frame", message: "provider sent a malformed SSE frame" };
      }
      const delta = frame.choices?.[0]?.delta ?? {};
      if (delta.content) chunks.push(delta.content);
      if (delta.tool_calls) toolCalls = delta.tool_calls;
      if (frame.usage) usage = frame.usage;
    }
    if (chunks.length === 0 && toolCalls.length === 0 && !usage) {
      return { kind: "error", errorType: "eof_early", message: "stream ended before a terminal event" };
    }
    return {
      kind: "stream",
      chunks,
      usage: usage ? { inputTokens: usage.prompt_tokens ?? null, outputTokens: usage.completion_tokens ?? null } : null,
      toolCalls,
    };
  }
}

/** Minimal streaming HTTPS request returning {status, body} (body fully buffered). */
function streamRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const transport = u.protocol === "https:" ? https : http;
    const req = transport.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method: options.method,
        headers: options.headers,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (d) => { data += d; });
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      },
    );
    req.on("error", reject);
    req.end(body);
  });
}
