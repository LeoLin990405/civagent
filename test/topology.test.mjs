// topology.test.mjs — tests for the regime topology layer (P1):
// schema validation (positive/negative), IDENTITY.md cross-check, graph
// metrics (hand-verified small graphs + real regime fixtures), CLI smoke.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  validateTopologyData,
  validateRegimeTopology,
  crossCheckIdentity,
  parseIdentityAgentIds,
  normalizeMode,
  FUNCTIONAL_ROLES,
  EDGE_KINDS,
  MODES,
  NODE_KINDS,
} from "../engine/topology/validate.mjs";
import { computeMetrics, commandDepth, checksCycles } from "../engine/topology/metrics.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CIVAGENT_BIN = path.join(PROJECT_ROOT, "bin", "civagent");

// ── constants ────────────────────────────────────────────────────────────────

test("functional role vocabulary matches the compiler's 9 roles", () => {
  assert.equal(FUNCTIONAL_ROLES.length, 9);
  for (const r of ["coordinator", "engineering", "review", "research", "data", "devops", "content", "legal", "management"]) {
    assert.ok(FUNCTIONAL_ROLES.includes(r), `missing role ${r}`);
  }
  assert.deepEqual([...EDGE_KINDS].sort(), ["command", "info", "review", "veto"]);
  assert.equal(MODES.length, 6);
  assert.equal(normalizeMode("dual-power"), "dual-track");
  assert.equal(normalizeMode("centralized-hierarchy"), "centralized");
});

// ── schema validation: positive ──────────────────────────────────────────────

test("all 6 representative regime topologies validate cleanly", () => {
  for (const r of ["china/tang", "china/qin", "global/athens", "china/ming", "china/zhou", "china/shang"]) {
    const res = validateRegimeTopology(path.join(PROJECT_ROOT, "regimes", r));
    assert.ok(res.ok, `${r} must validate: ${res.errors.join("; ")}`);
    assert.equal(res.topology.regime, r);
  }
});

// ── schema validation: negative ──────────────────────────────────────────────

function validTopology() {
  return {
    schema_version: "1.0",
    regime: "test/demo",
    mode: "centralized",
    nodes: [
      { id: "a", label: "A", functional_role: "coordinator" },
      { id: "b", label: "B", functional_role: "review" },
    ],
    edges: [{ from: "a", to: "b", kind: "command" }],
  };
}

test("validateTopologyData accepts a minimal valid topology", () => {
  assert.deepEqual(validateTopologyData(validTopology()), []);
});

test("rejects unknown functional_role / bad mode / bad edge kind", () => {
  const t1 = validTopology();
  t1.nodes[0].functional_role = "wizard";
  assert.ok(validateTopologyData(t1).some((e) => e.includes("functional_role")));

  const t2 = validTopology();
  t2.mode = "anarchy";
  assert.ok(validateTopologyData(t2).some((e) => e.includes("mode")));

  const t3 = validTopology();
  t3.edges[0].kind = "telepathy";
  assert.ok(validateTopologyData(t3).some((e) => e.includes("kind")));
});

test("rejects edges to unknown nodes, self-loops, duplicate edges, duplicate node ids", () => {
  const t1 = validTopology();
  t1.edges.push({ from: "a", to: "ghost", kind: "info" });
  assert.ok(validateTopologyData(t1).some((e) => e.includes("unknown node")));

  const t2 = validTopology();
  t2.edges.push({ from: "a", to: "a", kind: "info" });
  assert.ok(validateTopologyData(t2).some((e) => e.includes("self-loop")));

  const t3 = validTopology();
  t3.edges.push({ from: "a", to: "b", kind: "command" });
  assert.ok(validateTopologyData(t3).some((e) => e.includes("duplicate edge")));

  const t4 = validTopology();
  t4.nodes.push({ id: "a", label: "A2", functional_role: "legal" });
  assert.ok(validateTopologyData(t4).some((e) => e.includes("duplicate node id")));
});

test("rejects missing required top-level fields", () => {
  assert.ok(validateTopologyData({}).length >= 4, "empty object must fail on all required fields");
  assert.ok(validateTopologyData(null).length > 0);
  const t = validTopology();
  delete t.nodes;
  assert.ok(validateTopologyData(t).some((e) => e.includes("nodes")));
});

// ── IDENTITY.md cross-check ──────────────────────────────────────────────────

