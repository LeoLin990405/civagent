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
import { runJudge, resolveJudgeChain, anonymizeCivs } from "./judge.mjs";
import {
  selectTranscript,
  eventsPath,
  metaPath,
  writeMeta,
  EventLog,
  hashShort,
  newSpanId,
} from "./events.mjs";
import { classifyTopologyParticipation } from "./runtime-graph.mjs";
import { recordTournamentResult } from "./history-db.mjs";
import { stampTournamentOutcome } from "./skill-outcome.mjs";
import {
  RUBRIC_DIMENSIONS,
  RUBRIC_SCALE,
  buildJudgePrompt,
  parseJudgeScores,
  parseJudgeJsonScores,
  aggregateJudgePasses,
  judgeSwapEnabled,
} from "./judge-rubric.mjs";
import { loadTaskSpec, runDeterministicGrading, mixScores } from "./deterministic-grading.mjs";
import {
  applyVerbosityControl,
  computeBiasReport,
  DEFAULT_VERBOSITY_BUDGET,
} from "./judge-calibration.mjs";

// ── Re-exports (backward compatibility) ─────────────────────────────────────
// Every symbol originally exported from tournament.mjs remains importable from
// this module exactly as before. Existing callers (tests, server routes) must
// not break.
export {
  JUDGE_RUBRIC_PROMPT,
  RUBRIC_DIMENSIONS,
  RUBRIC_SCALE,
  buildJudgePrompt,
  parseJudgeScores,
  parseJudgeJsonScores,
  aggregateJudgePasses,
  judgeSwapEnabled,
} from "./judge-rubric.mjs";
export { loadTaskSpec, runDeterministicGrading, mixScores } from "./deterministic-grading.mjs";
export { applyVerbosityControl, computeBiasReport, modelFamilyOf, DEFAULT_VERBOSITY_BUDGET } from "./judge-calibration.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUN_V5 = path.join(__dirname, "run-v5.mjs");
const TOURNAMENTS_DIR = path.join(os.homedir(), ".civagent", "tournaments");

// Ids must stay path-safe: they become directory names under ~/.civagent and
// path segments in the HTTP API. Callers that pre-generate an id (the write
// API does, so it can answer before the run finishes) validate against this.
export const TOURNAMENT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/;

export function newTournamentId() {
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
export function civSpawnSpec({
  regime,
  backend,
  matchId,
  runV5 = RUN_V5,
  noSkill = false,
  permissionMode = null,
  enforceDispatch = false,
}) {
  return {
    command: "node",
    args: [runV5, "--backend", backend, regime],
    // noSkill propagates the A3 ablation: children neither inject learned
    // skills nor run sedimentation after the match. permissionMode (T3)
    // lets agents actually write files in non-interactive sessions.
    env: {
      CIVAGENT_MATCH_ID: matchId,
      ...(noSkill ? { CIVAGENT_SKILL_LEARN: "off" } : {}),
      ...(permissionMode ? { CIVAGENT_PERMISSION_MODE: permissionMode } : {}),
      ...(enforceDispatch ? { CIVAGENT_ENFORCE_DISPATCH: "1" } : {}),
    },
  };
}

function civMatchId(regime, tournamentId) {
  return `${tournamentId}__${regime.replace(/\//g, "-")}`;
}

function runCiv({ regime, backend }, task, tournamentId, outDir, {
  noSkill = false,
  useWorkDir = false,
  permissionMode = null,
  enforceDispatch = false,
} = {}) {
  const matchId = civMatchId(regime, tournamentId);
  const spec = civSpawnSpec({
    regime,
    backend,
    matchId,
    noSkill,
    permissionMode,
    enforceDispatch,
  });
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
    // Without an "error" handler a spawn failure (ENOENT, EMFILE under load)
    // throws an unhandled exception and "close" may never fire, hanging the
    // whole Promise.all. Resolve with a null code so the tournament continues.
    proc.on("error", (err) => {
      out.end();
      resolve({ regime, backend, matchId, code: null, logFile, workDir, error: err.message });
    });
    proc.on("close", (code, signal) => {
      out.end();
      resolve({ regime, backend, matchId, code, signal, logFile, workDir });
    });
  });
}

