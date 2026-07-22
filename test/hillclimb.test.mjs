// hillclimb.test.mjs — tests for the L4 hill-climbing loop.
// All fixtures live in OS-temp $HOME dirs; no real ~/.civagent access, no LLM.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  analyze,
  buildProposals,
  writeProposals,
  readProposal,
  applyProposal,
  rollback,
  pairedCompare,
  validateProposal,
  hcPaths,
  DEFAULTS,
} from "../engine/v5/hillclimb.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CIVAGENT_BIN = path.join(PROJECT_ROOT, "bin", "civagent");

const rmrf = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ } };

// ── fixtures ─────────────────────────────────────────────────────────────────

function makeHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-hc-"));
  fs.mkdirSync(path.join(home, ".civagent", "tournaments"), { recursive: true });
  fs.mkdirSync(path.join(home, ".civagent", "matches"), { recursive: true });
  return home;
}

function writeManifest(home, id, { task = "frontier famine", createdAt = 1, scores, swap = true, civs = null }) {
  const dir = path.join(home, ".civagent", "tournaments", id);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = {
    id, task, createdAt,
    civs: civs ?? scores.map((s, i) => ({ regime: s.regime, matchId: `${id}__${s.regime.replace("/", "-")}`, backend: "native", exitCode: 0, events: "" })),
    judge: { provider: "codex", scores, topRegime: scores[0]?.regime ?? null, swap },
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest));
}

function writeMatch(home, matchId, regime, events) {
  const dir = path.join(home, ".civagent", "matches", matchId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ matchId, regime }));
  fs.writeFileSync(
    path.join(dir, "events.jsonl"),
    events.map((e, i) => JSON.stringify({ matchId, seq: i, ts: 1000 + i, type: e.type ?? "skill", ...e })).join("\n") + "\n",
  );
}

// 6 tournaments: tang low with skill X (3), tang high without (3); qin always high.
function seedCooccurrence(home) {
  const skillPath = path.join(home, "repo-skills", "learned-bad.md");
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, "---\nname: bad\n---\n# bad skill\n");
  for (let i = 0; i < 6; i++) {
    const withSkill = i < 3;
    const tangScore = withSkill ? 5.0 : 8.0;
    const id = `t${i}`;
    writeManifest(home, id, {
      createdAt: 1000 + i,
      scores: [
        { regime: "china/tang", score: tangScore, dims: { legality: 3, feasibility: 2, resilience: 3 } },
        { regime: "china/qin", score: 9.2, dims: { legality: 4, feasibility: 4, resilience: 4 } },
      ],
      swap: i !== 5, // one tournament with swap off
    });
    const tangMatch = `${id}__china-tang`;
    writeMatch(home, tangMatch, "china/tang", withSkill ? [{ status: "saved", skillPath }] : [{ status: "skipped", reason: "no pattern" }]);
  }
  return { skillPath };
}

// ── analyze ──────────────────────────────────────────────────────────────────

test("analyze: dims clustering, repeated failures, tie rate, skill stats, <50 warning", () => {
  const home = makeHome();
  try {
    seedCooccurrence(home);
    const a = analyze({ home });
    assert.equal(a.tournamentsUsed, 6);
    assert.equal(a.recommendation, "hold", "<50 tournaments must not recommend climbing");
    assert.ok(a.warnings.some((w) => w.includes("不建议启动爬山")));
    // weakest dimension for tang = feasibility (2 < 3)
    assert.equal(a.regimes["china/tang"].weakestDim, "feasibility");
    assert.equal(a.regimes["china/tang"].lowCount, 3, "three scores below 6.0");
    assert.equal(a.regimes["china/qin"].lowCount, 0);
    // repeated failures: same task, 3 consecutive lows
    assert.ok(a.regimes["china/tang"].repeatedFailures.length >= 1);
    // tie rate: tang/qin never tie (Δ≥2.5 ≥ 0.8)
    assert.equal(a.tieRate, 0);
    // skill stats: 3 saved (tang), 3 skipped
    assert.equal(a.skillStats["china/tang"].saved, 3);
    assert.equal(a.skillStats["china/tang"].skipped, 3);
    // swap off counted
    assert.equal(a.swapsOff, 1);
    // co-occurrence computed
    const key = Object.keys(a.cooccurrence).find((k) => k.includes("learned-bad.md"));
    assert.equal(a.cooccurrence[key].withMean, 5);
    assert.equal(a.cooccurrence[key].withoutMean, 8);
  } finally {
    rmrf(home);
  }
});