const IDENTITY_FIXTURE = `# 测试政体 — 组织架构

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 王 | wang | coordinator | opus |
| 相 | xiang | management | sonnet |
`;

test("parseIdentityAgentIds extracts ids from the role mapping table", () => {
  assert.deepEqual(parseIdentityAgentIds(IDENTITY_FIXTURE), ["wang", "xiang"]);
});

test("crossCheckIdentity passes when nodes match the table exactly", () => {
  const t = {
    nodes: [
      { id: "wang", label: "王", functional_role: "coordinator" },
      { id: "xiang", label: "相", functional_role: "management" },
    ],
  };
  assert.deepEqual(crossCheckIdentity(t, IDENTITY_FIXTURE), []);
});

test("crossCheckIdentity flags a role missing from topology", () => {
  const t = { nodes: [{ id: "wang", label: "王", functional_role: "coordinator" }] };
  const errors = crossCheckIdentity(t, IDENTITY_FIXTURE);
  assert.ok(errors.some((e) => e.includes("xiang") && e.includes("missing")));
});

test("crossCheckIdentity flags a topology node absent from the table", () => {
  const t = {
    nodes: [
      { id: "wang", label: "王", functional_role: "coordinator" },
      { id: "xiang", label: "相", functional_role: "management" },
      { id: "ghost", label: "幽灵", functional_role: "legal" },
    ],
  };
  const errors = crossCheckIdentity(t, IDENTITY_FIXTURE);
  assert.ok(errors.some((e) => e.includes("ghost") && e.includes("does not appear")));
});

// Full-directory fixture: valid case + mode mismatch + missing JSON.
function makeRegimeDir({ topology, pattern = "centralized", identity = IDENTITY_FIXTURE }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-topo-"));
  fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify({
    id: "demo", name: { zh: "测试", en: "Demo" }, orchestrationPattern: pattern,
  }));
  fs.writeFileSync(path.join(dir, "IDENTITY.md"), identity);
  if (topology !== undefined) {
    fs.writeFileSync(path.join(dir, "topology.json"), JSON.stringify(topology));
  }
  return dir;
}

test("validateRegimeTopology: full fixture passes; mode mismatch and missing file fail", () => {
  const good = makeRegimeDir({
    topology: {
      schema_version: "1.0", regime: "test/demo", mode: "centralized",
      nodes: [
        { id: "wang", label: "王", functional_role: "coordinator" },
        { id: "xiang", label: "相", functional_role: "management" },
      ],
      edges: [{ from: "wang", to: "xiang", kind: "command" }],
    },
  });
  try {
    const r = validateRegimeTopology(good);
    assert.ok(r.ok, `fixture must validate: ${r.errors.join("; ")}`);
  } finally {
    fs.rmSync(good, { recursive: true, force: true });
  }

  const bad = makeRegimeDir({
    topology: {
      schema_version: "1.0", regime: "test/demo", mode: "democratic", // metadata says centralized
      nodes: [
        { id: "wang", label: "王", functional_role: "coordinator" },
        { id: "xiang", label: "相", functional_role: "management" },
      ],
      edges: [],
    },
    pattern: "centralized",
  });
  try {
    const r = validateRegimeTopology(bad);
    assert.ok(!r.ok);
    assert.ok(r.errors.some((e) => e.includes("orchestrationPattern")));
  } finally {
    fs.rmSync(bad, { recursive: true, force: true });
  }

  const none = makeRegimeDir({ topology: undefined });
  try {
    const r = validateRegimeTopology(none);
    assert.ok(!r.ok && r.skipped, "missing topology.json must be reported as skipped");
  } finally {
    fs.rmSync(none, { recursive: true, force: true });
  }
});

// ── metrics ──────────────────────────────────────────────────────────────────

// Hand-verified small graph:
//   a --command--> b --command--> c, c --review--> a, a --info--> c
// depth(a→b→c) = 2; density = 4/(3*2) = 0.667; c has in-degree 2 (top);
// two elementary cycles contain the review edge c→a: a→b→c→a and a→c→a.
const SMALL = {
  regime: "test/small",
  mode: "centralized",
  nodes: [
    { id: "a", label: "A", functional_role: "coordinator" },
    { id: "b", label: "B", functional_role: "management" },
    { id: "c", label: "C", functional_role: "review" },
  ],
  edges: [
    { from: "a", to: "b", kind: "command" },
    { from: "b", to: "c", kind: "command" },
    { from: "c", to: "a", kind: "review" },
    { from: "a", to: "c", kind: "info" },
  ],
};

