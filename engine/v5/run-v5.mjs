#!/usr/bin/env node
// run-v5.mjs — CivAgent v5 entry: isolated civ HOME + transcript logging + skill sedimentation

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ensureCivHome, transcriptPath, validateRegime } from "./civ-memory.mjs";
import { sediment } from "./skill-sediment.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

function newMatchId() {
  const d = new Date();
  const stamp = d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${stamp}-${Math.random().toString(36).slice(2, 6)}`;
}

async function main() {
  const [regimeRaw, ...promptParts] = process.argv.slice(2);
  if (!regimeRaw) {
    console.error("usage: run-v5.mjs <region/regime-id> [prompt...]");
    process.exit(1);
  }
  const regime = validateRegime(regimeRaw);

  const regimeDir = path.join(PROJECT_ROOT, "regimes", regime);
  if (!fs.existsSync(regimeDir)) {
    console.error(`regime not found: ${regimeDir}`);
    process.exit(1);
  }

  const matchId = newMatchId();
  const home = ensureCivHome(regime, regimeDir);
  const tPath = transcriptPath(matchId);

  console.error(`[v5] regime=${regime} match=${matchId}`);
  console.error(`[v5] HOME=${home}`);
  console.error(`[v5] transcript=${tPath}`);

  // Generate agent definitions via v4's converter, piped to CC's --agents
  const agentsJson = await new Promise((resolve, reject) => {
    const p = spawn("node", [path.join(PROJECT_ROOT, "engine", "regime-to-cc.mjs"), regimeDir], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    let out = "";
    p.stdout.on("data", d => { out += d; });
    p.on("close", c => c === 0 ? resolve(out) : reject(new Error(`regime-to-cc exited ${c}`)));
  });

  // Isolate XDG paths too — some CC builds read config from XDG_CONFIG_HOME
  // independently of HOME, which would leak the outer user's state.
  const env = {
    ...process.env,
    HOME: home,
    XDG_CONFIG_HOME: path.join(home, ".config"),
    XDG_DATA_HOME: path.join(home, ".local", "share"),
    XDG_CACHE_HOME: path.join(home, ".cache"),
    CIVAGENT_MATCH_ID: matchId,
  };
  fs.mkdirSync(env.XDG_CONFIG_HOME, { recursive: true });
  const ccArgs = ["--agents", agentsJson];
  const prompt = promptParts.join(" ").trim();
  if (prompt) ccArgs.push("-p", prompt);

  const cc = spawn("claude", ccArgs, { env, stdio: ["inherit", "pipe", "inherit"] });

  const tStream = fs.createWriteStream(tPath);
  cc.stdout.on("data", chunk => {
    process.stdout.write(chunk);
    tStream.write(JSON.stringify({ t: Date.now(), chunk: chunk.toString() }) + "\n");
  });

  const exitCode = await new Promise(res => cc.on("close", res));
  tStream.end();

  console.error(`[v5] CC exited ${exitCode}, running skill sedimentation...`);
  const skillsDir = path.join(regimeDir, "skills");
  try {
    const result = await sediment({
      matchId, regime, regimeDir, transcriptPath: tPath, existingSkillsDir: skillsDir,
    });
    console.error(`[v5] sediment:`, JSON.stringify(result));
  } catch (e) {
    console.error(`[v5] sediment failed: ${e.message}`);
  }
  process.exit(exitCode ?? 0);
}

main().catch(e => { console.error(e); process.exit(1); });
