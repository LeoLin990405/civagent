/**
 * rpc.mjs — P5 host: unary RPC + scoped feed transport over a JSON-framed
 * Unix socket (plan §14.2).
 *
 * Upstream commands are unary RPC with rpcId correlation; downstream live
 * updates use the scoped `civ.events` topic. The server exposes only the
 * closed method set (civ.describe / civ.subscribe / civ.unsubscribe /
 * civ.repair) — never the whole Context.
 */
import net from "node:net";
import fs from "node:fs";
import crypto from "node:crypto";

import { FeedServer, ScopeDeniedError } from "./feed.mjs";

export const RPC_METHODS = ["civ.describe", "civ.subscribe", "civ.unsubscribe", "civ.repair"];

export function newRpcId() {
  return `rpc-${crypto.randomUUID()}`;
}

export class RpcServer {
  /**
   * @param {object} opts {socketPath, feed: FeedServer, capabilities}
   */
  constructor(opts) {
    this.socketPath = opts.socketPath;
    this.feed = opts.feed;
    this.capabilities = opts.capabilities ?? { versions: { describe: "1", feed: "1" }, limits: { queue: 1000, tail: 500 } };
    this.sockets = new Set();
    this._server = null;
  }

  listen() {
    try { fs.unlinkSync(this.socketPath); } catch { /* not present */ }
    this._server = net.createServer((socket) => {
      this.sockets.add(socket);
      let buf = "";
      socket.on("data", (chunk) => {
        buf += chunk.toString("utf8");
        let idx;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (!line.trim()) continue;
          this._handle(socket, line);
        }
      });
      socket.on("close", () => this.sockets.delete(socket));
    });
    return new Promise((resolve) => this._server.listen(this.socketPath, resolve));
  }

  close() {
    for (const s of this.sockets) s.destroy();
    this._server?.close();
    try { fs.unlinkSync(this.socketPath); } catch { /* already gone */ }
  }

  _send(socket, obj) {
    socket.write(JSON.stringify(obj) + "\n");
  }

  _handle(socket, line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return this._send(socket, { rpcId: null, ok: false, error: "malformed frame" });
    }
    const { rpcId, method, params } = msg;
    if (!RPC_METHODS.includes(method)) {
      return this._send(socket, { rpcId, ok: false, error: `unknown method ${method}` });
    }
    try {
      const result = dispatchRpc(this.feed, this.capabilities, method, params);
      if (method === "civ.subscribe" && result.ok) {
        // push the snapshot as event frames, then live frames on publish
        this._pushSubscription(socket, result, params);
      }
      this._send(socket, { rpcId, ok: true, result });
    } catch (e) {
      this._send(socket, { rpcId, ok: false, error: e.code ?? "ERROR", message: e.message });
    }
  }

  /** Push snapshot + live frames for a subscription (server -> client). */
  _pushSubscription(socket, subResult, params) {
    const { matchId, subscriptionId, generation, headOffset } = subResult;
    for (let i = 0; i < headOffset; i++) {
      const ev = this.feed.eventSource(matchId)[i];
      this._send(socket, {
        topic: "civ.events", subscriptionId, matchId, generation,
        feedOffset: i, event: ev, cursor: { generation, feedOffset: i, headOffset },
      });
    }
    // live: drain what arrived after snapshot, then on every publish
    const drain = () => {
      let frame;
      while ((frame = this.feed.nextFrame(subscriptionId))) {
        this._send(socket, frame);
      }
    };
    drain();
    socket.on("civ-publish", drain); // internal hook; publish() triggers below
  }

  /** Publish an event to all subscribers and push their drained frames. */
  publish(matchId, event) {
    this.feed.publish(matchId, event);
    for (const s of this.sockets) s.emit("civ-publish");
  }
}

/** Shared RPC dispatch used by both the socket and WebSocket transports. */
export function dispatchRpc(feed, capabilities, method, params) {
  switch (method) {
    case "civ.describe":
      return {
        schema: "civ.describe/1",
        protocols: capabilities,
        feedGeneration: feed.generation,
        methods: RPC_METHODS,
      };
    case "civ.subscribe": {
      const { matchId, scopeToken, since } = params;
      const sub = feed.subscribe({ matchId, scopeToken, since });
      return { ok: true, ...sub };
    }
    case "civ.unsubscribe":
      feed.subscriptions.delete(params.subscriptionId);
      return { ok: true };
    case "civ.repair":
      return feed.repair({ subscriptionId: params.subscriptionId, fromOffset: params.fromOffset });
    default:
      throw new Error(`unhandled ${method}`);
  }
}
/** JSON-framed RPC client over a Unix socket. */
export class RpcClient {
  constructor(socketPath) {
    this.socketPath = socketPath;
    this._socket = null;
    this._pending = new Map(); // rpcId -> resolve
    this.feedHandler = null;
  }

  async connect() {
    this._socket = net.createConnection(this.socketPath);
    let buf = "";
    this._socket.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        if (msg.topic && this.feedHandler) this.feedHandler(msg);
        else if (msg.rpcId && this._pending.has(msg.rpcId)) {
          const { resolve } = this._pending.get(msg.rpcId);
          this._pending.delete(msg.rpcId);
          resolve(msg);
        }
      }
    });
    await new Promise((resolve) => this._socket.once("connect", resolve));
    return this;
  }

  call(method, params = {}) {
    const rpcId = newRpcId();
    return new Promise((resolve) => {
      this._pending.set(rpcId, { resolve });
      this._socket.write(JSON.stringify({ rpcId, method, params }) + "\n");
    });
  }

  onFeed(handler) {
    this.feedHandler = handler;
  }

  close() {
    this._socket?.destroy();
  }
}