test("computeMetrics matches hand-computed values on a small graph", () => {
  const m = computeMetrics(SMALL);
  assert.equal(m.nodes, 3);
  assert.equal(m.edges, 4);
  assert.ok(Math.abs(m.density - 4 / 6) < 0.001);
  assert.equal(m.command_depth, 2);
  assert.deepEqual(m.top_in_degree, [{ id: "c", inDegree: 2 }]);
  assert.equal(m.checks_cycles, 2, "a→b→c→a and a→c→a both contain the review edge");
});

test("commandDepth never loops on reporting edges (cycles cut)", () => {
  // a→b command, b→a command (report back): longest simple chain is 1 edge pair = 1...2
  const t = {
    nodes: [{ id: "a" }, { id: "b" }],
    edges: [
      { from: "a", to: "b", kind: "command" },
      { from: "b", to: "a", kind: "command" },
    ],
  };
  assert.equal(commandDepth(t), 1, "2-cycle must not inflate depth");
});

test("checksCycles ignores cycles without review/veto edges", () => {
  const t = {
    nodes: [{ id: "a" }, { id: "b" }],
    edges: [
      { from: "a", to: "b", kind: "command" },
      { from: "b", to: "a", kind: "info" },
    ],
  };
  assert.equal(checksCycles(t).count, 0, "pure command/info cycles are not checks");
  t.edges.push({ from: "b", to: "a", kind: "veto" });
  assert.equal(checksCycles(t).count, 1, "a veto variant marks the cycle");
});

test("real regime metrics: tang hub, ming dual-track veto cycle, shang flat", () => {
  const tang = computeMetrics(validateRegimeTopology(path.join(PROJECT_ROOT, "regimes/china/tang")).topology);
  assert.equal(tang.nodes, 9);
  assert.equal(tang.edges, 15);
  assert.deepEqual(tang.top_in_degree, [{ id: "shangshu", inDegree: 7 }]);
  assert.equal(tang.checks_cycles, 1, "中书→门下封驳 loop is the defining checks-and-balances cycle");
  assert.deepEqual(tang.checks_cycle_nodes, [["zhongshu", "menxia"]]);

  const ming = computeMetrics(validateRegimeTopology(path.join(PROJECT_ROOT, "regimes/china/ming")).topology);
  assert.equal(ming.checks_cycles, 1, "票拟/批红 must form exactly one veto cycle");
  assert.deepEqual(ming.checks_cycle_nodes, [["shoufu", "silijian"]]);

  const shang = computeMetrics(validateRegimeTopology(path.join(PROJECT_ROOT, "regimes/china/shang")).topology);
  assert.equal(shang.checks_cycles, 0, "theocratic regime has no checks");
  assert.deepEqual(shang.top_in_degree, [{ id: "da-wang", inDegree: 2 }]);
});

// ── node typing (R8-1): node.kind ────────────────────────────────────────────

test("NODE_KINDS vocabulary is agent/gate/checkpoint/router", () => {
  assert.equal(NODE_KINDS.length, 4);
  for (const k of ["agent", "gate", "checkpoint", "router"]) {
    assert.ok(NODE_KINDS.includes(k), `missing kind ${k}`);
  }
});

test("kind is optional: a topology with no kind field validates (baseline preserved)", () => {
  // validTopology() has no kind on any node — this must stay green so the 57
  // pre-typing regimes are not broken.
  assert.deepEqual(validateTopologyData(validTopology()), []);
});

test("kind defaults to agent: explicit 'agent' and omitted are equivalent for metrics", () => {
  const noKind = validTopology();
  const withAgent = validTopology();
  withAgent.nodes[0].kind = "agent";
  assert.deepEqual(validateTopologyData(noKind), []);
  assert.deepEqual(validateTopologyData(withAgent), []);
  assert.equal(computeMetrics(noKind).gate_count, 0);
  assert.equal(computeMetrics(withAgent).gate_count, 0);
});

test("rejects an unknown kind value (typo must not silently become agent)", () => {
  const t = validTopology();
  t.nodes[0].kind = "gat";
  const errs = validateTopologyData(t);
  assert.ok(errs.some((e) => e.includes("kind") && e.includes("gat")), `got: ${errs.join("; ")}`);
});