// ── propose ──────────────────────────────────────────────────────────────────

test("propose: held back when evidence tournaments are insufficient", () => {
  const home = makeHome();
  try {
    writeManifest(home, "only", { scores: [{ regime: "china/tang", score: 5 }, { regime: "china/qin", score: 8 }] });
    const a = analyze({ home });
    const { proposals, heldBack } = buildProposals(a);
    assert.deepEqual(proposals, []);
    assert.match(heldBack, /样本不足/);
    assert.deepEqual(writeProposals(a, {}, home), []);
  } finally {
    rmrf(home);
  }
});

test("propose: skill_disable on low-score co-occurrence + config_tune on swap-off", () => {
  const home = makeHome();
  try {
    const { skillPath } = seedCooccurrence(home);
    const a = analyze({ home });
    const proposals = writeProposals(a, {}, home);
    const disable = proposals.find((p) => p.type === "skill_disable");
    assert.ok(disable, "expected a skill_disable proposal");
    assert.equal(disable.skillPath, skillPath);
    assert.equal(disable.evidence.withN, 3);
    assert.equal(disable.evidence.withoutN, 3);
    assert.ok(disable.evidence.delta >= 1);
    const cfg = proposals.find((p) => p.type === "config_tune" && p.config.key === "CIVAGENT_JUDGE_SWAP");
    assert.ok(cfg, "expected a config_tune proposal for judge swap");
    // proposal files written to disk
    const disk = readProposal(disable.id, home);
    assert.equal(disk.id, disable.id);
  } finally {
    rmrf(home);
  }
});

test("propose: skill_promote on high-score staged co-occurrence", () => {
  const home = makeHome();
  try {
    const skillPath = path.join(home, "repo-skills", "staging", "learned-good.md");
    fs.mkdirSync(path.dirname(skillPath), { recursive: true });
    fs.writeFileSync(skillPath, "x");
    for (let i = 0; i < 6; i++) {
      const id = `s${i}`;
      const withSkill = i < 3;
      writeManifest(home, id, {
        createdAt: 1000 + i,
        scores: [
          { regime: "china/tang", score: withSkill ? 9 : 6 },
          { regime: "china/qin", score: 7 },
        ],
      });
      writeMatch(home, `${id}__china-tang`, "china/tang", withSkill ? [{ status: "staged", skillPath }] : [{ status: "skipped" }]);
    }
    const a = analyze({ home });
    const { proposals } = buildProposals(a);
    const promote = proposals.find((p) => p.type === "skill_promote");
    assert.ok(promote, "expected a skill_promote proposal");
    assert.equal(promote.evidence.withMean, 9);
    assert.equal(promote.evidence.withoutMean, 6);
  } finally {
    rmrf(home);
  }
});

// ── apply / rollback ─────────────────────────────────────────────────────────

