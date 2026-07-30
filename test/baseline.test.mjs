// baseline.test.mjs — tests for baseline control variant generation.
// Covers: solo / random-N / flat-N generation, seed reproducibility,
// validation compliance, directory safety, IDENTITY table format,
// connectivity of random graphs, and CLI integration.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  generateBaseline,
  BASELINE_TYPES,
  mulberry32,
  parseIdentityAgentIds,
} from "../engine/baseline.mjs";
import { validateRegimeTopology } from "../engine/topology/validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const rmrf = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ } };

// ── mulberry32 PRNG ─────────────────────────────────────────────────────────

test("mulberry32: same seed → same sequence", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test("mulberry32: different seeds → different sequences", () => {
  const a = mulberry32(1);
  const b = mulberry32(2);
  const vals = new Set();
  for (let i = 0; i < 20; i++) vals.add(a());
  const bVals = [];
  for (let i = 0; i < 20; i++) bVals.push(b());
  // At least some values from b should NOT appear in a's sequence.
  const novel = bVals.filter((v) => !vals.has(v));
  assert.ok(novel.length > 0, "different seeds must diverge");
});

// ── solo baseline ───────────────────────────────────────────────────────────

test("solo: 1 agent, passes validation (topo regime)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const r = generateBaseline("china/tang", "solo", { outRoot, seed: 1 });
    assert.ok(r.validation.ok, `validation errors: ${r.validation.errors?.join("; ")}`);
    assert.equal(r.metrics.nodes, 1);
    assert.equal(r.metrics.edges, 0);

    const meta = JSON.parse(fs.readFileSync(path.join(r.outDir, "metadata.json"), "utf8"));
    assert.equal(meta.agentCount, 1);
    assert.ok(meta._baseline);
    assert.equal(meta._baseline.type, "solo");

    const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
    assert.ok(identity.includes("Agent ID"), "IDENTITY must have Agent ID table header");
    const ids = parseIdentityAgentIds(identity);
    assert.equal(ids.length, 1);
  } finally {
    rmrf(outRoot);
  }
});

test("solo: passes validation (non-topo regime)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const r = generateBaseline("china/qin", "solo", { outRoot, seed: 1 });
    assert.ok(r.validation.ok || r.validation.skipped, "must be ok or skipped (no topo)");
    const meta = JSON.parse(fs.readFileSync(path.join(r.outDir, "metadata.json"), "utf8"));
    assert.equal(meta.agentCount, 1);
  } finally {
    rmrf(outRoot);
  }
});

// ── flat-N baseline ─────────────────────────────────────────────────────────

test("flat-N: N agents, 0 edges, passes validation", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const metaSrc = JSON.parse(fs.readFileSync(
      path.join(PROJECT_ROOT, "regimes", "china/tang", "metadata.json"), "utf8"));
    const r = generateBaseline("china/tang", "flat", { outRoot, seed: 1 });
    assert.ok(r.validation.ok, `validation errors: ${r.validation.errors?.join("; ")}`);
    assert.equal(r.metrics.nodes, metaSrc.agentCount);
    assert.equal(r.metrics.edges, 0);

    const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
    const ids = parseIdentityAgentIds(identity);
    assert.equal(ids.length, metaSrc.agentCount);

    const topo = JSON.parse(fs.readFileSync(path.join(r.outDir, "topology.json"), "utf8"));
    assert.equal(topo.edges.length, 0);
  } finally {
    rmrf(outRoot);
  }
});

test("flat-N: agentCount in sync with compiled count", async () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    // Dynamic import to avoid top-level side effects.
    const { convertRegime } = await import("../engine/regime-to-cc.mjs");
    const r = generateBaseline("china/qin", "flat", { outRoot, seed: 1 });
    const compiled = Object.keys(convertRegime(r.outDir).agents).length;
    const meta = JSON.parse(fs.readFileSync(path.join(r.outDir, "metadata.json"), "utf8"));
    assert.equal(meta.agentCount, compiled,
      `agentCount=${meta.agentCount} must match compiled count=${compiled}`);
  } finally {
    rmrf(outRoot);
  }
});

// ── random-N baseline ───────────────────────────────────────────────────────

