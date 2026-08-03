// R11 instrument tests. All events are synthetic and every process-level test
// shadows model binaries with local shell fakes; no model provider is called.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TMP_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-r11-"));
process.env.HOME = TMP_HOME;

const {
  buildPlanPrompt,
  buildPlanArgs,
  parsePlanOutput,
  officesWithIncomingEdges,
  evaluateEnforcement,
  PLAN_STATES,
} = await import("../engine/v5/dispatch-plan.mjs");
const {
  parseActor,
  reconstructRuntimeGraph,
  classifyTopologyParticipation,
  DISPATCH_OBSERVABILITY,
} = await import("../engine/v5/runtime-graph.mjs");
const {
  extractDispatchPlan,
  compareDispatchPlanToTopology,
} = await import("../engine/v5/plan-diff.mjs");
const { civSpawnSpec } = await import("../engine/v5/tournament.mjs");
const { readMatchText, selectTranscript } = await import("../engine/v5/events.mjs");
const { cleanTranscript } = await import("../engine/v5/skill-sediment.mjs");

after(() => fs.rmSync(TMP_HOME, { recursive: true, force: true }));

test("R11 plan prompt, parser, and same-session argument contract reject induced or ambiguous data", () => {
  const prompt = buildPlanPrompt({
    task: "handle a flood",
    offices: ["draft", "review"],
  });
  assert.match(prompt, /Choosing zero offices is valid/);
  assert.match(prompt, /Do not add offices merely to fill the plan/);
  for (const forbidden of ["must use all", "comprehensive", "best practice", "thorough"]) {
    assert.equal(prompt.toLowerCase().includes(forbidden), false);
  }

  const args = buildPlanArgs({
    agentsJson: "{}",
    prompt,
    sessionId: "00000000-0000-4000-8000-000000000001",
  });
  assert.deepEqual(args.slice(0, 4), ["--agents", "{}", "--tools", ""]);
  assert.ok(args.includes("--session-id"));

  const wrap = (json) =>
    `noise\n[CIVAGENT_DISPATCH_PLAN]\n${json}\n[/CIVAGENT_DISPATCH_PLAN]\n`;
  assert.deepEqual(
    parsePlanOutput(wrap('{"dispatches":[]}'), ["draft", "review"]),
    { status: PLAN_STATES.PARSED_EMPTY, dispatches: [], error: null },
  );
  const nonempty = parsePlanOutput(
    wrap('{"dispatches":[{"office":"review","order":1,"responsibility":"audit"}]}'),
    ["draft", "review"],
  );
  assert.equal(nonempty.status, PLAN_STATES.PARSED_NONEMPTY);
  assert.equal(nonempty.dispatches[0].office, "review");

  const failures = [
    "",
    wrap("{bad json}"),
    wrap('{"dispatches":[{"office":"missing","order":1,"responsibility":"x"}]}'),
    wrap('{"dispatches":[{"office":"draft","order":2,"responsibility":"x"}]}'),
    wrap('{"dispatches":[{"office":"draft","order":1,"responsibility":""}]}'),
    `${wrap('{"dispatches":[]}')}[CIVAGENT_DISPATCH_PLAN]{}[/CIVAGENT_DISPATCH_PLAN]`,
  ];
  for (const value of failures) {
    const parsed = parsePlanOutput(value, ["draft", "review"]);
    assert.equal(parsed.status, PLAN_STATES.PARSE_FAILED);
    assert.equal(parsed.dispatches, null, "parse failure must not become an empty plan");
  }
});