function transcriptSection(r, anon = null, selectOpts = {}) {
  // Prefer the structured event stream with the same structural sampling rule
  // for every civ. The legacy raw-log fallback remains tail-only.
  const { text, selection } = selectTranscript(r.matchId, {
    maxChars: 6000,
    strategy: "actor-stratified",
    ...selectOpts,
  });
  const rawLogText = !text && fs.existsSync(r.logFile)
    ? fs.readFileSync(r.logFile, "utf8")
    : "";
  const bodyText = text || rawLogText.slice(-6000) || "(no output)";
  // If the events file was missing and we fell back to the raw log, record
  // that the selection metadata reflects the fallback (tail-only, unknown origin).
  const finalSelection = text
    ? { ...selection, fallback: false }
    : { ...selection, strategy: "tail", originalLength: rawLogText.length, selectedLength: bodyText.length,
        selectedContentChars: rawLogText ? bodyText.length : 0,
        omittedContentChars: Math.max(0, rawLogText.length - bodyText.length),
        totalTurns: null, actorCount: null, selectedTurns: null,
        truncated: rawLogText.length > bodyText.length, fallback: true, fallbackSource: "raw-log",
        ...(rawLogText ? {} : { placeholder: true }) };
  // Omit backend from the section header — judges should rank on governance
  // quality alone, not on which backend happened to run the civ. With anon,
  // even the civ's own name is replaced by its positional label (Civ-A …).
  const name = anon ? anon.labelFor.get(r.regime) : r.regime;
  const body = anon ? anon.transform(bodyText) : bodyText;
  return {
    section: `### ${name} (exit ${r.code})\n\n\`\`\`\n${body}\n\`\`\``,
    selection: { regime: r.regime, ...finalSelection },
  };
}

