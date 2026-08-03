// Structured transcript sampling. Fixtures are synthetic events; no model or
// real match is required for the unit suite.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
const EVENTS_URL = new URL("../engine/v5/events.mjs", import.meta.url).href;

function tempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "civagent-transcript-"));
}

function writeEvents(home, matchId, turns) {
  const dir = path.join(home, ".civagent", "matches", matchId);
  fs.mkdirSync(dir, { recursive: true });
  const lines = turns.map((turn, index) => JSON.stringify({
    type: "turn",
    seq: index,
    actor: turn.actor,
    text: turn.text,
  }));
  fs.writeFileSync(path.join(dir, "events.jsonl"), `${lines.join("\n")}\n`);
}

async function selectInChild(home, matchId, options = {}) {
  const source = `
    import { selectTranscript } from ${JSON.stringify(EVENTS_URL)};
    console.log(JSON.stringify(selectTranscript(${JSON.stringify(matchId)}, ${JSON.stringify(options)})));
  `;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", source], {
      env: { ...process.env, HOME: home },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr));
      else resolve(JSON.parse(stdout));
    });
  });
}

test("actor-stratified selection preserves each office's representative turns and dispatch", async () => {
  const home = tempHome();
  const matchId = "synthetic-office-sampling";
  const long = (label) => `${label}:${"x".repeat(1800)}`;
  writeEvents(home, matchId, [
    { actor: "china/tang", text: long("COORDINATOR-OPEN") },
    { actor: "china/tang", text: "[→ menxia] audit the draft\n" },
    { actor: "china/tang#menxia", text: long("MENXIA-FIRST-VETO") },
    { actor: "china/tang#zhongshu", text: long("ZHONGSHU-FIRST-DRAFT") },
    { actor: "china/tang#menxia", text: long("MENXIA-MIDDLE-REVIEW") },
    { actor: "china/tang#zhongshu", text: long("ZHONGSHU-MIDDLE-REVISION") },
    { actor: "china/tang#menxia", text: long("MENXIA-LAST-APPROVAL") },
    { actor: "china/tang#shangshu", text: long("SHANGSHU-DISPATCH") },
    { actor: "china/tang", text: long("COORDINATOR-MIDDLE") },
    { actor: "china/tang", text: long("FINAL-OUTCOME") },
  ]);
  try {
    const result = await selectInChild(home, matchId, { maxChars: 6000 });
    assert.equal(result.selection.strategy, "actor-stratified");
    assert.equal(result.selection.actorCount, 4);
    assert.ok(result.text.length <= 6000, "selection itself stays inside the judge budget");
    assert.match(result.text, /\[→ menxia\]/, "dispatch evidence remains visible");
    assert.doesNotMatch(
      result.text,
      /audit the draft/,
      "dispatch sampling keeps the structured token, not a role-identifying renderer gloss",
    );
    assert.match(result.text, /MENXIA-FIRST-VETO/);
    assert.match(result.text, /MENXIA-MIDDLE-REVIEW/);
    assert.match(result.text, /MENXIA-LAST-APPROVAL/);
    assert.match(result.text, /ZHONGSHU-FIRST-DRAFT/);
    assert.match(result.text, /SHANGSHU-DISPATCH/);
    assert.match(result.text, /FINAL-OUTCOME/);
    assert.ok(result.selection.omittedContentChars > 0);
    assert.equal(result.selection.selectedTurns, result.selection.turns.length);
    assert.equal(
      result.selection.selectedContentChars,
      result.selection.turns.reduce((sum, turn) => sum + turn.selectedChars, 0),
    );
    assert.equal(
      result.selection.originalLength,
      result.selection.selectedContentChars + result.selection.omittedContentChars,
    );
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("actor-stratified selection degrades to first/middle/last for legacy actors without #", async () => {
  const home = tempHome();
  const matchId = "synthetic-legacy-sampling";
  writeEvents(home, matchId, [
    { actor: "china/ming", text: `LEGACY-FIRST:${"a".repeat(3000)}` },
    { actor: "china/ming", text: `LEGACY-BEFORE-MIDDLE:${"b".repeat(3000)}` },
    { actor: "china/ming", text: `LEGACY-MIDDLE:${"c".repeat(3000)}` },
    { actor: "china/ming", text: `LEGACY-BEFORE-LAST:${"d".repeat(3000)}` },
    { actor: "china/ming", text: `LEGACY-LAST:${"e".repeat(3000)}` },
  ]);
  try {
    const result = await selectInChild(home, matchId, { maxChars: 1200 });
    assert.equal(result.selection.actorCount, 1);
    assert.equal(result.selection.selectedTurns, 3);
    assert.match(result.text, /LEGACY-FIRST/);
    assert.match(result.text, /LEGACY-MIDDLE/);
    assert.match(result.text, /LEGACY-LAST/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("tail selection exactly preserves readMatchText's finite historical behavior", async () => {
  const home = tempHome();
  const matchId = "synthetic-tail-compat";
  writeEvents(home, matchId, [
    { actor: "china/tang", text: "abcdefghij" },
    { actor: "china/tang#menxia", text: "klmnopqrst" },
  ]);
  try {
    const result = await selectInChild(home, matchId, { maxChars: 7, strategy: "tail" });
    assert.equal(result.text, "nopqrst");
    assert.equal(result.selection.originalLength, 20);
    assert.equal(result.selection.selectedLength, 7);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("selection tolerates an empty or torn event stream", async () => {
  const home = tempHome();
  const matchId = "synthetic-torn";
  const dir = path.join(home, ".civagent", "matches", matchId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "events.jsonl"), "{\"type\":\"turn\"\n");
  try {
    const result = await selectInChild(home, matchId, { maxChars: 6000 });
    assert.equal(result.text, "");
    assert.deepEqual(result.selection, {
      strategy: "actor-stratified",
      originalLength: 0,
      totalTurns: 0,
      actorCount: 0,
      selectedLength: 0,
      selectedContentChars: 0,
      omittedContentChars: 0,
      selectedTurns: 0,
      truncated: false,
    });
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
