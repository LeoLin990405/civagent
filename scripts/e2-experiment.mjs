#!/usr/bin/env node
// E2 launcher. Dry-run is the default; --execute and an operator-supplied AFP
// estimate are both required before any tournament process can be spawned.

import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  E1_PAIRS,
  DEFAULT_SCENARIO_IDS,
  loadScenarios,
  executePlan,
} from "./e1-control-experiment.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TOURNAMENT = path.join(ROOT, "engine", "v5", "tournament.mjs");

export const E2_PAIRS = E1_PAIRS;
export const E2_SCENARIO_IDS = DEFAULT_SCENARIO_IDS;
export const E2_DEFAULT_REPEATS = 5;

function positiveInteger(value, label, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < (allowZero ? 0 : 1)) {
    throw new Error(`${label} must be ${allowZero ? "a non-negative" : "a positive"} integer`);
  }
  return number;
}

function rotate(values, offset) {
  const shift = offset % values.length;
  return [...values.slice(shift), ...values.slice(0, shift)];
}

export function buildE2Plan({
  scenarios = loadScenarios(E2_SCENARIO_IDS),
  repeats = E2_DEFAULT_REPEATS,
  backend = "cn:doubao",
} = {}) {
  positiveInteger(repeats, "repeats");
  if (!backend) throw new Error("backend must not be empty");
  const baseRegimes = E2_PAIRS.flatMap(({ source, control }) => [source, control]);
  const jobs = [];
  for (let repeat = 1; repeat <= repeats; repeat += 1) {
    const regimes = rotate(baseRegimes, repeat - 1);
    for (const scenario of scenarios) {
      const id = `e2-${scenario.id}-r${String(repeat).padStart(2, "0")}`;
      const civs = regimes.map((regime) => `${regime}#${backend}`);
      jobs.push({
        id,
        scenarioId: scenario.id,
        repeat,
        backend,
        pairs: E2_PAIRS,
        civs,
        command: process.execPath,
        args: [
          TOURNAMENT,
          "--civs", civs.join(","),
          "--id", id,
          "--anon-civs",
          "--no-skill",
          "--enforce-dispatch",
          scenario.prompt,
        ],
      });
    }
  }
  return {
    version: 1,
    experiment: "E2",
    design: "pre-enforcement voluntary plan + topology-derived roster enforcement",
    scenarios: scenarios.map(({ id }) => id),
    repeats,
    backend,
    arms: jobs.length * baseRegimes.length,
    jobs,
  };
}

export function parseE2Args(argv) {
  const options = {
    repeats: E2_DEFAULT_REPEATS,
    backend: "cn:doubao",
    scenarioIds: [...E2_SCENARIO_IDS],
    concurrency: 1,
    batchSize: 1,
    cooldownMs: 0,
    afpLimit: 10_000,
    windowMs: 5 * 60 * 60 * 1000,
    statePath: path.join(os.homedir(), ".civagent", "experiments", "e2-state.json"),
    execute: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      if (argv[i + 1] == null) throw new Error(`${arg} requires a value`);
      return argv[++i];
    };
    if (arg === "--execute") options.execute = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--repeats") options.repeats = positiveInteger(value(), "repeats");
    else if (arg === "--backend") options.backend = value();
    else if (arg === "--scenarios") {
      options.scenarioIds = value().split(",").map((id) => id.trim()).filter(Boolean);
    } else if (arg === "--concurrency") options.concurrency = positiveInteger(value(), "concurrency");
    else if (arg === "--batch-size") options.batchSize = positiveInteger(value(), "batch-size");
    else if (arg === "--cooldown-ms") {
      options.cooldownMs = positiveInteger(value(), "cooldown-ms", { allowZero: true });
    } else if (arg === "--estimated-afp-per-job") {
      options.estimatedAfpPerJob = positiveInteger(value(), "estimated-afp-per-job");
    } else if (arg === "--afp-limit") options.afpLimit = positiveInteger(value(), "afp-limit");
    else if (arg === "--window-ms") options.windowMs = positiveInteger(value(), "window-ms");
    else if (arg === "--state") options.statePath = path.resolve(value());
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseE2Args(process.argv.slice(2));
  const plan = buildE2Plan({
    scenarios: loadScenarios(options.scenarioIds),
    repeats: options.repeats,
    backend: options.backend,
  });
  if (!options.execute) {
    if (options.json) {
      console.log(JSON.stringify({ mode: "dry-run", ...plan }, null, 2));
    } else {
      console.log(
        `DRY RUN: ${plan.jobs.length} tournament jobs / ${plan.arms} arms; ` +
        "no files written and no models called.",
      );
      for (const job of plan.jobs) {
        console.log(`${job.id}: ${job.civs.length} arms; scenario=${job.scenarioId}; repeat=${job.repeat}`);
      }
      console.log("Execution requires both --execute and --estimated-afp-per-job.");
    }
    return;
  }
  if (!options.estimatedAfpPerJob) {
    throw new Error("--execute requires --estimated-afp-per-job from provider telemetry");
  }
  const result = await executePlan(plan, options);
  console.log(JSON.stringify(result, null, 2));
  if (result.failures.length) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`e2-experiment: ${error.message}`);
    process.exitCode = 1;
  });
}