// ── constraint: non-agent kind cannot pair with a content-producing role ──

test("rejects gate/checkpoint/router paired with a content-producing functional_role", () => {
  for (const kind of ["gate", "checkpoint", "router"]) {
    for (const role of ["engineering", "research", "data", "devops", "content"]) {
      const t = validTopology();
      t.nodes[0].functional_role = role;
      t.nodes[0].kind = kind;
      const errs = validateTopologyData(t);
      assert.ok(
        errs.some((e) => e.includes(kind) && e.includes(role) && e.includes("content")),
        `${kind}+${role} must be rejected: ${errs.join("; ")}`,
      );
    }
  }
});

test("accepts gate/checkpoint/router paired with a non-content role (coordinator/review/legal/management)", () => {
  for (const kind of ["gate", "checkpoint", "router"]) {
    for (const role of ["coordinator", "review", "legal", "management"]) {
      const t = validTopology();
      // node b is the inbound target so gate/checkpoint have an inbound edge.
      t.nodes[1].functional_role = role;
      t.nodes[1].kind = kind;
      const errs = validateTopologyData(t);
      assert.ok(
        !errs.some((e) => e.includes("content-producing")),
        `${kind}+${role} must be accepted: ${errs.join("; ")}`,
      );
    }
  }
});

// ── constraint: a router may only emit command/info edges ──

test("rejects a router emitting review or veto (judgment edges)", () => {
  for (const badKind of ["review", "veto"]) {
    const t = validTopology();
    t.nodes[0].kind = "router";
    t.nodes[0].functional_role = "coordinator";
    t.edges[0].kind = badKind; // a -> b
    const errs = validateTopologyData(t);
    assert.ok(
      errs.some((e) => e.includes("router") && e.includes(badKind)),
      `router emitting ${badKind} must be rejected: ${errs.join("; ")}`,
    );
  }
});

test("accepts a router emitting command/info", () => {
  for (const okKind of ["command", "info"]) {
    const t = validTopology();
    t.nodes[0].kind = "router";
    t.nodes[0].functional_role = "coordinator";
    t.edges[0].kind = okKind;
    const errs = validateTopologyData(t);
    assert.ok(!errs.some((e) => e.includes("router")), `router emitting ${okKind} must be accepted: ${errs.join("; ")}`);
  }
});

// ── constraint: a gate/checkpoint with no inbound edge is a dead node ──

test("rejects a gate/checkpoint with no inbound edge (dead gate)", () => {
  for (const kind of ["gate", "checkpoint"]) {
    const t = validTopology();
    // Make node 'a' the gate and give it NO inbound edge: edge a->b only.
    t.nodes[0].kind = kind;
    t.nodes[0].functional_role = "review";
    const errs = validateTopologyData(t);
    assert.ok(
      errs.some((e) => e.includes("node a") && e.includes(kind) && e.includes("no inbound")),
      `${kind} with no inbound must be rejected: ${errs.join("; ")}`,
    );
  }
});

test("accepts a gate that has an inbound edge", () => {
  const t = validTopology();
  // node b has inbound from a.
  t.nodes[1].kind = "gate";
  t.nodes[1].functional_role = "review";
  const errs = validateTopologyData(t);
  assert.ok(!errs.some((e) => e.includes("no inbound")), `gate with inbound must be accepted: ${errs.join("; ")}`);
});

// ── metrics: gate_count / checkpoint_count ──

test("gate_count and checkpoint_count count typed non-agent nodes", () => {
  const t = {
    schema_version: "1.0",
    regime: "test/kinds",
    mode: "checks-and-balances",
    nodes: [
      { id: "src", label: "Src", functional_role: "coordinator" },
      { id: "g", label: "Gate", functional_role: "review", kind: "gate" },
      { id: "cp", label: "Checkpoint", functional_role: "management", kind: "checkpoint" },
      { id: "r", label: "Router", functional_role: "coordinator", kind: "router" },
      { id: "sink", label: "Sink", functional_role: "engineering" },
    ],
    edges: [
      { from: "src", to: "g", kind: "command" },
      { from: "g", to: "cp", kind: "veto" },     // gate emits veto (allowed: not a router)
      { from: "cp", to: "r", kind: "command" },   // checkpoint emits command (allowed)
      { from: "r", to: "sink", kind: "command" }, // router emits command (allowed)
    ],
  };
  assert.deepEqual(validateTopologyData(t), []);
  const m = computeMetrics(t);
  assert.equal(m.gate_count, 1);
  assert.equal(m.checkpoint_count, 1);
  // router is not counted in either gate or checkpoint.
  assert.equal(m.nodes - m.gate_count - m.checkpoint_count, 3);
});

