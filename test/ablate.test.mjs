// ablate.test.mjs — tests for the ablation variant generator (A1 persona,
// A2 checks) and the A3 skill-learning switch.
//
// A1/A2 variants are generated into OS-temp dirs (never the repo tree).
// A3 tests use a fake claude binary in a temp PATH; no real LLM CLIs run.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ablateRegime, ablatePersona, stripChecksFlow, ABLATION_TYPES } from "../engine/ablate.mjs";
import { parseIdentityAgentIds, validateRegimeTopology } from "../engine/topology/validate.mjs";
import { computeMetrics } from "../engine/topology/metrics.mjs";
import { parseArgs, skillLearnEnabled } from "../engine/v5/run-v5.mjs";
import { civSpawnSpec } from "../engine/v5/tournament.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CIVAGENT_BIN = path.join(PROJECT_ROOT, "bin", "civagent");
const RUN_V5 = path.join(PROJECT_ROOT, "engine", "v5", "run-v5.mjs");

const TYPED = ["china/tang", "china/qin", "global/athens", "china/ming", "china/zhou", "china/shang"];
const rmrf = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ } };
const readSrc = (r, f) => fs.readFileSync(path.join(PROJECT_ROOT, "regimes", r, f), "utf8");

// ── A1: persona neutralization ───────────────────────────────────────────────

test("A1: all 6 typed regimes — graph intact, validation passes, node set identical", () => {
  for (const r of TYPED) {
    const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-ab1-"));
    try {
      const { outDir, validation, metrics } = ablateRegime(r, "persona", { outRoot });
      assert.ok(validation.ok, `${r}: ${validation.errors.join("; ")}`);
      // topology.json is copied unchanged — the graph is the controlled variable.
      assert.deepEqual(
        JSON.parse(fs.readFileSync(path.join(outDir, "topology.json"), "utf8")),
        JSON.parse(readSrc(r, "topology.json")),
        `${r}: A1 must not alter topology.json`,
      );
      const srcNodes = JSON.parse(readSrc(r, "topology.json")).nodes.map((n) => n.id).sort();
      const outNodes = validation.topology.nodes.map((n) => n.id).sort();
      assert.deepEqual(outNodes, srcNodes, `${r}: node set must be identical`);
      // IDENTITY role table still maps the same agent ids (cross-check basis).
      const outIds = parseIdentityAgentIds(fs.readFileSync(path.join(outDir, "IDENTITY.md"), "utf8"));
      assert.deepEqual(outIds.sort(), srcNodes, `${r}: table agent ids unchanged`);
      // metadata carries the ablation marker.
      const meta = JSON.parse(fs.readFileSync(path.join(outDir, "metadata.json"), "utf8"));
      assert.deepEqual(meta._ablation.type, "persona");
      assert.equal(meta._ablation.source, r);
    } finally {
      rmrf(outRoot);
    }
  }
});

test("A1: historical names neutralized, narrative sections dropped, table rewritten", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-ab1t-"));
  try {
    const { outDir } = ablateRegime("china/tang", "persona", { outRoot });
    const identity = fs.readFileSync(path.join(outDir, "IDENTITY.md"), "utf8");
    const soul = fs.readFileSync(path.join(outDir, "SOUL.md"), "utf8");

    assert.ok(!identity.includes("中书舍人"), "historical role name must be replaced");
    assert.ok(identity.includes("Role-1: coordinator"), "neutral role token expected");
    assert.ok(identity.includes("Role-2: review"), "jishizhong → Role-2: review");
    assert.ok(identity.includes("coordination: draft instructions"), "neutral duty text expected");
    assert.ok(!identity.includes("制度简介"), "narrative section 制度简介 must be dropped");
    assert.ok(!identity.includes("历史参考"), "narrative section 历史参考 must be dropped");
    assert.ok(identity.includes("协作流程"), "structural flow section must be kept");

    assert.ok(!soul.includes("陛下"), "court term 陛下 must be neutralized in SOUL");
    assert.ok(soul.includes("the user"), "neutral replacement expected");
  } finally {
    rmrf(outRoot);
  }
});

test("ablatePersona: Role-N follows topology node order", () => {
  const identity = readSrc("china/qin", "IDENTITY.md");
  const soul = readSrc("china/qin", "SOUL.md");
  const topology = JSON.parse(readSrc("china/qin", "topology.json"));
  const metadata = JSON.parse(readSrc("china/qin", "metadata.json"));
  const out = ablatePersona({ identity, soul, topology, metadata });
  // emperor is node 1 in qin's topology.
  assert.ok(out.identity.includes("Role-1: coordinator"));
  assert.ok(!out.identity.includes("皇帝"), "emperor persona must be gone");
  assert.ok(!out.identity.includes("御史大夫"), "censor persona must be gone");
});

