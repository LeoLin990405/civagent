#!/usr/bin/env node
/**
 * browser-trace.mjs — L4 real-browser trace (plan §17 P5 / §15 "Is the feed
 * repairable?" acceptance).
 *
 * Starts the host serve entry on a scratch segment store, opens the research
 * GUI in a real Chromium (Playwright), subscribes, and verifies the browser
 * projection equals the event-ID oracle of the store: the DOM timeline rows
 * must match the committed events exactly, and the state badge must reach
 * LIVE with correct stats.
 *
 * Requires: `npm i playwright` + `npx playwright install chromium` (external
 * dev dependency, not part of the repo test suite).
 *
 * Usage: node packages/next/host/browser-trace.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  try {
    // dev-machine fallback: playwright installed in a scratch dir
    ({ chromium } = await import("/tmp/civ-browser/node_modules/playwright/index.mjs"));
  } catch {
    console.error("playwright not installed; run: npm i playwright && npx playwright install chromium");
    process.exit(2);
  }
}

import { EventStore } from "../evidence/eventstore.mjs";

// ── scratch store with a known event oracle ────────────────────────────────
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civ-browsertrace-"));
const store = new EventStore(path.join(dir, "segments"), { generation: 1, segmentId: "m1", writer: "browser-trace", instrumentVersion: "iv" });
const ORACLE = [];
for (let i = 0; i < 8; i++) {
  const ev = {
    schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: "iv", generation: 1,
    seq: i, eventId: `ev-bt-${i}`, ts: Date.now(), matchId: "m1",
    type: i === 0 ? "match.admitted" : i % 2 ? "turn.observed" : "model.raw_chunk",
    sessionId: null, activationId: null, turnId: null, operationId: null, actor: "t",
    spanId: null, parentSpanId: null, artifactRefs: [], payload: { i }, payloadDigest: "d".repeat(64),
  };
  store.append(ev);
  ORACLE.push(ev);
}
store.close("clean");

// ── start the serve entry ──────────────────────────────────────────────────
const port = 19500 + Math.floor(Math.random() * 300);
const child = spawn(process.execPath, [
  path.join(__dirname, "serve.mjs"),
  "--match", "m1", "--store", path.join(dir, "segments"),
  "--ws-port", String(port), "--scope-token", "tok-bt",
], { stdio: ["ignore", "pipe", "pipe"] });
let booted = false;
child.stdout.on("data", (d) => { if (d.toString().includes("serving")) booted = true; });
await new Promise((resolve) => {
  const t = setTimeout(resolve, 6000);
  const poll = setInterval(() => { if (booted) { clearInterval(poll); clearTimeout(t); resolve(); } }, 100);
});

// ── real browser ───────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`http://127.0.0.1:${port}/`);
await page.fill("#wsurl", `ws://127.0.0.1:${port}/`);
await page.fill("#match", "m1");
await page.fill("#scope", "tok-bt");
await page.click("#connect");
await page.waitForFunction(() => document.querySelectorAll("#timeline .row").length >= 8, null, { timeout: 8000 });

const rows = await page.$$eval("#timeline .row", (rs) => rs.map((r) => {
  const cells = r.querySelectorAll("span");
  return { off: cells[0].textContent, seq: cells[1].textContent.replace("s", ""), type: cells[2].textContent, id: cells[3].textContent };
}));
const state = await page.textContent("#state");
const statsText = await page.textContent("#stats");

// ── verify browser projection equals the oracle ────────────────────────────
const browserIds = rows.map((r) => r.id);
const oracleIds = ORACLE.map((e) => e.eventId);
const ok = JSON.stringify(browserIds) === JSON.stringify(oracleIds);
console.log(JSON.stringify({
  state: state.trim(),
  rows: rows.length,
  oracleMatches: ok,
  browserIds,
  stats: statsText.trim(),
  pageErrors: errors,
}, null, 2));

await browser.close();
child.kill("SIGINT");
process.exit(ok && state.trim() === "LIVE" && errors.length === 0 ? 0 : 1);
