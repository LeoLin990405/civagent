/**
 * http-adapter.test.mjs — L2 tests for the direct HTTP adapter (plan §18.2:
 * real local boundary with fake HTTP): the full wire path through the
 * ModelGateway against an in-process scripted provider server — start intent
 * before the HTTP request, raw chunk capture, usage parsing, fail-closed
 * errors, exactly one outbound request, and SecretBroker origin enforcement.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { DirectHttpAdapter, SecretBroker, ORIGIN_REGISTRY, OriginDeniedError } from "../../providers/http-adapter.mjs";
import { ModelGateway } from "../../providers/gateway.mjs";
import { Cas } from "../../evidence/cas.mjs";
import { EventStore } from "../../evidence/eventstore.mjs";
import { readCommittedEvents } from "../../evidence/segment.mjs";
import { Operation } from "../operation.mjs";
import { validateCanonicalEvent, assertEpochSeparation, assertIdDiscipline } from "../../contracts/epoch-rules.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "civ-http-"));
}

/** Scripted provider server: records the request, streams SSE per scenario. */
function scriptedProvider({ scenario = "ok", received = [] }) {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (d) => { body += d; });
    req.on("end", () => {
      received.push({ url: req.url, authorization: req.headers.authorization, body });
      res.writeHead(200, { "content-type": "text/event-stream" });
      const sse = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
      if (scenario === "ok") {
        sse({ choices: [{ delta: { content: "臣" } }] });
        sse({ choices: [{ delta: { content: "谨奏" } }] });
        sse({ choices: [], usage: { prompt_tokens: 11, completion_tokens: 7 } });
        res.end("data: [DONE]\n\n");
      } else if (scenario === "malformed") {
        res.end("data: {not json\n\n");
      } else if (scenario === "empty") {
        res.end();
      }
    });
  });
  return server;
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

function mkGateway({ server, port, scenario = "ok", received }) {
  const dir = tmpDir();
  const cas = new Cas(path.join(dir, "evidence"));
  const store = new EventStore(path.join(dir, "segments"), { generation: 1, segmentId: "http", writer: "test", instrumentVersion: "iv" });
  // the registry points at the REAL deepseek origin; the transport is faked
  const broker = new SecretBroker({ secrets: new Map([["ref-ds", "sk-test-123"]]) });
  const adapter = new DirectHttpAdapter({
    origin: "deepseek",
    credentialRef: "ref-ds",
    broker,
    fetchImpl: async (url, options) => {
      // rewrite the origin-bound URL to the local scripted server
      const rewritten = url.replace(ORIGIN_REGISTRY.deepseek.baseURL, `http://127.0.0.1:${port}`);
      return new Promise((resolve) => {
        const transport = http.request(
          new URL(rewritten),
          { method: options.method, headers: { ...options.headers, host: `127.0.0.1:${port}` } },
          (res) => {
            let data = "";
            res.on("data", (d) => { data += d; });
            res.on("end", () => resolve({ status: res.statusCode, body: data }));
          },
        );
        transport.end(options.body);
      });
    },
  });
  const gateway = new ModelGateway({ cas, eventStore: store, provider: adapter, instrumentVersion: "iv" });
  return { dir, cas, store, gateway, adapter, broker };
}

test("full wire path: start intent precedes HTTP; chunks captured; usage parsed; one request", async () => {
  const received = [];
  const server = scriptedProvider({ received });
  const port = await listen(server);
  const { dir, store, gateway, adapter } = mkGateway({ port, received });
  const op = new Operation({ operationId: "op-live", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  const outcome = await gateway.request({ operation: op, model: "deepseek-chat", systemPrompt: "你是谋臣", messages: [{ role: "user", content: "边境之策" }], tools: [] });
  server.close();
  assert.equal(outcome.status, "ok");
  assert.equal(outcome.text, "臣谨奏");
  assert.deepEqual(outcome.usage, { inputTokens: 11, outputTokens: 7 });
  // exactly one outbound HTTP request, authenticated from the broker
  assert.equal(adapter.requestCount, 1);
  assert.equal(received.length, 1);
  assert.equal(received[0].authorization, "Bearer sk-test-123");
  assert.match(received[0].body, /"deepseek-chat"/);
  // start intent event precedes every raw chunk in the committed log
  const committed = readCommittedEvents(store.file);
  const types = committed.map((e) => e.type);
  const startIdx = types.indexOf("model.start_intent");
  const chunkIdx = types.indexOf("model.raw_chunk");
  assert.ok(startIdx >= 0 && chunkIdx > startIdx, "start intent before transport");
  for (const e of committed) {
    const v = validateCanonicalEvent(e);
    assert.deepEqual(v, [], `event ${e.type}: ${v.join("; ")}`);
  }
  assertEpochSeparation(committed);
  assertIdDiscipline(committed);
});

test("fail closed: malformed SSE frames never produce a response", async () => {
  const received = [];
  const server = scriptedProvider({ scenario: "malformed", received });
  const port = await listen(server);
  const { gateway } = mkGateway({ port, scenario: "malformed", received });
  const op = new Operation({ operationId: "op-m", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  const outcome = await gateway.request({ operation: op, model: "deepseek-chat", systemPrompt: "p", messages: [], tools: [] });
  server.close();
  assert.equal(outcome.status, "error");
  assert.equal(outcome.errorType, "malformed_frame");
});

test("fail closed: empty stream maps to eof_early, never a fake response", async () => {
  const received = [];
  const server = scriptedProvider({ scenario: "empty", received });
  const port = await listen(server);
  const { gateway } = mkGateway({ port, scenario: "empty", received });
  const op = new Operation({ operationId: "op-e", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  const outcome = await gateway.request({ operation: op, model: "deepseek-chat", systemPrompt: "p", messages: [], tools: [] });
  server.close();
  assert.equal(outcome.status, "error");
  assert.equal(outcome.errorType, "eof_early");
});

test("SecretBroker enforces origin binding and redacts secrets", async () => {
  const broker = new SecretBroker({ secrets: new Map([["ref-ds", "sk-test-123"]]) });
  assert.equal(broker.resolve("ref-ds", { origin: "deepseek" }), "sk-test-123");
  assert.throws(() => broker.resolve("ref-ds", { origin: "evil.example" }), OriginDeniedError);
  assert.throws(() => broker.resolve("ref-nope", { origin: "deepseek" }), /not resolvable/);
  assert.equal(broker.redact("sk-test-123"), "sk-…23");
  assert.throws(() => new DirectHttpAdapter({ origin: "evil.example", credentialRef: "x", broker }), OriginDeniedError);
  assert.equal(ORIGIN_REGISTRY.deepseek.baseURL, "https://api.deepseek.com");
  assert.equal(ORIGIN_REGISTRY.ark.baseURL, "https://ark.cn-beijing.volces.com");
});