test("random-N: N agents, edge count ≈ original, passes validation", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const origTopo = JSON.parse(fs.readFileSync(
      path.join(PROJECT_ROOT, "regimes", "china/tang", "topology.json"), "utf8"));
    const r = generateBaseline("china/tang", "random", { outRoot, seed: 42 });
    assert.ok(r.validation.ok, `validation errors: ${r.validation.errors?.join("; ")}`);
    assert.equal(r.metrics.nodes, origTopo.nodes.length);
    assert.equal(r.metrics.edges, origTopo.edges.length,
      "random-N must produce same edge count as original");

    const topo = JSON.parse(fs.readFileSync(path.join(r.outDir, "topology.json"), "utf8"));
    // No self-loops.
    for (const e of topo.edges) {
      assert.notEqual(e.from, e.to, `self-loop on ${e.from}`);
    }
    // Every node has at least one incident edge (connectivity via spanning tree).
    const incident = new Set();
    for (const e of topo.edges) { incident.add(e.from); incident.add(e.to); }
    for (const n of topo.nodes) {
      assert.ok(incident.has(n.id), `node ${n.id} is isolated — graph not connected`);
    }
  } finally {
    rmrf(outRoot);
  }
});

// ── seed reproducibility ────────────────────────────────────────────────────

test("seed reproducibility: same seed → byte-identical output", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const a = generateBaseline("china/tang", "random", { outRoot, seed: 99 });
    const b = generateBaseline("china/tang", "random", { outRoot, seed: 99 });
    const files = ["topology.json", "IDENTITY.md", "SOUL.md", "metadata.json"];
    for (const f of files) {
      const pa = path.join(a.outDir, f);
      const pb = path.join(b.outDir, f);
      assert.ok(fs.existsSync(pa), `${f} must exist in first run`);
      assert.ok(fs.existsSync(pb), `${f} must exist in second run`);
      // Every file, metadata.json included, must match byte for byte. An
      // earlier version stamped generatedAt into the metadata and the test
      // excused it by deleting the field before comparing — which legalised the
      // very non-determinism the seed exists to prevent. A baseline variant is
      // an experimental artifact: if two runs of one seed differ at all, the
      // control group is not a control.
      const ca = fs.readFileSync(pa, "utf8");
      assert.equal(ca, fs.readFileSync(pb, "utf8"),
        `${f} must be byte-identical across runs of the same seed`);
      // Comparing two runs is not enough on its own: back-to-back calls land in
      // the same millisecond, so a wall-clock field compares equal and the
      // comparison silently passes while the artifact is in fact irreproducible
      // (it would differ across a slower machine, or a run split by a pause).
      // Assert structurally that no wall clock made it into the artifact.
      assert.ok(
        !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(ca),
        `${f} must contain no wall-clock timestamp — it defeats seed reproducibility`,
      );
    }
  } finally {
    rmrf(outRoot);
  }
});

test("seed reproducibility: different seeds → different random topology", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const a = generateBaseline("china/tang", "random", { outRoot: path.join(outRoot, "a"), seed: 1 });
    const b = generateBaseline("china/tang", "random", { outRoot: path.join(outRoot, "b"), seed: 2 });
    const ta = JSON.parse(fs.readFileSync(path.join(a.outDir, "topology.json"), "utf8"));
    const tb = JSON.parse(fs.readFileSync(path.join(b.outDir, "topology.json"), "utf8"));
    const aKeys = new Set(ta.edges.map((e) => `${e.from}→${e.to}:${e.kind}`));
    const bKeys = new Set(tb.edges.map((e) => `${e.from}→${e.to}:${e.kind}`));
    const overlap = [...aKeys].filter((k) => bKeys.has(k));
    // With 15 edges and random wiring, it's extremely unlikely two random graphs are identical.
    assert.ok(
      overlap.length < ta.edges.length,
      `different seeds should produce different edge sets (got ${overlap.length}/${ta.edges.length} overlap)`,
    );
  } finally {
    rmrf(outRoot);
  }
});

