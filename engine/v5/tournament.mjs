#!/usr/bin/env node
// tournament.mjs — run one governance task against N civilizations in parallel,
// collect each civ's event stream, and have a judge rank the outcomes.
//
// Concurrency: each civ is launched as its own `run-v5.mjs` process with an
// explicitly-passed regime, backend, and match id. There is NO shared mutable
// "active regime" state, so parallel civs cannot clobber each other.
//
// Civ syntax: "region/regime-id" or "region/regime-id#backend"
//   e.g. --civs china/tang,china/qin#cn:doubao,global/athens#cn:glm

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateRegime } from "./civ-memory.mjs";
import { runJudge } from "./judge.mjs";
import { readMatchText, eventsPath, EventLog, hashShort, newSpanId } from "./events.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const RUN_V5 = path.join(__dirname, "run-v5.mjs");
const TOURNAMENTS_DIR = path.join(os.homedir(), ".civagent", "tournaments");

// Parse the judge's markdown output and extract per-regime scores.
// Handles lines like: | 1 | china/tang | 8.5 | reason |
// civRegimes is the full list of regime strings (e.g. ["china/tang", "china/qin"]).
// Returns [{regime, score}] sorted descending, or [] if nothing parseable.
export function parseJudgeScores(output, civRegimes) {
  if (!output) return [];
  const scores = [];
  for (const line of String(output).split("\n")) {
    const cells = line.split("|").map((s) => s.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    // Skip header/separator rows
    if (/^[-\s]+$/.test(cells[0]) || /rank/i.test(cells[0])) continue;
    // cells[1] should contain the civilization name
    const nameCell = cells[1] || "";
    const scoreCell = cells[2] || "";
    const scoreMatch = scoreCell.match(/^(\d+(?:\.\d+)?)/);
    if (!scoreMatch) continue;
    // Match against known regime ids: exact or partial (regime's slug part)
    const regime = civRegimes.find((r) => {
      const slug = r.split("/")[1] || r;
      return nameCell === r || nameCell.includes(r) || nameCell.includes(slug);
    });
    if (regime) {
      scores.push({ regime, score: parseFloat(scoreMatch[1]) });
    }
  }
  // Remove duplicates (first occurrence wins after sort)
  const seen = new Set();
  return scores
    .filter((s) => { if (seen.has(s.regime)) return false; seen.add(s.regime); return true; })
    .sort((a, b) => b.score - a.score);
}

// ── Anchored rubric (blind judging) ─────────────────────────────────────────
// The judge scores every civilization on these three dimensions with an
// anchored 4-point scale and must answer with structured JSON. Anchors make
// scores comparable across passes (original vs swapped presentation order).
export const RUBRIC_DIMENSIONS = ["legality", "feasibility", "resilience"];
export const RUBRIC_SCALE = 4;

export const JUDGE_RUBRIC_PROMPT = `You are the blind judge of a CivAgent governance tournament.
Each civilization received the same task and produced a transcript of how its
governance system responded. You do not know which backend or model produced
which transcript — judge governance quality alone, and do not let presentation
order influence your scores.

Score EVERY civilization on EACH of the three dimensions below using the
anchored 4-point scale (integers 1-4 only). Calibrate HARD: most competent
answers belong at 2-3; reserve 4 for responses that clearly exceed a typical
strong answer. For each dimension, first pick the most likely score, then
challenge yourself: "is this REALLY worth a 4, or merely a solid 3?"

legality — did they respect their own rules and institutions?
  1 = Ignores or contradicts its own stated rules and procedures.
  2 = Invokes its rules but bends or selectively applies them when inconvenient.
  3 = Follows its own rules and procedures with only minor lapses or shortcuts.
  4 = Rigorously respects its own institutions; every action traces to a
      legitimate rule AND the response cites/uses those rules explicitly in a
      way a reader could verify (not just plausible-sounding governance prose).

feasibility — are the proposed actions executable?
  1 = Actions are impossible, incoherent, or ignore available resources entirely.
  2 = Actions are only partially executable; major resource or logistical gaps.
  3 = Actions are executable with reasonable effort; minor practical gaps remain.
  4 = Actions are concrete, resourced, and immediately executable as described —
      with specifics (quantities, steps, fallbacks) a competent operator could
      follow without further clarification; generic "do X carefully" is NOT a 4.

resilience — would this survive second-order effects?
  1 = Response collapses under obvious backlash, side effects, or changing conditions.
  2 = Response addresses the immediate problem but creates serious new risks.
  3 = Response anticipates some second-order effects and includes partial mitigation.
  4 = Response explicitly anticipates backlash and side effects with NON-OBVIOUS
      insight (failure modes a typical answer would miss) and builds in adaptation.

Output ONLY a JSON object — no prose, no markdown fences — of exactly this shape:
{"scores":[{"civilization":"<name>","legality":<1-4>,"feasibility":<1-4>,"resilience":<1-4>,"reason":"<one line>"}],"verdict":"<one paragraph naming the top civilization and why>"}
Use the exact civilization names given in the transcript section headers.`;

// Build the full per-pass judge prompt (rubric + task + ordered transcripts).
export function buildJudgePrompt(task, sections) {
  return `${JUDGE_RUBRIC_PROMPT}\n\n## Task\n${task}\n\n## Civilization Transcripts\n\n${sections}`;
}

// Match a judge-supplied civilization name back to a known regime string:
// exact match, then containment of the full id, then containment of the slug.
function matchRegime(name, civRegimes) {
  if (!name) return null;
  return (
    civRegimes.find((r) => name === r) ||
    civRegimes.find((r) => name.includes(r)) ||
    civRegimes.find((r) => name.includes(r.split("/")[1] || r)) ||
    null
  );
}

// Parse the rubric JSON the anchored prompt asks for.
// Returns { scores: [{regime, dims, reason}], verdict } on success, or null
// when the output is not usable JSON (caller then falls back to the legacy
// markdown-table parser for backward compatibility).
export function parseJudgeJsonScores(output, civRegimes) {
  if (!output) return null;
  const s = String(output);
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let obj;
  try {
    obj = JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!obj || !Array.isArray(obj.scores)) return null;
  const scores = [];
  for (const entry of obj.scores) {
    if (!entry || typeof entry !== "object") continue;
    const regime = matchRegime(String(entry.civilization ?? entry.regime ?? ""), civRegimes);
    if (!regime) continue;
    const dims = {};
    let valid = true;
    for (const d of RUBRIC_DIMENSIONS) {
      const v = Number(entry[d]);
      if (!Number.isFinite(v) || v < 1 || v > RUBRIC_SCALE) { valid = false; break; }
      dims[d] = v;
    }
    if (!valid) continue;
    scores.push({ regime, dims, reason: typeof entry.reason === "string" ? entry.reason : "" });
  }
  if (scores.length === 0) return null;
  // First occurrence wins, mirroring parseJudgeScores' dedup behavior.
  const seen = new Set();
  const deduped = scores.filter((s) => (seen.has(s.regime) ? false : (seen.add(s.regime), true)));
  return { scores: deduped, verdict: typeof obj.verdict === "string" ? obj.verdict : "" };
}

// Aggregate per-pass results into final per-regime scores.
// passes: [{ swapped, perRegime: { [regime]: { score10, dims? } } }]
// Returns [{regime, score, dims?}] sorted descending; score is on a 10-point
// scale (rubric mean / 4 * 10) for continuity with the existing leaderboard.
export function aggregateJudgePasses(passes, civRegimes) {
  const acc = new Map(civRegimes.map((r) => [r, { score10: [], dims: Object.fromEntries(RUBRIC_DIMENSIONS.map((d) => [d, []])) }]));
  for (const p of passes) {
    for (const [regime, v] of Object.entries(p.perRegime || {})) {
      const a = acc.get(regime);
      if (!a) continue;
      if (Number.isFinite(v.score10)) a.score10.push(v.score10);
      if (v.dims) {
        for (const d of RUBRIC_DIMENSIONS) {
          if (Number.isFinite(v.dims[d])) a.dims[d].push(v.dims[d]);
        }
      }
    }
  }
  const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const out = [];
  for (const [regime, a] of acc) {
    if (a.score10.length === 0) continue;
    const dims = {};
    for (const d of RUBRIC_DIMENSIONS) {
      if (a.dims[d].length > 0) dims[d] = Math.round(mean(a.dims[d]) * 100) / 100;
    }
    out.push({
      regime,
      score: Math.round(mean(a.score10) * 10) / 10,
      ...(Object.keys(dims).length > 0 ? { dims } : {}),
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

// Should the judge run a second pass with the presentation order swapped?
// On by default; CIVAGENT_JUDGE_SWAP=0 disables.
export function judgeSwapEnabled(env = process.env) {
  return env.CIVAGENT_JUDGE_SWAP !== "0";
}

function newTournamentId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 23); // ms precision
  return `${stamp}-${Math.random().toString(36).slice(2, 6)}`;
}

// Parse "regime" or "regime#backend" into { regime, backend }.
export function parseCiv(token) {
  const [regimeRaw, backend = "native"] = String(token).split("#");
  const regime = validateRegime(regimeRaw.trim());
  return { regime, backend: backend.trim() || "native" };
}

// Pure: build the exact child spec used to launch one civ. Exported so tests can
// prove we invoke run-v5 directly (not `civagent switch`) and that each civ gets
// a distinct match id + isolated env.
export function civSpawnSpec({ regime, backend, matchId, runV5 = RUN_V5, noSkill = false }) {
  return {
    command: "node",
    args: [runV5, "--backend", backend, regime],
    // noSkill propagates the A3 ablation: children neither inject learned
    // skills nor run sedimentation after the match.
    env: { CIVAGENT_MATCH_ID: matchId, ...(noSkill ? { CIVAGENT_SKILL_LEARN: "off" } : {}) },
  };
}

function civMatchId(regime, tournamentId) {
  return `${tournamentId}__${regime.replace(/\//g, "-")}`;
}

// ── T3: deterministic scoring ────────────────────────────────────────────────
// A task spec (resources/tasks/<id>/task.json) pairs the prompt with a
// deterministic grader. Grader contract: invoked as
//   <command> [...args] <grading-dir>
// and must print a final JSON line {"pass_rate": 0..1, ...} on stdout.
// The grading dir is a throwaway COPY of the civ's workdir, so graders can
// run code (pytest, imports, writes) without ever touching the real output.

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

function runCiv({ regime, backend }, task, tournamentId, outDir, { noSkill = false, useWorkDir = false } = {}) {
  const matchId = civMatchId(regime, tournamentId);
  const spec = civSpawnSpec({ regime, backend, matchId, noSkill });
  // T3: give the civ a private writable workdir as cwd so produced code lands
  // in a known place for the deterministic grader.
  const workDir = useWorkDir ? path.join(outDir, "workdir", regime.replace(/\//g, "-")) : null;
  if (workDir) fs.mkdirSync(workDir, { recursive: true });
  return new Promise((resolve) => {
    const logFile = path.join(outDir, `${regime.replace(/\//g, "-")}.log`);
    const out = fs.createWriteStream(logFile);
    const proc = spawn(spec.command, [...spec.args, task], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...spec.env },
      ...(workDir ? { cwd: workDir } : {}),
    });
    proc.stdout.pipe(out, { end: false });
    proc.stderr.pipe(out, { end: false });
    proc.on("close", (code) => {
      out.end();
      resolve({ regime, backend, matchId, code, logFile, workDir });
    });
  });
}

function transcriptSection(r) {
  // Prefer the structured event stream; fall back to the raw process log.
  const text =
    readMatchText(r.matchId, 6000) ||
    (fs.existsSync(r.logFile) ? fs.readFileSync(r.logFile, "utf8").slice(-6000) : "(no output)");
  // Omit backend from the section header — judges should rank on governance
  // quality alone, not on which backend happened to run the civ.
  return `### ${r.regime} (exit ${r.code})\n\n\`\`\`\n${text}\n\`\`\``;
}

// Blind double evaluation: when swap is enabled the same matchup is judged
// twice — once in the original civ order, once reversed (A/B → B/A) — and the
// per-regime scores are averaged across passes. This cancels presentation-order
// bias. Every pass is recorded as a judge_score event on the tournament trace
// (provider/model, rubric prompt_hash, swap flag, presentation order).
export async function judge(task, civResults, {
  swap = judgeSwapEnabled(),
  eventLog = null,      // tournament-level EventLog; judge events attach here
  _runJudge = runJudge, // injectable for tests
} = {}) {
  const civRegimes = civResults.map((r) => r.regime);
  const baseOrder = civResults.map((_, i) => i);
  const passPlans = swap
    ? [
        { swapped: false, order: baseOrder },
        { swapped: true, order: [...baseOrder].reverse() },
      ]
    : [{ swapped: false, order: baseOrder }];

  // The judging step itself is one span under the tournament trace root;
  // per-pass judge_score events hang below it.
  const judgeSpanId = newSpanId();
  const passes = [];
  const rawPasses = [];
  let provider = null;
  let failure = null;
  let verdict = "";

  for (const plan of passPlans) {
    const ordered = plan.order.map((i) => civResults[i]);
    const prompt = buildJudgePrompt(task, ordered.map(transcriptSection).join("\n\n---\n\n"));
    const promptHash = hashShort(prompt);
    const auditFields = {
      kind: "judge_score",
      actor: "judge",
      parent_span_id: judgeSpanId,
      pass: passes.length,
      swapped: plan.swapped,
      order: ordered.map((c) => c.regime),
      prompt_hash: promptHash,
    };
    let r;
    try {
      r = _runJudge(prompt);
    } catch (e) {
      failure = e;
      eventLog?.emit("judge", { ...auditFields, error: e.message });
      break; // judge chain is dead — a swapped re-run would fail the same way
    }
    provider = provider ?? r.provider;
    rawPasses.push({ swapped: plan.swapped, order: auditFields.order, output: r.output });

    const perRegime = {};
    const json = parseJudgeJsonScores(r.output, civRegimes);
    if (json) {
      if (json.verdict && !verdict) verdict = json.verdict;
      for (const s of json.scores) {
        const meanDim = RUBRIC_DIMENSIONS.reduce((sum, d) => sum + s.dims[d], 0) / RUBRIC_DIMENSIONS.length;
        perRegime[s.regime] = { score10: (meanDim / RUBRIC_SCALE) * 10, dims: s.dims };
      }
    } else {
      // Backward compatibility: a judge that still answers with a markdown
      // Rank|Civilization|Score/10 table is parsed with the legacy parser.
      for (const s of parseJudgeScores(r.output, civRegimes)) {
        perRegime[s.regime] = { score10: s.score };
      }
    }
    passes.push({ swapped: plan.swapped, perRegime });
    eventLog?.emit("judge", { ...auditFields, provider: r.provider, model: r.provider });
  }

  if (provider === null) {
    return {
      provider: null,
      rawOutput: null,
      scores: [],
      swap,
      passes: 0,
      md:
        `# Tournament Result — judge unavailable\n\n${failure?.message ?? "unknown error"}\n\n` +
        `Raw civ exit codes:\n${civResults.map((c) => `- ${c.regime} (${c.backend}): ${c.code}`).join("\n")}`,
    };
  }

  const scores = aggregateJudgePasses(passes, civRegimes);
  const lines = [
    `# Tournament — ${new Date().toISOString()}`,
    ``,
    `**Task:** ${task}`,
    `**Judge:** ${provider}`,
    `**Order swap:** ${swap ? `enabled (${passes.length} passes, scores averaged)` : "disabled (single pass)"}`,
    `**Rubric:** anchored 4-point scale per dimension (${RUBRIC_DIMENSIONS.join(", ")}), reported as score/10`,
    ``,
  ];
  if (scores.length > 0) {
    lines.push(`## Aggregated Scores`, ``);
    lines.push(`| Rank | Civilization | Score /10 | Legality | Feasibility | Resilience |`);
    lines.push(`|------|--------------|-----------|----------|-------------|------------|`);
    scores.forEach((s, i) => {
      const d = s.dims || {};
      lines.push(`| ${i + 1} | ${s.regime} | ${s.score} | ${d.legality ?? "—"} | ${d.feasibility ?? "—"} | ${d.resilience ?? "—"} |`);
    });
    lines.push(``);
  }
  if (verdict) {
    lines.push(`## Verdict`, ``, verdict, ``);
  }
  rawPasses.forEach((p, i) => {
    lines.push(`## Pass ${i + 1}${p.swapped ? " (swapped order)" : ""} — ${p.order.join(" → ")}`, ``, p.output, ``);
  });

  return {
    provider,
    rawOutput: rawPasses.map((p) => p.output).join("\n\n"),
    scores,
    swap,
    passes: passes.length,
    md: lines.join("\n"),
  };
}

export async function runTournament({ civs, task, noSkill = false, taskSpec = null, detWeight = 0.5 }) {
  if (!civs.length || !task) throw new Error("need --civs and a task");
  const parsed = civs.map(parseCiv);
  const useWorkDir = taskSpec?.type === "deterministic";

  const id = newTournamentId();
  const outDir = path.join(TOURNAMENTS_DIR, id);
  fs.mkdirSync(outDir, { recursive: true });

  console.error(`[tournament] ${id}  civs=${parsed.map((c) => c.regime).join(",")}  out=${outDir}${noSkill ? "  (no-skill: A3 ablation)" : ""}${useWorkDir ? `  (T3 deterministic: ${taskSpec.id})` : ""}`);

  // Tournament-level trace: judge_score events live in their own event stream
  // keyed by the tournament id, so the whole evaluation is auditable.
  const trace = new EventLog(id);
  trace.emit("match_start", {
    task,
    actor: "system",
    civs: parsed.map((c) => c.regime),
    tournament: true,
    ...(noSkill ? { noSkill: true } : {}),
    ...(useWorkDir ? { taskSpecId: taskSpec.id } : {}),
  });

  const results = await Promise.all(parsed.map((c) => runCiv(c, task, id, outDir, { noSkill, useWorkDir })));

  const verdict = await judge(task, results, { eventLog: trace });

  // T3: deterministic grading + blended scores.
  let detResults = null;
  let scores = verdict.scores;
  if (useWorkDir) {
    detResults = runDeterministicGrading({ spec: taskSpec, civs: results });
    scores = mixScores(scores, detResults, detWeight);
  }

  const resultFile = path.join(outDir, "result.md");
  let md = verdict.md;
  if (useWorkDir) {
    const rows = scores.map((s) => `| ${s.regime} | ${s.judge_score} | ${s.det_score ?? "—"} | ${s.score} |`);
    md += `\n\n## Deterministic Scores (task: ${taskSpec.id}, weight ${detWeight})\n\n` +
      `| Civilization | Judge /10 | Deterministic /10 | Mixed /10 |\n|---|---|---|---|\n${rows.join("\n")}\n`;
  }
  fs.writeFileSync(resultFile, md);

  // Scores were aggregated by the judge step (mean across order-swap passes),
  // then blended with deterministic scores for T3 tasks.
  const topRegime = scores.length > 0 ? scores[0].regime : null;

  // Manifest is the frontend's entry point into a tournament.
  const manifest = {
    id,
    task,
    createdAt: Date.now(),
    civs: results.map((r) => ({
      regime: r.regime,
      backend: r.backend,
      matchId: r.matchId,
      exitCode: r.code,
      events: eventsPath(r.matchId),
      ...(r.workDir ? { workDir: r.workDir } : {}),
    })),
    judge: {
      provider: verdict.provider,      // which provider judged (or null if unavailable)
      resultPath: resultFile,          // path to full markdown result
      scores,                          // [{regime, score, dims?, judge_score?, det_score?}] sorted desc
      topRegime,                       // winning regime or null
      swap: verdict.swap,              // whether the order-swapped second pass was enabled
      passes: verdict.passes,          // judge passes actually completed
      rubric: { scale: `1-${RUBRIC_SCALE}`, dimensions: RUBRIC_DIMENSIONS },
      events: trace.path,              // judge_score audit events (prompt_hash, swap flags)
      ...(useWorkDir ? {
        taskSpecId: taskSpec.id,
        detWeight,
        deterministic: Object.fromEntries([...detResults.entries()].map(([r, d]) => [r, { passRate: d.passRate, error: d.error }])),
      } : {}),
    },
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  trace.emit("match_end", { exitCode: 0, actor: "system", topRegime });
  await trace.close();

  console.log(`\n==== Tournament ${id} ====`);
  console.log(md);
  return { id, resultFile, results, manifest };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let civs = [];
  let noSkill = false;
  let taskFile = null;
  let detWeight = 0.5;
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--civs" && args[i + 1]) {
      civs = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (args[i] === "--no-skill") {
      noSkill = true;
    } else if (args[i] === "--task-file" && args[i + 1]) {
      taskFile = args[++i];
    } else if (args[i] === "--det-weight" && args[i + 1] != null) {
      detWeight = parseFloat(args[++i]);
    } else {
      rest.push(args[i]);
    }
  }
  let taskSpec = null;
  let task = rest.join(" ").trim();
  if (taskFile) {
    taskSpec = loadTaskSpec(taskFile);
    task = taskSpec.task; // spec text is the source of truth for T3
  }
  runTournament({ civs, task, noSkill, taskSpec, detWeight }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