test("gate_count/checkpoint_count are 0 for an untyped topology (orthogonal to checks_cycles)", () => {
  // SMALL has no kind on any node and one review-edge cycle.
  const m = computeMetrics(SMALL);
  assert.equal(m.gate_count, 0);
  assert.equal(m.checkpoint_count, 0);
  assert.equal(m.checks_cycles, 2, "precondition: SMALL has checks cycles but no gates");
});

// No real regime declares a deterministic gate, and that is the correct state,
// not a gap waiting to be filled. `gate` means "no model discretion, a rule
// decides pass/block". The Tang Chancellery and the Ming Directorate of
// Ceremonial are LLM reviewers exercising judgment; labelling them gates would
// make gate_count report a hard mechanical veto where the regime has a
// discretionary one. The genuinely deterministic part — the [VETO] sniffer — is
// a runtime mechanism in engine/mechanisms/veto.mjs attached to an agent node,
// not a node in the graph. If a future regime models a real rule-driven gate,
// this test is where the count changes.
test("real regimes declare no deterministic gates or checkpoints", () => {
  for (const r of ["china/tang", "china/ming", "china/qin", "china/zhou", "china/shang", "global/athens"]) {
    const m = computeMetrics(validateRegimeTopology(path.join(PROJECT_ROOT, "regimes", r)).topology);
    assert.equal(m.gate_count, 0, `${r}: LLM reviewers are agents, not gates`);
    assert.equal(m.checkpoint_count, 0, `${r} has no human checkpoint node`);
  }
});

test("gate_count and checks_cycles are independent measures", () => {
  // Tang has a checks cycle (menxia can veto zhongshu) but no gate node. A
  // reader who conflated the two would think "has checks" implies "has a hard
  // gate"; these are different claims and the metrics must not merge them.
  const tang = computeMetrics(validateRegimeTopology(path.join(PROJECT_ROOT, "regimes/china/tang")).topology);
  assert.equal(tang.checks_cycles, 1, "tang has a review/veto cycle");
  assert.equal(tang.gate_count, 0, "…and still no deterministic gate");
});

test("router typing survives on a real regime", () => {
  // shangshu is the one real annotation kept: SOUL.md says it only receives
  // approved edicts and dispatches them to the Six Ministries.
  const { topology } = validateRegimeTopology(path.join(PROJECT_ROOT, "regimes/china/tang"));
  const shangshu = topology.nodes.find((n) => n.id === "shangshu");
  assert.equal(shangshu.kind, "router", "shangshu dispatches, it does not adjudicate");
});

// ── CLI smoke ────────────────────────────────────────────────────────────────

function runCli(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("bash", [CIVAGENT_BIN, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    proc.stdout.on("data", (d) => { out += d; });
    proc.stderr.on("data", (d) => { err += d; });
    proc.on("error", reject);
    proc.on("close", (code) => resolve({ code, out, err }));
  });
}

test("CLI: civagent topology validate china/tang exits 0", { timeout: 30_000 }, async () => {
  const r = await runCli(["topology", "validate", "china/tang"]);
  assert.equal(r.code, 0, `stderr: ${r.err}`);
  assert.match(r.out, /china\/tang topology OK/);
});

test("CLI: civagent topology metrics china/tang prints JSON", { timeout: 30_000 }, async () => {
  const r = await runCli(["topology", "metrics", "china/tang"]);
  assert.equal(r.code, 0, `stderr: ${r.err}`);
  const m = JSON.parse(r.out);
  assert.equal(m.regime, "china/tang");
  assert.equal(m.mode, "checks-and-balances");
  assert.equal(typeof m.checks_cycles, "number");
});

test("CLI: unknown regime and missing topology fail with exit 1", { timeout: 30_000 }, async () => {
  const r1 = await runCli(["topology", "validate", "china/atlantis"]);
  assert.equal(r1.code, 1);
  // china/han has no topology.json yet — explicit validate must fail clearly.
  const r2 = await runCli(["topology", "validate", "china/han"]);
  assert.equal(r2.code, 1);
  assert.match(r2.err, /no topology\.json/);
});
