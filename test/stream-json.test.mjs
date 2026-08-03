// stream-json.test.mjs — rendering Claude Code's stream-json output into the
// transcript the judge reads.
//
// Why this module exists. The backend was spawned as `claude --agents <json>
// -p "<task>"`, whose default output format is `text` — and `text` prints only
// the coordinator's final assistant message. Everything the regime's offices
// said to each other went to the subagent channel and was discarded. In the E1
// pilot that produced three transcripts (of fifteen) containing no policy at
// all, only claims that the work "was already drafted, debated through two
// rounds of Menxia veto ... and dispatched" — and each of those three scored
// last in its scenario. The judge was ranking whether a regime happened to
// restate its work in the final message.
//
// Measured on one real Tang run of the same task: 328 characters captured under
// `text`, 4,663 recoverable from `stream-json` — including the Chancellery's
// actual review verdict, which is the single most important behavioural signal
// a checks-and-balances regime produces.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderStreamLine, StreamRenderer } from "../engine/v5/stream-json.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, "fixtures", "stream-json-sample.jsonl");
const lines = fs.readFileSync(FIXTURE, "utf8").split("\n").filter(Boolean);

test("a non-JSON line passes through unchanged", () => {
  // Backends that do not honour --output-format, and the harness's own
  // "[v5] ..." status lines, must survive rather than vanish.
  const r = renderStreamLine("[v5] backend exited 0");
  assert.equal(r.text, "[v5] backend exited 0");
  assert.equal(r.actor, null);
});

test("the system init blob is dropped", () => {
  // It carries the full tool list and model config — kilobytes of noise that
  // would crowd out actual governance content inside the judge's 6000-char cap.
  assert.equal(renderStreamLine(lines[0]), null);
});

test("the result summary is dropped (it is accounting, not deliberation)", () => {
  assert.equal(renderStreamLine(lines[5]), null);
});

test("a coordinator text message is rendered", () => {
  const r = renderStreamLine(lines[4]);
  assert.match(r.text, /中书省正在起草中/);
  assert.equal(r.actor, null, "coordinator output is not attributed to an office");
});

test("delegating to an office is rendered with the office named", () => {
  const r = renderStreamLine(lines[1]);
  assert.match(r.text, /zhongshu/, "the office receiving the work must be visible");
});

test("subagent output is rendered — this is the content that was being lost", () => {
  const r = renderStreamLine(lines[3]);
  assert.match(r.text, /中书令臣姚崇/, "the drafted edict must reach the transcript");
});

test("internal agent-launch metadata is not quoted into the transcript", () => {
  // The tool_result for an async Agent launch says in its own text: "never
  // quote or paste any part of it, including the agentId". Echoing it into the
  // transcript would put an instruction-shaped string in front of the judge and
  // leak an internal id.
  const r = renderStreamLine(lines[2]);
  assert.ok(r === null || !/agentId/.test(r.text), "agent-launch metadata must not be echoed");
});

test("StreamRenderer attributes an office's reply to that office", () => {
  // The tool_use that dispatches work carries input.subagent_type; the reply
  // carries parent_tool_use_id pointing back at it. Holding that mapping is
  // what turns an anonymous wall of text into an attributable transcript — and
  // it is the same mapping the runtime-graph diff needs to compare declared
  // edges against exercised ones at office level.
  const r = new StreamRenderer();
  const rendered = lines.map((l) => r.render(l)).filter(Boolean);
  const office = rendered.find((x) => /中书令臣姚崇/.test(x.text));
  assert.ok(office, "the office reply must be rendered at all");
  assert.equal(office.actor, "zhongshu", "and be attributed to the office that produced it");
});

test("the rendered transcript recovers far more than the final message alone", () => {
  const r = new StreamRenderer();
  const rendered = lines.map((l) => r.render(l)).filter(Boolean).map((x) => x.text).join("\n");
  // The final coordinator message alone is the "中书省正在起草中" line.
  const finalOnly = "中书省正在起草中，待其完稿即转门下省审核，请稍候。";
  assert.ok(rendered.length > finalOnly.length * 2,
    `rendered transcript (${rendered.length}) must carry more than the final message (${finalOnly.length})`);
  assert.match(rendered, /中书令臣姚崇/, "and must include what the offices actually produced");
});

test("a malformed JSON line is passed through rather than dropped", () => {
  const r = renderStreamLine('{"type":"assistant","message":');
  assert.ok(r && r.text.includes('{"type":"assistant"'), "never silently swallow output");
});

test("an assistant message with no content array does not throw", () => {
  assert.doesNotThrow(() => renderStreamLine('{"type":"assistant","message":{"role":"assistant"}}'));
  assert.doesNotThrow(() => renderStreamLine('{"type":"user"}'));
  assert.doesNotThrow(() => renderStreamLine("null"));
  assert.doesNotThrow(() => renderStreamLine(""));
});