test("R11 participation is tri-state evidence, never a fabricated topology-exercise ratio", () => {
  const empty = reconstructRuntimeGraph([]);
  assert.equal(empty.topology_participation.status, "unknown");
  assert.equal("exerciseRatio" in empty.topology_participation, false);

  const legacyComplete = reconstructRuntimeGraph([
    { type: "match_start", seq: 0, actor: "china/tang", span_id: "root", parent_span_id: null },
    { type: "turn", seq: 1, actor: "china/tang", span_id: "turn", parent_span_id: "missing", text: "solo" },
    { type: "match_end", seq: 2, actor: "system", span_id: "end", parent_span_id: "root" },
  ]);
  assert.equal(legacyComplete.topology_participation.status, "unknown");
  assert.equal(legacyComplete.orphan_spans.length, 1);

  const instrumentedNoDispatch = reconstructRuntimeGraph([
    {
      type: "match_start",
      seq: 0,
      actor: "china/tang",
      dispatch_observability: DISPATCH_OBSERVABILITY,
    },
    { type: "turn", seq: 1, actor: "china/tang", text: "solo" },
    { type: "match_end", seq: 2, actor: "system" },
  ]);
  assert.equal(instrumentedNoDispatch.topology_participation.status, "not_observed");

  const incomplete = reconstructRuntimeGraph([
    {
      type: "match_start",
      seq: 0,
      actor: "china/tang",
      dispatch_observability: DISPATCH_OBSERVABILITY,
    },
    { type: "turn", seq: 1, actor: "china/tang", text: "solo" },
  ]);
  assert.equal(incomplete.topology_participation.status, "unknown");

  const positive = reconstructRuntimeGraph([
    { type: "match_start", seq: 0, actor: "china/tang" },
    { type: "turn", seq: 3, actor: "china/tang#menxia#review", text: "audited" },
    { type: "turn", seq: 2, actor: "china/tang", text: "[→ menxia] audit" },
  ]);
  assert.equal(positive.topology_participation.status, "participation_observed");
  assert.equal(positive.topology_participation.dispatchCount, 1);
  assert.equal(positive.topology_participation.officeTurnCount, 1);
  assert.deepEqual(positive.topology_participation.officesInvoked, ["menxia", "menxia#review"]);
  assert.deepEqual(parseActor("china/tang#menxia#review"), {
    regime: "china/tang",
    office: "menxia#review",
    raw: "china/tang#menxia#review",
  });

  const direct = classifyTopologyParticipation({
    dispatchCount: 1,
    officesInvoked: ["review"],
  });
  assert.equal(direct.status, "participation_observed");
  assert.match(direct.reason, /dispatch token/);

  const matchId = "r11-participation-cli";
  const matchDir = path.join(TMP_HOME, ".civagent", "matches", matchId);
  fs.mkdirSync(matchDir, { recursive: true });
  fs.writeFileSync(
    path.join(matchDir, "events.jsonl"),
    [
      {
        type: "match_start",
        seq: 0,
        actor: "china/tang",
        dispatch_observability: DISPATCH_OBSERVABILITY,
      },
      { type: "match_end", seq: 1, actor: "system" },
    ].map((event) => JSON.stringify(event)).join("\n") + "\n",
  );
  const cli = spawnSync(process.execPath, [
    path.join(ROOT, "engine/v5/runtime-graph.mjs"),
    matchId,
  ], { encoding: "utf8", env: { ...process.env, HOME: TMP_HOME } });
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /Office participation: not_observed/);
});

test("R11 enforcement is symmetric by topology arm and records failure once without retries", () => {
  const source = {
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    edges: [{ from: "a", to: "b" }, { from: "b", to: "c" }],
  };
  const rewired = {
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    edges: [{ from: "c", to: "a" }, { from: "a", to: "b" }],
  };
  assert.deepEqual(officesWithIncomingEdges(source), ["b", "c"]);
  assert.deepEqual(officesWithIncomingEdges(rewired), ["a", "b"]);

  const failed = evaluateEnforcement({
    requested: true,
    requiredOffices: officesWithIncomingEdges(source),
    dispatchedOffices: ["b", "b"],
  });
  assert.equal(failed.status, "enforcement_failed");
  assert.deepEqual(failed.missingOffices, ["c"]);
  assert.equal(failed.attempts, 1);

  const passed = evaluateEnforcement({
    requested: true,
    requiredOffices: officesWithIncomingEdges(rewired),
    dispatchedOffices: ["b", "a"],
  });
  assert.equal(passed.status, "enforcement_passed");
  assert.equal(passed.attempts, 1);

  const off = evaluateEnforcement({ requested: false, dispatchedOffices: ["a"] });
  assert.equal(off.status, "not_requested");
  assert.equal(off.attempts, 0);
});

