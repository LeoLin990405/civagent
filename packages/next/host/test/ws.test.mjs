/**
 * ws.test.mjs — L4-style tests for the WebSocket transport + research GUI
 * (plan §14.2/§14.3): handshake, describe, scoped subscribe, snapshot+live
 * oracle, generation change, denied scope, and static GUI file serving —
 * headlessly with a minimal RFC 6455 client.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WsServer, UI_DIR } from "../ws.mjs";
import { FeedServer } from "../feed.mjs";
import { CivClient } from "../civ-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function mkEvents(n, { matchId = "m1" } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({
    schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "iv",
    generation: 1, seq: i, eventId: `ev-${matchId}-${i}`, ts: Date.now(), matchId,
    type: "turn.observed", sessionId: null, activationId: null, turnId: null, operationId: null,
    actor: "t", spanId: null, parentSpanId: null, artifactRefs: [], payload: { i }, payloadDigest: "d".repeat(64),
  });
  return out;
}

/** Minimal masked-text-frame encoder (client side). */
function maskFrame(payload) {
  const data = Buffer.from(payload, "utf8");
  const mask = crypto.randomBytes(4);
  const masked = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) masked[i] = data[i] ^ mask[i % 4];
  let header;
  if (data.length < 126) header = Buffer.from([0x81, 0x80 | data.length]);
  else header = Buffer.from([0x81, 0x80 | 126, (data.length >> 8) & 0xff, data.length & 0xff]);
  return Buffer.concat([header, mask, masked]);
}

/** Minimal unmasked-frame decoder (server side). */
function parseServerFrames(buf) {
  const out = [];
  let off = 0;
  while (buf.length - off >= 2) {
    const opcode = buf[off] & 0x0f;
    let len = buf[off + 1] & 0x7f;
    let h = 2;
    if (len === 126) { len = buf.readUInt16BE(off + 2); h = 4; }
    else if (len === 127) { len = Number(buf.readBigUInt64BE(off + 2)); h = 10; }
    if (buf.length - off < h + len) break;
    out.push({ opcode, payload: buf.subarray(off + h, off + h + len).toString("utf8") });
    off += h + len;
  }
  return { frames: out, consumed: off };
}

class WsTestClient {
  static async connect(port, pathName = "/") {
    const key = crypto.randomBytes(16).toString("base64");
    const req = http.request({
      hostname: "127.0.0.1", port, path: pathName, headers: { Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Key": key, "Sec-WebSocket-Version": "13" },
    });
    return new Promise((resolve, reject) => {
      req.on("upgrade", (res, socket) => {
        const c = new WsTestClient(socket);
        c.socket.on("data", (d) => { c.buffer = Buffer.concat([c.buffer, d]); });
        resolve(c);
      });
      req.on("error", reject);
      req.end();
    });
  }
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.messages = [];
  }
  send(obj) { this.socket.write(maskFrame(JSON.stringify(obj))); }
  drain() {
    const { frames, consumed } = parseServerFrames(this.buffer);
    this.buffer = this.buffer.subarray(consumed);
    const start = this.messages.length;
    for (const f of frames) if (f.opcode === 0x1) this.messages.push(JSON.parse(f.payload));
    return this.messages.slice(start); // only new frames since the last drain
  }
  close() { this.socket.destroy(); }
}

async function withServer(fn) {
  const events = mkEvents(5);
  const feed = new FeedServer({ eventSource: (m) => (m === "m1" ? events : []), allowedScopes: new Map([["m1", "tok-m1"]]), queueLimit: 8, retention: 3 });
  const server = new WsServer({ port: 0, feed });
  await server.listen();
  const port = server._server.address().port;
  try { await fn({ server, feed, events, port }); } finally { server.close(); }
}

