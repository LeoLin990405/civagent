#!/usr/bin/env node
// Reproducible launcher for the E1 real-topology vs random-wiring control arm.
// The default is a read-only dry run. Model-bearing tournaments are spawned
// only with --execute and an operator-supplied AFP estimate.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..");
const TOURNAMENT = path.join(PROJECT_ROOT, "engine", "v5", "tournament.mjs");
const SCENARIO_FILE = path.join(PROJECT_ROOT, "engine", "prompts", "governance-scenarios.json");

export const E1_PAIRS = Object.freeze([
  { source: "china/qin", control: "_baseline/qin-random" },
  { source: "china/tang", control: "_baseline/tang-random" },
  { source: "global/athens", control: "_baseline/athens-random" },
  { source: "china/zhou", control: "_baseline/zhou-random" },
  { source: "china/ming", control: "_baseline/ming-random" },
]);

export const DEFAULT_SCENARIO_IDS = Object.freeze([
  "plague-response-01",
  "regional-militarization-01",
  "border-city-autonomy-01",
]);

function positiveInteger(value, label, { allowZero = false } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < (allowZero ? 0 : 1)) {
    throw new Error(`${label} must be ${allowZero ? "a non-negative" : "a positive"} integer`);
  }
  return n;
}

export function loadScenarios(ids = DEFAULT_SCENARIO_IDS, file = SCENARIO_FILE) {
  const wanted = new Set(ids);
  const all = JSON.parse(fs.readFileSync(file, "utf8"));
  const found = all.filter((scenario) => wanted.has(scenario.id));
  const missing = ids.filter((id) => !found.some((scenario) => scenario.id === id));
  if (missing.length) throw new Error(`unknown scenario id(s): ${missing.join(", ")}`);
  return ids.map((id) => found.find((scenario) => scenario.id === id));
}

function rotate(values, offset) {
  const shift = offset % values.length;
  return [...values.slice(shift), ...values.slice(0, shift)];
}

export function buildPlan({
  scenarios = loadScenarios(),
  repeats = 1,
  backend = "cn:doubao",
} = {}) {
  positiveInteger(repeats, "repeats");
  if (!backend) throw new Error("backend must not be empty");

  const baseCivs = E1_PAIRS.flatMap(({ source, control }) => [source, control]);
  const jobs = [];
  for (let repeat = 1; repeat <= repeats; repeat += 1) {
    // Rotate presentation order between repeats. tournament.mjs also runs the
    // reversed order, so every job remains order-swapped and anonymized.
    const regimes = rotate(baseCivs, repeat - 1);
    for (const scenario of scenarios) {
      const id = `e1c-${scenario.id}-r${String(repeat).padStart(2, "0")}`;
      const civs = regimes.map((regime) => `${regime}#${backend}`);
      jobs.push({
        id,
        scenarioId: scenario.id,
        repeat,
        backend,
        pairs: E1_PAIRS,
        civs,
        command: process.execPath,
        args: [
          TOURNAMENT,
          "--civs", civs.join(","),
          "--id", id,
          "--anon-civs",
          "--no-skill",
          scenario.prompt,
        ],
      });
    }
  }
  return {
    version: 1,
    generatedFrom: path.relative(PROJECT_ROOT, SCENARIO_FILE),
    scenarios: scenarios.map(({ id }) => id),
    repeats,
    backend,
    jobs,
  };
}

function emptyState(now) {
  return {
    version: 1,
    completed: {},
    failures: [],
    limiter: {
      windowStartedAt: now,
      estimatedAfpUsed: 0,
    },
  };
}

function readState(statePath, now) {
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return parsed?.version === 1 ? parsed : emptyState(now);
  } catch {
    return emptyState(now);
  }
}

