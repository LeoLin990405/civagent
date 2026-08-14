#!/usr/bin/env node
/**
 * serve.mjs — P5/P6 host boot entry: research GUI + feed server.
 *
 * `node packages/next/host/serve.mjs --match <id> --store <dir> [--ws-port 8899]`
 *
 * Serves a match's committed events (from a Next EventStore segment dir) over
 * the scoped civ.events WebSocket and serves the research GUI at
 * http://127.0.0.1:<port>/. Scope tokens come from --scope-token (default:
 * the match id itself, for local research use).
 *
 * The GUI and CLI share the same contracts; this entry is not a privileged
 * orchestration path (plan §14.3).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { FeedServer } from "./feed.mjs";
import { WsServer } from "./ws.mjs";
import { readCommittedEvents } from "../evidence/segment.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function main() {
  const matchId = arg("--match");
  const storeDir = arg("--store");
  const wsPort = Number(arg("--ws-port", "8899"));
  const scopeToken = arg("--scope-token", matchId ?? "local");
  if (!matchId || !storeDir) {
    console.error("usage: node host/serve.mjs --match <id> --store <segment-dir> [--ws-port 8899]");
    process.exit(1);
  }
  const segmentFile = path.join(storeDir, "segment-000001.jsonl");
  if (!fs.existsSync(segmentFile)) {
    console.error(`no segment file at ${segmentFile}`);
    process.exit(1);
  }
  const events = readCommittedEvents(segmentFile);
  const feed = new FeedServer({
    eventSource: (m) => (m === matchId ? events : []),
    allowedScopes: new Map([[matchId, scopeToken]]),
  });
  const ws = new WsServer({ port: wsPort, feed });
  await ws.listen();
  console.log(JSON.stringify({
    status: "serving",
    match: matchId,
    events: events.length,
    scopeToken,
    gui: `http://127.0.0.1:${wsPort}/`,
    describe: `ws://127.0.0.1:${wsPort}/`,
  }, null, 2));
  process.on("SIGINT", () => { ws.close(); process.exit(0); });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