test("R11 plan diff reports only supported node-set facts and explicit unsupported edge dimensions", () => {
  const topology = {
    nodes: [{ id: "draft" }, { id: "review" }, { id: "execute" }],
    edges: [
      { from: "draft", to: "review", kind: "command" },
      { from: "review", to: "draft", kind: "veto" },
    ],
  };
  const events = [
    { type: "turn", seq: 3, actor: "x", text: "[→ execute] real dispatch" },
    {
      type: "turn",
      seq: 1,
      phase: "dispatch_plan",
      dispatch_plan_status: "parsed_nonempty",
      dispatch_plan: [
        { office: "review", order: 1, responsibility: "audit" },
        { office: "review", order: 2, responsibility: "re-audit" },
      ],
      text: "plan",
    },
  ];
  const record = extractDispatchPlan(events);
  const compared = compareDispatchPlanToTopology(record, topology);
  assert.equal(compared.comparison_available, true);
  assert.deepEqual(compared.planned_sequence, ["review", "review"]);
  assert.deepEqual(compared.declared_not_planned_offices, ["draft", "execute"]);
  assert.deepEqual(compared.duplicate_planned_offices, [{ office: "review", count: 2 }]);
  assert.match(compared.unsupported_dimensions.directed_edge_alignment, /not an office-to-office/);
  assert.equal("deviation_score" in compared, false);
  assert.equal("coverage_ratio" in compared, false);

  const none = compareDispatchPlanToTopology(extractDispatchPlan([]), topology);
  assert.equal(none.comparison_available, false);
  assert.equal(none.planned_sequence, null);

  const emptyPlan = compareDispatchPlanToTopology(extractDispatchPlan([{
    type: "turn",
    phase: "dispatch_plan",
    dispatch_plan_status: "parsed_empty",
    dispatch_plan: [],
  }]), topology);
  assert.equal(emptyPlan.comparison_available, true);
  assert.deepEqual(emptyPlan.planned_sequence, []);
  assert.deepEqual(emptyPlan.declared_not_planned_offices, ["draft", "review", "execute"]);

  const ambiguous = extractDispatchPlan([
    { type: "turn", phase: "dispatch_plan" },
    { type: "turn", phase: "dispatch_plan" },
  ]);
  assert.equal(ambiguous.status, "parse_failed");

  const matchId = "r11-plan-diff-cli";
  const matchDir = path.join(TMP_HOME, ".civagent", "matches", matchId);
  fs.mkdirSync(matchDir, { recursive: true });
  fs.writeFileSync(path.join(matchDir, "meta.json"), JSON.stringify({
    matchId,
    regime: "china/tang",
  }));
  fs.writeFileSync(
    path.join(matchDir, "events.jsonl"),
    events.map((event) => JSON.stringify(event)).join("\n") + "\n",
  );
  const cli = spawnSync(process.execPath, [
    path.join(ROOT, "engine/v5/runtime-graph.mjs"),
    matchId,
    "--diff",
    "--json",
  ], { encoding: "utf8", env: { ...process.env, HOME: TMP_HOME } });
  assert.equal(cli.status, 0, cli.stderr);
  const cliOutput = JSON.parse(cli.stdout);
  assert.equal(cliOutput.plan_diff.comparison_available, true);
  assert.deepEqual(cliOutput.plan_diff.planned_sequence, ["review", "review"]);
});

function writeExecutable(dir, name, body) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, body);
  fs.chmodSync(file, 0o755);
}