test("apply + rollback roundtrip: skill quarantine and config overlay", () => {
  const home = makeHome();
  try {
    const { skillPath } = seedCooccurrence(home);
    const a = analyze({ home });
    const proposals = writeProposals(a, {}, home);
    const disable = proposals.find((p) => p.type === "skill_disable");
    const cfg = proposals.find((p) => p.type === "config_tune");

    // apply skill_disable → file moves to quarantine
    const r1 = applyProposal(disable.id, home);
    assert.equal(r1.applied, disable.id);
    assert.ok(!fs.existsSync(skillPath), "skill must leave skills/");
    const quarantined = path.join(path.dirname(skillPath), "quarantine", path.basename(skillPath));
    assert.ok(fs.existsSync(quarantined), "skill must land in quarantine/");
    assert.equal(readProposal(disable.id, home).status, "applied");

    // apply config_tune → config.json written
    applyProposal(cfg.id, home);
    const cfgPath = hcPaths(home).config;
    assert.equal(JSON.parse(fs.readFileSync(cfgPath, "utf8")).CIVAGENT_JUDGE_SWAP, "1");

    // changelog has both applies with snapshots
    const log1 = fs.readFileSync(hcPaths(home).changelog, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(log1.filter((l) => l.action === "apply").length, 2);
    assert.ok(log1[0].snapshot.fileOps || log1[1].snapshot.fileOps);
    assert.ok(log1.some((l) => l.snapshot.config));

    // rollback both → original state restored
    rollback(disable.id, home);
    assert.ok(fs.existsSync(skillPath), "rollback must restore the skill file");
    assert.ok(!fs.existsSync(quarantined));
    assert.equal(readProposal(disable.id, home).status, "rolled_back");

    rollback(cfg.id, home);
    assert.deepEqual(JSON.parse(fs.readFileSync(cfgPath, "utf8")), {}, "rollback must restore prior config");

    const log2 = fs.readFileSync(hcPaths(home).changelog, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(log2.filter((l) => l.action === "rollback").length, 2);

    // double apply / invalid rollback rejected
    assert.throws(() => rollback(disable.id, home), /not applied/);
  } finally {
    rmrf(home);
  }
});

// ── paired comparison & validate ─────────────────────────────────────────────

test("pairedCompare: consistent improvement significant; alternating noise not", () => {
  const up = Array.from({ length: 12 }, (_, i) => ({ task: `t${i}`, regime: "r", baseline: 7, candidate: 7.8 }));
  const sig = pairedCompare(up, { B: 500, seed: 1 });
  assert.equal(sig.n, 12);
  assert.ok(sig.significant);
  assert.ok(sig.ci95[0] > 0);

  const noisy = Array.from({ length: 12 }, (_, i) => ({ task: `t${i}`, regime: "r", baseline: 7, candidate: i % 2 ? 7.9 : 6.1 }));
  const ns = pairedCompare(noisy, { B: 500, seed: 1 });
  assert.equal(ns.significant, false);
  assert.ok(ns.ci95[0] <= 0 && ns.ci95[1] >= 0);
});

test("validate: plan mode prints commands; fake-backend runs the paired pipeline", () => {
  const home = makeHome();
  try {
    const { skillPath } = seedCooccurrence(home);
    const proposals = writeProposals(analyze({ home }), {}, home);
    const id = proposals[0].id;

    const plan = validateProposal(id, { home, heldOutTasks: ["task A", "task B"] });
    assert.equal(plan.mode, "plan");
    assert.ok(plan.plan.some((l) => l.includes("civagent tournament")));
    assert.ok(plan.plan.some((l) => l.includes(`apply ${id}`)));
    assert.ok(plan.plan.some((l) => l.includes(`rollback ${id}`)));

    const fake = validateProposal(id, { home, heldOutTasks: ["task A", "task B"], repeats: 5, fakeBackend: true, B: 500 });
    assert.equal(fake.mode, "fake-backend");
    assert.equal(fake.paired.n, 10);
    assert.ok(fake.paired.significant, "synthetic +0.8 improvement must be significant");
    assert.ok(fake.paired.meanDelta > 0);
  } finally {
    rmrf(home);
  }
});

// ── CLI smoke ────────────────────────────────────────────────────────────────

test("CLI: civagent hillclimb analyze/propose on a temp HOME", { timeout: 30_000 }, async () => {
  const home = makeHome();
  try {
    seedCooccurrence(home);
    const run = (args) => new Promise((resolve, reject) => {
      const proc = spawn("bash", [CIVAGENT_BIN, ...args], { env: { ...process.env, HOME: home }, stdio: ["ignore", "pipe", "pipe"] });
      let out = "", err = "";
      proc.stdout.on("data", (d) => { out += d; });
      proc.stderr.on("data", (d) => { err += d; });
      proc.on("error", reject);
      proc.on("close", (code) => resolve({ code, out, err }));
    });
    const a = await run(["hillclimb", "analyze"]);
    assert.equal(a.code, 0, a.err);
    const parsed = JSON.parse(a.out);
    assert.equal(parsed.tournamentsUsed, 6);
    assert.equal(parsed.recommendation, "hold");

    const p = await run(["hillclimb", "propose"]);
    assert.equal(p.code, 0, p.err);
    assert.match(p.out, /skill_disable/);
    assert.match(p.out, /config_tune/);

    const v = await run(["hillclimb", "validate", "nonexistent-id"]);
    assert.equal(v.code, 1, "unknown proposal id must fail");
  } finally {
    rmrf(home);
  }
});

test("DEFAULTS encode the guardrails", () => {
  assert.equal(DEFAULTS.minTournaments, 50);
  assert.equal(DEFAULTS.minEvidenceTournaments, 5);
  assert.ok(DEFAULTS.lowScore > 0 && DEFAULTS.effectSize > 0);
});