test("same seed same type always produces same topology (byte-identical across calls)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const r1 = generateBaseline("china/tang", "solo", { outRoot: path.join(outRoot, "a"), seed: 7 });
    const r2 = generateBaseline("china/tang", "solo", { outRoot: path.join(outRoot, "b"), seed: 7 });
    const t1 = JSON.parse(fs.readFileSync(path.join(r1.outDir, "topology.json"), "utf8"));
    const t2 = JSON.parse(fs.readFileSync(path.join(r2.outDir, "topology.json"), "utf8"));
    assert.deepEqual(t1, t2);
    const r3 = generateBaseline("china/tang", "flat", { outRoot: path.join(outRoot, "c"), seed: 7 });
    const r4 = generateBaseline("china/tang", "flat", { outRoot: path.join(outRoot, "d"), seed: 7 });
    const t3 = JSON.parse(fs.readFileSync(path.join(r3.outDir, "topology.json"), "utf8"));
    const t4 = JSON.parse(fs.readFileSync(path.join(r4.outDir, "topology.json"), "utf8"));
    assert.deepEqual(t3, t4);
  } finally {
    rmrf(outRoot);
  }
});

// ── IDENTITY table format ───────────────────────────────────────────────────

test("all baseline IDENTITY files parse as valid agent tables", async () => {
  const { convertRegime } = await import("../engine/regime-to-cc.mjs");
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    for (const type of BASELINE_TYPES) {
      const r = generateBaseline("china/tang", type, { outRoot, seed: 1 });
      const compiled = convertRegime(r.outDir);
      const agents = Object.keys(compiled.agents);
      assert.ok(agents.length > 0, `${type} must compile to at least 1 agent`);
      // Every agent must have required fields.
      for (const [id, a] of Object.entries(compiled.agents)) {
        assert.ok(a.description, `${type}/${id}: agent must have a description`);
        assert.ok(a.prompt, `${type}/${id}: agent must have a prompt`);
        assert.ok(a.model, `${type}/${id}: agent must have a model`);
      }
    }
  } finally {
    rmrf(outRoot);
  }
});

// ── directory safety ────────────────────────────────────────────────────────

test("generated variants always go under _baseline/ by default", () => {
  // Use default projectRoot so the output path uses regimes/_baseline/.
  // A sentinel stands in for the committed control arms that live in this
  // directory: the cleanup below must not take them with it.
  const sentinelDir = path.join(PROJECT_ROOT, "regimes", "_baseline");
  const sentinel = path.join(sentinelDir, ".cleanup-sentinel");
  fs.mkdirSync(sentinelDir, { recursive: true });
  fs.writeFileSync(sentinel, "");
  const r = generateBaseline("china/tang", "solo", { seed: 1 });
  assert.ok(r.outDir.includes("_baseline"), `solo: output must be under _baseline/, got ${r.outDir}`);
  assert.ok(r.outDir.includes("solo"), `solo: output path must include type name`);
  // Clean up only what this test created. Deleting the whole _baseline tree —
  // which is what this did before — wipes the committed control arms that live
  // alongside it, so a full `npm test` silently removed staged experiment
  // regimes from the working tree.
  const baseOut = r.outDir.split("/_baseline/")[0] + "/_baseline";
  fs.rmSync(r.outDir, { recursive: true, force: true });
  for (let dir = path.dirname(r.outDir); dir.startsWith(baseOut + path.sep); dir = path.dirname(dir)) {
    try { fs.rmdirSync(dir); } catch { break; } // stops at the first non-empty parent
  }
  assert.ok(fs.existsSync(sentinel),
    "cleanup must not delete unrelated contents of _baseline/");
  fs.rmSync(sentinel, { force: true });
});

test("generated variants honor custom outRoot", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const r = generateBaseline("china/tang", "flat", { outRoot, seed: 1 });
    assert.ok(r.outDir.startsWith(outRoot), `custom outRoot must be respected, got ${r.outDir}`);
  } finally {
    rmrf(outRoot);
  }
});

