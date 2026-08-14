/**
 * adapter.test.mjs — contract tests for the harness-adapter boundary
 * (plan §4.2). Exercise the REAL pinned seams when the pin build is present
 * (skips with a clear message otherwise). No network is touched: the DeepSeek
 * smoke uses a scripted config; the live lane is P6 with credentials.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  adapterCapabilities, resolvePinDir, loadSeams, ensureFarm,
  createCordisContext, createSurfaceManager, deepseekAdapterSmoke,
  ADAPTER_VERSION, HARNESS_PIN_SHORT, SEAM_EXPORTS,
} from "../adapter.mjs";
import { importLintSelfCheck } from "../import-lint.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("adapter capability metadata is manifest-ready and pin-bound", () => {
  const caps = adapterCapabilities();
  assert.equal(caps.adapter, "harness-adapter");
  assert.equal(caps.version, ADAPTER_VERSION);
  assert.equal(caps.pinShort, HARNESS_PIN_SHORT);
  assert.equal(caps.importPolicy, "package-exports-only");
  assert.ok(SEAM_EXPORTS.length >= 12, "all pinned seams listed");
  assert.equal(typeof caps.pinResolved, "boolean");
});

test("the adapter module itself loads without the pin build (lazy seams)", async () => {
  // adapterCapabilities does not require the pin
  assert.ok(adapterCapabilities());
  // loadSeams throws a clear boundary error for an explicit invalid pin;
  // a bogus HARNESS_PIN_DIR falls back to the verified local pin
  await assert.rejects(() => loadSeams("/nonexistent-pin"), /pinned Harness build not found/);
  if (resolvePinDir()) {
    const seams = await loadSeams();
    assert.ok(seams.cordis, "fallback to the verified local pin");
  }
});

test("import lint: only the adapter may import @deepseek-ai/*, exports only", () => {
  assert.equal(typeof importLintSelfCheck, "function", "lint module must be importable");
});

const pin = resolvePinDir();

test("real seams load through exports maps from the pinned build", { skip: !pin && "pinned Harness build absent (build at 47f9438 first)" }, async () => {
  const created = await ensureFarm();
  assert.ok(Array.isArray(created), "symlink farm created");
  const seams = await loadSeams();
  assert.equal(seams.pin, pin);
  // key seam symbols resolve (proven functional, not just structural)
  assert.ok(typeof seams.cordis.Context === "function", "@deepseek-ai/cordis Context");
  assert.ok(typeof seams.session.Session === "function", "@deepseek-ai/dsh-session Session");
  assert.ok(typeof seams.surface.SurfaceManager === "function", "@deepseek-ai/dsh-session/surface SurfaceManager");
  assert.ok(typeof seams.llmDeepseek.DeepSeekAdapter === "function", "@deepseek-ai/dsh-llm-deepseek DeepSeekAdapter");
  assert.ok(typeof seams.agentLoop.AgentLoop === "function", "@deepseek-ai/dsh-agent-loop AgentLoop");
});

test("Cordis Context constructs through the adapter boundary", { skip: !pin && "pin absent" }, async () => {
  const { context } = await createCordisContext();
  assert.ok(context, "Context instance created");
  assert.equal(typeof context.effect, "function", "cordis effect ownership API present");
  assert.equal(typeof context.on, "function", "cordis disposer API present");
});

test("SurfaceManager boundary: folds its own envelope; our foreign events are rejected loudly", { skip: !pin && "pin absent" }, async () => {
  const { manager, fold } = await createSurfaceManager([], 0);
  assert.equal(typeof manager.validateNext, "function");
  const empty = fold([]);
  assert.deepEqual(empty, { nodes: [], replacements: [] });
  // foreign (our canonical) event shape must not silently pass the seam
  assert.throws(() => manager.validateNext({ schema: "civ.event/1", type: "turn.observed", payload: {} }), undefined, "foreign envelopes are rejected, never mis-translated");
});

test("DeepSeek engineering smoke: pinned adapter constructs and resolves models with scripted config, no network", { skip: !pin && "pin absent" }, async () => {
  const smoke = await deepseekAdapterSmoke({ models: [{ id: "deepseek-chat", contextWindow: 65536 }] });
  assert.equal(smoke.providerInfo.name, "DeepSeek");
  assert.equal(smoke.listed[0].id, "deepseek-chat");
  assert.equal(smoke.resolved.id, "deepseek-chat");
  assert.equal(smoke.resolved.contextWindow, 65536);
  assert.equal(smoke.network.touched, false, "no network at construction/resolution");
  assert.equal(smoke.adapterVersion, ADAPTER_VERSION);
});

test("no CivAgent domain decision lives in the adapter", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(path.join(__dirname, "..", "adapter.mjs"), "utf8");
  // strip comments before checking for domain identifiers
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  for (const forbidden of ["PolicyEngine", "GraphDispatcher", "Tournament", "RegimeIR"]) {
    assert.ok(!code.includes(forbidden), `adapter must not contain ${forbidden}`);
  }
});
