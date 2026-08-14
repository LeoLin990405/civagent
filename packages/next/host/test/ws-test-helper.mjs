/**
 * ws-test-helper.mjs — shared minimal RFC 6455 test client for headless
 * WebSocket contract tests (server frames unmasked, client frames masked).
 */
import http from "node:http";
import crypto from "node:crypto";

export function maskFrame(payload) {
  const data = Buffer.from(payload, "utf8");
  const mask = crypto.randomBytes(4);
  const masked = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) masked[i] = data[i] ^ mask[i % 4];
  let header;
  if (data.length < 126) header = Buffer.from([0x81, 0x80 | data.length]);
  else header = Buffer.from([0x81, 0x80 | 126, (data.length >> 8) & 0xff, data.length & 0xff]);
  return Buffer.concat([header, mask, masked]);
}

export function parseServerFrames(buf) {
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

export class WsTestClient {
  static async connect(port, pathName = "/") {
    const key = crypto.randomBytes(16).toString("base64");
    const req = http.request({
      hostname: "127.0.0.1", port, path: pathName,
      headers: { Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Key": key, "Sec-WebSocket-Version": "13" },
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
    return this.messages.slice(start);
  }
  close() { this.socket.destroy(); }
}
