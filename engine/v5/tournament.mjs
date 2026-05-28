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
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateRegime } from "./civ-memory.mjs";
import { runJudge } from "./judge.mjs";
import { runMultiJudge } from "./multi-judge.mjs";
import { readMatchText, eventsPath } from "./events.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const RUN_V5 = path.join(__dirname, "run-v5.mjs");
const TOURNAMENTS_DIR = path.join(os.homedir(), ".civagent", "tournaments");

const JUDGE_PROMPT = `You are the judge of a CivAgent governance tournament.
Each civilization received the same task and produced a transcript of how its
governance system responded. Rank them on:
  - legality (did they respect their own rules?)
  - feasibility (are the actions executable?)
  - resilience (would this survive second-order effects?)

Output ONLY a markdown table with columns: Rank | Civilization | Score /10 | One-line reason.
Then one paragraph: "## Verdict" explaining the top choice.`;

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
export function civSpawnSpec({ regime, backend, matchId, runV5 = RUN_V5 }) {
  return {
    command: "node",
    args: [runV5, "--backend", backend, regime],
    env: { CIVAGENT_MATCH_ID: matchId },
  };
}

function civMatchId(regime, tournamentId) {
  return `${tournamentId}__${regime.replace(/\//g, "-")}`;
}

function runCiv({ regime, backend }, task, tournamentId, outDir) {
  const matchId = civMatchId(regime, tournamentId);
  const spec = civSpawnSpec({ regime, backend, matchId });
  return new Promise((resolve) => {
    const logFile = path.join(outDir, `${regime.replace(/\//g, "-")}.log`);
    const out = fs.createWriteStream(logFile);
    const proc = spawn(spec.command, [...spec.args, task], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...spec.env },
    });
    proc.stdout.pipe(out, { end: false });
    proc.stderr.pipe(out, { end: false });
    proc.on("close", (code) => {
      out.end();
      resolve({ regime, backend, matchId, code, logFile });
    });
  });
}

// Build the judge input sections from civ results.
function buildJudgePrompt(task, civResults) {
  const sections = civResults
    .map((r) => {
      const text =
        readMatchText(r.matchId, 6000) ||
        (fs.existsSync(r.logFile) ? fs.readFileSync(r.logFile, "utf8").slice(-6000) : "(no output)");
      // Omit backend from the heading: the judge receives anonymized civ labels
      // and must not learn which provider a civ used (that would break blind eval).
      return `### ${r.regime} (exit ${r.code})\n\n\`\`\`\n${text}\n\`\`\``;
    })
    .join("\n\n---\n\n");
  return `${JUDGE_PROMPT}\n\n## Task\n${task}\n\n## Civilization Transcripts\n\n${sections}`;
}

// Single-judge path (fallback when multi-judge is disabled).
async function judgeSingle(task, civResults) {
  const prompt = buildJudgePrompt(task, civResults);
  try {
    const r = runJudge(prompt);
    return {
      providers: [r.provider],
      md: `# Tournament — ${new Date().toISOString()}\n\n**Task:** ${task}\n**Judge:** ${r.provider}\n\n${r.output}`,
    };
  } catch (e) {
    return {
      providers: [],
      md:
        `# Tournament Result — judge unavailable\n\n${e.message}\n\n` +
        `Raw civ exit codes:\n${civResults.map((c) => `- ${c.regime} (${c.backend}): ${c.code}`).join("\n")}`,
    };
  }
}

// Multi-judge blind evaluation path.
async function judgeMulti(task, civResults, judgesN) {
  const prompt = buildJudgePrompt(task, civResults);
  try {
    const r = runMultiJudge(prompt, civResults, { judgesN });
    const scoresText = r.scores.size
      ? [...r.scores.entries()]
          .map(([civ, s]) => `| ${civ} | ${s.legality.toFixed(1)} | ${s.feasibility.toFixed(1)} | ${s.resilience.toFixed(1)} | ${s.avg.toFixed(1)} |`)
          .join("\n")
      : "(no scores parsed)";
    const header = `| Civilization | Legality | Feasibility | Resilience | Avg |\n|---|---|---|---|---|`;
    const md = `# Tournament — ${new Date().toISOString()}\n\n**Task:** ${task}\n**Judges (blind):** ${r.providers.join(", ")}\n\n${header}\n${scoresText}\n\n---\n\n${r.verdict}`;
    return { providers: r.providers, scores: r.scores, md };
  } catch (e) {
    return { providers: [], md: `# Tournament Result — multi-judge error\n\n${e.message}` };
  }
}

export async function runTournament({ civs, task, multiJudge = false, judgesN = 2 }) {
  if (!civs.length || !task) throw new Error("need --civs and a task");
  const parsed = civs.map(parseCiv);

  const id = newTournamentId();
  const outDir = path.join(TOURNAMENTS_DIR, id);
  fs.mkdirSync(outDir, { recursive: true });

  console.error(`[tournament] ${id}  civs=${parsed.map((c) => c.regime).join(",")}  multi=${multiJudge}  out=${outDir}`);
  const results = await Promise.all(parsed.map((c) => runCiv(c, task, id, outDir)));

  const verdict = multiJudge
    ? await judgeMulti(task, results, judgesN)
    : await judgeSingle(task, results);

  const resultFile = path.join(outDir, "result.md");
  fs.writeFileSync(resultFile, verdict.md);

  // Manifest is the frontend's entry point into a tournament.
  const manifest = {
    id,
    task,
    createdAt: Date.now(),
    multiJudge,
    civs: results.map((r) => ({
      regime: r.regime,
      backend: r.backend,
      matchId: r.matchId,
      exitCode: r.code,
      events: eventsPath(r.matchId),
    })),
    judge: { providers: verdict.providers, resultPath: resultFile },
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\n==== Tournament ${id} ====`);
  console.log(verdict.md);
  return { id, resultFile, results, manifest };
}

// Pick a random scenario from the built-in prompt bank.
export function pickScenario({ seed } = {}) {
  const scenarios = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "prompts", "governance-scenarios.json"), "utf8")
  );
  const idx = seed != null
    ? Math.abs(Number(seed)) % scenarios.length
    : Math.floor(Math.random() * scenarios.length);
  return scenarios[idx];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let civs = [];
  let multiJudge = false;
  let judgesN = 2;
  let promptBank = false;
  let seed;
  const rest = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--civs" && args[i + 1]) {
      civs = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (args[i] === "--multi-judge") {
      multiJudge = true;
    } else if (args[i] === "--judges" && args[i + 1]) {
      judgesN = parseInt(args[++i], 10);
    } else if (args[i] === "--prompt-bank") {
      promptBank = true;
    } else if (args[i] === "--seed" && args[i + 1]) {
      seed = args[++i];
    } else {
      rest.push(args[i]);
    }
  }

  let task = rest.join(" ").trim();
  if (promptBank && !task) {
    const scenario = pickScenario({ seed });
    task = scenario.prompt;
    console.error(`[tournament] using prompt-bank scenario: ${scenario.id}`);
  }

  runTournament({ civs, task, multiJudge, judgesN }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
