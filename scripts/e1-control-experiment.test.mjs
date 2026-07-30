import { test } from "node:test";
import assert from "node:assert/strict";
import {
  E1_PAIRS,
  buildPlan,
  executePlan,
} from "./e1-control-experiment.mjs";

const SCENARIOS = [
  { id: "s-one", prompt: "scenario one" },
  { id: "s-two", prompt: "scenario two" },
  { id: "s-three", prompt: "scenario three" },
];

test("buildPlan pairs five real regimes with five controls under one blinded job per scenario", () => {
  const plan = buildPlan({ scenarios: SCENARIOS, repeats: 2, backend: "cn:doubao" });
  assert.equal(plan.jobs.length, 6);
  assert.equal(new Set(plan.jobs.map((job) => job.id)).size, 6);
  for (const job of plan.jobs) {
    assert.equal(job.civs.length, 10);
    assert.ok(job.civs.every((civ) => civ.endsWith("#cn:doubao")));
    for (const pair of E1_PAIRS) {
      assert.ok(job.civs.includes(`${pair.source}#cn:doubao`));
      assert.ok(job.civs.includes(`${pair.control}#cn:doubao`));
    }
    assert.ok(job.args.includes("--anon-civs"));
    assert.ok(job.args.includes("--no-skill"));
    assert.match(job.id, /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/);
  }
});

test("executePlan enforces the estimated AFP window and persists resumable completions", async () => {
  const jobs = [0, 1, 2].map((index) => ({
    id: `job-${index}`,
    scenarioId: "s-one",
    repeat: index + 1,
  }));
  let now = 1_000;
  let state = null;
  const starts = [];
  const waits = [];
  const result = await executePlan({ jobs }, {
    statePath: "/synthetic/state.json",
    concurrency: 2,
    batchSize: 3,
    cooldownMs: 0,
    estimatedAfpPerJob: 500,
    afpLimit: 1_000,
    windowMs: 100,
    _runner: async (job) => {
      starts.push(job.id);
      return { ok: true };
    },
    _sleep: async (ms) => {
      waits.push(ms);
      now += ms;
    },
    _now: () => now,
    _readState: () => ({
      version: 1,
      completed: {},
      failures: [],
      limiter: { windowStartedAt: now, estimatedAfpUsed: 0 },
    }),
    _writeState: (_path, next) => { state = structuredClone(next); },
  });
  assert.deepEqual(starts, ["job-0", "job-1", "job-2"]);
  assert.deepEqual(waits, [100], "third job waits for the next fixed AFP window");
  assert.equal(Object.keys(state.completed).length, 3);
  assert.equal(result.failures.length, 0);
});