test("real regime files are never touched — source identity matches before and after", () => {
  const srcMeta = path.join(PROJECT_ROOT, "regimes", "china/tang", "metadata.json");
  const srcIdentity = path.join(PROJECT_ROOT, "regimes", "china/tang", "IDENTITY.md");
  const srcSoul = path.join(PROJECT_ROOT, "regimes", "china/tang", "SOUL.md");
  const srcTopo = path.join(PROJECT_ROOT, "regimes", "china/tang", "topology.json");

  const before = {
    meta: fs.readFileSync(srcMeta, "utf8"),
    identity: fs.readFileSync(srcIdentity, "utf8"),
    soul: fs.readFileSync(srcSoul, "utf8"),
    topo: fs.readFileSync(srcTopo, "utf8"),
  };

  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    for (const type of BASELINE_TYPES) {
      generateBaseline("china/tang", type, { outRoot, seed: 1 });
    }

    const after = {
      meta: fs.readFileSync(srcMeta, "utf8"),
      identity: fs.readFileSync(srcIdentity, "utf8"),
      soul: fs.readFileSync(srcSoul, "utf8"),
      topo: fs.readFileSync(srcTopo, "utf8"),
    };

    for (const f of Object.keys(before)) {
      assert.equal(after[f], before[f], `${f} of source regime must NOT be modified`);
    }
  } finally {
    rmrf(outRoot);
  }
});

// ── edge kind validity ──────────────────────────────────────────────────────

test("random topology edges only use valid kinds from EDGE_KINDS", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    const valid = new Set(["command", "review", "info", "veto"]);
    for (let seed = 0; seed < 10; seed++) {
      const r = generateBaseline("china/tang", "random", { outRoot, seed });
      const topo = JSON.parse(fs.readFileSync(path.join(r.outDir, "topology.json"), "utf8"));
      for (const e of topo.edges) {
        assert.ok(valid.has(e.kind), `invalid edge kind "${e.kind}" at seed=${seed}`);
      }
    }
  } finally {
    rmrf(outRoot);
  }
});

// ── unknown type rejection ──────────────────────────────────────────────────

test("generateBaseline rejects unknown type", () => {
  assert.throws(() => generateBaseline("china/tang", "nonexistent"), /unknown baseline type/);
});

test("generateBaseline rejects unknown regime", () => {
  assert.throws(() => generateBaseline("nowhere/ghost", "solo"), /regime not found/);
});

// ── flat-N edge verification ────────────────────────────────────────────────

test("flat variant: topology has exactly 0 edges for any agent count", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    for (const rid of ["china/tang", "china/qin", "china/song"]) {
      const r = generateBaseline(rid, "flat", { outRoot, seed: 1 });
      // If the regime has a topology, verify it. If not, just check no crash.
      const topoPath = path.join(r.outDir, "topology.json");
      if (fs.existsSync(topoPath)) {
        const topo = JSON.parse(fs.readFileSync(topoPath, "utf8"));
        assert.equal(topo.edges.length, 0, `flat/${rid}: edges must be 0`);
      }
    }
  } finally {
    rmrf(outRoot);
  }
});

// ── no self-loop in random graphs ───────────────────────────────────────────

test("random topology never contains self-loops across multiple seeds", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-"));
  try {
    for (let seed = 0; seed < 20; seed++) {
      const r = generateBaseline("china/tang", "random", { outRoot, seed });
      const topo = JSON.parse(fs.readFileSync(path.join(r.outDir, "topology.json"), "utf8"));
      for (const e of topo.edges) {
        assert.notEqual(e.from, e.to, `self-loop at seed=${seed}: ${e.from}→${e.to}`);
      }
    }
  } finally {
    rmrf(outRoot);
  }
});

// ── CLI integration ─────────────────────────────────────────────────────────

const BASELINE_MJS = path.join(PROJECT_ROOT, "engine", "baseline.mjs");

test("CLI: generates baseline and exits 0", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-cli-"));
  try {
    const r = spawnSync("node", [
      BASELINE_MJS, "china/tang", "--type", "solo", "--out", outRoot, "--seed", "42",
    ], { encoding: "utf8" });
    assert.equal(r.status, 0, `exit ${r.status}: ${r.stderr}`);
    assert.ok(fs.existsSync(path.join(outRoot, "solo", "china/tang", "metadata.json")));
  } finally {
    rmrf(outRoot);
  }
});

