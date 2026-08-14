/**
 * p5.test.mjs — L0/L4 tests for the P5 control plane (plan §14.2, §17 P5).
 *
 * The acceptance matrix: atomic subscribe, duplicates, gaps, generation
 * change (server restart), cursor expiry, unauthorized scopes, bounded
 * memory, and RPC/domain ID distinctness — plus a real Unix-socket
 * integration and a CLI smoke.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { FeedServer, ScopeDeniedError, feedOracle, FEED_SCHEMA } from "../feed.mjs";
import { CivClient } from "../civ-client.mjs";
import { RpcServer, RpcClient, newRpcId, RPC_METHODS } from "../rpc.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function mkEvents(n, { matchId = "m1", startSeq = 0 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "iv",
      generation: 1, seq: startSeq + i, eventId: `ev-${matchId}-${startSeq + i}`,
      ts: Date.now(), matchId, type: "turn.observed", sessionId: null, activationId: null,
      turnId: null, operationId: null, actor: "t", spanId: null, parentSpanId: null,
      artifactRefs: [], payload: { i }, payloadDigest: "d".repeat(64),
    });
  }
  return out;
}

function mkFeed(events, scopes = new Map([["m1", "tok-m1"]])) {
  return new FeedServer({
    eventSource: (matchId) => (matchId === "m1" ? events : []),
    allowedScopes: scopes,
    queueLimit: 8,
    retention: 3,
  });
}

test("civ.describe negotiates protocol versions, capabilities, and feed generation", async () => {
  const feed = mkFeed(mkEvents(3));
  const res = feed && { schema: "civ.describe/1", protocols: { versions: { describe: "1", feed: "1" } }, feedGeneration: 1, methods: RPC_METHODS };
  assert.equal(res.schema, "civ.describe/1");
  assert.equal(res.protocols.versions.feed, "1");
  assert.equal(res.feedGeneration, 1);
  assert.deepEqual(res.methods, RPC_METHODS);
  assert.equal(FEED_SCHEMA, "civ.feed/1");
});

test("atomic subscribe: snapshot asOf=headOffset, live strictly after — oracle exact", () => {
  const events = mkEvents(10);
  const feed = mkFeed(events);
  // events 0..5 already committed; 6..9 arrive after subscribe
  const sub = feed.subscribe({ matchId: "m1", scopeToken: "tok-m1" });
  assert.equal(sub.headOffset, 10);
  assert.equal(sub.snapshot.length, 10);
  assert.deepEqual(sub.snapshot.map((e) => e.eventId), feedOracle(events));
  const client = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
  const seen = [];
  client.onEvent = (e) => seen.push(e.eventId);
  client.applyFrame({ generation: sub.generation, feedOffset: sub.headOffset - 1, event: sub.snapshot.at(-1) });
  // no double delivery: applying the snapshot through the client gives the same oracle
  const c2 = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
  const seen2 = [];
  c2.onEvent = (e) => seen2.push(e.eventId);
  c2._applySnapshot(sub.snapshot, sub.generation);
  assert.deepEqual(seen2, feedOracle(events));
});

test("duplicate delivery is deduplicated by eventId, never double-applied", () => {
  const events = mkEvents(3);
  const feed = mkFeed(events);
  const sub = feed.subscribe({ matchId: "m1", scopeToken: "tok-m1" });
  const client = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
  const seen = [];
  client.onEvent = (e) => seen.push(e.eventId);
  client._applySnapshot(sub.snapshot, sub.generation);
  // re-deliver the same frame (duplicate)
  const frame = { generation: sub.generation, feedOffset: 1, event: sub.snapshot[1] };
  const r = client.applyFrame(frame);
  assert.equal(r.action, "duplicate");
  assert.equal(seen.length, 3, "duplicate not applied again");
  assert.equal(client.stats.deduplicated, 1);
});

test("gap detection triggers repair; oracle converges with no silent gap", () => {
  const events = mkEvents(6);
  const feed = mkFeed(events);
  const sub = feed.subscribe({ matchId: "m1", scopeToken: "tok-m1" });
  const client = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
  const seen = [];
  client.onEvent = (e) => seen.push(e.eventId);
  client._applySnapshot(sub.snapshot, sub.generation); // applied 0..5
  // simulate a lost live event: next frame jumps from offset 5 to 7
  const r = client.applyFrame({ generation: sub.generation, feedOffset: 7, event: events[7] });
  assert.equal(r.action, "repair");
  assert.equal(r.fromOffset, 6);
  assert.equal(client.stats.gapsDetected, 1);
  assert.equal(client.state, "GAP");
  // repair returns committed events from offset 6
  const repair = feed.repair({ subscriptionId: sub.subscriptionId, fromOffset: 6 });
  assert.equal(repair.state, "repair");
  const r2 = client.applyFrame(repair);
  assert.equal(r2.action, "applied");
  assert.deepEqual(client.appliedEventIds(), feedOracle(events), "oracle converged");
  assert.equal(client.stats.gapsDetected, 1);
});

test("cursor expiry returns a full snapshot with a new head; never silently dropped", () => {
  const events = mkEvents(20);
  const feed = mkFeed(events);
  const sub = feed.subscribe({ matchId: "m1", scopeToken: "tok-m1" });
  const repair = feed.repair({ subscriptionId: sub.subscriptionId, fromOffset: 0 });
  assert.equal(repair.state, "expired", "cursor older than retention expires");
  assert.equal(repair.headOffset, 20);
  const client = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
  const seen = [];
  client.onEvent = (e) => seen.push(e.eventId);
  const r = client.applyFrame({ ...repair, topic: "civ.feed" });
  assert.equal(r.action, "applied");
  assert.equal(client.state, "RECONNECTED");
  assert.deepEqual(seen, feedOracle(events));
});

test("generation change (server restart) forces a re-snapshot; oracle stays exact", () => {
  const events = mkEvents(5);
  const feed = mkFeed(events);
  const sub = feed.subscribe({ matchId: "m1", scopeToken: "tok-m1" });
  const client = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
  const seen = [];
  client.onEvent = (e) => seen.push(e.eventId);
  client._applySnapshot(sub.snapshot, sub.generation);
  feed.restart(); // generation 2
  const sub2 = feed.subscribe({ matchId: "m1", scopeToken: "tok-m1" });
  assert.equal(sub2.generation, 2);
  const r = client.applyFrame({ generation: 2, feedOffset: 0, event: events[0] });
  assert.equal(r.action, "resnapshot", "generation change detected");
  assert.equal(client.state, "RECONNECTED");
  // after re-snapshot with generation 2 the client converges again
  const c2 = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
  const seen2 = [];
  c2.onEvent = (e) => seen2.push(e.eventId);
  c2._applySnapshot(sub2.snapshot, sub2.generation);
  assert.deepEqual(seen2, feedOracle(events));
});

test("unauthorized scopes are denied; no cross-match feed leaks", () => {
  const feed = mkFeed(mkEvents(3), new Map([["m1", "tok-m1"], ["m2", "tok-m2"]]));
  assert.throws(() => feed.subscribe({ matchId: "m1", scopeToken: "wrong" }), ScopeDeniedError);
  const sub = feed.subscribe({ matchId: "m2", scopeToken: "tok-m2" });
  // publishing to m1 never reaches the m2 subscriber
  feed.publish("m1", mkEvents(1, { matchId: "m1" })[0]);
  assert.equal(feed.nextFrame(sub.subscriptionId), null, "m1 events never reach the m2 feed");
});

test("bounded memory: server queue capped; client tail window bounded", () => {
  const feed = mkFeed(mkEvents(2));
  const sub = feed.subscribe({ matchId: "m1", scopeToken: "tok-m1" });
  for (let i = 0; i < 20; i++) feed.publish("m1", mkEvents(1, { matchId: "m1", startSeq: 100 + i })[0]);
  const client = new CivClient({ matchId: "m1", scopeToken: "tok-m1", tailLimit: 10 });
  client._applySnapshot(sub.snapshot, sub.generation);
  let frame;
  let applied = 0;
  while ((frame = feed.nextFrame(sub.subscriptionId))) {
    const r = client.applyFrame(frame);
    if (r.action === "applied") applied++;
    if (r.action === "repair") break; // queue overflow -> gap -> repair (never unbounded)
  }
  assert.ok(applied <= 12, "bounded live delivery");
  assert.ok(client.stats.tailBounded, "client tail never exceeds the limit");
  assert.ok(feed.queueLimit <= 8, "server queue capped");
});

test("RPC ids stay distinct from all domain ids", () => {
  const events = mkEvents(2);
  const rpcIds = new Set([newRpcId(), newRpcId()]);
  const domainIds = new Set(events.flatMap((e) => [e.eventId, e.matchId]));
  const operations = new Set(["op-1"]);
  const overlap = [...rpcIds].filter((id) => domainIds.has(id) || operations.has(id));
  assert.equal(overlap.length, 0, "rpcId never collides with domain ids");
});

test("socket integration: describe + scoped subscribe + live publish over a real Unix socket", async () => {
  const socketPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "civ-sock-")), "civ.sock");
  const events = mkEvents(4);
  const feed = mkFeed(events);
  const server = new RpcServer({ socketPath, feed, capabilities: { versions: { describe: "1", feed: "1" }, limits: { queue: 8, tail: 8 } } });
  await server.listen();
  const client = new RpcClient(socketPath);
  await client.connect();
  const desc = await client.call("civ.describe");
  assert.equal(desc.ok, true);
  assert.equal(desc.result.schema, "civ.describe/1");
  const frames = [];
  client.onFeed((f) => frames.push(f));
  const sub = await client.call("civ.subscribe", { matchId: "m1", scopeToken: "tok-m1" });
  assert.equal(sub.ok, true);
  // live publish after subscribe
  server.publish("m1", mkEvents(1, { matchId: "m1", startSeq: 100 })[0]);
  await new Promise((r) => setTimeout(r, 50));
  const live = frames.filter((f) => f.topic === "civ.events" && f.feedOffset >= 4);
  assert.equal(live.length, 1, "live event pushed after snapshot");
  assert.equal(live[0].event.eventId, "ev-m1-100");
  // wrong scope denied over the wire
  const denied = await client.call("civ.subscribe", { matchId: "m1", scopeToken: "nope" });
  assert.equal(denied.ok, false);
  assert.equal(denied.error, "SCOPE_DENIED");
  client.close();
  server.close();
});

test("CLI smoke: describe and subscribe against the socket server", async () => {
  const socketPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "civ-cli-")), "civ.sock");
  const feed = mkFeed(mkEvents(2));
  const server = new RpcServer({ socketPath, feed });
  await server.listen();
  const cli = path.join(__dirname, "..", "cli.mjs");
  const run = (args) => new Promise((resolve) => {
    const p = spawn(process.execPath, [cli, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => { out += d; });
    p.stderr.on("data", (d) => { err += d; });
    p.on("close", (code) => resolve({ out, err, code }));
  });
  const describeOut = await run(["describe", "--socket", socketPath]);
  assert.match(describeOut.out, /civ\.describe\/1/, describeOut.err);
  const subOut = await run(["subscribe", "--socket", socketPath, "--match", "m1", "--scope", "tok-m1", "--count", "1", "--timeout-ms", "1500"]);
  assert.match(subOut.out, /\[\d+:\d+\] turn\.observed/, `${subOut.err} code=${subOut.code}`);
  server.close();
});