// ── A2: remove checks ────────────────────────────────────────────────────────

test("A2: review/veto edges removed, checks_cycles = 0, nodes unchanged", () => {
  for (const r of TYPED) {
    const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-ab2-"));
    try {
      const { outDir, validation, metrics } = ablateRegime(r, "checks", { outRoot });
      assert.ok(validation.ok, `${r}: ${validation.errors.join("; ")}`);
      const topo = validation.topology;
      assert.ok(topo.edges.every((e) => e.kind !== "review" && e.kind !== "veto"), `${r}: no review/veto edges`);
      assert.equal(metrics.checks_cycles, 0, `${r}: all check cycles must be broken`);
      const srcNodes = JSON.parse(readSrc(r, "topology.json")).nodes.length;
      assert.equal(topo.nodes.length, srcNodes, `${r}: nodes unchanged`);
    } finally {
      rmrf(outRoot);
    }
  }
});

test("A2: audit/veto flow steps removed and numbering resequenced (tang, ming)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-ab2t-"));
  try {
    const tang = ablateRegime("china/tang", "checks", { outRoot });
    const tangIdentity = fs.readFileSync(path.join(tang.outDir, "IDENTITY.md"), "utf8");
    assert.ok(!tangIdentity.includes("门下封驳"), "tang 封驳 step must be removed");
    assert.ok(!tangIdentity.includes("送门下省由给事中审核"), "tang menxia review step must be removed");
    // Remaining steps renumbered without gaps: 1..4 in 协作流程.
    const steps = [...tangIdentity.matchAll(/^\d+\.\s/gm)].map((m) => m[0]);
    assert.deepEqual(steps, ["1. ", "2. ", "3. ", "4. "]);

    const ming = ablateRegime("china/ming", "checks", { outRoot });
    const mingIdentity = fs.readFileSync(path.join(ming.outDir, "IDENTITY.md"), "utf8");
    const srcMing = readSrc("china/ming", "IDENTITY.md");
    assert.ok(
      (mingIdentity.match(/批红|驳回/g) || []).length < (srcMing.match(/批红|驳回/g) || []).length,
      "ming 批红/驳回 flow step must be removed",
    );
    const mingTopo = JSON.parse(fs.readFileSync(path.join(ming.outDir, "topology.json"), "utf8"));
    assert.equal(computeMetrics(mingTopo).checks_cycles, 0, "票拟/批红 cycle must be broken");
  } finally {
    rmrf(outRoot);
  }
});

test("stripChecksFlow: no removed edges → identity unchanged", () => {
  const identity = readSrc("china/shang", "IDENTITY.md");
  const topology = JSON.parse(readSrc("china/shang", "topology.json"));
  assert.equal(stripChecksFlow(identity, [], topology), identity);
});

test("ablateRegime rejects unknown types and untyped regimes", () => {
  assert.throws(() => ablateRegime("china/tang", "nonsense"), /unknown ablation type/);
  assert.throws(() => ablateRegime("china/han", "persona", { outRoot: os.tmpdir() }), /no topology\.json/);
});

// ── A3: skill-learning switch ────────────────────────────────────────────────

test("parseArgs: --no-skill flag parsed; skillLearnEnabled honors flag and env", () => {
  const a = parseArgs(["--no-skill", "--backend", "native", "china/tang", "task"], {});
  assert.equal(a.noSkill, true);
  assert.equal(a.regimeRaw, "china/tang");
  assert.equal(a.prompt, "task");
  assert.equal(parseArgs(["china/tang", "task"], {}).noSkill, false);

  assert.equal(skillLearnEnabled({ noSkill: true, env: {} }), false);
  assert.equal(skillLearnEnabled({ noSkill: false, env: { CIVAGENT_SKILL_LEARN: "off" } }), false);
  assert.equal(skillLearnEnabled({ noSkill: false, env: {} }), true);
});

test("civSpawnSpec propagates CIVAGENT_SKILL_LEARN=off when noSkill", () => {
  const spec = civSpawnSpec({ regime: "china/tang", backend: "native", matchId: "m1", noSkill: true });
  assert.equal(spec.env.CIVAGENT_SKILL_LEARN, "off");
  const normal = civSpawnSpec({ regime: "china/tang", backend: "native", matchId: "m1" });
  assert.equal(normal.env.CIVAGENT_SKILL_LEARN, undefined);
});

