#!/usr/bin/env node
// tournament.mjs — run a single governance task against N civilizations in parallel,
// collect transcripts, have a judge model rank outcomes.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateRegime } from "./civ-memory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
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
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function runCiv(regime, task, outDir) {
  return new Promise(resolve => {
    const logFile = path.join(outDir, `${regime.replace(/\//g, "-")}.log`);
    const out = fs.createWriteStream(logFile);
    const binary = path.join(PROJECT_ROOT, "bin", "civagent");
    const proc = spawn(binary, ["switch", regime], { stdio: ["ignore", "pipe", "pipe"] });
    proc.stdout.pipe(out, { end: false });
    proc.stderr.pipe(out, { end: false });
    proc.on("close", () => {
      const run = spawn(binary, ["run", "--v5", task], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      run.stdout.pipe(out, { end: false });
      run.stderr.pipe(out, { end: false });
      run.on("close", code => {
        out.end();
        resolve({ regime, code, logFile });
      });
    });
  });
}

async function judge(task, civResults, outDir) {
  const sections = civResults.map(r => {
    const content = fs.existsSync(r.logFile)
      ? fs.readFileSync(r.logFile, "utf8").slice(-6000)
      : "(no output)";
    return `### ${r.regime} (exit ${r.code})\n\n\`\`\`\n${content}\n\`\`\``;
  }).join("\n\n---\n\n");

  const prompt = `${JUDGE_PROMPT}\n\n## Task\n${task}\n\n## Civilization Transcripts\n\n${sections}`;
  const r = spawnSync("gemini", ["-p", prompt], {
    encoding: "utf8", timeout: 300_000, env: process.env,
  });
  if (r.status !== 0) {
    return `# Tournament Result — judge unavailable\n\nGemini failed: ${r.stderr || r.error?.message}\n\nRaw civ exit codes:\n${civResults.map(c => `- ${c.regime}: ${c.code}`).join("\n")}`;
  }
  return `# Tournament — ${new Date().toISOString()}\n\n**Task:** ${task}\n\n${r.stdout}`;
}

export async function runTournament({ civs, task }) {
  if (!civs.length || !task) throw new Error("need --civs and a task");
  civs.forEach(validateRegime);

  const id = newTournamentId();
  const outDir = path.join(TOURNAMENTS_DIR, id);
  fs.mkdirSync(outDir, { recursive: true });

  console.error(`[tournament] ${id}  civs=${civs.join(",")}  out=${outDir}`);
  const results = await Promise.all(civs.map(c => runCiv(c, task, outDir)));

  const verdictMd = await judge(task, results, outDir);
  const resultFile = path.join(outDir, "result.md");
  fs.writeFileSync(resultFile, verdictMd);
  console.log(`\n==== Tournament ${id} ====`);
  console.log(verdictMd);
  return { id, resultFile, results };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let civs = [];
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--civs" && args[i + 1]) {
      civs = args[++i].split(",").map(s => s.trim()).filter(Boolean);
    } else {
      rest.push(args[i]);
    }
  }
  const task = rest.join(" ").trim();
  runTournament({ civs, task }).catch(e => { console.error(e); process.exit(1); });
}