function spawnCollect(command, args, env, timeoutMs = 45_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`timeout: ${command}`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

function makeFakeEnvironment(home) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-r11-bin-"));
  const calls = path.join(home, "backend-calls.log");
  writeExecutable(bin, "claude", `#!/bin/sh
printf 'CALL\\n' >> "$CIVAGENT_TEST_CALLS"
printf '%s\\n' "$@" >> "$CIVAGENT_TEST_CALLS"
for arg in "$@"; do
  if [ "$arg" = "--tools" ]; then
    printf '%s\\n' '${"[CIVAGENT_DISPATCH_PLAN]"}'
    printf '%s\\n' '{"dispatches":[{"office":"zhongshu","order":1,"responsibility":"draft"}]}'
    printf '%s\\n' '${"[/CIVAGENT_DISPATCH_PLAN]"}'
    exit 0
  fi
done
printf '%s\\n' '{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tool-1","input":{"subagent_type":"zhongshu","description":"draft"}}]}}'
printf '%s\\n' '{"type":"assistant","parent_tool_use_id":"tool-1","message":{"content":[{"type":"text","text":"office output"}]}}'
exit 0
`);
  writeExecutable(bin, "codex", `#!/bin/sh
printf '%s\\n' '| Rank | Civilization | Score /10 | Reason |'
printf '%s\\n' '|---|---|---|---|'
printf '%s\\n' '| 1 | china/tang | 8 | ok |'
printf '%s\\n' '| 2 | china/qin | 7 | ok |'
printf '%s\\n' '## Verdict'
printf '%s\\n' 'fake'
exit 0
`);
  for (const name of [
    "opencode", "cc-glm", "cc-doubao", "cc-qwen", "cc-kimi",
    "cc-stepfun", "cc-minimax", "cc-mimo",
  ]) writeExecutable(bin, name, "#!/bin/sh\nexit 1\n");
  const env = {
    ...process.env,
    HOME: home,
    PATH: `${bin}:${process.env.PATH}`,
    CIVAGENT_TEST_CALLS: calls,
    CIVAGENT_JUDGE_CHAIN: "codex",
    CIVAGENT_JUDGE_SWAP: "0",
  };
  return { bin, calls, env };
}

