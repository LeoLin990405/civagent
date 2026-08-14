/**
 * cas.mjs — P1 evidence package: immutable content-addressed raw-byte store.
 *
 * Plan §11: artifacts are immutable bytes addressed by content digest; an event
 * may reference bytes only after CAS publication is durable. This store is
 * append-only and hash-addressed: `put` never overwrites, `get` verifies the
 * digest on read.
 *
 * Durability level: process-crash (awaited write + fsync). Power-loss claims
 * require the separate synchronization lane (plan §11.3), out of scope here.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function sha256Hex(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export class Cas {
  /**
   * @param {string} root directory that will contain the cas/ tree
   */
  constructor(root) {
    this.root = path.join(root, "cas");
    fs.mkdirSync(this.root, { recursive: true });
  }

  _pathFor(digest) {
    if (!/^sha256:[0-9a-f]{64}$/.test(digest)) throw new Error(`bad digest ${digest}`);
    const hex = digest.slice("sha256:".length);
    return path.join(this.root, hex.slice(0, 2), hex.slice(2));
  }

  /**
   * Publish bytes. Returns the content digest. Idempotent for identical bytes;
   * refuses to overwrite an existing different artifact (hash collision or
   * corruption is a hard error, never a silent repair).
   */
  put(bytes) {
    if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
    const digest = `sha256:${sha256Hex(bytes)}`;
    const target = this._pathFor(digest);
    if (fs.existsSync(target)) {
      const existing = fs.readFileSync(target);
      if (!existing.equals(bytes)) throw new Error(`CAS collision at ${digest}`);
      return digest;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const tmp = `${target}.tmp-${process.pid}`;
    const fd = fs.openSync(tmp, "w");
    try {
      fs.writeSync(fd, bytes);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, target);
    const dirFd = fs.openSync(path.dirname(target), "r");
    try {
      fs.fsyncSync(dirFd); // best-effort dir sync (process-crash lane)
    } finally {
      fs.closeSync(dirFd);
    }
    return digest;
  }

  /** Read bytes back; digest mismatch is a hard error. */
  get(digest) {
    const bytes = fs.readFileSync(this._pathFor(digest));
    const actual = `sha256:${sha256Hex(bytes)}`;
    if (actual !== digest) throw new Error(`CAS readback mismatch for ${digest}: got ${actual}`);
    return bytes;
  }

  exists(digest) {
    return fs.existsSync(this._pathFor(digest));
  }

  /** Full inventory digest — content hash over all stored artifact digests. */
  inventoryDigest() {
    const all = [];
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else all.push(fs.readFileSync(p, "utf8").trim());
      }
    };
    walk(this.root);
    return sha256Hex(JSON.stringify(all.sort()));
  }
}
