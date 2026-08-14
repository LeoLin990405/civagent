/**
 * segment.mjs — P1 evidence package: single-writer immutable segment chain.
 *
 * Plan §11.3: the writer advances `committedLength` only across a complete
 * checksummed record. Recovery ignores an incomplete tail outside
 * `committedLength` and rejects malformed data inside the committed prefix.
 * Generation N is frozen byte-for-byte after a crash; a separate content-
 * addressed SegmentSeal preserves the crash evidence without a self-referential
 * digest.
 *
 * File layout (JSONL):
 *   line 0:  header  {"schema":"civ.segment/1","generation":N,"segmentId":...,
 *                     "firstSeq":0,"writer":...}
 *   line i>0: record  {"s":seq,"d":"<sha256 of canonical record bytes {s,e}>",
 *                      "e":{...canonical event...}}
 *   last:     trailer {"trailer":true,"committedLength":n,
 *                      "prefixDigest":"<sha256 of bytes through record n>",
 *                      "closeReason":...}
 *
 * A record is committed only when its line and digest verify; everything after
 * the first unverifiable record is an uncommitted tail.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const SEGMENT_SCHEMA = "civ.segment/1";
export const SEAL_SCHEMA = "civ.segment-seal/1";

function sha256Hex(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function recordBytes(record) {
  return Buffer.from(JSON.stringify({ s: record.s, e: record.e }));
}

export class SegmentWriter {
  /**
   * @param {string} file absolute segment file path (generation N)
   * @param {object} opts {generation, segmentId, writer, instrumentVersion}
   */
  constructor(file, opts) {
    this.file = file;
    this.generation = opts.generation;
    this.segmentId = opts.segmentId;
    this.writer = opts.writer;
    this.instrumentVersion = opts.instrumentVersion;
    this.committedLength = 0;
    this.closed = false;
    this._seq = opts.firstSeq ?? 0;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this._fd = fs.openSync(file, "w");
    const header = {
      schema: SEGMENT_SCHEMA, generation: this.generation, segmentId: this.segmentId,
      firstSeq: this._seq, writer: this.writer, instrumentVersion: this.instrumentVersion,
    };
    this._writeLine(Buffer.from(JSON.stringify(header)));
  }

  _writeLine(buf) {
    fs.writeSync(this._fd, buf);
    fs.writeSync(this._fd, Buffer.from("\n"));
    fs.fsyncSync(this._fd);
  }

  /**
   * Append one canonical event. The canonical `seq` is assigned here (at
   * commit time) so the record digest covers the final event bytes. The record
   * is committed (committedLength advances) only after the fsynced write
   * returns. Returns {seq, digest}.
   */
  append(event) {
    if (this.closed) throw new Error("segment closed");
    event.seq = this._seq++;
    const record = { s: event.seq, e: event };
    const bytes = recordBytes(record);
    record.d = sha256Hex(bytes);
    this._writeLine(Buffer.from(JSON.stringify(record)));
    this.committedLength++;
    return { seq: record.s, digest: record.d };
  }

  /** Normal close: write trailer covering only the committed prefix. */
  close(closeReason = "clean") {
    if (this.closed) return;
    const prefixDigest = this._prefixDigest();
    const trailer = {
      trailer: true, committedLength: this.committedLength,
      prefixDigest, closeReason, writer: this.writer,
    };
    this._writeLine(Buffer.from(JSON.stringify(trailer)));
    fs.closeSync(this._fd);
    this.closed = true;
  }

  _prefixDigest() {
    // digest over the file bytes covering header + committedLength records
    const all = fs.readFileSync(this.file);
    const lines = splitLines(all);
    const committedBytes = Buffer.concat(lines.slice(0, 1 + this.committedLength).map((l) => Buffer.concat([l, Buffer.from("\n")])));
    return sha256Hex(committedBytes);
  }
}

function splitLines(buf) {
  const lines = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0a) {
      lines.push(buf.subarray(start, i));
      start = i + 1;
    }
  }
  if (start < buf.length) lines.push(buf.subarray(start)); // uncommitted tail
  return lines;
}

/**
 * Verify a segment file. Returns:
 *  {ok, committedLength, prefixDigest, trailer, incompleteTail, malformedInside}
 * `malformedInside` is true when a record inside the verified prefix fails its
 * digest — that is data corruption, a hard error (never silently skipped).
 */
export function verifySegment(file) {
  const buf = fs.readFileSync(file);
  const lines = splitLines(buf);
  const header = JSON.parse(lines[0].toString("utf8"));
  if (header.schema !== SEGMENT_SCHEMA) throw new Error(`not a segment: ${file}`);
  let committedLength = 0;
  let trailer = null;
  let malformedInside = false;
  let cursor = lines[0].length + 1; // bytes consumed through header
  const recordLines = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const text = line.toString("utf8");
    if (text.trim() === "") continue;
    let rec;
    try {
      rec = JSON.parse(text);
    } catch {
      break; // unparseable line => tail
    }
    if (rec.trailer) {
      trailer = rec;
      break;
    }
    const bytes = recordBytes(rec);
    const expect = sha256Hex(bytes);
    if (rec.d !== expect) {
      if (committedLength === 0) {
        malformedInside = true; // first record bad => malformed inside committed prefix
      }
      break;
    }
    committedLength++;
    cursor += line.length + 1;
    recordLines.push(rec);
  }
  const committedBytes = buf.subarray(0, cursor);
  const prefixDigest = sha256Hex(committedBytes);
  const ok = trailer === null || (trailer.committedLength === committedLength && trailer.prefixDigest === prefixDigest);
  return {
    ok,
    generation: header.generation,
    firstSeq: header.firstSeq,
    committedLength,
    prefixDigest,
    trailer,
    incompleteTail: !(trailer !== null && trailer.committedLength === committedLength),
    malformedInside,
    records: recordLines,
  };
}

/** Read committed events from a verified segment. */
export function readCommittedEvents(file) {
  const v = verifySegment(file);
  if (!v.ok || v.malformedInside) throw new Error(`segment not trustworthy: ${file}`);
  return v.records.map((r) => r.e);
}

/**
 * Freeze generation N after a crash: publish a content-addressed SegmentSeal
 * containing the full physical-file digest (including the uncommitted tail),
 * committedLength, committed prefixDigest, verification result and close
 * reason. Generation N+1 links to the seal digest.
 */
export function sealSegment(cas, file, { verificationResult, closeReason, sealedAt }) {
  const bytes = fs.readFileSync(file);
  const digest = cas.put(bytes);
  const seal = {
    schema: SEAL_SCHEMA,
    generation: verificationResult.generation,
    physicalDigest: digest,
    physicalBytes: bytes.length,
    committedLength: verificationResult.committedLength,
    prefixDigest: verificationResult.prefixDigest,
    verificationResult: {
      ok: verificationResult.ok,
      malformedInside: verificationResult.malformedInside,
      incompleteTail: verificationResult.incompleteTail,
    },
    closeReason,
    sealedAt,
  };
  const sealDigest = cas.put(Buffer.from(JSON.stringify(seal)));
  return { seal, sealDigest };
}