test("CLI: --seed flag is passed through and produces deterministic output", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-cli-"));
  try {
    const run = (dir) => spawnSync("node", [
      BASELINE_MJS, "china/tang", "--type", "random", "--out", dir, "--seed", "256",
    ], { encoding: "utf8" });
    const a = run(path.join(outRoot, "a"));
    const b = run(path.join(outRoot, "b"));
    assert.equal(a.status, 0);
    assert.equal(b.status, 0);
    const ta = fs.readFileSync(path.join(outRoot, "a", "random", "china/tang", "topology.json"), "utf8");
    const tb = fs.readFileSync(path.join(outRoot, "b", "random", "china/tang", "topology.json"), "utf8");
    assert.equal(ta, tb, "CLI with same seed must produce byte-identical topology");
  } finally {
    rmrf(outRoot);
  }
});

test("CLI: exits 1 for unknown type and unknown regime", () => {
  assert.notEqual(spawnSync("node", [BASELINE_MJS, "china/tang", "--type", "bogus"]).status, 0,
    "unknown type must exit non-zero");
  assert.notEqual(spawnSync("node", [BASELINE_MJS, "nowhere/ghost", "--type", "solo"]).status, 0,
    "unknown regime must exit non-zero");
});

// ── regression: validateRegimeTopology catches bad topology ─────────────────

test("regression: a topology with self-loop fails validation", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-reg-"));
  try {
    const r = generateBaseline("china/tang", "flat", { outRoot, seed: 1 });
    const topo = JSON.parse(fs.readFileSync(path.join(r.outDir, "topology.json"), "utf8"));
    // Inject a self-loop.
    topo.edges.push({ from: "role_a", to: "role_a", kind: "command" });
    fs.writeFileSync(path.join(r.outDir, "topology.json"), JSON.stringify(topo));
    const v = validateRegimeTopology(r.outDir);
    assert.ok(!v.ok, "self-loop must be rejected by validator");
    assert.ok(v.errors.some((e) => e.includes("self-loop")), `errors must mention self-loop: ${v.errors}`);
  } finally {
    rmrf(outRoot);
  }
});

test("regression: a topology with missing node fails validation", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-reg-"));
  try {
    const r = generateBaseline("china/tang", "flat", { outRoot, seed: 1 });
    const topo = JSON.parse(fs.readFileSync(path.join(r.outDir, "topology.json"), "utf8"));
    // Add edge to nonexistent node.
    topo.edges.push({ from: "role_a", to: "nonexistent", kind: "info" });
    fs.writeFileSync(path.join(r.outDir, "topology.json"), JSON.stringify(topo));
    const v = validateRegimeTopology(r.outDir);
    assert.ok(!v.ok, "edge to unknown node must be rejected");
    assert.ok(v.errors.some((e) => e.includes("unknown node")), `errors must mention unknown node: ${v.errors}`);
  } finally {
    rmrf(outRoot);
  }
});

test("regression: IDENTITY→topology cross-check fails with mismatched agent ID", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-reg-"));
  try {
    const r = generateBaseline("china/tang", "solo", { outRoot, seed: 1 });
    const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
    // Read the real agent ID out of the file rather than hardcoding one: the
    // solo control names its single office after the source regime, so a
    // hardcoded id silently turns this into a no-op replace that "passes"
    // because nothing was corrupted at all.
    const realId = identity.match(/\|\s*[^|]+\|\s*`([^`]+)`/)?.[1];
    assert.ok(realId, "solo IDENTITY must declare an agent id in its table");
    const broken = identity.replace(`\`${realId}\``, "`wrong_id`");
    assert.notStrictEqual(broken, identity, "corruption must actually change the file");
    fs.writeFileSync(path.join(r.outDir, "IDENTITY.md"), broken);
    const v = validateRegimeTopology(r.outDir);
    assert.ok(!v.ok, "mismatched agent ID must fail cross-check");
    assert.ok(
      v.errors.some((e) => e.includes("missing") || e.includes("does not appear")),
      `errors must flag cross-check failure: ${v.errors}`,
    );
  } finally {
    rmrf(outRoot);
  }
});

