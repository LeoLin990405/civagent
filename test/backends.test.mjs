import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBackend, isKnownBackend, buildBackendArgs } from "../engine/v5/backends.mjs";

test("resolveBackend maps native + cc forks to commands", () => {
  assert.equal(resolveBackend("native"), "claude");
  assert.equal(resolveBackend("claude"), "claude");
  assert.equal(resolveBackend("cn:doubao"), "cc-doubao");
  assert.equal(resolveBackend("cn:glm"), "cc-glm");
  assert.equal(resolveBackend("cn:mimo"), "cc-mimo");
});

test("resolveBackend defaults empty/undefined to native", () => {
  assert.equal(resolveBackend(undefined), "claude");
  assert.equal(resolveBackend(""), "claude");
  assert.equal(resolveBackend("  "), "claude");
});

test("resolveBackend rejects gemini (hard rule) with a policy message", () => {
  assert.throws(() => resolveBackend("gemini"), /forbidden backend.*policy/i);
  assert.throws(() => resolveBackend("GEMINI"), /forbidden/i);
});

test("resolveBackend rejects non-claude-compatible engines (codex/opencode)", () => {
  assert.throws(() => resolveBackend("codex"), /unsupported backend/i);
  assert.throws(() => resolveBackend("opencode"), /unsupported backend/i);
});

test("resolveBackend rejects unknown backends instead of silently using claude", () => {
  assert.throws(() => resolveBackend("totally-made-up"), /unknown backend/i);
});

test("isKnownBackend reflects resolveBackend", () => {
  assert.ok(isKnownBackend("cn:kimi"));
  assert.ok(!isKnownBackend("gemini"));
  assert.ok(!isKnownBackend("nope"));
});

// ── buildBackendArgs ────────────────────────────────────────────────────────

test("buildBackendArgs: with prompt returns full args array", () => {
  const result = buildBackendArgs({ agentsJson: '{"agents":[]}', prompt: "do something" });
  assert.deepEqual(result, [
    "--agents", '{"agents":[]}',
    "--output-format", "stream-json", "--verbose",
    "-p", "do something",
  ]);
});

// stream-json is the default and must stay the default. Under the previous
// default (`text`) `-p` prints only the coordinator's final assistant message,
// so every office's deliberation is discarded: three of fifteen E1 transcripts
// contained no policy at all, and each scored last in its scenario.
test("buildBackendArgs: stream-json is on by default and opt-out is explicit", () => {
  const on = buildBackendArgs({ agentsJson: "{}", prompt: "x" });
  assert.ok(on.includes("--output-format") && on[on.indexOf("--output-format") + 1] === "stream-json");
  assert.ok(on.includes("--verbose"), "stream-json requires --verbose to emit subagent events");

  const off = buildBackendArgs({ agentsJson: "{}", prompt: "x", streamJson: false });
  assert.deepEqual(off, ["--agents", "{}", "-p", "x"], "opt-out restores the old shape exactly");
});

test("buildBackendArgs: empty-string prompt omits -p", () => {
  const result = buildBackendArgs({ agentsJson: '{"agents":[]}', prompt: "" });
  assert.ok(!result.includes("-p"), "no prompt flag when the prompt is empty");
});

test("buildBackendArgs: undefined prompt omits -p", () => {
  const result = buildBackendArgs({ agentsJson: '{"agents":[]}', prompt: undefined });
  assert.ok(!result.includes("-p"), "no prompt flag when the prompt is absent");
});

test("buildBackendArgs: agentsJson is passed through verbatim", () => {
  const json = JSON.stringify({ agents: [{ id: "rome", skills: [] }], extra: true });
  const result = buildBackendArgs({ agentsJson: json, prompt: "go" });
  assert.equal(result[1], json);
});
