// deterministic-grading.mjs — T3 task-spec loading, deterministic grading
// execution, and judge+deterministic score blending.
//
// Extracted from tournament.mjs so the grading pipeline is independently
// testable (e.g. by a headless grading harness) without pulling in the full
// tournament orchestrator.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

// Load and validate a T3 task spec (resources/tasks/<id>/task.json).
// The spec pairs a prompt with a deterministic grader script.
export function loadTaskSpec(file) {
  const spec = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!spec || typeof spec.id !== "string" || !spec.id) throw new Error("task spec needs a string id");
  if (spec.type !== "deterministic") throw new Error(`unsupported task type: ${JSON.stringify(spec.type)} (want "deterministic")`);
  if (typeof spec.task !== "string" || !spec.task.trim()) throw new Error("task spec needs non-empty task text");
  if (!spec.grader || typeof spec.grader.command !== "string" || !spec.grader.command) {
    throw new Error("task spec needs grader.command");
  }
  // Resolve grader args that point at files relative to the task file (e.g. "grader.py").
  const base = path.dirname(path.resolve(file));
  spec.grader.args = (spec.grader.args ?? []).map((a) => {
    if (path.isAbsolute(a)) return a;
    const p = path.join(base, a);
    return fs.existsSync(p) ? p : a;
  });
  return spec;
}

// Run the grader once per civ against a copy of its workdir.
// Returns Map regime → { passRate: number|null, details: object|null, error: string|null }.
export function runDeterministicGrading({ spec, civs, _spawn = spawnSync }) {
  const results = new Map();
  const timeoutS = spec.grader.timeoutS ?? 120;
  for (const civ of civs) {
    const src = civ.workDir;
    if (!src || !fs.existsSync(src)) {
      results.set(civ.regime, { passRate: null, details: null, error: "no workdir" });
      continue;
    }
    const gradingDir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-grade-"));
    try {
      fs.cpSync(src, gradingDir, { recursive: true });
      const r = _spawn(spec.grader.command, [...(spec.grader.args ?? []), gradingDir], {
        encoding: "utf8",
        timeout: timeoutS * 1000,
        cwd: gradingDir,
        env: { ...process.env },
      });
      const lastLine = String(r.stdout || "").trim().split("\n").filter(Boolean).pop() || "";
      const parsed = JSON.parse(lastLine);
      const passRate = Number(parsed.pass_rate);
      if (!Number.isFinite(passRate) || passRate < 0 || passRate > 1) throw new Error(`bad pass_rate: ${lastLine.slice(0, 100)}`);
      results.set(civ.regime, { passRate, details: parsed, error: r.status === 0 ? null : `grader exit ${r.status}` });
    } catch (e) {
      results.set(civ.regime, { passRate: null, details: null, error: String(e?.message ?? e).slice(0, 200) });
    } finally {
      fs.rmSync(gradingDir, { recursive: true, force: true });
    }
  }
  return results;
}

// Blend judge and deterministic scores: score = (1−w)·judge + w·(passRate·10).
// Manifest entries keep both components (judge_score / det_score) for audit.
export function mixScores(scores, detByRegime, detWeight = 0.5) {
  const w = Math.min(1, Math.max(0, Number(detWeight) || 0));
  return scores
    .map((s) => {
      const det = detByRegime.get(s.regime);
      if (!det || !Number.isFinite(det.passRate)) {
        return { ...s, judge_score: s.score, det_score: null, det_error: det?.error ?? "not graded", mixed: false };
      }
      const judge = s.score;
      const mixed = Math.round(((1 - w) * judge + w * det.passRate * 10) * 10) / 10;
      return {
        ...s,
        score: mixed,
        judge_score: judge,
        det_score: Math.round(det.passRate * 1000) / 100,
        mixed: true,
      };
    })
    .sort((a, b) => b.score - a.score);
}