test("regression: IDENTITY table in prose compiles to 0 agents", async () => {
  const { convertRegime } = await import("../engine/regime-to-cc.mjs");
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-reg-"));
  try {
    const r = generateBaseline("china/tang", "solo", { outRoot, seed: 1 });
    // Replace the table with prose.
    fs.writeFileSync(path.join(r.outDir, "IDENTITY.md"),
      "# No table here\n\nJust prose describing an agent. No Agent ID column.\n");
    const compiled = convertRegime(r.outDir);
    assert.equal(Object.keys(compiled.agents).length, 0,
      "prose IDENTITY must compile to 0 agents (AGENTS.md hard rule #2)");
  } finally {
    rmrf(outRoot);
  }
});

test("regression: agentCount mismatch fails validate:regimes", async () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-reg-"));
  try {
    const r = generateBaseline("china/tang", "solo", { outRoot, seed: 1 });
    const meta = JSON.parse(fs.readFileSync(path.join(r.outDir, "metadata.json"), "utf8"));
    meta.agentCount = 99;
    fs.writeFileSync(path.join(r.outDir, "metadata.json"), JSON.stringify(meta));
    // The topology↔identity cross-check should still pass;
    // but the regime-validator checks agentCount vs compiled separately.
    // We test this via the compiled → agentCount check directly.
    const { convertRegime } = await import("../engine/regime-to-cc.mjs");
    const compiled = Object.keys(convertRegime(r.outDir).agents).length;
    assert.notEqual(meta.agentCount, compiled,
      "agentCount=99 must not match compiled count (should fail regime validator)");
  } finally {
    rmrf(outRoot);
  }
});

// ── regression: break implementation, verify test catches it ────────────────

test("regression: solo must NOT produce >1 agent (breaking flat→solo swap would catch this)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-reg-"));
  try {
    const r = generateBaseline("china/tang", "solo", { outRoot, seed: 1 });
    const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
    const ids = parseIdentityAgentIds(identity);
    assert.equal(ids.length, 1, "solo must produce exactly 1 agent");
    const meta = JSON.parse(fs.readFileSync(path.join(r.outDir, "metadata.json"), "utf8"));
    assert.equal(meta.agentCount, 1);
  } finally {
    rmrf(outRoot);
  }
});

test("regression: flat must produce original agent count (not 1)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-reg-"));
  try {
    const orig = JSON.parse(fs.readFileSync(
      path.join(PROJECT_ROOT, "regimes", "china/tang", "metadata.json"), "utf8"));
    const r = generateBaseline("china/tang", "flat", { outRoot, seed: 1 });
    const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
    const ids = parseIdentityAgentIds(identity);
    assert.equal(ids.length, orig.agentCount,
      `flat must produce ${orig.agentCount} agents, got ${ids.length}`);
  } finally {
    rmrf(outRoot);
  }
});

// ── persona parity ──────────────────────────────────────────────────────────
// A control exists to isolate ONE variable: the wiring between offices. An
// earlier generator also replaced every office with "Baseline Agent N" and cut
// SOUL.md to a one-line disclaimer, so a smoke run scored the source 10 and the
// control 2.5 — but the control's transcript was the model asking the operator
// how to configure the experiment. That gap measured persona presence, not
// topology. These tests fail if persona ever gets stripped again.

const SRC = path.join(PROJECT_ROOT, "regimes", "china/tang");

test("control SOUL.md carries the source persona verbatim", () => {
  const srcSoul = fs.readFileSync(path.join(SRC, "SOUL.md"), "utf8");
  for (const type of BASELINE_TYPES) {
    const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-soul-"));
    try {
      const r = generateBaseline("china/tang", type, { outRoot, seed: 7 });
      const soul = fs.readFileSync(path.join(r.outDir, "SOUL.md"), "utf8");
      assert.ok(soul.includes(srcSoul.trimEnd()),
        `${type}: SOUL.md must contain the source persona verbatim`);
      assert.ok(soul.length >= srcSoul.length,
        `${type}: SOUL.md (${soul.length}B) must not be shorter than source (${srcSoul.length}B)`);
    } finally {
      rmrf(outRoot);
    }
  }
});

