/**
 * ws.mjs — P5 host: minimal RFC 6455 WebSocket server bridging the scoped
 * civ.events feed to a browser (plan §14.2/§14.3).
 *
 * Reuses the same RPC dispatch as the Unix-socket transport (civ.describe /
 * civ.subscribe / civ.unsubscribe / civ.repair) so CLI and GUI speak one
 * contract. Also serves the research GUI's static files (index.html,
 * app.js, civ-client.mjs) so a browser only needs http://host:port/.
 */
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dispatchRpc } from "./rpc.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UI_DIR = path.resolve(__dirname, "..", "ui");
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function encodeFrame(payload, opcode = 0x1) {
  const buf = Buffer.from(payload, "utf8");
  const len = buf.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x80 | opcode, len]);
  } else if (len < 65536) {
    header = Buffer.from([0x80 | opcode, 126, (len >> 8) & 0xff, len & 0xff]);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, buf]);
}

export class WsServer {
  /**
   * @param {object} opts {port, feed, capabilities}
   */
  constructor(opts) {
    this.port = opts.port;
    this.feed = opts.feed;
    this.capabilities = opts.capabilities ?? { versions: { describe: "1", feed: "1" }, limits: { queue: 1000, tail: 500 } };
    this.connections = new Set();
    this._server = null;
  }

  async listen() {
    this._server = http.createServer((req, res) => this._onHttp(req, res));
    // RFC 6455 upgrades arrive on the 'upgrade' event, not 'request'
    this._server.on("upgrade", (req, socket) => this._upgradeRaw(req, socket));
    await new Promise((resolve) => this._server.listen(this.port, "127.0.0.1", resolve));
    return this.port;
  }

  close() {
    for (const c of this.connections) c.socket.destroy();
    this._server?.close();
  }

  _onHttp(req, res) {
    // static GUI files
    const urlPath = new URL(req.url, "http://x").pathname;
    const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    // civ-client.mjs lives in host/ (single source shared by GUI and CLI)
    const file = safe === "/" ? path.join(UI_DIR, "index.html")
      : safe === "/civ-client.mjs" ? path.resolve(__dirname, "civ-client.mjs")
      : path.join(UI_DIR, safe);
    if (!file.startsWith(UI_DIR) && file !== path.resolve(__dirname, "civ-client.mjs")) {
      res.writeHead(404); res.end("not found"); return;
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404); res.end("not found"); return;
    }
    const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") || file.endsWith(".mjs") ? "text/javascript" : "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(fs.readFileSync(file));
  }

  _upgradeRaw(req, socket) {
    const key = req.headers["sec-websocket-key"];
    if (!key) { socket.destroy(); return; }
    const accept = crypto.createHash("sha1").update(key + WS_GUID).digest("base64");
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
    );
    const conn = { socket, buffer: Buffer.alloc(0), subscriptions: new Set() };
    this.connections.add(conn);
    socket.on("data", (chunk) => this._onData(conn, chunk));
    socket.on("close", () => { this.connections.delete(conn); this.feed.subscriptions.delete(conn); });
    socket.on("error", () => {});
  }

  _onData(conn, chunk) {
    conn.buffer = Buffer.concat([conn.buffer, chunk]);
    while (true) {
      const frame = decodeFrame(conn.buffer);
      if (!frame) return;
      conn.buffer = conn.buffer.subarray(frame.consumed);
      if (frame.opcode === 0x8) { conn.socket.end(encodeFrame(Buffer.alloc(0), 0x8)); return; }
      if (frame.opcode === 0x9) { conn.socket.write(encodeFrame(frame.payload, 0xa)); continue; }
      if (frame.opcode !== 0x1) continue; // ignore binary/continuation
      this._onMessage(conn, frame.payload.toString("utf8"));
    }
  }

  _onMessage(conn, line) {
    let msg;
    try { msg = JSON.parse(line); } catch { return this._send(conn, { rpcId: null, ok: false, error: "malformed frame" }); }
    const { rpcId, method, params } = msg;
    try {
      const result = dispatchRpc(this.feed, this.capabilities, method, params);
      if (method === "civ.subscribe" && result.ok) {
        conn.subscriptions.add(result.subscriptionId);
        // push snapshot frames immediately (before the response, like the
        // socket transport), then live frames on publish
        const { matchId, subscriptionId, generation, headOffset } = result;
        for (let i = 0; i < headOffset; i++) {
          const ev = this.feed.eventSource(matchId)[i];
          this._send(conn, { topic: "civ.events", subscriptionId, matchId, generation, feedOffset: i, event: ev, cursor: { generation, feedOffset: i, headOffset } });
        }
        this._drain(conn);
      }
      this._send(conn, { rpcId, ok: true, result });
    } catch (e) {
      this._send(conn, { rpcId, ok: false, error: e.code ?? "ERROR", message: e.message });
    }
  }

  _drain(conn) {
    for (const subId of conn.subscriptions) {
      let frame;
      while ((frame = this.feed.nextFrame(subId))) this._send(conn, frame);
    }
  }

  _send(conn, obj) {
    conn.socket.write(encodeFrame(JSON.stringify(obj)));
  }

  /** Publish one event to every connected subscriber and drain. */
  publish(matchId, event) {
    this.feed.publish(matchId, event);
    for (const conn of this.connections) this._drain(conn);
  }
}

/** Decode one client frame (masked). Returns {opcode, payload, consumed} or null. */
function decodeFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    len = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }
  if (masked) {
    if (buf.length < offset + 4) return null;
    const mask = buf.subarray(offset, offset + 4);
    offset += 4;
    if (buf.length < offset + len) return null;
    const payload = Buffer.alloc(len);
    for (let i = 0; i < len; i++) payload[i] = buf[offset + i] ^ mask[i % 4];
    return { opcode, payload, consumed: offset + len };
  }
  if (buf.length < offset + len) return null;
  return { opcode, payload: buf.subarray(offset, offset + len), consumed: offset + len };
}
