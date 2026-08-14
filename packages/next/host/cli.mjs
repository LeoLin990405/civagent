#!/usr/bin/env node
/**
 * cli.mjs — P5 CLI client on the same RPC/civ.events contracts as the GUI.
 *
 * The CLI is not a privileged alternate orchestration path (plan §14.3): it
 * uses civ.describe + scoped civ.subscribe and renders only canonical/
 * projection contracts.
 *
 * Usage:
 *   node packages/next/host/cli.mjs describe --socket /tmp/civ.sock
 *   node packages/next/host/cli.mjs subscribe --socket /tmp/civ.sock --match <id> --scope <token> [--count N] [--timeout-ms M]
 */
import { RpcClient } from "./rpc.mjs";
import { CivClient } from "./civ-client.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function main() {
  const cmd = process.argv[2];
  const socketPath = arg("--socket", "/tmp/civ-next.sock");
  const client = new RpcClient(socketPath);
  await client.connect();

  if (cmd === "describe") {
    const res = await client.call("civ.describe");
    console.log(JSON.stringify(res, null, 2));
    client.close();
    return;
  }

  if (cmd === "subscribe") {
    const matchId = arg("--match");
    const scopeToken = arg("--scope");
    const count = Number(arg("--count", "10"));
    const timeoutMs = Number(arg("--timeout-ms", "3000"));
    if (!matchId) throw new Error("--match required");
    // register the feed handler BEFORE subscribing: snapshot frames can
    // arrive immediately after the subscribe response and must never be lost
    let shown = 0;
    client.onFeed((frame) => {
      if (frame.topic === "civ.events") {
        shown++;
        console.log(`[${frame.generation}:${frame.feedOffset}] ${frame.event.type} ${frame.event.eventId}`);
        if (shown >= count) { client.close(); process.exit(0); }
      } else if (frame.state) {
        console.log(`STATE ${frame.state} gen=${frame.generation}`);
      }
    });
    const sub = await client.call("civ.subscribe", { matchId, scopeToken });
    if (!sub.ok) {
      console.error(JSON.stringify(sub, null, 2));
      client.close();
      process.exit(1);
    }
    setTimeout(() => { console.error(`timeout after ${shown} events`); client.close(); process.exit(shown ? 0 : 2); }, timeoutMs);
    return;
  }

  console.error(`unknown command ${cmd}; use describe | subscribe`);
  client.close();
  process.exit(1);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