function writeState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  const temp = `${statePath}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(temp, statePath);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnJob(job) {
  return new Promise((resolve) => {
    const child = spawn(job.command, job.args, {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", (error) => resolve({ ok: false, error: error.message }));
    child.on("close", (code, signal) => resolve({
      ok: code === 0,
      code,
      signal,
      error: code === 0 ? null : `exit=${code}${signal ? ` signal=${signal}` : ""}`,
    }));
  });
}

async function runPool(jobs, concurrency, runner) {
  const results = new Array(jobs.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (next < jobs.length) {
      const index = next;
      next += 1;
      results[index] = await runner(jobs[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function executePlan(plan, {
  statePath,
  concurrency = 1,
  batchSize = 1,
  cooldownMs = 0,
  estimatedAfpPerJob,
  afpLimit = 10_000,
  windowMs = 5 * 60 * 60 * 1000,
  _runner = spawnJob,
  _sleep = sleep,
  _now = Date.now,
  _readState = readState,
  _writeState = writeState,
} = {}) {
  concurrency = positiveInteger(concurrency, "concurrency");
  batchSize = positiveInteger(batchSize, "batch-size");
  cooldownMs = positiveInteger(cooldownMs, "cooldown-ms", { allowZero: true });
  estimatedAfpPerJob = positiveInteger(estimatedAfpPerJob, "estimated-afp-per-job");
  afpLimit = positiveInteger(afpLimit, "afp-limit");
  windowMs = positiveInteger(windowMs, "window-ms");
  if (estimatedAfpPerJob > afpLimit) {
    throw new Error("estimated-afp-per-job exceeds the whole AFP window limit");
  }
  if (!statePath) throw new Error("statePath is required in execute mode");

  const state = _readState(statePath, _now());
  const initiallyCompleted = plan.jobs.filter((job) => state.completed[job.id]).length;
  const pending = plan.jobs.filter((job) => !state.completed[job.id]);
  const failures = [];

  while (pending.length) {
    const now = _now();
    if (now - state.limiter.windowStartedAt >= windowMs) {
      state.limiter = { windowStartedAt: now, estimatedAfpUsed: 0 };
      _writeState(statePath, state);
    }

    const remainingAfp = afpLimit - state.limiter.estimatedAfpUsed;
    const jobsAllowed = Math.floor(remainingAfp / estimatedAfpPerJob);
    if (jobsAllowed < 1) {
      await _sleep(Math.max(0, state.limiter.windowStartedAt + windowMs - now));
      continue;
    }

    const count = Math.min(batchSize, jobsAllowed, pending.length);
    const batch = pending.splice(0, count);
    // Reserve the operator-provided estimate before spawning. If the process is
    // interrupted, resume is conservative: the reservation remains charged.
    state.limiter.estimatedAfpUsed += count * estimatedAfpPerJob;
    _writeState(statePath, state);

    const results = await runPool(batch, concurrency, _runner);
    results.forEach((result, index) => {
      const job = batch[index];
      if (result.ok) {
        state.completed[job.id] = {
          finishedAt: _now(),
          scenarioId: job.scenarioId,
          repeat: job.repeat,
        };
      } else {
        const failure = { jobId: job.id, at: _now(), error: result.error ?? "unknown failure" };
        state.failures.push(failure);
        failures.push(failure);
      }
    });
    _writeState(statePath, state);
    if (pending.length && cooldownMs > 0) await _sleep(cooldownMs);
  }

  return {
    planned: plan.jobs.length,
    skippedCompleted: initiallyCompleted,
    completed: Object.keys(state.completed).length,
    failures,
    statePath,
  };
}

function parseArgs(argv) {
  const options = {
    repeats: 1,
    backend: "cn:doubao",
    scenarioIds: [...DEFAULT_SCENARIO_IDS],
    concurrency: 1,
    batchSize: 1,
    cooldownMs: 0,
    afpLimit: 10_000,
    windowMs: 5 * 60 * 60 * 1000,
    statePath: path.join(os.homedir(), ".civagent", "experiments", "e1-control-state.json"),
    execute: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      if (!argv[i + 1]) throw new Error(`${arg} requires a value`);
      return argv[++i];
    };
    if (arg === "--execute") options.execute = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--repeats") options.repeats = positiveInteger(value(), "repeats");
    else if (arg === "--backend") options.backend = value();
    else if (arg === "--scenarios") options.scenarioIds = value().split(",").filter(Boolean);
    else if (arg === "--concurrency") options.concurrency = positiveInteger(value(), "concurrency");
    else if (arg === "--batch-size") options.batchSize = positiveInteger(value(), "batch-size");
    else if (arg === "--cooldown-ms") options.cooldownMs = positiveInteger(value(), "cooldown-ms", { allowZero: true });
    else if (arg === "--estimated-afp-per-job") options.estimatedAfpPerJob = positiveInteger(value(), "estimated-afp-per-job");
    else if (arg === "--afp-limit") options.afpLimit = positiveInteger(value(), "afp-limit");
    else if (arg === "--window-ms") options.windowMs = positiveInteger(value(), "window-ms");
    else if (arg === "--state") options.statePath = path.resolve(value());
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const scenarios = loadScenarios(options.scenarioIds);
  const plan = buildPlan({ scenarios, repeats: options.repeats, backend: options.backend });

  if (!options.execute) {
    if (options.json) console.log(JSON.stringify({ mode: "dry-run", ...plan }, null, 2));
    else {
      console.log(`DRY RUN: ${plan.jobs.length} tournament job(s); no files written and no models called.`);
      for (const job of plan.jobs) {
        console.log(`${job.id}: ${job.civs.length} civs, scenario=${job.scenarioId}, repeat=${job.repeat}`);
      }
      console.log("Use --execute only after supplying --estimated-afp-per-job from provider telemetry.");
    }
    return;
  }
  if (!options.estimatedAfpPerJob) {
    throw new Error("--execute requires --estimated-afp-per-job; CivAgent does not measure AFP itself");
  }
  console.error(
    `Executing ${plan.jobs.length} job(s). AFP limiting uses the supplied estimate, not measured provider usage.`,
  );
  const result = await executePlan(plan, options);
  console.log(JSON.stringify(result, null, 2));
  if (result.failures.length) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`e1-control-experiment: ${error.message}`);
    process.exitCode = 1;
  });
}
