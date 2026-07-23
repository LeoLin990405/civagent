// t3-scoring.test.mjs — deterministic scoring (T3) + anti-ceiling rubric tests.
// Integration runs a full tournament against fake backends (fake claude writes
// a real todo.py into its T3 workdir; fake codex returns rubric JSON); the
// sample grader runs for real (plain stdlib python3).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadTaskSpec, mixScores, runDeterministicGrading, JUDGE_RUBRIC_PROMPT } from "../engine/v5/tournament.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const SAMPLE_SPEC = path.join(PROJECT_ROOT, "resources", "tasks", "t3-todo-cli", "task.json");
const TOURNAMENT_MJS = path.join(PROJECT_ROOT, "engine", "v5", "tournament.mjs");

const rmrf = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ } };

const GOOD_TODO = `import json, os
F = "tasks.json"
def _load():
    if not os.path.exists(F): return []
    return json.load(open(F, encoding="utf8"))
def _save(t):
    json.dump(t, open(F, "w", encoding="utf8"), ensure_ascii=False)
def add_task(title):
    tasks = _load()
    tid = max([t["id"] for t in tasks], default=0) + 1
    tasks.append({"id": tid, "title": title, "done": False})
    _save(tasks)
    return tid
def list_tasks():
    return _load()
def done_task(task_id):
    tasks = _load()
    for t in tasks:
        if t["id"] == task_id:
            t["done"] = True
            _save(tasks)
            return True
    return False
def delete_task(task_id):
    tasks = _load()
    new = [t for t in tasks if t["id"] != task_id]
    if len(new) == len(tasks): return False
    _save(new)
    return True
`;

// ── loadTaskSpec ─────────────────────────────────────────────────────────────

test("loadTaskSpec loads the sample task and resolves grader.py to absolute path", () => {
  const spec = loadTaskSpec(SAMPLE_SPEC);
  assert.equal(spec.id, "t3-todo-cli");
  assert.equal(spec.type, "deterministic");
  assert.ok(spec.task.includes("todo.py"));
  assert.ok(path.isAbsolute(spec.grader.args[0]), "grader.py must resolve to an absolute path");
  assert.ok(fs.existsSync(spec.grader.args[0]));
});

test("loadTaskSpec rejects bad specs", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-t3spec-"));
  try {
    const write = (obj) => { const p = path.join(tmp, "t.json"); fs.writeFileSync(p, JSON.stringify(obj)); return p; };
    assert.throws(() => loadTaskSpec(write({ type: "deterministic", task: "x", grader: { command: "python3" } })), /id/);
    assert.throws(() => loadTaskSpec(write({ id: "x", type: "free", task: "x", grader: { command: "python3" } })), /unsupported task type/);
    assert.throws(() => loadTaskSpec(write({ id: "x", type: "deterministic", task: " ", grader: { command: "python3" } })), /task text/);
    assert.throws(() => loadTaskSpec(write({ id: "x", type: "deterministic", task: "x" })), /grader\.command/);
  } finally {
    rmrf(tmp);
  }
});

// ── mixScores ────────────────────────────────────────────────────────────────

test("mixScores blends judge and deterministic scores with both components kept", () => {
  const scores = [
    { regime: "a", score: 8 },
    { regime: "b", score: 6 },
  ];
  const det = new Map([
    ["a", { passRate: 1, error: null }],
    ["b", { passRate: 0.2, error: null }],
  ]);
  const out = mixScores(scores, det, 0.5);
  assert.equal(out[0].regime, "a");
  assert.equal(out[0].score, 9, "0.5·8 + 0.5·10 = 9");
  assert.equal(out[0].judge_score, 8);
  assert.equal(out[0].det_score, 10);
  assert.equal(out[0].mixed, true);
  assert.equal(out[1].score, 4, "0.5·6 + 0.5·2 = 4");
  // weight extremes
  assert.equal(mixScores(scores, det, 0)[0].score, 8);
  assert.equal(mixScores(scores, det, 1)[0].score, 10);
  // ungraded civ passes through with judge score and mixed=false
  const partial = mixScores(scores, new Map([["a", { passRate: 1 }]]), 0.5);
  const b = partial.find((s) => s.regime === "b");
  assert.equal(b.score, 6);
  assert.equal(b.mixed, false);
  assert.equal(b.det_score, null);
});

// ── grader execution ─────────────────────────────────────────────────────────

test("runDeterministicGrading: full pass on a correct implementation, zero on empty", () => {
  const spec = loadTaskSpec(SAMPLE_SPEC);
  const good = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-t3good-"));
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-t3empty-"));
  try {
    fs.writeFileSync(path.join(good, "todo.py"), GOOD_TODO);
    const results = runDeterministicGrading({
      spec,
      civs: [
        { regime: "china/tang", workDir: good },
        { regime: "china/qin", workDir: empty },
      ],
    });
    assert.equal(results.get("china/tang").passRate, 1);
    assert.equal(results.get("china/tang").details.passed, results.get("china/tang").details.total);
    assert.equal(results.get("china/qin").passRate, 0);
    // grading copy semantics: the ORIGINAL workdir must not gain tasks.json
    assert.ok(!fs.existsSync(path.join(good, "tasks.json")), "grader must not write into the civ workdir");
  } finally {
    rmrf(good);
    rmrf(empty);
  }
});

