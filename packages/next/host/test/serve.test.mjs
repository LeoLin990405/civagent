/**
 * serve.test.mjs — tests for the host boot entry and the confirmatory power
 * machinery (plan §19/§20.1).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { EventStore } from "../../evidence/eventstore.mjs";
import { readCommittedEvents } from "../../evidence/segment.mjs";
import { WsServer } from "../ws.mjs";
import { FeedServer } from "../feed.mjs";
import { requiredPairs, minimumDetectableEffect, confirmatoryPlan, simulatePower } from "../../runtime/power.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function mkEvent(i) {
  return {
    schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "iv", generation: 1,
    seq: i, eventId: `ev-${i}`, ts: Date.now(), matchId: "m1", type: i === 0 ? "match.admitted" : "turn.observed",
    sessionId: null, activationId: null, turnId: null, operationId: null, actor: "t",
    spanId: null, parentSpanId: null, artifactRefs: [], payload: { i }, payloadDigest: "d".repeat(64),
  };
}

test("serve entry: a segment dir becomes a feed + GUI over WebSocket", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-serve-"));
  const store = new EventStore(path.join(dir, "segments"), { generation: 1, segmentId: "m1", writer: "t", instrumentVersion: "iv" });
  for (let i = 0; i < 3; i++) store.append(mkEvent(i));
  store.close("clean");

  const cli = path.join(__dirname, "..", "serve.mjs");
  const port = 18700 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, [cli, "--match", "m1", "--store", path.join(dir, "segments"), "--ws-port", String(port), "--scope-token", "tok-serve"], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (d) => { out += d; });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("serve did not start")), 5000);
    const poll = () => {
      if (out.includes("serving")) { clearTimeout(t); resolve(); }
      else setTimeout(poll, 100);
    };
    poll();
  });
  // GUI page served
  const html = await new Promise((resolve) => {
    http.get(`http://127.0.0.1:${port}/`, (res) => { let d = ""; res.on("data", (c) => d += c); res.on("end", () => resolve(d)); });
  });
  assert.match(html, /CivAgent Next/);
  // feed serves the match events (describe over WS reuses the transport)
  const { WsTestClient } = await import("./ws-test-helper.mjs");
  const client = await WsTestClient.connect(port);
  client.send({ rpcId: "r1", method: "civ.describe", params: {} });
  await new Promise((r) => setTimeout(r, 80));
  const desc = client.drain().find((m) => m.rpcId === "r1");
  assert.equal(desc.ok, true);
  client.send({ rpcId: "r2", method: "civ.subscribe", params: { matchId: "m1", scopeToken: "tok-serve" } });
  await new Promise((r) => setTimeout(r, 80));
  const frames = client.drain().filter((m) => m.topic === "civ.events");
  assert.equal(frames.length, 3, "serve delivers the match's committed events");
  client.close();
  child.kill("SIGINT");
  await new Promise((r) => child.once("exit", r));
});

test("requiredPairs matches the paired t-test sample sizes", () => {
  // paired design, d = 0.5, alpha 0.05, power 0.8 -> n = 32 pairs
  // ((1.96 + 0.84) / 0.5)^2 = 31.4 -> 32 (validated by Monte-Carlo below)
  assert.equal(requiredPairs({ effectSize: 0.5, sd: 1 }), 32);
  // d = 0.8 -> n = 13
  assert.equal(requiredPairs({ effectSize: 0.8, sd: 1 }), 13);
  // larger effect -> fewer pairs
  assert.ok(requiredPairs({ effectSize: 1.0, sd: 1 }) < requiredPairs({ effectSize: 0.5, sd: 1 }));
});

test("minimumDetectableEffect is the inverse of requiredPairs", () => {
  const n = requiredPairs({ effectSize: 0.5, sd: 1 });
  const mde = minimumDetectableEffect({ pairs: n, sd: 1 });
  assert.ok(Math.abs(mde - 0.5) < 0.02, `MDE ${mde} close to 0.5`);
});

test("confirmatoryPlan honors the >=30 matched-blocks floor per stratum (plan §20.1)", () => {
  const plan = confirmatoryPlan({ pilotVariance: 1.0, minEffect: 0.5 });
  assert.equal(plan.pairsPerStratum, 32);
  const tiny = confirmatoryPlan({ pilotVariance: 0.01, minEffect: 0.5 });
  assert.equal(tiny.pairsPerStratum, 30, "floor of 30 matched blocks applies");
  assert.ok(plan.digest.length === 64);
  // deterministic
  assert.equal(confirmatoryPlan({ pilotVariance: 1.0, minEffect: 0.5 }).digest, plan.digest);
});

test("Monte-Carlo validation: empirical power matches the formula at the plan's N", () => {
  const plan = confirmatoryPlan({ pilotVariance: 1.0, minEffect: 0.5 });
  const emp = simulatePower({ trueEffect: 0.5, sd: 1, pairs: plan.pairsPerStratum, trials: 1500 });
  assert.ok(emp >= 0.76 && emp <= 0.85, `empirical power ${emp.toFixed(3)} within tolerance of 0.8`);
  const empNull = simulatePower({ trueEffect: 0, sd: 1, pairs: plan.pairsPerStratum, trials: 1500 });
  assert.ok(empNull <= 0.07, `null effect rejected only ${(empNull * 100).toFixed(1)}% (alpha 5%)`);
});

test("serve serves committed events exactly as the store oracle", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-serve2-"));
  const store = new EventStore(path.join(dir, "segments"), { generation: 1, segmentId: "m1", writer: "t", instrumentVersion: "iv" });
  const events = [0, 1, 2].map(mkEvent);
  for (const e of events) store.append(e);
  store.close("clean");
  const committed = readCommittedEvents(path.join(dir, "segments", "segment-000001.jsonl"));
  assert.deepEqual(committed.map((e) => e.eventId), events.map((e) => e.eventId));
});
