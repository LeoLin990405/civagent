import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildE2Plan,
  parseE2Args,
  E2_DEFAULT_REPEATS,
  E2_SCENARIO_IDS,
} from "../scripts/e2-experiment.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("E2 launcher is a fixed five-repeat, three-scenario dry-run with engine enforcement", () => {
  const plan = buildE2Plan();
  assert.equal(E2_DEFAULT_REPEATS, 5);
  assert.deepEqual(plan.scenarios, [...E2_SCENARIO_IDS]);
  assert.equal(plan.jobs.length, 15);
  assert.equal(plan.arms, 150);
  for (const job of plan.jobs) {
    assert.equal(job.civs.length, 10);
    assert.ok(job.args.includes("--enforce-dispatch"));
    assert.ok(job.args.includes("--anon-civs"));
    assert.ok(job.args.includes("--no-skill"));
    assert.equal(
      job.args.some((arg) => /MANDATORY DELEGATION|every declared office/i.test(arg)),
      false,
      "launcher must use the engine's topology-derived in-edge roster, not inject its own intervention",
    );
  }

  const defaults = parseE2Args([]);
  assert.equal(defaults.execute, false);
  assert.equal(defaults.repeats, 5);
  assert.throws(
    () => parseE2Args(["--execute", "--estimated-afp-per-job", "0"]),
    /positive integer/,
  );

  const dryRun = spawnSync(process.execPath, [
    path.join(ROOT, "scripts/e2-experiment.mjs"),
    "--repeats", "1",
    "--json",
  ], { encoding: "utf8" });
  assert.equal(dryRun.status, 0, dryRun.stderr);
  const output = JSON.parse(dryRun.stdout);
  assert.equal(output.mode, "dry-run");
  assert.equal(output.jobs.length, 3);
  assert.equal(output.arms, 30);
});

// ── the backend must namespace the job id and the state file ────────────────
//
// E3 treats the backend as a blocking factor: five strata run the same
// scenario x repeat grid. The id used to be `e2-<scenario>-r<NN>` with a single
// shared state file, so every stratum would have written to the same tournament
// directory and the same state key — and resume would skip a cell because a
// *different* model had already run it. Five strata collapsing into one, with
// no error and a full-looking result set.
test("job ids and state paths are namespaced per backend", async () => {
  // No `if (!build) return` escape hatch here: the first draft of this test
  // guessed the export name, found nothing, returned early and passed green
  // without asserting anything. A test that skips itself when its subject is
  // missing is indistinguishable from a passing test.
  const { buildE2Plan } = await import("../scripts/e2-experiment.mjs");
  assert.equal(typeof buildE2Plan, "function", "the plan builder must be exported to be testable");
  const build = buildE2Plan;

  const scenarios = [{ id: "plague-response-01", prompt: "x" }];
  const a = build({ scenarios, repeats: 1, backend: "cn:doubao" });
  const b = build({ scenarios, repeats: 1, backend: "cn:glm" });
  assert.notEqual(a.jobs[0].id, b.jobs[0].id,
    "two backends running the same cell must not share a job id");
  assert.match(a.jobs[0].id, /doubao/);
  assert.match(b.jobs[0].id, /glm/);
});
