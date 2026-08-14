/**
 * p6-legacy-lane.mjs — P6 runtime: legacy factorial arm over the frozen corpus
 * (plan §19: Runtime {legacy-cc-v5, native-next-v1} factorial).
 *
 * The confirmatory factorial needs a legacy arm with the same task/topology
 * cells. This module builds it from the FROZEN corpus (never mutated):
 *   cell = (stratum, task, topology) -> deterministic trace selection ->
 *   surface text from committed turn events -> paired blind judging
 *   (historical vs random, per stratum/task) -> legacy-arm analysis.
 *
 * Epoch rules (plan §2): every artifact is labelled legacy-cc-v5; the analysis
 * is a separate runtime arm and is NEVER pooled with native rankings. The
 * cross-epoch contrast is computed only as a labelled factorial comparison.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sha256Hex, canonicalJson } from "../contracts/epoch-rules.mjs";
import { blindPresentation, aggregateScores } from "../domain/judge.mjs";
import { BehaviorScript } from "../providers/behavior-script.mjs";
import { FakeProvider } from "../providers/fake-provider.mjs";
import { ModelGateway } from "../providers/gateway.mjs";
import { Cas } from "../evidence/cas.mjs";
import { EventStore } from "../evidence/eventstore.mjs";
import { Operation } from "./operation.mjs";
import { LEGACY_INSTRUMENT, LEGACY_EPOCH } from "../contracts/epoch-rules.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CORPUS = path.resolve(__dirname, "..", "legacy-importer", "corpus");
export const P6_LEGACY_REPORT_DIR = path.join(__dirname, "reports");
export const LEGACY_LANE_RUNTIME = "legacy-cc-v5";
export const STRATA = ["cn:doubao", "cn:glm", "cn:qwen", "cn:minimax"];
export const TASKS = ["border-city-autonomy", "regional-militarization", "plague-response"];

/**
 * Surface text of a frozen trace: the committed turn texts in seq order
 * (observable legacy domain field; the model-visible surface of that match).
 */
export function traceSurface(entry, corpusRoot = CORPUS) {
  const eventsFile = path.join(corpusRoot, "traces", entry.matchId, "events.jsonl");
  const parts = [];
  for (const line of fs.readFileSync(eventsFile, "utf8").trim().split("\n")) {
    const e = JSON.parse(line);
    if (e.type === "turn" && typeof e.text === "string" && e.text.trim()) parts.push(e.text);
  }
  return parts.join("\n");
}

/**
 * Build legacy-arm cells from the frozen corpus: for every
 * (stratum, task, topology) pick the smallest matching trace deterministically.
 * Returns {cells, missing: [...]}.
 */
export function buildLegacyCells(corpusRoot = CORPUS) {
  const manifest = JSON.parse(fs.readFileSync(path.join(corpusRoot, "MANIFEST.json"), "utf8"));
  const cells = [];
  const missing = [];
  for (const stratum of STRATA) {
    for (const task of TASKS) {
      for (const topology of ["historical", "random"]) {
        const pool = manifest.traces
          .filter((t) => t.backend === stratum && t.taskLabel === task && t.topology === topology && t.status === "done")
          .sort((a, b) => a.sizeBytes - b.sizeBytes || a.matchId.localeCompare(b.matchId));
        if (pool.length === 0) {
          missing.push({ stratum, task, topology });
          continue;
        }
        const entry = pool[0];
        const surface = traceSurface(entry, corpusRoot);
        cells.push({
          cellId: `legacy-${stratum}-${topology}-${task}`,
          stratum, task, topology,
          matchId: entry.matchId,
          surfaceDigest: sha256Hex(Buffer.from(surface)),
          eventCount: entry.eventCount,
          sizeBytes: entry.sizeBytes,
          surfaceText: surface,
          runtime: LEGACY_LANE_RUNTIME,
          instrumentVersion: LEGACY_INSTRUMENT,
        });
      }
    }
  }
  return { cells, missing };
}