// Blind double evaluation: when swap is enabled the same matchup is judged
// twice — once in the original civ order, once reversed (A/B → B/A) — and the
// per-regime scores are averaged across passes. This cancels presentation-order
// bias. Every pass is recorded as a judge_score event on the tournament trace
// (provider/model, rubric prompt_hash, swap flag, presentation order).
//
// R2 extensions:
//   judgesN > 1 — run the full pass plan on up to N distinct available
//     providers (walking the resolved chain, skipping dead providers without
//     letting them consume a slot); all passes pool into one aggregate.
//   anonymize — civ ids, slugs, and metadata display names in the transcripts
//     are replaced by positional labels (Civ-A …), de-anonymized after parsing.
export async function judge(task, civResults, {
  swap = judgeSwapEnabled(),
  judgesN = 1,
  anonymize = false,
  verbosityBudget = DEFAULT_VERBOSITY_BUDGET, // uniform per-transcript char cap (verbosity-bias hedge)
  eventLog = null,      // tournament-level EventLog; judge events attach here
  _runJudge = runJudge, // injectable for tests
} = {}) {
  const civRegimes = civResults.map((r) => r.regime);
  // regime → backend id, for the self-preference (same-family) bias report.
  const civBackends = Object.fromEntries(civResults.map((r) => [r.regime, r.backend ?? "native"]));
  const anon = anonymize ? anonymizeCivs(civRegimes) : null;
  // Names the judge sees (and answers with) — labels when blinded.
  const judgeNames = anon ? anon.labels : civRegimes;
  const baseOrder = civResults.map((_, i) => i);
  const passPlans = swap
    ? [
        { swapped: false, order: baseOrder },
        { swapped: true, order: [...baseOrder].reverse() },
      ]
    : [{ swapped: false, order: baseOrder }];

  // Provider plan: single-judge mode delegates provider choice to runJudge's
  // chain fallback (null slot); multi-judge mode walks the chain itself so
  // each successful provider fills exactly one of the N slots.
  const providerSlots = judgesN > 1 ? resolveJudgeChain() : [null];

  // The judging step itself is one span under the tournament trace root;
  // per-pass judge_score events hang below it. The span has to be *opened* with
  // an event that carries it as its own span_id — without one, every judge event
  // points at a parent that was never written, and runtime-graph reconstructs
  // them as orphans hanging off <orphan> instead of the tournament.
  const judgeSpanId = newSpanId();
  eventLog?.emit("judge", {
    span_id: judgeSpanId,
    actor: "judge",
    kind: "judge_score",
    phase: "judging_start",
    judges_n: judgesN,
    anonymized: Boolean(anon),
    passes_planned: passPlans.length,
  });
  const passes = [];
  const rawPasses = [];
  const providers = [];
  let provider = null;
  let failure = null;
  let verdict = "";
  // Accumulate the verbosity log across passes (for the bias_report); since the
  // same sections are judged per pass, we keep one representative log.
  let verbosityLog = [];
  // Transcript selection metadata — collected once from the first pass (the
  // same events files are read for every pass, so the selection is identical).
  let transcriptSelection = null;

  for (const slot of providerSlots) {
    if (judgesN > 1 && providers.length >= judgesN) break;
    let slotWorked = false;

    for (const plan of passPlans) {
      const ordered = plan.order.map((i) => civResults[i]);
      const rawResults = ordered.map((c) => transcriptSection(c, anon));
      const rawSections = rawResults.map((r) => r.section);
      // Verbosity control: cap every transcript body to a uniform budget so the
      // judge cannot reward length. Headers + code fences are preserved, and the
      // before/after lengths are logged for the manifest (never a silent cut).
      const { sections: controlledSections, verbosityLog: passLog } =
        applyVerbosityControl(rawSections, { budget: verbosityBudget });
      // Collect selection metadata on the first pass only (every pass reads the
      // same events files, so the selection is identical). Recorded per civ and
      // through BOTH later stages: anonymization rewrites names and can change
      // length, and the verbosity budget can cut again. Only judgeViewLength is
      // what the judge actually read — reporting selectedLength alone would
      // overstate how much of a transcript reached the rubric.
      if (transcriptSelection === null) {
        transcriptSelection = {
          maxChars: 6000,
          verbosityBudget,
          perCiv: rawResults.map((r, i) => ({
            ...r.selection,
            regime: ordered[i].regime,
            postAnonymizationLength: rawSections[i].length,
            judgeViewLength: controlledSections[i].length,
            verbosityTruncated: controlledSections[i].length < rawSections[i].length,
          })),
        };
      }
      if (verbosityLog.length === 0) verbosityLog = passLog;
      const prompt = buildJudgePrompt(task, controlledSections.join("\n\n---\n\n"));
      const promptHash = hashShort(prompt);
      const auditFields = {
        kind: "judge_score",
        actor: "judge",
        parent_span_id: judgeSpanId,
        pass: passes.length,
        swapped: plan.swapped,
        order: ordered.map((c) => c.regime),
        ...(anon ? { anonymized: true } : {}),
        prompt_hash: promptHash,
      };
      let r;
      try {
        r = _runJudge(prompt, slot ? { providers: [slot] } : undefined);
      } catch (e) {
        failure = e;
        eventLog?.emit("judge", { ...auditFields, ...(slot ? { provider: slot } : {}), error: e.message });
        break; // this provider is dead — a swapped re-run would fail the same way
      }
      provider = provider ?? r.provider;
      slotWorked = true;
      rawPasses.push({ swapped: plan.swapped, order: auditFields.order, provider: r.provider, output: r.output });

      const perRegime = {};
      const json = parseJudgeJsonScores(r.output, judgeNames);
      if (json) {
        if (json.verdict && !verdict) verdict = anon ? anon.detransform(json.verdict) : json.verdict;
        for (const s of json.scores) {
          const real = anon ? anon.realFor.get(s.regime) ?? s.regime : s.regime;
          const meanDim = RUBRIC_DIMENSIONS.reduce((sum, d) => sum + s.dims[d], 0) / RUBRIC_DIMENSIONS.length;
          perRegime[real] = { score10: (meanDim / RUBRIC_SCALE) * 10, dims: s.dims };
        }
      } else {
        // Backward compatibility: a judge that still answers with a markdown
        // Rank|Civilization|Score/10 table is parsed with the legacy parser.
        for (const s of parseJudgeScores(r.output, judgeNames)) {
          const real = anon ? anon.realFor.get(s.regime) ?? s.regime : s.regime;
          perRegime[real] = { score10: s.score, ...(s.reason ? { reason: s.reason } : {}) };
        }
      }
      passes.push({ swapped: plan.swapped, provider: r.provider, order: auditFields.order, perRegime });
      eventLog?.emit("judge", { ...auditFields, provider: r.provider, model: r.provider });
    }

    if (slotWorked) {
      const used = passes[passes.length - 1]?.provider;
      if (used && !providers.includes(used)) providers.push(used);
    }
    if (judgesN <= 1) break; // single-judge mode: preserve original behavior
  }

  if (provider === null) {
    return {
      provider: null,
      providers: [],
      rawOutput: null,
      scores: [],
      swap,
      passes: 0,
      anonymized: !!anon,
      biasReport: null,
      md:
        `# Tournament Result — judge unavailable\n\n${failure?.message ?? "unknown error"}\n\n` +
        `Raw civ exit codes:\n${civResults.map((c) => `- ${c.regime} (${c.backend}): ${c.code}`).join("\n")}`,
    };
  }

  const scores = aggregateJudgePasses(passes, civRegimes);
  // Bias report — additive metadata; the scores above are unchanged. Surfacing
  // position effect, self-preference (same-family gap), per-provider spread, and
  // verbosity so a ranking's statistical basis can be audited.
  const biasReport = computeBiasReport({ passes, civRegimes, civBackends, verbosityLog });
  const lines = [
    `# Tournament — ${new Date().toISOString()}`,
    ``,
    `**Task:** ${task}`,
    `**Judge:** ${providers.length > 1 ? providers.join(" + ") : provider}`,
    `**Order swap:** ${swap ? `enabled (${passes.length} passes, scores averaged)` : "disabled (single pass)"}`,
    `**Rubric:** anchored 4-point scale per dimension (${RUBRIC_DIMENSIONS.join(", ")}), reported as score/10`,
    ...(anon ? [`**Civ anonymization:** enabled (judges saw Civ-A… labels only)`] : []),
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
    const who = providers.length > 1 ? ` [${p.provider}]` : "";
    lines.push(`## Pass ${i + 1}${p.swapped ? " (swapped order)" : ""}${who} — ${p.order.join(" → ")}`, ``, p.output, ``);
  });

  return {
    provider,
    providers,
    rawOutput: rawPasses.map((p) => p.output).join("\n\n"),
    scores,
    swap,
    passes: passes.length,
    anonymized: !!anon,
    biasReport,
    transcriptSelection,
    md: lines.join("\n"),
  };
}