test("runDeterministicGrading: grader crash yields passRate null + error, not a throw", () => {
  const spec = { id: "t", type: "deterministic", task: "x", grader: { command: "false", args: [], timeoutS: 5 } };
  const wd = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-t3fail-"));
  try {
    const results = runDeterministicGrading({ spec, civs: [{ regime: "a", workDir: wd }] });
    assert.equal(results.get("a").passRate, null);
    assert.ok(results.get("a").error);
  } finally {
    rmrf(wd);
  }
});

// ── rubric anti-ceiling calibration ──────────────────────────────────────────

test("rubric prompt carries anti-ceiling calibration instructions", () => {
  assert.match(JUDGE_RUBRIC_PROMPT, /Calibrate HARD/);
  assert.match(JUDGE_RUBRIC_PROMPT, /reserve 4 for responses that clearly exceed/i);
  assert.match(JUDGE_RUBRIC_PROMPT, /challenge yourself/i);
  assert.match(JUDGE_RUBRIC_PROMPT, /NOT a 4/);
  assert.match(JUDGE_RUBRIC_PROMPT, /NON-OBVIOUS/);
});

// ── integration: full T3 tournament with fake backends ───────────────────────

function writeExe(dir, name, content) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  fs.chmodSync(p, 0o755);
}

test(
  "T3 end-to-end: workdir capture, real grading, blended manifest scores",
  { timeout: 120_000 },
  async () => {
    const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-t3bin-"));
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-t3home-"));
    try {
      // Fake claude: writes a correct todo.py into its cwd (the T3 workdir)
      // and prints a long transcript line for sediment/judge text paths.
      writeExe(fakeBin, "claude", [
        "#!/bin/sh",
        `cat > todo.py <<'PYEOF'`,
        ...GOOD_TODO.trim().split("\n"),
        "PYEOF",
        "echo fake-transcript-todo-py-CRUD-tasks-json-persistence-implemented-and-all-self-checks-passed-padding-for-minimum-transcript-length-requirement",
        "echo fake-transcript-line-two-add-list-done-delete-all-implemented-with-persistence",
        "exit 0",
      ].join("\n") + "\n");

      writeExe(fakeBin, "codex", [
        "#!/bin/sh",
        "cat <<'EOF'",
        '{"scores":[{"civilization":"china/tang","legality":3,"feasibility":3,"resilience":3,"reason":"ok"},{"civilization":"china/qin","legality":3,"feasibility":3,"resilience":3,"reason":"ok"}],"verdict":"tie"}',
        "EOF",
        "exit 0",
      ].join("\n") + "\n");
      writeExe(fakeBin, "opencode", "#!/bin/sh\necho APPROVE\nexit 0\n");
      writeExe(fakeBin, "cc-glm", "#!/bin/sh\nexit 1\n");

      const env = { ...process.env, HOME: tempHome, PATH: `${fakeBin}:${process.env.PATH}` };
      delete env.CIVAGENT_BACKEND;
      delete env.CIVAGENT_MATCH_ID;

      const { code, err } = await new Promise((resolve, reject) => {
        const proc = spawn("node", [
          TOURNAMENT_MJS,
          "--civs", "china/tang,china/qin",
          "--task-file", SAMPLE_SPEC,
        ], { env, stdio: ["ignore", "pipe", "pipe"] });
        let err = "";
        proc.stderr.on("data", (d) => { err += d; });
        proc.stdout.on("data", () => {});
        proc.on("error", reject);
        proc.on("close", (code) => resolve({ code, err }));
      });
      assert.equal(code, 0, `tournament must exit 0; stderr tail: ${err.slice(-600)}`);

      const idMatch = err.match(/\[tournament\]\s+(\S+)\s/);
      assert.ok(idMatch, "tournament id must be logged");
      const manifest = JSON.parse(
        fs.readFileSync(path.join(tempHome, ".civagent", "tournaments", idMatch[1], "manifest.json"), "utf8"),
      );

      assert.equal(manifest.judge.taskSpecId, "t3-todo-cli");
      assert.equal(manifest.judge.detWeight, 0.5);
      // workdirs captured per civ
      for (const civ of manifest.civs) {
        assert.ok(civ.workDir && civ.workDir.includes("workdir"), "civ entry must record its workdir");
      }
      // both civs wrote a correct todo.py → deterministic 10/10
      assert.equal(manifest.judge.deterministic["china/tang"].passRate, 1);
      assert.equal(manifest.judge.deterministic["china/qin"].passRate, 1);
      // judge gave 3/3/3 → 7.5; mixed = 0.5·7.5 + 0.5·10 = 8.75 → rounded 8.8
      for (const s of manifest.judge.scores) {
        assert.equal(s.judge_score, 7.5);
        assert.equal(s.det_score, 10);
        assert.equal(s.score, 8.8, `${s.regime}: mixed score wrong`);
        assert.equal(s.mixed, true);
      }
      // result.md carries the deterministic section
      const resultMd = fs.readFileSync(manifest.judge.resultPath, "utf8");
      assert.match(resultMd, /Deterministic Scores/);
    } finally {
      rmrf(fakeBin);
      rmrf(tempHome);
    }
  },
);