test("R11 run-v5 wiring records plan before enforcement, resumes one session, and never retries a failed roster", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-r11-run-"));
  const fake = makeFakeEnvironment(home);
  const matchId = "r11-wiring-direct";
  try {
    const result = await spawnCollect(process.execPath, [
      path.join(ROOT, "engine/v5/run-v5.mjs"),
      "--backend", "native",
      "--no-skill",
      "--enforce-dispatch",
      "china/tang",
      "test task",
    ], { ...fake.env, CIVAGENT_MATCH_ID: matchId });
    assert.equal(result.code, 0, result.stderr);

    const calls = fs.readFileSync(fake.calls, "utf8");
    assert.equal((calls.match(/^CALL$/gm) || []).length, 2, "exactly plan + execution; no retry");
    const [planCall, executionCall] = calls.split("CALL\n").filter(Boolean);
    assert.match(planCall, /--tools\n\n/);
    assert.match(planCall, /--session-id/);
    assert.doesNotMatch(planCall, /EXPERIMENTAL DISPATCH REQUIREMENT/);

    // The plan prompt's content is B's entire measurement, so it has to be
    // pinned where it is actually SENT, not only where it is built. Replacing
    // planPrompt with a literal string left all 472 tests green: buildPlanPrompt's
    // wording was asserted in isolation while nothing checked that the wording
    // reached the model. Under that hole the coordinator could be asked nothing
    // at all — or asked a leading question — and E2 would still collect
    // "voluntary adoption" numbers generated from it.
    assert.match(planCall, /which available offices, if any, you would choose to call/,
      "the plan call must actually ask the adoption question");
    assert.match(planCall, /Choosing zero offices is valid/,
      "the non-inducement wording must reach the model, not just the builder's unit test");
    assert.match(planCall, /Do not add offices merely to fill the plan/);
    assert.match(planCall, /- zhongshu/, "the office roster must be present in the sent prompt");
    // A leading instruction would silently contaminate B; there is no test that
    // can catch every phrasing, but the one failure mode worth naming is an
    // explicit demand to use them all.
    assert.doesNotMatch(planCall, /must (call|use) (all|every)/i,
      "the plan question must not demand full participation");
    assert.match(executionCall, /--resume/);
    assert.match(executionCall, /EXPERIMENTAL DISPATCH REQUIREMENT/);

    const dir = path.join(home, ".civagent", "matches", matchId);
    const events = fs.readFileSync(path.join(dir, "events.jsonl"), "utf8")
      .trim().split("\n").map((line) => JSON.parse(line));
    const planIndex = events.findIndex((event) => event.phase === "dispatch_plan");
    const dispatchIndex = events.findIndex((event) => /\[→ zhongshu\]/.test(event.text || ""));
    assert.ok(planIndex > 0 && dispatchIndex > planIndex);
    assert.equal(events.filter((event) => event.phase === "dispatch_plan").length, 1);

    const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
    assert.equal(meta.dispatchPlan.status, "parsed_nonempty");
    assert.equal(meta.dispatchEnforcement.status, "enforcement_failed");
    assert.equal(meta.dispatchEnforcement.attempts, 1);
    assert.ok(meta.dispatchEnforcement.missingOffices.length > 0);
    assert.equal(meta.topologyParticipation.status, "participation_observed");
  } finally {
    fs.rmSync(fake.bin, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("R11 tournament CLI propagates enforcement into real child specs and manifest fields", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-r11-tournament-"));
  const fake = makeFakeEnvironment(home);
  const tournamentId = "r11-wiring-tournament";
  try {
    const pureSpec = civSpawnSpec({
      regime: "china/tang",
      backend: "native",
      matchId: `${tournamentId}__china-tang`,
      enforceDispatch: true,
    });
    assert.equal(pureSpec.env.CIVAGENT_ENFORCE_DISPATCH, "1");
    const offSpec = civSpawnSpec({
      regime: "china/tang",
      backend: "native",
      matchId: "off",
    });
    assert.equal("CIVAGENT_ENFORCE_DISPATCH" in offSpec.env, false);

    const result = await spawnCollect(process.execPath, [
      path.join(ROOT, "engine/v5/tournament.mjs"),
      "--civs", "china/tang,china/qin",
      "--id", tournamentId,
      "--no-skill",
      "--enforce-dispatch",
      "test task",
    ], fake.env);
    assert.equal(result.code, 0, result.stderr);
    const manifest = JSON.parse(fs.readFileSync(
      path.join(home, ".civagent", "tournaments", tournamentId, "manifest.json"),
      "utf8",
    ));
    assert.equal(manifest.civs.length, 2);
    for (const civ of manifest.civs) {
      assert.notEqual(civ.dispatchEnforcement.status, "not_requested");
      assert.equal(civ.dispatchEnforcement.attempts, 1);
      assert.equal(civ.topologyParticipation.status, "participation_observed");
      assert.equal(typeof civ.aEligible, "boolean");
      assert.ok(civ.dispatchPlan);
    }
  } finally {
    fs.rmSync(fake.bin, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("R11 plan events remain observable but cannot contaminate judge or skill transcripts", () => {
  const matchId = "r11-plan-exclusion";
  const dir = path.join(TMP_HOME, ".civagent", "matches", matchId);
  fs.mkdirSync(dir, { recursive: true });
  const plan = {
    type: "turn",
    seq: 0,
    actor: "china/tang",
    phase: "dispatch_plan",
    text: "PLAN_SECRET [→ fake-office]\n",
  };
  const execution = {
    type: "turn",
    seq: 1,
    actor: "china/tang",
    text: "EXECUTION_ONLY\n",
  };
  fs.writeFileSync(
    path.join(dir, "events.jsonl"),
    `${JSON.stringify(plan)}\n${JSON.stringify(execution)}\n`,
  );
  assert.equal(readMatchText(matchId), "EXECUTION_ONLY\n");
  assert.doesNotMatch(selectTranscript(matchId).text, /PLAN_SECRET|fake-office/);
  assert.equal(
    cleanTranscript(`${JSON.stringify(plan)}\n${JSON.stringify(execution)}\n`),
    "EXECUTION_ONLY\n",
  );
  const runtime = reconstructRuntimeGraph([plan, execution]);
  assert.equal(runtime.observed.dispatch_sequence.length, 0);
});