test("WS handshake + civ.describe + static GUI serving", async () => {
  await withServer(async ({ port }) => {
    const client = await WsTestClient.connect(port);
    client.send({ rpcId: "r1", method: "civ.describe", params: {} });
    await new Promise((r) => setTimeout(r, 50));
    const msgs = client.drain();
    const desc = msgs.find((m) => m.rpcId === "r1");
    assert.equal(desc.ok, true);
    assert.equal(desc.result.schema, "civ.describe/1");
    client.close();
    // static GUI file
    const html = await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${port}/`, (res) => {
        let d = ""; res.on("data", (c) => d += c); res.on("end", () => resolve({ status: res.statusCode, body: d }));
      });
    });
    assert.equal(html.status, 200);
    assert.match(html.body, /CivAgent Next · Research GUI/);
    assert.match(html.body, /civ-client\.mjs/, "GUI imports the shared oracle module");
    const clientJs = await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${port}/civ-client.mjs`, (res) => {
        let d = ""; res.on("data", (c) => d += c); res.on("end", () => resolve(d));
      });
    });
    assert.match(clientJs, /class CivClient/);
    assert.ok(fs.existsSync(path.join(UI_DIR, "index.html")));
  });
});

test("WS subscribe: snapshot + live frames feed the browser oracle exactly", async () => {
  await withServer(async ({ server, feed, events, port }) => {
    const client = await WsTestClient.connect(port);
    client.send({ rpcId: "r2", method: "civ.subscribe", params: { matchId: "m1", scopeToken: "tok-m1" } });
    await new Promise((r) => setTimeout(r, 50));
    const msgs = client.drain();
    const sub = msgs.find((m) => m.rpcId === "r2");
    assert.equal(sub.ok, true);
    const snapshots = msgs.filter((m) => m.topic === "civ.events");
    assert.equal(snapshots.length, 5, "snapshot carries all committed events");
    // live event after subscribe
    const live = mkEvents(1, { matchId: "m1" }).map((e) => ({ ...e, eventId: "ev-live-1" }))[0];
    server.publish("m1", live);
    await new Promise((r) => setTimeout(r, 50));
    const frames = client.drain().filter((m) => m.topic === "civ.events");
    assert.equal(frames.length, 1);
    assert.equal(frames[0].feedOffset, 5, "live frame strictly after the snapshot head");
    assert.equal(frames[0].event.eventId, "ev-live-1");
    // browser oracle: feed every frame through CivClient, compare with the store oracle
    const oracle = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
    const snapshot = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
    for (const f of snapshots) snapshot.applyFrame({ generation: f.generation, feedOffset: f.feedOffset, event: f.event });
    assert.deepEqual(snapshot.appliedEventIds(), events.map((e) => e.eventId));
    snapshot.applyFrame(frames[0]);
    assert.deepEqual(snapshot.appliedEventIds(), [...events.map((e) => e.eventId), "ev-live-1"]);
    client.close();
  });
});

test("WS scope denial: wrong token never receives a feed", async () => {
  await withServer(async ({ port }) => {
    const client = await WsTestClient.connect(port);
    client.send({ rpcId: "r3", method: "civ.subscribe", params: { matchId: "m1", scopeToken: "nope" } });
    await new Promise((r) => setTimeout(r, 50));
    const msgs = client.drain();
    const sub = msgs.find((m) => m.rpcId === "r3");
    assert.equal(sub.ok, false);
    assert.equal(sub.error, "SCOPE_DENIED");
    assert.equal(msgs.filter((m) => m.topic === "civ.events").length, 0, "no frames leaked to an unauthorized subscriber");
    client.close();
  });
});

test("WS generation change (server restart) forces re-snapshot on the browser oracle", async () => {
  await withServer(async ({ server, events, port }) => {
    const client = await WsTestClient.connect(port);
    client.send({ rpcId: "r4", method: "civ.subscribe", params: { matchId: "m1", scopeToken: "tok-m1" } });
    await new Promise((r) => setTimeout(r, 50));
    const before = client.drain();
    assert.ok(before.find((m) => m.rpcId === "r4").ok);
    server.feed.restart(); // generation 2
    const browser = new CivClient({ matchId: "m1", scopeToken: "tok-m1" });
    const snap = before.filter((m) => m.topic === "civ.events");
    for (const f of snap) browser.applyFrame({ generation: f.generation, feedOffset: f.feedOffset, event: f.event });
    // a frame from generation 2 must trigger a resnapshot request
    const r = browser.applyFrame({ generation: 2, feedOffset: 0, event: events[0] });
    assert.equal(r.action, "resnapshot");
    assert.equal(browser.state, "RECONNECTED");
    client.close();
  });
});