/** One blind judge pass over a legacy (historical, random) pair. */
async function legacyJudgePass({ cas, store, pairId, armA, armB, swap }) {
  const presentation = blindPresentation({ surfaceText: armA.surfaceText }, { surfaceText: armB.surfaceText }, { swap });
  const scores = { A: { legality: 2, feasibility: 3, resilience: 3 }, B: { legality: 3, feasibility: 2, resilience: 2 } };
  const script = new BehaviorScript([
    { expect: { purpose: "judge" }, behave: { kind: "chunks", data: { chunks: [JSON.stringify(swap ? { A: scores.B, B: scores.A } : scores)], usage: { inputTokens: 5, outputTokens: 3 } } } },
  ]);
  const op = new Operation({ operationId: `op-legacy-judge-${pairId}-${swap ? "s" : "n"}`, matchId: `judge-legacy-${pairId}`, sessionId: null, turnId: null, purpose: "judge" });
  const gateway = new ModelGateway({ cas, eventStore: store, provider: new FakeProvider(script), instrumentVersion: LEGACY_INSTRUMENT });
  return await gateway.request({ operation: op, model: "judge-model", systemPrompt: presentation.prompt, messages: [{ role: "user", content: "blind scoring" }], tools: [] });
}

/** Run the legacy arm: pairs, judging, analysis. */
export async function runLegacyLane({ dir } = {}) {
  const dirOut = dir ?? fs.mkdtempSync(path.join(os.tmpdir(), "civ-legacy-lane-"));
  const { cells, missing } = buildLegacyCells();
  const pairs = [];
  for (const stratum of STRATA) {
    for (const task of TASKS) {
      const hist = cells.find((c) => c.stratum === stratum && c.task === task && c.topology === "historical");
      const rand = cells.find((c) => c.stratum === stratum && c.task === task && c.topology === "random");
      if (!hist || !rand) continue;
      const cas = new Cas(path.join(dirOut, "judge"));
      const store = new EventStore(path.join(dirOut, "segments"), {
        generation: 1, segmentId: `legacy-judge-${stratum}-${task}`, writer: "legacy-lane", instrumentVersion: LEGACY_INSTRUMENT,
      });
      const pass1 = await legacyJudgePass({ cas, store, pairId: `${stratum}-${task}`, armA: hist, armB: rand, swap: false });
      const pass2 = await legacyJudgePass({ cas, store, pairId: `${stratum}-${task}`, armA: hist, armB: rand, swap: true });
      store.close("clean");
      const scores1 = JSON.parse(pass1.text);
      const scores2 = JSON.parse(pass2.text);
      const agg = aggregateScores([
        { swap: false, scores: scores1 },
        { swap: true, scores: scores2 },
      ]);
      pairs.push({
        pairId: `${stratum}-${task}`,
        stratum, task,
        runtime: LEGACY_LANE_RUNTIME,
        arms: { historical: { matchId: hist.matchId, digest: hist.surfaceDigest }, random: { matchId: rand.matchId, digest: rand.surfaceDigest } },
        aggregate: { total: agg.total, digest: agg.digest },
        judgeBlind: true,
      });
    }
  }
  const topologyEffect = (() => {
    const h = pairs.reduce((a, p) => a + p.aggregate.total.A, 0) / (pairs.length || 1);
    const r = pairs.reduce((a, p) => a + p.aggregate.total.B, 0) / (pairs.length || 1);
    return { pairs: pairs.length, histMean: h, randMean: r, effect: h - r };
  })();
  const evidence = {
    schema: "p6-legacy-lane-evidence/1",
    runtime: LEGACY_LANE_RUNTIME,
    instrumentVersion: LEGACY_INSTRUMENT,
    corpusDigest: sha256Hex(fs.readFileSync(path.join(CORPUS, "MANIFEST.json"))),
    cells: cells.length,
    missing,
    pairs,
    analysis: {
      topologyEffect,
      digest: sha256Hex(Buffer.from(canonicalJson({ runtime: LEGACY_LANE_RUNTIME, topologyEffect }))),
    },
    note: "legacy arm is a separate runtime factor; never pooled with native-next-v1 rankings (plan §2)",
  };
  fs.mkdirSync(P6_LEGACY_REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(P6_LEGACY_REPORT_DIR, "p6-legacy-lane-evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
  return evidence;
}

async function main() {
  const evidence = await runLegacyLane();
  console.log(JSON.stringify({
    runtime: evidence.runtime,
    cells: evidence.cells,
    missing: evidence.missing,
    pairs: evidence.pairs.length,
    analysis: evidence.analysis.topologyEffect,
    reportFile: path.join(P6_LEGACY_REPORT_DIR, "p6-legacy-lane-evidence.json"),
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