export async function runTournament({
  civs,
  task,
  noSkill = false,
  taskSpec = null,
  detWeight = 0.5,
  id = null,
  judgesN = 1,
  anonCivs = false,
  enforceDispatch = false,
}) {
  if (!civs.length || !task) throw new Error("need --civs and a task");
  if (id != null && !TOURNAMENT_ID_RE.test(id)) throw new Error(`invalid tournament id: ${id}`);
  const parsed = civs.map(parseCiv);
  const useWorkDir = taskSpec?.type === "deterministic";

  id = id ?? newTournamentId();
  const outDir = path.join(TOURNAMENTS_DIR, id);
  fs.mkdirSync(outDir, { recursive: true });

  console.error(`[tournament] ${id}  civs=${parsed.map((c) => c.regime).join(",")}  out=${outDir}${noSkill ? "  (no-skill: A3 ablation)" : ""}${enforceDispatch ? "  (dispatch enforcement enabled)" : ""}${useWorkDir ? `  (T3 deterministic: ${taskSpec.id})` : ""}`);

  // Tournament-level trace: judge_score events live in their own event stream
  // keyed by the tournament id, so the whole evaluation is auditable.
  const trace = new EventLog(id);
  trace.emit("match_start", {
    task,
    actor: "system",
    civs: parsed.map((c) => c.regime),
    tournament: true,
    ...(noSkill ? { noSkill: true } : {}),
    ...(enforceDispatch ? { enforceDispatch: true } : {}),
    ...(useWorkDir ? { taskSpecId: taskSpec.id } : {}),
  });

  const results = await Promise.all(parsed.map((c) => runCiv(c, task, id, outDir, {
    noSkill,
    useWorkDir,
    enforceDispatch,
    // T3 requires real file writes; non-interactive sessions never see write
    // approvals, so deterministic tasks run with permissions bypassed (each
    // civ is still confined to its own isolated HOME + private workdir).
    permissionMode: useWorkDir ? (taskSpec.permissionMode ?? "bypassPermissions") : null,
  })));

  // Read the per-arm instrumentation before judging so a missing topology run
  // is visible during execution, not discovered only in post-hoc analysis.
  for (const result of results) {
    let meta = {};
    try {
      meta = JSON.parse(fs.readFileSync(metaPath(result.matchId), "utf8"));
    } catch {
      /* child may have failed before creating meta.json */
    }
    result.planDiff = meta.planDiff ?? null;
    result.dispatchPlan = meta.dispatchPlan ?? {
      status: "parse_failed",
      dispatches: null,
      error: "match did not record a dispatch plan",
    };
    result.dispatchEnforcement = meta.dispatchEnforcement ?? {
      status: enforceDispatch ? "enforcement_failed" : "not_requested",
      requiredOffices: [],
      dispatchedOffices: [],
      missingOffices: [],
      attempts: enforceDispatch ? 1 : 0,
      error: enforceDispatch ? "match did not record enforcement compliance" : undefined,
      basis: "declared_topology_nodes_with_incoming_edges",
    };
    result.topologyParticipation = meta.topologyParticipation ??
      classifyTopologyParticipation();
    result.aEligible =
      result.topologyParticipation.status === "participation_observed" &&
      result.dispatchEnforcement.status === "enforcement_passed";
    writeMeta(result.matchId, {
      dispatchPlan: result.dispatchPlan,
      ...(result.planDiff ? { planDiff: result.planDiff } : {}),
      dispatchEnforcement: result.dispatchEnforcement,
      topologyParticipation: result.topologyParticipation,
    });
    const participation = result.topologyParticipation;
    if (participation.status === "participation_observed") {
      console.error(
        `[tournament] ${result.regime}: office participation observed ` +
        `(dispatches=${participation.dispatchCount}, offices=${participation.officeCount})`,
      );
    } else {
      console.error(
        `[tournament] ⚠ ${result.regime}: office participation ${participation.status}; ` +
        `this arm is not eligible for enforced-topology analysis A`,
      );
    }
    if (enforceDispatch && result.dispatchEnforcement.status !== "enforcement_passed") {
      console.error(
        `[tournament] ⚠ ${result.regime}: ${result.dispatchEnforcement.status}; ` +
        `missing=${result.dispatchEnforcement.missingOffices.join(",") || "(unavailable)"}; no retry`,
      );
    }
  }

  const verdict = await judge(task, results, { eventLog: trace, judgesN, anonymize: anonCivs });

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
      dispatchPlan: r.dispatchPlan,
      // planDiff is D4's dependent variable in the E3 registration. It was
      // computed, written to the match meta, and then dropped here — so the
      // manifest, which is the artifact analysis reads, silently lacked the
      // one field the prediction names. Asserted in r11-instrumentation.
      ...(r.planDiff ? { planDiff: r.planDiff } : {}),
      dispatchEnforcement: r.dispatchEnforcement,
      topologyParticipation: r.topologyParticipation,
      aEligible: r.aEligible,
      ...(r.workDir ? { workDir: r.workDir } : {}),
    })),
    judge: {
      provider: verdict.provider,      // which provider judged (or null if unavailable)
      resultPath: resultFile,          // path to full markdown result
      scores,                          // [{regime, score, dims?, judge_score?, det_score?}] sorted desc
      topRegime,                       // winning regime or null
      swap: verdict.swap,              // whether the order-swapped second pass was enabled
      ...(verdict.providers?.length > 1 ? { providers: verdict.providers } : {}),
      ...(verdict.anonymized ? { anonymized: true } : {}),
      passes: verdict.passes,          // judge passes actually completed
      rubric: { scale: `1-${RUBRIC_SCALE}`, dimensions: RUBRIC_DIMENSIONS },
      events: trace.path,              // judge_score audit events (prompt_hash, swap flags)
      // The bias report is the whole point of the calibrated judge: per-provider
      // spread, same-family vs cross-family gap, and the position effect between
      // the two passes. judge() computed it and the manifest dropped it, so
      // every completed tournament recorded a ranking with no way to check
      // whether the gaps exceeded the judge's own noise. Persist it.
      ...(verdict.biasReport ? { biasReport: verdict.biasReport } : {}),
      // Transcript selection: records the strategy used to select transcript text
      // from the raw event stream, per-civ original/selected lengths, and whether
      // any portion was omitted. Follows the applyVerbosityControl precedent of
      // never silently truncating — the manifest truthfully reports what the judge saw.
      ...(verdict.transcriptSelection ? { transcriptSelection: verdict.transcriptSelection } : {}),
      ...(useWorkDir ? {
        taskSpecId: taskSpec.id,
        detWeight,
        deterministic: Object.fromEntries([...detResults.entries()].map(([r, d]) => [r, { passRate: d.passRate, error: d.error }])),
      } : {}),
    },
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  // Record to history SQLite DB for episodic memory RAG. The rubric judge
  // writes its closing paragraph under "## Verdict"; older judges used
  // "## Historian's Commentary" — capture either for the episodic record.
  const commentaryMatch = md.match(/##\s*(?:Verdict|Historian'?s Commentary)[^\n]*\n+([\s\S]+?)(?=\n## |$)/i);
  const commentary = commentaryMatch ? commentaryMatch[1].trim() : "";

  const resultsToRecord = manifest.civs.map((c) => {
    const s = scores.find((x) => x.regime === c.regime);
    return {
      matchId: c.matchId,
      regime: c.regime.split("/").pop(),
      score: s ? s.score : 0,
      reason: s?.reason ?? "",
      commentary,
    };
  });
  recordTournamentResult(id, manifest, resultsToRecord);

  // Close the learning loop's feedback gap: sedimentation ran inside each civ's
  // own match, before any score existed, so the skills it produced are
  // outcome-blind. Now that the judge has spoken, write the result back into
  // their frontmatter — skills learned from a losing run are the ones most
  // likely to transfer badly, and nothing downstream can weight or retire them
  // without knowing that. Best-effort: never fail the tournament over it.
  try {
    const stamped = stampTournamentOutcome({
      tournamentId: id,
      civs: manifest.civs,
      scores,
      regimesRoot: path.resolve(__dirname, "../../regimes"),
    });
    if (stamped.length > 0) {
      console.error(`[tournament] stamped outcome on ${stamped.length} sedimented skill(s)`);
    }
  } catch (e) {
    console.error(`[tournament] skill outcome stamping failed: ${e.message}`);
  }

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
  let id = null;
  let judgesN = 1;
  let anonCivs = false;
  let enforceDispatch = false;
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
    } else if (args[i] === "--id" && args[i + 1]) {
      // Pre-generated id, used by the write API so the HTTP response can name
      // the tournament before the background run finishes.
      id = args[++i];
    } else if (args[i] === "--judges" && args[i + 1] != null) {
      judgesN = Math.max(1, parseInt(args[++i], 10) || 1);
    } else if (args[i] === "--anon-civs") {
      anonCivs = true;
    } else if (args[i] === "--enforce-dispatch") {
      enforceDispatch = true;
    } else {
      rest.push(args[i]);
    }
  }
  let taskSpec = null;
  let task = rest.join(" ").trim();
  if (taskFile) {
    if (taskFile.endsWith(".json")) {
      taskSpec = loadTaskSpec(taskFile);
      task = taskSpec.task; // spec text is the source of truth for T3
    } else {
      // Plain-text scenario file (e.g. tasks/my-scenario.md): the file body
      // IS the task prompt; no deterministic grading involved.
      try {
        task = fs.readFileSync(taskFile, "utf8").trim();
      } catch (e) {
        console.error(`[tournament] cannot read --task-file ${taskFile}: ${e.message}`);
        process.exit(1);
      }
    }
  }
  runTournament({
    civs,
    task,
    noSkill,
    taskSpec,
    detWeight,
    id,
    judgesN,
    anonCivs,
    enforceDispatch,
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
