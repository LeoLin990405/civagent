#!/usr/bin/env node
// run-v5.mjs — CivAgent v5 entry: backend routing + isolated civ HOME + structured
// event stream + skill sedimentation.
//
// Usage: run-v5.mjs [--backend <id>] <region/regime-id> [prompt...]
//   --backend  Claude-Code-compatible backend (native, cn:doubao, cn:glm, ...).
//              Defaults to $CIVAGENT_BACKEND or "native". See engine/v5/backends.mjs.

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { StringDecoder } from "node:string_decoder";
import { ensureCivHome, validateRegime } from "./civ-memory.mjs";
import { sediment } from "./skill-sediment.mjs";
import { resolveBackend, buildBackendArgs } from "./backends.mjs";
import { EventLog, writeMeta, eventsPath } from "./events.mjs";
import { retrieveHistoricalContext } from "./history-retriever.mjs";
import { MechanismEngine } from "../mechanisms/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

function newMatchId() {
  const d = new Date();
  const stamp = d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${stamp}-${Math.random().toString(36).slice(2, 6)}`;
}

// Pure arg parser (exported for tests): pulls --backend out of argv, leaving the
// regime + prompt. Backend precedence: --backend flag > $CIVAGENT_BACKEND > native.
// --no-skill disables the learning loop for this match (A3 ablation): no learned
// skills are injected and sedimentation does not run afterwards.
export function parseArgs(argv, env = process.env) {
  let backend = env.CIVAGENT_BACKEND || "native";
  let noSkill = false;
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--backend" && argv[i + 1] != null) {
      backend = argv[++i];
    } else if (argv[i] === "--no-skill") {
      noSkill = true;
    } else {
      rest.push(argv[i]);
    }
  }
  const [regimeRaw, ...promptParts] = rest;
  return { backend, regimeRaw, prompt: promptParts.join(" ").trim(), noSkill };
}

// Is the skill learning loop active? --no-skill or CIVAGENT_SKILL_LEARN=off
// disables it (A3 ablation); staging/approve mechanics are unaffected.
export function skillLearnEnabled({ noSkill = false, env = process.env } = {}) {
  return !noSkill && env.CIVAGENT_SKILL_LEARN !== "off";
}

// Convert a sediment() result object to event fields for the skill event type.
// Returns null if the result is empty or unrecognized.
//
// Presence checks (not truthiness) for rejected/skipped/error: the audit can
// produce an EMPTY string reason (e.g. reviewer output had no verdict line),
// and a truthiness check would silently drop the whole skill event from the
// stream even though sedimentation and the audit both ran. Empty reasons get
// a fallback so the event is always recorded.
export function buildSkillEvent(result) {
  if (!result) return null;
  const pin = result.contentHash ? { contentHash: result.contentHash } : {};
  const reason = (v) => String(v ?? "").slice(0, 200) || "(no reason given)";
  if (result.saved)    return { status: "saved",    skillPath: result.saved,    auditedBy: result.auditedBy ?? null, ...pin };
  if (result.staged)   return { status: "staged",   skillPath: result.staged,   reason: reason(result.reason || "awaiting human approval"), ...pin };
  if ("rejected" in result && result.rejected !== undefined) return { status: "rejected", reason: reason(result.rejected), auditedBy: result.auditedBy ?? null };
  if ("skipped" in result && result.skipped !== undefined)   return { status: "skipped",  reason: reason(result.skipped) };
  if ("error" in result && result.error !== undefined)       return { status: "error",    reason: reason(result.error) };
  return null;
}

// Non-interactive matches cannot answer CC's permission prompts, so any file
// write (Write tool, `cat >`, tee, python writes) hangs unapproved — the T3
// smoke showed agents exhausting every write channel and producing nothing.
// CIVAGENT_PERMISSION_MODE (set by the tournament for deterministic tasks)
// appends CC's --permission-mode flag so writes can proceed. Unset → CC's
// default behavior is unchanged.
export function withPermissionMode(ccArgs, env = process.env) {
  const mode = env.CIVAGENT_PERMISSION_MODE;
  return mode ? [...ccArgs, "--permission-mode", mode] : ccArgs;
}

async function main() {
  const { backend, regimeRaw, prompt, noSkill } = parseArgs(process.argv.slice(2));
  if (!regimeRaw) {
    console.error("usage: run-v5.mjs [--backend <id>] [--no-skill] <region/regime-id> [prompt...]");
    process.exit(1);
  }
  const regime = validateRegime(regimeRaw);
  const skillLearn = skillLearnEnabled({ noSkill });

  // Fail-fast on a bad/forbidden backend rather than silently running `claude`.
  let command;
  try {
    command = resolveBackend(backend);
  } catch (e) {
    console.error(`[v5] ${e.message}`);
    process.exit(2);
  }

  const regimeDir = path.join(PROJECT_ROOT, "regimes", regime);
  if (!fs.existsSync(regimeDir)) {
    console.error(`regime not found: ${regimeDir}`);
    process.exit(1);
  }

  // Honor an externally-assigned match id (the tournament uses this to correlate
  // its civs); otherwise mint our own.
  const matchId = process.env.CIVAGENT_MATCH_ID || newMatchId();
  const home = ensureCivHome(regime, regimeDir, { skills: skillLearn });
  const log = new EventLog(matchId);
  const startedAt = Date.now();

  console.error(`[v5] regime=${regime} backend=${backend} command=${command} match=${matchId}`);
  console.error(`[v5] HOME=${home}`);
  console.error(`[v5] events=${eventsPath(matchId)}`);

  writeMeta(matchId, { regime, backend, command, task: prompt, startedAt, status: "running" });
  log.emit("match_start", { regime, backend, command, task: prompt, actor: regime });

  // Generate agent definitions via v4's converter, piped to CC's --agents.
  const agentsJson = await new Promise((resolve, reject) => {
    const p = spawn("node", [path.join(PROJECT_ROOT, "engine", "regime-to-cc.mjs"), regimeDir], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    let out = "";
    p.stdout.on("data", (d) => {
      out += d;
    });
    p.on("error", reject); // ENOENT / spawn failure — otherwise the promise never settles
    p.on("close", (c) => (c === 0 ? resolve(out) : reject(new Error(`regime-to-cc exited ${c}`))));
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
    CIVAGENT_BACKEND: backend,
  };
  fs.mkdirSync(env.XDG_CONFIG_HOME, { recursive: true });

  const ragContext = retrieveHistoricalContext(regimeDir, prompt);
  const finalPrompt = prompt + ragContext;
  
  const ccArgs = buildBackendArgs({ agentsJson, prompt: finalPrompt });

  // Respect the regime's declared constitutional mechanisms (metadata.json);
  // a regime that doesn't grant VETO should never have a veto fire against it.
  let allowedMechanisms = ["VETO", "IMPEACH", "EDICT"];
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(regimeDir, "metadata.json"), "utf8"));
    if (Array.isArray(meta.mechanisms) && meta.mechanisms.length) {
      allowedMechanisms = meta.mechanisms;
    }
  } catch { /* default to all three */ }

  const cc = spawn(command, withPermissionMode(ccArgs), { env, stdio: ["inherit", "pipe", "inherit"] });
  const mechEngine = new MechanismEngine(log, cc, allowedMechanisms);

  // Mechanism markers ([VETO], [IMPEACH: x], 驳回, 圣旨…) are inline tokens that a
  // raw "data" chunk can split mid-marker or mid-UTF8-codepoint, silently dropping
  // a real veto. Decode bytes safely and detect on complete lines instead.
  const decoder = new StringDecoder("utf8");
  let lineBuf = "";
  const feed = (textChunk, flush = false) => {
    lineBuf += textChunk;
    let nl;
    while ((nl = lineBuf.indexOf("\n")) >= 0) {
      const line = lineBuf.slice(0, nl + 1);
      lineBuf = lineBuf.slice(nl + 1);
      log.emit("turn", { text: line, actor: regime });
      mechEngine.process(line);
    }
    if (flush && lineBuf) {
      log.emit("turn", { text: lineBuf, actor: regime });
      mechEngine.process(lineBuf);
      lineBuf = "";
    }
  };

  cc.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);     // raw passthrough preserves exact bytes
    feed(decoder.write(chunk));
  });
  cc.stdout.on("end", () => feed(decoder.end(), true));

  let exitCode;
  let exitSignal = null;
  try {
    ({ code: exitCode, signal: exitSignal } = await new Promise((res, rej) => {
      cc.on("error", rej);
      cc.on("close", (code, signal) => res({ code, signal }));
    }));
  } catch (err) {
    // Binary not found or failed to spawn (e.g. ENOENT).
    console.error(`[v5] backend spawn failed: ${err.message}`);
    log.emit("match_end", { exitCode: null, error: err.message });
    await log.close();
    writeMeta(matchId, { endedAt: Date.now(), exitCode: null, status: "failed", error: err.message });
    process.exit(2);
  }
  // Run sedimentation BEFORE closing the log so we can emit the skill event
  // inside the same JSONL stream (frontend watches for match_end to stop reading).
  // A3 ablation: with the learning loop disabled, skip sedimentation entirely
  // and record that in the event stream.
  let sedimentResult;
  if (!skillLearn) {
    sedimentResult = { skipped: "skill learning disabled (--no-skill / CIVAGENT_SKILL_LEARN=off)" };
    console.error(`[v5] backend exited ${exitCode}, skill learning disabled — skipping sedimentation`);
  } else {
    console.error(`[v5] backend exited ${exitCode}, running skill sedimentation...`);
    const skillsDir = path.join(regimeDir, "skills");
    try {
      sedimentResult = await sediment({
        matchId,
        regime,
        regimeDir,
        transcriptPath: eventsPath(matchId),
        existingSkillsDir: skillsDir,
      });
      console.error(`[v5] sediment:`, JSON.stringify(sedimentResult));
    } catch (e) {
      sedimentResult = { error: e.message };
      console.error(`[v5] sediment failed: ${e.message}`);
    }
  }

  // Emit a structured skill event so the frontend can reflect sedimentation status.
  const skillEv = buildSkillEvent(sedimentResult);
  if (skillEv) log.emit("skill", skillEv); // actor defaults to "skill-learner"

  // A veto hard-aborts the backend via SIGKILL, which surfaces as exitCode=null.
  // Distinguish a constitutional veto from a clean exit so meta.json/the frontend
  // don't report a vetoed match as "done". actor defaults to "system".
  const mechStats = mechEngine.getStats();
  const vetoed = mechStats.vetoes > 0;
  const status = vetoed ? "vetoed" : "done";

  log.emit("match_end", { exitCode, signal: exitSignal, status, mechanisms: mechStats });
  await log.close();

  writeMeta(matchId, {
    endedAt: Date.now(),
    exitCode,
    signal: exitSignal,
    status,
    mechanisms: mechStats,
    impeachments: mechEngine.getImpeachments(),
    sediment: sedimentResult,
  });
  process.exit(vetoed ? 0 : (exitCode ?? 0));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