test("ensureCivHome skips skill symlinks when skills=false", { timeout: 30_000 }, async () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-a3home-"));
  const regimeDir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-a3regime-"));
  fs.writeFileSync(path.join(regimeDir, "IDENTITY.md"), "# id\n");
  fs.writeFileSync(path.join(regimeDir, "SOUL.md"), "# soul\n");
  fs.mkdirSync(path.join(regimeDir, "skills"), { recursive: true });
  fs.writeFileSync(path.join(regimeDir, "skills", "learned-x.md"), "skill body");

  const CIV_MEMORY = path.join(PROJECT_ROOT, "engine", "v5", "civ-memory.mjs");
  const script = `
    import { ensureCivHome } from ${JSON.stringify(`file://${CIV_MEMORY}`)};
    const withSkills = ensureCivHome("china/a3on", ${JSON.stringify(regimeDir)});
    const without = ensureCivHome("china/a3off", ${JSON.stringify(regimeDir)}, { skills: false });
    const fs = await import("node:fs");
    const path = await import("node:path");
    const list = (h) => fs.readdirSync(path.join(h, ".claude", "skills"));
    console.log(JSON.stringify({ on: list(withSkills), off: list(without) }));
  `;
  try {
    const { code, out, err } = await new Promise((resolve, reject) => {
      const proc = spawn("node", ["--input-type=module", "-e", script], {
        env: { ...process.env, HOME: tempHome },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let out = "", err = "";
      proc.stdout.on("data", (d) => { out += d; });
      proc.stderr.on("data", (d) => { err += d; });
      proc.on("error", reject);
      proc.on("close", (code) => resolve({ code, out, err }));
    });
    assert.equal(code, 0, err);
    const { on, off } = JSON.parse(out.trim());
    assert.deepEqual(on, ["learned-x.md"], "default behavior still symlinks skills");
    assert.deepEqual(off, [], "skills=false must not symlink learned skills");
  } finally {
    rmrf(tempHome);
    rmrf(regimeDir);
  }
});

test("run-v5 --no-skill skips sedimentation and records it in the event stream", { timeout: 60_000 }, async () => {
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-a3bin-"));
  const fakeClaude = path.join(fakeBin, "claude");
  fs.writeFileSync(fakeClaude, "#!/bin/sh\necho 'fake output line one — long enough deterministic output for the no-skill integration test of the CivAgent learning loop ablation switch.'\necho 'fake output line two — more deterministic content to exceed the minimum transcript length requirement.'\nexit 0\n");
  fs.chmodSync(fakeClaude, 0o755);
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-a3run-"));
  const matchId = `a3-noskill-${Date.now()}`;
  try {
    const env = { ...process.env, HOME: tempHome, PATH: `${fakeBin}:${process.env.PATH}`, CIVAGENT_MATCH_ID: matchId };
    delete env.CIVAGENT_BACKEND;
    const exitCode = await new Promise((resolve, reject) => {
      const proc = spawn("node", [RUN_V5, "--backend", "native", "--no-skill", "china/tang", "a3-task"], { env, stdio: ["ignore", "pipe", "pipe"] });
      proc.on("error", reject);
      proc.on("close", resolve);
      proc.stdout.resume();
      proc.stderr.resume();
    });
    assert.equal(exitCode, 0);
    const eventsFile = path.join(tempHome, ".civagent", "matches", matchId, "events.jsonl");
    const events = fs.readFileSync(eventsFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const skillEv = events.find((e) => e.type === "skill");
    assert.ok(skillEv, "a skill event must still be emitted (documenting the skip)");
    assert.equal(skillEv.status, "skipped");
    assert.match(skillEv.reason, /disabled/);
  } finally {
    rmrf(fakeBin);
    rmrf(tempHome);
  }
});

// ── CLI smoke ────────────────────────────────────────────────────────────────

test("CLI: civagent ablate generates + validates variants", { timeout: 30_000 }, async () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-abcli-"));
  try {
    const run = (args) => new Promise((resolve, reject) => {
      const proc = spawn("bash", [CIVAGENT_BIN, ...args], { stdio: ["ignore", "pipe", "pipe"] });
      let out = "", err = "";
      proc.stdout.on("data", (d) => { out += d; });
      proc.stderr.on("data", (d) => { err += d; });
      proc.on("error", reject);
      proc.on("close", (code) => resolve({ code, out, err }));
    });
    const persona = await run(["ablate", "china/tang", "--type", "persona", "--out", outRoot]);
    assert.equal(persona.code, 0, persona.err);
    assert.match(persona.out, /persona variant written/);
    assert.match(persona.out, /validation OK/);
    assert.ok(fs.existsSync(path.join(outRoot, "persona", "china", "tang", "metadata.json")));

    const checks = await run(["ablate", "china/ming", "--type", "checks", "--out", outRoot]);
    assert.equal(checks.code, 0, checks.err);
    assert.match(checks.out, /checks_cycles=0/);

    const bad = await run(["ablate", "china/tang", "--type", "bogus", "--out", outRoot]);
    assert.equal(bad.code, 1);
  } finally {
    rmrf(outRoot);
  }
});

test("ablation types constant", () => {
  assert.deepEqual(ABLATION_TYPES, ["persona", "checks"]);
});
