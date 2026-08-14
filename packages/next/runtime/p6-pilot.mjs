/**
 * p6-pilot.mjs — P6 runtime: budgeted factorial pilot machinery (plan §19).
 *
 * Executes the frozen pilot design (P6-PREREGISTRATION.md): 4 provider strata
 * × 2 topologies × 3 tasks × 1 seed = 24 cells, blocked by (task, seed) with
 * seeded execution order, paired blind judging with swap balance, budget caps
 * that fail cells closed, and a deterministic analysis of the preregistered
 * estimands. Everything is digest-pinned and reproducible.
 *
 * The pilot runs with scripted providers (stratum-labeled scripts): it
 * validates the machinery end-to-end with zero spend. The live lane replaces
 * the scripts with direct adapters behind the same contracts.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Cas, sha256Hex } from "../evidence/cas.mjs";
import { EventStore } from "../evidence/eventstore.mjs";
import { readCommittedEvents } from "../evidence/segment.mjs";
import { canonicalJson } from "../contracts/epoch-rules.mjs";
import { RegimeCompiler } from "../domain/regime-ir.mjs";
import { blindPresentation, aggregateScores, RUBRIC_DIMENSIONS } from "../domain/judge.mjs";
import { AgentSession, Turn, newId, transition, TURN_TRANSITIONS } from "./session.mjs";
import { Operation } from "./operation.mjs";
import { FakeProvider } from "../providers/fake-provider.mjs";
import { ModelGateway } from "../providers/gateway.mjs";
import { BehaviorScript } from "../providers/behavior-script.mjs";
import { buildManifest } from "./manifest.mjs";
import { SLICE_MANIFEST_INPUTS } from "./slice.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const P6_REPORT_DIR = path.join(__dirname, "reports");
export const P6_INSTRUMENT = "native-next-v1-p6pilot";

export const PILOT_STRATA = ["cn:doubao", "cn:glm", "cn:qwen", "cn:minimax"];
export const PILOT_TASKS = ["border-city-autonomy", "regional-militarization", "plague-response"];
export const PILOT_TOPOLOGIES = ["historical", "random"];
export const PILOT_SEEDS = [1];
export const DEFAULT_CELL_BUDGET = 1000; // tokens per cell (input+output)

const REGIMES = path.resolve(__dirname, "../../../regimes");
const REGIME_BY_TOPOLOGY = {
  historical: path.join(REGIMES, "china/tang"),
  random: path.join(REGIMES, "_baseline/tang-random"),
};
const MODEL_BY_STRATUM = {
  "cn:doubao": "doubao-pro", "cn:glm": "glm-4", "cn:qwen": "qwen-max", "cn:minimax": "minimax-text",
};

/** Seeded LCG permutation (deterministic; never ambient randomness). */
export function seededPermutation(n, seed) {
  let s = seed >>> 0;
  const lcg = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const arr = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** One cell: compile the regime, run one owned turn through the gateway. */
export function runCell({ stratum, topology, task, seed, budget = DEFAULT_CELL_BUDGET, dir }) {
  const regimeDir = REGIME_BY_TOPOLOGY[topology];
  const { ir, digest: regimeDigest } = new RegimeCompiler().compile(regimeDir);
  const cellId = `p6-${stratum}-${topology}-${task}-s${seed}`;
  const cas = new Cas(path.join(dir, "evidence"));
  const store = new EventStore(path.join(dir, "segments"), {
    generation: 1, segmentId: cellId, writer: "p6-pilot", instrumentVersion: P6_INSTRUMENT,
  });
  // deterministic IDs per cell: the pilot never reads ambient randomness
  // (plan §18.1), so the same cell reproduces byte-identical evidence
  const session = new AgentSession({ sessionId: `sess-${cellId}`, matchId: cellId }).markReady();
  const turn = new Turn({ turnId: `turn-${cellId}`, sessionId: session.sessionId, activationId: `act-${cellId}` });
  session.enqueue(turn);
  session.claimTurn();
  turn.state = transition("turn", turn.state, "RUNNING", TURN_TRANSITIONS);

  const script = new BehaviorScript([
    {
      expect: { purpose: "planner" },
      behave: {
        kind: "chunks",
        data: {
          chunks: [`臣（${stratum}/${topology}）奏报：${task} 之策，先固本而后图远。`],
          usage: { inputTokens: 20, outputTokens: 15 },
        },
      },
    },
  ]);
  const op = new Operation({ operationId: `op-${cellId}`, matchId: cellId, sessionId: session.sessionId, turnId: turn.turnId, purpose: "planner" });
  const manifest = buildManifest({
    ...SLICE_MANIFEST_INPUTS,
    modelIds: { planner: MODEL_BY_STRATUM[stratum] },
    providerAdapters: { [stratum]: "scripted-pilot" },
    stratum,
  });
  const gateway = new ModelGateway({ cas, eventStore: store, provider: new FakeProvider(script), instrumentVersion: P6_INSTRUMENT });
  const outcome = gateway.request({
    operation: op, model: MODEL_BY_STRATUM[stratum],
    systemPrompt: "你是本朝谋臣。", messages: [{ role: "user", content: `治理任务：${task}` }], tools: [],
  });
  session.completeClaimedTurn("COMPLETED");
  store.close("clean");
  const committed = readCommittedEvents(store.file);
  const usageTokens = (outcome.usage?.inputTokens ?? 0) + (outcome.usage?.outputTokens ?? 0);
  const evidenceDigest = sha256Hex(Buffer.from(canonicalJson({
    cellId, stratum, topology, task, seed, manifestDigest: manifest.digest,
    requestDigest: outcome.requestDigest, responseDigest: outcome.responseDigest,
    surfaceHash: outcome.responseDigest, eventCount: committed.length, usageTokens,
  })));
  return {
    cellId, stratum, topology, task, seed, regimeId: ir.regimeId, regimeDigest,
    surfaceText: outcome.text, usage: outcome.usage, usageTokens,
    evidenceDigest, eventCount: committed.length, status: usageTokens <= budget ? "ok" : "budget_overflow",
    participation: { invoked: 1, started: 1, contributed: 1, settled: 1 },
  };
}

/** One blind judge pass over a (historical, random) pair for one stratum. */
export function judgePair({ cas, store, pairId, armA, armB, swap }) {
  const presentation = blindPresentation(armA, armB, { swap });
  const scores = { A: { legality: 3, feasibility: 3, resilience: 2 }, B: { legality: 2, feasibility: 3, resilience: 3 } };
  const script = new BehaviorScript([
    { expect: { purpose: "judge" }, behave: { kind: "chunks", data: { chunks: [JSON.stringify(swap ? { A: scores.B, B: scores.A } : scores)], usage: { inputTokens: 10, outputTokens: 5 } } } },
  ]);
  const op = new Operation({ operationId: `op-judge-${pairId}-${swap ? "s" : "n"}`, matchId: `judge-${pairId}`, sessionId: null, turnId: null, purpose: "judge" });
  const gateway = new ModelGateway({ cas, eventStore: store, provider: new FakeProvider(script), instrumentVersion: P6_INSTRUMENT });
  const outcome = gateway.request({
    operation: op, model: "judge-model", systemPrompt: presentation.prompt,
    messages: [{ role: "user", content: "blind scoring" }], tools: [],
  });
  return { pairId, swap, scores: JSON.parse(outcome.text), operationId: op.operationId, usage: outcome.usage };
}

/** Run the full pilot: cells, judging, analysis, digest-pinned evidence. */
export function runP6Pilot({ seed = 1, budget = DEFAULT_CELL_BUDGET, dir } = {}) {
  const dirOut = dir ?? fs.mkdtempSync(path.join(os.tmpdir(), "civ-p6-"));
  fs.mkdirSync(dirOut, { recursive: true });

  // ── assignments manifest (digest-pinned before the run) ──────────────────
  const arms = [];
  for (const stratum of PILOT_STRATA) {
    for (const topology of PILOT_TOPOLOGIES) {
      for (const task of PILOT_TASKS) {
        for (const s of PILOT_SEEDS) arms.push({ stratum, topology, task, seed: s });
      }
    }
  }
  const assignments = { schema: "p6-assignments/1", instrumentVersion: P6_INSTRUMENT, arms };
  const assignmentsDigest = sha256Hex(Buffer.from(canonicalJson(assignments)));

  // ── seeded execution order per block (task, seed) ────────────────────────
  const cells = [];
  const blocks = new Map(); // `${task}:${seed}` -> arms
  for (const arm of arms) {
    const key = `${arm.task}:${arm.seed}`;
    if (!blocks.has(key)) blocks.set(key, []);
    blocks.get(key).push(arm);
  }
  for (const [key, blockArms] of blocks) {
    const [task, s] = key.split(":");
    const order = seededPermutation(blockArms.length, Number(s) * 31 + task.length);
    const cas = new Cas(path.join(dirOut, "evidence"));
    const store = new EventStore(path.join(dirOut, "segments"), {
      generation: 1, segmentId: `block-${key}`, writer: "p6-pilot", instrumentVersion: P6_INSTRUMENT,
    });
    for (const idx of order) {
      const arm = blockArms[idx];
      const cell = runCell({ ...arm, budget, dir: path.join(dirOut, "cells", arm.stratum) });
      cells.push(cell);
    }
    store.close("clean");
  }

  // ── paired blind judging per block/stratum ───────────────────────────────
  const judging = [];
  for (const stratum of PILOT_STRATA) {
    for (const task of PILOT_TASKS) {
      const hist = cells.find((c) => c.stratum === stratum && c.task === task && c.topology === "historical" && c.status === "ok");
      const rand = cells.find((c) => c.stratum === stratum && c.task === task && c.topology === "random" && c.status === "ok");
      if (!hist || !rand) continue;
      const pairId = `${stratum}-${task}`;
      const cas = new Cas(path.join(dirOut, "judge"));
      const store = new EventStore(path.join(dirOut, "segments-judge"), {
        generation: 1, segmentId: `judge-${pairId}`, writer: "p6-judge", instrumentVersion: P6_INSTRUMENT,
      });
      const pass1 = judgePair({ cas, store, pairId, armA: { surfaceText: hist.surfaceText }, armB: { surfaceText: rand.surfaceText }, swap: false });
      const pass2 = judgePair({ cas, store, pairId, armA: { surfaceText: hist.surfaceText }, armB: { surfaceText: rand.surfaceText }, swap: true });
      store.close("clean");
      const agg = aggregateScores([pass1, pass2]);
      judging.push({
        pairId, stratum, task, passes: [pass1, pass2].map((p) => ({ swap: p.swap, scores: p.scores, operationId: p.operationId })),
        aggregate: { total: agg.total, digest: agg.digest },
        swapAgreed: (pass1.scores.A.legality + pass1.scores.A.feasibility + pass1.scores.A.resilience > pass1.scores.B.legality + pass1.scores.B.feasibility + pass1.scores.B.resilience) ===
          (pass2.scores.B.legality + pass2.scores.B.feasibility + pass2.scores.B.resilience > pass2.scores.A.legality + pass2.scores.A.feasibility + pass2.scores.A.resilience),
      });
    }
  }

  const analysis = analyzePilot(cells, judging);
  const evidence = {
    schema: "p6-pilot-evidence/1",
    instrumentVersion: P6_INSTRUMENT,
    design: { strata: PILOT_STRATA, topologies: PILOT_TOPOLOGIES, tasks: PILOT_TASKS, seeds: PILOT_SEEDS, budgetPerCell: budget },
    assignmentsDigest,
    cells: cells.map((c) => ({ cellId: c.cellId, stratum: c.stratum, topology: c.topology, task: c.task, seed: c.seed, status: c.status, usageTokens: c.usageTokens, evidenceDigest: c.evidenceDigest, eventCount: c.eventCount, participation: c.participation })),
    judging,
    analysis,
    missingness: {
      budgetOverflow: cells.filter((c) => c.status !== "ok").map((c) => c.cellId),
      failedCellsInDenominator: cells.length,
    },
    dir: dirOut,
  };
  fs.mkdirSync(P6_REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(P6_REPORT_DIR, "p6-pilot-evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
  return evidence;
}

/** Deterministic analysis of the preregistered estimands. */
export function analyzePilot(cells, judging) {
  const ok = cells.filter((c) => c.status === "ok");
  const byStratum = {};
  for (const s of PILOT_STRATA) {
    const sc = ok.filter((c) => c.stratum === s);
    const mean = (topo) => {
      const rows = sc.filter((c) => c.topology === topo);
      return rows.length ? rows.reduce((a, c) => a + c.usageTokens, 0) / rows.length : null;
    };
    byStratum[s] = { cells: sc.length, cost: { historicalMean: mean("historical"), randomMean: mean("random") } };
  }
  const topologyEffect = (() => {
    const pairs = judging.map((j) => ({
      hist: j.aggregate.total.A, rand: j.aggregate.total.B, stratum: j.stratum, task: j.task,
    }));
    const histMean = pairs.length ? pairs.reduce((a, p) => a + p.hist, 0) / pairs.length : null;
    const randMean = pairs.length ? pairs.reduce((a, p) => a + p.rand, 0) / pairs.length : null;
    return { pairs: pairs.length, histMean, randMean, effect: histMean !== null && randMean !== null ? histMean - randMean : null };
  })();
  const swapAgreement = judging.length ? judging.filter((j) => j.swapAgreed).length / judging.length : null;
  const totalCost = ok.reduce((a, c) => a + c.usageTokens, 0);
  const judgeCost = judging.reduce((a, j) => a + j.passes.reduce((x, p) => x + (p.scores ? 15 : 0), 0), 0);
  return {
    runtime: P6_INSTRUMENT, // never pooled with legacy-cc-v5
    topologyEffect,
    byStratum,
    judgeSwapAgreement: swapAgreement,
    cost: { cellTokens: totalCost, judgeTokens: judgeCost, totalTokens: totalCost + judgeCost },
    digest: sha256Hex(Buffer.from(canonicalJson({
      runtime: P6_INSTRUMENT, topologyEffect, byStratum, swapAgreement, cost: { totalTokens: totalCost + judgeCost },
    }))),
  };
}

function main() {
  const argv = process.argv.slice(2);
  const budget = Number(argv[argv.indexOf("--budget") + 1] ?? DEFAULT_CELL_BUDGET);
  const evidence = runP6Pilot({ budget });
  console.log(JSON.stringify({
    instrumentVersion: evidence.instrumentVersion,
    assignmentsDigest: evidence.assignmentsDigest.slice(0, 16),
    cells: evidence.cells.length,
    statuses: Object.fromEntries([...new Set(evidence.cells.map((c) => c.status))].map((s) => [s, evidence.cells.filter((c) => c.status === s).length])),
    judgingPairs: evidence.judging.length,
    analysis: evidence.analysis,
    reportFile: path.join(P6_REPORT_DIR, "p6-pilot-evidence.json"),
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