test("flat/random controls keep every source office id and label", () => {
  const srcIdentity = fs.readFileSync(path.join(SRC, "IDENTITY.md"), "utf8");
  const srcIds = parseIdentityAgentIds(srcIdentity);
  assert.ok(srcIds.length > 1, "fixture must have several offices");
  for (const type of ["flat", "random"]) {
    const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-role-"));
    try {
      const r = generateBaseline("china/tang", type, { outRoot, seed: 7 });
      const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
      assert.deepEqual(parseIdentityAgentIds(identity), srcIds,
        `${type}: office ids must be identical to the source`);
      assert.ok(!/Baseline Agent/.test(identity),
        `${type}: offices must not be renamed to generic placeholders`);
      const topo = JSON.parse(fs.readFileSync(path.join(r.outDir, "topology.json"), "utf8"));
      const srcTopo = JSON.parse(fs.readFileSync(path.join(SRC, "topology.json"), "utf8"));
      const labels = Object.fromEntries(topo.nodes.map((n) => [n.id, n.label]));
      for (const n of srcTopo.nodes) {
        assert.equal(labels[n.id], n.label, `${type}: node ${n.id} must keep its office label`);
      }
    } finally {
      rmrf(outRoot);
    }
  }
});

test("control IDENTITY diagram matches the control's own edges, not the source's", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-merm-"));
  try {
    const r = generateBaseline("china/tang", "random", { outRoot, seed: 7 });
    const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
    const topo = JSON.parse(fs.readFileSync(path.join(r.outDir, "topology.json"), "utf8"));
    const block = identity.match(/```mermaid\n([\s\S]*?)```/);
    assert.ok(block, "control must still carry a diagram");
    const drawn = [...block[1].matchAll(/^\s*(\S+)\s*-->\|(\S+)\|\s*(\S+)\s*$/gm)]
      .map((m) => `${m[1]}→${m[3]}:${m[2]}`).sort();
    const declared = topo.edges.map((e) => `${e.from}→${e.to}:${e.kind}`).sort();
    assert.deepEqual(drawn, declared,
      "diagram and topology.json must describe the same wiring");
    // The source diagram used mermaid node syntax with display names; if any of
    // it survived, the control asserts two contradictory wirings at once.
    assert.ok(!/Emperor|Zhongshu\(|Menxia\(/.test(block[1]),
      "source diagram must not survive inside the control");
  } finally {
    rmrf(outRoot);
  }
});

test("a non-mermaid organization chart is rewritten too", () => {
  // china/ming draws its dual-track chart as ASCII in a plain fence. An earlier
  // version matched only ```mermaid, so the flat control declared zero edges in
  // topology.json while still showing the model 皇帝 → 内阁/司礼监 → 六部. The
  // model reads IDENTITY.md, not topology.json, so that control isolated nothing.
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-ascii-"));
  try {
    const src = fs.readFileSync(path.join(PROJECT_ROOT, "regimes/china/ming/IDENTITY.md"), "utf8");
    assert.ok(/```\s*\n\s*┌/.test(src), "precondition: ming's chart is a plain fence, not mermaid");

    const r = generateBaseline("china/ming", "flat", { outRoot, seed: 1 });
    const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
    const fences = [...identity.matchAll(/```([\s\S]*?)```/g)].map((m) => m[1]);
    assert.equal(fences.length, 1, "exactly one diagram survives — a control has one wiring");
    assert.ok(!/[┌└├─┬▼]/.test(identity), "no box-drawing chart may survive into the control");
    assert.match(fences[0], /graph TD/, "the surviving diagram is the control's own");
  } finally {
    rmrf(outRoot);
  }
});

test("the control's decision flow explicitly overrides the historical prose", () => {
  // The institutional summary near the top of every IDENTITY describes the
  // source regime's procedure. It is persona and must stay, but a control
  // rewires the flow, so the file must say which one governs.
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-bsl-override-"));
  try {
    for (const type of ["flat", "random"]) {
      const r = generateBaseline("china/tang", type, { outRoot, seed: 3 });
      const identity = fs.readFileSync(path.join(r.outDir, "IDENTITY.md"), "utf8");
      assert.match(identity, /the flow below governs/,
        `${type}: the control must resolve the conflict with the historical description`);
    }
  } finally {
    rmrf(outRoot);
  }
});
